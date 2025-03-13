import { createReactBlockSpec } from "@blocknote/react"

const aiResponseBlockSchema = createReactBlockSpec(
  {
    type: "ai-response",
    propSchema: {
      //
    },
    content: "inline",
  },
  {
    render: (props) => (
      <div style={{ fontStyle: "italic", color: "rgba(0, 0, 0, 0.8)" }}>
        {props.block.children.length > 0 ? props.block.children[0].content : "No content available"}
      </div>
    ),
  }
)

export default aiResponseBlockSchema
