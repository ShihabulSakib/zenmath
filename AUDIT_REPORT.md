# ZenMath — Audit Report

## Commits (newest first)

| Commit | Description | Files |
|--------|-------------|-------|
| `cfcb577` | fix: results off-by-one due to stale closure, PWA notification icons | `useGameLogic.ts`, `vite.config.ts` |
| `8301ed0` | fix: white screen caused by const reassignment in generateApproximationQuestion | `useGameLogic.ts`, `questions.ts`, `HistoryScreen.tsx`, `MainMenu.tsx` |
| `75a6d13` | fix: persist bestStreak, clean up selectMode, fix debug labels | `useGameLogic.ts`, `GameSetup.tsx` |
| `0e79022` | feat: customizable square root range with difficulty defaults | `constants.ts`, `questions.ts`, `useGameLogic.ts`, `GameSetup.tsx`, `App.tsx` |
| `0610537` | perf(P3): lazy-load audio sprites, harden division generation | `useGameLogic.ts`, `audio.ts`, `App.tsx`, `SettingsScreen.tsx` |
| `2720e86` | perf(P2): wrap avgTime/percentage in useMemo | `useGameLogic.ts` |
| `1ead017` | fix(P1): navigation integrity, UX friction, label consistency | `useGameLogic.ts`, `GameScreen.tsx`, `Keypad.tsx`, `GameSetup.tsx`, `MainMenu.tsx`, `SettingsScreen.tsx` |
| `f835ed3` | fix(P0): correct math logic bugs and fraction data persistence | `questions.ts`, `fractions.ts`, `database.ts`, `App.tsx` |

---

## Phase 1 — Square Root Custom Range

### What changed

**`src/constants.ts`**
- Added `DEFAULT_SQRT_RANGE: [1, 35]` — default state for custom range inputs
- Replaced unused `EASY_SQUARE_ROOT_MAX` / `MEDIUM_SQUARE_ROOT_MAX` / `HARD_SQUARE_ROOT_MAX` with `SQRT_RANGES` map

**`src/utils/questions.ts`**
- `generateSquareRootQuestion(diff, range?)` now accepts optional `[number, number]` range
- If `range` is provided: picks root uniformly from that range, always renders a perfect square
- If `range` is omitted: uses difficulty-based defaults:
  - Easy: roots 1–10
  - Medium: roots 11–25
  - Hard: roots 26–35

**`src/hooks/useGameLogic.ts`**
- Added `sqrtRangeType` (default `'fixed'`) and `customSqrtRange` (default `[1, 35]`) state
- `generateNextQuestion` for `mode === 'square-root'` passes `customSqrtRange` when `sqrtRangeType === 'custom'`, else `undefined`

**`src/components/GameSetup.tsx`**
- New "Square Root Range" section with `By Difficulty` / `Custom` toggle
- Custom mode reveals min/max root inputs (1–999)
- Difficulty slider is visually disabled (`opacity-40 pointer-events-none`) when custom range is active
- Shows helper text: "Difficulty ignored when using custom range"

**`src/App.tsx`**
- Passes new `sqrtRangeType`, `customSqrtRange`, `onSqrtRangeTypeChange`, `onCustomSqrtRangeChange` props to GameSetup

### Behavior summary

| Condition | Root range | Difficulty respected |
|-----------|-----------|---------------------|
| `By Difficulty` + Easy | 1–10 | Yes |
| `By Difficulty` + Medium | 11–25 | Yes |
| `By Difficulty` + Hard | 26–35 | Yes |
| `Custom` + any difficulty | User-specified | No (slider grayed out) |

---

## Phase 2 — Bug Fixes

### Streak never persisted (P0)

`getStreak()` in `notifications.ts` reads `streak` from the `zenmath-daily-progress` localStorage object, but the persistence code only ever wrote `{ date, count }`. The `streak` field was always missing, so `getStreak()` always returned `0` — streak-based notification messages were dead code.

**Fix:**
- Initial load effect now reads optional `bestStreak` field and restores it
- Persistence effect now writes `{ date, count, bestStreak }` and depends on both `dailyProgress` and `bestStreak`
- `bestStreak` is also reset to 0 on new days

### selectMode — redundant branches (P1)

`case 'square':` and `case 'fraction':` in `selectMode` had the same body as the `default` branch (`setScreen('setup')`). Removed both redundant cases.

### Debug labels in production (P2)

Subtraction mode toggle displayed internal labels `"State A: Forced"` / `"State B: Positive Only"`. Changed to `"Negative answers forced"` / `"Positive results only"`.

