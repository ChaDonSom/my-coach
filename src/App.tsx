import React, { useEffect, useRef } from "react"
import { Container, Grid, Alert, Typography } from "@mui/material"
import BlockNoteEditor from "./components/BlockNoteEditor"
import CoachChat from "./components/CoachChat"
import MobileCoachChat from "./components/MobileCoachChat"
import { createOpenAIClient, generateInitialQuestion, generateAIResponse } from "./services/openAIService"
import { useAppStore } from "./store/appStore"

const App: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false)
  const { chat, setOpenAI, setChat } = useAppStore()

  // Initialize OpenAI client
  useEffect(() => {
    const openai = createOpenAIClient()
    setOpenAI(openai)
  }, [setOpenAI])

  // Generate initial AI question
  const startedAinitialQuestion = useRef(false)
  useEffect(() => {
    ;(async () => {
      if (chat.length > 0 || startedAinitialQuestion.current) return
      startedAinitialQuestion.current = true

      const initQuestion = async () => {
        const openai = createOpenAIClient()
        const aiQuestion = await generateInitialQuestion(openai)
        setChat([{ sender: "AI", text: aiQuestion }])
      }

      await initQuestion()
    })()
  }, [chat.length, setChat, startedAinitialQuestion])

  const handleBlockSubmit = async (content: string) => {
    if (!content.trim()) return ""

    const openai = createOpenAIClient()
    setChat([...chat, { sender: "User", text: content }])

    // Generate AI response
    const aiQuestion = await generateAIResponse(openai, content, "")
    setChat((prev) => [...prev, { sender: "AI", text: aiQuestion }])

    return aiQuestion
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Alert severity="info" sx={{ mb: 2 }}>
        Write one sentence today!
      </Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Typography variant="h6">Your Notes</Typography>
          <BlockNoteEditor onBlockSubmit={handleBlockSubmit} />
        </Grid>

        <Grid item md={4} sx={{ display: { xs: "none", md: "block" } }}>
          <CoachChat
            chat={chat}
            links={[]}
            notes={[]}
            searchQuery=""
            searchResults={[]}
            setSearchQuery={() => {}}
            handleSearch={() => {}}
            setCurrentNote={() => {}}
          />
        </Grid>
      </Grid>

      <MobileCoachChat
        chat={chat}
        links={[]}
        notes={[]}
        searchQuery=""
        searchResults={[]}
        setSearchQuery={() => {}}
        handleSearch={() => {}}
        setCurrentNote={() => {}}
        mobileDrawerOpen={mobileDrawerOpen}
        setMobileDrawerOpen={setMobileDrawerOpen}
      />
    </Container>
  )
}

export default App
