# Architecture

This document describes the architecture, design decisions, and data flow of the ZenMath mental arithmetic trainer.

## High-Level Overview

ZenMath is a single-page application (SPA) built with React 19 and TypeScript. It runs entirely in the browser with no server-side rendering or API backend. Data persistence is handled client-side through IndexedDB and localStorage, enabling full offline functionality.

The application follows a **screen-based routing** model where the root component (`App.tsx`) conditionally renders screens based on a state machine managed by `useGameLogic` — no React Router is used.

```
┌─────────────────────────────────────────────────────────┐
│                     Service Worker                       │
│              (Workbox precaching + push notifications)   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    App.tsx                               │
│              Screen Router (state machine)               │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬───────────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
 Main  Game   Game  Result Stats  History  Settings
 Menu  Setup  Screen       Screen Screen  Screen
  │                       │
  │                       ▼
  │                 ResultsScreen
  │
  ▼
 Special Revision
  Menu    Screen
```

## Screen State Machine

The application state is driven by a single `ScreenState` type:

```
'menu' -> 'setup' -> 'playing' -> 'result' -> 'menu'
  │                                       │
  ▼                                       │
'special-menu' -> 'setup'                  │
  │                                        │
  ▼                                        │
'settings'  'stats'  'history'  'revision' │
  │                                        │
  └────────────────────────────────────────┘
```

All screen transitions are managed by `useGameLogic` hook, which exposes:
- `screen` — current screen identifier
- `selectMode()` — transitions from menu to setup
- `startGame()` — transitions from setup to playing
- `handleKeyPress()` — processes input during gameplay
- Transition helpers: `goToMenu()`, `goToSettings()`, `goToStats()`, etc.

## Component Tree

```
<ThemeProvider>                    [src/hooks/useTheme.tsx]
  <ToastProvider>                  [src/hooks/useToast.tsx]
    <ErrorBoundary>                [src/components/ErrorBoundary.tsx]
      <ZenLayout>                  [src/components/ZenLayout.tsx]
        ├── <MainMenu>             [src/components/MainMenu.tsx]
        ├── <GameSetup>            [src/components/GameSetup.tsx]
        ├── <GameScreen>           [src/components/GameScreen.tsx]
        │     └── <Keypad>         [src/components/Keypad.tsx]
        ├── <ResultsScreen>        [src/components/ResultsScreen.tsx]
        ├── <SpecialMenu>          [src/components/SpecialMenu.tsx]
        ├── <SettingsScreen>       [src/components/SettingsScreen.tsx]
        │     ├── <ToggleSwitch>   [src/components/ToggleSwitch.tsx]
        │     └── <RangeSlider>    [src/components/RangeSlider.tsx]
        ├── <StatsScreen>          [src/components/StatsScreen.tsx]
        │     └── <ProgressBar>    [src/components/ProgressBar.tsx]
        ├── <HistoryScreen>        [src/components/HistoryScreen.tsx]
        └── <RevisionScreen>       [src/components/RevisionScreen.tsx]
      <OfflineIndicator>           [src/components/OfflineIndicator.tsx]
      <ToastContainer>             [src/components/Toast.tsx]
```

## Data Flow

### Session Lifecycle

```
User selects mode
       │
       ▼
GameSetup configures parameters
       │
       ▼
useGameLogic.startGame()
  - Resets score, currentQuestion, results
  - Calls generateQuestion() from utils/questions.ts
  - Starts per-question timer
       │
       ▼
GameScreen renders question
  - User enters answer via Keypad
  - handleKeyPress() validates input
  - On submit: evaluates answer, sets feedback, advances question
       │
       ▼
Session complete -> handleSessionComplete() callback in App.tsx
  - Calls stats.saveSession() -> database.ts (IndexedDB)
  - Transitions to ResultsScreen
```

### Stats and Persistence Flow

```
Session completed in App.tsx
  │
  ▼
stats.saveSession(mode, total, correct, avgTime, difficulty, questions)
  ├── db.addSession(session)        -> IndexedDB 'sessions' store
  └── db.addQuestions(questions)    -> IndexedDB 'questions' store
       │
       ▼
useStats hook refreshes:
  ├── db.getOverallStats()
  ├── db.getRecentPerformance(30)
  └── db.getSessions(50)
```

### Data Stores

