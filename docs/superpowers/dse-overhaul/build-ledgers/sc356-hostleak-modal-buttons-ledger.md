# SC-356 decisions ledger

Ticket: SC-356 — DSE button host-leak sweep never sees modal-only buttons (e.g. .dse-optchip).
Worktree: /home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons (branch sc356-hostleak-modal-buttons in every submodule)
Base: dse origin/develop @ ba20072 (2026-10-21)
Owner: ticket-owner session be71a0a9-199f-4e14-967b-191935312b05

## Scope (from the ticket description, verbatim excerpts — no Scott comments on the thread as of 2026-10-21)

> This ticket is to make the gallery sweep cover modal-only buttons as well, either by mounting them in the gallery or by adding a modal pass, and to add `aria-pressed` to the grouping key.

> Related gap found in the SC-338 review: the chips still take their height (30px), background and unpressed text color from Obsidian rather than from plugin tokens. A modal-aware sweep would surface that too.

## Owner rulings

- 2026-10-21 (owner): Approach = a MODAL PASS inside the Playwright harness (the harness can already open plugin modals — `assertPressedToggleParity` drives `.dse-modal` ConditionsModal / montage LogActionModal chips). Not the real-Obsidian camera.
- 2026-10-21 (owner): Leaks the new pass surfaces get FIXED in this ticket, with the constraint "zero pixel change in real Obsidian": the plugin pins each leaked property to the value Obsidian currently gives it, from plugin tokens. Freeze must stay 276/276 with no rebaseline. Any leak whose fix would visibly change a control comes back to the owner (STATUS: NEEDS_CONTEXT) — that is a Scott decision.
- 2026-10-21 (owner): Context from dispatcher — SC-422 (parked, unlanded) also edits visual-harness/shoot.mjs (text-scale gates over chrome surfaces). Keep shoot.mjs edits scoped to the host-leak sweep.

## Round 1 result (2026-10-21) — modal pass live, chips leak; zero-pixel pin not achievable with plugin tokens
- dse 73758ab: modal pass (9 scenarios / 8 Modal classes) + aria-pressed key + src/ Modal registry check. Gallery unchanged 112/672 (10 exempt). Modal pass RED at base CSS: .dse-optchip (Conditions duration/effect), .dse-cond-icons__choice, .dse-mt__sheet-resultchip, .dse-swatch.
- Implementer's prototype A (kit plugin tokens) greens the chips but VISIBLY changes them (height 30 -> 26.4 / 21.7px, fill Obsidian #333/#fff -> --dse-surface, unpressed ink dims). Freeze does not guard screen-only chips.
- ~~"Leaks the new pass surfaces get FIXED in this ticket, with the constraint 'zero pixel change in real Obsidian'"~~ superseded: not achievable with plugin tokens → chip look is a Scott decision (asked 2026-10-21).
- 2026-10-21 (owner): `.dse-swatch` leaks (size 20 -> 19.5, Obsidian plate shadow, focus ring) belong to SC-361 (swatch focus design, parked on Scott). This ticket declares them in an explicit, commented allowlist citing SC-361; SC-361 removes the entry when it lands its design.
- 2026-10-21 (owner): before asking Scott, get REAL-Obsidian camera shots (not Playwright harness renders — the harness modal has no backdrop and the tracker shows through) of today vs each chip option.

