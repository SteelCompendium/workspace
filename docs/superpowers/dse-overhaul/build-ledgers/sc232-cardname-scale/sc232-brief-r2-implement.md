# SC-232 round 2 — implement Option A (Steel card-head name at site size, per family)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured
numbers) plus the path of every evidence artifact. Workers never call the tracker (Linear).

## Context loading

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/decisions.md`
   — read all of it; the "Owner rulings" section is your spec.
2. Survey: `.../sc232-cardname-scale/sc232-r1-survey-report.md` (exec summary + §6 Options,
   Option A) and its scripts in `.../sc232-cardname-scale/r1-survey/scripts/`
   (`plugin-measure.mjs`, `site-measure.cjs`, `crops.mjs`, `probe-A.css`, `probe-B.css` — reuse them).
3. Worktree: `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale`, branch
   `sc232-cardname-scale`. **`pwd`-check before every write.** Plugin at
   `draw-steel-elements/`. First: `git -C <wt>/draw-steel-elements fetch origin && git -C
   <wt>/draw-steel-elements rebase origin/develop` — expected `origin/develop` = `619c4bd`
   (if it moved, rebase and say so). Any workspace-level file (DESIGN.md, CHANGELOG.md, docs/)
   lives in YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/sc232-cardname-scale/…` — never under
   `/home/scott/code/steelCompendium/workspace/` (that is the shared main checkout; only the
   ledger dir and the read-only dse-verify skill/freeze script are used from it).
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## The task

**Step 1 — the rule (commit).** Implement the survey's Option A in `styles-source.css` as one
new, clearly-commented `SC-232` rule group placed after the Steel head block (~:7224), every
selector prefixed `[data-dse-theme='steel']:not([data-dse-print="on"])`:

| Family | Selector (per survey) | font-size | line-height | letter-spacing |
|---|---|---|---|---|
| generic (kit head, traits, nested sub-features) | `.dse-head__primary--left` | `calc(var(--dse-fs-heading) * 1.35)` → 27px | 1.04 | 0 |
| standalone ability card | `[data-dse-element='feature'] > .dse-feature > .dse-head > .dse-head__primary--left` | `* 1.665` → 33.3px | 1 | 0 |
| statblock | `.dse-sb > .dse-head > .dse-head__primary--left` | `* 2.07` → 41.4px | .95 | 0 |
| featureblock | `.dse-fb > .dse-head > .dse-head__primary--left` | `* 1.89` → 37.8px | .98 | 0 |

