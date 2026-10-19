# SC-372 decisions ledger — "Large text" size preference does nothing to --dse-fs-* tokens

Worktree: /home/scott/code/steelCompendium/worktrees/sc372-textscale (dse branch `sc372-textscale`, cut from origin/develop f8693b5)
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc372-textscale/ (files prefixed `sc372-`)
Origin: SC-318 r3 review INFO-1 — docs/superpowers/dse-overhaul/build-ledgers/sc318-card-headings/sc318-r3-review-report.md:81-85

## Scott rulings (verbatim, dated)

(none yet — the ticket had no comments when picked up on 2026-10-16)

## Ticket description (verbatim excerpt, the spec of record)

> The large-text preference writes `--dse-fs-large-scale` onto the element root. The `--dse-fs-*` tokens are declared on `:root` as `calc(<r>em * var(--dse-fs-large-scale))`. A `var()` inside a custom property resolves where that property is declared, at `:root`, so every descendant inherits the `* 1` value. As a result, the card name stays at 20px and an h3 stays at 21.088px when the preference is set to 1.2. Stamping the value on `<html>` makes it work (card name 24px).
>
> The small-scale and control-scale knobs follow the same pattern and are probably affected too. That has not been measured.

## Owner decisions (ticket-owner, 2026-10-16 — not Scott rulings)

- O1. Scope = all three knobs (small / large / control text scale), measured before and after.
- O2. Intended behavior = the pref help text in src/prefs/catalog.ts: small+large apply everywhere incl. print/export; control is screen-only.
- O3. Do NOT fix by stamping on <html>/document root — per-root resolution is the contract (reflectCss stamps per root; modals/popouts have their own roots/documents).
- O4. A regression gate that measures computed sizes in a real browser is required (jsdom cannot resolve var() cascades).
- O5. At default prefs, zero frozen bytes should move. Any frozen-byte movement is a stop-and-explain, not a silent rebaseline.

## Rounds / authorship (for author-independence)

- r1 implement — orchestration:implementer (agent a0eef2882307c4075), dispatched 2026-10-16. Brief: sc372-brief-r1-implement.md
- 2026-10-16: dispatcher relay — dse origin/develop moved to 05a6ff3 (SC-406 landed; freeze 274/274 unchanged). r1 implementer told to rebase onto 05a6ff3 before the final battery and report base + branch counts.
- 2026-10-16: dispatcher relay — dse origin/develop now a337460 (SC-407 landed: docs/README/CHANGELOG prune, docs-shots guard; freeze 274/274 unchanged; jest baseline 4432). r1 implementer re-told: rebase onto a337460, reconcile CHANGELOG into SC-407's pruned structure.
- r1 DONE_WITH_CONCERNS 2026-10-17: dse sc372-textscale @ fcbcd09 on a337460; superproject docs commit 1980c46. Gates: jest 4438/1/220 of 221, lifecycle 25/25, shots 568 0 FAIL + `text scale OK (1104 comparisons)`, freeze 274/274, parity 0/0/24. 0 frozen bytes moved. Fix = 14 role tokens on `:root, :is([data-dse-element], .dse-modal)`.

## Follow-up rulings (owner, 2026-10-17)

- F1 (nested same-knob consumers compound the multiplier, e.g. `.dse-pr__badge-text` 12.96 -> 18.66px at small 120%, "12-16" tier badge wraps): **FOLD into SC-372.** The knob working means every text scales by the knob exactly once. Default look must not move (O5 still binds). r2 reviewer designs + prototypes the mechanism; r3 implements.
- ~~F2: fold if the r2 reviewer finds a local fix~~ superseded 2026-10-17 by the r2 ruling below (ticketed as SC-422).
- F3 (`scaleRules.test.ts:207`, `theme-steel.test.ts:208` old `:root\s*\{` regex): **fold** — trivial, same area.
- r2 review — orchestration:reviewer, review r1 + design F1/F2. Brief: sc372-brief-r2-review.md
  - r2 reviewer agent abd01eff993c8201a dispatched 2026-10-17 (r1 implementer a0eef2882307c4075 stays the r3 fixer; the r4 scoped re-review must be a fresh identity, not abd01eff993c8201a if it prototypes the F1 code)

