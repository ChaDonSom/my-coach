import React, { useEffect, useState, useCallback } from "react"
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
              content: block.content, // Keep content in props for backup
              backgroundColor: "",
              textColor: "",
              textAlignment: "left" as const,
            },
            content: block.content ? [{ type: "text" as const, text: block.content, styles: {} }] : [], // Content array is valid now with "inline" content type
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

  const [isEditorUpdating, setIsEditorUpdating] = useState(false) // New flag

  // Update editor content when blocks change
  useEffect(() => {
    if (!editor || isEditorUpdating) return // Skip if editor is updating itself
    setIsEditorUpdating(true) // Set flag before update
    try {
      const blockNoteBlocks = convertToBlockNoteBlocks()
      if (blockNoteBlocks.length > 0) {
        const currentBlocks = editor.document || []
        if (JSON.stringify(blockNoteBlocks) !== JSON.stringify(currentBlocks)) {
          editor.replaceBlocks(currentBlocks, blockNoteBlocks.filter(Boolean))
          setIsEditorUpdating(false) // Reset flag after update
        }
      }
    } catch (e) {
      console.error("Error updating editor blocks:", e)
      setIsEditorUpdating(false)
    }
  }, [blocks, convertToBlockNoteBlocks, editor, isEditorUpdating])

  // Handle editor content changes
  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const editorBlocks = editor.document
      if (!editorBlocks || !Array.isArray(editorBlocks) || !blocks || !Array.isArray(blocks)) {
        return // Prevent issues with null/undefined values
      }

      const updatedBlocks = blocks.map((block, index) => {
        if (!block) return block // Skip null blocks

        const editorBlock =
          editorBlocks.find((b) => b && b.id === String(block.id)) ||
          (index < editorBlocks.length ? editorBlocks[index] : null)

        if (!editorBlock) return block

        return {
          ...block,
          content: extractBlockContent(editorBlock),
          type: editorBlock.type === "ai-response" ? "ai" : "user",
        } as Block // Ensure type safety with explicit cast
      })

      const areBlocksEqual =
        updatedBlocks.length === blocks.length &&
        updatedBlocks.every((block, index) => {
          const oldBlock = blocks[index]
          return block?.id === oldBlock?.id && block?.content === oldBlock?.content && block?.type === oldBlock?.type
        })

      if (!areBlocksEqual) {
        onBlocksChange(updatedBlocks)
      }
    }

    // Add event listener for content changes
    editor.onChange(handleUpdate)

    return () => {
      // Cleanup handled by BlockNote internally
    }
  }, [blocks, editor, extractBlockContent, onBlocksChange])

  // Set up key handlers and typing detection
  useEffect(() => {
    if (!editor?.domElement) return

    const editorElement = editor.domElement

    // Handle Enter key press
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        const selection = editor.getSelection()
        if (!selection || !selection.blocks || selection.blocks.length === 0) return

        const blockId = selection.blocks[0]?.id
        if (!blockId) return

        const numId = parseInt(blockId, 10)
        if (isNaN(numId)) return

        event.preventDefault()
        onEnterPress(numId)
      }
    }

    // Handle typing with debounce
    const handleKeyUp = () => {
      if (typingTimeout) clearTimeout(typingTimeout)

      setTypingTimeout(
        setTimeout(async () => {
          if (!editor) return
          console.log("Typing detected")

          const textCursorPosition = editor.getTextCursorPosition()
          console.log("selection :", textCursorPosition)
          if (!textCursorPosition || !textCursorPosition.block) return

          const blockId = textCursorPosition.block?.id
          if (!blockId) return

          const block = editor.getBlock(blockId)
          console.log("block :", block)
          if (!block) return

          const content = await editor.blocksToMarkdownLossy(editor.document)
          onBlockSubmit(content)
        }, 2000)
      )
    }

    editorElement.addEventListener("keydown", handleKeyDown)
    editorElement.addEventListener("keyup", handleKeyUp)

    return () => {
      if (editor?.domElement) {
        editor.domElement.removeEventListener("keydown", handleKeyDown)
        editor.domElement.removeEventListener("keyup", handleKeyUp)
      }
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [editor, extractBlockContent, onBlockSubmit, onEnterPress, typingTimeout])

  return <BlockNoteView editor={editor} />
}

export default BlockNoteEditor
