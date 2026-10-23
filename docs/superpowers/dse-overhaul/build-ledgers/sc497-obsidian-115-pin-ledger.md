# SC-497 decisions ledger — Obsidian 1.15.0 host-copy pin bump

Worktree: /home/scott/code/steelCompendium/worktrees/sc497-obsidian-115-pin (branch `sc497-obsidian-115-pin` in every submodule)
Base: dse `develop` @ d152ea4; superproject @ 21455cc.
Owner: Opus 5.5 ticket-owner (posts with `--model opus-5.5`).

## Scott rulings on SC-497
(none yet — thread empty at 2026-10-23)

## Dispatcher scope (2026-10-23, from the owner's launch brief — not a Scott ruling)
> TOP PRIORITY: `npm run shots` is red with `HOST COPY DRIFTED` for every in-flight dse effort, so nothing can land until this does.
> Follow the documented self-update procedure in .claude/skills/dse-verify/SKILL.md ... and the SC-202 precedent.
> The fix must leave freeze at 280/280 (no rebaseline) unless the new host copy genuinely changes frozen bytes — if it does, produce a rebaseline.txt and a sanction ask for Scott.
> Keep scope to the pin bump; report the exact new shots in-run lines (host-leak, modal host-leak, text-scale) for dse-verify CURRENT.
> Never touch Scott's real Obsidian install or config at ~/.config/obsidian beyond reading the asar.

## Owner rulings
- 2026-10-23 — Scope = the SC-205 hand-maintained host MODEL pin only: `OBSIDIAN_HOST_BUTTON_CSS` in `visual-harness/shoot.mjs`, `PINNED_OBSIDIAN` + provenance comment in `visual-harness/obsidian-host-pin.mjs`, and the `[SC205-HOST-RULES]` listing in `styles-source.css` (kept in step, per the drift message). Any other comment that names the pinned version (e.g. `fetch-obsidian-app-css.mjs:136`, `obsidian-light-island.mjs:63`) may be updated to keep it true.
- 2026-10-23 — OUT of scope: `visual-harness/obsidian-app-css.pin.mjs` (`OBSIDIAN_APP_CSS_PIN`, the exact-content real-app.css pin at 1.13.7). It is a separate pin (SC-202), and SC-202's Scott-approved shape says "pin bumps are deliberate with their own sanctioned rebaseline". Do not bump it here. If shots prints a drift WARNING about it, report the line; do not act on it.
- 2026-10-23 — Obsidian version split (dispatcher relay of the SC-478 owner's data point: lifecycle picks the newest installed Obsidian, now 1.15.0, and passed 33/33 there on SC-478's branch; e2e runs its own pinned 1.14.4 per `e2e/README.md:12`). Ruling: DOCUMENT the split, do not align. SC-497 does not change lifecycle or e2e version selection. After this lands, the three gates read: shots host-copy model floor 1.15.0 (compared against the newest installed asar), shots real app.css content pin 1.13.7 (`OBSIDIAN_APP_CSS_PIN`), lifecycle = newest installed (1.15.0 today), e2e = pinned 1.14.4. The owner adds this to the proposed dse-verify text in the land-ready report. Not a worker task.
- 2026-10-23 — If the 1.15.0 rules differ only by minifier spacing/quoting, still re-extract the copy verbatim from the asar (the printed remedy). Do NOT loosen the comparator to whitespace-insensitive matching — that is parser work (SC-276 territory), not a pin bump.

## r1 implementer result (2026-10-23)
Plugin `6576fd4` on base `d152ea4`. All 6 rules class (a) minifier spelling only; 28 token pairs identical. Full battery green, freeze 280/280 no rebaseline. Implementer = author of 6576fd4; reviewer r1 = separate Opus identity.

## Follow-up rulings (r1)
- app.css content pin drift line (`OBSIDIAN APP.CSS PIN DRIFT`, 1.13.7 vs installed 1.15.0, rc stays 0) — already tracked by SC-376 (Backlog). No new ticket; cite SC-376 in the land-ready report.
- Tokenizing/whitespace-insensitive comparator — SC-276 (Backlog). No new ticket.
- Gallery sweep 113 / 678 with a 20-record exemption boundary (skill says 112 / 672 / 10). Implementer's A/B says base d152ea4 prints the same, so not SC-497's. Ruling pending the reviewer's check of the A/B: update dse-verify CURRENT; the skill treats "a new unexplained exemption" as a real red, so the 10 new records (6 hover zero-sized, 2 focus-visible no-box, +2 focus-visible disabled) earn a Backlog ticket to explain them unless the reviewer finds them already explained.

## r1 review result (2026-10-23)
APPROVE_WITH_NITS, 0 HIGH / 0 MEDIUM / 2 LOW / 3 INFO. Reviewer's own shots at 6576fd4 match the implementer's lines; freeze 280/280; A/B base comparison judged sound; app.css drift line already printed before (1.14.4 vs 1.13.7).

## r1 finding rulings
- LOW-1 (obsidian-light-island.mjs:62-66 "never bump one without the other" comment is false) — FOLD into r2 fix round (comment only).
- LOW-2 (shoot.mjs:1354 "668,206 in 1.14.4" wrong; real 668,223 bytes / 668,205 chars) — FOLD into r2 (comment only).
- INFO-1 — drop (correct as is, tokens compared by resolved value).
- INFO-2 (dse-verify SKILL.md text) — owner drafts the proposed dse-verify text in the land-ready report; dispatcher applies (workspace bookkeeping). Not a worker task.
- INFO-3 — drop (bundle size from symlinked node_modules; gate lines identical).
- Gallery exemption boundary 10 -> 20 (predates SC-497) — filed SC-501 (Backlog, related to SC-497). OUT of scope for SC-497.
- r2 author = r1 implementer; r2 scoped re-review = r1 reviewer (did not author the fix).

## r2 re-review (2026-10-23)
Delta 6576fd4..45dd1d1 APPROVE_WITH_NITS. LOW-1 and LOW-2 fixed. NEW LOW-3: styles-source.css:15988-15990 still says "bump the pin in obsidian-host-pin.mjs AND obsidian-app-css.pin.mjs … commit both together"; the reworded light-island header cites that comment, which now says the opposite.
- Ruling: FOLD LOW-3 into r3 (same false instruction as LOW-1, CSS comment only). Author = implementer; scoped re-review = the same reviewer.

## r3 / land-ready (2026-10-23)
907f55c (LOW-3 fix) re-review APPROVE. LAND-READY: plugin branch sc497-obsidian-115-pin @ 907f55c (6576fd4 + 45dd1d1 + 907f55c on base d152ea4). No rebaseline. dse-verify edits proposed in sc497-dse-verify-proposal.md (CURRENT sha placeholder = landed sha).
