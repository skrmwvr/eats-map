# PASS_PLAN

This file defines the first-pass production plan for bundle creation and enrichment.

## Overview

The pipeline is organized into four passes. Each pass has a clear job, expected outputs, exit criteria, and escalation rules.

## Pass 1: capture

### Purpose
- create the object
- gather raw sources
- preserve links, clips, downloads, and notes
- avoid early over-normalization

### Typical work
- create seed entities
- collect official pages (hard backup)
- collect smart community sources (Clashfinder, Reddit) first for timetables
- run sub-pass for minor acts/openers: scrape past tour history to establish context for tricky nobodies
- capture source metadata
- store raw snippets or downloaded artifacts

### Expected outputs
- object exists
- source list exists
- raw evidence exists
- lifecycle reaches `captured`

### Serving expectation
- cold only
- internal research use

### Exit criteria
- object exists
- at least one relevant source captured
- source metadata recorded
- lifecycle at least `captured`

### Escalate if
- no viable source found
- source identity is unclear
- object duplicates another likely object

## Pass 2: normalize

### Purpose
- clean data
- dedupe entities
- link scope
- assign ids and typed fields

### Typical work
- normalize names and slugs
- assign stable ids
- link event, venue, artist, tour, song, and source objects
- classify source types
- extract structured fields

### Expected outputs
- canonical ids assigned
- linked entities
- typed fields populated
- lifecycle reaches `normalized`

### Serving expectation
- cold by default
- limited warm support for deterministic internals

### Exit criteria
- normalized ids assigned
- linked scope established
- source classes assigned
- lifecycle at least `normalized`

### Escalate if
- major identity conflict remains
- official-source conflict blocks normalization
- critical linkage is unresolved

## Pass 3: assemble

### Purpose
- create bundles
- score confidence
- compose views
- decide draft vs stable

### Typical work
- generate atomic and composite bundles
- compose event-level or utility-level bundles
- assign confidence, contestation, and presentation risk
- apply review gates
- set lifecycle to `draft` or `stable`

### Expected outputs
- bundle created
- bundle metadata complete
- confidence assigned
- serving path assigned
- lifecycle is `draft` or `stable`

### Serving expectation
- hot for stable deterministic utility bundles
- warm for draft or AI-augmentable bundles
- cold for unresolved or non-promoted bundles

### Exit criteria
- bundle generated
- confidence assigned
- serving path assigned
- review gate assigned if needed
- lifecycle `draft` or `stable`

### Escalate if
- critical field missing
- active event facts conflict
- suspicious echo-source corroboration
- bundle can only be formed from weak or highly inferred claims

## Pass 4: enrich and reconcile

### Purpose
- add actual event outcomes
- log changes over time
- reconcile post-event truth
- mark stale, superseded, or retracted content

### Typical work
- add actual weather
- add setlist or recap details
- compile prior day wraps and link them to the festival wrapper (if applicable)
- add attendee-relevant after-action notes
- promote improved revisions
- supersede stale bundles
- retract invalid bundles when needed

### Expected outputs
- post-event facts added where relevant
- newer revisions created where useful
- stale or superseded status applied where needed
- recap-ready or archive-ready records exist

### Serving expectation
- hot only for still-relevant bundles
- warm for recap and historical synthesis
- cold for archive and audit

### Exit criteria
- post-event actuals or logs added where relevant
- stale or superseded handling completed where needed
- recap or archive eligibility established

### Escalate if
- post-event facts contradict prior stable claims
- retraction is needed
- dispute remains materially unresolved

## Hot, warm, cold guidance

### Hot
Use for:
- deterministic event utility
- fast answers with current operational value
- stable bundles with strong support

### Warm
Use for:
- AI-augmentable context
- draft bundles safe enough to use with caveats
- recap or explanatory bundles

### Cold
Use for:
- raw research
- unresolved objects
- historical audit material
- low-confidence internal support

## Draft vs stable

### Draft
Use when:
- bundle is usable but provisional
- evidence is decent but not fully settled
- confidence is acceptable but not strong enough for quiet default serving

### Stable
Use when:
- critical fields are present
- no blocking conflicts remain
- confidence is strong enough for normal use
- review policy allows promotion

## Review triggers

Human review is required for:
- official-source conflict
- retraction
- high-risk venue utility
- major identity or linking uncertainty
- contested interpretation presented as summary

Do not promote to stable when:
- critical fields are missing
- active event facts conflict
- corroboration comes mainly from duplicated source families

## Lifecycle movement

Normal upward path:
- `stub` -> `captured`
- `captured` -> `normalized`
- `normalized` -> `draft`
- `draft` -> `stable`

Common downward or retirement paths:
- `stable` -> `stale`
- `stable` -> `superseded`
- `draft` -> `retracted`
- `stable` -> `retracted`

## Break-glass rule

Emergency overrides are allowed only for urgent operational needs. Every override must create an audit log entry and should trigger later review.
