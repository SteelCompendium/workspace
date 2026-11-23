# SC-683 decisions ledger — DSE Scaling: allow it to go to 30%

Effort: `sc683-scaling-30pct` · worktree `/home/scott/code/steelCompendium/worktrees/sc683-scaling-30pct`
· dse branch `sc683-scaling-30pct` cut from `develop` @ `9be108c9` · workspace `origin/main` @ `e26da973`.

Workers: read THIS file, never the tracker.

## Scott rulings (verbatim, dated)

### 2026-11-20 — ticket title + description (the whole spec)

Title: "DSE Scaling: allow it to go to 30%"

> Currently scaling can go to 80%. Someone requested it to go smaller.  Lets go with 30% min

No comments on the ticket as of 2026-11-23.

## Owner calls (ticket-owner, not Scott — each is reported to Scott in the review ask)

### 2026-11-23 — O1: "scaling" = the **Card size** slider (`cardScale`, `CARD_SCALE` in `src/prefs/scale.ts`)

The plugin has five Typography sliders. Text size is already 60%–140%. Card size is 80%–120%
("Scale whole statblock and ability cards"). The three type-role sliders (Small / Large / Control
text size, `TYPE_SCALE`) are also 80%–120%, but they are documented as a ratio nudge, not a zoom.
"Scaling ... can go to 80% ... go smaller" matches Card size: it is the only whole-element scaler
with an 80% floor. So: `CARD_SCALE.min` 0.8 -> 0.3. `TEXT_SCALE` and `TYPE_SCALE` do not change.

### 2026-11-23 — O2: maximum stays 120%, step stays 5%

Scott asked only for a lower minimum. Range becomes 30%–120% in 5% steps. Consequence: the range is
no longer symmetric about 100%, so the Card size thumb at 100% no longer sits at the centre of its
track like the other four sliders. Reported to Scott as a visible consequence; not "fixed" by
raising the maximum.

### 2026-11-23 — O3: the v2 site's Card size range is out of scope

`v2/docs/javascripts/settings-core.js` keeps `CARD_MIN = 0.8`. The ticket is "DSE Scaling" in the
DSE 7.0.0 project. The plugin's range deliberately stops mirroring the site's minimum; the code
comment in `scale.ts` must say so. No v2 change on this ticket.

## Deferred findings / follow-ups rulings

(none yet)

## Round log

- r1 implementer dispatched 2026-11-23 (brief: `sc683-brief-r1-impl.md`).
- r1 implementer DONE 2026-11-23: plugin `594cbd5c` (4 commits on `9be108c9`), superproject `691aad74` (CHANGELOG only).
  Gates: tsc/lint clean · jest 14439/1 skipped (+1) · lifecycle 64/64 · e2e 794/805, 0 failed, 11 known-bug, 476/476 pairs ·
  shots 592 · freeze 280/280 · parity 0/0/24. Report `sc683-r1-impl-report.md`; evidence in `evidence/`.
  Measured: card outer width unchanged at every scale (760 px), height 3740 -> 1093 px at 30%; thumb at 100% sits at 0.778 of track.
  Drive-by: `.repo-docs/architecture.md` "site-mirrored" wording corrected (accepted — docs, same area).
- Owner eyeballed `sc683-A-statblock-contact-sheet-100-80-50-30.png`, `sc683-C-settings-typography-card-size-{30,100}.png`: coherent, no breakage.
- r2 reviewer dispatched 2026-11-23 (brief: `sc683-brief-r2-review.md`), different identity from the implementer.
- r2 review DONE 2026-11-23 at `594cbd5c`: FIX-REQUIRED, 0 CRIT / 0 HIGH / 1 MED / 0 LOW / 6 INFO. Report `sc683-r2-review-report.md`.
  Reviewer gates: tsc/lint rc 0 · jest 14439/1 skipped · full e2e 794/805, 0 failed, 11 known-bug, 476/476. Mutations min=0.8 -> 10 tests fail, min=0.25 -> 9 fail.
  Card-keeps-its-width confirmed PRE-EXISTING (80% PNG byte-identical on base and head).

## Deferred findings / follow-ups rulings (2026-11-23, owner)

- MED-1 (`draw-steel-elements/CHANGELOG.md:1360-1363`, unreleased 7.0.0 section still says "Card size (80%–120%) … same ranges … as steelcompendium.io's own site settings"): **FIX in r3** (implementer resumed, finding verbatim).
- INFO-2 (no harness fixture nests an element in an element; nested zoom reset only reached by injection): **DROP** — pre-existing coverage shape, not touched by a range change; the injected probe shows single zoom at 0.3/0.5/0.8.
- INFO-4 (Card size help text range is hand-typed, not derived from `CARD_SCALE`): **DROP** — all five slider help texts are hand-typed the same way; `settings-tab.test.ts` pins the text. Consistent as is.
- INFO-1/3/5/6: confirmations, no action.

- r3 fix round dispatched 2026-11-23: implementer resumed (docs-only, MED-1). Scoped re-review of the delta goes to the r2 reviewer identity.
- r3 fix DONE 2026-11-23: plugin `aee83dc1` (CHANGELOG.md only on `594cbd5c`), superproject `c7f195e6` (CHANGELOG.md only on `691aad74`; sits on origin/main `cf626508`).
- r4 scoped re-review DONE 2026-11-23 (r2 reviewer identity): **LAND-READY**, MED-1 closed, 0 open findings. Code byte-identical to `594cbd5c`, so r1/r2 gates stand.
  INFO-r4-1 (superproject CHANGELOG.md:1565 is a 158-char line in an ~85-col bullet): **DROP** — cosmetic, renders the same.
- Tracked branches at land-ready: dse `origin/develop` = `9be108c9` (unmoved), workspace `origin/main` = `cf626508`; both branches are fast-forwards.
- Comment 1 posted to SC-683 (In Progress + Needs Review): asks Scott to confirm O1 (Card size is the slider meant) and the 30% look; O2/O3 reported.
- LANDED 2026-11-23 by the dispatcher: dse `develop` @ `aee83dc1`, workspace merge `040454e3` on origin/main, bookkeeping `36bf98c0`. Worktree removed. Ledger preserved at `docs/superpowers/dse-overhaul/build-ledgers/sc683-scaling-30pct/` (this local copy has later lines).
- Comment 2 posted 2026-11-23: landed note + the same ask restated. Ticket stays **In Progress + Needs Review** until Scott confirms O1 (Card size is the slider meant) and the 30% look; on yes -> Done. No Scott reply as of this entry.

### 2026-11-23 — Scott confirms (two sources)

Ticket comment by Scott, 2026-11-23T19:59Z, verbatim:

> Yeah this is great

Relayed by the dispatcher from its session (not seen by the owner first-hand), verbatim as relayed:

> Looks good.  Land this and cut the rc.3 release

Effect: O1 (Card size is the slider meant) and the 30% look are accepted; O2/O3 stand unchallenged. Ticket -> Done, `Needs Review` removed.
The rc.3 release is the dispatcher's action in its own session, not part of this ticket.
