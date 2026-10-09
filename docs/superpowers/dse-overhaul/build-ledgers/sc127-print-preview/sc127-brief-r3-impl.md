# SC-127 round 3 — implement option A (print preview draws its own paper), guards, gate tightening, docs, battery, rebaseline

You are an `orchestration:implementer` worker. Your final text goes to the SC-127
ticket-owner (an agent), not a human: raw facts (verdict, shas, measured numbers), no prose,
plus the absolute path of every artifact you produce. **Workers never call the tracker.**

## Context loading (read first, in this order)

1. Ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-decisions.md`
   — Scott's ruling verbatim, the adopted option, the deferred-finding rulings (SC-348 is
   OUT of scope: do not touch the role-chip colour).
2. Round-2 design report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r2-design-report.md`
   — §2 diagnosis (file:line), §3 option A, §4 specificity plan, §5 gates/guards (your
   spec for the new guards and the gate tightening), §6, §7. Read it fully; it is your spec.
3. Patch `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r2-option-A.patch`
   — the starting point (`git apply --check`-clean against `e4bcd0f`).
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
   branch `sc127-print-preview`, at dse `origin/develop` `e4bcd0f`. Verify `pwd` before any
   write. First: `git fetch origin && git rebase origin/develop` inside that clone (the
   owner expects `e4bcd0f`; if develop moved, note the new sha and `npm ci` if
   `package.json`'s obsidian version changed). NEVER write under
   `/home/scott/code/steelCompendium/workspace/` (shared main checkout).
5. Skills: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (whole battery section, devbox wrapping, exit-code footgun, stale `main.js` footgun,
   in-run gates, freeze semantics, division of labor — you NEVER touch the shared
   baseline), `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md`.
6. Devbox: Node is NOT on PATH.
   `cd /home/scott/code/steelCompendium/worktrees/sc127-print-preview && devbox run -- bash -c 'cd draw-steel-elements && <cmd>'`.
   Devbox's sh wrapper eats `$?`; never pipe a gate into `tail`; run gates via small
   wrapper script FILES that capture the exit code, output redirected to files under
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/` (prefix `sc127-r3-`).

## Scott's ruling (verbatim, from the ledger)

> "I moved the ticket. Go ahead with your recommendation"

— approving: "confirm in Obsidian what dark theme plus `printPreview` looks like, then fix
the plugin, most likely by making the preview draw its own light page. The freeze baseline
would then move as a side effect of that fix." Confirmed in round 1; option A chosen in
round 2. The harness twin combo (`shoot.mjs` COMBOS `{ theme:'steel', bg:'dark',
print:true }`) STAYS as is — it is the regression gate for this bug. Do not change it.

## The task

### 1. Apply option A
`git apply` the patch. Then review every line of it as if you wrote it: comment blocks
must explain the (0,4,0) padding, why paper is `@media screen` only (91/130 realprint
files moved by 1/255 when it was universal — measured in r2), why the host mappings are
re-declared (custom properties inherit the already-resolved dark value), and the 1.13.7
pin dependency. Update `styles-source.css`'s host-rules listing comment if the patch's
host block should be listed there (read the comment's own rules and the host-copy pin in
`shoot.mjs`/`obsidian-host-pin.mjs` to decide; the pin must still print `host-copy pin OK`).

### 2. New guards (report §5, "New guards to add in round 3")
(a) `theme-print` test: the paper rule exists at (0,4,0) with `color: var(--dse-fg)`, and
its `background: var(--dse-page-bg)` sits only under `@media screen`, never inside an
`@media print` block.
(b) In-run check in `shoot.mjs`, beside the host-copy pin: the `.theme-dark` host block's
palette literals equal the resolved pinned sheet's `.theme-light` values (so a pin bump
cannot silently leave stale values). Print an OK line with the count; fail loudly with the
drifted names.
(c) Can-fail self-test for the paper exemption in `assertPrintTwinDelta`: a synthetic root
with a non-white background must fail; a descendant painting white-vs-transparent must
fail. Follow the existing self-test pattern in `shoot.mjs` (SC-202 r6c built one).
Every new jest test must be proven can-fail (temporarily break the thing, see red, restore)
and the proof recorded in your report.

### 3. Gate hole + tightening (report §5)
- Fix `nativeControlAdjacent` in `captureMountSnapshotForPrintDelta`: skip unrendered
  descendants (`getClientRects().length === 0` / `display: none`) so the hidden
  `.dse-chrome` buttons no longer qualify 73/75 roots. Keep the precise paper exemption.
- Then tighten: (1) excuse `color` only on nodes OUTSIDE an element root; (2) delete the
  `NATIVE_CONTROL_PAINT_PROPS` widening (`backgroundColor`/`boxShadow`) since control paint
  converges under A. Update `test/.../printTwinDeltaAllowedSet.test.ts`'s floor
  deliberately, with a comment citing SC-127. If a residual difference legitimately blocks
  (2) on the full sweep, do NOT force it — report the residual nodes (capture id, node,
  values) and leave (2) out.
- Prove the tightened gate can fail: with the SC-127 root exemption removed, a full or
  `--element=feature` run must now FAIL (r2 showed it passed silently before the hole fix).
  Record the failing line in the report, then restore.

### 4. Drive-by (optional, fold only if trivial)
`styles-source.css` ~`:210-212` `.dse-feature__nested > .dse-feature:hover { background-color:
var(--dse-surface-raised) }` paints white on hover inside the print preview. If a
`:not([data-dse-print="on"])` guard fits the surrounding convention and moves no twin bytes
beyond those already moving, add it; otherwise skip and say so.

### 5. Docs (part of done)
- Plugin docs in the worktree's `draw-steel-elements/docs/`: `settings.md` (~line 33,
  "Print preview"), `styling-statblocks.md` (~line 87), `advanced-usage.md` (~lines 68,
  132). Say in plain words, for non-technical users: the preview now draws its own light
  page and black text regardless of your Obsidian theme, so it shows what the PDF export
  produces; in a dark vault the elements sit as white pages on the dark note. Do not cite
  ticket numbers in user docs.
- `docs/Media`: `visual-harness/docs-manifest.mjs:475` has a `pref: ['printPreview','on']`
  entry — that docs image now looks different. Regenerate it with `npm run docs-shots`
  (starts its OWN Xvfb; needs the devbox `xvfb` package; writes only `docs/Media`, never
  `shots/`). If the manifest supports narrowing to that entry, narrow; if the run costs
  more than ~20 minutes or Xvfb is unavailable, skip and report it as a follow-up.
- **Workspace-level files live in YOUR worktree's superproject** —
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/CHANGELOG.md` and
  `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/.claude/skills/dse-verify/SKILL.md`
  — **never under `/home/scott/code/steelCompendium/workspace/`.**
  - `CHANGELOG.md` `## Unreleased`: one user-facing bullet — Print preview is readable in a
    dark-theme vault: it draws its own white page with black text, like the PDF export
    (SC-127).
  - `dse-verify` SKILL.md: in the 2026-08-08 plan-25 entry, the sentence calling the
    dark-on-dark twin "a longstanding **harness capture artifact** … a separate follow-up
    will re-capture print over the light scheme" — append, in place, a bracketed
    "**Superseded 2026-09-23, SC-127:** it was a real product bug (the print preview in a
    dark vault), fixed by the preview drawing its own paper; the twin stays captured over
    the dark scheme as that bug's regression gate." Also update the "Freeze semantics"
    prose where it describes what the twin shows if it now reads wrong. Do NOT write the
    dated rebaseline record — the dispatcher writes that at landing.
  - Any `visual-harness/README.md` text describing the twin as dark-on-dark.