Verify the selectors against the real DOM (the survey's `dom-chain.mjs`); fix them if they
miss or over-match (e.g. a nested sub-feature head inside a statblock must stay generic 27px,
like the site). Do NOT touch the unscoped rule `:13636-13643`, the `--dse-fs-heading` token,
or SC-284's cardHead hunks (~13588, ~13671) — the unlanded SC-284 branch edits those.

Owner ruling (verbatim from the ledger): "**Narrow widths must not get worse than a readable
wrap.** Mirror the site's own narrow step-down (statblock 41.4 -> 33.3 under 34em) as a
container-width rule scoped inside the new SC-232 rule group. Do NOT edit SC-284's cardHead
hunks (~13588, ~13671)." Use whatever container-query mechanism the plugin already uses for
its `-narrow` captures (find the precedent; don't invent a new one). Measure line counts of
the name in every `*-narrow` capture before/after; the survey saw `statblock-sticky-narrow`
go 5 → 8 lines under raw A. Report the after count and whether any word breaks mid-word.

**Step 2 — whole-card side-effect check (no commit needed; evidence).** Diff the computed
font-size/line-height of EVERY text element in every Steel dark capture, base vs after. Only
name nodes may change. The ratio comments at ~7816/~7915 say the sub-feature minis were
derived from the plugin's own 20px name — confirm nothing that is `em`-relative to a name
moved unintentionally. List any non-name node that moved.

**Step 3 — comments (commit).** Fold: fix the stale `.fb__feat-name` comment near ~7911 and
the ~7816/~7915 ratio comments so they describe the new truth (comments only, no values).

**Step 4 — parity pairs (separate commit so it can be dropped).** Add per-family name pairs
to `visual-harness/parity/selector-map.json` so the gate compares the name's
font-size/line-height (site `.sc-head__left-primary` per family ↔ plugin
`.dse-head__primary--left` per family). If the harness's site/plugin fixtures make a
family unreachable or the pair needs new machinery, stop at the families that work and
report why the rest don't. Under Option A these pairs must pass with 0 new WARNs; state the
new check counts.

**Step 5 — gates**, full battery in dse-verify order, at your final head. Expected at base
`619c4bd`: tsc clean; lint clean exit 0; `npx jest` **4038 passed / 1 skipped / 208 of 209
suites / 3 snapshots** (`rm -f main.js styles.css` in the plugin root first; if you add a test,
state the new count); `npm run obsidian-lifecycle` **`19/19 ok, 0 failed`** (set your own
`DSE_LIFECYCLE_PORT`, e.g. 9287); `npm run shots` **524, 0 FAIL**; `bash
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh
<wt>/draw-steel-elements/visual-harness/shots` **`freeze OK (260/260 …)`** — Option A is
screen-only, so print must NOT move; any FAILED line is a scoping leak to fix, never to
rebaseline; `npm run parity` **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0** (plus
whatever your new pairs add, all passing). Skip `obsidian-shots` (display is shared).

**Step 6 — evidence for Scott (no commit).** Into
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/r2-evidence/`:
- `sc232-compare-wide.png`: one composite, rows = feature (ability card), statblock,
  featureblock, kit; columns = **Today (20px)** | **Option A (this branch)** | **Option B
  (shared 27px, via probe-B.css)** | **Site**. Label every row and column in text on the
  image (Scott is colorblind — labels, never color, carry meaning). Steel dark, 900 wide.
- `sc232-compare-narrow.png`: the same idea for the narrow captures that changed most
  (include `statblock-sticky-narrow`): Today | Option A.
- Keep each composite ≤ ~2000px tall; downscale rather than exceed.

## Rules

- **Kill processes only by PID, and only ones whose command line contains
  `worktrees/sc232-cardname-scale/`** (`pgrep -af "worktrees/sc232-cardname-scale/"`, check
  each line). Never `pkill`/`killall` by pattern — concurrent sessions run the same gates.
- Commit after each coherent step (steps 1, 3, 4, and any fix). No tags, ever. Never push.
  Never touch dse `main`. Never edit `.superpowers/sdd/freeze-baseline.sha256`.
- Never `rm -rf` the shared `.superpowers/` dir; your scratch goes in
  `.superpowers/sdd/sc232-cardname-scale/r2-*` or your own session scratchpad.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'` with the gate command LAST, output
  redirected to a per-run unique log file; read the tool's own summary line, never an echoed
  `$?`. Run gates in the FOREGROUND — never background a job and wait for a notification (it
  never comes). Redirect long output to files (600s silent-agent watchdog). Never key a wait
  loop on a scratch filename or its contents — stale logs from other branches exist.
- Load-sensitive jest suites (settings-tab, settings-preview): on a timeout-shaped red, check
  `/proc/loadavg` and re-run before believing it.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` the ticket-owner (`to: 'main'` reaches the dispatcher, not me). If
  you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway,
  the first word is `SC-232:`.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc232-cardname-scale/sc232-r2-implement-report.md`,
opening with a **≤10-line executive summary** (head sha, per-family px measured after, the
narrow line counts, freeze/parity/jest numbers, any non-name node that moved). Then
`Drive-by fixes:` and `Follow-ups:` lists. Final text: verdict, commit shas, gate numbers,
paths of the report, both composites, and every other artifact.
