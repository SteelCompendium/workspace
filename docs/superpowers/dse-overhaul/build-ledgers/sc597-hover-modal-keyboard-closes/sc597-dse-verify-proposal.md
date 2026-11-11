# SC-597: proposed dse-verify SKILL.md edits (for the dispatcher; nobody on this ticket edits SKILL.md)

File: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Revised at r4 (r3 review LOW-2 folded in, CURRENT block rebuilt on `79da77f8`). Six edits; line numbers are those of the main checkout at r4 (`workspace` at `02426934`), find the text, not the number.

## 1. "Hover preview modals (SC-595)": replace G-S83 authoring footgun (7)

Current text (one sentence inside the bullet "G-S83 authoring footguns (measured)", line ~402):

> (7) Open modals with a real mouse click: a modal opened from a preview by keyboard alone closes about 300 ms later (SC-597).

Replace with:

> (7) A keyboard opener on a non-`<button>` element (Enter / Space on the stamina bar, Enter / Space on a montage board cell) activates with `el.click()` on the element the mouse clicks, never by calling the opener directly (SC-597): Obsidian marks a preview focused, and so stops its hover timer closing it, only when a `click` goes through the preview, so a direct call closed the preview, and the modal with it, about 300 ms after the key (the popover's `hide()` came from the hover timer, `setTimeout(() => shouldShow() ? transition() : hide(), waitTime)`, with no event). A new opener of this kind needs the same `el.click()` and a jest test like the SC-597 suites (`stamina-bar.test.ts`, `montage.test.ts`: one click reaches the popover's container with the opener as target, the modal is open synchronously, the modal's scope is above the popover's 20 ms after the key, and Escape then closes only the modal). A real `<button>` needs nothing: Enter / Space send it a native click. G-S87 drives the keyboard path with a real Ctrl-hover and CDP keys (below).

## 2. "Hover preview modals (SC-595)": add a new authoring footgun after (10)

