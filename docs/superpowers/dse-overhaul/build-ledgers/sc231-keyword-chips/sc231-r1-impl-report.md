# SC-231 round 1 — implementer report

## Executive summary

- Status: **DONE_WITH_CONCERNS**. Feature implemented per the owner's final ruling (one `.dse-feature__kw` chip per keyword, single render + DOM post-process, no duplicate elements). tsc/lint/jest/lifecycle/shots/parity all green.
- **Freeze is VIOLATED, not 260/260**, and I could not make it pass with the owner-mandated design. Root cause: splitting a continuous rendered text run into sibling `<span>`s measurably changes Chromium's sub-pixel glyph shaping/kerning at the split boundary — small (single-digit-to-low-hundreds pixels, tiny bounding boxes), but non-zero and **deterministic across two independent clean sweeps**.
- Deliverable: `rebaseline.txt` (55 lines / 28 capture ids), verified deterministic. This needs Scott's sanction before a dispatcher applies it — I did not touch the shared baseline.
- Two design iterations were tried and rejected/superseded before landing on the final one; full history is in the ledger and in the commits below. The host-leak probe (which the owner said must not be weakened) was NOT touched, and is green.
- Every gate ran in the foreground with output to log files; two long `npm run shots` runs auto-backgrounded past the tool's 120s default and were waited out via the Monitor tool per the harness's own "do not poll" guidance — later gate runs used explicit `timeout: 590000` to stay fully foreground per the owner's correction.

## Commits (branch `sc231-keyword-chips`, base `origin/develop` `6c4f6aa`, unchanged throughout — verified via `git fetch origin develop` before every gate round)

```
05e26ea fix(feature): SC-231 tolerate a trailing whitespace text sibling in chipifyKeywords
5bdef15 fix(feature): SC-231 chipify keywords by post-processing ONE render, not two
6578ea6 fix(feature): SC-231 keep the duplicated Keywords value focusable, not display:none   (superseded)
442c439 fix(feature): SC-231 render the keyword chip list as a duplicate, not a replacement    (superseded)
92aedbd fix(feature): SC-231 stop naming kwUsage's crest default in CSS
361848e docs(changelog): SC-231 one chip per keyword
e8cf059 test(feature): SC-231 keyword-chip edge cases   (superseded by 5bdef15's test rewrite)
fa214b1 feat(feature): SC-231 steel-screen keyword chips (crest mode)                          (superseded)
cb564a0 feat(feature): SC-231 split Keywords into discrete per-keyword spans                   (superseded)
```

