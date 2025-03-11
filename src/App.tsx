// App.tsx
import React, { useState } from "react"
import {
  Container,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import axios from "axios"
import OpenAI from "openai"

interface Block {
  id: number
  content: string
  prompt: string
}

interface Note {
  id: number
  title: string
  blocks: Block[]
  embedding?: number[] // Added for semantic search
}

interface ChatMessage {
  sender: "AI" | "User"
  text: string
}

interface SimilarThing {
  text: string
  noteId: number
}

interface OpenAIResponse {
  choices: { message: { content: string } }[]
}

// Cosine similarity function for vector comparison
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magA * magB) || 0 // Handle division by zero
}

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [chat, setChat] = useState<ChatMessage[]>([{ sender: "AI", text: "What caught your eye today?" }])
  const [similarThings, setSimilarThings] = useState<SimilarThing[]>([])
  const [input, setInput] = useState("")
  const [showPrompts, setShowPrompts] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ note: Note; similarity: number }[]>([])

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) // Browser flag for prototype

  const handleSend = async (): Promise<void> => {
    if (!input) return
    const newBlock: Block = { id: Date.now(), content: input, prompt: chat[chat.length - 1].text }
    const newNote: Note = currentNote
      ? { ...currentNote, blocks: [...currentNote.blocks, newBlock] }
      : { id: Date.now(), title: input.slice(0, 20) + "...", blocks: [newBlock] }

    // Embed the new note
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: newNote.blocks.map((b) => b.content).join(" "),
      })
      newNote.embedding = embedding.data[0].embedding
    } catch (error) {
      console.error("Embedding error:", error)
    }

    setNotes(currentNote ? notes.map((n) => (n.id === currentNote.id ? newNote : n)) : [...notes, newNote])
    setCurrentNote(newNote)
    setChat([...chat, { sender: "User", text: input }])
    setSimilarThings([...similarThings, { text: `Related to: ${input.split(" ")[0]}`, noteId: newNote.id }])

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "You're a curious writing coach. Ask an engaging question based on this context, avoiding known details.",
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
        .filter((note) => note.embedding) // Only notes with embeddings
        .map((note) => ({
          note,
          similarity: cosineSimilarity(note.embedding!, queryVector),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5) // Top 5 results
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
          <TextField
            fullWidth
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
            placeholder="Search your notes..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          {searchResults.length > 0 && (
            <List sx={{ mb: 2 }}>
              {searchResults.map((result) => (
                <ListItem key={result.note.id} component="button" onClick={() => setCurrentNote(result.note)}>
                  <ListItemText
                    primary={result.note.title}
                    secondary={`Similarity: ${(result.similarity * 100).toFixed(1)}%`}
                  />
                </ListItem>
              ))}
            </List>
          )}
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
          <div style={{ height: "60vh", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
            {notes.map((note) => (
              <Accordion key={note.id} onChange={() => setCurrentNote(note)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{note.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {note.blocks.map((block) => (
                    <Typography key={block.id}>
                      {showPrompts ? `${block.prompt} → ${block.content}` : block.content}
                    </Typography>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </div>
        </Grid>

        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }}>
          <Typography variant="h6">Coach Chat & Suggestions</Typography>
          <div style={{ height: "70vh", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
            {chat.map((msg, idx) => (
              <Card key={idx} sx={{ mb: 1, bgcolor: msg.sender === "AI" ? "#f5f5f5" : "#e3f2fd" }}>
                <CardContent>
                  <Typography>
                    {msg.sender}: {msg.text}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {similarThings.map((item, idx) => (
              <Typography
                key={idx}
                sx={{ mt: 1, color: "#1976d2", cursor: "pointer" }}
                onClick={() => alert("Link clicked")}
              >
                {item.text}
              </Typography>
            ))}
          </div>
        </Grid>
      </Grid>

      <Drawer
        anchor="bottom"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { height: "50vh", padding: "10px" } }}
      >
        <Typography variant="h6">Coach Chat & Suggestions</Typography>
        <div style={{ height: "40vh", overflowY: "auto" }}>
          {chat.map((msg, idx) => (
            <Card key={idx} sx={{ mb: 1, bgcolor: msg.sender === "AI" ? "#f5f5f5" : "#e3f2fd" }}>
              <CardContent>
                <Typography>
                  {msg.sender}: {msg.text}
                </Typography>
              </CardContent>
            </Card>
          ))}
          {similarThings.map((item, idx) => (
            <Typography
              key={idx}
              sx={{ mt: 1, color: "#1976d2", cursor: "pointer" }}
              onClick={() => alert("Link clicked")}
            >
              {item.text}
            </Typography>
          ))}
        </div>
      </Drawer>
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
