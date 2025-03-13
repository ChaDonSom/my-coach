# Progress

## What Works

### Prototype

- Functional block editor using TipTap, with AI integration, search, and links.

### Final App

- Production-ready, scalable, with user accounts, data persistence, and advanced features.

## What's Left to Build

### Prototype

- Polish UI: Style 6-dot menu (e.g., use MUI icons).
- Improve block spacing and borders.
- Optimize Sync: Debounce onUpdate to reduce re-renders.
- Auto AI Trigger: Replace "Send" with on-blur or timer-based trigger.
- Testing: Add 10+ blocks, verify performance. Test drag-and-drop with @hello-pangea/dnd.

### Final App

- Backend: Set up Node.js/Express server. Integrate MongoDB, define schemas.
- Auth: Add Firebase Auth, secure routes.
- Features: Implement notifications, insights. Add slash commands to TipTap.
- Testing: Unit tests for API endpoints. E2E tests for UI (Cypress).
- Deployment: Deploy to Vercel, set up CI/CD.

## Current Status

- Describe the current status of the project.
- Include any relevant metrics or milestones.

## Known Issues

### Prototype

- Block Sync: onUpdate may lag with large block counts—needs optimization.
- AI Trigger: Manual "Send" works, but auto-trigger on blur could be smoother.
- Menu Styling: 6-dot menu is functional but visually basic (SVG placeholder).
- Drag indicator is only shown when the block is hovered.

### Final App

- Document any known issues or bugs.
- Provide details on their impact and potential solutions.

## Refactoring

- `App.tsx` has been refactored to be more modular and maintainable.
- All type errors have been resolved.
