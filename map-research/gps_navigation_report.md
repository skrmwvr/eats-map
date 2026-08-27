# GPS Navigation Feature Implementation Report

## Overview
Implementing a "Google Maps or Waze" style navigation screen requires a blend of clear, distraction-free UI, robust mapping libraries, and dynamic theming capabilities. The goal is to provide users with a seamless way to navigate festival or event grounds while maintaining a thematic aesthetic.

## UI/UX Design Guidelines

### 1. Minimalist Map Interface
- **Clear Base Map:** The underlying map should have a low-contrast, neutral color palette (National Park vibes: topographic lines, soft tans, sage greens, or deep slate/charcoal for dark mode).
- **Unobtrusive Controls:** Keep zooming, panning, and centering controls small and out of the way. 
- **Bottom Sheet Architecture:** Similar to Google Maps, use a bottom sheet for search, destination categories, and routing details. This keeps the map visible while providing a tactile, easy-to-reach interaction area for mobile users.

### 2. Destination Categories
The navigation system should prioritize quick access to essential and common destinations:
- 🚽 **Potties:** High visibility, perhaps with real-time "busy" indicators if data allows.
- 🚪 **Exits:** Clear routing to main exits.
- 🚨 **Emergency Exits / First Aid:** Highlighted in standard safety colors (red/white) regardless of the band accent theme, for safety reasons.
- 🚗 **Car Finder:** A dynamic pin dropped by the user, with a simple compass or route back.
- 👯 **Friend Finder:** Dynamic markers for linked friends, with real-time location updates.
- 🍔 **Vendors:** Generic categories (Food, Booze, Merch). Avoid branding on the map to maintain the "nicer national park" aesthetic.

## Theming Architecture

### Neutral Base + Band Accents
To achieve the requirement of syncing navigation elements to band accents while keeping the base map neutral:
1. **Map Tiles:** Use a custom-styled vector map (via Mapbox Studio or similar). Strip out unnecessary POIs and use monochrome or duotone styling. 
2. **CSS Variables (Custom Properties):** Define the base map UI elements using neutral CSS variables. Define an `--accent-color` variable that can be updated dynamically via JavaScript when the band changes.
3. **Accent Application:** Apply the `--accent-color` strictly to interactive elements and route lines.
   - **Route Path:** The active navigation line should use the accent color, possibly with a glowing effect.
   - **Active Pins:** The selected destination marker uses the accent color.
   - **Primary Buttons:** "Start Navigation", "Center", etc.

### Light / Dark Mode
- **Light Mode:** Sand/parchment background, subtle green/brown topography lines. Dark gray text.
- **Dark Mode:** Deep forest green or slate gray background, muted light green/gray topography lines. Off-white text.
- Both modes must ensure the dynamic `--accent-color` remains legible (e.g., using a slightly lighter or darker shade of the accent color for contrast if needed).

## Recommended Technology Stack

1. **Map Rendering:** **Mapbox GL JS**
   - *Why:* Unparalleled vector styling capabilities. You can create a completely custom, minimal "National Park" base style in Mapbox Studio and easily swap out colors dynamically at runtime.
   - *Alternative:* **Leaflet** with custom tile providers (like Stadia Maps or MapTiler), though vector styling at runtime is harder.
2. **Routing / Navigation:** 
   - If routing on custom paths (like temporary event grounds), you'll need to define a custom routing graph. Tools like **GraphHopper** or **Mapbox Navigation API** (with custom datasets) can handle this.
   - For simple point-to-point without exact pathing, a direct line or simple compass bearing (as-the-crow-flies) is often sufficient for open fields.
3. **State Management:** 
   - Use a lightweight global store (Zustand, Redux, or Context API) to manage the current `accentColor`, `theme` (light/dark), and `userLocation`.

## Implementation Steps
1. Design the base vector map in Mapbox Studio (Light & Dark variations).
2. Implement the Mapbox GL JS component in the app.
3. Overlay the HTML/CSS UI (search bar, bottom sheet).
4. Connect the UI to the map state (centering on user, dropping pins).
5. Implement the dynamic CSS variable logic for the band accents.
