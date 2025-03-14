import { useState, useCallback } from "react"
import { Note, Block, ChatMessage } from "../types"
import aiResponseBlockSchema from "../components/aiResponseBlockSchema"
import OpenAI from "openai"
import { generateEmbedding, generateAIResponse } from "../services/openAIService"
import { cosineSimilarity } from "../utils/similarity"

type SetChatArgArg = ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])
type SetChatArg = (chat: SetChatArgArg) => void
export const useNotes = (openai: OpenAI, chat: ChatMessage[], setChat: SetChatArg) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])

  const handleNewNote = useCallback((): void => {
    const newNote: Note = {
      id: Date.now(),
      title: "New Note",
      blocks: [
        {
          id: Date.now(),
          content: "",
          prompt: chat.length > 0 ? chat[chat.length - 1].text : "",
          type: "user",
        },
      ],
    }
    setNotes([...notes, newNote])
    setCurrentNote(newNote)
  }, [chat, notes])

  const handleBlockSubmit = async (content: string): Promise<void> => {
    if (!content.trim()) return

    try {
      const embedding = await generateEmbedding(openai, content)

      // Update links
      const allBlocks = notes.flatMap((n) => n.blocks)
      const newLinks = allBlocks
        .filter((block) => block.embedding)
        .map((block) => ({
          fromId: block.id,
          toId: block.id,
          strength: cosineSimilarity(embedding.data[0].embedding, block.embedding!),
        }))
        .filter((link) => link.strength > 0.8)
      setLinks((prev) => [...prev, ...newLinks])

      // Add to chat and interactions
      setChat((prev) => [...prev, { sender: "User", text: content }])
      setInteractions((prev) => [
        ...prev,
        { id: Date.now(), timestamp: new Date().toISOString(), type: "response", content },
      ])

      // Get context for AI response
      const contextBlocks = allBlocks
        .filter((b) => b.embedding)
        .map((b) => ({
          block: b,
          similarity: cosineSimilarity(embedding.data[0].embedding, b.embedding!),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map((b) => b.block.content)

      const context = [...contextBlocks, ...interactions.slice(-3).map((i) => i.content)].join("\n")

      // Generate AI response
      const aiQuestion = await generateAIResponse(openai, content, context)
      setChat((prev) => [...prev, { sender: "AI", text: aiQuestion }])

      // Create AI block after the user's block
      if (currentNote) {
        const updatedBlocks = [...currentNote.blocks]
        const newAIBlock: Block = {
          id: Date.now(),
          content: aiQuestion,
          prompt: "",
          type: "ai",
          schema: aiResponseBlockSchema,
        }

        // Insert the AI block after the last block
        const lastBlockIndex = updatedBlocks.length - 1
        updatedBlocks.splice(lastBlockIndex + 1, 0, newAIBlock)

        const updatedNote = { ...currentNote, blocks: updatedBlocks }
        setNotes(notes.map((n) => (n.id === currentNote.id ? updatedNote : n)))
        setCurrentNote(updatedNote)
      }
    } catch (error) {
      console.error("Error processing block:", error)
      setChat((prev) => [...prev, { sender: "AI", text: "What happened next?" }])
    }
  }

  const updateNoteBlocks = (newBlocks: Block[]) => {
    if (currentNote) {
      const updatedNote = { ...currentNote, blocks: newBlocks }
      setNotes(notes.map((n) => (n.id === currentNote.id ? updatedNote : n)))
      setCurrentNote(updatedNote)
    }
  }

  const handleEnterPress = (blockId: number) => {
    const newBlock: Block = {
      id: Date.now(),
      content: "",
      prompt: chat.length > 0 ? chat[chat.length - 1].text : "",
      type: "user",
    }

    if (currentNote) {
      const blockIndex = currentNote.blocks.findIndex((b) => b.id === blockId)
      const updatedBlocks = [...currentNote.blocks]
      updatedBlocks.splice(blockIndex + 1, 0, newBlock)
      const updatedNote = { ...currentNote, blocks: updatedBlocks }
      setNotes(notes.map((n) => (n.id === currentNote.id ? updatedNote : n)))
      setCurrentNote(updatedNote)
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: "New Note",
        blocks: [newBlock],
      }
      setNotes([...notes, newNote])
      setCurrentNote(newNote)
    }
  }

  return {
    notes,
    currentNote,
    links,
    interactions,
    setCurrentNote,
    handleNewNote,
    handleBlockSubmit,
    updateNoteBlocks,
    handleEnterPress,
  }
}
