# SC-482 r1 implementer brief — stop six blocks from writing default keys the user never wrote

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md` (the ledger — current-state, authoritative). Quote rulings from it; do not reinterpret.
- Then the r0 survey: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/sc482-r0-survey-report.md` — the executive summary, §1 (write funnel + inventory), §2 (measured leaks), §4 (helper design + per-element table). It is your design input; where it and the ledger differ, the ledger wins.
- SC-466's landed fix (the pattern you generalise): `src/elements/stamina-bar/model.ts` and its tests; its report `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc466-stamina-bar-defaults/sc466-r1-impl-report.md` (summary + writers sections).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements`, branch `sc482-wrapper-default-keys`, cut at `08206e3`. Verify `pwd`/branch before any write. `node_modules` is already installed there (r0 ran `npm ci`). NEVER write under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except your report file in the ledger dir. The workspace-level CHANGELOG lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/CHANGELOG.md` — never `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`.
- Before starting: `git -C <plugin repo> fetch origin` and confirm `origin/develop` is `08206e3`. If develop has moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md`, and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (main checkout, read-only).
- **Workers never call the tracker** (Linear) — not to read history, not to post. The ledger is your context.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it.
- OFF LIMITS: `src/authoring/FormModal.ts` (SC-483 in flight concurrently), `src/elements/initiative/` (SC-485), `src/elements/hero/` (dropped), `src/framework/host/`.

## 2. The task

Ticket "Expected" (verbatim from the ledger):

> **Expected:** same contract SC-466 set for the stamina bar. A key that was absent from the source and still equals its default stays absent. Every authored key is still written.

Inherited rule (verbatim from the ledger):

> "a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today."
> SC-466 r2 (2026-10-21): a key present with value `undefined` counts as absent (`declared[key] === undefined`).

Owner rulings on r0 (verbatim from the ledger):

> - SCOPE: the ticket's "Expected" contract applies to every element whose OWN parser fills defaults, not only ComponentWrapper ones. r1 fixes 6 elements: counter, project, montage, party, encounter, negotiation.
> - HELPER: one shared helper at `src/elements/shared/undeclaredDefaults.ts`, per r0 report §4 (snapshot of the value parse filled in, compared by `JSON.stringify`; presence read BEFORE the inner parse; usable on a DTO). Stamina-bar MOVES onto the helper (one mechanism, not two) — every SC-466 test must keep passing UNCHANGED; if moving it would force any SC-466 test edit, leave stamina-bar on its own code and report why.
> - encounter `_computed` render-time write: OUT OF SCOPE -> filed SC-486 (Backlog, related SC-482; needs Scott's decision whether a render should write at all). r1 only stops that write from adding `party: {}` / `monsters: []`; `_computed` behaviour unchanged.
> - SC-483 coordination: once `def.parse` records absent keys, FormModal Save also benefits — do NOT edit `src/authoring/FormModal.ts`.
> - e2e: no new e2e specs (no e2e surface exists for any of the 6; building one per element is out of proportion). Evidence = jest through the real write path (ElementView.persist / the DOM write) per element + the full battery incl. e2e unchanged; the independent reviewer adds real-Obsidian probes.
> - Key ORDER unchanged and quoting changes unchanged (pre-existing, r0 report §2 notes) — DROP.

Also (ledger): "Plugin-constructed blocks (not parsed from a source) keep today's output, same as SC-466 — report, don't change." — `omitUntouchedDefaults` on an instance with no record returns it unchanged.

Steps:

1. **Red first (TDD).** Per element, a failing jest test through the REAL write path (the element's view write -> `ElementView.persist` -> serialize; mirror how r0's probe did it — its probe file is preserved at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/zzSc482Probe.test.ts.txt`, reuse its harness). Minimal source -> one representative user write -> assert none of the r0-measured default keys appear. Encounter: the render-time write must not add `party: {}` / `monsters: []`. Commit the red tests.
2. **Helper** `src/elements/shared/undeclaredDefaults.ts` with its own unit test (`test/unit/...`): absent+unchanged omitted; absent+changed written; present-equal-to-default written; present-`undefined` = absent; null/blank body = nothing declared; deep object/array default mutated in place (e.g. `rolls.push`) is written; derived default (negotiation `current_patience` = `initial_patience`) omitted while unchanged; key order preserved; two instances never share a record; an instance with no record returns unchanged; the record never appears in `stringifyYaml` output (verify against the real `yaml`/`stringifyYaml`, not by assumption).
3. **Wire the 6 elements** per r0 §4's table; then move stamina-bar onto the helper (ruling above). Negotiation's nested Motivation: each Motivation records its own absent keys from raw `data.motivations[i]`.
4. **Existing tests** that pin bytes for a minimal source (r0 §5 lists ~6–9 likely files: counter.test.ts, negotiation-serialize / negotiation.test.ts, montage-serialize, project-serialize, party-serialize, encounter-serialize, others you find): a fixture whose SOURCE omitted a default and whose expected output contains it is now wrong — update it and list every such change in the report (file:line, before/after). A fixture whose source declared every key must keep passing untouched. Do not weaken any assertion beyond that.
5. **Integrity tests** (jest), per element where it applies, each a separate test:
   - fully-authored block (every key, defaults spelled out) -> byte-identical to today after a write;
   - an absent key the user's action changed -> written;
   - two same-type blocks in one note — one minimal, one fully authored — each writes its own shape (no cross-talk);
   - content above and below the fence untouched;
   - a re-parse (external edit) recomputes the record from the new source.