> (11) (SC-597, measured) A CDP `Input.dispatchKeyEvent` `keyDown` with no `text` does NOT activate a real `<button>` (no keypress is generated, so no native click): a trial whose opener is a real button must send `text: '\r'` (Enter) with the `keyDown`. It is harmless for the `div` openers with a keydown handler (G-S87's stamina bar and montage cell). A keyboard probe whose "form never opened" on a real button is this, not the product. The opener is focused with a script `.focus()` (inert for hit-testing, measured in SC-595 r1), the pointer rests on the card inside the preview before the key is sent, and the assertions run at 1.5 s, past the hover timer's ~300 ms hide.

## 3. Lifecycle scenario count and part-5 list (the battery table row 4, and every other "55" / part-5 mention)

- `OBSIDIAN-LIFECYCLE done: 55/55 ok, 0 failed` becomes `56/56` ("since SC-597; 55 since SC-595").
- Part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` (5) becomes `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87` (6; 347-351 s at SC-597 r2 / r4, loadavg 1-7; SC-597 added G-S87 after G-S83 and before G-S56 in SCENARIOS order; G-S87 alone about 48 s with the build and the Obsidian start-up). G-S56 stays last in the fourth part.
- Add to the scenario list sentence: `SC-597 G-S87 — a modal opened from a hover preview by the keyboard stays open: stamina Enter (Reading view and Live Preview), stamina Space, montage Enter; at 1.5 s the preview and the modal are open, a real click on the title keeps both, Healing 3 + a real click on Apply writes current_stamina: 18 with no Notice, Escape (also 450 ms after a reopen by the same key) closes only the modal, the preview stays with the pointer away and a real click outside closes it. Red on the 94133a5a bundle (all four trials fail at the 1.5 s step: preview and modal both gone), green on the fixed bundle. It does not assert a single modal or the 10 ms re-push order (those are jest: K4 and K6).`
- G-S87 fixtures: `Lifecycle/gs83-stam.md` / `gs83-stam-host.md` (shared with G-S83) and `Lifecycle/gs87-mont.md` (a `ds-montage`, `rounds: 3`, one participant Kira, `current_round: 2`; the opener is the first `.dse-mt__cell[role="button"][tabindex="0"]`, the round-1 past empty cell) with `gs87-mont-host.md`.

## 4. SC-584 / G-S64 list "Pre-existing and out of SC-584" (line ~393-394): the SC-597 item goes stale

Current: `... SC-594 (card writes in hover previews), SC-597 (a modal opened from a preview by keyboard alone closes by itself about 300 ms later), SC-596 (...)`.

Replace the SC-597 item with `SC-597 (fixed: the keyboard opener now clicks)`, or drop it.

## 5. "Hover preview modals (SC-595)", the "jest." bullet (line ~401): add the SC-597 suites

After "32 SC-595 tests." add: `SC-597: 22 tests (10 in stamina-bar.test.ts, 12 in montage.test.ts): Enter / Space send one bubbling click to the opener inside the preview, the modal is open synchronously, the modal's scope is above the popover's 20 ms after the key (K6 dies here; a check made only at 200 ms would miss it, because the 150 ms re-push masks it), a control outside a preview, and the keydown guards (Ctrl / Meta / Alt, a held key, an already-handled key, a key from a child). The popover stand-in is a click listener on the .hover-popover container that arms a literal 10 ms push. 23 mutants of the openers, the guards and managedModal.ts are all killed in jest.`

## 6. "Current expected numbers": a CURRENT block draft

The block that is CURRENT in the main checkout today is the SC-592 one (`**CURRENT — dse develop @ 79da77f8 ...`, line ~1397). Demote it: change its leading word `CURRENT` to `PREVIOUS` and its heading to `**PREVIOUS — dse develop @ 79da77f8 ...` (the SC-593 block below it is already PREVIOUS). Insert this as the new CURRENT above it:

**CURRENT — dse `develop` @ `<landing sha>` (2026-11-11; SC-597 landed on `79da77f8`; Enter or Space on the stamina bar, or on a montage board cell, now activates it with a click (`bar.click()` / `cell.click()`), so the Stamina window / Montage log sheet opened from a hover preview by the keyboard stays open exactly like a mouse-opened one (before, the popover's hover timer hid the preview and the modal about 300 ms after the key); the montage cell's keydown also got the stamina bar's guards (target is the cell, no Ctrl/Meta/Alt, no held key, not default-prevented; the only user-visible one is Ctrl/Cmd/Alt+Enter no longer opening the sheet); a comment-only reword in `managedModal.ts`; new lifecycle scenario G-S87 (56 scenarios, part 5 `G-S59 G-S49 G-S73 G-S77 G-S83 G-S87`); no CSS change; the user-facing CHANGELOG bullet is under `## Unreleased`):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7283 passed / 2 skipped / 262 of 263 suites** in a fresh worktree (+22 over SC-592's 7261 fresh: 10 in `stamina-bar.test.ts`, 12 in `montage.test.ts`) · lifecycle **56/56** (five `--only` parts 21 + 16 + 9 + 4 + 6; wall 184 s / 327 s / 417 s / 301 s / 347 s, loadavg 1-9; G-S87 alone about 48 s with the build and the Obsidian start-up; red on the `94133a5a` bundle (plugin source identical at `79da77f8`): all four trials fail at the 1.5 s step (preview and modal both gone), green on the fixed bundle) · e2e **`OBSIDIAN-E2E done: 264/269 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (125 s) · `styles.css` sha256 `5e5ff488…` byte-identical to a clean `79da77f8` build, so shots **592** / host-leak 163/978 / modal host-leak 39/234 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry. Mutants: 23 of 23 killed in jest (K1-K5 per opener, K6 in `managedModal.ts`, each keydown guard per opener); an independent review (r3) measured the same in real Obsidian (the helper arms 10 ms for `el.click()`, Escape 116 ms after the key closes only the modal). Numbers as measured by the SC-597 r4 implementer on the branch rebased onto `79da77f8` (range-diff 4/4 `=`); the dispatcher relayed, not re-ran.
