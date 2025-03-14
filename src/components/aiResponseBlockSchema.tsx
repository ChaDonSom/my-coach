import { createReactBlockSpec } from "@blocknote/react"
import { StyledText } from "@blocknote/core"

const aiResponseBlockSchema = createReactBlockSpec(
  {
    type: "ai-response",
    propSchema: {
      content: {
        type: "string",
        default: "",
      },
      backgroundColor: { type: "string", default: "" },
      textColor: { type: "string", default: "" },
      textAlignment: { type: "string", default: "left" },
    },
    content: "inline",
  },
  {
    render: ({ block }) => {
      // Get text content from inline content if available, fallback to props
      const textContent =
        block.content?.find((item): item is StyledText<any> => item.type === "text")?.text || block.props.content

      return (
        <div
          style={{
            fontStyle: "italic",
            color: "rgba(0, 0, 0, 0.8)",
            padding: "8px 12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
            margin: "4px 0",
          }}
        >
          {textContent}
        </div>
      )
    },
  }
)

export default aiResponseBlockSchema
