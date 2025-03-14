import React, { useEffect, useState, useCallback, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"
import { Block } from "../types"
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import aiResponseBlockSchema from "./aiResponseBlockSchema"

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

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({ blocks, onBlocksChange, onEnterPress, onBlockSubmit }) => {
  const editor = useCreateBlockNote({ schema })
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const lastExternalUpdate = useRef<string>("")
  const isInternalUpdate = useRef(false)

  // Convert our app blocks to BlockNote blocks
  const convertToBlockNoteBlocks = useCallback(() => {
    if (!blocks || !Array.isArray(blocks)) {
      return []
    }

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

    // Only update if content actually changed and it wasn't our own update
    if (currentContent !== newContent && !isInternalUpdate.current) {
      lastExternalUpdate.current = newContent
      editor.replaceBlocks(editor.document, convertToBlockNoteBlocks())
    }
  }, [blocks, convertToBlockNoteBlocks, editor])

  // Handle editor content changes
  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      if (!editor.document) return

      // Skip if this update was triggered by our external update
      const currentContent = JSON.stringify(editor.document)
      if (currentContent === lastExternalUpdate.current) return
      if (isInternalUpdate.current) return

      isInternalUpdate.current = true
      const updatedBlocks = editor.document.map((block: any) => ({
        id: parseInt(block.id, 10),
        content: extractBlockContent(block),
        prompt: "",
        type: block.type === "ai-response" ? ("ai" as const) : ("user" as const),
      }))

      onBlocksChange(updatedBlocks)
      isInternalUpdate.current = false
    }

    // Add event listener for content changes
    const unsubscribe = editor.onChange(handleUpdate)
    return unsubscribe
  }, [editor, extractBlockContent, onBlocksChange])

  // Set up key handlers and typing detection
  useEffect(() => {
    if (!editor?.domElement) return

    const editorElement = editor.domElement

    // Handle typing with debounce
    const handleKeyUp = () => {
      if (typingTimeout) clearTimeout(typingTimeout)

      setTypingTimeout(
        setTimeout(async () => {
          if (!editor) return
          const content = await editor.blocksToMarkdownLossy(editor.document)
          if (content.trim()) {
            onBlockSubmit(content)
          }
        }, 3000)
      )
    }

    editorElement.addEventListener("keyup", handleKeyUp)

    return () => {
      if (editor?.domElement) {
        editor.domElement.removeEventListener("keyup", handleKeyUp)
      }
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [editor, onBlockSubmit, onEnterPress, typingTimeout])

  return <BlockNoteView editor={editor} />
}

export default BlockNoteEditor
