export interface ChatMessage {
  sender: "AI" | "User"
  text: string
}

export interface CoachChatProps {
  chat: ChatMessage[]
  links: any[]
  notes: any[]
  searchQuery: string
  searchResults: any[]
  setSearchQuery: (query: string) => void
  handleSearch: () => void
  setCurrentNote: (note: any) => void
}

export interface MobileCoachChatProps extends CoachChatProps {
  mobileDrawerOpen: boolean
  setMobileDrawerOpen: (open: boolean) => void
}