### 6. Commits
Commit inside the dse clone on `sc127-print-preview` in coherent steps (CSS fix; gate +
guards; docs), then commit the superproject pointer bump + workspace doc edits in
`/home/scott/code/steelCompendium/worktrees/sc127-print-preview` (two-commit rule). Commit
messages: plain, no co-author or AI-attribution trailers of any kind (Scott's standing rule).
Commit after every coherent step so nothing sits uncommitted through a gate.

### 7. Battery (full, in order, per dse-verify) — expected numbers
Baseline at dse `e4bcd0f` (SC-334 landing): tsc clean; lint clean; jest 3919 passed /
1 skipped / 202 of 203 suites; shots 524, 0 FAIL, all in-run gates OK (host-copy pin OK,
button host-leak OK, print-twin delta OK, your new (b)/(c) lines OK); freeze
**expected: exactly 130 FAILED, all `*--steel-print.png`, and 0 `*--steel-realprint.png`
FAILED** (130/130 realprint OK) — anything else is a defect to diagnose, not to explain
away; parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0. `rm -f main.js styles.css`
before `npx jest`. Report every number.

### 8. Rebaseline deliverable (you never touch the shared baseline)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-rebaseline.txt`:
  exactly 130 `<sha256>  <filename>` lines, `*--steel-print.png` only, sorted like the
  baseline. **Deterministic across two CLEAN sweeps** (delete `visual-harness/shots/*`
  between them; `sha256sum` of all 130 twins identical run-to-run; also confirm all 130
  realprint hashes equal the baseline's lines in both sweeps). Record both sweeps' log
  paths.
- After crops for the sanction ask at the FINAL commit: `sc127-r3-after-<id>-dark-twin.png`
  for `statblock-charline-two`, `feature`, `initiative`, `negotiation`, `hero` — the
  actual `visual-harness/shots/<id>--steel-print.png` files copied (and a top-1300px crop
  of each, `-top.png`). The befores exist in `.../sc127/r2/sc127-r2-before-*`.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r3-impl-report.md`,
opening with a ≤10-line executive summary: final dse sha + superproject sha; battery
numbers; freeze 130/0 confirmation; rebaseline path + determinism proof; can-fail proofs
(one line each); what was skipped (docs-shots? tightening (2)?); `Drive-by fixes:` and
`Follow-ups:` lists. If the report-file write is blocked, return it inline.

## Footguns
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions/branches; a stale log will match. Read the process's own
  output or write to a per-run unique path.
- Redirect long-running output to a file; the 600 s stream watchdog kills silent agents.
  Run every gate in the FOREGROUND; never background one and wait for a notification.
- You cannot `SendMessage` me; `to:'main'` reaches the dispatcher, not me. Need input →
  end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever
  do message, FIRST WORD `SC-127:`.
- Never `rm -rf` anything under `.superpowers/`; never edit `freeze-baseline.sha256` or
  `check-freeze.sh`.
- A stale superproject pin can fail `token-coverage.test.ts` (reads the workspace D3 token
  map by candidate path) — compare copies before believing it; `DSE_TOKEN_MAP_PATH` points
  it at the main checkout's copy.
- Obsidian camera not needed this round. If you run `docs-shots`, it starts its own Xvfb;
  never use display `:1` / port 9223.

## Return contract
Final text: dse sha, superproject sha; battery numbers; freeze mismatch count by class
(twin / realprint); rebaseline path and determinism; can-fail proofs; skipped items;
drive-bys; follow-ups; artifact paths. No prose beyond that.
