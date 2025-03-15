import React, { useCallback, useRef, forwardRef, useImperativeHandle } from "react"
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

export const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    "ai-response": aiResponseBlockSchema,
  },
})

const BlockNoteEditor = forwardRef<{}, BlockNoteEditorProps>(({ onBlockSubmit }, ref) => {
  const editor = useCreateBlockNote({ schema })
  const debouncedFn = useRef<ReturnType<typeof debounce> | null>(null)

  // Expose editor to parent component
  useImperativeHandle(ref, () => editor)

  // Handle block submission with debouncing
  const handleSubmit = useCallback(
    async (content: string) => {
      if (!editor || !content.trim()) return

      console.groupCollapsed("handleSubmit content :", content)
      console.trace()
      console.groupEnd()

      try {
        const aiResponse = await onBlockSubmit(content)
        // Insert AI response block after current block
        const blockId = editor.getTextCursorPosition().block.id
        editor.insertBlocks(
          [
            {
              type: "ai-response" as const,
              props: {
                content: aiResponse,
                backgroundColor: "#f5f5f5",
                textColor: "#000000",
                textAlignment: "left",
              },
            },
          ],
          blockId,
          "after"
        )

        editor.setTextCursorPosition(editor.document.at(-1)?.id ?? editor.document[0]?.id, "end")
        editor.focus()
      } catch (error) {
        console.error("Error in handleSubmit:", error)
        // Handle error (e.g., show notification)
      }
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

    const sendToAiIfNotAnAiUpdate = async () => {
      // Check if either the latest block is an AI block, or the next-to-last block is an AI block and the last block is empty
      if (shouldSendToAi()) {
        const editorContent = await editor.blocksToMarkdownLossy()
        if (editorContent.length > 0 && debouncedFn.current) {
          debouncedFn.current(editorContent)
        }
      }
    }

    function shouldSendToAi() {
      const latestBlock = editor.document.at(-1)
      const secondLatestBlock = editor.document.at(-2)
      const aiDidntJustRespond = !isAiBlock(latestBlock)
      const aiDidntJustPutUserOnNewLine = !(isAiBlock(secondLatestBlock) && blockIsEmpty(latestBlock))
      const userHasWrittenSomething = documentHasUserContent()
      return aiDidntJustRespond && aiDidntJustPutUserOnNewLine && userHasWrittenSomething
    }
    function isAiBlock(block: any) {
      return block && block.type === "ai-response"
    }
    function blockIsEmpty(block: any) {
      return Array.isArray(block.content) && block.content.length === 0
    }
    function documentHasUserContent() {
      return editor.document.some((block) => !isAiBlock(block) && !blockIsEmpty(block))
    }

    const unsubscribe = editor.onChange(sendToAiIfNotAnAiUpdate)
    return unsubscribe
  }, [editor, debouncedFn])

  return <BlockNoteView editor={editor} />
})

export default React.memo(BlockNoteEditor)
