# sm0626-bundle-contract-spec.md
# Concert Companion App — Bundle Contract Spec
# Package: antigravity-handoff v0.1.0
# Scope: Young the Giant / Victory Garden Tour / Ascend FCU Amphitheater / 2026-06-27

---

## 1. Purpose

This document is the canonical contract for how the Concert Companion App
structures, names, stores, and exports data. It governs the shape of every
entity object, the rules for bundles, the provenance model, and the export
pipeline. Antigravity should treat this file as the source of truth for any
decision about how to model, label, or attach data.

---

## 2. System Overview

The Concert Companion App is a web-page-based event intelligence app for live
music fans. It ingests content from official and semi-official web sources,
groups information by entity layer rather than by raw source, normalizes it
into reusable bundles, and serves both deterministic UI rendering and AI
context delivery.

The data model is entity-first. Each entity (Artist, Tour, Venue, Event, Song,
Performance Context) is its own stable object with a stable ID. Bundles are
derived views assembled from entity objects for a specific rendering or
delivery purpose. Bundles are not the source of truth — entities are.

---

## 3. Entity Model

### 3.1 Core Entities

| Entity | ID Pattern | Description |
|---|---|---|
| Artist | `artist:{kebab-slug}` | A performing artist or band |
| Tour | `tour:{artist-slug}-{tour-slug}` | A named tour by an artist |
| Venue | `venue:{kebab-slug}` | A physical performance venue |
| Festival | `festival:{festival-slug}-{year}` | A multi-day event wrapper pointing to daily Events |
| Event | `event:{slug}-{date}` | A single dated show (or a single day of a festival) |
| Song | `song:{artist-slug}-{song-slug}` | A canonical song in the artist catalog |
| PerformanceContext | `perf-ctx:{event-id}-{artist-slug}-{song-slug}` | Live arrangement details for a song at a specific event |
| Source | `source:{type}-{slug}` | A provenance-tracked web or document source |
| Bundle | `bundle:{verb}-{noun}` | A derived view assembled for rendering or AI delivery |

### 3.2 Entity Field Conventions

- All field names: `snake_case`
- All enum values: `snake_case`
- All object IDs: `type:kebab-case-slug`
- Display names: optional `display_name` field on all proper-noun entities
- Confidence: float `0.00`–`0.99` (never `1.0`; `1.0` is reserved as unreachable certainty)
- Lifecycle: see PASS_PLAN.md for full lifecycle state machine

---

## 4. Schema Spec

### 4.1 Artist

