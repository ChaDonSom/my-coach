# Technical Context

## Technologies Used

### Frontend

- React 19
- TypeScript
- Material UI (MUI) for UI components
- OpenAI SDK for API integration

### Project Structure

- `/src`: Main source code
  - `/components`: UI components
  - `/hooks`: Custom React hooks
  - `/services`: External API integrations
  - `/utils`: Utility functions
  - `/types`: TypeScript interfaces and types
- `/public`: Static assets
- `/build`: Production build output

### Specific Dependencies

- OpenAI SDK: Used for embeddings and completions
- Material UI: Core components, icons, and styling
- TypeScript: Type definitions and interfaces

## Development Setup

- React app created with Create React App with TypeScript template
- Requires OpenAI API key (REACT_APP_OPENAI_API_KEY environment variable)
- Local development server with `npm start`

## Technical Constraints

- OpenAI API rate limits and costs need consideration
- Client-side only for now, no persistence between sessions
- TypeScript requirements for static typing

## Dependencies

### Core

- react: ^18.2.0
- @mui/material: ^5.14.x
- openai: ^4.x.x

### Dev Dependencies

- typescript: ^4.9.5
- @types/react: ^18.2.0

### Project Structure

- Custom hooks architecture for state management
- Service layer for external API interactions
- Utility modules for reusable functions