6. **Comments/docs:** update the header comments that state the old contract in `counter/model.ts`, `negotiation/model.ts`, `project/model.ts`, `montage/model.ts`, `party/model.ts`, `encounter/model.ts`, `stamina-bar/model.ts`; the rows in `draw-steel-elements/.repo-docs/architecture.md`; and the "by design" comment at `visual-harness/obsidian-lifecycle.mjs:1109` (comment only — no assertion change). Cite SC-482.
7. **CHANGELOG:** one user-facing bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/CHANGELOG.md`, plain words, e.g. "Counters, projects, montages, parties, encounters and negotiations no longer add lines you never wrote (such as `min_value: 0` or `successes: 0`) when the plugin saves a change to the block." Commit it on the superproject worktree branch with `git -C /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys`.
8. **Commit after every coherent step** inside the plugin repo with `git -C`. No co-author trailers or AI attribution in commit messages.

Drive-by fixes: only obviously-correct, local to a file you touched, cannot move a gate baseline — list them under `Drive-by fixes:`. Everything else goes under `Follow-ups:` untouched.

## 3. Gates — the full `dse-verify` battery, in order

Expected baseline at `08206e3` (dse-verify CURRENT block): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5446 passed / 1 skipped / 232 of 233 suites** (+ your new tests/suites; on a fresh worktree jest reads one fewer passed / 2 skipped until `npm run shots` has run — compare after shots) · lifecycle **30/30** · e2e **`OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** (no new e2e expected — numbers unchanged) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** — data-path change, expect NO PNG change; any freeze delta is a STOP-and-report, never a rebaseline · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Lifecycle and e2e are required to land. No new lifecycle scenario expected (if you find you need one, its id is G-S19).

Run rules (each cost real time before):
- Exit codes: `devbox run -c <path> -- bash -c '…; echo rc=$? > f'` ALWAYS records 0. Instead write one script file per gate with the Write tool in your private scratch dir (it `cd`s into the plugin repo, runs the gate with output redirected to a uniquely named log, then `echo rc=$? > <unique rc file>`), and run it with `devbox run -c /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements -- bash <script>`. Read each gate's summary line from its log, not just the rc.
- One gate per Bash call. Never a compound `cd X && …` in the Bash call itself. Never pipe a gate through `tail`.
- `rm -f main.js styles.css` in the plugin root (exact paths) before `npx jest` (stale-bundle footgun).
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r1-impl-<your agentId>/`. All scripts/logs go there with unique names. Create files with the Write tool, not heredocs. Never glob `rm`; delete only paths you created, by exact name. Never `rm -rf` anything under `.superpowers/`.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9297) for lifecycle; other sessions run it concurrently.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line (or `readlink /proc/<pid>/cwd`) is inside `worktrees/sc482-wrapper-default-keys/`. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or any shared glob.
- Never `--headed` / `DISPLAY=:1`.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; never background a gate and wait for a notification (it never comes).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or a per-run unique path.
- Use `git -C <absolute path>` for every git command.
- No tags, no releases, no pushes.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/sc482-r1-impl-report.md`. Open with a ≤10-line executive summary (verdict, final shas, gate numbers). Body: helper API as built; per element the recorded keys and how presence survives each writer; stamina-bar move outcome; every changed fixture (file:line, before/after); new test names; the e2e summary line and run id; Drive-by fixes; Follow-ups. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin sha(s), superproject sha, measured gate numbers, plus the filesystem path of every evidence artifact (report, gate logs). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-482:`.
