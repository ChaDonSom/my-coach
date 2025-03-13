import React, { useState, useEffect } from "react"
import {
  Container,
  Grid,
  TextField,
  Button,
  Alert,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import axios from "axios"
import OpenAI from "openai"
import NoteList from "./components/NoteList"
import CoachChat from "./components/CoachChat"
import MobileCoachChat from "./components/MobileCoachChat"
import { Block, Note, ChatMessage, Link, Interaction, OpenAIResponse } from "./types"

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
  const [input, setInput] = useState("")
  const [showPrompts, setShowPrompts] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ note: Note; similarity: number }[]>([])

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY

  useEffect(() => {
    const generateInitialQuestion = async () => {
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You're a curious writing coach. Generate an engaging opening question to start a conversation about the user's day or thoughts. Keep it casual and inviting.",
              },
            ],
            max_tokens: 50,
          },
          { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
        )
        const aiQuestion = (response.data as OpenAIResponse).choices[0].message.content
        setChat([{ sender: "AI", text: aiQuestion }])
      } catch (error) {
        console.error("Error generating initial question:", error)
        setChat([{ sender: "AI", text: "What caught your eye today?" }])
      }
    }

    generateInitialQuestion()
  }, [apiKey])
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true })

  const handleSend = async (): Promise<void> => {
    if (!input) return
    const newBlock: Block = { id: Date.now(), content: input, prompt: chat[chat.length - 1].text }
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: newBlock.content,
      })
      newBlock.embedding = embedding.data[0].embedding

      // Suggest links at Block level
      const allBlocks = notes.flatMap((n) => n.blocks)
      const newLinks = allBlocks
        .filter((block) => block.embedding && block.id !== newBlock.id)
        .map((block) => ({
          fromId: newBlock.id,
          toId: block.id,
          strength: cosineSimilarity(newBlock.embedding!, block.embedding!),
        }))
        .filter((link) => link.strength > 0.8)
      setLinks((prev) => [...prev, ...newLinks])
    } catch (error) {
      console.error("Embedding error:", error)
    }

    const newNote: Note = currentNote
      ? { ...currentNote, blocks: [...currentNote.blocks, newBlock] }
      : { id: Date.now(), title: input.slice(0, 20) + "...", blocks: [newBlock] }

    setNotes(currentNote ? notes.map((n) => (n.id === currentNote.id ? newNote : n)) : [...notes, newNote])
    setCurrentNote(newNote)
    setChat([...chat, { sender: "User", text: input }])
    setInteractions((prev) => [
      ...prev,
      { id: Date.now(), timestamp: new Date().toISOString(), type: "response", content: input },
    ])

    // Context-aware AI question
    const allBlocks = notes.flatMap((n) => n.blocks)
    const contextBlocks = allBlocks
      .filter((b) => b.embedding)
      .map((b) => ({ block: b, similarity: cosineSimilarity(b.embedding!, newBlock.embedding!) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3) // Top 3 similar blocks
      .map((b) => b.block.content)
    const context = [...contextBlocks, ...interactions.slice(-3).map((i) => i.content)].join("\\n")

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You're a curious writing coach. Ask an engaging question based on this context, avoiding known details:\\n" +
                context,
            },
            { role: "user", content: input },
          ],
          max_tokens: 50,
        },
        { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
      )
      const aiQuestion = (response.data as OpenAIResponse).choices[0].message.content
      setChat((prev) => [...prev, { sender: "AI", text: aiQuestion }])
    } catch (error) {
      console.error(error)
      setChat((prev) => [...prev, { sender: "AI", text: "What happened next?" }])
    }
    setInput("")
  }

  const handleNewNote = (): void => {
    setCurrentNote(null)
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
          <TextField
            fullWidth
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
            placeholder="Write a new block..."
            variant="outlined"
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          <Button variant="contained" onClick={handleSend} sx={{ mb: 2 }}>
            Add
          </Button>
          <NoteList notes={notes} showPrompts={showPrompts} setCurrentNote={setCurrentNote} />
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