## Round 1b result (2026-10-21)
- dse 9f1cf8e: swatch allowlist (ConditionsModal, class exactly `dse-swatch`, 10 properties, fails if a listed property stops leaking) committed. Real-Obsidian measurements: TODAY 30px / fill rgb(51,51,51)|#fff / idle ink rgb(218,218,218)|rgb(34,34,34); A = icon choices 26.39px, other chips 21.67px, fill --dse-surface, idle ink dimmer; A30 = A at 30px. A30 greens the modal pass (216 comparisons, 100 swatch diffs allowlisted). Mobile: today chips are 40px (Obsidian input height); literal 30px would shrink them.
- Follow-up rulings (owner, 2026-10-21):
  - gallery mounts no pressed aria-pressed toggle → DROP: the modal pass now covers pressed chips.
  - Legacy/Migration modals not openable → DROP: footer kit buttons only, swept elsewhere; registry check fails if they grow their own <button>.
  - dse-verify SKILL.md says 12 exemptions, measured 10 → FOLD into this ticket's docs update.
  - freeze is print-only, screen chips unguarded → DROP: by design, screen looks are Scott's eye (this ask).
- ASKED SCOTT 2026-10-21: chip look — TODAY (keep Obsidian look, allowlist it) / A / A30. Owner recommendation A30 with height following Obsidian's control height (30px desktop, 40px phone).

## SCOTT RULING — 2026-10-21 12:43Z (comment 15cdf2dd), verbatim:
> A30

Answering the owner's ask, whose A30 option read verbatim:
> **A30: plugin look, 30px tall (recommended).** Same fill and labels as A, but the chips keep today's 30px height. Nothing gets harder to tap. On a phone, today's chips are 40px tall; I would keep that by following Obsidian's control height rather than fixing 30px.

~~ASKED SCOTT 2026-10-21: chip look — TODAY / A / A30~~ answered: A30.

## Context from dispatcher (2026-10-21, after ruling)
- Rebase onto dse develop bc4a0c5. Baselines: jest 5457 / 1 skipped / 232 of 233, lifecycle 30/30, e2e 89/93 with 4 known-bug, coverage 64/64, shots 580, freeze 280/280, parity 0/0/24.
- SC-468 and SC-474 changed Conditions-modal focus and click handling (e2e COND-E02..E06) since the branch base.
- SC-361 (swatch focus ring, same modal) is resuming concurrently. Swatch allowlist names SC-361 → whichever lands second reconciles (if SC-361 lands first, remove/narrow the allowlist entry on rebase). Dispatcher will say when one lands.
- New lifecycle scenario id, if any: G-S25.
- Workers follow adapter footguns 9, 12, 13.
- 2026-10-21 (dispatcher): dse develop moved bc4a0c5 → 772c3cd (SC-457: shared `fenceLanguage` rule in src/framework/host/blockPrefix.ts; lifecycle G-S14). New baselines: jest 5536 / 1 skipped / 233 of 234, lifecycle 31/31, e2e 89/93 with 4 known-bug and 64/64, shots 580, freeze 280/280, parity 0/0/24. Land-ready must be on 772c3cd (or newer), with the superproject rebased onto origin/main.

