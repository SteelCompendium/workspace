# SC-494 r1 — independent review: block edit form Save keeps the reserved collapse keys

## 1. Context

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/decisions.md` and the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/sc494-r1-impl-report.md` (summary first).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line` (branch `sc494-form-collapsed-line`). Plugin: `/home/scott/code/steelCompendium/worktrees/sc494-form-collapsed-line/draw-steel-elements`. Review head: dse `13b5df6` on `efc17de`; superproject `0eb4ac5 (on origin/main 7e45f8d)`. Do not commit to the branch; leave `git status --short` empty at the end (plugin and superproject). For mutants, edit, run, then `git -C <plugin> checkout -- <file>`.
- Workers never call the tracker (Linear).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. Task

Review the branch delta (`git -C <plugin> log --oneline efc17de..HEAD`, `git -C <plugin> diff efc17de`) against ledger D1–D4 (quoted):

> - D1 (2026-10-23). Fix shape: the form handles the three reserved collapse keys (`collapsed:`, `collapsible:`, `collapse_default:`) the SAME way the pipeline does, using the pipeline's own helpers (`src/framework/chrome/collapsedKey.ts`: `extractCollapseKeys(rawData, claimLegacyKeys)`, `withCollapseKeys`; claim rule `def.chrome !== undefined && def.collapseKeysOwnedByModel !== true`, pipeline.ts ~366–380 and ~550–565). At open: pop the claimed keys out of `working` (so schemas — six are `additionalProperties: false` — and `def.parse` never see them, as in the pipeline). At Save: re-emit only the keys actually popped, in the pipeline's order (`prefs:` … `collapsed:` … body), on BOTH the serialize path and the stringifyWorking path. A key the model owns (`ds-stamina` / `ds-skills` `collapse_default:` / `collapsible:`) is left in place and serialized by the model, never duplicated. Ideally one shared helper so form and pipeline cannot drift (SC-493 precedent: `src/framework/blockBody.ts`). Save with no edit on a block with `collapsed:` writes the block byte-identical (SC-483 rule: "write no byte the user never typed").
> - D2. Scope: src/authoring/FormModal.ts, plus a shared helper in src/framework/ (e.g. chrome/collapsedKey.ts) if one is extracted, plus tests. Off limits: src/framework/host/, element parse/serialize code. SC-509 (card doesn't refresh after a form Save in real Obsidian) is related but separate — do not touch it; tests assert the written note bytes and a fresh re-render, not live card refresh.
> - D3. Tests: red commit first; jest through the real FormModal + the real write path, then re-render the written note through the real pipeline/host (ReadingModeBlockHost pattern from SC-482 r2 / SC-493) and check the collapsed state is kept. Cover: (see ledger D3 for the full case list.)
> - D4. CHANGELOG bullet under `## Unreleased` in the worktree superproject.

Owner rulings on A's report (from the ledger, quoted):

> - Odd source order (collapsed: last / mid-body / before prefs:) normalises on a no-edit Save to the pipeline's order (prefs:, collapse keys, body); canonical order is byte-identical. ACCEPT — same as the pipeline's own write-back and as prefs: already behaves; no byte is added.
> - Follow-ups 1–3 (skills schema true/false quirk; raw-box check not popping reserved keys; non-boolean `collapsed:` dropped): DROPPED — do not re-raise unless you find a concrete failure the reason above misses.

A flagged two defs as unprobed: `hero` (its serialize splices raw definition text — check for a double-emitted or lost collapse line) and `heroic-resource`. Probe both explicitly.

Execute and probe, do not only read:
1. Red tests fail at `efc17de`'s FormModal (scratch `git worktree add` at an absolute path in your private scratch dir, or a temporary revert you restore) and pass at HEAD.
2. Mutants: drop the re-emit on the serialize path; drop it on the stringifyWorking path; drop the pop at open; flip the claim rule (claim model-owned keys); swap the `prefs:`/`collapsed:` order. Each must turn a test red (report equivalents).
3. Differential vs the pipeline: for every element def with chrome (list them), for sources carrying each of `collapsed: true|false`, `collapsible: false`, `collapse_default: true`, combined with and without `prefs:`, in different source positions — compare the bytes a no-edit form Save writes with the source, and with what the pipeline's own write (a tracker click / `replaceSource` via the pipeline serializer) writes for the same block. Any duplicate key, lost key, or key the user never typed is a finding. Also: does any element now render differently after a form Save than before it (collapsed/expanded state, collapsible chrome)?
4. Schema'd elements with `additionalProperties: false`: form opens on a block with `collapsed:` with no schema error, Save enabled, writes it back.
5. Integrity probes (it writes into user files): content above/below the fence survives; two same-kind blocks in one note don't cross-talk (Save on the second keeps its own collapse state and leaves the first's alone); hand-edited content around survives.
6. Real Obsidian: one screenshot set for Scott through the real plugin build (lifecycle/e2e harness machinery or obsidian-shots tooling — see dse-verify): a `ds-stamina-bar` block with `collapsed: true`, shown collapsed; after opening the edit form and pressing Save, the note source still has `collapsed: true` (screenshot or captured note bytes) and the block, once re-rendered (reopen the note — SC-509 means the live card may not refresh; say which you did), is still collapsed. Describe in words what each image shows (no color-only descriptions — Scott is colorblind).
7. Run the full battery once at HEAD (dse-verify): expected tsc/lint clean · jest 6024 / 1 / 243 of 244 suites (as A measured) · lifecycle 36/36 (37/37 if G-S37 was added) · e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · shots 592, 0 FAIL · freeze `freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED. Known load flake: `test/dom/elements/initiative-default-keys.test.ts` timeout (SC-506) — re-run once. Freeze script: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <plugin>/visual-harness/shots` (read-only; never touch the baseline).

Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Verdict LAND-READY or NOT.

## 3. Command rules (each has hung or broken a worker before)

- Absolute paths; `git -C <abs path>` for every git command; never `cd X && …` in a compound command.
- devbox: `devbox run -c <plugin abs path> -- <cmd>`. Record exit codes by running a script FILE through devbox (`devbox run -c <plugin> -- bash <script>`; script redirects to a log and writes `echo rc=$? > <rcfile>`). Read each gate's own summary line.
- One blocking gate per Bash call, foreground, `timeout` 600000. No `run_in_background`, no Monitor, no background jobs. Split lifecycle / e2e / shots into separate calls. Redirect long output to files.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc494-r1-review-<your agent id>/`; unique names for every script/log/rc; write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable or glob target, ever. Never `rm -rf` under `/tmp` by pattern (other efforts' vaults match `/tmp/dse-obsidian-lifecycle-*`) or anything under `.superpowers/` except your own files.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree or scratch dir.
- Lifecycle: own port, e.g. `DSE_LIFECYCLE_PORT=9295`.
- Never key a wait on a scratch filename or its contents. Never tag, deploy, push, or `just wt-finish`.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc494-form-collapsed-line/sc494-r1-review-report.md`, opening with a ≤10-line executive summary. Screenshots into the ledger dir as `sc494-r1-shot-<what>.png`. If the report write is blocked, return it inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Verdict; findings list (severity, file:line, one line each); red-at-base counts; mutant results; gate numbers measured; the filesystem path of every evidence artifact (report, screenshots, logs).

You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-494:`.
