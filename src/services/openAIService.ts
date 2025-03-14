import OpenAI from "openai"
import { cosineSimilarity } from "../utils/similarity"

export const createOpenAIClient = () => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY
  return new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
}

export const generateInitialQuestion = async (openai: OpenAI): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You're a curious writing coach. Generate an engaging opening question to start a conversation about the user's day or thoughts. Keep it casual and inviting.",
        },
        {
          role: "system",
          content: "Current time: " + new Date().toLocaleString(),
        },
      ],
      max_tokens: 50,
    })
    return response.choices[0]?.message?.content || "What caught your eye today?"
  } catch (error) {
    console.error("Error generating initial question:", error)
    return "What caught your eye today?"
  }
}

export const generateEmbedding = async (openai: OpenAI, content: string) => {
  return await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: content,
  })
}

export const generateAIResponse = async (openai: OpenAI, content: string, context: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You're a curious writing coach. Ask an engaging question based on this context, avoiding known details:\n" +
            context,
        },
        { role: "user", content },
      ],
      max_tokens: 50,
    })
    return response.choices[0]?.message?.content || "What happened next?"
  } catch (error) {
    console.error("Error generating AI response:", error)
    return "What happened next?"
  }
}

export const searchNotes = async (openai: OpenAI, searchQuery: string, notes: any[]) => {
  try {
    const queryEmbedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: searchQuery,
    })
    const queryVector = queryEmbedding.data[0].embedding

    return notes
      .map((note) => {
        const noteEmbedding =
          note.blocks
            .filter((b: any) => b.embedding)
            .map((b: any) => cosineSimilarity(b.embedding!, queryVector))
            .reduce((max: number, sim: number) => Math.max(max, sim), 0) || 0
        return { note, similarity: noteEmbedding }
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
  } catch (error) {
    console.error("Search error:", error)
    return []
  }
}
