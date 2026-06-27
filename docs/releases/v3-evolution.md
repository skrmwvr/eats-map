# Sun Map — Version 3 Evolution Release Notes

Welcome to the **V3 Evolution** release of Sun Map, the ultimate live concert companion. This release focuses on upgrading visual legibility under low-light venue conditions, introducing a retro-modern Zune-inspired interactive song/lyrics switcher, establishing a rich database for live song variations, and optimizing offline performance for progressive web app (PWA) loads.

---

## 🎨 Typographic & Visual Identity: Segoe UI Adaptation

To support optimal legibility in dynamic concert environments (lasers, strobe lights, and outdoor night conditions), we have overhauled the app's detailed views with a modern, high-contrast typographic system centered on **Segoe UI**.

### Key Changes
- **Font Face Optimization**: Switched `.details-view` elements from Inter to a robust system font stack headed by `Segoe UI` (with fallbacks to `-apple-system`, `BlinkMacSystemFont`, `Roboto`, and generic `sans-serif`).
- **Enhanced Hierarchy**:
  - Increased `h2` heading sizing from `1.4rem` to `1.5rem` with a clean bottom border.
  - Upgraded `h3` category subheaders from `0.95rem` to `1.15rem` for distinct section breaking.
  - Adjusted paragraphs (`p`) and list items (`li`) from `0.85rem` to `1.05rem` to prevent squinting.
- **Improved Spacing & Contrast**:
  - Incremented line-height to `1.5` on body copy and `1.4` on list elements.
  - Styled list indicators (`■` bullet points) with a dedicated color accent and resized to `0.6rem` for cleaner alignment.
  - Widened the viewport padding from `20px` to `26px 22px` to let details "breathe" on edge-to-edge mobile screens.

---

## 📱 Zune-Style Interactive Song Switcher

Drawing inspiration from the clean, grid-and-list typographic menus of the classic Zune and modern karaoke machines, the center screen features an artsy viewport that transitions smoothly between tracks.

### Features
- **Dynamic Track Jumplist**: A drop-down selection list (`#track-select`) allows users to jump instantly to any projected track in the artist's setlist.
- **Integrated Controllers**: Center-aligned navigation keys (`◀` and `▶`) trigger smooth transitions between tracks.
- **Visual Glitch Overlay**: Viewport switches trigger a temporary static/glitch animation overlay (`.static-overlay` and `.screen-glitch`) matching the lo-fi retro theme.

---

## 🎤 Live Variations Database

Concerts rarely match studio records note-for-note. To bridge this gap, v3 introduces an offline-ready **Live Variations Database** mapping setlist tracks to their live tour deviations.

### Data Structure & Integration
Stored inside `fill-data/band/setlist-lyrics-and-live-variations.json`, the database links each song to:
- **Arrangement & Instrumentation**: Highlights shifts (e.g., stripping acoustic instruments like the charango in *Superposition* or utilizing percussive piano in *Hospital Beds*).
- **Vocal Delivery & Ad-libs**: Alerts fans to signature falsettos, grit, or key phrase extensions (e.g., Sameer Gadhia's grit in *My Body*).
- **Crowd Sing-Alongs & Dynamics**: Details when the crowd is expected to take over key choruses or participate in call-and-response hooks (e.g., *Cough Syrup* or *First*).

The UI dynamically parses this data block and displays a highlighted **Tour Live Variations** card inside the lyrics panel.

---

## ⚡ Performance & PWA Optimizations

Under-the-hood improvements ensure that even with spotty cellular service inside crowded arenas, the app loads setlists instantaneously.

### Parallel Fetching Ingestion
- **Async Execution**: Replaced sequential `for...of` loops with parallelized `Promise.all` fetches. All song JSONC configuration objects are now fetched asynchronously in parallel, drastically reducing the blocking time during artist switching or initial cold-starts.
- **Resilient Fallbacks**: If individual song bundles fail to fetch, the app gracefully filters out the missing slots while maintaining a stable state instead of crashing.
