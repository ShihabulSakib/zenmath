# ZenMath

A minimalist, offline-capable mental arithmetic trainer with 14 game modes, adaptive difficulty, voice support, and persistent performance tracking.

Live PWA — installable on desktop and mobile.

## Features

- **14 game modes** — basic operations, mixed, squares, fractions, percentages, square roots, estimation, number series, ratios, chain calculations
- **Adaptive difficulty** — auto-escalates digits and question complexity when accuracy exceeds 85%
- **Audio feedback** — Web Speech API TTS and pre-recorded HD audio sprites (5 speed tiers)
- **Persistent history** — every session and question result stored in IndexedDB
- **Statistics dashboard** — aggregate accuracy, streak days, per-mode breakdown, 7-day chart
- **Custom numeric keypad** — haptic feedback, native-feel input with fraction/decimal support
- **Dark / Light theme** — toggle manually, saved to localStorage
- **Full PWA** — installable, works offline, SPA navigation fallback, runtime font/audio caching
- **Comprehensive revision** — multiplication tables (1–20), square numbers (1–25), fraction↔decimal reference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Icons | Material Symbols Outlined + Lucide React |
| Audio | Web Audio API (audio sprites with signal smoothing) |
| Speech | Web Speech API |
| Storage | IndexedDB (sessions + questions) + localStorage (settings + daily progress) |
| PWA | vite-plugin-pwa / Workbox |
| Formatting | ESLint + TypeScript strict |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build:

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the build locally
```

## Usage

1. **Main Menu** — pick a mode (basic operations grid, mixed, or specialized practice)
2. **Setup** — configure digits, difficulty, mode-specific options (remainders, negative results, ranges)
3. **Play** — answer questions against a per-question timer; streak counter and elapsed time shown
4. **Results** — score, accuracy, time breakdown, answer visualization, retry or return to menu
5. **Stats / History / Revision / Settings** — accessible from the bottom navigation bar

## Game Modes

### Basic

| Mode | Description |
|------|-------------|
| Addition | Sum of two numbers |
| Subtraction | Positive-only or forced-negative results |
| Multiplication | Product of two numbers |
| Division | Exact or with remainders |
| Mixed | Randomized combination of enabled operations |

### Specialized

| Mode | Description |
|------|-------------|
| Multiplication Tables | Range-based table practice (1–10, 11–20, or 1–20) |
| Squares | Square numbers (fixed 1–25 or custom range) |
| Fractions | Fraction↔decimal conversions (configurable numerator/denominator ranges) |

### Advanced

| Mode | Description |
|------|-------------|
| Percentage | "X% of Y" and "X is what % of Y" problems |
| Square Root | Perfect-square and near-perfect root estimation |
| Approximation | Round-estimate large-number arithmetic |
| Number Series | Find the missing term (arithmetic, geometric, square, Fibonacci) |
| Ratio | Find the missing value in a proportion |
| Chain Calculation | Multi-step arithmetic chains (2–3 operations) |

## Architecture

```
src/
├── main.tsx                 # Entry point, ThemeProvider + App
├── App.tsx                  # Root orchestrator, all screen routing
├── constants.ts             # Single source of truth for limits/defaults
├── index.css                # Tailwind @theme, CSS variables, animations
├── hooks/
│   ├── useGameLogic.ts      # Central game state machine (782 lines)
│   ├── useStats.ts          # IndexedDB stats aggregation
│   ├── useTheme.tsx         # Dark/light context + toggle
│   └── useFractionLogic.ts  # Irreducible fraction question generator
├── utils/
│   ├── questions.ts         # Question generation for all modes
│   ├── speech.ts            # Web Speech API TTS
│   └── mathSpeech.ts        # Audio sprite key mapping
├── services/
│   ├── database.ts          # IndexedDB wrapper (sessions + questions stores)
│   └── audio.ts             # Audio sprite player (Web Audio API)
└── components/
    ├── MainMenu.tsx         # Home screen with mode grid + bottom nav
    ├── GameSetup.tsx        # Pre-game configuration
    ├── GameScreen.tsx       # Active gameplay (question, timer, keypad)
    ├── ResultsScreen.tsx    # Post-session summary
    ├── SettingsScreen.tsx   # App settings
    ├── StatsScreen.tsx      # Statistics dashboard
    ├── HistoryScreen.tsx    # Session history with mode filters
    ├── RevisionScreen.tsx   # Tables, squares, fraction reference
    ├── Keypad.tsx           # Custom numeric keypad
    ├── ProgressBar.tsx      # Reusable progress bar
    ├── ToggleSwitch.tsx     # Reusable toggle with card wrapper
    ├── ErrorBoundary.tsx    # Class-based error boundary
    ├── ZenLayout.tsx        # Root layout wrapper
    └── OfflineIndicator.tsx # Connectivity banner
```

## Theming

Two themes, toggled via a sun/moon button in the header:

| Token | Dark (Zen Obsidian) | Light (Paper Zen) |
|-------|---------------------|-------------------|
| Surface | `#000000` | `#F4F4F5` |
| Card | `#121214` | `#FFFFFF` |
| Primary | `#E4E4E7` | `#18181B` |
| Text main | `#FFFFFF` | `#18181B` |

Feedback colors (correct `#4ADE80`, incorrect `#F87171`, timeout `#FB923C`) are identical in both modes. Theme preference is persisted in `localStorage` key `zenmath-theme`.

## PWA

- **Installable** — meets all PWA criteria; standalone display with window controls overlay
- **Offline** — all static assets precached by Workbox; fonts and audio runtime-cached
- **Auto-update** — service worker registers with `autoUpdate`, no manual update prompt
- **Manifest** — `theme_color: #0A1C2A`, portrait orientation, maskable icons
- **Connectivity indicator** — banner displayed when `navigator.onLine === false`

## Data Storage

| What | Where | Key |
|------|-------|-----|
| Sessions + Questions | IndexedDB (`zenmath-db`) | `sessions` and `questions` stores |
| Settings | localStorage | `zenmath-settings` |
| Daily progress | localStorage | `zenmath-daily-progress` |
| Theme preference | localStorage | `zenmath-theme` |

## Deployment

The project includes a `vercel.json` for Vercel deployment with SPA rewrites and proper Service-Worker-Allowed headers.

## License

MIT