**Design history (why there are "superseded" commits, not squashed — kept as an honest record; landing dispatcher's call whether to squash):**
1. `cb564a0`/`fa214b1`: per-keyword separate `md()` calls + literal `, ` text-node separators. **Rejected by me** before gating: broke print byte-parity two ways (a real renderer's per-call trailing whitespace showing as an extra space before the separator; residual sub-pixel kerning once whitespace was fixed).
2. `442c439`/`6578ea6`: single render for `.dse-feature__meta-value` (unchanged) PLUS a duplicate `.dse-feature__meta-kwlist` chip list, toggled by CSS. Passed the freeze gate and the host-leak probe (after a follow-up fix making the "off" copy visually-hidden-but-focusable, not `display:none`, to keep its links reachable). **Rejected by the ticket-owner** (decisions.md, 2026-09-25): a focusable 1×1px clipped link is an invisible Tab stop (WCAG 2.4.7), every keyword is announced twice to screen readers, and every link exists twice in the DOM.
3. `5bdef15`/`05e26ea` (**final, current HEAD**): single render, no duplicate. `chipifyKeywords()` post-processes the ALREADY-RENDERED markdown (once the async render settles) — splits the rendered wrapper's top-level inline content at literal commas into `.dse-feature__kw` chip spans, keeping each `", "` as its own `.dse-feature__kw-sep` span, moving (never cloning) any element node (e.g. a keyword that is itself a markdown link) whole into its chip. Every link exists exactly once. `05e26ea` fixes a real bug found only via the visual harness: a real markdown renderer leaves a trailing whitespace-only text-node sibling after its block wrapper, which broke the wrapper-detection logic in `5bdef15` and caused the ENTIRE rendered `<p>` to be treated as one un-split "keyword" (visually silent under jest's mock, which produces no such sibling — a real coverage gap the jest suite cannot close on its own).

## Files touched

- `src/elements/feature/renderFeature.ts` — `chipifyKeywords()`, `mdThenChipify()`, `cell()`'s `chipify` param.
- `styles-source.css` — `.dse-feature__kw` chip box, `.dse-feature__kw-sep` (hidden, crest-only), the crest-mode flex row on `.dse-feature__meta-value`; the `--type` chip rule's selector list shrank by one entry (`--keywords` dropped out, unaffected otherwise).
- `test/dom/elements/feature.test.ts` — new `describe('SC-231: …')` block, 6 tests.
- `CHANGELOG.md` — one `[FIX]` bullet under `## 7.0.0 (unreleased…)`.

## Surfaces touched / deliberately left alone

Single render path (`renderFeature.ts`'s `cell()`), consumed by every caller: the standalone `ds-feature` element, statblock's embedded ability list, featureblock's option list, `ds-kit`'s nested feature (confirmed live via the visual harness — a kit fixture nests a feature whose two keywords are themselves markdown links, `scc.v1:…/rule.combat/melee` and `…/strike`), and the Settings-tab live preview (`SettingsPreview.ts` reuses the same statblock/feature YAML). No other file emits `.dse-feature__meta-cell--keywords` — grepped and confirmed once at the start of the round. `kwUsage` display modes `text`/`grid`/`ledger` are explicitly excluded from the new crest-chip CSS (see the `styles-source.css` comment at the rule) — they keep the pre-existing single-run-with-visible-comma look, matching the site's own `steel-statblock.css` behavior for those three modes. Legacy theme no longer exists as a distinct surface (SC-144) — "the Legacy text-run" in the brief maps to print, which is what I gated on.

## Edge cases (unit-tested, `test/dom/elements/feature.test.ts`)

Multi-keyword (order preserved, separators between each pair, value textContent unchanged) · single keyword (one chip, zero separators) · empty `keywords: []` (no chips) · lone-dash placeholder (`--empty`, no chips, unchanged `"--"` dashFix text) · a keyword that is itself a markdown link (resolves inside its own chip; jest's mock can't prove it becomes a real `<a>` — that's the visual-harness's job, and it's what caught the accessibility bug in design #2 and the trailing-whitespace bug in design #3) · whitespace-around-a-comma / a-trailing-comma inside one hand-typed YAML list entry (normalizes to clean discrete chips).

## Gates — measured numbers

All run against `sc231-keyword-chips` @ `05e26ea`, foreground, `origin/develop` unchanged at `6c4f6aa` throughout (re-verified via `git fetch` before this final round).

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc231-r2-tsclint-3.log` |
| `npm run lint` | clean, exit 0 | `sc231-r2-tsclint-3.log` |
| `npx jest` | **4003 passed / 1 skipped / 206 of 207 suites / 3 snapshots**, exit 0 (baseline at `6c4f6aa`, measured this round: 3997 passed / 1 skipped / 206 of 207 / 3 snapshots — net **+6**, exactly my 6 new tests) | `sc231-r2-jest-full-2.log`; baseline `sc231-r1-jest-baseline-inplace.log` + `sc231-r1-jest-baseline-rerun-flake.log` (one baseline suite, `sidebarEncounterHandoff.test.ts`, flaked under concurrent-agent load and passed clean in isolation — unrelated to this change, load-sensitive-suite footgun) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 | `sc231-r2-lifecycle-2.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**, exit 0 — `inline host-leak OK` (the probe that caught design #2's accessibility bug and design #3's first cut) — run TWICE, byte-identical `rebaseline.txt` both times | `sc231-r2-shots-2.log`, `sc231-r2-shots-3.log` |
| `check-freeze.sh` | **`FREEZE VIOLATED (55 checksum mismatches, 0 missing)`**, exit 1 — NOT 260/260. Deterministic across the two sweeps above (`diff` of both sweeps' hash lists is empty; `check-freeze.sh` reports the identical 55-name set both times). See "Freeze — the part I could not close" below. | `sc231-r2-freeze-2.log`, `sc231-r2-freeze-3.log` |
| `npm run parity` | **0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0**, unchanged composition (no keyword-chip parity pair exists in `selector-map.json` — grepped, none found) | `sc231-r2-parity.log` |

## Freeze — the part I could not close

The owner's final-design ruling states plainly that the single-render/post-process shape should render Legacy/print byte-identically. I implemented it exactly as specified and it does NOT, and I want to be precise about why rather than guess further:

- `.dse-feature__meta-value`'s **total textContent is unchanged** — same characters, same order, proven by the unit tests and by eye (before/after crops below look identical at normal zoom).
- What moves is a **sub-pixel glyph-shaping/kerning difference right at the point a continuous text run gets split across sibling inline `<span>` boundaries** — even though nothing is re-rendered (the DOM nodes are *moved*, not re-parsed) and no new visible styling is added at that boundary (`.dse-feature__kw`/`.dse-feature__kw-sep` carry zero CSS outside the Steel screen scope). Diagnosed by direct pixel diff: the `feature--steel-print.png` mismatch is 324 differing pixels in a 33×22px box positioned exactly at the "Attack, Weapon" comma (`evidence-r1/diag/zoom-before.png` vs `evidence-r1/diag/zoom-after4.png` — visually indistinguishable at normal zoom, the diff is that subtle); `statblock--steel-print.png` is 45 pixels in an 8×10px box, same comma-boundary pattern. I spot-checked three more mismatched files (`feature-spend`, `feature-collapsed`, `feature-list`) and all three show the identical 324-pixel signature — consistent with one mechanism, not several different bugs.
- I could not find a DOM/CSS shape that both (a) satisfies the owner's rejection of design #2 (no duplicate elements, no hidden-but-focusable links) and (b) avoids this — every shape that puts the discrete keywords in separate DOM nodes for Steel to box individually necessarily also changes what Legacy/print (which share that DOM, per the "one render" mandate) paint at the split point, at least at this sub-pixel level.
- **55 lines / 28 capture ids** move (listed in `rebaseline.txt`), all of them ability-card-shaped fixtures that render Keywords (`feature*`, `statblock*`, `chrome-*` composites that embed one). None of the 28 ids show a large, structural difference on manual crop inspection (I checked `feature`, `statblock`, and the three spot-checks above) — all are this same tiny kerning artifact, not a second bug.
- I did **not** edit `freeze-baseline.sha256` — per the brief and the dse-verify skill, only the dispatcher applies a sanctioned rebaseline, backed up first.

**Deliverable:** `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/rebaseline.txt` — 55 `<sha256>  <filename>` lines, deterministic across 2 clean `npm run shots` sweeps (verified: `diff` of both sweeps' hashes is empty, and `check-freeze.sh` reports the identical 55-name mismatch set on both).

**This needs Scott's explicit sanction before it is applied** — I'm flagging it, not applying it, and the visual change itself (Keywords chips) already needs his eye per the ledger's owner ruling regardless of the freeze question.

## Evidence

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/evidence-r1/`:

- `feature-keywords-steel-dark-before.png` / `feature-keywords-steel-dark-after.png` — Steel dark, `feature` default fixture (2 keywords: Attack, Weapon). Before: one chip "ATTACK, WEAPON". After: two chips "ATTACK" / "WEAPON".
- `feature-keywords-steel-light-before.png` / `feature-keywords-steel-light-after.png` — same, Steel light.
- `feature-keywords-print-legacy-after.png` — the print/Legacy-equivalent surface (SC-144 retired the Legacy theme; print is today's plain-text-run surface, per `dse-verify`'s "Where 'legacy' went") — still plain "Attack, Weapon", no boxes, matching pre-SC-231 Legacy behavior. A separate `-before` isn't needed here since the whole point of this section is that it's (almost) unchanged; the residual is documented above instead.
- `diag/` — supplementary: pixel-diff crops proving the freeze residual is a sub-pixel kerning artifact, not a structural regression (`zoom-before.png`/`zoom-after4.png` at 10x zoom on the comma boundary; `diff-highlight4.png`/`statblock-diff-hl.png` showing the tiny bounding boxes).
- **Live v2 site render:** not attempted this round — time-boxed out after the freeze investigation; the `v2/docs/scc/...` static build exists in the worktree and `npm run shot-url` could render it in a follow-up round if wanted.

## Drive-by fixes

None.

## Follow-ups

- **The sub-pixel print-kerning mechanism itself** may be worth a named, permanent note somewhere (`ARCHITECTURE.md` or the `dse-verify` skill) for future ticket-owners: splitting a rendered text run across sibling inline elements — even via pure DOM node-moving, no re-render — measurably moves frozen print bytes in Chromium. This round is the second and third time it's been hit (design #1 and design #3); it will recur for any future "make this comma-joined value multiple elements" ticket.
- **`feature.keywords` can arrive as a raw (non-array) string at runtime** despite the SDK's `string[]` type, if a user hand-types `keywords: Attack, Weapon` with no YAML list syntax (verified: `feature.keywords.join(', ')` — unchanged code, pre-existing — would throw `TypeError: … .join is not a function` in that case; not exercised by any real or test fixture). Pre-existing, unrelated to this ticket's scope, not touched.
- **A 5-keyword wrapping example** (`test/fixtures/feature/magma-titan.yaml`, already exists, used only by jest) is not in the visual harness's fixture set — the `feature` default fixture's 2 keywords (Attack, Weapon) was sufficient multi-keyword evidence per the brief's "if a fixture needs one, add one" instruction (one already existed with 2, so I didn't add a new one), but a wider fixture would better demonstrate wrap behavior for a future design review. Not added — brief said add only if none exists.

## r2 — fix round (independent review r1, verdict FIX-ROUND)

**Summary (≤10 lines):** Fixed all FOLD-ruled findings from the r1 review (owner ruling in decisions.md, 2026-09-25): HIGH-1 (grid/ledger kwUsage modes had silently lost their small-caps voice + light-mode wash — `--keywords` is back in the shared base chip group; only crest-mode resets the cell's own box now, moving it onto each `.dse-feature__kw` chip; chip `font-size` is `inherit`, not the token again, to avoid doubling), LOW-1 (separator spans switched from `display:none` to the visually-hidden clip recipe so screen readers/copy-paste keep the commas), LOW-3 (stale comment pointer), MEDIUM-1 (added a test driving `renderFeature()` directly with a real-renderer-shaped `renderMd` stub — `<p>Attack, <a href="x">Weapon</a></p>\n` — proven non-vacuous by re-running it at the pre-fix commit `5bdef15`, where it fails), and the raw-string-keywords follow-up (FOLD: the touched path throws on it, one-line fix + one test). CHANGELOG.md corrected. HIGH-1's acceptance criterion (`statblock-kwusage-{text,grid,ledger}--steel-{dark,light}.png` byte-identical to `origin/develop`) verified directly, all 6 files match. Full battery re-run, all green; freeze still the same 55-name/55-hash set as `rebaseline.txt` (unchanged — the fix touched only screen-only selectors, confirmed by direct hash diff).

**Commits (branch `sc231-keyword-chips`, base still `origin/develop` `6c4f6aa` at this point):**
```
f229986 fix(feature): SC-231 fix round r2 — raw-string keywords fold + MEDIUM-1 test
2f67c34 fix(feature): SC-231 fix round r2 — HIGH-1 (grid/ledger lose small-caps), LOW-1, LOW-3
```
(these SHAs were later rewritten by the r3 rebase — see below for the post-rebase SHAs.)

**Gates at `f229986`:**

| Gate | Result |
|---|---|
| tsc | clean, exit 0 (`sc231-r2fix-tsc-2.log`, `-3.log`) |
| lint | clean, exit 0 (`sc231-r2fix-lint-1.log`) |
| jest (feature.test.ts + targeted) | 160 → **63/63** in feature.test.ts alone after the 2nd new test; full suite not re-run at this exact SHA (see r3, which supersedes it) |
| jest vacuity check | MEDIUM-1 test fails at `5bdef15` (`sc231-r2fix-jest-vacuity.log`), passes at `f229986` — proven non-vacuous |
| `npm run shots` | 524, 0 FAIL, exit 0, `inline host-leak OK` — 2 sweeps (`sc231-r2fix-shots-1.log`, `-2.log`) |
| `check-freeze.sh` | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)` — **identical name+hash set to `rebaseline.txt`**, verified by direct diff (`sc231-r2fix-freeze-1.log`, `-2.log`) |
| `npm run parity` | 0 GAPs / 0 undeclared / 16 DECLARED, exit 0 (`sc231-r2fix-parity.log`) |
| HIGH-1 acceptance | `statblock-kwusage-{text,grid,ledger}--steel-{dark,light}.png` (6 files) — **byte-identical to `origin/develop` `6c4f6aa`**, verified by direct `sha256sum` comparison (`sc231-r2fix-baseline-statblock.log`, `sc231-r2fix-branch-statblock.log`) |

**Evidence (`evidence-r2/`):** full-card-width before/after crops, Steel dark + light (`feature-full-steel-{dark,light}-{before,after}.png`); Grid and Ledger mode crops proving Keywords now reads small-caps "MAGIC, MELEE, STRIKE, WEAPON" matching Type's small-caps "MAIN ACTION" (`statblock-kwusage-{grid,ledger}-dark.png`); print before/after/amplified-diff crops for `feature` and `statblock` (`feature--steel-print-{before,after,diff-amplified}.png`, `statblock--steel-print-{before,after,diff-amplified}.png`). The independent reviewer's own r2 re-review additionally deposited `rev-*` files in the same directory, including a live-site-vs-plugin side-by-side (`rev-site-vs-plugin-keyword-chips-dark.png`) — covering evidence item (d) — so I did not duplicate that effort.

## r3 — rebase onto `origin/develop` `619c4bd` (SC-340 landed, 20 commits)

**Summary (≤10 lines):** Rebased cleanly (`git rebase origin/develop`, no conflicts — despite the dispatcher's warning, the CHANGELOG.md entries merged automatically since SC-340's addition and mine touch different regions of the same section). `npm ci` not needed (`package.json`'s `obsidian` devDependency version unchanged across the base bump). Full battery re-run in order, foreground, every number matching the dispatcher's prediction exactly, no flake this round. Freeze re-verified against `rebaseline.txt` via `sha256sum -c`: all 55 lines report `OK` — the rebase moved zero frozen bytes beyond what `rebaseline.txt` already covers.

- **New HEAD:** `a6fce4a` (fix(feature): SC-231 fix round r2 — raw-string keywords fold + MEDIUM-1 test)
- **Base:** `origin/develop` `619c4bd`
- **Tree:** clean before and after (`git status --short` empty)

**Full commit list post-rebase:**
```
a6fce4a fix(feature): SC-231 fix round r2 — raw-string keywords fold + MEDIUM-1 test
f253f0e fix(feature): SC-231 fix round r2 — HIGH-1 (grid/ledger lose small-caps), LOW-1, LOW-3
bf97ee9 fix(feature): SC-231 tolerate a trailing whitespace text sibling in chipifyKeywords
c767fe1 fix(feature): SC-231 chipify keywords by post-processing ONE render, not two
c990453 fix(feature): SC-231 keep the duplicated Keywords value focusable, not display:none      (superseded)
f8d888d fix(feature): SC-231 render the keyword chip list as a duplicate, not a replacement       (superseded)
d16ab11 fix(feature): SC-231 stop naming kwUsage's crest default in CSS
0450a27 docs(changelog): SC-231 one chip per keyword
c27af48 test(feature): SC-231 keyword-chip edge cases    (superseded by c767fe1's test rewrite)
02da4cd feat(feature): SC-231 steel-screen keyword chips (crest mode)                             (superseded)
633a54e feat(feature): SC-231 split Keywords into discrete per-keyword spans                      (superseded)
619c4bd fix(framework): SC-340 final review … (origin/develop tip, not this branch's own commit)
```

**Gates at `a6fce4a` (base `619c4bd`), foreground, no flake:**

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc231-r3-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc231-r3-lint.log` |
| `npx jest` | **4046 passed / 1 skipped / 208 of 209 suites / 3 snapshots**, exit 0 — matched the dispatcher's prediction exactly, no re-run needed | `sc231-r3-jest.log` |
| `npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 (~5 min) | `sc231-r3-lifecycle.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**, exit 0, `inline host-leak OK` | `sc231-r3-shots.log` |
| `check-freeze.sh` | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)` — same count as before the rebase | `sc231-r3-freeze.log` |
| `sha256sum -c rebaseline.txt` (run from `visual-harness/shots/`) | **all 55 lines `OK`**, exit 0 — exact same names AND hashes, no regeneration needed | `sc231-r3-rebaseline-check.log` |
| `npm run parity` | **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0 | `sc231-r3-parity.log` |

No suite flaked this round — the dispatcher's contingency instruction (re-run a flaky non-feature suite alone, then the full set once more) did not apply.

**Status:** still **DONE_WITH_CONCERNS** — the freeze violation is unchanged in composition from r1/r2 (same 55 lines, same hashes) and still needs Scott's sanction before a dispatcher applies `rebaseline.txt`. Everything else is green.

## r4 (2026-09-27) — rebase onto develop `b029baa`, full battery, recomputed rebaseline

**Summary (≤10 lines):** Rebased cleanly onto `origin/develop` `b029baa` (confirmed tip). Only conflict: `CHANGELOG.md` (kept both sides' entries, SC-231's after develop's SC-236/230/272/243/255 block). No conflict in `renderFeature.ts` or the keyword CSS. `npm ci` not needed (no `package.json`/lockfile diff `619c4bd..b029baa`). Full battery green: tsc/lint/jest/lifecycle/parity all clean, no flakes, no re-runs needed. Shots: 524 PNGs — a stray leftover `feature--obsidian-steel-dark.png` from a 2026-09-25 run inflated the first count to 525; wiped the shots dir and re-swept clean. Freeze: `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`, deterministic across two clean sweeps (identical 55 names, identical hashes both times). New `rebaseline.txt`'s 55-name set is **identical** to `rebaseline-r3.txt`'s (0 added, 0 removed); exactly **8 of the 55 hashes changed** — precisely SC-236's predicted overlap (`feature`, `feature-collapsed`, `feature-spend`, `chrome-collapsed-rollout` × print+realprint), the other 47 byte-identical to r3. Built develop-tip (`b029baa`) shots in a throwaway worktree to prove the 8-file movement is still only the keyword-row glyph shift: its freeze read `freeze OK (260/260 …)`; PIL diff bbox for each of the 8 files is a single small box (~33×22px) with 324 (print) / 328 (realprint) changed pixels — same tiny sub-pixel-shift signature documented since r1. Throwaway worktree removed after.

- **New HEAD:** `272c444` (fix(feature): SC-231 fix round r2 — raw-string keywords fold + MEDIUM-1 test)
- **Base:** `origin/develop` `b029baa` (fetched and confirmed as the current tip before rebasing)
- **Tree:** clean before and after (`git status --porcelain` empty)

**Full commit list post-rebase:**
```
272c444 fix(feature): SC-231 fix round r2 — raw-string keywords fold + MEDIUM-1 test
bf303cb fix(feature): SC-231 fix round r2 — HIGH-1 (grid/ledger lose small-caps), LOW-1, LOW-3
f6ebfeb fix(feature): SC-231 tolerate a trailing whitespace text sibling in chipifyKeywords
68e933d fix(feature): SC-231 chipify keywords by post-processing ONE render, not two
194e687 fix(feature): SC-231 keep the duplicated Keywords value focusable, not display:none      (superseded)
1dc6e3f fix(feature): SC-231 render the keyword chip list as a duplicate, not a replacement       (superseded)
d223465 fix(feature): SC-231 stop naming kwUsage's crest default in CSS
dc3daf3 docs(changelog): SC-231 one chip per keyword   (CHANGELOG conflict resolved here — both sides kept)
691d3e2 test(feature): SC-231 keyword-chip edge cases    (superseded by 68e933d's test rewrite)
c209aa4 feat(feature): SC-231 steel-screen keyword chips (crest mode)                             (superseded)
63d2619 feat(feature): SC-231 split Keywords into discrete per-keyword spans                      (superseded)
b029baa docs(skills): SC-255 r3 (INFO-3) … (origin/develop tip, not this branch's own commit)
```

**Gates at `272c444` (base `b029baa`), foreground, no flake:**

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean, exit 0 | `sc231-r4-tsc.log` |
| `npm run lint` | clean, exit 0 | `sc231-r4-lint.log` |
| `npx jest` | **4109 passed / 1 skipped / 4110 total, 211 of 212 suites**, 3 snapshots, exit 0 — first run green, no re-run needed | `sc231-r4-jest.log` |
| `npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 | `sc231-r4-lifecycle.log` |
| `npm run shots` (1st, dirty dir) | 525 PNGs (stray leftover file inflated count) | `sc231-r4-shots-1.log` |
| `npm run shots` (clean sweep 1, `rm -rf shots` first) | **524 PNGs**, exit 0, all host-leak/print-twin probes OK | `sc231-r4-shots-2.log` |
| `npm run shots` (clean sweep 2) | **524 PNGs**, exit 0 — identical count, determinism sweep for the rebaseline | `sc231-r4-shots-3.log` |
| `check-freeze.sh` (sweep 1) | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)` | `sc231-r4-freeze-1.log` |
| `check-freeze.sh` (sweep 2) | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)` — same 55 names, same hashes as sweep 1 | `sc231-r4-freeze-2.log` |
| `sha256sum -c rebaseline.txt` (from `visual-harness/shots/`) | **all 55 lines `OK`** against the live shot bytes | (verified inline, see report text) |
| `npm run parity` | **0 gap(s) / 0 undeclared warning(s) / 16 declared deferral(s)**, exit 0 | `sc231-r4-parity.log` |

No suite flaked this round; the contingency re-run instruction did not apply.

**Footgun caught:** the first `npm run shots` sweep produced 525 PNGs because `visual-harness/shots/feature--obsidian-steel-dark.png` (mtime 2026-09-25, an obsidian-camera leftover from an earlier session, not producible by `npm run shots`) was still sitting in the directory. Per the dse-verify skill's documented footgun ("wipe before trusting a name list"), `rm -rf visual-harness/shots` before both counted sweeps — both came back at exactly 524, matching the brief's "last known 524" figure unchanged.

**Rebaseline name-set comparison (new `rebaseline.txt` vs `rebaseline-r3.txt`):**
- **Added names:** none (0)
- **Removed names:** none (0)
- **Hash-changed (8 of 55):** `chrome-collapsed-rollout--steel-print.png`, `chrome-collapsed-rollout--steel-realprint.png`, `feature-collapsed--steel-print.png`, `feature-collapsed--steel-realprint.png`, `feature-spend--steel-print.png`, `feature-spend--steel-realprint.png`, `feature--steel-print.png`, `feature--steel-realprint.png` — exactly the SC-236 overlap set the brief predicted, and no other name.
- **Unchanged (47 of 55):** byte-identical to `rebaseline-r3.txt` (verified by `diff` — only the 8 lines above differ).

**SC-236-overlap proof (step 3c):** throwaway worktree `/home/scott/code/steelCompendium/worktrees/sc231-keyword-chips-dev-r4` added at `origin/develop` `b029baa` (`git worktree add --detach`), `npm ci` (rc=0, `sc231-r4-dev-npmci.log`), `npm run shots` (524 PNGs, rc=0, `sc231-r4-dev-shots.log`), `check-freeze.sh` → **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 (`sc231-r4-dev-freeze.log`). PIL bbox/pixel diff of each of the 8 overlap files, develop-tip vs branch (`sc231-r4-overlap-diffbbox.log`):

| File | bbox (x0,y0,x1,y1) | changed px | image size |
|---|---|---|---|
| `chrome-collapsed-rollout--steel-print.png` | (188, 1810, 221, 1832) | 324 | 1520×3586 |
| `chrome-collapsed-rollout--steel-realprint.png` | (188, 1810, 221, 1832) | 328 | 1520×3586 |
| `feature-collapsed--steel-print.png` | (140, 214, 173, 236) | 324 | 1520×1086 |
| `feature-collapsed--steel-realprint.png` | (140, 214, 173, 236) | 328 | 1520×1086 |
| `feature-spend--steel-print.png` | (140, 214, 173, 236) | 324 | 1520×1086 |
| `feature-spend--steel-realprint.png` | (140, 214, 173, 236) | 328 | 1520×1086 |
| `feature--steel-print.png` | (140, 214, 173, 236) | 324 | 1520×1086 |
| `feature--steel-realprint.png` | (140, 214, 173, 236) | 328 | 1520×1086 |

Every box is small (~33×22px, the Keywords row) and every pixel count is 324 (twin) / 328 (realprint) — the same tiny signature as the rest of the 55-line movement, not a larger or different-shaped change from SC-236 interacting with SC-231. Throwaway worktree removed afterward (`git worktree remove --force`), confirmed gone from `git worktree list`.

**Status:** still **DONE_WITH_CONCERNS**, PARKED — same shape as r3: everything but freeze is green, and the freeze movement is unchanged in kind (55 names, same class of sub-pixel keyword-glyph shift, 8 of them additionally reflecting SC-236's already-sanctioned change). Scott's r3-era sanction (comment `fb3a9458`, "this looks good.") covered the movement class shown then; per the ledger's own note, this recomputed set should be re-confirmed against him before a dispatcher applies it, since 8 hashes moved beyond what he was shown in the original ask (even though the movement is the same class and the new numbers land within the predicted overlap).

## Report location

This file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/sc231-r1-impl-report.md`
