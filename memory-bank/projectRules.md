# Project Rules

## Code Organization

- Files can be max 150 lines long. Files longer should be thoughtfully, sensibly broken out by their most critical concepts first.
- Follow separation of concerns:
  - Use custom hooks for stateful logic
  - Extract API calls to service files
  - Move utility functions to dedicated utility files
  - Define types and interfaces in appropriate files

## TypeScript

- All code must be properly typed with TypeScript
- Avoid using `any` type; prefer explicit interfaces and types
- Define shared interfaces in `/src/types.tsx`
- Component props should have dedicated interfaces

## Component Structure

- Components should focus on rendering and basic event handling
- Complex logic should be extracted to custom hooks
- Maintain consistent props naming and structure

## File Organization

- Keep related functionality grouped by feature when possible
- Follow the established directory structure:
  - `/components`: UI components
  - `/hooks`: Custom React hooks
  - `/services`: API integrations
  - `/utils`: Utility functions
  - `/types`: TypeScript types (when not co-located)

## Best Practices

- Use functional components with hooks
- Prefer useState and useEffect over class components
- Keep components pure when possible
- Document complex functions with comments
