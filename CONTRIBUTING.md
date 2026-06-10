# Contributing to ZenMath

Thank you for considering contributing to ZenMath. This document outlines the guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Local Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/zenmath.git
   cd zenmath
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Run the linter to verify code quality:
   ```bash
   npm run lint
   ```

## Code Style and Standards

### TypeScript

- The project uses TypeScript 5.9 with strict mode enabled.
- All new code must be written in TypeScript.
- Avoid using `any`; prefer explicit type definitions.
- Types shared across modules should be exported from `hooks/useGameLogic.ts` where appropriate.

### React

- Follow the patterns established in existing components.
- Use functional components with hooks. Avoid class components (except `ErrorBoundary.tsx`, which is intentionally class-based).
- Components are organized under `src/components/` — one file per component.
- Custom hooks reside in `src/hooks/` and encapsulate stateful logic.

### Styling

- Tailwind CSS 4 utility classes are the primary styling mechanism.
- Custom CSS variables are defined in `src/index.css` under the `@theme` directive.
- Theme-aware styles use `html.dark` and `html.light` CSS class selectors.
- Animations are defined as `@keyframes` in `index.css` and applied via utility classes.

### Linting

The project uses ESLint with the following configurations:
- `@eslint/js` recommended rules
- `typescript-eslint` strict type checking
- `eslint-plugin-react-hooks` rules
- `eslint-plugin-react-refresh` Vite integration

Run the linter before submitting any pull request:

```bash
npm run lint
```

Ensure there are no warnings or errors.

### Formatting

- ESLint handles code quality; there is no Prettier configuration.
- Follow the existing code style for indentation (2 spaces), quotes (single), and semicolons.
- Use meaningful variable and function names.
- Keep functions focused and concise.

## Project Structure

```
src/
├── components/   # React UI components
├── hooks/        # Custom React hooks
├── services/     # Application services (IndexedDB, audio, notifications)
├── utils/        # Pure utility functions
├── constants.ts  # Centralized constants and defaults
├── index.css     # Global styles and Tailwind theme
├── main.tsx      # Application entry point
└── App.tsx       # Root component with screen routing
```

## Branch Strategy

- `main` — stable, production-ready code.
- Feature branches should be created from `main` and follow the naming convention:
  - `feat/<short-description>` for new features
  - `fix/<short-description>` for bug fixes
  - `refactor/<short-description>` for code improvements

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Make your changes in a dedicated feature branch.
3. Run `npm run lint` and fix any issues.
4. Run `npm run build` to verify the project compiles cleanly.
5. Write clear, descriptive commit messages.
6. Open a pull request against the `main` branch.
7. Provide a concise description of the changes and any relevant context.
8. Ensure the PR description includes any necessary migration notes or configuration changes.

## Testing

The project does not currently have an automated test suite. When contributing:
- Manually verify that your changes work in both dark and light themes.
- Test on mobile viewport sizes (the app is designed for mobile-first).
- Verify offline functionality by disconnecting the network.
- Test audio playback if making changes to audio-related code.

## Adding a New Game Mode

1. Add the mode name to the `GameMode` type in `src/hooks/useGameLogic.ts`.
2. Add question generation logic to `src/utils/questions.ts`.
3. Add the mode to the menu configuration in `src/components/MainMenu.tsx`.
4. Add setup options in `src/components/GameSetup.tsx` if applicable.
5. Register the mode in the game state machine in `src/hooks/useGameLogic.ts`.
6. Update the results display in `src/components/ResultsScreen.tsx` if needed.

## Audio Assets

Audio sprite files are located in `public/audio/`. Each speed tier (1.0x, 1.25x, 1.5x, 1.75x, 2.0x) has:
- A WAV file containing concatenated audio clips
- A JSON manifest mapping keys to start/end timestamps

To regenerate audio sprites, use the tools referenced in the `audio.ts` service.

## Notification System

Notifications are managed through `src/services/notifications.ts`. The system:
- Checks configured notification times against the current time
- Tracks sent notifications to avoid duplicates
- Uses the Service Worker API for reliable delivery
- Falls back to direct `Notification` API if the Service Worker path fails

## Deployment

The project is deployed via Vercel. Configuration is in `vercel.json`. The build process:
1. `tsc -b` — TypeScript compilation
2. `vite build` — Vite production build with Workbox precaching

## Questions

If you have questions about contributing, open a GitHub issue with the `question` label.
