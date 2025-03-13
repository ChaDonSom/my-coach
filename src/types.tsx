export interface Block {
  id: number
  content: string
  prompt: string
  embedding?: number[]
  type?: "user" | "ai"
  schema?: any // Add this line to allow schema property
}

export interface Note {
  id: number
  title: string
  blocks: Block[]
}

export interface ChatMessage {
  sender: "AI" | "User"
  text: string
}

export interface Link {
  fromId: number // Block ID
  toId: number // Block ID
  strength: number
}

export interface Interaction {
  id: number
  timestamp: string
  type: "response"
  content: string
}

export interface OpenAIResponse {
  choices: { message: { content: string } }[]
}

export interface CoachChatProps {
  chat: ChatMessage[]
  links: Link[]
  notes: Note[]
  searchQuery: string
  searchResults: { note: Note; similarity: number }[]
  setSearchQuery: (query: string) => void
  handleSearch: () => void
  setCurrentNote: (note: Note | null) => void
}

export interface MobileCoachChatProps {
  chat: ChatMessage[]
  links: Link[]
  notes: Note[]
  searchQuery: string
  searchResults: { note: Note; similarity: number }[]
  setSearchQuery: (query: string) => void
  handleSearch: () => void
  setCurrentNote: (note: Note | null) => void
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void
}
