# SM0626 Handoff Index

This folder is a compact handoff package for Antigravity's first live-event content and research workflow. It is meant to be understandable by a human operator on first read, but it is also structured so an agent can later promote the folder into a cleaner GitHub repository with a repository description, top-level README, organized docs, and a machine-readable inventory.

The package assumes a near-term operating goal: ingest, normalize, enrich, and serve a live concert event context for a single upcoming show while preserving the design direction for a broader reusable system.

## Package purpose

The bundle in this folder defines the first working contract for a system that:
- gathers content from official and semi-official web sources,
- groups information by entity layer rather than by raw source,
- normalizes that information into reusable bundles,
- supports fast first-pass collection followed by richer later passes,
- and can eventually scale from one event into tour-aware and catalog-aware content generation.

In practical terms, this package is aimed at one concrete use case: a Young the Giant concert at Ascend Federal Credit Union Amphitheater in Nashville on 2026-06-27, inside the broader Victory Garden Tour context. The event is the immediate operational target, but the design language is intentionally reusable for later artists, tours, venues, and events.

## Folder reading order

A good reading order for a human or agent is:
1. `sm0626-HANDOFF_INDEX.md`
2. `sm0626-bundle-contract-spec.md`
3. `sm0626-ENUMS.md`
4. `sm0626-ID_RULES.md`
5. `sm0626-PASS_PLAN.md`
6. `sm0626-TASK_TEMPLATES.md`
7. `sm0626-STARTER_URLS.md`
8. `manifest.json`

That order moves from concept and structure into vocabulary, identity, workflow, execution templates, and finally seeded discovery inputs.

## What this package is trying to establish

This package is not just a one-off research packet. It is trying to establish a durable operating pattern for bundle-based AI transfer.

The key ideas are:
- content should be grouped by system entity such as artist, tour, venue, event, and weather,
- weather belongs at the event layer because the venue fixes place but the event constrains time,
- first-pass capture should be broad and fast, preserving links and evidence even before full cleanup,
- later passes can normalize, deduplicate, summarize, and generate serving views,
- and the same bundle logic used for app-to-AI transfer can be expanded into a folder-scale or repository-scale handoff format.

## Event context in scope

Current working scope for this package:
- artist: Young the Giant
- tour: Victory Garden Tour
- venue: Ascend Federal Credit Union Amphitheater
- city: Nashville, Tennessee
- event date: 2026-06-27
- event objective: construct a high-quality event context bundle for pre-show, live, and post-show use

Out of scope for the starter run:
- building rich standalone bundles for every prior tour stop,
- exhaustive catalog research for all historical songs,
- production-grade repo structure with CI/CD,
- or final governance decisions for every future export format.

Those can come later. This package is a launch-grade contract starter, not the end state.

## File guide

### `sm0626-bundle-contract-spec.md`

This is the anchor document. It describes the bundle model itself: what a bundle is, which layers exist, how data composes, where event bundles sit relative to artist/tour/venue bundles, and how the system should think about internal versus outward-facing representations.

If Antigravity later turns this folder into a GitHub project, this file likely becomes the foundation for a `docs/architecture/` or `docs/specs/` section and may also inform a shorter public README summary of the architecture.

### `sm0626-ENUMS.md`

This file defines controlled vocabularies and canonical value families. Its purpose is to reduce drift in classification and help the system normalize noisy source text into consistent internal values.

In a future repository, this could live under `docs/reference/`, `schema/`, or `contracts/`, and it may later be mirrored into code constants or validation schemas.

### `sm0626-ID_RULES.md`

This file defines naming, ids, slugs, and stability expectations. It exists so objects can be created, merged, revised, and referenced without identity chaos.

In a later GitHub repo, it will likely support both human documentation and implementation artifacts such as schema validators, object resolvers, and naming helpers.

### `sm0626-PASS_PLAN.md`

This file defines the phased ingestion strategy. It captures the idea that the system should first collect broadly, then refine, then generate view-ready material, then optionally enrich after the event.

