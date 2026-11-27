# SC-707 round 1 — implementer brief

You are the implementer for ticket SC-707 (draw-steel-elements, the DSE Obsidian plugin).
Your final text goes to the ticket-owner, not a human. **Workers never call the tracker** —
not to read history, not to post. Everything you need is in this brief and the files it names.

## 1. Context loading

Read first:
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/decisions.md` (owner rulings O1–O4 are your spec).
- The plugin's `AGENTS.md` / `CLAUDE.md` in the worktree's `draw-steel-elements/`.
- The gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery table near the top, the CURRENT block around line 1553). It is long — read the battery section and the CURRENT block, grep the rest as needed.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest`. Plugin: `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest/draw-steel-elements`, branch `sc707-initiative-schema-suggest`, cut at dse `develop` `17187e4c`.
- Verify `pwd`/paths before any write. Never write under `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not touch or flag it.
- First: `git -C <plugin> fetch origin` and check `origin/develop`. If it is still `17187e4c`, no rebase. If it moved, `git -C <plugin> rebase origin/develop` and note the new base in your report.
- Fresh worktree has no `node_modules`: run `npm ci` once (through `devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

## 2. The task

Problem: inside a `ds-initiative` block the in-block autocomplete (`src/authoring/schemaSuggest.ts`, `DsSchemaSuggest`) offers nothing, because `src/elements/initiative/definition.ts` has no `schema`. Also, the autocomplete only suggests top-level keys — it bails on every indented line ("Finding 2") — so nested keys like a hero's `max_stamina:` get nothing for any element.

Owner rulings, quoted from the ledger:

> O1. A suggestions-only schema is acceptable. It goes in a new optional `authoring` slot read ONLY by the in-block autocomplete — never by validation, the form editor, or scaffold — so how blocks parse and which blocks show error cards does not change. The `definition.ts` "Deliberately NO schema" comment still holds for `def.schema` and gets updated to point at the new slot.

> O2. Nested-key completion is in scope for this ticket. The ticket's own examples (`max_stamina:`) are nested, so top-level-only would not fix the reported symptom. The completion resolves the cursor's YAML path (indentation + block-sequence `- ` items) against the schema and suggests only when the path resolves unambiguously; anything it can't resolve (flow style, block scalars, odd indentation) still offers nothing. It applies to every element with a schema, not just initiative.

> O3. The suggestions schema lists author-facing keys only. Keys the tracker writes for itself during play (turn flags, pool bookkeeping) are left out unless an author would reasonably type them. The implementer reports both lists; the owner checks them. A jest test guards drift: every key in the suggestions schema must be a key the initiative parser actually reads.

> O4. Not touched: docs/initiative-tracker.md (SC-419). SC-678 (key-side mid-word marker) and SC-676 markers stay as they are.

Concretely, in separate commits (commit after every coherent step):

**Step A — the slot.** Add an optional field to `AuthoringHint` in `src/framework/registry.ts` (suggested name `suggestSchema?: string`, YAML-text JSON Schema, same esbuild yaml-loader import style as `schema`). Doc-comment it: autocomplete only, never validates. `DsSchemaSuggest` uses `def.schema` when present, else `def.authoring?.suggestSchema`. Confirm by grep that pipeline validation, `formModel.ts`, `FormModal.ts`, `scaffold.ts` do not read it. Keep the SC-406 deferred-off check working for both.

