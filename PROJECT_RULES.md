# Project Rules

## TypeScript Guidelines

### Type Definitions
- **All types must be defined in the global `/src/types.ts` file** - No local interfaces or types in component files
- Export all types from the global types file
- Import types using `import type { TypeName } from "../types"`

## UI/UX Guidelines

### Icons
- **Always add Lucide React icons to buttons** - Every button should have an appropriate icon from the `lucide-react` library
- Use 16px size for regular buttons, 20px for large buttons
- Place icons before text content
- Choose semantically appropriate icons (Play for start, Square for stop, CheckCircle for complete, etc.)

### Mobile-First Design
- All components must be mobile-first and touch-friendly
- Minimum 44px tap targets for interactive elements
- No responsive breakpoints - design works at all screen sizes

### Component Structure
- **Each component must be in its own file** - No multiple components per file
- Separate components for different concerns
- Use SWR for data fetching with suspense
- Maintain clean state management patterns
