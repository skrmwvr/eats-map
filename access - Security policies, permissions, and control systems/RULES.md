# Local Agent Rules & Safety Policies (RULES.md)

This document defines the operational boundaries and expectations for all AI agents, subagents, and automated processes running in this workspace.

---

## 1. Ground Truth Verification (Empirical Principle)

* **Codebase First**: The agent must always query raw repository files, configuration states (e.g., build settings), and logs (git log) to verify the current ground truth.
* **No Speculative History**: Do not rely solely on conversational history, transcripts, or memory to determine versioning, commit states, or active file paths. If a file or configuration exists in the codebase, verify it directly on disk.

---

## 2. Graded Permissions & Scoped Consent

To prevent confirmation fatigue and ensure safe execution, the agent operates under a three-tiered permissions model:

* **Tier 1: Read & Research (Frictionless)**
  * **Scope**: Reading directories, viewing codebase files, executing read-only Git commands, and checking local API endpoints.
  * **Inherited Consent**: Once the user authorizes a directory read or search, the agent has implicit authorization to read all child files within that directory. The user must not be prompted for individual file reads or line-number shifts.
* **Tier 2: Controlled Writes (Requires Approval)**
  * **Scope**: Writing new files, replacing code blocks, and modifying configurations within the active workspace.
  * **Protocol**: Run edits through the 7-Phase Method, outline changes in `implementation_plan.md`, and wait for Front Node (user) sign-off.
* **Tier 3: System Mutation & Operations (Step-by-Step Approval)**
  * **Scope**: Running background daemons, installing packages, modifying files outside the active workspace directory, and running ADB command interactions.
  * **Protocol**: Require explicit confirmation for each separate command line execution.

---

## 3. Decoupled Thread-Spawning (Blueprints)

* **Standard Practice**: For complex cross-repo tasks, multi-project context, or parallel workstreams, generate a self-contained Markdown Blueprint (`*_blueprint.md`).
* **Execution**: Suggest the user copy-paste the blueprint into a new, clean chat thread. This avoids context drift, token bloat, and sequence index mismatch errors (`HTTP 400 Bad Request`).
