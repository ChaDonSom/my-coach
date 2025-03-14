import React from "react"
import { Accordion, AccordionSummary, AccordionDetails, Typography } from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"

interface NoteListProps {
  notes: any[]
  showPrompts: boolean
  setCurrentNote: (note: any | null) => void
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
            {note.blocks.map((block: any) => (
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
