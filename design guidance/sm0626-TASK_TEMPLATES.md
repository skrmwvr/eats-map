# TASK_TEMPLATES

This file defines first-pass reusable task templates for Antigravity. Tasks are grouped by production pass.

## Shared task shape

Each task should define:
- `task_name`
- `pass`
- `scope_type`
- `inputs`
- `actions`
- `outputs`
- `quality_checks`
- `escalate_if`

## Pass 1: capture

### Capture official source set
- `task_name`: `capture_official_source_set`
- `scope_type`: `artist|tour|event|venue|song`
- `inputs`: seed entity, starter URLs
- `actions`: fetch official pages, capture urls, titles, timestamps, notes
- `outputs`: source records, raw snippets, raw links
- `quality_checks`: source class assigned, page relevance confirmed
- `escalate_if`: no official source found, identity unclear

### Capture secondary source set
- `task_name`: `capture_secondary_source_set`
- `scope_type`: `artist|tour|event|song|venue`
- `inputs`: seed entity, starter URLs, search results
- `actions`: gather secondary sources, archive useful context, log source family
- `outputs`: secondary source records, notes, snippets
- `quality_checks`: no obvious duplicate-source flooding, relevance confirmed
- `escalate_if`: source echo dominates, provenance weak

### Capture utility pages
- `task_name`: `capture_utility_pages`
- `scope_type`: `venue|event`
- `inputs`: venue or event seed, venue urls
- `actions`: capture parking, entry, bag, accessibility, map, faq, weather links
- `outputs`: utility source records, page notes
- `quality_checks`: key utility categories covered where available
- `escalate_if`: utility info missing for high-risk category

## Pass 2: normalize

### Normalize entity identity
- `task_name`: `normalize_entity_identity`
- `scope_type`: `artist|tour|venue|event|song|album|member`
- `inputs`: raw entity records, source records
- `actions`: choose canonical slug, assign stable id, set display name
- `outputs`: normalized entity object
- `quality_checks`: id format valid, slug readable, duplicate check completed
- `escalate_if`: identity conflict remains, likely duplicate unresolved

### Link entity scope
- `task_name`: `link_entity_scope`
- `scope_type`: `event|song|tour|venue`
- `inputs`: normalized entities
- `actions`: create links among artist, event, venue, tour, song, album, member
- `outputs`: linked references
- `quality_checks`: required parent and sibling links present
- `escalate_if`: critical linkage missing

### Extract structured fields
- `task_name`: `extract_structured_fields`
- `scope_type`: `all`
- `inputs`: normalized entities, source records
- `actions`: extract typed fields, classify source types, preserve provenance
- `outputs`: populated structured fields
- `quality_checks`: field types valid, source references preserved
- `escalate_if`: extraction ambiguity affects critical fields

## Pass 3: assemble

### Build utility bundle
- `task_name`: `build_utility_bundle`
- `scope_type`: `event|venue`
- `inputs`: normalized venue/event objects, utility facts
- `actions`: compose parking, entry, bag, access, weather, policy context
- `outputs`: utility bundle
- `quality_checks`: critical utility fields present, serving path assigned
- `escalate_if`: high-risk utility fact unresolved, active facts conflict

### Build song fast bundle
- `task_name`: `build_song_fast_bundle`
- `scope_type`: `song`
- `inputs`: normalized song, artist, tour, event context
- `actions`: compose concise song context for rapid use
- `outputs`: song fast bundle
- `quality_checks`: identity clear, summary bounded, provenance attached
- `escalate_if`: signature/context claim too weak for summary

### Build song deep bundle
- `task_name`: `build_song_deep_bundle`
- `scope_type`: `song`
- `inputs`: normalized song object, source set, linked context
- `actions`: compose deeper song history, performance notes, claim inventory
- `outputs`: song deep bundle
- `quality_checks`: major claims carry confidence and sources
- `escalate_if`: contested interpretation presented too strongly

### Build event recap bundle
- `task_name`: `build_event_recap_bundle`
- `scope_type`: `event`
- `inputs`: event object, actuals, logs, recap notes
- `actions`: compose post-event narrative and structured recap
- `outputs`: event recap bundle
- `quality_checks`: actuals separated from pre-event assumptions
- `escalate_if`: recap facts conflict with prior stable record

### Score bundle quality
- `task_name`: `score_bundle_quality`
- `scope_type`: `bundle`
- `inputs`: bundle content, source graph, confidence signals
- `actions`: assign confidence, contestation, presentation risk, review gate
- `outputs`: scored bundle metadata
- `quality_checks`: score present, reason codes present, gate assigned if needed
- `escalate_if`: no valid scoring basis, confidence too dependent on weak inference

## Pass 4: enrich and reconcile

### Apply post-event actuals
- `task_name`: `apply_post_event_actuals`
- `scope_type`: `event|bundle`
- `inputs`: stable or draft event bundles, actual weather, actual timing, recap data
- `actions`: update facts, create revision, mark prior assumptions as historical
- `outputs`: revised records
- `quality_checks`: actual vs predicted distinction preserved
- `escalate_if`: actuals invalidate prior stable claims materially

### Reconcile conflicts
- `task_name`: `reconcile_conflicts`
- `scope_type`: `claim|bundle|entity`
- `inputs`: conflicting claims, source graph, review notes
- `actions`: compare sources, mark contestation, resolve or retain competing claims
- `outputs`: reconciled or explicitly contested result
- `quality_checks`: conflict reason codes present, result auditable
- `escalate_if`: official-source conflict unresolved

### Supersede or retract
- `task_name`: `supersede_or_retract`
- `scope_type`: `bundle|claim|entity`
- `inputs`: invalidated records, improved replacements, review notes
- `actions`: mark stale, superseded, or retracted; link successor where needed
- `outputs`: lifecycle-updated records
- `quality_checks`: successor pointer or retraction reason present
- `escalate_if`: removal affects high-risk served bundle

## Starter task order for a live event

1. `capture_official_source_set`
2. `capture_utility_pages`
3. `capture_secondary_source_set`
4. `normalize_entity_identity`
5. `link_entity_scope`
6. `extract_structured_fields`
7. `build_utility_bundle`
8. `build_song_fast_bundle`
9. `score_bundle_quality`
10. `apply_post_event_actuals`
11. `build_event_recap_bundle`
12. `supersede_or_retract`

## Notes

- task templates are reusable, not one-off prompts
- each task should produce auditable outputs
- weak evidence should trigger escalation instead of fake certainty
