# SC-662 r3 — fix round (implementer I1, resumed)

Same worktree, branch and rules as your r1 brief (`sc662-brief-r1-implement.md`, all footguns still apply: no `rm` in /tmp or the scratchpad, `git -C`, script-file gates, never push, never call the tracker, NEEDS_CONTEXT if you need me). Head under fix: `5245240c`. First `git -C … fetch origin`; if `origin/develop` moved from `42c26272`, rebase onto it and say so.

Read the reviewer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/sc662-r2-review-report.md` and its probe specs (copy, never edit in place): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc662-r2-R1/zz-r2r1-probes.e2e.ts`, `zz-r2r1-jest.test.ts` (RJ03/RJ04/RJ08 are there). Owner rulings are in `decisions.md` under "Owner rulings on r2".

## Findings to fix (verbatim from the review; each ruled FOLD)

### MED-1 — sidebar form Save overwrites an outside edit to its block (follow-up (i))

- Where: `src/framework/host/SidebarBlockHost.ts:339` (the new guard covers `fromView: true` only) and `src/authoring/FormModal.ts:543-545` (a sidebar form has no pin, so it calls `replaceSource(body)` with no check).
- Scenario (RV-F01, real Obsidian, pref `authoringControls` on): pin a counter (max 9), open its Edit form, an outside edit sets `max_value: 7` in the same block, change `name: Health` to `Healed` in the form, Save. Note ends `name: Healed`, `max_value: 9`: the outside edit is gone, no Notice. Same on base and head.
- Reading view, same sequence (RV-F03): Save refused with "a change to a block in f-RV-F03 was not saved — the block changed on disk first.", the form stays open, `max_value: 7` kept.
- Outside edit elsewhere in the note (RV-F02 sidebar, RV-F04 Reading view): the Save lands and the outside edit stays (correct on both).
- Fix: make the sidebar form write strictly, as Reading view's `pinOnly` does: the form passes the body it opened from (`this.source`) and `SidebarBlockHost.replaceSource` refuses when `extractBody(content, info)` differs (the same `lost` path: dropped-write Notice, never rate limited for a form, form stays open). A small `BlockWriteOptions` field (e.g. `expectBody`) or a sidebar `getPin()` returning `{ body }` both fit. Add an e2e twin of RV-F01 (refused, outside edit kept) and RV-F02 (lands).

### MED-2 — Undo after an outside edit to the block is lost silently and the card shows values that are not in the note (follow-up (ii))

- Where: `src/elements/stamina-bar/view.ts:225-235` and `:245-262` (`const model = this.model` captured in the undo closure), the same shape in `src/elements/hero/view.ts:456-465` and `:483-500`. After `refreshFromOutside` replaced `this.model`, the Undo mutates the OLD model, redraws the bar from it (`updateBarDisplay(model)`), and `persist()` serializes the NEW model (no change).
- Scenario (RV-U02, real Obsidian): pinned bar 12/30, 3 of 6 Recoveries; Catch breath (note 22/30, 2 Recoveries); an outside edit sets `temp_stamina: 4`; press Undo on the toast. Note stays 22/30 +4, 2 Recoveries (the Undo never reached it), no Notice, and the card shows "12/30" with no temporary Stamina. Same on base and head.
- Reading view, same sequence (RV-U04): the Undo is refused with the dropped-write Notice and the card shows 22/30 +4 (the truth).
- Outside edit elsewhere (RV-U01 sidebar, RV-U03 Reading view): the Undo works (12/30, 3 Recoveries) on both.
- Fix: in both undo closures, refuse when the model was replaced: `if (this.model !== model) { notifyDroppedWrite(...); return; }` before mutating, so nothing is redrawn from a dead model. Or close the live undo toast in `ElementView.refreshFromOutside` when the block changed. Either matches Reading view (the Undo cannot lie). Add a jest test next to PS11/PS12.
- Owner: match Reading view's RV-U04 outcome exactly (refused, the dropped-write Notice, card shows the note's values). Make sure the Reading-view path is not changed by your fix (re-run its existing undo tests).

### LOW-1 — focus after a Conditions window closed by an outside edit goes to the card, not to "+ add condition"

- Where: `src/elements/conditions/panel.ts:50-63` (the add button is built with no `control` id), so `captureControlFocus` (`src/framework/kit/controlFocus.ts:82`) records `family: null` and `restoreControlFocus` falls back to the card root (`tabindex -1`).
- Scenario (RV-C01, RV-C03, keyboard open): head hands focus to `div.dse-cond-panel.dse-chrome-anchor` in the sidebar (base: `<body>`). Scott's Option 1 says focus goes to "the same control ... the one you opened the window from". The stamina bar does it right (RV-S02: `stamina.bar`). OE04 only asserts "in the sidebar, not body", so it does not see this. Hero conditions take the same path.
- Fix: give the strip's add button a control id (e.g. `control: 'cond.strip.add'`), with its manifest row and census entry, and tighten SIDE-OE04 to `focusedControl() === 'cond.strip.add'`.
- Owner: a new control id means a new manifest pair; the coverage gate must stay `Y/Y` (report the new Y). Check the jsdom census and `_census.e2e.ts`. Hero conditions too.

