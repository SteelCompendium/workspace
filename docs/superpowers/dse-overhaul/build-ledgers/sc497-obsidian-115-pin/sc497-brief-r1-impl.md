# SC-497 r1 implementer brief — re-extract the Obsidian host button copy from 1.15.0

Your final text goes to the SC-497 ticket-owner, not a human. **Workers never call the tracker**
(Linear) — not to read history, not to post.

## 1. Context loading
- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-decisions.md`.
  Its "Owner rulings" section is binding scope.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the battery, command shapes,
  "In-run gates inside `npm run shots`", and "Current expected numbers" (CURRENT @ d152ea4).
- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r2-report.md` lines 1-45 (the diagnosis).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin`, plugin at
  `/home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin/draw-steel-elements`, branch `sc497-obsidian-115-pin`,
  base dse `develop` @ `d152ea4`. First: `git -C <plugin path> fetch origin` and confirm
  `git -C <plugin path> rev-parse origin/develop` is still `d152ea4`; if it moved, rebase onto it and report the new base.
- Verify your target path before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` except
  your report file in the ledger dir. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.

## 2. The task
Obsidian on this machine self-updated to 1.15.0 (`/home/scott/.config/obsidian/obsidian-1.15.0.asar`). `npm run shots`
now exits 1 with `HOST COPY DRIFTED`: the hand-maintained host model `OBSIDIAN_HOST_BUTTON_CSS` in
`visual-harness/shoot.mjs` (extracted from 1.14.0) differs from 1.15.0's app.css in rules #3, #5, #6.

Do the documented self-update procedure (the drift message at `visual-harness/shoot.mjs` ~line 1660 prints it):
1. Extract `app.css` from the 1.15.0 asar **into your private scratch folder** (read-only use of the asar; never write,
   move or modify anything under `/home/scott/.config/obsidian/`). `visual-harness/obsidian-host-pin.mjs` already knows
   how to read the asar — reuse its reader rather than inventing one if practical.
2. Before editing, write down for the report: for each of the 6 button-reaching rules, the 1.14.0 copy text vs the 1.15.0
   text, and classify each difference as (a) minifier spacing/quoting only or (b) a real declaration/selector change.
   Also diff the 14 tokens × dark/light the pin checks. This classification decides whether frozen bytes can move.
3. Re-extract the copy verbatim from 1.15.0 into `OBSIDIAN_HOST_BUTTON_CSS`. Bump `PINNED_OBSIDIAN` to `'1.15.0'` in
   `visual-harness/obsidian-host-pin.mjs` and add a provenance paragraph in the same style as the existing
   "SC-202 pin-bump round (2026-09-02): 1.13.7 -> 1.14.0" paragraph (say SC-497, 2026-10-23, what changed).
   Keep the `styles-source.css` `[SC205-HOST-RULES]` listing in step. Update other comments that name 1.14.0 as the
   model's pinned version so they stay true (e.g. `visual-harness/fetch-obsidian-app-css.mjs:136`,
   `visual-harness/obsidian-light-island.mjs:63`) — comments only.
4. Owner rulings, verbatim from the ledger:
   > OUT of scope: `visual-harness/obsidian-app-css.pin.mjs` (`OBSIDIAN_APP_CSS_PIN`, the exact-content real-app.css pin at 1.13.7). It is a separate pin (SC-202), and SC-202's Scott-approved shape says "pin bumps are deliberate with their own sanctioned rebaseline". Do not bump it here. If shots prints a drift WARNING about it, report the line; do not act on it.

   > If the 1.15.0 rules differ only by minifier spacing/quoting, still re-extract the copy verbatim from the asar (the printed remedy). Do NOT loosen the comparator to whitespace-insensitive matching — that is parser work (SC-276 territory), not a pin bump.
5. If any jest test pins the copy text or the version string, update it in step and say which. If the pin prints
   `unclassifiable` for a 1.15.0 selector shape, STOP and return NEEDS_CONTEXT (that means teach the parser, which is
   a scope decision for the owner).
6. Commit inside the plugin after each coherent step (`git -C <plugin path> …`). Message style:
   `fix(SC-497): …`. No co-author/AI trailers. Do NOT push, do NOT tag, do NOT touch the superproject pointer.

## 3. Gates (full dse-verify battery, in order; expected = CURRENT @ d152ea4)
tsc (incl. `-p e2e`) clean · lint (incl. e2e) clean · jest **5769 passed / 1 skipped / 238 of 239 suites** (after a shots
run has cached `visual-harness/dist/obsidian-app.css`; ±N only for tests you changed — explain) · lifecycle **32/32** ·
e2e **`OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592 PNGs, 0 FAIL, rc 0** ·
freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Shots must now print, and you must copy into the report **verbatim, full line**: the `host-copy pin OK (…)` line, the
`button host-leak OK (…)` line (last known 112 kinds / 672 comparisons, 10-record exemption boundary), the
`modal button host-leak OK (…)` line (last known 10 scenarios / 9 classes / 38 kinds / 228 comparisons, 6-record
boundary) plus its `not openable` line, confirmation there is NO `ALLOWLISTED` line, both text-scale lines,
`pressed toggle parity OK`, `pipette selected look OK`, `chrome host-leak OK`, and any WARN/drift line about the app.css pin.

If freeze is NOT 280/280: do not touch the shared baseline. Write
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-rebaseline.txt` (ready-to-apply
hash lines per dse-verify's sanctioned-rebaseline procedure) plus before/after crops of each moved shot in your scratch
folder, and say why bytes moved (tie it to the step-2 classification).

## 4. Command and process rules (each one cost real time before)
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin/draw-steel-elements -- bash <script file>`.
  Never put `cd` inside a compound command. Never `cd X && devbox …`. Use `git -C <abs path>` for every git command.
- Exit codes: record them from a script FILE run through devbox (the script does `cmd > log 2>&1; echo $? > rc-file`);
  `bash -c '…; echo rc=$?'` under devbox always reads 0. Never pipe a gate into `tail`. Read each gate's summary line.
- Private scratch: make `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-impl-<random6>/`
  and put every script, log and extracted file there, uniquely named. Write scratch files with the Write tool, not heredocs.
- **One blocking foreground gate per Bash call** (lifecycle, e2e, shots each separate; set timeout 600000). No
  `run_in_background`, no Monitor, no waiting for notifications. Redirect long output to a log file, never stream it.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across sessions and a stale
  log from another branch will match. Read the process's own output or your per-run unique path.
- Never `pkill`/`killall` by pattern; kill only a PID you verified is yours (`readlink /proc/<pid>/cwd` inside your
  worktree, or its parent `devbox run -c <your worktree path>`). Never `rm` a glob; delete only paths you created and
  recorded. Never `rm -rf` anything under `.superpowers/` except nothing — you own no dir there to delete.
- Lifecycle/e2e ports and vaults: follow dse-verify's concurrency guidance (other efforts run concurrently).

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-r1-impl-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, commit shas, freeze result, the host-leak/modal/text-scale
numbers). Body: the step-2 rule/token diff table and classification, files changed, gate table with log paths, the
verbatim shots lines, `Drive-by fixes:` and `Follow-ups:` sections. If the report-file write is blocked, return the
report inline.

Return contract: final text = raw facts (verdict DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED, shas, measured
numbers), no prose, plus the absolute path of every evidence artifact (report, logs, extracted css, crops).

You cannot `SendMessage` me — a depth-2 agent cannot reach its parent, and `to: 'main'` goes to the dispatcher. If you
need input, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message,
its FIRST WORD must be `SC-497:`.
