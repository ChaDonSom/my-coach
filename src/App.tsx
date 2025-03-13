import React, { useState, useEffect, useCallback } from "react"
import { Container, Grid, Button, Alert, Typography } from "@mui/material"
import OpenAI from "openai"
import BlockNoteEditor from "./components/BlockNoteEditor"
import CoachChat from "./components/CoachChat"
import MobileCoachChat from "./components/MobileCoachChat"
import { Block, Note, ChatMessage, Link, Interaction } from "./types"

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magA * magB) || 0
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [showPrompts, setShowPrompts] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ note: Note; similarity: number }[]>([])

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY
  const openai = React.useMemo(() => new OpenAI({ apiKey, dangerouslyAllowBrowser: true }), [apiKey])

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

  // Create default note if none exists
  useEffect(() => {
    if (notes.length === 0) {
      handleNewNote()
    }
  }, [handleNewNote, notes.length]) // Add missing dependencies

  useEffect(() => {
    if (chat.length > 0) return

    const generateInitialQuestion = async () => {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You're a curious writing coach. Generate an engaging opening question to start a conversation about the user's day or thoughts. Keep it casual and inviting.",
            },
            {
              role: "system",
              content: "Current time: " + new Date().toLocaleString(),
            },
          ],
          max_tokens: 50,
        })
        const aiQuestion = response.choices[0]?.message?.content || "What caught your eye today?"
        setChat([{ sender: "AI", text: aiQuestion }])
      } catch (error) {
        console.error("Error generating initial question:", error)
        setChat([{ sender: "AI", text: "What caught your eye today?" }])
      }
    }

    generateInitialQuestion()
  }, [apiKey, openai, chat.length]) // Add missing dependency

  const handleBlockSubmit = async (content: string): Promise<void> => {
    if (!content.trim()) return

    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: content,
      })

      // Update all blocks in the current note with their embeddings
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
        .map((b) => ({ block: b, similarity: cosineSimilarity(embedding.data[0].embedding, b.embedding!) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map((b) => b.block.content)
      const context = [...contextBlocks, ...interactions.slice(-3).map((i) => i.content)].join("\n")

      // Generate AI response
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You're a curious writing coach. Ask an engaging question based on this context, avoiding known details:\n" +
              context,
          },
          { role: "user", content },
        ],
        max_tokens: 50,
      })
      const aiQuestion = response.choices[0]?.message?.content || "What happened next?"
      setChat((prev) => [...prev, { sender: "AI", text: aiQuestion }])

      // Create AI block after the user's block
      if (currentNote) {
        const updatedBlocks = [...currentNote.blocks]
        const newAIBlock: Block = {
          id: Date.now(),
          content: aiQuestion,
          prompt: "",
          type: "ai",
        }
        // Find the last block and insert the AI block after it
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

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }
    try {
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: searchQuery,
      })
      const queryVector = queryEmbedding.data[0].embedding
      const results = notes
        .map((note) => {
          const noteEmbedding =
            note.blocks
              .filter((b) => b.embedding)
              .map((b) => cosineSimilarity(b.embedding!, queryVector))
              .reduce((max, sim) => Math.max(max, sim), 0) || 0
          return { note, similarity: noteEmbedding }
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      setSearchResults([])
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Write one sentence today!
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6">Your Notes</Typography>
          <Button onClick={() => setShowPrompts(!showPrompts)} sx={{ mb: 1 }}>
            {showPrompts ? "Hide Prompts" : "Show Prompts"}
          </Button>
          <Button variant="outlined" onClick={handleNewNote} sx={{ mb: 1, ml: 1 }}>
            New Note
          </Button>
          <BlockNoteEditor
            blocks={currentNote?.blocks || []}
            onBlocksChange={(newBlocks: Block[]) => {
              if (currentNote) {
                const updatedNote = { ...currentNote, blocks: newBlocks }
                setNotes(notes.map((n) => (n.id === currentNote.id ? updatedNote : n)))
                setCurrentNote(updatedNote)
              }
            }}
            onEnterPress={(blockId: number) => {
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
            }}
            onBlockSubmit={handleBlockSubmit}
            currentPrompt={chat.length > 0 ? chat[chat.length - 1].text : ""}
          />
        </Grid>

        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }}>
          <CoachChat
            chat={chat}
            links={links}
            notes={notes}
            searchQuery={searchQuery}
            searchResults={searchResults}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            setCurrentNote={setCurrentNote}
          />
        </Grid>
      </Grid>

      <MobileCoachChat
        chat={chat}
        links={links}
        notes={notes}
        searchQuery={searchQuery}
        searchResults={searchResults}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        setCurrentNote={setCurrentNote}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />
      <Button
        variant="outlined"
        onClick={() => setMobileDrawerOpen(true)}
        sx={{ display: { xs: "block", md: "none" }, mt: 2 }}
      >
        Open Chat
      </Button>
    </Container>
  )
}

export default App
