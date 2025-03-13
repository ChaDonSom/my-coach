# Active Context

## Current Work Focus

### Prototype

- Successfully implemented BlockNote editor with:

  - Basic text editing functionality
  - Fixed height container to prevent layout issues
  - Clean, minimal UI with padding and border

- Current focus:

  1. Handle content changes and sync with our Block type
  2. Implement Enter key for new block creation
  3. Add AI integration with block submission
  4. Add block manipulation features (search, links)

- Approach:
  - Implement features incrementally
  - Test each feature thoroughly before moving to next
  - Ensure type safety with BlockNote's API

### Final App

- Production-ready, scalable, with user accounts, data persistence, and advanced features.

## Recent Changes

- Refactored `App.tsx` into smaller components (`NoteList`, `CoachChat`, `MobileCoachChat`) to improve maintainability and reduce file size.
- Created `src/types.tsx` to define shared interfaces (`Block`, `Note`, `ChatMessage`, `Link`, `Interaction`, `OpenAIResponse`, `CoachChatProps`, `MobileCoachChatProps`).
- Updated all components to import interfaces from `src/types.tsx`.
- Updated `BlockNoteEditor.tsx` to handle Enter key press for creating new blocks and submitting block content to AI.
- Updated `BlockNoteEditor.tsx` to use `BlockNoteView` and `useCreateBlockNote` from the latest BlockNote documentation.

## Next Steps

### Prototype

1. Content Integration:

   - Implement onBlocksChange to sync with parent component
   - Convert BlockNote's blocks to our Block type format
   - Handle block content submission to AI

2. Block Operations:

   - Add Enter key handling for new blocks
   - Implement block selection and focus management
   - Add block manipulation utilities (delete, move)

3. Advanced Features:
   - Search functionality
   - Block linking
   - Additional UI polish as needed

### Final App

- Backend: Set up Node.js/Express server. Integrate MongoDB, define schemas.
- Auth: Add Firebase Auth, secure routes.
- Features: Implement notifications, insights. Add slash commands to TipTap.
- Testing: Unit tests for API endpoints. E2E tests for UI (Cypress).
- Deployment: Deploy to Vercel, set up CI/CD.

## Active Decisions and Considerations

- Refactored `App.tsx` into smaller components (`NoteList`, `CoachChat`, `MobileCoachChat`) to improve maintainability and reduce file size.
- Created `src/types.tsx` to define shared interfaces (`Block`, `Note`, `ChatMessage`, `Link`, `Interaction`, `OpenAIResponse`, `CoachChatProps`, `MobileCoachChatProps`).
- Updated all components to import interfaces from `src/types.tsx`.