```
IndexedDB (zenmath-db, version 1)
├── sessions (keyPath: 'id')
│   ├── Index: 'date'
│   └── Index: 'mode'
└── questions (keyPath: 'id', autoIncrement)
    └── Index: 'sessionId'

localStorage
├── zenmath-settings           # User preferences (JSON)
├── zenmath-theme              # Theme: 'dark' | 'light'
├── zenmath-daily-progress     # Daily question count + streak
└── zenmath-notification-*     # Notification permissions + tracking
```

## Audio Architecture

### Audio Sprite System

The audio system (`src/services/audio.ts`) uses the Web Audio API to play pre-recorded audio sprites. Audio assets are stored as WAV files in `public/audio/` across 5 speed tiers:

| Tier | File | Playback Rate Range |
|------|------|---------------------|
| 1.0x | `game_audio_sprite_10` | 1.00 - 1.12 |
| 1.25x | `game_audio_sprite_125` | 1.13 - 1.37 |
| 1.5x | `game_audio_sprite_15` | 1.38 - 1.62 |
| 1.75x | `game_audio_sprite_175` | 1.63 - 1.87 |
| 2.0x | `game_audio_sprite_20` | 1.88 - 2.50 |

Each tier has:
- A WAV file with concatenated audio clips (e.g., number pronunciations, operation names)
- A JSON manifest mapping sprite keys (e.g., `"num_42"`, `"op_plus"`) to `{ start, end, loop }` timestamps

The `AudioSpritePlayer` class:
- Decodes audio buffers on load
- Selects the nearest anchor tier based on playback rate
- Uses `AudioBufferSourceNode.start()` with offset for low-latency playback
- Applies gain envelope with fast fade-in/out to eliminate clicks
- Manages `activeSources` for immediate stop capability

### Text-to-Speech

The `speech.ts` utility wraps the Web Speech API (`SpeechSynthesisUtterance`) with:
- Voice selection from available system voices
- Configurable `rate` parameter
- Cancellation support via `speechSynthesis.cancel()`
- A `translateMathToText()` helper that renders equations as natural language strings

### Speech-to-Sprite Mapping

The `mathSpeech.ts` utility maps problem parameters to audio sprite keys, enabling a hybrid audio approach where:
- TTS handles dynamic text (e.g., large numbers, fractions)
- Audio sprites provide consistent, high-quality pronunciation for common terms

## Notification System

The notification system (`src/services/notifications.ts`) operates on a scheduler pattern:

```
startNotificationScheduler()
  ├── evaluateAndSend() immediately
  └── setInterval(evaluateAndSend, 60_000) — check every minute
```

`evaluateAndSend()`:
1. Reads settings from localStorage (with 2-second cache TTL)
2. Checks if notifications are enabled and permission is granted
3. Compares current time against configured notification times
4. Checks daily progress against goal
5. Generates a contextual message (period-aware greetings, streak mentions)
6. Sends via Service Worker (`postMessage` with `SHOW_NOTIFICATION` type)
7. Falls back to direct `Notification` API if Service Worker is unavailable
8. Records sent notifications to prevent duplicates

The Service Worker (`public/sw.js`) handles:
- Notification display and click handling
- Snooze functionality (30-minute delay via `setTimeout`)
- Push event handling

## Question Generation

Question generation is implemented in `src/utils/questions.ts` as pure functions. Each game mode has a dedicated generator:

| Mode | Generator Function | Strategy |
|------|-------------------|----------|
| Basic ops (`+ - * /`) | `generateQuestion()` | Number range based on digits + difficulty; division uses product-based approach for exact results |
| Mixed | `generateQuestion()` with random operation selection | Same as basic ops with randomized operator |
| Multiplication Table | `generateQuestion()` with constrained range | Uses table range (1-10, 11-20, or 1-20) |
| Square | `generateSquareQuestion()` | Generates n in range, computes n^2 |
| Fraction | `generateFractionQuestion()` | Generates irreducible fractions via GCD reduction |
| Percentage | `generatePercentageQuestion()` | Two variants: "X% of Y" or "X is what % of Y" |
| Square Root | `generateSquareRootQuestion()` | Perfect squares and near-perfect estimation |
| Approximation | `generateApproximationQuestion()` | Round to nearest 10/100/1000 then compute |
| Number Series | `generateNumberSeriesQuestion()` | Arithmetic, geometric, square, or Fibonacci patterns |
| Ratio | `generateRatioQuestion()` | Missing value in proportion a:b = c:d |
| Chain Calculation | `generateChainCalculationQuestion()` | Multi-step expression with 2-3 operations |

