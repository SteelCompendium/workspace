# SC-465 r1 review report (reviewer B, agent afed6150f9bda8c13)

## Executive summary
- Verdict: **APPROVE**. 0 CRITICAL / 0 HIGH / 0 MEDIUM / 2 LOW / 5 INFO. None of the findings blocks landing.
- Reviewed: dse `7f83724` (adb0684 + 7f83724 on e4c5cf6); superproject `7671c43` (CHANGELOG only, on 6bf71ca). At the end the dse tree is clean and HEAD is `7f83724`. The superproject shows ` M draw-steel-elements`, which was already there (the uncommitted pointer that wt-finish owns).
- Gates I measured on head: tsc + `tsc -p e2e` rc 0 · lint rc 0 · jest `Tests: 1 skipped, 5717 passed` / `Suites: 1 skipped, 238 passed, 238 of 239` · `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` · `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs` (`coverage driven: 70`). I skipped shots, freeze and parity because the diff touches no CSS, no rendered DOM shape and no harness: it only adds `focus()` calls.
- Discrimination: with the fix reverted, jest has 2 red (the 2 behaviour tests) and e2e has Q14/Q15/Q16 plus 5 probes red. Each of the two call sites is pinned on its own, and the ring flag is pinned both ways by e2e.
- Real-Obsidian probes: 13 throwaway probes, all green on head. They cover Space, Shift+Tab, Cancel/Escape/X, a heal that does not reach max, running out of Recoveries, a mouse Confirm, and the initiative host.
- Owner questions: (1) `coverage driven: 70` against 69/69 is the pseudo-control `(page) press:Backspace`, which the gate leaves out on purpose. It was already there before this change. (2) A's FreeHealConfirmModal follow-up is confirmed harmless: base and head move focus identically, with no page errors.

## Findings

### LOW-1: the CHANGELOG bullet is narrower than the fix
`CHANGELOG.md:11-15` (superproject 7671c43). The bullet only describes the "heal to full" case. The same fix also covers a pool hero spending their **last Recovery** below max: the button disables because none are left, and focus used to drop to `<body>`. Probe B07 shows this: −8 → three keyboard Spends → 22/30 with 0 left. On base focus is null/body; on head it is `sedit.reset`. The bullet is still accurate, just incomplete.
Fix (optional): add a short clause, e.g. "…could heal you to full (or use your last Recovery) and turn the button off…".

### LOW-2: a test variable is misnamed
`test/dom/views/stamina-edit-modal.test.ts:1449`: `const kill = btn(content, 'Full Heal');`. The variable holds Full Heal, not Kill. The test is correct; only the name is misleading.
Fix: rename it to `fullHeal`.

### INFO-1: the helper's selector can pick a disabled control with an explicit tabindex
`src/views/StaminaEditModal.ts:244-258`. The `[tabindex]:not([tabindex="-1"])` part of `TAB_STOPS` matches a *disabled* `button[tabindex="0"]`, and the filter does not check `.disabled` or `display:none`. `focus()` on such an element does nothing, so focus would stay on the disabled heal button and then drop to body. This cannot happen in this modal today: the census (probe B12) found no element with a `tabindex` attribute, and the selector is a copy of `managedModal.FOCUSABLE`.
Fix: if the helper is generalised (e.g. for SC-495), add `!(el as HTMLButtonElement).disabled` to the filter, and consider importing `FOCUSABLE` instead of copying it.

### INFO-2: mixed input, keyboard press then mouse Confirm, shows the ring
`src/views/StaminaEditModal.ts:631`. The ring flag is taken when the heal button is pressed, so a keyboard press followed by a **mouse** Confirm shows the ring on Reset (probe B13: `ring:true`). Defensible, since the action was started from the keyboard, and the ledger does not rule on it. No fix needed unless the owner wants the Confirm's input method to decide.

### INFO-3: ring state is pinned only by e2e
The jsdom tests cannot see the ring. I mutated `focusVisible` to always true (Q16 and B08 went red) and to always false (Q14, Q15, B01 and B09 went red), so the real-Obsidian tests do pin it.

### INFO-4: the hero-sheet host was not probed
`src/elements/hero/view.ts:380`. There is no `ds-hero` e2e fixture. That host runs the same `refresh()` path, and with `spendRecovery:false` there is no heal button, so the code does nothing. Bar, no-pool and initiative were all probed.

