# System Patterns

## System Architecture

### Frontend

- React SPA with functional components and hooks
- Component structure:
  - App (layout and component coordination)
  - BlockNoteEditor (rich text editing)
  - CoachChat (chat interface)
  - MobileCoachChat (responsive chat for mobile)
- State management:
  - React hooks for local and shared state
  - Custom hooks for complex state logic
  - Prop drilling for component communication

### Backend (Planned)

- REST API for CRUD operations (blocks, interactions, etc.)
- WebSocket for real-time AI responses (optional)

### Database (Planned)

- MongoDB collections: Users, Blocks, Interactions, Links, Chats

### Auth (Planned)

- Firebase Auth for user login (email/password, Google)

### Deployment (Planned)

- Vercel for frontend/backend hosting.

## Key Technical Decisions

- Custom hooks approach for state management instead of Redux or Context API
- Service layer pattern for API integrations (OpenAI)
- Utils modules for shared utility functions
- Type safety with TypeScript interfaces

## Design Patterns in Use

- Custom hooks pattern for reusable stateful logic
  - useNotes: Manages note-related state and operations
  - useSearch: Handles search functionality
- Service layer pattern for external API interactions
  - openAIService: Encapsulates all OpenAI API interactions
- Utility modules pattern for shared functions
  - similarity.ts: Provides cosineSimilarity calculation
- Component composition for UI organization
  - Separation of desktop and mobile components
  - Component-specific props interfaces

## Component Relationships

### Data Flow

```
App
├─ Uses useNotes (notes state and operations)
├─ Uses useSearch (search functionality)
├─ Creates openAI client
│
├─ Renders BlockNoteEditor
│   └─ Receives blocks, callbacks for changes/submissions
│
├─ Renders CoachChat (desktop)
│   └─ Receives chat, notes, search props
│
└─ Renders MobileCoachChat (mobile)
    └─ Same props as CoachChat + drawer control
```

### Service Integration

```
Component (e.g., useNotes)
├─ Calls openAIService.generateEmbedding()
├─ Calls openAIService.generateAIResponse()
└─ Uses similarity.cosineSimilarity()
```