It is especially important operationally because it explains why incomplete first-pass data is acceptable if provenance is preserved and the later passes know how to improve it.

### `sm0626-TASK_TEMPLATES.md`

This file converts the pass strategy into reusable task units. It is the operational bridge between high-level design and actual agent work.

In a future repo, this file could become part of `ops/`, `playbooks/`, `agents/`, or `docs/runbooks/`. It is a strong candidate for later splitting into several smaller files if the workflow library grows.

### `sm0626-STARTER_URLS.md`

This file seeds the discovery graph for the immediate event package. It is intentionally grouped by the same system layers the bundle model cares about: artist, tour, venue, event, and weather.

This file should be read as a practical launch artifact. It tells Antigravity where to begin and also demonstrates how future seed sets should be organized for other events.

### `manifest.json`

This should be the machine-readable inventory for the folder. It should help an agent or downstream tool identify what files are present, what role each file plays, what order to read them in, and which event scope the package is about.

If this package later becomes a GitHub repo, the manifest can be preserved as an internal transfer artifact or translated into richer repository metadata.

## How Antigravity should understand the package

Antigravity should treat this folder as a transfer-ready operating bundle, not as loose notes.

That means:
- every file here is part of one coherent system,
- the files should be interpreted together,
- the package is intended to be portable into another folder, workspace, or repository,
- and the package should be eligible for later backup into GitHub with minimal reinterpretation.

A useful mental model is: this folder is a prototype repository without the repository polish yet.

## Likely future GitHub shape

A later GitHub backup or launch repo could reasonably evolve into a structure such as:
- top-level `README.md` with project overview, operating goal, current scope, and quick links,
- `docs/` for architecture, contracts, vocabularies, and process notes,
- `ops/` or `runbooks/` for task templates and execution patterns,
- `seeds/` or `inputs/` for starter URL sets,
- `manifests/` for machine-readable bundle inventories,
- and `archive/` or dated folders for versioned handoff snapshots.

This folder does not need to implement that structure yet. It only needs to make that future migration obvious and low-friction.

## Repository-level details this folder already implies

Even without explicitly spelling out a GitHub repository configuration, this package already implies several later repo details:
- project theme: AI-assisted live-event content bundling and ingestion,
- primary artifact type: documentation-first contract package,
- immediate scenario: a concert event bundle centered on one upcoming show,
- system model: layered entity bundles with pass-based enrichment,
- likely audience: Antigravity, future agents, and technical collaborators,
- likely repository character: private or internal-first working repo before any public polish.

That is enough context for Antigravity to later draft a repository description, a stronger README, a docs landing page, and an import/upload strategy.

## What a future README should probably say

When this becomes a GitHub directory or repository, the top-level README will probably need to explain:
- what the system is trying to do,
- why bundle-oriented transfer is better than ad hoc prompt context,
- what the current event scope is,
- what the key documents are,
- how the pass plan works,
- and what a new operator or agent should read first.

This handoff index should give enough narrative material for Antigravity to draft that README later without guessing at project intent.

## Packaging guidance

When presenting this folder to another agent, keep the files together and preserve the filename prefix. The shared `sm0626-` prefix is part of the package identity and helps the set read as one snapshot rather than an unrelated mixture of notes.

If more files are added, they should follow the same naming pattern unless there is a deliberate reason to separate stable machine artifacts such as `manifest.json`.

## Versioning posture

This package should be treated as a dated snapshot, not a timeless master source. It is acceptable for future versions to produce new prefixed snapshots or to migrate the contents into a cleaner repository layout.

What matters is preserving:
- the conceptual contract,
- the reading order,
- the event scope,
- and the relationship between human-facing docs and machine-facing manifests.

## Operational note

The immediate next agent should be able to:
- read this folder in order,
- understand the system model,
- identify the active event scope,
- start ingestion from the seeded URLs,
- and optionally promote the package into a GitHub backup or launch repository.

That means this file is serving two roles at once: handoff guide now, repository seed narrative later.
