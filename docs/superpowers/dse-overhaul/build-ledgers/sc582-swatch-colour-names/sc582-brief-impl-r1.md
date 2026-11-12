# SC-582 implementer brief, round 1

## 1. Context loading

- Read first: the effort ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc582-swatch-colour-names/decisions.md`. It is the source of truth for what to build; the owner rulings O1-O7 there are binding.
- Read the `dse-verify` skill at `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` before running any gate. It is ~400 KB: read it in parts (sections "The battery, in order", "Devbox wrapping", "Stale main.js", "Lifecycle and e2e notes", "THE exit-code footgun", "Freeze semantics" head, "Current expected numbers" first entry). Do NOT edit SKILL.md.
- Read `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` section 8 (project footguns).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names`. Plugin repo: `.../sc582-swatch-colour-names/draw-steel-elements`, branch `sc582-swatch-colour-names`, at dse `develop` `d0561a68`. Run `git -C <abs plugin path> fetch origin` and confirm `origin/develop` is still `d0561a68`; if it moved, rebase onto it and say so in your report. Superproject branch `sc582-swatch-colour-names` sits at workspace origin/main `5d4611a3`.
- Verify `pwd`/paths before every write: every edit goes under `/home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names/`. The workspace-level `CHANGELOG.md` you edit is `/home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names/CHANGELOG.md` — NEVER `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`. The main checkout is shared global state; its dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected — do not touch or report it.
- You never call the tracker (Linear) — not to read, not to post.

## 2. Task

Ticket (verbatim): "Each colour swatch in the Conditions window's row editor has an accessible name made of its hex code, for example "Color #c0392b". The colour's name is only in the hover tooltip. ... **Expected:** the swatch's accessible name carries the colour name its tooltip shows."

Owner rulings (verbatim from the ledger):

- "O2. Accessible name of a preset swatch = the colour name alone, exactly as in SWATCHES: `Red`, `Amber`, `Green`, `Blue`, `Purple`. The enclosing `role=group` is already labelled `Color`, so screen readers announce "Color" as context; repeating it or adding the hex is noise. The `title` tooltip stays `Red (#c0392b)` unchanged."
- "O3. `setColor`'s focus-restore (`focusPickedOption(index, 'Color', \`Color ${hex}\`)`) must look up the swatch by its new name, via the matching SWATCHES entry (case-insensitive hex match, so a custom pick equal to a preset, or YAML `#C0392B`, still lands on the named swatch)."
- "O4. Custom swatch labels (`Custom color`, `Custom condition color #xxxxxx, selected`) are out of scope — a custom colour has no name."
- "O5. Keep `visual-harness/mocks/sc186-entry.mjs` in sync (its mock swatch row copies the aria-label). aria-label does not paint, so shots/freeze must not move."
- "O6. Changelogs: an entry in the dse `CHANGELOG.md` 7.0.0 section (as SC-609 did) and a `## Unreleased` bullet in the WORKSPACE `CHANGELOG.md` in the worktree superproject (as SC-583 did)."
- "O7. Related-but-not-ours: SC-581 (no way to clear a colour), SC-586 (named colour opens the chooser at white), SC-585, SC-613, SC-614, SC-617, SC-618. Do not touch."

