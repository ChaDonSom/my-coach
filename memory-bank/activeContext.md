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

- Refactored `App.tsx` from 241 lines down to under 100 lines by extracting functionality into separate utilities and hooks:
  - Created `src/utils/similarity.ts` for the cosineSimilarity function
  - Created `src/services/openAIService.ts` for AI-related functionality
  - Created custom hooks in `src/hooks/useNotes.tsx` and `src/hooks/useSearch.tsx`
- Fixed TypeScript errors across the application, particularly in:
  - Properly typing the chat state setter function in useNotes hook
  - Providing proper type definitions for parameters in utility functions
  - Ensuring consistency between component props and their usage
- Enhanced code organization by separating concerns:
  - App.tsx now focuses on layout and component coordination
  - Business logic moved to appropriate service files and custom hooks

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

- Adopted a modular approach with custom hooks to manage complex state and logic
- Applied separation of concerns pattern by moving specific functionality to dedicated files
- Ensured TypeScript type safety throughout the application to catch potential errors early
- Focused on maintainability through smaller, focused components and utility functions
