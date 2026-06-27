# Firebase Configuration & Architectural Guide

This directory contains the production-ready infrastructure files for deploying **Sun Map** to Firebase.

## Setup Contents

- `firebase.json`: Main project configuration for Hosting, Firestore, and Functions.
- `firestore.rules`: Declarative security rules for waypoints and admin alerts.
- `firestore.indexes.json`: Database query index optimization.
- `functions/`: Code for the NOAA Weather API proxy caching server.

---

## 1. Hosting Architecture (PWA Shell)

Firebase Hosting acts as the entry point and CDN.

- **Aggressive Caching**: Standard assets like JS, CSS, fonts, and images are cached for up to 1 year (`max-age=31536000, immutable`).
- **No Cache for Core Shell**: `index.html` and the Service Worker (`sw.js`) are set to `no-cache, no-store, must-revalidate` to ensure users instantly receive updates when a new version of the concert guide is published.
- **Single Page App Routing**: All traffic rewrite rules direct back to `/index.html` to support client-side routing.

---

## 2. Firestore Schema Design

### Collection: `waypoints`
Stores shared user-pinned waypoints (e.g., parking location sharing or meetup spots).

```typescript
interface Waypoint {
  id: string;             // Generated Firestore ID or custom short code
  createdBy: string;      // Anonymous or Auth UID of the creator
  createdAt: Timestamp;   // Server timestamp of creation
  locationName: string;   // Human-readable spot (e.g., "Nissan Stadium East Bank Lot R")
  coordinates?: GeoPoint; // Optional coordinates for exact mapping
  notes?: string;         // Extra detail (e.g., "Parked next to light pole 4")
}
```

### Collection: `alerts`
Stores real-time event updates and hazard warnings shown on the main banner.

```typescript
interface Alert {
  id: string;             // Unique alert ID
  title: string;          // Short banner headline (e.g., "Storm Warning")
  message: string;        // Full details (e.g., "Shelter in place until 7:30 PM")
  severity: string;       // "info" | "warning" | "critical"
  active: boolean;        // Active state toggling
  createdAt: Timestamp;   // Timestamp
  expiresAt: Timestamp;   // When the alert should automatically disappear
}
```

---

## 3. Firestore Security Rules & Indexes

- **Waypoints**:
  - `read`: Open to any guest/user with the direct sharing link.
  - `create`: Must be authenticated (anonymous auth is recommended for concerts/events). Enforces creation bounds (location name < 150 chars, owner UID must match active user, and `createdAt` must match server time).
  - `update`/`delete`: Only the owner of the waypoint (`request.auth.uid == resource.data.createdBy`) can edit or delete it.
- **Alerts**:
  - `read`: Publicly readable by all application users.
  - `write`: Restricted to Admin accounts (checked via custom token claims: `request.auth.token.admin == true`).

---

## 4. NOAA Weather Proxy Cache (Cloud Functions)

To prevent client devices from spamming the NOAA Weather API (which has strict rate limits and is prone to performance degradation during crowded concert events):

- A Cloud Function is set up at `/api/weather`.
- It fetches the hourly forecast directly from NOAA (`gridpoints/OHX/50,71/forecast/hourly` for Nashville).
- It attaches Cache-Control headers of 5 minutes to Firebase Hosting (`s-maxage=300`), which allows Firebase's global CDN edges to cache the weather data. Thousands of simultaneous users will receive the cached response near-instantaneously without triggering NOAA API limits.

---

## 5. Deployment Instructions

Ensure you have the Firebase CLI installed:
```bash
npm install -g firebase-tools
```

1. **Log in to Firebase**:
   ```bash
   firebase login
   ```
2. **Initialize or Bind Project**:
   ```bash
   firebase use --add [your-firebase-project-id]
   ```
3. **Deploy the configuration from the repository root**:
   ```bash
   # Copy configs to root or deploy directly referencing the files
   firebase deploy
   ```
