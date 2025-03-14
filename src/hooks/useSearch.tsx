import { useState } from "react"
import { Note } from "../types"
import OpenAI from "openai"
import { searchNotes } from "../services/openAIService"

export const useSearch = (openai: OpenAI, notes: Note[]) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<{ note: Note; similarity: number }[]>([])

  const handleSearch = async (): Promise<void> => {
    if (!searchQuery) {
      setSearchResults([])
      return
    }

    const results = await searchNotes(openai, searchQuery, notes)
    setSearchResults(results)
  }

  return { searchQuery, setSearchQuery, searchResults, handleSearch }
}
