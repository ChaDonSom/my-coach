import React, { useState, useEffect } from "react"
import { Container, Grid, Button, Alert, Typography } from "@mui/material"
import BlockNoteEditor from "./components/BlockNoteEditor"
import CoachChat from "./components/CoachChat"
import MobileCoachChat from "./components/MobileCoachChat"
import { ChatMessage } from "./types"
import { createOpenAIClient, generateInitialQuestion } from "./services/openAIService"
import { useNotes } from "./hooks/useNotes"
import { useSearch } from "./hooks/useSearch"

const App: React.FC = () => {
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [showPrompts, setShowPrompts] = useState(true)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Initialize OpenAI client
  const openai = React.useMemo(() => createOpenAIClient(), [])

  // Custom hooks
  const {
    notes,
    currentNote,
    links,
    handleNewNote,
    handleBlockSubmit,
    updateNoteBlocks,
    handleEnterPress,
    setCurrentNote,
  } = useNotes(openai, chat, setChat)

  const { searchQuery, setSearchQuery, searchResults, handleSearch } = useSearch(openai, notes)

  // Create default note if none exists
  useEffect(() => {
    if (notes.length === 0) {
      handleNewNote()
    }
  }, [handleNewNote, notes.length])

  // Generate initial AI question
  useEffect(() => {
    if (chat.length > 0) return

    const initQuestion = async () => {
      const aiQuestion = await generateInitialQuestion(openai)
      setChat([{ sender: "AI", text: aiQuestion }])
    }

    initQuestion()
  }, [openai, chat.length])

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
            onBlocksChange={updateNoteBlocks}
            onEnterPress={handleEnterPress}
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
