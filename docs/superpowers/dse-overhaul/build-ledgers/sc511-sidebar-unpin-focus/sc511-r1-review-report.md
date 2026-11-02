# SC-511 r1 review report (reviewer B)

## Executive summary
- VERDICT: LAND-READY. There are no CRITICAL, HIGH or MEDIUM findings. LOW-1 is a one-sentence CHANGELOG reword that can ride along at landing or in a trivial fix commit.
- Shas reviewed: dse c37d9b49 (13507efa + c37d9b49 on origin/develop 423e798d, unchanged). Superproject 1420432e on c20ab3f3. Superproject origin/main has since moved to baab5315 (docs/handoffs only), so 1420432e needs a trivial rebase.
- Findings: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 1 / INFO 6.
- Gates I measured on c37d9b49:
  - tsc rc 0 and lint rc 0, both clean.
  - jest 6287 passed / 1 skipped / 251 of 252 suites (run with the harness css cached).
  - lifecycle 46/46 (21 + 16 + 9, three `--only` parts with G-S56 last). These ran on DSE_LIFECYCLE_PORT=9293 because port 9262 was held by sc472's lifecycle Obsidian (pid 1787167, cwd worktrees/sc472-scroll-pin-timer).
  - e2e `128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`, with the pointer parked.
  - shots 592 PNGs, 0 FAIL, button host-leak 161/966 (this run went past 600 s and moved to the background; I polled its own rc file).
  - freeze 280/280.
  - parity 0 gaps / 0 undeclared / 24 declared, run last.
  - Every number matches the implementer's claim.
- Tests are real: each of six source/CSS mutations turns the new suites red (8 / 3 / 6 / 2 / 1 / 3 failures).
- Real-Obsidian probes: 10 scenarios. Placement, ring and 2.5 s stability pass. Nothing is stolen, the two-leaf case passes, and the degrade card passes. RVW-P04 reports FAIL only on the e2e harness's undeclared-write invariant (my probe did not declare its counter edit); its focus result is good.
- Working trees are as I found them: dse clean, superproject ` M draw-steel-elements` (the unbumped pointer, already there at start).

## Findings

### CRITICAL / HIGH / MEDIUM
None.

### LOW-1: the CHANGELOG says "the same focus ring as the other controls", but the colour differs
- File: superproject `CHANGELOG.md:17` (commit 1420432e).
- Measured in real Obsidian (RVW-P01/P09):
  - The hand-off ring on `.dse-sidebar__panel-note` and `.dse-sidebar__empty` is `solid 2px rgb(138, 92, 245) offset 2px` in dark and `rgb(152, 115, 247)` in light. That is Obsidian's `--interactive-accent`.
  - A kit control inside an element root, such as the counter stepper button 20 px lower in the same panel, rings in steel teal: `rgb(77, 184, 199)`, i.e. `#4db8c7` (dark, styles-source.css:6916) and `#2a7b88` (light, :14238).
- Failure scenario: a keyboard user Tabs from the note link (purple ring) to the counter's − button (teal ring) and sees two different ring colours in one panel. The bullet promises "the same" ring.
- The implementation itself follows the ruling:
  - It adds no new token and no new colour.
  - The value is the kit's own `:root` default (`var(--interactive-accent)`, :6462), re-declared on the element with a fallback. This copies the `.dse-undo-notice__action` precedent (:1832).
- Prescribed fix: reword the last sentence. For example, "The note link and the message now show a focus ring (the same 2 px outline as the other controls, in Obsidian's accent colour, as the undo toast's button)." Or simply "now show a focus ring." No code change. Whether to use the steel ring colour instead is an owner/Scott call; it is not required by the ruling.

### INFO-1: ring colour for Scott's crop
The implementer's crops (dark and light) show a clear 2 px accent-purple outline around "three-counters" on the panel that took the removed panel's place. If Scott compares it with card rings, he will see purple against teal (see LOW-1).

### INFO-2: dse-verify SKILL.md needs bumping at landing
No `sc511-dse-verify-proposal.md` was written. Two places need the new numbers:
- The CURRENT block: jest 6287 / 1 / 251 of 252 (fresh worktree 6286 / 2), e2e 128/128, 89/89.
- The e2e table row, which reads "today `124/124 … 87/87 pairs`" (step 4b, SKILL.md near line 31). It needs the same bump.

Lifecycle stays 46/46 and shots, freeze and parity are unchanged.

### INFO-3: the superproject base moved
origin/main went from c20ab3f3 to baab5315 (`docs/handoffs/HANDOFF.md`, one line). 1420432e touches only `CHANGELOG.md`, so the rebase is trivial and conflict-free.

### INFO-4: `focusHandoff.ts` header comment is now incomplete
At `src/framework/chrome/focusHandoff.ts:15` it still says every move "only ever lands on a control of the same block". The SC-511 sidebar hand-off lands on a neighbouring block's note link, or on the sidebar's empty-state message, though always inside the same sidebar leaf. SC-518 added its own paragraph to that header. Optional: add one SC-511 line there. This is documentation only.

