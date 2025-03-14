import React, { useCallback, useRef } from "react"
import { useCreateBlockNote } from "@blocknote/react"
import { BlockNoteView } from "@blocknote/mantine"
import "@blocknote/core/style.css"
import "@blocknote/mantine/style.css"
import "@blocknote/core/fonts/inter.css"
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core"
import aiResponseBlockSchema from "./aiResponseBlockSchema"
import { debounce } from "lodash"

interface BlockNoteEditorProps {
  onBlockSubmit: (blockContent: string) => Promise<string>
}

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    "ai-response": aiResponseBlockSchema,
  },
})

const BlockNoteEditor: React.FC<BlockNoteEditorProps> = ({ onBlockSubmit }) => {
  const editor = useCreateBlockNote({ schema })
  const debouncedFn = useRef<ReturnType<typeof debounce> | null>(null)

  // Handle block submission with debouncing
  const handleSubmit = useCallback(
    (content: string) => {
      if (!editor || !content.trim()) return

      onBlockSubmit(content).then(() => {
        // Insert AI response block after current block
        const blockId = editor.getTextCursorPosition().block.id
        editor.insertBlocks(
          [
            {
              type: "ai-response" as const,
              props: {},
            },
          ],
          blockId
        )

        // Move cursor to new block after AI response
        editor.insertBlocks(
          [
            {
              type: "paragraph" as const,
              props: {},
            },
          ],
          editor.getTextCursorPosition().block.id
        )
      })
    },
    [editor, onBlockSubmit]
  )

  // Create debounced function
  React.useEffect(() => {
    debouncedFn.current = debounce(handleSubmit, 3000)
    return () => debouncedFn.current?.cancel()
  }, [handleSubmit])

  // Handle editor content changes
  React.useEffect(() => {
    if (!editor) return

    const handleContentChange = () => {
      const currentBlock = editor.getTextCursorPosition().block
      if (currentBlock.type !== "ai-response") {
        const blockContent = editor.getBlock(currentBlock.id)?.content
        if (Array.isArray(blockContent) && blockContent.length > 0) {
          const firstContent = blockContent[0] as { type: "text"; text: string }
          if (firstContent.type === "text" && debouncedFn.current) {
            debouncedFn.current(firstContent.text)
          }
        }
      }
    }

    const unsubscribe = editor.onChange(handleContentChange)
    return unsubscribe
  }, [editor, debouncedFn])

  return <BlockNoteView editor={editor} />
}

export default React.memo(BlockNoteEditor)