### LOW-2 — a refresh in flight when the block is deleted re-adopts the old body, so the panel can stay on "Backing block not found" (new with the skip)

- Where: `src/framework/sidebar/SidebarPanel.ts:333-337` (`host.adoptViewBody(body)` after `await view.settlePendingWrite()`), with `handleAnchorLost` (`:392`) running outside the queue.
- Scenario (RJ08, jest): an outside edit to the block starts a refresh that waits on the view's save; the block is deleted meanwhile (panel degrades at once, `adoptViewBody(null)`); the refresh resumes and adopts the CHANGED body into a host whose view is gone; the user undoes the delete, restoring exactly that body: skipped, the panel stays on the degrade card. Base recovers.
- Fix: after the awaits, bail out when the view is no longer the mounted one: `if (host.lastMountedChild !== view || this.panelEl?.hasAttribute('data-dse-sidebar-unavailable')) return;` before `adoptViewBody` (or a generation counter bumped by `handleAnchorLost`). RJ08 is a ready test.

### LOW-3 — the remount branch's close-without-saving is untested by the branch

- Where: `src/framework/sidebar/SidebarPanel.ts:348-364`. Mutants N1 (no close in the remount branch) and N12 (no Notice there) survive every branch test; only the reviewer's RJ03/RJ04 kill them.
- Fix: add RJ03 (conditions) and RJ04 (stamina) as PS22/PS23.

### LOW-4 — `queueExternalChange` swallows every error silently

- Where: `src/framework/sidebar/SidebarPanel.ts:371` (`.catch(() => undefined)`).
- Fix: `.catch((e: unknown) => console.error('Draw Steel Elements: sidebar refresh failed', e))`.

### INFO-1 — mutant N5 survives

- N5 (`adoptViewBody` keeps the echo record, `SidebarBlockHost.ts:268`) survives every test. Without that line, an outside edit back to the view's last written text (an editor undo) is swallowed as an echo, the card stays stale and the guard then refuses every press. Add a jest case that kills N5.

### OOS-1 (ruled FOLD) — pinned ds-conditions drops `_dse_anchor` on its first own save

- A pinned `ds-conditions` loses its `_dse_anchor` on its first own save (Done), so the panel degrades to "Backing block not found" right after the save, and the window re-opened from it closes. RV-O02B / RV-O02C, base and head; the note after the write has no `_dse_anchor` line (bundles `.../sc662-r2-R1/bundles/head-RV-O02C`, `bundles/base-RV-O02C`). SIDE-OE05 passes because it never looks at the panel after Done. The conditions model/serializer needs the `_dse_anchor` passthrough the file header of `SidebarBlockHost.ts` says every persisted element has.
- Owner: fix confined to the conditions element (model / serialize) and `SidebarBlockHost.ts`. If it needs `pipeline.ts`, `src/framework/chrome/collapsedKey.ts` or `src/framework/prefOverrides.ts` (parallel SC-652's files) → stop, `STATUS: NEEDS_CONTEXT`. Extend SIDE-OE05: after Done the panel is still live (not the degrade card) and `_dse_anchor` is in the note. Check whether any other persisted element drops `_dse_anchor` the same way (a jest sweep over the persisted elements is ideal); fix it if it's the same one-line passthrough in that element, otherwise list it.

## Out of scope (ruled; do not touch)

INFO-2..7 (dropped), OOS-2 (unterminated fence at EOF cannot be pinned; dropped), OOS-3 (`prefs:` map deletion; belongs to SC-652). SC-663, SC-666, SC-667, SC-656, SC-384.

## Gates, report, return

Mutants for each new guard (MED-1 strict form write, MED-2 undo refusal, LOW-2 bail-out, OOS-1 passthrough) with a named test going red; literal times in tests. Full battery at your final head (expected: tsc/lint clean; jest 13468/2 fresh or 13469/1 with the shots cache, plus your new tests; lifecycle 64/64 — G-S61 is the known SC-668 flake, red on clean base on this host: re-run part 4 once and report `uptime` next to it; e2e `630/639 ok, 0 failed, 9 known-bug` plus new tests, coverage `Y/Y` with Y = 417 + any new pair; shots 592, 163/978, 40/240, clip 147; freeze 280/280; parity 0/0/24 last).

Report → `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc662-sidebar-pending-saves/sc662-r3-fix-report.md`, opening with a ≤10-line executive summary (sha, commits, battery, mutants, red-on-base for the new tests). Keep the "Shared-file hunks (for SC-656)" section current for any new `windowHandoff.ts` / `src/framework/sidebar/*` hunk. Final text to me: raw facts plus absolute paths of every artifact.
