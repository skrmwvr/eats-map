# Sun Map Template Specification: 2x7 Coarse Bottom Toolbar Grid

## 1. Overview & Architectural Philosophy
The bottom toolbar in Sun Map applications (including Eats Map, Live Music Companions, and Festival Grounds) is not a generic tab bar. It is a tactile, hardware-anchored **cockpit** designed around a coarse **2-Row by 7-Column Grid ($2\text{t} \times 7\text{w}$)** spanning the mobile viewport.

---

## 2. The $2 \times 7$ Coarse Grid Matrix

```text
       Col 1        Col 2        Col 3        Col 4        Col 5        Col 6        Col 7
   ┌────────────┬────────────┬────────────┬────────────┬────────────┬────────────┬────────────┐
   │                         │ [🗺️ Map]   │            │  [❓ Help] │                         │
R1 │    MENU         MENU    │ (Bathrooms │    MAIN    │  (Safety   │  WISHLIST   WISHLIST   │
   │   (Bay L)      (Bay L)  │  & Water)  │ (Sun Dome) │   & Info)  │   (Bay R)   (Bay R)    │
   ├────────────┴────────────┼────────────┼────────────┼────────────┼────────────┴────────────┤
   │                         │            │            │            │                         │
R2 │    MENU         MENU    │    MAIN    │    MAIN    │    MAIN    │  WISHLIST   WISHLIST   │
   │   (Bay L)      (Bay L)  │   (Base)   │   (Base)   │   (Base)   │   (Bay R)   (Bay R)    │
   └─────────────────────────┴────────────┴────────────┴────────────┴─────────────────────────┘
   ◄──────── 2 Units ───────►◄──────────── 3 Units ────────►◄──────── 2 Units ───────►
                                Total = 7 Width Units (28.5% | 43% | 28.5%)
```

---

## 3. Element Definitions & Spatial Allocations

### 1. Left Action Bay (`MENU` / `BAND`) — $2 \times 2$ Units
* **Grid Span**: Row 1–2, Columns 1–2 ($28.5\%$ width).
* **Role**: Primary high-frequency exploration anchor (Artists, Stages, Food Vendors, Recipes).
* **Anatomy**: Icon (`📖` / `🎸`), Bold Label (`Menu` / `Band`), Live Dynamic Subtitle (`8 Booths`).

### 2. Right Action Bay (`WISHLIST` / `TOUR`) — $2 \times 2$ Units
* **Grid Span**: Row 1–2, Columns 6–7 ($28.5\%$ width).
* **Role**: Personalized attendee queue (Tasting Passport, Setlist Queue, Starred Items).
* **Anatomy**: Icon (`⭐` / `🌎`), Bold Label (`Wishlist` / `Tour`), Live Dynamic Counter (`0 Saved`).

### 3. Center Sun Anchor (`MAIN` / `HOME`) — $3 \text{ Base Units} \times \text{Raised Dome}$
* **Grid Span**:
  - **Base (Row 2)**: Columns 3, 4, 5 ($43\%$ width).
  - **Apex (Row 1)**: Column 4 (Sun graphic dome / emblem).
* **Role**: The central brand anchor of the app. Tapping it resets or navigates to the primary Home view.
* **Shape Flexibility**: Inverted-T or bell-domed apex. The central solar graphic expands into C4/R2 to look perfectly in-line with the Menu and Wishlist buttons while breathing comfortably across bespoke skins and skeuomorphic themes.

### 4. Left Wing (`BATHROOM / GROUNDS MAP`) — $1 \times 1$ Unit
* **Grid Span**: Row 1, Column 3 (Upper-left shoulder of the Sun).
* **Role**: 1-tap jump to the interactive vector grounds map with highlighted restrooms, water stations, and GPS car location.
* **Touch Target**: Padded 32px circular pill, comfortably accessible without competing with the primary bay.

### 5. Right Wing (`HELP / SAFETY GUIDE`) — $1 \times 1$ Unit
* **Grid Span**: Row 1, Column 5 (Upper-right shoulder of the Sun).
* **Role**: 1-tap emergency first aid (Gate 1), security dispatch, and concise 1–2 line truncated About guide with deep-links to full ethos.
* **Touch Target**: Padded 32px circular pill, constant unchanging safety net.

---

## 4. Theming & Human Aesthetic Tweaks
* **Coarse Relationships**: The $2 / 3 / 2$ unit proportions ($28.5\% / 43\% / 28.5\%$) represent the base relationship. Human designer styling, padding variations, skeuomorphic bevels, glow rings, or indicator lights may introduce subtle millimeter wobbles from app to app.
* **Accessibility (a11y)**: Every button maintains accessible tap hitboxes and screen-reader `aria-label` tags regardless of visual organic shaping.
