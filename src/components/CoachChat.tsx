import React from "react"
import { Card, CardContent, Typography, TextField, List, ListItem, ListItemText } from "@mui/material"
import { ChatMessage, Link, Note, CoachChatProps } from "../types"

const CoachChat: React.FC<CoachChatProps> = ({
  chat,
  links,
  notes,
  searchQuery,
  searchResults,
  setSearchQuery,
  handleSearch,
  setCurrentNote,
}) => {
  return (
    <div>
      <Typography variant="h6">Coach Chat & Suggestions</Typography>
      <TextField
        fullWidth
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSearch()}
        placeholder="Search your notes..."
        variant="outlined"
        sx={{ mb: 2 }}
      />
      {searchResults.length > 0 && (
        <List sx={{ mb: 2 }}>
          {searchResults.map((result) => (
            <ListItem key={result.note.id} component="button" onClick={() => setCurrentNote(result.note)}>
              <ListItemText
                primary={result.note.title}
                secondary={`Similarity: ${(result.similarity * 100).toFixed(1)}%`}
              />
            </ListItem>
          ))}
        </List>
      )}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Chat
      </Typography>
      <div
        style={{
          height: "30vh",
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: "10px",
          marginBottom: "2px",
        }}
      >
        {chat.map((msg, idx) => (
          <Card key={idx} sx={{ mb: 1, bgcolor: msg.sender === "AI" ? "#f5f5f5" : "#e3f2fd" }}>
            <CardContent>
              <Typography>
                {msg.sender}: {msg.text}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </div>
      <Typography variant="subtitle1">Suggested Links</Typography>
      <div style={{ height: "20vh", overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
        {links.map((link, idx) => {
          const fromBlock = notes.flatMap((n) => n.blocks).find((b) => b.id === link.fromId)
          const toBlock = notes.flatMap((n) => n.blocks).find((b) => b.id === link.toId)
          return (
            <Typography
              key={idx}
              sx={{ mt: 1, color: "#1976d2", cursor: "pointer" }}
              onClick={() => setCurrentNote(notes.find((n) => n.blocks.some((b) => b.id === link.toId)) || null)}
            >
              {fromBlock?.content.slice(0, 20)} → {toBlock?.content.slice(0, 20)} ({(link.strength * 100).toFixed(1)}%)
            </Typography>
          )
        })}
      </div>
    </div>
  )
}

export default CoachChat