```jsonc
{
  // Stable artist identity
  "id": "artist:young-the-giant",
  "type": "artist",
  "name": "Young the Giant",
  "display_name": "Young the Giant",
  "slug": "young-the-giant",

  // Core facts
  "origin_city": null,
  "origin_country": null,
  "active_since_year": null,
  "genre_tags": [],

  // Links
  "official_url": null,
  "social_urls": {},

  // Provenance
  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.2 Tour

```jsonc
{
  "id": "tour:young-the-giant-victory-garden-tour",
  "type": "tour",
  "name": "Victory Garden Tour",
  "display_name": "Victory Garden Tour",
  "slug": "victory-garden-tour",

  "artist_id": "artist:young-the-giant",
  "year": 2026,
  "active": true,

  // Dates are strings ISO 8601
  "start_date": null,
  "end_date": null,

  "event_ids": [],
  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.3 Venue

```jsonc
{
  "id": "venue:ascend-federal-credit-union-amphitheater",
  "type": "venue",
  "name": "Ascend Federal Credit Union Amphitheater",
  "display_name": "Ascend Amphitheater",
  "slug": "ascend-federal-credit-union-amphitheater",

  "city": "Nashville",
  "state": "TN",
  "country": "US",
  "capacity": null,
  "is_outdoor": null,

  // Utility facts — parking, bag policy, accessibility
  "utility": {
    "parking_url": null,
    "bag_policy_url": null,
    "accessibility_url": null,
    "gates_open_offset_minutes": null,
    "clear_bag_required": null,
    "stage_navigation": null, // Guidance on confusing stage names (e.g., "Stage Blue Moon")
    "notes": []
  },

  "official_url": null,
  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.4 Festival (Multi-Day Wrapper)

```jsonc
{
  "id": "festival:lollapalooza-2026",
  "type": "festival",
  "display_name": "Lollapalooza 2026",
  
  "venue_id": "venue:grant-park",
  "year": 2026,
  
  "start_date": null,
  "end_date": null,
  
  // Festival bundles just point to the daily Events to keep loads lightweight
  "daily_event_ids": [],
  "prior_day_recap_bundle_ids": [], // For quick access to prior day wraps

  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.5 Event

```jsonc
{
  "id": "event:young-the-giant-nashville-2026-06-27",
  "type": "event",
  "display_name": "Young the Giant — Nashville, TN — 2026-06-27",

  "festival_id": null, // If part of a festival wrapper
  "tour_id": "tour:young-the-giant-victory-garden-tour",
  "venue_id": "venue:ascend-federal-credit-union-amphitheater",
  "date": "2026-06-27",

  // Times local to venue timezone
  "doors_time": null,
  "show_time": null,
  "end_time": null,

  // Complex Lineups
  "headliner_ids": ["artist:young-the-giant"],
  "support_ids": [],
  "special_guest_ids": [],
  
  "setlist_id": null,

  // Weather snapshot — captured at ingest, updated at event
  "weather": {
    "forecast_summary": null,
    "temp_f_high": null,
    "temp_f_low": null,
    "precipitation_chance": null,
    "conditions": null,
    "source_url": null,
    "captured_at": null
  },

  // Post-event actuals populated in Pass 4
  "actuals": {
    "attendance": null,
    "notes": []
  },

  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.6 Song

```jsonc
{
  "id": "song:young-the-giant-mind-over-matter",
  "type": "song",
  "name": "Mind Over Matter",
  "display_name": "Mind Over Matter",
  "slug": "mind-over-matter",

  "artist_id": "artist:young-the-giant",
  "album_id": null,
  "release_year": null,
  "track_number": null,

  // Stable musicality — canonical key and tempo, not live-specific
  "musicality": {
    "canonical_key": null,
    "tempo_bpm": null,
    "time_signature": null,
    "primary_genre": null
  },

  // Micro-summary generated in Pass 2, stable by Pass 3
  "micro_summary": null,

  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.7 PerformanceContext

```jsonc
{
  // Live arrangement differences belong here, not on the Song object
  "id": "perf-ctx:event:young-the-giant-nashville-2026-06-27-mind-over-matter",
  "type": "performance_context",

  "event_id": "event:young-the-giant-nashville-2026-06-27",
  "artist_id": "artist:young-the-giant",
  "song_id": "song:young-the-giant-mind-over-matter",

  "stage_name": null, // Essential for multi-stage festivals
  "setlist_position": null,
  "set_number": null,
  "is_opener": false,
  "is_closer": false,
  "is_encore": false,

  // Live-specific variations
  "live_key": null,
  "live_tempo_bpm": null,
  "live_notes": null,
  "guest_artist_ids": [],

  "sources": [],
  "confidence": null,
  "lifecycle": "stub"
}
```

### 4.8 Source (Provenance)

Modeled after a simplified Wikidata/W3C PROV hybrid. The goal is
standard-inspired provenance, custom domain schema.

```jsonc
{
  "id": "source:web-ascend-event-page",
  "type": "source",

  // Classification
  "source_class": null,         // see ENUMS: source_class
  "source_strength": null,      // see ENUMS: source_strength

  "url": null,
  "captured_at": null,
  "capture_method": null,       // "scrape" | "manual" | "screenshot" | "download" | "generated"

  // W3C PROV-style lineage (optional)
  "derived_from_ids": [],       // other source IDs this was derived from
  "generated_by": null,         // "human" | "antigravity" | "inference_pass"

  // Claims attached to this source
  "claims": [],

  "confidence": null,
  "lifecycle": "stub"
}
```

---

## 5. Bundle Contract

### 5.1 What a Bundle Is

A bundle is a derived view assembled from entity objects for a specific
rendering or AI delivery purpose. Bundles are read-only projections — they
do not store canonical facts. All canonical facts live on entity objects.

### 5.2 Bundle Naming

Pattern: `bundle:{verb}-{noun}`

Examples:
- `bundle:check-weather`
- `bundle:serve-song-fast-view`
- `bundle:serve-event-summary`
- `bundle:serve-recap`

### 5.3 Export Profiles

| Profile | Target | Format | Comments stripped |
|---|---|---|---|
| `ai_context` | LLM context window | `.json` | Yes |
| `ui_render` | Web UI component | `.json` | Yes |
| `archive` | Long-term storage | `.jsonc` | No |
| `debug` | Developer inspection | `.jsonc` | No |

### 5.4 Hot / Warm / Cold

| State | Meaning |
|---|---|
| `hot` | Active event window — high-frequency refresh eligible |
| `warm` | Recent or upcoming — normal refresh cadence |
| `cold` | Historical or inactive — low/no refresh |

---

## 6. Authoring and Export Pipeline

### 6.1 File Format

- Authoring: `.jsonc` (conservative — comments allowed, otherwise strict JSON shaped)
- Machine export: `.json` (strict, comments stripped, validated before use)
- Validation spec: `seed-schema.json`

### 6.2 JSONC House Rules

**Allowed:**
- Single-line `//` comments
- Block `/* */` comments for short section notes
- Double-quoted keys and strings
- Arrays and objects exactly shaped like normal JSON

**Forbidden:**
- Trailing commas
- Unquoted keys
- Single-quoted strings
- JSON5-only numeric syntax

**Comment conventions:**
- Comments go above the field they describe, not trailing inline
- Use comments for: why, editorial intent, workflow hints, field meaning
- If a note is machine-meaningful, promote it to a real field (`notes`, `status`, `tags`, `editorial_note`, `confidence_note`)
- Rule: comment = human guidance / field = machine-meaningful content

### 6.3 Export Rules

Before machine use:
1. Strip comments
2. Validate result as strict JSON
3. Fail export if: trailing commas, unquoted keys, single-quoted strings

---

## 7. Governance

### 7.1 Roles

| Role | Responsibility |
|---|---|
| `owner` | Defines contracts and makes breaking changes |
| `steward` | Maintains day-to-day doc health |
| `reviewer` | Reviews ingest quality and escalations |
| `automation` | Antigravity and inference jobs |

### 7.2 Source Strength Policy

Official sources outrank semi-official, which outrank community, which
outrank inferred. Conflicting active event facts from two official sources
are an escalation trigger — do not auto-resolve.

### 7.3 Confidence Policy

- `0.90+` — high confidence, suitable for stable promotion
- `0.70–0.89` — medium confidence, eligible for draft
- `< 0.70` — low confidence, stub only, flag for review
- Never assign `1.0`

**Bundle Confidence Aggregation Algorithm:**
*   **Bundle confidence = minimum confidence among critical-field claims only.**
*   Non-critical enrichment claims do not factor into bundle confidence. They may be surfaced separately as `enrichment_confidence` if useful.
*   If no critical claims have explicit confidence scores yet, bundle confidence inherits `null` — do not default to zero.
*   Bundle confidence is `null` until at least one critical-field claim has a score. A bundle with `null` confidence is not eligible for `draft`.

### 7.4 Critical Fields for Promotion

To be promoted to `draft` or `stable`, an entity must have all of its designated **critical fields** populated with non-null values:

| Entity | Critical Fields |
|---|---|
| Artist | `id`, `name`, `slug` |
| Tour | `id`, `name`, `slug`, `artist_id`, `year` |
| Venue | `id`, `name`, `slug`, `city`, `state` |
| Festival | `id`, `name`, `slug`, `venue_id`, `year` |
| Event | `id`, `venue_id`, `date` (and at least one of `headliner_ids` or `festival_id`) |
| Song | `id`, `name`, `slug`, `artist_id` |
| PerformanceContext | `id`, `event_id`, `artist_id`, `song_id`, `setlist_position` |
| Source | `id`, `url`, `source_class`, `captured_at` |

*   **Draft Gate**: All critical fields populated and confidence $\ge 0.70$. Everything else is enrichment-eligible and may be null.
*   **Stable Gate**: All critical fields populated and confidence $\ge 0.90$.

### 7.5 Real-Time Show-Day Execution Rules (Pass 4)

These operational rules apply on the day of the show (2026-06-27):

**Weather Update Ingestion Frequency:**
*   **Pre-show** (now through 3 hours before doors): refresh every 2 hours.
*   **Live show** (3 hours before doors through end of show): refresh every 30 minutes.
*   **Rule**: Capture each refresh as a new timestamped snapshot on the event weather array, not an overwrite. The most recent entry is canonical; prior entries are preserved for history/provenance.

**Post-Show Setlist Reconciliation (Conflict Resolution):**
When fan/community sources (e.g., `setlist.fm`, Reddit, social posts) conflict with official sources, resolve according to this priority hierarchy:

| Situation | Resolution Rule |
|---|---|
| Official setlist published | Official wins. Fan sources demoted to `supporting`. |
| No official setlist; fan sources agree | Majority fan consensus promoted to `draft` (confidence $\le 0.80$). |
| No official setlist; fan sources conflict | Each contested song gets a `contested` flag (confidence $\le 0.65$), escalate for manual review. |
| Community source is the only source | Allowed at `draft` (confidence $\le 0.75$), flagged with `unverified_sole_source`. |

*   **Song Order**: Follows the same setlist rules. Crossover or order conflicts receive `position_contested: true` on the `PerformanceContext` object, rather than a hard assignment.
*   **Pass 4 Ingestion Timing**:
    *   Open Pass 4 immediately after the show ends (estimated 10–11 PM CDT).
    *   *First step*: capture setlist stubs from earliest available fan sources.
    *   *Second step*: reconcile against official if available within 24 hours.
    *   Do not promote setlist `PerformanceContext` objects to `stable` until the reconciliation window closes (48 hours post-show).

### 7.6 Forbidden Behaviors

Antigravity must never:
- Hallucinate field values not derived from a captured source
- Auto-resolve conflicting official-source facts without escalation
- Promote an object past `draft` without meeting pass exit criteria
- Write to entity objects during bundle assembly
- Use a deprecated enum value

---

## 8. Revision and Versioning

- Revision pointer format: `{bundle_id}:{revision_number}` — e.g. `bundle:check-weather:7`
- Snapshots are dated. This package is `sm0626` — the prefix encodes the snapshot date.
- Future snapshots may use new prefixed folders or migrate into a cleaner repo layout.
- A superseded object moves to lifecycle `superseded`; a retracted object moves to `retracted`.
- Stable objects should not be modified in place — produce a new revision.

---

## 9. Scope for This Package

| Field | Value |
|---|---|
| Artist | Young the Giant |
| Tour | Victory Garden Tour |
| Venue | Ascend Federal Credit Union Amphitheater |
| City | Nashville, TN |
| Date | 2026-06-27 |
| Package version | 0.1.0 |
| Snapshot prefix | sm0626 |