## Round 2 result (2026-10-21)
- dse b01268c on 772c3cd (3569f23, 5cc0ebb, 1ae02f1, b01268c); superproject ff to origin/main 27ed1bf + doc commit db07e0a. Full battery green: jest 5541/1 skipped/233 of 234; lifecycle 31/31; e2e 89/93, 0 failed, 4 known-bug, 64/64; shots 580 (gallery 112/672, modal 36 kinds/216, 100 swatch diffs allowlisted SC-361); freeze 280/280; parity 0/0/24.
- A30 CSS: height var(--input-height, 30px), flex centred, fill --dse-surface, idle ink --dse-fg-muted. Real Obsidian desktop matches r1b A30 exactly (owner eyeballed conditions-dark r1b-vs-final: identical).
- 2026-10-21 (owner): phone height measured 44px (Obsidian 1.14.4 --input-height under is-phone; plain host button also 44px), not the "40px" in my ask text. The ruling's intent ("following Obsidian's control height rather than fixing 30px") is met; the 40px figure in my ask was wrong. NOT a new Scott decision — correct it in the land-ready comment.
- Next: independent review by a fresh orchestration:reviewer (implementer identity ab72a3ac… must not review).
- 2026-10-21 (dispatcher): dse develop moved 772c3cd → 8d075db (SC-422 landed: text-size knobs on chrome roots in search modal, settings preview, sidebar; visual-harness/entry.ts + shoot.mjs gain chrome-surface text-scale gates — expect a shoot.mjs rebase touch-point). New baselines: jest 5552 / 1 skipped / 234 of 235, lifecycle 31/31, e2e 89/93 with 4 known-bug and 64/64, shots 580 incl. `text scale OK (1626 …)` and `text scale once OK (104184 / 208 loads …)`, freeze 280/280, parity 0/0/24. Land-ready must be on 8d075db (or newer), superproject rebased onto origin/main.
- 2026-10-21 (owner): the r2 reviewer is mid-review of b01268c on 772c3cd in the same worktree — do NOT rebase under it. After the review, the fix round (implementer) also rebases onto 8d075db+, resolves the shoot.mjs touch-point, and re-runs the full battery; the scoped re-review then covers the fixes + the rebase conflict resolution.
- 2026-10-21 (dispatcher): dse develop moved 8d075db → 95981f1 (SC-432: stamina modal Spend Recovery disabled for creatures + no-pool hero confirmation; new e2e STAM tests). New baselines: jest 5582 / 1 skipped / 234 of 235, lifecycle 31/31, e2e 95/98 ok, 0 failed, 3 known-bug, coverage 66/66; shots 580; freeze 280/280; parity 0/0/24. Land-ready must be on 95981f1 (or newer), superproject rebased onto origin/main.
- 2026-10-21 (owner): SC-432 changes StaminaEditModal, one of the modal-pass scenarios. The r3 rebase must re-verify that scenario (the disabled Spend Recovery button may add a disabled kind / focus-visible exemption; explain any count change).

