import { createReactBlockSpec } from "@blocknote/react"

const aiResponseBlockSchema = createReactBlockSpec(
  {
    type: "ai-response",
    propSchema: {
      content: {
        type: "string",
        default: "",
      },
    },
    content: "none",
  },
  {
    render: (props) => (
      <div style={{ fontStyle: "italic", color: "rgba(0, 0, 0, 0.8)" }}>{props.block.props.content}</div>
    ),
  }
)

export default aiResponseBlockSchema
