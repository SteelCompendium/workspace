# SC-205 — decisions ledger

Effort: `sc205-btn-host-leak` · worktree `/home/scott/code/steelCompendium/worktrees/sc205-btn-host-leak`
Ticket: SC-205 "`assertBtnHostLeak` is blind to button STATE — resting-only sampling plus a host copy missing 3 of 5 rules"
Repo: `draw-steel-elements`, tracked branch `develop`, base sha at cut: `16e25ff` (== origin/develop tip at 2026-08-28 session start).

## Scott rulings (verbatim, dated)

- **2026-08-27, filed per Scott on SC-203:** *"For the 3 follow-ups, if any are small enough
  to fix now, just knock it out. Otherwise make tickets for them."* — SC-205 is the one that
  wasn't small. No other Scott comments exist on SC-205 as of 2026-08-28 session start.

## Ticket-owner rulings (design calls within ticket scope, 2026-08-28)

1. **Host-copy pinning (the ticket's "consider" item): YES, implement it** as a drift check
   that extracts the button-reaching rules from the locally installed Obsidian's
   `obsidian.asar` app.css, normalizes, and compares against `OBSIDIAN_HOST_BUTTON_CSS`.
   Drift → loud failure; asar not found (CI/headless) → loud SKIP line, exit 0 — never a
   silent pass.
2. **Focus-visible sweep failure mode:** a record that does not achieve
   `matches(':focus-visible')` fails the gate loudly, UNLESS the node is provably
   unfocusable (e.g. `disabled`) — such kinds must be explicitly exempted with an assertion
   of the disabling attribute, not silently skipped.
3. **Can-fail proof required:** the extended gate must be demonstrated to fail (the ticket's
   own control: force the three omitted rules with `!important` → expect diffs), then
   restored green. A gate whose failure path was never exercised is not a gate.
4. **The SC-203 provenance comment in shoot.mjs claiming "`button:hover` NO LONGER EXISTS"
   is wrong** — the ticket measured app.css 1.13.7 carrying it inside
   `@media (hover: hover)` (the live styleSheets-walk likely missed media-wrapped rules).
   The comment must be corrected as part of this work.

## Status log

- 2026-08-28: ledger opened; worktree `sc205-btn-host-leak` created (all submodules on
  branch `sc205-btn-host-leak`); dse at `16e25ff` == origin/develop. Ticket Todo → Awaiting.
  Round 1 implementer (Opus) dispatched.
- 2026-08-28: R1 implementer COMPLETE (one rate-limit interruption, resumed). Commit
  `b2a92f5` on dse `sc205-btn-host-leak` (base `16e25ff`), not pushed. All gates green:
  tsc/lint clean; jest 3257 passed / 1 skipped / 185 suites; shots 474 PNGs 0 FAIL; freeze
  210/210, 0 mismatches; parity 0/0/16 DECLARED. New gate: 80 kinds × 3 states × 2 schemes
  = 480 comparisons, 0 diffs, deterministic across 2 runs; 104 (kind,state) exemptions
  printed as a taxonomy. Host copy re-extracted from Obsidian 1.13.7 asar
  (`~/.config/obsidian/obsidian-1.13.7.asar` — NOT the stale /opt installer copy); 4 copy
  drifts corrected incl. dark `--interactive-hover` #363636→#3f3f3f; 6th rule
  (forced-colors) modelled for the pin, unmeasured. New `visual-harness/obsidian-host-pin.mjs`
  drift check (loud SKIP when asar absent). Can-fail proofs A–D all fired and reverted.
  Report: `sc205-r1-implementer-report.md` (+ evidence logs, sc205-prefixed).
- ~~**Pending owner ruling (post-review):** implementer flagged a deliberate coverage
  boundary — 17 kinds/scheme have no box at rest (display:none chrome ancestor); a
  "hovered-then-focused" 4th state is unscoped. Rule after review; file Backlog ticket if
  deferred.~~ superseded by 2026-08-28 owner ruling 5 below (not deferred; no ticket).
- 2026-08-28: Round 2 independent reviewer (Opus, fresh identity) dispatched.
- 2026-08-28: R2 review COMPLETE — verdict FIX ROUNDS NEEDED: 1 HIGH, 4 MEDIUM, 6 LOW,
  3 INFO; no finding invalidates the committed result; reviewer independently reproduced
  every gate green (freeze 210/210 ×2, shots 474 ×2 byte-identical gate blocks, jest 3257,
  parity 0/0/16), verified styles-source.css comment-only, re-ran two can-fails, measured
  runtime +35s (+11%) vs base. Report: `sc205-r2-review-report.md`. Tree confirmed clean at
  `b2a92f5`.

## Ticket-owner rulings — round 3 scope (2026-08-28)

5. **The "hovered-then-focused 4th state" is NOT deferred; no Backlog ticket.** Adopting
   the reviewer's verdict: it is not a new state — the 3-line chrome-reveal injection
   (report, probe 2) folds it into MEDIUM-1/MEDIUM-2 and drops exemptions 104 → 12 with
   the sweep still 0-diff. Fix in round 3.
6. **Fix round addresses HIGH-1, MEDIUM-1 through MEDIUM-4, and all LOWs**, per the
   reviewer's prescribed fixes in `sc205-r2-review-report.md`, with two scope bounds:
   - **MEDIUM-3 (pin's `/^button\b/` prefix filter):** make the filter's boundary explicit,
     documented, and deliberate (the pin must say what it excludes and why). Full modelling
     of descendant-selector contexts (modal/prompt/settings surfaces) is SC-202's general
     problem — do not expand this gate to non-gallery surfaces in this ticket.
   - **LOW (forced-colors "unmeasurable"):** keep it unmeasured; correct the comment to say
     Playwright CAN emulate `forced-colors: active` and we deliberately skip measuring
     (niche mode, host rule is border-only, covered by the drift pin) — the comment must
     stop claiming impossibility.
7. **MEDIUM-4 (stale /opt asar fallback):** the pin must never compare against an asar
   older than the modelled version — pick the newest discoverable version; if only an older
   copy exists, loud SKIP naming the staleness, never a drift failure instructing a
   downgrade re-extract.
8. Runtime +11% (+35s) is accepted; no action.
- 2026-08-28: Round 3 fix dispatched — original implementer resumed with findings verbatim
  (report file), scoped by rulings 5–8. Scoped delta re-review to follow by the R2 reviewer
  identity (fixer ≠ re-reviewer preserved).
- 2026-08-28: R3 fix COMPLETE — commit `c32bc35` on top of `b2a92f5`, all 11 findings
  addressed. Kinds 80→111, comparisons 480→666, exemptions 104→12 (exactly the reviewer's
  predicted residual: 8 focus-visible disabled, 2 hover no-hit-point, 2 focus-visible
  visibility:hidden), diffs still 0. Pin now also covers the styles-source.css human-facing
  listing (HIGH-1) and documents the 20 excluded plain-button-subject rules
  (EXCLUDED_ANCESTOR_SCOPES). Battery green: jest 3257/185 unchanged; shots ×2 474 0 FAIL,
  gate blocks byte-identical; freeze ×2 210/210 0 mismatches; parity 0/0/16. Sheet diff
  proven comment-only (comment-stripped sheets byte-identical). Can-fails E–H fired and
  reverted. Report: `sc205-r3-fix-report.md`.

## Ticket-owner rulings — post-R3 (2026-08-28)

9. **INFO-1 (harness `.mjs` files neither linted nor tsc'd): DEFERRED** — out of SC-205's
   scope (gate strictness, not toolchain wiring). Backlog ticket filed at this ruling,
   linking SC-205: **SC-275**.
10. **INFO-2 (dse-verify SKILL.md missing the two new in-run gates + the expected
    host-copy-pin SKIP on Obsidian-less machines): owner bookkeeping**, done by the
    ticket-owner in the main checkout after re-review approval, before land-ready (adapter
    §6 permits skill/docs fixes as orchestration bookkeeping; the skill is a workspace
    file, canonical home of expected gate numbers).
- 2026-08-28: Round 4 scoped delta re-review dispatched to the R2 reviewer identity.
- 2026-08-28: R4 re-review COMPLETE — all 11 R2 findings CLOSED (MEDIUM-3 as bounded by
  ruling 6), but FURTHER FIXES NEEDED: 2 new MEDIUM, 3 LOW, 1 INFO, all local to R3's new
  gate logic. R4-M1: the sheet-listing pin sits after the asar skip() early-returns, so
  HIGH-1's second copy is unpinned on Obsidian-less machines (proven exit-0 with a deleted
  fence line under a fake 1.9.0-only home) — both operands are in-repo, evaluate before the
  asar gate. R4-M2: the pin's partition splits selectors on raw commas, so `:is()`/`:not()`
  lists shred and rules land in NEITHER reaching nor excluded (4 invisible selectors
  measured, incl. a shipping 1.13.7 rule; the R3 report's "unaccounted: 0" used the same
  broken split). R4-L1 misdirecting drift remedy text; R4-L2 comment arithmetic; R4-L3 the
  reveal mounts panel+summary simultaneously — sound only via an unrecorded no-
  `[data-dse-collapsed]`-keyed-rule dependency; R4-INFO unguarded readFileSync + non-greedy
  fence regex. Gates at `c32bc35` all green, tree clean. Report:
  `sc205-r4-rereview-report.md`.
- 2026-08-28: Round 5 fix dispatched — implementer resumed with R4 findings verbatim.
  Final scoped re-review of the R5 delta to follow (reviewer identity).
- 2026-08-28: R5 fix COMPLETE — commit `c09cf6f` on top of `c32bc35`, all 6 R4 findings
  addressed; harness-only round (styles-source.css byte-identical). R4-M1: fence check now
  unconditional and first (`checkSheetHostRuleListing`); asar-gated skip renamed
  "host-copy pin PARTIAL" stating which half ran. R4-M2: depth-aware `splitSelectorList` +
  `classifySubject` with every unparsed fragment failing the pin by name; the newly-visible
  1.13.7 `@container … .setting-item-control button:not(.clickable-icon)` rule surfaced as
  reaching and — per ruling 6 — got an explicit documented exclusion naming SC-202
  (partition now 6 reaching / 21 excluded / 0 unaccounted). R4-L3 enforced by
  `checkCollapseCascadeAssumption()` (static sheet scan). Battery green: jest 3257/185;
  shots 474 0 FAIL, sweep unchanged 111×3×2=666, 12 exemptions, 0 diffs; freeze 210/210;
  parity 0/0/16. Can-fails I and II fired (I: the R4-M1 world that was exit-0-silent at
  `c32bc35` is now exit 1). Report: `sc205-r5-fix-report.md`.
- 2026-08-28: Round 6 scoped re-review of the R5 delta dispatched (reviewer identity).
  INFO-2 bookkeeping note: the SKILL.md update must also reflect the SKIPPED→PARTIAL
  rename.
- 2026-08-28: R6 re-review COMPLETE — **VERDICT: APPROVE, land-ready.** All 6 R4 findings
  CLOSED (R4-M1 re-proven: the world that was exit-0-silent at `c32bc35` now exits 1 before
  the asar gate; R4-M2 partition 6/21/0 with independent fragment recount 29 vs 29; R4-L3
  guard fires, offender named). Gates at `c09cf6f`: shots ×2 474 0 FAIL byte-identical gate
  blocks; sweep 111×3×2=666, 12 exemptions, 0 diffs; freeze 210/210 ×2; jest 3257/185; tsc
  clean; sheet byte-identical to `c32bc35`. New: 2 LOW + 1 INFO, all latent, none reachable
  on current app.css (3,755 rules audited, 0 affected) — none holds the landing. Report:
  `sc205-r6-rereview-report.md`.

## Ticket-owner rulings — post-R6 (2026-08-28)

11. **R6-L1, R6-L2, R6-INFO (a: collapse-guard pattern misses 3 families; b: stale
    "will not say so" comment sentence): DEFERRED** — all latent, verified unreachable on
    current Obsidian/sheet; Backlog ticket filed at this ruling: **SC-276**, linking
    SC-205. R6-INFO's third part (SKIPPED→PARTIAL grep string) is absorbed into the
    ruling-10 SKILL.md bookkeeping, not deferred.
12. **No Scott sanction is required to land**: zero pixels, zero frozen bytes, no baseline
    operation, no new fixtures (shots count unchanged at 474), no deploy. The Scott-facing
    comment reports the result; the ticket is NOT flagged Needs Review (nothing needs his
    eyes or a decision — flagging a rubber stamp would pollute his filter). Ticket stays
    Awaiting through landing; owner flips to Done on the dispatcher's landed notification.

- 2026-08-28: closing sequence — SC-276 filed; SKILL.md bookkeeping next; then the ticket
  comment and the land-ready report. **Land-ready state: dse branch `sc205-btn-host-leak`
  at `c09cf6f` (= `16e25ff` base + `b2a92f5` + `c32bc35` + `c09cf6f`), not pushed; gates
  green as above; no rebaseline/widening needed.**
- 2026-08-29: INFO-2 done — dse-verify SKILL.md now documents both in-run gates (pin OK /
  PARTIAL semantics, sweep 111×3×2=666 + 12 exemptions, land-ready battery numbers);
  workspace commit `9c64720`, pushed to origin/main. Final comment posted to SC-205
  (traceability footer, no images — nothing visual). Ticket left **Awaiting** per ruling
  12; flip to Done on the dispatcher's landed notification. **LAND-READY reported to the
  dispatcher.** Note for landing: main checkout showed a pre-existing modified-submodule
  state on `draw-steel-elements` at session start (not this effort's doing) — land-stack's
  dirty check will surface it. At landing, copy this ledger + the r1–r6 reports to
  `docs/superpowers/dse-overhaul/build-ledgers/` before `just wt-rm`.
  `docs/superpowers/dse-overhaul/build-ledgers/` before `just wt-rm`.
- 2026-08-29: **LANDED.** dse origin/develop at `c09cf6f`; superproject merge `0afa5fb`,
  pointer bump `8335166`; ledger preserved at
  `docs/superpowers/dse-overhaul/build-ledgers/sc205-btn-host-leak/` (`3d02bbd`); worktree
  removed. SC-205 flipped to **Done** (first save no-op'd silently; retry landed —
  verified `completedAt` set). Effort closed.