---

## Phase 3 — Stale Closure & PWA Assets

### Results count off by 1 (19/20 instead of 20/20)

**Root cause:** `advanceToNext` was captured in a `setTimeout` callback inside `handleSubmit`/`handleTimeout`. When `recordResult` called `setResults`, React queued a re-render that created a new `advanceToNext` with updated `results`. But the `setTimeout` still held the old closure. For the *last* question, `advanceToNext` read stale `results` (missing the final entry), reporting 19 instead of 20.

**Fix:** Added `advanceToNextRef` — a `useRef` that always points to the latest `advanceToNext`. Both `setTimeout` calls now invoke `advanceToNextRef.current()`, ensuring they always resolve the latest closure.

### PWA notification icons offline

The 192×192 icon was missing `purpose: 'any maskable'`, which Android requires for proper rendering. Also added `audio/*.{wav,json}` to `includeAssets` and `.webmanifest` to `globPatterns` so audio sprites and manifest files are precached for offline use.

---

## All fixes (across all audit rounds)

| Priority | Issue | Fix | Commit |
|----------|-------|-----|--------|
| P0 | Subtraction `num1 < num2` without swap | Swapped in-place when `num1 < num2` | `f835ed3` |
| P0 | 75% percentage: `4/3` multiplier → non-integer | `m * 4` base construction | `f835ed3` |
| P0 | "whatPercent" type could give non-integer pct | Enforce exact divisibility via `gcd` | `f835ed3` |
| P0 | Fraction data types: `correctAnswer` and `userAnswer` coerced to number | Widened to `number \| string` | `f835ed3` |
| P1 | Hash-routing double-render on setScreen | Removed redundant `setScreenInternal` call | `1ead017` |
| P1 | `#playing` back-button race when game not started | Stale-state guard checks `currentQuestion === 0` | `1ead017` |
| P1 | selectTableRange duplicated 55 lines of question gen | Replaced with `requestAnimationFrame(() => generateNextQuestion(1))` | `1ead017` |
| P1 | `/` key enabled in non-fraction modes | `opacity-30` + disabled when `showFraction === false` | `1ead017` |
| P1 | Listen Only mode: no fallback when TTS fails | 3s `ttsFailed` timeout reveals question text | `1ead017` |
| P1 | "exercises" label instead of "sessions" | Renamed across MainMenu, SettingsScreen, notifications | `1ead017` |
| P2 | `avgTime` / `percentage` recomputed on every render | `useMemo` with correct deps | `2720e86` |
| P3 | Audio sprites loaded eagerly on mount | Lazy-loaded on first HD Voice enable in Settings | `0610537` |
| P3 | Division generation: `qMin/qMax` could put `num1` out of digit range | Simplified guard guarantees `num1` stays in target range | `0610537` |
| P0 | Streak never persisted to localStorage | Added `bestStreak` to daily progress object | `75a6d13` |
| P0 | Stale closure in setTimeout drops last result (19/20) | `advanceToNextRef` always resolves latest advanceToNext in timeouts | `cfcb577` |
| P0 | White screen: const reassignment in generateApproximationQuestion | Changed `const` → `let` for `num1`/`num2` | `8301ed0` |
| P1 | selectMode redundant branches (`square`, `fraction`) | Removed, consolidated to default | `75a6d13` |
| P1 | currentQuestion used before declaration (TS build error) | Hoisted before hashchange effect | `8301ed0` |
| P2 | Debug labels visible in production | Replaced with user-facing text | `75a6d13` |
| P2 | Missing useMemo deps, unused imports | Added deps, removed unused imports | `8301ed0` |
| — | Offline notification icons missing | Added `purpose: any maskable` to 192×192 icon, audio/* to includeAssets, .webmanifest to globPatterns | `cfcb577` |
| — | Square root: customizable range with difficulty defaults | New UI section, updated generator | `0e79022` |

---

## File-by-file summary

| File | Role | Changes |
|------|------|---------|
| `src/utils/questions.ts` | Question generators | `generateSquareRootQuestion` accepts optional range; simplified to always produce perfect squares |
| `src/hooks/useGameLogic.ts` | Central game state | Added sqrt range state, streak persistence, selectMode cleanup |
| `src/components/GameSetup.tsx` | Pre-game configuration | New sqrt range section, disabled difficulty for custom, fixed debug labels |
| `src/App.tsx` | Root component | Passes sqrt range props |
| `src/constants.ts` | App-wide constants | `DEFAULT_SQRT_RANGE`, `SQRT_RANGES` map |