Where things are:
- `src/views/ConditionsModal.ts`: `renderSwatches` (~l.468) sets `aria-label` from the hex; `setColor` (~l.499) passes `Color ${hex}` to `focusPickedOption`. Read `focusPickedOption` to see how it matches.
- `test/dom/views/conditions-modal-matrix.test.ts:879`: the SC-436 `test.failing('SC-582: …')` marker — turn it into a plain `test` (keep its assertion; drop the "SC-582:" prefix pattern only if the e2e/jest runner conventions require; jest titles may keep the ticket id, but NEVER put a bracketed ticket id like `[SC-582]` in an e2e test title — the e2e runner reads titles for scenario ids). Also update the comments at :43 and in `e2e/driver/conditions.ts:77` that say "SC-582 will rename" so they state the current fact.
- Hex-label assertions to update: `e2e/specs/initiative/conditions-pick-focus.e2e.ts:56,73` (COND-E02/E03, expect `label: 'Green'`), `test/dom/views/conditions-modal.test.ts` lines ~309, 382, 384, 906, 914, 1225, 1227 (selectors `button[aria-label="Color #…"]`). Grep the whole repo (src, test, e2e, visual-harness, docs) for `Color #` and `` `Color ${`` to be sure none are left.
- Add jest tests (TDD: write them first, watch them fail on d0561a68 behaviour): (a) each of the five preset swatches' accessible name is exactly its colour name and its title still shows `Name (#hex)`; (b) after clicking a swatch, focus lands on the swatch now named e.g. `Green` (the re-render path); (c) a custom-input `change` to a preset hex in different case (e.g. `#1E8449`) — or a note whose YAML colour is `#C0392B` — marks and focuses the named preset swatch. Pick whichever of (c) the code path actually supports; state which in the report.
- Docs: grep `docs/initiative-tracker.md` for swatch/colour wording that names hex labels; update only if it describes the accessible name.

Commit after every coherent step (plugin commits on branch `sc582-swatch-colour-names`; workspace CHANGELOG as its own commit on the superproject branch, message `docs(SC-582): CHANGELOG Unreleased entry`). Do NOT make a superproject pointer-bump commit — the owner arranges exactly one at the end. Do not push anything.

Changelog wording rules (Scott is colourblind): plain sentences, name colours in words. Lead with the visible consequence: a screen reader now says "Green" for the green swatch instead of "Color #1e8449".

## 3. Gates (dse-verify battery, in order), expected numbers at d0561a68

- tsc and lint clean.
- jest: baseline about 10759 passed / 2 skipped in a fresh worktree (10760 / 1 after shots has cached `visual-harness/dist/obsidian-app.css`). Expect baseline + your new tests, and 0 failed. Run `rm -f main.js styles.css` in the plugin root before jest (stale main.js footgun). Run jest as the last command in its invocation (exit-code footgun).
- lifecycle: 60/60, run in SIX `--only` parts (`--only=` takes comma-separated ids):
  1. `--only=G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `--only=G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `--only=G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `--only=G-S57,G-S62,G-S61,G-S56` (4)
  5. `--only=G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `--only=G-S92,G-S96,G-S97` (3)
  (Command shape: `npm run obsidian-lifecycle -- --only=<ids>`; confirm against dse-verify.)
  - One part per Bash call, output redirected to a per-run log in your private scratch folder. The Bash tool backgrounds any call over 180 s and notifies on completion; while waiting use `timeout 175 tail --pid=<your node pid> -f /dev/null` on YOUR OWN pid (pick it by `readlink /proc/<pid>/cwd` being your worktree's draw-steel-elements). Then read the log's own summary line. Do not add lifecycle scenarios (none needed; if you think one is, return NEEDS_CONTEXT).
- e2e: expect `OBSIDIAN-E2E done: 290/293 ok, 0 failed, 3 known-bug, coverage: 172/172 pairs` (known bugs SC-257, SC-355, SC-384) — unless you add e2e tests, in which case state the new totals; coverage pairs must stay full.
- shots: 592, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)`.
- freeze: 280/280. This change paints nothing; if any frozen hash moves, STOP and report — do not touch the baseline (`.superpowers/sdd/freeze-baseline.sha256` is shared and owner/dispatcher-only).
- parity: 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Footguns (each has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc582-swatch-colour-names/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS`; never pipe a gate into `tail`. Record exit codes from a script file run through devbox and read each gate's own summary line.
- Use a PRIVATE scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc582-impl-r1/` — uniquely named scripts and logs inside it (prefix `sc582-`). Create files with the Write tool.
- No `rm` with a shell-variable path, no glob `rm`. Never `rm -rf` a `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) — other efforts' vaults match it. Never `rm -rf` the shared `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Use `git -C <absolute path>` for every git command, never `cd X; git …`.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Run each gate as a foreground call (one lifecycle part per call). Do not start a background job and then wait for a notification that will never wake you; if a call is moved to the background by the tool, poll the gate's own log/pid as above.
- If `package.json`'s obsidian version changed in a rebase, `npm ci` first.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-582:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc582-swatch-colour-names/sc582-impl-r1-report.md`. It must open with a ≤10-line executive summary (verdict, plugin head sha, superproject CHANGELOG commit sha, every gate's measured number). Then: files changed; tests added (titles); which variant of test (c) and why; how many of your new jest tests fail with the fix reverted (revert `src/` only, run, restore — report the count); `Drive-by fixes:` and `Follow-ups:` lists.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, shas, measured gate numbers, the report path, and the filesystem path of every evidence artifact (gate logs). No prose.
