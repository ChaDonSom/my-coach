import React, { useEffect } from "react"
import { Container, Grid, Button, Alert, Typography } from "@mui/material"
import BlockNoteEditor from "./components/BlockNoteEditor"
import CoachChat from "./components/CoachChat"
import MobileCoachChat from "./components/MobileCoachChat"
import { createOpenAIClient, generateInitialQuestion } from "./services/openAIService"
import { useAppStore } from "./store/appStore"

const App: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)
  const [showPrompts, setShowPrompts] = React.useState(true)

  const {
    notes,
    currentNote,
    chat,
    links,
    searchQuery,
    searchResults,
    setOpenAI,
    setChat,
    handleNewNote,
    handleBlockSubmit,
    updateNoteBlocks,
    handleEnterPress,
    setCurrentNote,
    setSearchQuery,
    handleSearch,
  } = useAppStore()

  // Initialize OpenAI client
  useEffect(() => {
    const openai = createOpenAIClient()
    setOpenAI(openai)
  }, [setOpenAI])

  // Create default note if none exists
  useEffect(() => {
    if (notes.length === 0) {
      handleNewNote()
    }
  }, [notes.length, handleNewNote])

  // Generate initial AI question
  useEffect(() => {
    if (chat.length > 0) return

    const initQuestion = async () => {
      const openai = createOpenAIClient()
      const aiQuestion = await generateInitialQuestion(openai)
      setChat([{ sender: "AI", text: aiQuestion }])
    }

    initQuestion()
  }, [chat.length, setChat])

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
          {currentNote && (
            <BlockNoteEditor
              blocks={currentNote.blocks}
              onBlocksChange={updateNoteBlocks}
              onEnterPress={handleEnterPress}
              onBlockSubmit={handleBlockSubmit}
              currentPrompt={chat.length > 0 ? chat[chat.length - 1].text : ""}
            />
          )}
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
