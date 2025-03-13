import React from "react"
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { Block, Note } from "../types"

interface NoteListProps {
  notes: Note[]
  showPrompts: boolean
  setCurrentNote: (note: Note | null) => void
}

const NoteList: React.FC<NoteListProps> = ({ notes, showPrompts, setCurrentNote }) => {
  return (
    <div>
      {notes.map((note) => (
        <Accordion key={note.id} onChange={() => setCurrentNote(note)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{note.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {note.blocks.map((block) => (
              <Typography key={block.id}>
                {showPrompts ? `${block.prompt} → ${block.content}` : block.content}
              </Typography>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  )
}

export default NoteList