**Step B — the initiative suggestions schema.** A YAML file next to the element (follow the repo's naming for element schema files). Derive keys from the code, not from guesses: `src/elements/initiative/model.ts` (the `TOP_KEYS` / `HERO_KEYS` / `GROUP_KEYS` / `CREATURE_KEYS` / instance-key lists around lines 228–254, and `parse`), `resolveRefs.ts`, `example.yaml`. Shape: top level (`name`, `round`, `heroes`, `enemy_groups`, `malice`, …), hero items, enemy group items, creature items, malice object, and anything else nested an author writes. Short `description` per key (plain words, they show to non-technical users if descriptions surface — check whether `DsSchemaSuggest` renders descriptions). Enum values where the parser accepts a closed set. Per O3, leave out runtime-only keys; your report lists **included** and **excluded** keys per level with a one-line reason for each exclusion. Add the drift jest test from O3 (every schema key at every level is a key the parser reads). Update the `definition.ts` comment.

**Step C — nested completion.** In `schemaSuggest.ts` (and `schemaShape.ts` if the allOf/`$ref` merge needs to apply at nested nodes — reuse the one resolver, do not fork a second), replace the "bail on any indented line" rule with path resolution: walk upward from the cursor line inside the fence to find each parent key at a smaller indentation; a `- ` list item steps into the parent's `items`; the first key on a `- key:` line and keys aligned under it are siblings in that item. Resolve against `properties` / `items` (+ allOf/`$ref`). Offer key names (and enum values after `key:`) only if every step resolves to a schema node; otherwise offer nothing. Keep existing top-level behavior byte-for-byte (including whatever it does about keys already present and the SC-688 accept/replace behavior). Keep the existing callout (`> `) behavior as it is — do not expand or regress it. Comments, flow style (`{` `[`), block scalars (`|` `>`), tabs: offer nothing. Update the file's header comment (the "Finding 2" rationale) to describe the new rule.
List in your report every element whose schema has nested object properties and so gains nested suggestions (e.g. `ds-roll` `tiers`).

**Tests.** Jest unit tests for the path resolver (top level, hero item first key on `- ` line, key aligned under a `- ` item, creature two levels deep, enum nested, unresolvable path → nothing, flow/block-scalar → nothing, a top-level key never offered inside a nested object). Real-Obsidian e2e: look at `e2e/specs/authoring/gate-on.e2e.ts` and the AUTH-G* ids (e.g. AUTH-G21/G22) for the pattern and the next free id; add cases for initiative top-level, initiative nested (`max_stamina` under a hero and under a creature), and one other element's nested key. Follow the repo's coverage-pair conventions (dse-verify explains coverage pairs).

**CHANGELOG.** One user-facing bullet under `## Unreleased` in the plugin's `draw-steel-elements/CHANGELOG.md` in YOUR worktree (look at how recent SC-688 / SC-706 bullets read; plain words: "Typing inside an initiative tracker block now suggests its fields, including fields inside each hero and creature; other blocks now suggest nested fields too."). Do not edit any `docs/` page; if you think a docs page should mention this, say which in the report and I relay it.

## 3. Gates

Run the full battery per dse-verify, each gate as one blocking foreground call (split lifecycle / e2e / shots into separate calls to stay under the 10-minute tool timeout; redirect output to log files; no background jobs, no Monitor). Expected at base `17187e4c` (CURRENT):

- tsc (incl. `tsc -p e2e`) and lint clean
- jest **15018 passed / 2 skipped** fresh (no shots cache) — yours goes up by your new tests; report the delta
- lifecycle **64/64**
- e2e `OBSIDIAN-E2E done: 936/956 ok, 0 failed, 20 known-bug, coverage: 540/540 pairs` — yours: 0 failed, known-bug count unchanged at 20, coverage Y/Y
- shots **636**, freeze **280/280**, parity **0 / 0 / 24**. This change should not touch CSS: build `styles.css` and compare byte-for-byte with a clean `17187e4c` build; if identical, shots/freeze/parity carry (say so); if not, run them and stop to report.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc707-initiative-schema-suggest/sc707-r1-impl-report.md`. It must open with a ≤10-line executive summary. Then: commits (sha + subject), included/excluded key lists (O3), the list of elements gaining nested suggestions, every gate's measured line, the styles.css comparison result, `Drive-by fixes:` and `Follow-ups:` sections.

## 5. Return contract

Final text: raw facts — verdict (DONE / BLOCKED / NEEDS_CONTEXT), head sha, measured gate numbers, and the absolute path of every evidence artifact (report, logs). No prose.

## Footguns (all mandatory)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-707:`.
- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound command; devbox eats `$?` — record exit codes from inside a script file and read each gate's summary line; never pipe a gate into `tail`.
- Every git command as `git -C <absolute path>`; never `cd X; git …`.
- Scratch: use a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc707-r1-impl/` with uniquely named scripts/logs; create files with the Write tool.
- No `rm` with a glob or a shell-variable path. Never `rm -rf` anything under `.superpowers/` or a `/tmp` glob (other efforts' lifecycle vaults live there).
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose command line contains your worktree path or whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never create tags or releases on draw-steel-elements. Never push. Never run `just deploy*` or `just wt-finish`.
- Workspace-level files live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc707-initiative-schema-suggest/…` — never under `/home/scott/code/steelCompendium/workspace/` (except the report path above).
