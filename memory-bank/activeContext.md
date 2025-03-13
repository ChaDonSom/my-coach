# Active Context

## Current Work Focus

### Prototype

- Functional block editor using TipTap, with AI integration, search, and links.
- Needs polish and additional features.

### Final App

- Production-ready, scalable, with user accounts, data persistence, and advanced features.

## Recent Changes

- Document recent changes made to the project.
- Include details on what was changed and why.

## Next Steps

### Prototype

- Polish UI: Style 6-dot menu (e.g., use MUI icons).
- Improve block spacing and borders.
- Polish UI: Only show the drag indicator when the block is hovered.
- Optimize Sync: Debounce onUpdate to reduce re-renders.
- Auto AI Trigger: Replace "Send" with on-blur or timer-based trigger.
- Testing: Add 10+ blocks, verify performance. Test drag-and-drop with @hello-pangea/dnd.

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
