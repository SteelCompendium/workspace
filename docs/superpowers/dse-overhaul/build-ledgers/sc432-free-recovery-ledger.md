# SC-432 decisions ledger — Spend Recovery heals for free on creatures and no-pool heroes

Ticket: https://linear.app/tski-home/issue/SC-432
Worktree: /home/scott/code/steelCompendium/worktrees/sc432-free-recovery (every submodule on branch `sc432-free-recovery`)
Repo touched: draw-steel-elements (tracked branch `develop`, cut at `ab34293`); superproject (CHANGELOG) on origin/main `b21e48b`.

## Spec (ticket description, verbatim, 2026-10-20)

> **Repro:** in an initiative tracker, open the stamina modal for a hero at 0/80 whose block tracks no Recoveries pool. Press Spend Recovery three times, then Apply. The hero is at 78/80 and nothing was spent. The same happens for every creature (monsters have no Recoveries in Draw Steel) and for a legacy `ds-stamina` block without `recoveries_max`.
>
> **Ruling (Scott, verbatim):** "I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands"
>
> The recommendation it agrees with: disable Spend Recovery for creatures. For heroes with no pool to spend from, keep it as a plain "heal one Recovery's worth" shortcut, relabelled so it does not claim to spend anything.
>
> **Fix:**
>
> * Creatures: Spend Recovery disabled, with a reason tooltip (monsters have no Recoveries).
> * Heroes without a pool: relabel the button (it heals one Recovery's worth and spends nothing), and confirm before applying, so the user knows no Recovery is being tracked.
> * Heroes with a pool: unchanged.
> * The initiative host already has the mechanism: SC-132 H1 passed `spendRecovery: false` for the hero sheet.
>
> **Tests:** the SC-408 tests pin today's behaviour (titles end "[current behaviour — ruling pending SC-408]"). They become known-bug markers citing this ticket; the fix flips them to plain tests. Start from `draw-steel-elements/e2e/README.md`.

## Scott rulings (verbatim, dated)

- 2026-10-18 (on SC-408, quoted in the ticket): "I agree with your recommendation.  Maybe make a confirmation dialog for the hero without a pool to ensure the user understands"

Thread had 0 comments at 2026-10-20 start.

## Owner decisions

- 2026-10-20: Pipeline = implementer (r1) -> independent reviewer -> fix rounds -> scoped re-review -> evidence post to Scott (new user-facing copy + a new dialog: he sees the label and the confirmation before land-ready) -> land-ready.
- 2026-10-20: Confirmation timing = on the FIRST press of the relabelled button in a modal session (the moment the user acts), not at Apply. Cancel adds nothing. Later presses in the same modal session do not re-ask. Rationale: the user learns before stacking presses; Apply stays a single commit step (SC-427 Apply label untouched). Shown to Scott in the evidence post; cheap to move if he prefers Apply-time.
- 2026-10-20: Wording is the implementer's proposal, one shared source of truth per string (SC-428 rule), name-then-reason tooltip pattern (SC-324). Scott approves wording at the evidence post.

## Round log

- 2026-10-20: worktree created (`sc432-wt-new.log`, rc 0). dse origin/develop ab34293, workspace origin/main b21e48b.
- 2026-10-20 r1: implementer A (orchestration:implementer, agent ad2ad4335caa6c41d) dispatched on `sc432-brief-r1-impl.md`. Identity A never reviews; review goes to reviewer B (Opus).
- 2026-10-20 r1 DONE (A): dse 1ddef76 (a52a5bd feat, 89b1dff e2e, 1ddef76 docs) on ab34293; superproject CHANGELOG 8511748. Gates: jest 5292/1/230 of 231; lifecycle 27/27; e2e 88/91 ok, 0 failed, 3 known-bug, 59/59; shots 572; freeze 276/276 (no rebaseline); parity 0/0/24. Strings: no-pool hero button "Heal Recovery Value" (tooltip "Heal Recovery Value: Spends no Recovery"); creature "Spend Recovery: Creatures have no Recoveries"; dialog "Heal without spending a Recovery?" with Cancel / Heal. Cancel/Escape/X stage nothing and re-ask next press. Hero sheet no-pool still hides the button (unchanged).
- Follow-up ruling (owner, 2026-10-20): "ds-stamina-bar always opens as hero, so a bar standing in for a monster gets the no-pool heal" -> DROP: the block has no creature/hero field; the no-pool path with a confirmation is the safe behaviour for an unclassified block.
- 2026-10-20 r1 review: reviewer B (orchestration:reviewer) dispatched on `sc432-brief-r1-review.md`.
- 2026-10-20 r1 review (B) DONE: LAND-READY; 0 BLOCKER/HIGH/MEDIUM, 2 LOW, 6 INFO. Gates re-run match A exactly. Mutations 9/9 jest red, 6/6 e2e red. 11 real-Obsidian probes correct (X, click-outside, navigate away, external edit, SC-340 adoption, second block, keyboard, double-click, recoveries-without-max, recoveries_max 0).
- Review rulings (owner, 2026-10-20):
  - LOW-1 (e2e driver finds Obsidian's X/backdrop page-wide, so the confirmation's X and click-outside paths have no e2e coverage): FOLD. Scope `modal.close` / backdrop lookup to the scope root's own `.modal-container`; add `[STAM-Q13X]` (confirmation X and click-outside each close only the confirmation, pending edit survives, nothing staged).
  - LOW-2 (dialog always states the full Recovery value, e.g. "(10)", even when the heal is capped and stages +5): FOLD with owner wording — keep "(N)" as the Recovery value and add that the heal stops at maximum Stamina, e.g. "heals one Recovery's worth of Stamina (10), stopping at maximum Stamina". Always true; no per-press arithmetic in the copy. Scott sees the final copy at the evidence post.
  - INFO-1 (repeated closer registration on each dialog open): DROP — close() is idempotent; harmless.
  - INFO-2 (focus lost when heal button disables itself at max; pool path same): filed SC-465 (Backlog). OUT OF SCOPE for SC-432.
  - INFO-3, INFO-4, INFO-6: DROP — as designed / existing SC-324 pattern / reviewer confirmed safe.
  - INFO-5 (legacy stamina-bar write adds default keys; predates SC-432): filed SC-466 (Backlog). OUT OF SCOPE for SC-432.
- 2026-10-20 r2: fix round = resume implementer A (`sc432-brief-r2-fix.md`). Scoped re-review -> reviewer B.
- 2026-10-20 dispatcher relay: SC-422's r2 reviewer reports the SC-432 r1 reviewer's shared-scratchpad `gate.sh` was overwritten and reused; `sc432-r1-review-e2e.log` (13:03, 88/91 ok, 0 failed) may be SC-422's run against our worktree, not B's. Ruling: r1 review e2e number treated as unverified; the r2 scoped re-review MUST re-run full e2e (evidence of record) with scripts in a private uniquely named dir. Same instruction sent to implementer A for r2.
- 2026-10-20 r2 DONE (A): dse 21a0244 on 1ddef76 (base ab34293); superproject unchanged 8511748. LOW-1: modal scopes find modal.close/backdrop inside their own .modal-container; new STAM-Q13X. LOW-2 final copy: "This hero has no Recoveries tracked, so there is no Recovery to spend. Heal Recovery Value heals one Recovery's worth of Stamina (N), stopping at maximum Stamina, and does not track or spend a Recovery. You won't be asked again while this window is open." Gates: jest 5292/1/230 of 231; lifecycle 27/27; e2e 89/92 ok, 0 failed, 3 known-bug, 59/59 (run 20261020-173659-29e6); shots 572; freeze 276/276; parity 0/0/24.
- 2026-10-20 r2 scoped re-review -> reviewer B (`sc432-brief-r2-rereview.md`).
- 2026-10-20 r2 re-review (B) DONE: LAND-READY at dse 21a0244 / superproject 8511748. 0 BLOCKER..LOW, 2 INFO -> DROP (harmless prefix-strip; jsdom lacks X/backdrop test but real-Obsidian Q13X covers it). Own e2e of record: 89/92 ok, 0 failed, 3 known-bug (SC-433 x3), 59/59, run 20261020-175135-d678. jest 5292/1/230 of 231; freeze 276/276. Mutations MX1-3, MD1, MC1 all red.
- 2026-10-20: evidence post to Scott (wording + dialog + press-time confirmation), In Progress + Needs Review.
- 2026-10-20 dispatcher: dse origin/develop ab34293 -> 71ac43a (SC-454: dead src/utils/CodeBlocks.ts + test deleted; minion-stamina-pool-modal test saves via replaceFenceBody; main.js byte-identical). Workspace origin/main 44dc0ea. New jest baseline 5257 / 229 of 230 suites. Land-ready must be on 71ac43a.
- 2026-10-20 r3 (rebase round, while Scott reviews): resume implementer A — rebase dse onto 71ac43a, superproject branch onto origin/main 44dc0ea, full battery. Expected jest 5287 (5257 + our +30) / 1 skipped / 229 of 230; e2e 89/92 ok, 0 failed, 3 known-bug, 59/59; lifecycle 27/27; freeze 276/276; parity 0/0/24. If any conflict in src/ or test/ needed hand resolution -> scoped range-diff check by reviewer B; zero conflicts -> no re-review.
- 2026-10-20 r3 DONE (A): dse 1cbf6f6 on 71ac43a (4295136 feat, bc10926 e2e, a6ce7fa docs, 1cbf6f6 r2 fix); superproject CHANGELOG 8e22782 on origin/main 44dc0ea. Zero conflicts -> no re-review (owner ruling). Gates: jest 5287/1/229 of 230; lifecycle 27/27; e2e 89/92 ok, 0 failed, 3 known-bug, 59/59 (run 20261020-184824-103a); shots 572; freeze 276/276; parity 0/0/24. Code land-ready; landing waits on Scott's wording/dialog approval (Needs Review).
- 2026-10-20 dispatcher FYI: dse origin/develop 71ac43a -> 188755b (SC-364 dead-code delete in src/prefs/catalog.ts + src/model/ComponentWrapper.ts; main.js byte-identical; baselines unchanged). No action until Scott replies; when he does, rebase onto the then-current develop (resume A, full battery) before reporting land-ready.
- 2026-10-21 **Scott ruling (verbatim, comment 2026-10-21T12:33Z):** "Looks good, land it" — approves the evidence post as-is: button "Heal Recovery Value", tooltips, dialog copy, press-time confirmation. Ready for Agent + Needs Review removed; ticket -> Awaiting.
- 2026-10-21 dispatcher: rebase onto dse develop bc4a0c5 and workspace origin/main 61a8288, re-gate, then report land-ready. Baselines at bc4a0c5: jest 5457 / 1 skipped / 232 of 233; lifecycle 30/30; e2e 89/93 ok, 4 known-bug, 64/64; shots 580; freeze 280/280; parity 0/0/24. SC-466 changed src/elements/stamina-bar/model.ts (writes keep only declared keys) -> expect a touch-point. Adapter footguns 9, 12, 13 apply. A new lifecycle scenario (if any) is G-S23. SC-433 and SC-465 wait on this landing.
- 2026-10-21 r4 (rebase round): resume implementer A on `sc432-brief-r4-rebase.md`. Any hand-resolved conflict in src/ or test/ -> scoped range-diff re-review by B.
- 2026-10-21 dispatcher: dse develop bc4a0c5 -> 772c3cd (SC-457: shared `fenceLanguage` rule in src/framework/host/blockPrefix.ts for every save path, sidebar, autocomplete; lifecycle G-S14). Baselines: jest 5536 / 1 skipped / 233 of 234; lifecycle 31/31; e2e 89/93 ok, 4 known-bug, 64/64; shots 580; freeze 280/280; parity 0/0/24. Land-ready must be on 772c3cd or newer, superproject on current origin/main. Sent to A mid-r4: rebase onto 772c3cd, gate once there. Expected: jest ~5566 / 1 / 233 of 234; lifecycle 31/31; e2e 0 failed, 3 known-bug, ~66/66.
- 2026-10-21 dispatcher: dse develop 772c3cd -> 8d075db (SC-422: text-size knobs on chrome roots; entry.ts + shoot.mjs text-scale gates). Baselines: jest 5552 / 1 skipped / 234 of 235; lifecycle 31/31; e2e 89/93 ok, 4 known-bug, 64/64; shots 580 incl. `text scale OK (1626 …)` + `text scale once OK (104184 / 208 loads …)`; freeze 280/280; parity 0/0/24. Sent to A mid-r4. Expected after: jest ~5582 / 1 / 234 of 235; lifecycle 31/31; e2e 0 failed, 3 known-bug, ~66/66. Land-ready on 8d075db or newer.
- 2026-10-21 ~19:05Z: owner + implementer A killed by session-limit 429 mid-r4 (A was about to run the full battery as two scripts). State at 22:22Z: dse 95981f1 on 8d075db, clean; superproject 9abd6e0. Existing sc432-r4-*.log (15:00-15:04 local) are of unproven base -> not counted. Resumed A via SendMessage: verify state, re-fetch/rebase if moved, whole battery once on the final base.
- 2026-10-21 r4 DONE (A): dse 95981f1 on 8d075db (ce7d614 feat, b31356d e2e, b8f93e9 docs, 95981f1 r2 fix); superproject CHANGELOG 606eee3 on origin/main 060c9de. dse: zero conflicts across 4 rebases (SC-466 touch-point needed no change). Superproject: one CHANGELOG `## Unreleased` conflict, both kept, ours first -> docs-only, no re-review (owner ruling). Gates: jest 5582/1/234 of 235; lifecycle 31/31 (attempt 1 rc 2 environment race at load ~21, re-run green); e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 (run 20261021-223302-c4f6); shots 580 + text scale OK lines; freeze 280/280; parity 0/0/24. Owner verified 22:5xZ: both heads fast-forward from origin.
- 2026-10-21: reported LAND-READY to dispatcher.
