import { create } from "zustand"
import { ChatMessage } from "../types"
import OpenAI from "openai"

interface AppState {
  chat: ChatMessage[]
  openai: OpenAI | null

  setOpenAI: (openai: OpenAI) => void
  setChat: (chatOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void
}

export const useAppStore = create<AppState>((set) => ({
  chat: [],
  openai: null,

  setOpenAI: (openai) => set({ openai }),
  setChat: (chatOrUpdater) =>
    set((state) => ({
      chat: typeof chatOrUpdater === "function" ? chatOrUpdater(state.chat) : chatOrUpdater,
    })),
}))
