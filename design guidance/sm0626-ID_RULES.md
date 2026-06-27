# ID_RULES

This file defines first-pass identifier, slug, naming, and revision-pointer rules for the project.

## Core principles

- ids are stable
- revisions are separate from ids
- slugs are human-readable and machine-usable
- field names use `snake_case`
- id values use `type:kebab-case-slug`
- revision pointers use `bundle_id@revision`

## Field naming

### Object fields
- use `snake_case`
- examples: `display_name`, `bundle_id`, `source_class`, `freshness_ts`

### Enum values
- use `snake_case`
- examples: `human_review_required`, `artist_official`, `critical_field_missing`

### Bundle type names
- use `snake_case`
- must end in `_bundle`
- examples: `find_parking_bundle`, `show_song_fast_bundle`

## Slug rules

- use lowercase ASCII
- words separated by hyphen
- no spaces
- no underscores
- no punctuation except hyphen
- remove or normalize diacritics
- prefer canonical English-friendly transliteration where needed
- keep slugs readable
- avoid stopword over-cleaning if it harms recognition

### Good examples
- `young-the-giant`
- `victory-garden-2026`
- `freedom-hill`
- `summer-in-bloom`

### Bad examples
- `YoungTheGiant`
- `young_the_giant`
- `young the giant`
- `young-the-giant!!!`

## ID format

Use this pattern:

`type:kebab-case-slug`

### Core entity types
- `event:...`
- `venue:...`
- `tour:...`
- `artist:...`
- `song:...`
- `album:...`
- `member:...`
- `source:...`
- `claim:...`
- `feedback:...`
- `bundle:...`

### Examples
- `artist:young-the-giant`
- `tour:victory-garden-2026`
- `venue:freedom-hill`
- `song:my-body`
- `bundle:check-weather:event-young-the-giant-detroit-2026-06-25`

## Event id rules

Event ids should be stable and descriptive.

Preferred pattern:

`event:{primary-artist-slug}-{city-or-venue-slug}-{yyyy-mm-dd}`

Examples:
- `event:young-the-giant-detroit-2026-06-25`
- `event:band-name-red-rocks-2026-08-10`

If city and venue are both useful, prefer the most disambiguating stable choice.

## Bundle id rules

Bundle ids should include bundle purpose plus primary scope.

Preferred pattern:

`bundle:{bundle-purpose}:{primary-scope-slug}`

Examples:
- `bundle:find-parking:event-young-the-giant-detroit-2026-06-25`
- `bundle:venue-utility:freedom-hill`
- `bundle:tour-context:victory-garden-2026`

## Revision pointer rules

Logical identity stays separate from revision.

### Stable logical id
- `bundle:check-weather:event-young-the-giant-detroit-2026-06-25`

### Immutable revision pointer
- `bundle:check-weather:event-young-the-giant-detroit-2026-06-25@7`

Rules:
- do not bake revision into the logical id
- append `@{integer}` only when exact historical reference is needed
- revision numbers are monotonic integers starting at `1`

## display_name policy

Use `display_name` as an optional presentation field for major proper-noun entities.

### Applies to
- artist
- tour
- venue
- song
- album
- member
- event title fields when needed

### Rules
- `display_name` is optional
- slug remains canonical for ids
- `display_name` may preserve punctuation, casing, symbols, and local spelling
- `display_name` does not control identity

Examples:
- id: `artist:young-the-giant`
- `display_name`: `Young the Giant`

## Name vs slug

- `slug` is canonical, stable, and id-safe
- `display_name` is human-facing
- `name` or `title` can store the canonical textual value inside the object
- ids should never depend on later cosmetic presentation changes

## Claim and source ids

### Claim ids
Preferred pattern:
- `claim:{scope-slug}:{claim-topic}`

Examples:
- `claim:young-the-giant-my-body:signature-song`
- `claim:event-young-the-giant-detroit-2026-06-25:doors-time`

### Source ids
Preferred pattern:
- `source:{source-class}:{short-slug}`

Examples:
- `source:venue-official:freedom-hill-parking-page`
- `source:weather-service:noaa-detroit-hourly-2026-06-25-1900`

## Feedback ids

Preferred pattern:
- `feedback:{uuid}`

Reason:
- feedback items may be numerous, user-generated, and not naturally slug-friendly

## Reserved naming conventions

- avoid uppercase in ids and slugs
- avoid spaces in ids and slugs
- avoid embedding mutable UI labels in ids
- avoid opaque random ids where readable slugs work well
- avoid reusing the same slug across different types to mean different things when avoidable

## Stability rules

- changing `display_name` does not change id
- typo fixes in display text do not change id unless identity itself was wrong
- merger, split, or true identity correction may require a new id plus supersession mapping
- revision increments track content updates, not identity replacement

## Mapping rules for exports

- internal canonical ids remain unchanged across export profiles
- CloudEvents `id` should map from `bundle_id` for bundle events
- JSON:API-like resource `data.id` should map from the stable logical id
- revision-qualified exports may include the `@revision` form when historical precision is required