## Round 2 review (2026-10-21) — VERDICT LAND-READY at b01268c, 3 LOW / 4 INFO; owner rulings:
- LOW-1 (in-note negotiation chips `.dse-nt__chip` also carry `.dse-optchip`; comments say modal-only) → FOLD: correct styles-source.css:17176 comment + SKILL.md:194 text; add a jsdom pin that `.dse-nt__chip`'s own rules win over the SC-356 block (keep the block unscoped).
- LOW-2 (`display: flex` vs Obsidian's `inline-flex`) → FOLD: use inline-flex, fix the comment.
- LOW-3 (assertModalRegistry sees only direct subclasses / same-file buttons) → FOLD the cheap part: transitive subclasses + inline `new Modal(`. DROP cross-file button-helper detection: the 3 declared-unreachable modals already build buttons through footer(), so it would need a real call-graph; no live case.
- INFO-1 (SC-361 allowlist tolerant across states) → DROP: SC-361 deletes the entry outright; the stale-entry check forces it.
- INFO-2 (superproject 9 behind, CHANGELOG conflict) → handled in r3 rebase step: keep both Unreleased bullets; re-check SKILL.md numbers.
- INFO-3 (no SC-422 collision in trial merge) → noted.
- INFO-4 (CompendiumSearchModal unreachable reason partly stale after SC-422) → FOLD: reword the reason.
- 2026-10-21 (dispatcher): dse develop moved 95981f1 → 8d890f9 (SC-366 follow-up: styles-source.css removes the left stripe on `.dse-ref-notice`, +3 jest tests; no shots moved). New baselines: jest 5585 / 1 skipped / 234 of 235; lifecycle 31/31, e2e 95/98 with 3 known-bug and 66/66, shots 580, freeze 280/280, parity 0/0/24. Land-ready must be on 8d890f9 (or newer).

## Round 3 result (2026-10-21)
- dse 2796ab8 on 8d890f9 (9018204, a6480ba, a51e97f, 23b280e, e572c67, 2796ab8); superproject doc commit f87af93 on origin/main 988f24f. Battery green: jest 5591/1 skipped/234 of 235; lifecycle 31/31; e2e 95/98, 0 failed, 3 known-bug, 66/66; shots 580 (gallery 112/672; modal 10 scenarios/9 classes/38 kinds/228; 100 swatch diffs allowlisted SC-361; text scale 1626 + once 104184/208); freeze 280/280; parity 0/0/24.
- SC-432's FreeHealConfirmModal was flagged by the registry check → added as 10th scenario (owner: accepted, in scope — the registry did its job).
- Next: scoped re-review by the r2 reviewer (not the implementer).

## SC-361 coordination (dispatcher relay from SC-361 owner, 2026-10-21) — verbatim:
> Whichever of SC-356 or SC-361 lands second: both branches add a host re-grounding block labelled "E." at the same spot in styles-source.css. Keep both blocks and relabel the second one "F.". Then delete the SC-361 entry from HOSTLEAK_KNOWN_LEAKS in shoot.mjs and re-run shots. SC-361's reviewer confirmed that on your tip, with SC-361 applied and your swatch allowlist entry deleted, the swatch host-leak check is clean.
- Owner plan: if SC-361 lands first → a reconcile round on SC-356 (rebase, keep both "E." blocks with ours relabelled "F.", delete the SC-361 HOSTLEAK_KNOWN_LEAKS entry, re-run full battery incl. shots; scoped re-review of that delta). If SC-356 lands first → SC-361's owner does the same on its side; nothing for us. Dispatcher will say which lands first.
- 2026-10-21 (dispatcher): dse develop moved 8d890f9 → 54f8f88 (SC-483: src/authoring/FormModal.ts + test/dom/authoring/formModal.test.ts only; block edit form Save omits untouched selects). New baselines: jest 5601 / 1 skipped / 234 of 235; lifecycle 31/31, e2e 95/98 with 3 known-bug and 66/66, shots 580, freeze 280/280, parity 0/0/24. Land-ready must be on 54f8f88 (or newer), superproject rebased onto origin/main (CHANGELOG moved).
- 2026-10-21 (owner): do not disturb the running re-review of 2796ab8. After it: round 4 = implementer rebases dse onto 54f8f88+ and superproject onto origin/main (CHANGELOG conflict → keep all bullets), re-runs the FULL battery once on the final base (FormModal is a modal-pass scenario — confirm it still opens); reviewer confirms `git range-diff` shows no SC-356 content change beyond conflict resolution, plus the gate lines. Any r3 re-review fixes fold into round 4.

## Round 3 re-review (2026-10-21) — LAND-READY at 2796ab8 on 8d890f9; 0 LOW+, 2 INFO
- INFO-1 (superproject origin/main moved, HANDOFF.md only) → handled in r4 rebase. INFO-2 (report wording "ghost" vs measured plain dse-btn) → DROP: report-only.
- Round 4 dispatched: rebase-only onto 54f8f88+ (SC-361 not on develop as of dispatch), full battery once.

## Round 4 result (2026-10-22) — LAND-READY
- dse ea56712 on origin/develop 54f8f88 (commits 0409d3b, b856448, ce2e15f, 56a748b, 6854ca2, ea56712); superproject 23147f2 on origin/main 46ae296. Range-diff vs reviewed 2796ab8: all 6 commits `=` (patch-identical); owner verified range-diff, on-tip ancestry, clean tree, CHANGELOG has no markers and keeps the SC-356 bullet. No separate re-review: the delta has no content change (rebase-only, 0 dse conflicts).
- Battery at ea56712: tsc/lint clean; jest 5607/1 skipped/234 of 235; lifecycle 31/31; e2e 95/98, 0 failed, 3 known-bug, 66/66; shots 580, 0 FAIL (gallery 112/672; modal 10/9/38/228; 100 SC-361 swatch diffs allowlisted; text scale 1626; once 104184/208); freeze 280/280; parity 0/0/24.
- SC-361 not on develop → allowlist stays; whichever lands second applies the coordination ruling above.
