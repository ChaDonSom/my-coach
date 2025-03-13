import React, { useState, useRef, useEffect } from "react"
import { TextField, IconButton } from "@mui/material"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import { Block } from "../types"

interface BlockEditorProps {
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  onEnterPress: (blockId: number) => void
  onBlockSubmit: (blockContent: string) => void
  currentPrompt: string
}

const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  onEnterPress,
  onBlockSubmit,
  currentPrompt,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const draggedOverIndex = useRef<number | null>(null)

  const [focusedBlockId, setFocusedBlockId] = useState<number | null>(null)
  const blockRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({})

  useEffect(() => {
    // Focus the newly created block
    if (focusedBlockId && blockRefs.current[focusedBlockId]) {
      blockRefs.current[focusedBlockId]?.focus()
    }
  }, [focusedBlockId])

  // Handle content update for a specific block
  const handleContentChange = (blockId: number, newContent: string) => {
    const updatedBlocks = blocks.map((block) => (block.id === blockId ? { ...block, content: newContent } : block))
    onBlocksChange(updatedBlocks)
  }

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent, blockId: number, content: string) => {
    if (e.key === "Enter") {
      e.preventDefault() // Prevent default enter behavior

      // If there's content, submit it first
      if (content.trim()) {
        onBlockSubmit(content)
      }

      onEnterPress(blockId)
      // Focus will be set when the new block is created and rendered
      setFocusedBlockId(Date.now())
    }
  }

  const handleBlur = (content: string) => {
    if (content.trim()) {
      onBlockSubmit(content)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    draggedOverIndex.current = index
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedIndex === null || draggedOverIndex.current === null) return

    const newBlocks = Array.from(blocks)
    const [movedBlock] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(draggedOverIndex.current, 0, movedBlock)

    onBlocksChange(newBlocks)
    setDraggedIndex(null)
    draggedOverIndex.current = null
  }

  return (
    <div>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
            opacity: draggedIndex === index ? 0.5 : 1,
          }}
        >
          <IconButton
            size="small"
            sx={{
              cursor: "grab",
              marginRight: "8px",
              "&:active": { cursor: "grabbing" },
            }}
          >
            <DragIndicatorIcon />
          </IconButton>
          <TextField
            fullWidth
            value={block.content}
            onChange={(e) => handleContentChange(block.id, e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, block.id, block.content)}
            onBlur={() => handleBlur(block.content)}
            placeholder="Write here..."
            variant="outlined"
            inputRef={(el) => (blockRefs.current[block.id] = el)}
            inputProps={{
              style: {
                resize: "none",
                overflow: "hidden",
                minHeight: "1.5em",
                lineHeight: "1.5em",
              },
            }}
            sx={{
              "& .MuiInputBase-root": {
                padding: "8px 12px",
                lineHeight: "1.5em",
              },
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default BlockEditor