### Adaptive Difficulty

When `adaptiveDifficulty` is enabled, the game tracks the running accuracy. If accuracy exceeds 85% (`ADAPTIVE_ACCURACY_THRESHOLD`), digits are incremented automatically and difficulty is escalated through the `DIFFICULTY_ORDER` progression: `easy -> medium -> hard`.

## Theme System

The theme system (`useTheme.tsx`) uses React Context to manage dark/light mode:

1. On mount, reads `localStorage` for saved preference (defaults to `'dark'`)
2. Toggles `html.dark` / `html.light` classes on `document.documentElement`
3. CSS variables (defined in `index.css` under `@theme`) change based on the class selector
4. All components use Tailwind utility classes and CSS custom properties for theme-aware styling

Theme tokens are categorized as:
- **Surface colors** — `--color-midnight-bg` / `--color-light-bg`
- **Card colors** — `--color-midnight-card` / `--color-light-card`
- **Primary accents** — `--color-primary`
- **Feedback colors** — `--color-correct`, `--color-incorrect`, `--color-timeout` (identical across themes)

## PWA and Service Worker

The PWA setup uses `vite-plugin-pwa` with an inject manifest strategy:

1. **Build time**: Workbox generates a precache manifest of all static assets
2. **Runtime**: `sw.js` registers routes for:
   - Navigation requests (SPA fallback to `index.html`)
   - Google Fonts (StaleWhileRevalidate with 1-year cache)
   - Gstatic fonts (CacheFirst with 1-year cache)
   - Audio files (CacheFirst with 30-day cache, 50-entry limit)
3. **Updates**: `autoUpdate` register type checks for updates on every navigation
4. **Offline**: All core assets are available offline via precaching; audio and fonts are cached on first access

## Key Design Decisions

1. **No React Router**: Screen transitions are managed by a simple state machine in `useGameLogic`. This avoids dependency overhead and keeps navigation logic co-located with game state.

2. **Single hook for game state**: All game logic (generation, timing, input handling, validation) is centralized in `useGameLogic.ts` (~797 lines). This was chosen to keep the full game lifecycle visible in one place, at the cost of file size.

3. **Audio sprites over generated audio**: Pre-recorded audio sprites provide consistent pronunciation, avoid robot-sounding TTS for numbers, and enable tight synchronization with game events. TTS is used as a fallback/unified audio approach for dynamic content.

4. **IndexedDB for history, localStorage for settings**: IndexedDB is used for structured session/question data that requires querying (by date, mode, etc.). localStorage is used for simple key-value preferences that need synchronous access.

5. **No backend**: The application is fully client-side. No user accounts, no server-side storage, no API calls. This simplifies deployment, guarantees privacy, and enables offline-first functionality.

6. **Custom keypad**: A native-feel custom numeric keypad (`Keypad.tsx`) replaces standard keyboard input for a consistent mobile experience, with fraction input support (numerator/denominator entry).

7. **Class-based ErrorBoundary**: Only class component in the codebase. React error boundaries require `componentDidCatch`, which is not available in functional components.

## Build Pipeline

```
npm run build
  ├── tsc -b           # TypeScript compilation (project references)
  └── vite build       # Vite production build
       ├── CSS @tailwindcss/vite  # Tailwind processing
       ├── JS bundling            # Code splitting, tree shaking
       ├── Workbox inject manifest # Generates precache manifest
       └── Output to dist/        # Static files ready for deployment
```

## Dependencies

### Production

| Package | Purpose |
|---------|---------|
| react | UI framework |
| react-dom | DOM rendering |
| lucide-react | Icon library |
| tailwindcss | Utility-first CSS framework |
| @tailwindcss/vite | Tailwind CSS Vite plugin |

### Development

| Package | Purpose |
|---------|---------|
| vite | Build tool and dev server |
| @vitejs/plugin-react | React Fast Refresh and JSX transform |
| vite-plugin-pwa | PWA / Workbox integration |
| typescript | Type checking |
| eslint | Code quality |
| typescript-eslint | TypeScript ESLint rules |
| eslint-plugin-react-hooks | React Hooks lint rules |
| eslint-plugin-react-refresh | React Refresh lint rules |
