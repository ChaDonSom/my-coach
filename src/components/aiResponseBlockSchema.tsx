import { createReactBlockSpec } from "@blocknote/react"

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
    content: "none",
  },
  {
    render: ({ block }) => (
      <div
        style={{
          fontStyle: "italic",
          color: "rgba(0, 0, 0, 0.8)",
          padding: "8px 0",
        }}
      >
        {block.props.content}
      </div>
    ),
  }
)

export default aiResponseBlockSchema
