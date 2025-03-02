# SCHOONER-MOBILE DEVELOPMENT GUIDE

## Commands
- Start: `npm start` (alias for expo start)
- Platform: `npm run ios`, `npm run android`, `npm run web`
- Lint: `npm run lint`
- Test all: `npm test` (runs Jest in watch mode)
- Test single: `npm test -- -t "test name pattern"`
- Reset project: `npm run reset-project`

## Code Style
- Use TypeScript with strict type checking
- Component naming: PascalCase for components, camelCase for functions/variables
- Imports: Group imports (React, external libs, internal components/constants)
- Use `@/` path alias for internal imports
- Platform-specific components with .ios.tsx or .android.tsx extensions
- Props typing: Define interfaces as `ComponentNameProps`
- Styles: Use StyleSheet.create with theme-aware colors
- Theme: Use useThemeColor hook for consistent theming
- Error handling: Use optional chaining and nullish coalescing