## r2 review rulings (owner, 2026-10-17) — r2 verdict FIX-REQUIRED (0 BLOCKER / 1 HIGH / 1 MEDIUM / 2 LOW / 4 INFO); r1 gates reproduced green
- HIGH-1 (F1 compounding, 9 containers): r3 executes sc372-r2-review-report.md §F1.4 steps 1-5 verbatim (registry block `sc372-r2-review/spec-once-block.css`; divergence test; `text scale once OK` sweep).
- MEDIUM-1 (gate blind to compounding): folded — §F1.4 step 3.
- LOW-1 + F2 (surfaces outside any stamped root: Compendium search hints [ships 7.0.0], settings preview caption, sidebar header + empty message): **TICKETED as SC-422** (Backlog, DSE 7.0.0, related SC-372). OUT OF SCOPE for r3 — do not touch SidebarPanel or any TS.
- LOW-2 (docs say "keep consumers un-nested"): folded — §F1.4 step 5.
- INFO-1 (misleading `x 0.8` failure message): folded.
- INFO-2 (ROOT_BLOCK regex copied into 6 test files): dropped — a one-line regex; a shared helper is not worth a ticket.
- INFO-3 (cross-knob products, e.g. Small label inside a Control button, apply each knob once): dropped — by design, matches the catalog help text.
- INFO-4 (`tokens.ts:123` "eight scale-dependent roles" vs 14 tokens): folded — reword.
- §F1.4 step 5's last bullet (edit workspace `.claude/skills/dse-verify/SKILL.md`): **NOT for r3** — expected-number records are dispatcher bookkeeping at landing; the owner passes the new line in the land-ready report.
- r3 fixer = r1 implementer a0eef2882307c4075 (resume). r4 scoped re-review = fresh orchestration:reviewer (not abd01eff993c8201a, whose prototype is the code being landed).
- 2026-10-17: owner + r3 implementer killed by session rate limit (429) mid-r3. State at resume: dse branch rebased onto origin/develop 0ecb90e (SC-155 landed after a337460); r3 commits 29998bc (CSS registry) + 71e24d1 (sweep) present; docs/evidence/battery/report pending. Implementer a0eef2882307c4075 resumed via SendMessage.
- r3 DONE 2026-10-17: dse f6d29ec on 0ecb90e; superproject 51e5d8d. jest 4438/1/220 of 221 (base 4431 DERIVED, not measured), lifecycle 25/25, shots 568 0 FAIL, `text scale OK (1146)`, `text scale once OK (102063 / 197 loads)`, freeze 274/274, parity 0/0/24. Vacuity: 12 COMPOUNDS lines w/o registry; divergence bite ok. "12-16" no wrap.
- r4 scoped re-review — fresh orchestration:reviewer, brief sc372-brief-r4-rereview.md.
  - r4 reviewer agent a38ce409349eff20a dispatched 2026-10-17
