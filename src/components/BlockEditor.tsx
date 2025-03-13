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
  const [isHovered, setIsHovered] = useState(false)

  const blockRefs = useRef<{ [key: number]: HTMLTextAreaElement | null }>({})

  // Auto-focus new block when added.
  const prevBlocksLength = useRef(blocks.length)
  useEffect(() => {
    if (prevBlocksLength.current > 0 && blocks.length > prevBlocksLength.current) {
      // New block added: focus the newly added block after a brief delay
      const newBlockId = blocks[blocks.length - 1].id
      setTimeout(() => {
        blockRefs.current[newBlockId]?.focus()
      }, 150)
    }
    prevBlocksLength.current = blocks.length
  }, [blocks])

  // Handle content update for a specific block
  const handleContentChange = (blockId: number, newContent: string) => {
    const updatedBlocks = blocks.map((block) => (block.id === blockId ? { ...block, content: newContent } : block))
    onBlocksChange(updatedBlocks)
  }

  // Handle key press events
  const handleKeyPress = (e: React.KeyboardEvent, blockId: number, content: string) => {
    if (e.key === "Enter") {
      e.preventDefault() // Prevent default enter behavior

      // Submit content first
      if (content.trim()) {
        onBlockSubmit(content)
      }

      onEnterPress(blockId)
    }
  }

  const handleBlur = (content: string) => {
    // Placeholder for future blur handling if needed
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
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <IconButton
            size="small"
            sx={{
              cursor: "grab",
              marginRight: "8px",
              "&:active": { cursor: "grabbing" },
              transition: "opacity 100ms ease-in-out",
              opacity: isHovered ? 1 : 0,
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
            multiline
            minRows={1}
            maxRows={Infinity}
            inputProps={{
              style: {
                resize: "none",
                minHeight: "1.5em",
                lineHeight: "1.5em",
                overflowX: "hidden",
                wordWrap: "break-word",
                ...(block.type === "ai" && {
                  fontSize: "0.95em",
                  fontStyle: "italic",
                  color: "rgba(0, 0, 0, 0.8)", // Slightly lighter than default black
                }),
              },
            }}
            sx={{
              "& .MuiInputBase-root": {
                padding: "8px 12px",
                lineHeight: "1.5em",
                outline: "none !important",
                border: "none",
                borderRadius: "12px",
                transition: "background-color 100ms ease-in-out",
              },
              "& .MuiInputBase-root:hover": {
                backgroundColor: "#fafafa", // Slightly gray, almost white
                color: "#000",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
        </div>
      ))}
    </div>
  )
}

export default BlockEditor
