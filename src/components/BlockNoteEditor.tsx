import React, { useEffect, useState, useCallback } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"
import { Block } from "../types"

interface BlockNoteEditorProps {
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  onEnterPress: (blockId: number) => void
  onBlockSubmit: (blockContent: string) => void
  currentPrompt: string
}

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({
  blocks,
  onBlocksChange,
  onEnterPress,
  onBlockSubmit,
  currentPrompt,
}) => {
  const editor = useCreateBlockNote()
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleUserStopTyping = useCallback(() => {
    const content = editor._tiptapEditor.getJSON()
    onBlockSubmit(JSON.stringify(content)) // Convert JSON to string
  }, [editor, onBlockSubmit])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const lastBlock = blocks[blocks.length - 1]
        onEnterPress(lastBlock.id)
        onBlockSubmit(lastBlock.content)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [blocks, onEnterPress, onBlockSubmit])

  useEffect(() => {
    const handleKeyUp = () => {
      if (typingTimeout) clearTimeout(typingTimeout)
      setTypingTimeout(setTimeout(handleUserStopTyping, 2000)) // 2 seconds debounce
    }

    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keyup", handleKeyUp)
      if (typingTimeout) clearTimeout(typingTimeout)
    }
  }, [handleUserStopTyping, typingTimeout])

  useEffect(() => {
    // Update editor content here if needed
  }, [blocks, editor])

  return <BlockNoteView editor={editor} />
}

export default BlockNoteEditor
