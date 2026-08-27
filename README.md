# Concert Companion App (Sun-Map)

## Overview
This repository contains the first live-event content and research workflow for the Concert Companion App (Sun-Map). The app is a web-based event intelligence tool for live music fans. It ingests content from official and semi-official web sources, groups the information by entity layer, normalizes it into reusable bundles, and serves it for both deterministic UI rendering and AI context delivery.

## Why Bundle-Oriented Transfer?
Instead of relying on ad-hoc prompt context, this system uses **bundle-oriented transfer**. The core idea is that:
- Content should be grouped by system entities (e.g., Artist, Tour, Venue, Event, Weather) rather than raw sources. Weather, for example, belongs at the event layer because the venue fixes the place, but the event constrains the time.
- First-pass capture can be broad and fast, preserving links and evidence before full cleanup.
- Later passes normalize, deduplicate, summarize, and generate serving views.
- The same bundle logic used for app-to-AI transfer can be scaled into a full folder-scale or repository-scale handoff format.

## Current Event Scope
The current launch-grade contract starter is focused on a single concrete use case:
- **Artist**: Young the Giant
- **Tour**: Victory Garden Tour
- **Venue**: Ascend Federal Credit Union Amphitheater
- **City**: Nashville, Tennessee
- **Event Date**: 2026-06-27

## How the Pass Plan Works
The ingestion strategy follows a phased pass plan to ensure data quality and structure:
1. **Collect Broadly**: Gather initial data and URLs rapidly. Incomplete first-pass data is acceptable as long as provenance is preserved.
2. **Refine**: Organize, deduplicate, and structure the gathered information.
3. **Generate Views**: Create view-ready bundles (e.g., `bundle:serve-song-fast-view`, `bundle:serve-event-summary`) for rendering or delivery.
4. **Post-Event Enrichment (Pass 4)**: Update facts (like reconciled setlists or attendance) immediately after the event has concluded.

## Key Documents
The `docs/` folder contains the core contracts and operational templates for this system.
- [`docs/handoff-index.md`](docs/handoff-index.md): A handoff guide for agents and operators to understand the context of this repository.
- [`docs/reference/sm0626-bundle-contract-spec.md`](docs/reference/sm0626-bundle-contract-spec.md): The anchor document defining the bundle model, entities, confidence aggregation, and export rules.
- [`docs/reference/sm0626-ENUMS.md`](docs/reference/sm0626-ENUMS.md): Controlled vocabularies for classification to reduce drift in noisy text.
- [`docs/reference/sm0626-ID_RULES.md`](docs/reference/sm0626-ID_RULES.md): Naming, ID generation, and slug conventions.
- [`docs/runbooks/sm0626-PASS_PLAN.md`](docs/runbooks/sm0626-PASS_PLAN.md): The phased ingestion strategy.
- [`docs/runbooks/sm0626-TASK_TEMPLATES.md`](docs/runbooks/sm0626-TASK_TEMPLATES.md): Reusable task units for agent work.
- [`docs/reference/sm0626-STARTER_URLS.md`](docs/reference/sm0626-STARTER_URLS.md): Seeded discovery graph for the immediate event package.

## Getting Started
If you are a new operator or agent reading this for the first time, your recommended reading order is:
1. `docs/handoff-index.md`
2. `docs/reference/sm0626-bundle-contract-spec.md`
3. `docs/reference/sm0626-ENUMS.md`
4. `docs/reference/sm0626-ID_RULES.md`
5. `docs/runbooks/sm0626-PASS_PLAN.md`
6. `docs/runbooks/sm0626-TASK_TEMPLATES.md`
7. `docs/reference/sm0626-STARTER_URLS.md`