### INFO-5: the `focusEntry()` fallback path cannot be reached in production
At `src/framework/sidebar/SidebarPanel.ts:90-96`, `renderHeader()` always creates the note link synchronously in `mount()`, before any await. So `noteLinkEl` exists for every panel, healthy or degraded, and the "first focusable outside `.dse-chrome`" branch never runs. Only the jest test exercises it, by deleting the link by hand. It is harmless defensive code; no action needed.

### INFO-6: a programmatic removal with focus inside the removed panel drops focus to body
RVW-P06a: a vault delete of the pinned note's file while its own note link held focus sends focus to `body`. This is the base behaviour and what the ruling asks for: non-press removals move nothing, and `handleVaultDelete` and `evictOrphanedSiblings` call `removePanel(panel)` with no flag. Recorded so the owner knows the rule was applied as written and nothing more.

## Scope check (probe 8)
- `src/framework/pipeline.ts`: one hunk of 3 added lines and 1 removed in the Unpin item (`control: 'chrome.unpin'`, a comment, `onClick: (evt) => …requestRemoval?.(isKeyboardClick(evt))`). `isKeyboardClick` was already imported, so there is no import churn. That is as small as SC-540's overlap allows.
- `mountChrome.ts`: untouched (not in the diffstat).
- CSS: two arms added to the one shared rule (`styles-source.css:15585-15586`), plus a `--dse-focus-ring` re-declaration on each element (:16499, :16539).
  - No new ring rule, token or colour.
  - kit-index's one-`outline: 2px solid` guard stays green.
  - Both arms are plain class selectors. `grep` shows `.dse-sidebar__panel-note` and `.dse-sidebar__empty` are used only by SidebarPanel and DseSidebarView, so the shared rule matches nothing new.
  - Shots, freeze and parity are unchanged (592 / 0 FAIL / 161/966, 280/280, 0/0/24). The `sidebar-empty` shot does not hold focus.

## Tests (probe 7)
I applied each mutation in the worktree, ran `sidebarUnpinFocus.test.ts` and `kit-index.test.ts`, and restored with `git checkout`. The tree was clean after.

| Mutation | Result |
|---|---|
| M1: hand-off neutralised (`if (handOff) …` → no-op) | 8 failed |
| M2: keyboard guard removed (always hand off) | 3 failed |
| M3: pipeline Unpin passes no flag | 6 failed |
| M4: degrade "Remove panel" passes no flag | 2 failed |
| M5: the two CSS arms removed | 1 failed (kit-index) |
| M6: `tabindex="-1"` removed from the empty state | 3 failed |

e2e vs G-S63: the choice is justified. The e2e harness drives real Tab and Enter on the real Unpin button in real Obsidian, and SBR-F01..F04 assert placement and ring (outline `solid`, `:focus-visible`). No lifecycle-only behaviour (section re-draw or adoption) is involved. The coverage gate counts the new `chrome.unpin` × {press:Enter, click} pairs: 87 → 89.

## Probe results (real Obsidian)
All probes ran via a temporary spec `e2e/specs/sidebar/zz-sc511-review-probe.e2e.ts`, which I deleted afterwards; a copy is in scratch. I used real Tab, Enter and mouse input, and sampled `document.activeElement` every 100 ms for 2.5 s after each hand-off.

| # | Scenario | Result |
|---|---|---|
| P01 | Keyboard Unpin of the middle of 3 | `note:1` (the old third panel); `:focus-visible` true; outline solid 2px rgb(138,92,245), offset 2px; ring = accent; in leaf A; stable for 2.5 s (same node, still connected, ring at end) — PASS |
| P02 | Keyboard Unpin of the last of 3 | `note:1` (the panel above); ring; stable — PASS |
| P03 | Keyboard Unpin of the only panel | `empty`, tabindex "-1", ring, stable. Tab from it goes to Obsidian's sidebar `clickable-icon` (natural order, not trapped) — PASS |
| P03b | Keyboard Unpin of the first of 3 | `note:0` (the new first panel); ring; stable — PASS |
| P04 | Keyboard `−` on the middle panel's counter, then keyboard Unpin of it right away (flush on unload rewrites the note shared by all three panels) | `note:1`, ring, stable 2.5 s through the write (note now `1,1,3`). The run reports FAIL only on the harness's undeclared-write invariant; the focus result is good |
| P05 | Real mouse click on the note link | When the link took focus, `:focus-visible` was false and outline none (no forced ring); the link then navigates and focus moves to the reading view. Plain Tab onto the link shows the ring — PASS |
| P06a | Vault delete of a pinned note with focus on that panel's note link | `body` (base behaviour; non-press removal moves nothing — INFO-6) |
| P06b | `removePanel(p)` with no flag, focus on a reading-view counter button | Focus stays on that button — PASS |
| P06c | `removePanel(p, {keyboard:true})`, focus on a reading-view button | Focus stays on that button (no steal) — PASS |
| P07 | Two sidebar leaves (split, both visible, 3 + 3 panels for the same blocks); keyboard Unpin of leaf B's middle | Focus lands in leaf B (index 1), not in A; A keeps 3 panels; stable — PASS |
| P08 | Degrade card "Remove panel" (third panel, missing anchor), keyboard | `note:1` (the panel above), ring, stable. A real mouse click on Remove gives `body` (no move) — PASS |
| P09 | Empty state created again: Unpin the only panel, re-pin, Unpin again | A new node each time (`sameNode:false`), `tabindex="-1"` and `tabIndex -1` both times, and it is focused. The ring shows in dark (rgb(138,92,245)) and light (rgb(152,115,247)) on both the empty state and a note link — PASS |
| — | Pointer Unpin vs base (probe 2) | SBR-F04 (real click) gives `body`, outside the sidebar. In code, with `keyboard` false, `removePanel` makes no focus call and runs exactly the base sequence. The implementer's base run also measured `body` — identical |

## Evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-review-b/`:
- gate.sh, jest.sh, red.sh
- tsc.log, lint.log, jest.log, lc1.log, lc2.log, lc3.log, e2e.log, shots.log, freeze.log, parity.log (each with a matching .rc)
- red-summary.log, red-m1-handoff-off.log … red-m6-tabindex.log
- probe1.log (a usage error: template-literal ids), probe2.log (the probe run)
- zz-sc511-review-probe.e2e.ts.copy

The P04 harness bundle is at `/home/scott/code/steelCompendium/worktrees/sc511-sidebar-unpin-focus/draw-steel-elements/e2e/.out/20261102-182534-52fa/RVW-P04`.

## r2 re-review (scoped to the r2 delta)

- VERDICT: LAND-READY. Findings: CRITICAL 0 / HIGH 0 / MEDIUM 0 / LOW 0 / INFO 2 (neither blocks landing). LOW-1 is closed.
- Shas: dse eafe76e1 (parent c37d9b49; origin/develop is still 423e798d). Superproject 93326c34, whose parent is baab5315 (= origin/main). Both repos were fetched first.
- Gates on eafe76e1: tsc rc 0 (`tsc --noEmit && tsc --noEmit -p e2e`, no output). lint rc 0 (`eslint src main.ts e2e`, clean apart from the usual `.eslintignore` deprecation notice).
  Logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-review-b/r2-tsc.log` and `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc511-r1-review-b/r2-lint.log`, each with a `.rc` file.

1. **dse diff c37d9b49..eafe76e1**: one file (`src/framework/chrome/focusHandoff.ts`), +5 lines, all `//` comment, no code. The comment is accurate:
   - SC-511 uses only `isKeyboardClick` (pipeline.ts and SidebarPanel.ts), `focusControl` (DseSidebarView.ts and SidebarPanel.ts) and `focusIsFree` (DseSidebarView.ts). `HANDOFF_FOCUS` is used only indirectly, through `focusControl`.
   - No request is armed, and removal is synchronous.
   - The target order it states (the panel that took the removed one's place, else the one above, else the "No pinned blocks" message) matches `handOffFocusAfterRemoval`.
   - Nit, not a finding: `isKeyboardClick` is called at the two press sites, not inside `removePanel` itself. The sentence groups the three helpers loosely.
2. **Superproject 93326c34**: touches only `CHANGELOG.md` (+8 lines under `## Unreleased`), and baab5315 is its only parent. The bullet is accurate, plain and user-facing. Its last sentence now reads "now show a focus ring in your theme's accent colour when focused", which matches the measured ring (Obsidian `--interactive-accent`: rgb(138,92,245) dark, rgb(152,115,247) light). **LOW-1 closed.**
3. **Proposal `sc511-dse-verify-proposal.md`**: every number matches what I measured on c37d9b49:
   - jest 6287 / 1 / 251 of 252
   - lifecycle 46/46 (21 + 16 + 9)
   - e2e 128/128, 0 failed, 0 known-bug, 89/89 pairs
   - shots 592, 0 FAIL, 161/966
   - freeze 280/280
   - parity 0 / 0 / 24
   
   The row-4b "today" replacement is correct. The CURRENT block follows the existing layout and wording.
   - INFO-r2-1 (style): the existing blocks write `**CURRENT — dse …` and `SC-nnn landed — …` with an em dash; the proposal uses `--`. Whoever applies it should use `—` to match.
   - INFO-r2-2: optional §3 says a busy CDP port 9262 "reports mass 'FAIL' (not exit 2)". That contradicts SKILL.md's current text ("port busy" = exit 2). It rests on the implementer's 20/21-fail run, which I did not reproduce, because I ran on 9293 from the start. Fine as an optional line citing SC-551. The owner may also want to add that every number was independently re-measured by reviewer B on c37d9b49 (r1), which the block's provenance sentence does not mention.
   - Not measured: the fresh-worktree "6286 / 2" figure. It follows the documented one-fewer/2-skipped rule.
4. Working trees are as I found them: dse clean, superproject ` M draw-steel-elements` (the pointer is still unbumped, as before).
