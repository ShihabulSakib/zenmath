# Scroll Restoration Implementation Log

This document tracks the steps taken to implement and fix vertical scroll restoration for the ZenMath homepage (Main Menu).

## Step 1: Analysis of Existing Implementation
- **Current Logic:** Found in `src/components/MainMenu.tsx` using `useEffect` and `requestAnimationFrame`.
- **Identified Flaw:** The restoration occurs in a single `requestAnimationFrame` which may fire before the Flexbox/OLED-optimized layout has stabilized, leading to inconsistent scroll positions.
- **Storage Strategy:** `sessionStorage` is correctly used to persist coordinates across the session without bloating `localStorage`.

## Step 2: Refining the Restoration Timing (Completed)
- **Action:** Migrated from `useEffect` to `useLayoutEffect`.
- **Reasoning:** `useLayoutEffect` fires synchronously after all DOM mutations but before the browser has a chance to paint. This reduces visual flickering.
- **Timing Fix:** Implemented a "Double Request Animation Frame" pattern. This ensures that even if the layout is calculated across multiple frames (common with complex CSS-in-JS or Flexbox), the scroll assignment waits for the next paint cycle where the scroll height is guaranteed to be stable.
- **Key Centralization:** Moved the key to `SCROLL_STORAGE_KEY = 'zenmath-menu-scroll-position'` to avoid collision with other potential features.

## Step 3: Robust Event Handling (Completed)
- **Action:** Retained passive event listener for performance.
- **Logic Update:** Explicitly added a "Final Save" in the cleanup function of the hook. This ensures that even if a navigation event (like selecting a game mode) happens too fast for a scroll event to fire, the absolute latest position is captured during the React unmounting phase.

## Step 4: Troubleshooting First Iteration Failure (Completed)
- **Problem:** The restoration was still inconsistent or failing.
- **Root Cause Analysis:** 
    1. **Layout Collapse on Unmount:** When React unmounts a component, the DOM element's height may collapse to 0 before the cleanup function finishes. This resulted in `scrollTop` returning 0 and overwriting the valid saved coordinate in `sessionStorage`.
    2. **Late Layout Stability:** In some browsers (especially mobile), the scrollable container's `scrollHeight` is not immediately available even in the first few animation frames if images or complex Flexbox layouts are still settling.

## Step 8: Eliminating Restoration Race Conditions (Completed)
- **Problem:** `MainMenu` was reading `sessionStorage` before `App` could clear it on reload, leading to "ghost" scroll positions.
- **Action:** Moved `sessionStorage.removeItem` to the top-level module scope in `App.tsx`. This ensures it executes the moment the JS bundle is loaded, well before React begins mounting components.

## Step 9: Synchronized Restoration & Stale Data Prevention (Completed)
- **Problem:** If the content height changed (making a previous scroll position impossible), the storage would keep the old "impossible" value, causing weird behavior on subsequent navigations.
- **Action:** Added a "Sync-Back" mechanism. If the restoration retry loop reaches its limit (15 attempts) or hits the bottom of the container without reaching the target, it now updates `sessionStorage` with the *actual* achieved position.
- **Action:** Added a 50ms debounce to the scroll listener. This prevents excessive writes to `sessionStorage` while ensuring the "final" scroll position of a movement is captured accurately.
- **Action:** Removed all "Zero-Guards." Scrolling to 0 is now a first-class citizen and correctly resets the session position.

## Technical Details (Final):
- **Primary Reset:** Module-level execution in `App.tsx`.
- **Restoration:** 15-frame retry loop with `atBottom` detection and `Sync-Back`.
- **Persistence:** Debounced passive listener on the `main` ref.

