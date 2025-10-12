# Project Rules

## Tech Stack
- **Runtime**: Bun
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite
- **Testing**: Vitest
- **Data Fetching**: SWR
- **Linting**: Biome
- **Build**: Bun plugins for everything
- **Deployment**: Docker + GitHub Actions → ghcr.io

## Mobile-First Design
- Design for mobile first, scale up
- Use responsive breakpoints (sm, md, lg, xl)
- Touch-friendly UI elements (min 44px tap targets)
- Test on actual mobile devices

## File Structure
- Use bun plugins instead of separate build tools
- Keep components in `/components` with shadcn structure
- Database files in `/db`
- Tests alongside source files (`.test.ts`)

## Configuration
- Use `.env` for environment variables
- Never commit secrets
- Document required env vars in README

## Development Workflow
- `bun dev` for development
- `bun test` for testing
- `bun build` for production build
- Docker for consistent deployment

## Code Standards
- TypeScript strict mode
- Minimal code, maximum impact
- Mobile-responsive by default
- Use shadcn components when possible