- r4 re-review 2026-10-18: LAND-READY after rebase. 0 BLOCKER/HIGH/MEDIUM, 1 LOW, 3 INFO. Base 0ecb90e jest measured 4431 (branch = +7 tests, +1 suite). Exactly-once verified 0 violations; defaults 0 moved.
## r4 rulings (owner, 2026-10-18)
- LOW-1 (origin/develop moved 0ecb90e -> e9502a8; SC-390 moved the shared freeze baseline to 276): r5 rebases onto current origin/develop, `npm ci`, full battery. Expected freeze 276/276.
- INFO-1 (`tokens.ts:123` "Fourteen of these tokens" in a block of 12 / "All twelve"): folded — make the count consistent.
- INFO-2 (CHANGELOG sentence describes double-scaling no released build had; omits control): folded — the CHANGELOG entry describes only what a user of the last release sees change: the three text-size settings now take effect, nested text included. Drop the "scales once, not twice" sentence.
- INFO-3 (sweep catches compounding but not text that goes inert; only 3 named rows do): folded — one line in font-sizes.md saying so.
- r5 = implementer a0eef2882307c4075 (author). r5 scoped check = r4 reviewer a38ce409349eff20a (resume; independent of the author).
- 2026-10-18 owner eyeball of evidence/sc372-large-120.png: AFTER shows keyword chips (MAGIC/MELEE/…, MAIN ACTION, SIGNATURE) and head meta (LEADER, EV 20) visibly bigger — the catalog scopes Large to "card names, band titles and display stat numbers". Card names wrap to 2 lines at 120%. Probe sent to r4 reviewer a38ce409349eff20a (addendum to sc372-r4-rereview-report.md) before posting/land-ready.
- r4 addendum 2026-10-18: keyword/action chips + head chips (LEADER, EV) scale with Large through their OWN rules' Large role tokens (SC-185 role choices: meta cells = subheading; head chips = heading*0.9), exactly once; inert on develop (the ticket bug). Name wrap = bigger text × narrow capture width, no overflow.
## Addendum ruling (owner, 2026-10-18)
- Chips on Large: INTENDED (SC-185 design; above-body text). No CSS change. Fold into r5: reword `largeTextScale` help text at src/prefs/catalog.ts ~:361 to name the chips — "card names, band titles, ability keyword and action chips and display stat numbers" — and match the CHANGELOG wording. Moving these chips to Small would be a role decision for Scott → mention in the comment as FYI; no ticket unless he asks.
- r5 DONE 2026-10-18: dse aebc0a9 on e9502a8 (new commits 6cab8b7, 65f6d02, aebc0a9); superproject 51e5d8d. jest 4508/1/223 of 224, lifecycle 25/25, shots 572 0 FAIL, `text scale OK (1146)`, `text scale once OK (102969 / 199 loads)`, freeze 276/276, parity 0/0/24. Drive-by: docs/settings.md Large bullet reworded. Scoped r5 check → r4 reviewer a38ce409349eff20a.
- 2026-10-18: origin/develop moved again e9502a8 -> 1640ed0 (SC-408: e2e gate now REQUIRED to land any dse change — Scott, SC-408: "make it required to land future changes"). Overlap with branch: CHANGELOG.md, styles-source.css, visual-harness/shoot.mjs. r6 = rebase onto 1640ed0 + full battery incl. e2e.
- r6 DONE 2026-10-18: dse 6737031 on 1640ed0 (no conflicts; auto-merged). tsc(+e2e)/lint clean, jest 4732/1/227 of 228, lifecycle 25/25, e2e 59/71 ok 0 failed 12 known-bug 47/47, shots 572 0 FAIL + both text-scale lines, freeze 276/276, parity 0/0/24. r7 scoped check → r4 reviewer.
- r7 2026-10-18: LAND-READY (6737031 on 1640ed0). range-diff all `=`; gates re-run green (e2e 59/71 0 failed 47/47; shots 572 0 FAIL + both text-scale lines; freeze 276/276; parity 0/0/24). LOW-r7-1: CHANGELOG.md:52-53 hangs the nested-text clause off Control (tier badges follow Small); line 50 is 130 chars.
- Ruling: LOW-r7-1 FOLD now (docs-only, no gate re-run): end the Control clause at "(screen only)." and add "Text nested inside other text, such as the power-roll tier badges, follows its setting too."; rewrap to the file's width. Owner reviews the docs-only diff.
- 2026-10-18: LOW-r7-1 folded as 1a4c6d3 (CHANGELOG only; owner reviewed diff — correct). Land-ready comment posted on SC-372 with 3 evidence images; state left Awaiting (no Scott action required). LAND-READY reported to dispatcher: dse `sc372-textscale` @ 1a4c6d3 on 1640ed0; superproject `sc372-textscale` @ 51e5d8d (cut on old base, pointer not bumped).
