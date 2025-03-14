import React, { useEffect, useCallback, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"
import { Block } from "../types"
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import aiResponseBlockSchema from "./aiResponseBlockSchema"
import { debounce } from "lodash"

interface BlockNoteEditorProps {
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  onEnterPress: (blockId: number) => void
  onBlockSubmit: (blockContent: string) => void
  currentPrompt: string
}

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    "ai-response": aiResponseBlockSchema,
  },
})

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({ 
  blocks, 
  onBlocksChange, 
  onEnterPress, 
  onBlockSubmit 
}) => {
  const editor = useCreateBlockNote({ schema })
  const isInternalUpdate = useRef(false)
  const lastExternalUpdate = useRef<string>("")

  // Convert app blocks to BlockNote blocks
  const convertToBlockNoteBlocks = useCallback(() => {
    if (!blocks || !Array.isArray(blocks)) return []

    return blocks
      .map((block) => {
        if (!block) return null

        if (block.type === "ai") {
          return {
            id: String(block.id),
            type: "ai-response" as const,
            props: {
              content: block.content,
              backgroundColor: "",
              textColor: "",
              textAlignment: "left" as const,
            },
            content: block.content ? [{ type: "text" as const, text: block.content, styles: {} }] : [],
            children: [],
          }
        }

        return {
          id: String(block.id),
          type: "paragraph" as const,
          props: { backgroundColor: "", textColor: "", textAlignment: "left" as const },
          content: block.content ? [{ type: "text" as const, text: block.content, styles: {} }] : [],
          children: [],
        }
      })
      .filter((block): block is NonNullable<typeof block> => block !== null)
  }, [blocks])

  // Extract text content from BlockNote blocks
  const extractBlockContent = useCallback((block: any): string => {
    if (!block) return ""

    if (block.type === "ai-response") {
      return block.props?.content || ""
    } else if (Array.isArray(block.content)) {
      return block.content
        .filter((item: any) => item?.type === "text")
        .map((item: any) => item?.text || "")
        .join("")
    }

    return ""
  }, [])

  // Update editor content when blocks change externally
  useEffect(() => {
    if (!editor || !blocks) return

    const currentContent = JSON.stringify(editor.document)
    const newContent = JSON.stringify(convertToBlockNoteBlocks())

    if (currentContent !== newContent && !isInternalUpdate.current) {
      lastExternalUpdate.current = newContent
      editor.replaceBlocks(editor.document, convertToBlockNoteBlocks())
    }
  }, [blocks, convertToBlockNoteBlocks, editor])

  // Debounced update handler with proper cleanup
  const debouncedUpdate = useCallback(
    debounce((newDocument: any) => {
      if (isInternalUpdate.current) return

      isInternalUpdate.current = true
      const updatedBlocks = newDocument.map((block: any) => ({
        id: parseInt(block.id, 10),
        content: extractBlockContent(block),
        prompt: "",
        type: block.type === "ai-response" ? ("ai" as const) : ("user" as const),
        schema:
          block.type === "ai-response"
            ? { ...aiResponseBlockSchema, props: { content: extractBlockContent(block) } }
            : undefined,
      }))

      onBlocksChange(updatedBlocks)
      isInternalUpdate.current = false
    }, 100),
    [extractBlockContent, onBlocksChange]
  )

  // Handle editor content changes
  useEffect(() => {
    if (!editor) return

    const unsubscribe = editor.onChange(() => {
      debouncedUpdate(editor.document)
    })

    return () => {
      debouncedUpdate.cancel()
      unsubscribe?.()
    }
  }, [editor, debouncedUpdate])

  // Handle block submission with debouncing
  const debouncedSubmit = useCallback(
    debounce((content: string) => {
      if (content.trim()) {
        onBlockSubmit(content)
      }
    }, 3000),
    [onBlockSubmit]
  )

  // Set up content change handler for AI responses
  useEffect(() => {
    if (!editor) return

    const handleContentChange = () => {
      const content = editor.document
        .map((block) => extractBlockContent(block))
        .join("\n")
        .trim()

      if (content) {
        debouncedSubmit(content)
      }
    }

    const unsubscribe = editor.onChange(handleContentChange)
    return () => {
      debouncedSubmit.cancel()
      unsubscribe?.()
    }
  }, [editor, extractBlockContent, debouncedSubmit])

  return <BlockNoteView editor={editor} />
}

export default React.memo(BlockNoteEditor)
