# SC-196 round 4 report — fix round (HIGH-1/HIGH-2/MEDIUM-1/MEDIUM-2/LOW-1/LOW-2)

## Executive summary

**Verdict: DONE.** dse `638c657` (superproject `d9d238c`). All six review findings on
r3 commit `068a2a6` fixed: HIGH-1/HIGH-2 — Obsidian's `setTooltip` only ever writes
`aria-label` (decompiled fact), so the selection ring's state now lives IN the
accessible name via `iconButton.setLabel` ("Select Goblin #1" / "Selected — Goblin
#1"); the dead `IconButtonHandle.setTooltip` is removed. MEDIUM-1 — roll-row labels
rebuilt with real separators ("Not rolled. ≤11: 3 + M damage", no more run-together
numbers). MEDIUM-2 — false screen-reader-exposure claims removed from comments (roll
rows AND the temp badge, both roleless elements; tooltip-only, as the ruling asked).
LOW-1/LOW-2 — every tooltip test now asserts the rendered `aria-label`, not a spy call.
Gates: tsc/lint clean; jest 3870 passed/1 skipped/202 of 203 suites/3 snapshots; shots
524 written/0 FAIL (host-copy pin OK, button host-leak OK); freeze `OK (260/260 …)`
exit 0; parity `0 gaps/0 undeclared/16 declared` exit 0; `lightContrast.test.ts` 25/25.
Mutation (setTooltip neutered): **10 of 182 red** — 6 from this round's own
surface-1/surface-2 tests (still route through `tooltip()`) + 4 pre-existing; the 2
surface-3 tests stay green **by design** (HIGH-1's fix routes surface 3 through
`setLabel`'s direct `aria-label` write, not `setTooltip`) — explained in full below.
Both changelog bullets added and committed. Evidence paths below.

## Findings addressed

### HIGH-1 — selected cell's tooltip never actually said "Selected"

Root cause (reviewer's decompile of both installed Obsidian builds): `setTooltip(e,t,n)`
does `e.setAttribute("aria-label",t)` and nothing else — no separate tooltip storage.
The hover renderer reads the tooltip text back off `aria-label` at hover time. Round 3's
`IconButtonHandle.setTooltip` wrote `aria-label = text` then immediately restored the
PREVIOUS `aria-label` (mirroring mount order) — a no-op in production.

Fix (owner's preferred option): `initiative/view.ts`'s grid cell now composes the state
into the accessible name itself — `"Select {creature} #{id}"` unselected,
`"Selected — {creature} #{id}"` selected — via `handle.setLabel(...)`, in the same
repaint loop that already flips `aria-pressed`/`[data-selected]`. `cellHandles` now
carries each cell's own base label (`{ handle, label }`) so the repaint loop can restore
every OTHER cell's own text, not a generic one. `aria-pressed` still carries the state
to AT independently.

### HIGH-2 — `IconButtonHandle.setTooltip` was a no-op for every kit button

`label` is required on every `iconButton`, so the "restore the current aria-label"
step always fired — the method changed no observable state, ever. **Removed** (the
prescribed "delete" option) — nothing calls it anymore after HIGH-1's fix; `setLabel`
IS the tooltip update now, documented on the interface with the decisive fact cited.

### MEDIUM-1 — roll-row label run-together ("≤113 + M damage") confirmed real

The badge span (`≤11`) and outcome span (`3 + M damage`) have no separator node, so
`rowEl.textContent` concatenated them. Rebuilt from the parts instead —
`rowEl.querySelector('.dse-pr__text')` for the outcome text only — joined as
`"<state>. <range>: <outcome>"`. Also: `tooltip()` is now called exactly ONCE per row
with the FINAL string (round 3 called it once with a shorter string immediately
overwritten by a second `aria-label` write — harmless there only because the second
write happened to still contain the state word, but the same double-write shape as
HIGH-1's bug).

### MEDIUM-2 — false AT-exposure claims in comments

Both real `setRollResult` call sites (`renderFeature.ts`, `roll/view.ts`) mount the
panel without `selectable`, so rows are roleless `<div>`s — `aria-label` on a
generic-role element is name-prohibited (ARIA 1.2) and reaches no screen reader.
Corrected the `setRollResult` JSDoc and the implementation comment to say so plainly.
**Also caught the identical false claim in `StaminaBarPanel.ts`'s comment** for the
`+N` temp badge (`.dse-stamina__ctemp` is likewise a roleless `<span>`) — not named in
the findings (the review scoped MEDIUM-2 to the roll rows and passed surface 2
outright), but it's the same inaccuracy in a file this round already touches, a
comment-only fix with no design choice and no gate-baseline risk — filed under
Drive-by fixes below rather than silently folded in. No role added anywhere (explicitly
out of scope per the ruling).

### LOW-1 / LOW-2 — tests must assert rendered state, guard with a mutation

Every tooltip-adjacent test rewritten to assert the final `aria-label` (the actual
production hover text), not `toHaveBeenCalledWith(...)` on a spy. Mutation run below.

## Mutation run — full explanation, not just the number

Ran the reviewer's method (their own scratch files weren't present in the shared dir,
so built an equivalent): a `jest.mutated.config.ts` + `obsidian-notooltip.ts` pair,
built temporarily inside the dse worktree under `.sc196-mutation-scratch/` (git-status
confirmed untracked before AND after — deleted before any commit, no repo file
touched), overriding the `^obsidian$` alias so `setTooltip` becomes a true no-op
(writes nothing — not even `aria-label`) while every other export (`setIcon`,
`Component`, `App`, `parseYaml`, `makeFakeContext`, …) stays the real jest mock. Ran
against the same four suites the review used.

**Result: 10 failed / 172 passed / 182 total.**

Failing (can-fail, i.e. correctly red):
- `iconButton › tooltip option routes through the kit tooltip() → Obsidian setTooltip …` (pre-existing)
- `staminaBarPanel › canPersist: false … applies the read-only tooltip …` (pre-existing)
- `staminaBarPanel › temp > 0 … gets an on-hover tooltip …` (this round, surface 2)
- `staminaBarPanel › updateStaminaBar clears the tooltip in place …` (this round, surface 2)
- `powerRollPanel › active row: rendered aria-label names the state …` (this round, surface 1)
- `powerRollPanel › active row without a total …` (this round, surface 1)
- `powerRollPanel › dimmed rows: rendered aria-label reads "Not rolled. …" …` (this round, surface 1)
- `powerRollPanel › clearing the result (null) removes the aria-label …` (this round, surface 1)
- `initiative › a11y: turn indicators … Toggle to mark turn taken …` (pre-existing)
- `initiative › squad fixture: condition icons … Remove condition: Grabbed …` (pre-existing)

**NOT red, and this is correct, not a gap:** the iconButton `"setLabel IS the hover
tooltip …"` test and the initiative `"instance-cell select: rendered aria-label flips
…"` test (surface 3, both new/rewritten this round). Neither calls `setTooltip` at all
anymore — HIGH-1's prescribed fix deliberately routes surface 3 through
`buttonEl.setAttribute('aria-label', …)` directly (via `setLabel`), bypassing the
broken indirection entirely. Neutering `setTooltip` therefore cannot touch them; they
exercise the real DOM `setAttribute` call, not an injectable/mockable seam a mutation
of `setTooltip` can reach. That makes them mutation-proof by construction rather than
"mutation-red under this specific probe" — a stronger guarantee, and the direct
consequence of fixing HIGH-1 the way the ruling prescribed. Reported plainly rather
than forcing an artificial dependency on `setTooltip` just to make this one probe
"pass" — happy to build a different mutation (e.g. neutering `Element.setAttribute`)
if the owner wants that guard demonstrated too.

Evidence: `.superpowers/sdd/sc196-light-contrast/sc196-r4-mutation.log`.

## Changelog bullets

1. `worktrees/sc196-light-contrast/draw-steel-elements/CHANGELOG.md` — new `[FIX]`
   bullet under `## 7.0.0 (unreleased…)`, placed first (most recent). Names every
   affected color in words (Scott is colorblind): Stamina healthy=green,
   winded=amber, dying=red, temp=purple; power-roll tiers incl. crit=gold; malice/
   victory points=gold; warnings=orange; selection ring=red. States the WCAG AA
   contrast rationale and the three hover-tooltip additions in plain language.
2. `worktrees/sc196-light-contrast/CHANGELOG.md` (the WORKTREE's copy — confirmed via
   `pwd`/`git status` before editing; never touched `/home/scott/code/steelCompendium/
   workspace/CHANGELOG.md`) — one bullet under `## Unreleased`, style
   `- **DSE plugin: … (SC-196).** …`, placed first (newest), same content condensed to
   the house style of neighboring entries.

## Commits

dse (`worktrees/sc196-light-contrast/draw-steel-elements`):
- `613801e` — `fix(a11y): SC-196 round 4 — tooltip text IS the accessible name in Obsidian` (code + tests)
- `638c657` — `docs: SC-196 changelog bullet — light-scheme state colors + hover tooltips`

Superproject (`worktrees/sc196-light-contrast`):
- `d9d238c` — `chore: bump draw-steel-elements to 638c657 (SC-196 round 4 fix + changelog)` (bumps the dse pointer + the workspace CHANGELOG.md bullet, one commit per the brief)

## Gates (dse-verify order, foreground, per-run logs prefixed `sc196-r4-`)

All re-verified against the FINAL committed tree (fresh tsc/lint/jest re-run after the
last source edit and after commit, to close the gap the coordinator flagged from the
rate-limit interruption — see "Timing note" below).

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **3870 passed / 1 skipped / 202 of 203 suites / 3 snapshots**, exit 0 — unchanged from r3 (net test-count delta is zero: every changed test file replaced 1-for-1 or added net-zero) |
| `npm run shots` | **524 `ok` lines, 0 real FAIL** (6 grep hits on "FAIL"/"failure" are the `montage-failed` fixture name and benign prose, same as r3). In-run: `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light …)`, `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)` |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0** |
| `npm run parity` (LAST) | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0** — same composition as r3 (FOLLOWUPS #51 ×6, #40 ×2, #39 ×8) |
| `lightContrast.test.ts` alone | **25 passed, 25 total**, exit 0 — unchanged, no CSS touched this round either |
| Mutation (setTooltip neutered) | **10 failed / 172 passed / 182 total** — see full breakdown above |

Logs:
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate1-tsc-final.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate2-lint-final.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate3-jest-final.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate4-shots.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate5-freeze.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-gate6-parity.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-lightcontrast-final.log`
- `.superpowers/sdd/sc196-light-contrast/sc196-r4-mutation.log`
- (superseded, kept for the record: `sc196-r4-tsc-1.log` (the pre-test-fix failure),
  `sc196-r4-tsc-2.log`, `sc196-r4-lint-1.log`, `sc196-r4-targeted-tests.log`,
  `sc196-r4-gate3-jest.log`, `sc196-r4-lightcontrast.log` — all superseded by the
  `-final`/committed-tree runs above, which are the ones to trust)

### Timing note (the session-rate-limit interruption)

Session was terminated mid-parity-gate; on resume, verified: (1) the r4 code/test
edits' file mtimes (last: `StaminaBarPanel.ts` 22:35:27) all predate the saved
`sc196-r4-gate6-parity.log` (written 22:46:55, complete — `0 gap(s), 0 undeclared …,
16 declared…`, "Plugin sampled" timestamp present) — so that parity result is valid
for the code as committed, no re-run needed for parity specifically. Then, per the
coordinator's instruction, re-ran tsc/lint/jest FRESH against the fully committed tree
(the `-final` logs above) rather than trusting the pre-interruption tsc-2/lint-1/gate3
logs, which had in fact been captured one edit (the StaminaBarPanel.ts MEDIUM-2
drive-by comment fix) before the true final state — comment-only, so no result changed,
but the `-final` logs are the authoritative ones now.

## Evidence — the three surfaces, every state (refreshed for round 4)

`.superpowers/sdd/sc196-light-contrast/sc196-r4-dom-evidence.log` (scratch jest file,
deleted after the run, same convention as r3). Full output:

```
[EVIDENCE r4 surface1] tier=low  data-dse-roll-result=dimmed aria-label="Not rolled. ≤11: 3 + M damage"
[EVIDENCE r4 surface1] tier=mid  data-dse-roll-result=active aria-label="Rolled result — 14. 12-16: 6 + M damage"
[EVIDENCE r4 surface1] tier=high data-dse-roll-result=dimmed aria-label="Not rolled. 17+: 9 + M damage"
[EVIDENCE r4 surface1] tier=crit data-dse-roll-result=dimmed aria-label="Not rolled. crit: extra main action"
[EVIDENCE r4 surface1] CLEARED mid aria-label=null

[EVIDENCE r4 surface2] temp=4 (on)  text="+4" aria-label="Temporary Stamina: 4"
[EVIDENCE r4 surface2] temp=0 (off) text=""   aria-label=null

[EVIDENCE r4 surface3] UNSELECTED      aria-pressed=false aria-label="Select Goblin #1"
[EVIDENCE r4 surface3] SELECTED        aria-pressed=true  aria-label="Selected — Goblin #1"
[EVIDENCE r4 surface3] RESELECTED-OFF  aria-pressed=false aria-label="Select Goblin #1"
```

## Drive-by fixes

- `src/framework/kit/StaminaBarPanel.ts` — corrected the `+N` temp-badge comment's
  false "and to screen readers" claim (the same MEDIUM-2 inaccuracy, on the same kind
  of roleless element, in a file this round already touches; comment-only, no gate
  moved).

## Follow-ups

- **The pre-existing mount-time `IconButtonOptions.tooltip` field has the SAME physics
  bug** (`iconButton.ts`'s mount code writes `opts.tooltip` first, then `aria-label =
  opts.label` last — identical ordering to the now-removed `setTooltip` handle
  method). Any OTHER existing caller passing a `tooltip` that differs from `label`
  (e.g. `conditionIcons.ts`'s "Remove condition: Grabbed" label / "Grabbed" tooltip,
  asserted as correct by a pre-existing test) is **also** silently non-functional in
  production for the same reason HIGH-1 was — the tooltip text is overwritten by the
  label at mount, and the pre-existing test only checks the spy was called, not the
  rendered end state (LOW-2's exact pattern, just older). Out of scope for this round
  (not named in the findings, not one of SC-196's three surfaces, and fixing every
  such call site is a wording/design decision across files this round doesn't touch)
  — reported for the owner to decide whether it merits its own ticket.
- Superproject worktree submodule drift (`data-gen`, `data-sdk-npm`, `steel-etl`,
  `steelCompendium.github.io`, `v2` show modified) — unchanged from r3, still
  pre-existing and out of scope, still untouched.

## Return contract

STATUS: DONE.
- dse sha: `638c657` (worktree `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast/draw-steel-elements`)
- superproject sha: `d9d238c` (worktree `/home/scott/code/steelCompendium/worktrees/sc196-light-contrast`)
- Gates: tsc clean · lint clean · jest 3870/1skip/202-of-203suites/3snap ·
  shots 524/0 FAIL · freeze 260/260 · parity 0/0/16 · lightContrast 25/25 ·
  mutation 10/182 red (see explanation above for the 2 that stay green by design).
