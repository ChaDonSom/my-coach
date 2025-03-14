import { create } from 'zustand';
import { Block, Note, ChatMessage, Link } from '../types';
import { generateAIResponse, generateEmbedding } from '../services/openAIService';
import { cosineSimilarity } from '../utils/similarity';
import OpenAI from 'openai';

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  chat: ChatMessage[];
  links: Link[];
  searchQuery: string;
  searchResults: { note: Note; similarity: number }[];
  openai: OpenAI | null;

  setOpenAI: (openai: OpenAI) => void;
  setNotes: (notes: Note[]) => void;
  setCurrentNote: (note: Note | null) => void;
  setChat: (chatOrUpdater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setLinks: (linksOrUpdater: Link[] | ((prev: Link[]) => Link[])) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: { note: Note; similarity: number }[]) => void;

  handleNewNote: () => void;
  handleBlockSubmit: (content: string) => Promise<void>;
  updateNoteBlocks: (blocks: Block[]) => void;
  handleEnterPress: (blockId: number) => void;
  handleSearch: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  notes: [],
  currentNote: null,
  chat: [],
  links: [],
  searchQuery: "",
  searchResults: [],
  openai: null,

  setOpenAI: (openai) => set({ openai }),
  setNotes: (notes) => set({ notes }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setChat: (chatOrUpdater) => set((state) => ({
    chat: typeof chatOrUpdater === 'function' ? chatOrUpdater(state.chat) : chatOrUpdater
  })),
  setLinks: (linksOrUpdater) => set((state) => ({
    links: typeof linksOrUpdater === 'function' ? linksOrUpdater(state.links) : linksOrUpdater
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),

  handleNewNote: () => {
    const { chat, notes, setNotes, setCurrentNote } = get();
    const newNote: Note = {
      id: Date.now(),
      title: "New Note",
      blocks: [{
        id: Date.now(),
        content: "",
        prompt: chat.length > 0 ? chat[chat.length - 1].text : "",
        type: "user"
      }]
    };
    setNotes([...notes, newNote]);
    setCurrentNote(newNote);
  },

  handleBlockSubmit: async (content: string) => {
    const { openai, notes, currentNote, chat, setChat, setLinks, setNotes, setCurrentNote } = get();
    if (!content.trim() || !openai || !currentNote) return;

    try {
      const embedding = await generateEmbedding(openai, content);

      // Update links
      const allBlocks = notes.flatMap(n => n.blocks);
      const newLinks = allBlocks
        .filter(block => block.embedding)
        .map(block => ({
          fromId: block.id,
          toId: block.id,
          strength: cosineSimilarity(embedding.data[0].embedding, block.embedding!)
        }))
        .filter(link => link.strength > 0.8);
      
      setLinks((prev: Link[]) => [...prev, ...newLinks]);

      // Add to chat
      setChat([...chat, { sender: "User", text: content }]);

      // Get context for AI response
      const contextBlocks = allBlocks
        .filter(b => b.embedding)
        .map(b => ({
          block: b,
          similarity: cosineSimilarity(embedding.data[0].embedding, b.embedding!)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .map(b => b.block.content);

      const context = contextBlocks.join("\n");

      // Generate AI response
      const aiResponse = await generateAIResponse(openai, content, context);
      setChat((prev: ChatMessage[]) => [...prev, { sender: "AI", text: aiResponse }]);

      // Create AI block
      const newAIBlock: Block = {
        id: Date.now(),
        content: aiResponse,
        prompt: "",
        type: "ai"
      };

      const updatedBlocks = [...currentNote.blocks, newAIBlock];
      const updatedNote = { ...currentNote, blocks: updatedBlocks };
      setNotes(notes.map(n => n.id === currentNote.id ? updatedNote : n));
      setCurrentNote(updatedNote);

    } catch (error) {
      console.error("Error processing block:", error);
      setChat((prev: ChatMessage[]) => [...prev, { sender: "AI", text: "What happened next?" }]);
    }
  },

  updateNoteBlocks: (newBlocks) => {
    const { currentNote, notes, setNotes, setCurrentNote } = get();
    if (!currentNote) return;

    const updatedNote = { ...currentNote, blocks: newBlocks };
    setNotes(notes.map(n => n.id === currentNote.id ? updatedNote : n));
    setCurrentNote(updatedNote);
  },

  handleEnterPress: (blockId) => {
    const { chat, currentNote, notes, setNotes, setCurrentNote } = get();
    const newBlock: Block = {
      id: Date.now(),
      content: "",
      prompt: chat.length > 0 ? chat[chat.length - 1].text : "",
      type: "user"
    };

    if (currentNote) {
      const blockIndex = currentNote.blocks.findIndex(b => b.id === blockId);
      const updatedBlocks = [...currentNote.blocks];
      updatedBlocks.splice(blockIndex + 1, 0, newBlock);
      const updatedNote = { ...currentNote, blocks: updatedBlocks };
      setNotes(notes.map(n => n.id === currentNote.id ? updatedNote : n));
      setCurrentNote(updatedNote);
    } else {
      const newNote: Note = {
        id: Date.now(),
        title: "New Note",
        blocks: [newBlock]
      };
      setNotes([...notes, newNote]);
      setCurrentNote(newNote);
    }
  },

  handleSearch: async () => {
    const { openai, notes, searchQuery, setSearchResults } = get();
    if (!searchQuery.trim() || !openai) {
      setSearchResults([]);
      return;
    }

    try {
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: searchQuery
      });

      const queryVector = queryEmbedding.data[0].embedding;
      const results = notes
        .map(note => {
          const noteEmbedding = note.blocks
            .filter(b => b.embedding)
            .map(b => cosineSimilarity(b.embedding!, queryVector))
            .reduce((max, sim) => Math.max(max, sim), 0) || 0;
          return { note, similarity: noteEmbedding };
        })
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  }
}));