### INFO-5: one jsdom test leaves DOM behind
`test/dom/views/stamina-edit-modal.test.ts:1457`. The `focusNeighbourStop` unit test leaves its `root` div (#from/#off/#skip) in `document.body`. It is the file's last test, so nothing is affected today.
Fix (optional): `root.remove()` at the end.

## Owner question 1: `coverage driven: 70` against `coverage: 69/69 pairs`
`coverage.json` (`b-coverage-head.json`) lists 70 pairs. The extra one is `{control:"(page)", kind:"press:Backspace", tests:["STAM-D07","STAM-S05"]}`. It comes from `dse.press('Backspace')` with no target (`e2e/driver/dse.ts:409` labels such a press `(page)`). The gate skips it on purpose: `e2e/run.mjs:437` has `driven.filter((d) => d.control !== '(page)' && …)`, and that line has been there since the gate was added (SC-408, 02aadb5).

It was already there before this change. Both untargeted Backspace presses exist at e4c5cf6 (`stamina-modal.e2e.ts:55`, `stamina-modal-stepper.e2e.ts:53`), so base printed 67 against 66/66. No manifest pair is missing; the gap is outside manifest scope by design.

## Owner question 2: A's FreeHealConfirmModal follow-up (Stamina modal closed under the confirmation)
Confirmed: harmless, and behaviour is unchanged from base. Probes B10 and B11 record every `focusin` while the confirmation is open and the Stamina modal is closed from under it:
- **B10, leaf detached.** Head and base both give focusins `["sedit.spend-recovery"]`, then end on `<body>` (the leaf is gone) with 0 modals left.
- **B11, navigating to another note.** Head and base both give `["sedit.spend-recovery","sedit.spend-recovery","DIV.markdown-preview-view…"×2]`, ending on the new note's preview, with 0 modals.
- **No page errors.** The after-each invariant fails a test on any page error or console.error, and both probes passed.

The confirmation closes first, so the heal button is still connected when it gets focus. The Stamina modal then closes and focus moves on. In this path the new code always takes the `else healEl.focus()` branch, because no Confirm happened and the button is enabled. That is exactly the old behaviour.

## Probe results (real Obsidian 1.14.4, Chrome 150, head build)
Spec: `b-probe-spec.e2e.ts.txt`. It was a throwaway in `e2e/specs/stamina-bar/`, deleted after the runs. Logs: `b-e2e-probe1.log`, `b-e2e-probe2.log`.

| Probe | Scenario | Result on head |
|---|---|---|
| B01 | pool, **Space** heal to max | Reset, `:focus-visible` true, outline `solid 2px rgb(77,184,199)`; Shift+Tab → `sedit.full-heal` (in modal) |
| B02 | no-pool, Space heal + Space Confirm to max | Reset, ring true; Shift+Tab → full-heal |
| B03 | no-pool keyboard heal, keyboard **Cancel** | back on enabled `sedit.spend-recovery`, ring true |
| B04 | … **Escape** | back on spend-recovery |
| B05 | … **X** click | back on spend-recovery |
| B06 | pool keyboard heal **not** reaching max (12→22) | stays on enabled spend-recovery |
| B07 | pool keyboard heals until Recoveries run out at 22/30 | Reset |
| B08 | no-pool **mouse** heal + mouse Confirm to max | Reset, ring false, outline none |
| B09 | **initiative** hero (no pool), keyboard heal + Confirm | Reset, ring true |
| B10/B11 | Stamina modal closed from under the confirmation | see owner question 2 |
| B12 | tab-stop census | apply-amount, damage, healing, stamina.dec/input/inc, temp.input/inc, kill, full-heal, spend-recovery, reset; no `tabindex` attrs; the close button is not a stop |
| B13 | keyboard press + mouse Confirm | Reset, ring true (INFO-2) |

scrollY stayed 0 throughout. Q14 and Q15 already cover Enter, plus Tab → `sedit.apply`.

## Discrimination
Mutations were made with `b-mutate.py` on `src/views/StaminaEditModal.ts` and restored with `git checkout --` that exact file after each run. jest ran only the SC-465 describe block; e2e ran with `--only`.

| Variant | jest SC-465 (6) | e2e |
|---|---|---|
| nofix (both call sites reverted to base, helper kept) | 2 red (#1 pool, #2 no-pool) | Q14, Q15, Q16, B01, B02, B07, B08, B09 red (focus null = body); B10/B11 ok |
| norefresh (only the `refresh()` call site removed) | 1 red (#1) | Q14, Q16, B07 red; Q15, B08, B09 ok |
| nodismiss (only the dismiss call site reverted) | 1 red (#2) | Q15, B08, B09 red; Q14, Q16, B07 ok |
| ringtrue (`focusVisible: true`) | 6 ok | Q16, B08 red |
| ringfalse (`focusVisible: false`) | 6 ok | Q14, Q15, B01, B09 red |
| noprev (no fallback to the previous stop) | 1 red (#6 helper unit) | Q14 ok |

## Survey check
I agree with A: the heal button is the only modal-local control in `StaminaEditModal.ts` that disables itself when pressed.
- Kill, Full Heal, Damage, Healing and Reset never disable.
- Apply disables only from `updateActionButton`, and pressing Apply closes the modal.
- When Full Heal disables the heal button, focus is on Full Heal; jest #5 pins that focus is left alone.
- The temp "−", Stamina "±" and the stepper inputs are kit stepper controls, which are SC-495 and out of scope.

## Note-write and CHANGELOG check
- **Focus only.** The diff adds only focus reads and `focus()` calls: no change to pending state, Apply, `clampStamina` or `updateCallback`.
- **Write gates green.** The full e2e (fence and integrity invariants on every test) and lifecycle 31/31 both passed.
- **CHANGELOG.** The bullet is plain-language, correctly placed under `## Unreleased`, and accurate apart from LOW-1.
- **Commits.** Messages carry no attribution trailers.

## Evidence
Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc465-r1-review-afed6150f9bda8c13/`
- `b-tsc.log`, `b-tsc-e2e.log`, `b-lint.log`, `b-jest-full.log`, `b-lifecycle.log`, `b-e2e-full.log`, `b-coverage-head.json`
- `b-e2e-probe1.log`, `b-e2e-probe2.log`, `b-probe-spec.e2e.ts.txt`
- `b-disc-{nofix,norefresh,nodismiss,ringtrue,ringfalse,noprev}{.log,-jest.log,-e2e.log}`, `b-mutate.py`, `b-disc.sh`
