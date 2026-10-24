# SC-501 — proposed dse-verify SKILL.md edits (for the dispatcher to apply at landing)

Summary: replace the "113 kinds / 678 … 20-record boundary … unexplained, SC-501 tracks confirming them"
sentence in the "Button host-leak sweep" bullet with the explained 12-record boundary, note the
Modifiers click and the per-kind boundary listing, and add a CURRENT entry. LANDED_SHA = the dse
sha the dispatcher lands (branch head `054c9c5` on `efc17de`).

## Edit 1 — "Button host-leak sweep" bullet (~line 206)

Replace:

```
CURRENT)**; **113 kinds / 678 comparisons with a 20-record boundary as of `d152ea4`** (10
  focus-visible disabled, 6 hover zero-sized, 2 hover no hit point, 2 focus-visible no box; measured 2026-10-23
  by SC-497, identical on base `d152ea4` under 1.14.4, so it predates SC-497 — the 10 new records are
  unexplained, SC-501 tracks confirming them). Earlier: a printed **10-record** exemption boundary (8 focus-visible
```

with:

```
CURRENT)**; **113 kinds / 678 comparisons with a 12-record boundary as of SC-501 (`LANDED_SHA`)**:
  10× focus-visible `disabled` (montage, negotiation, party stepper, roll stepper and roll Reset
  disabled kinds, ×2 schemes) and 2× hover no hit point (`initiative|dse-btn.dse-init__stamina`,
  ×2). Since SC-501 the printed boundary lists the kind keys under each reason (modal keys carry their scenario, e.g. `@StaminaEditModal`), so compare kinds,
  not just counts. **SC-279's roll strip starts its "Modifiers" disclosure collapsed
  (`rollBar.ts:112`)**, which hid its steppers and Reset (0×0) and grew the boundary to 20 records
  (6 hover zero-sized + 2 focus-visible no box were hidden buttons, not legitimate skips; SC-497
  first measured it on `d152ea4`). SC-501 makes the button, input and checkbox sweeps open that
  disclosure with a real click on every dark/light load and FAIL if any roll panel stays hidden; the input and checkbox sweeps also FAIL on any tagged node with no box (they used to compare it at 0×0 and print OK).
  A new collapsed-by-default disclosure in the gallery will show up the same way — as "zero-sized"
  / "no box" records naming its kinds — and wants the same treatment, never a wider boundary.
  Earlier: a printed **10-record** exemption boundary (8 focus-visible
```

## Edit 2 — new CURRENT entry (demote the current CURRENT to PREVIOUS as usual)

```
**CURRENT — dse `develop` @ `LANDED_SHA` (2026-10-23; SC-501 landed — the shots host-leak sweeps open the roll strip's collapsed Modifiers disclosure before checking, so its steppers and Reset are compared instead of skipped; the gallery boundary prints the kinds under each reason; harness-only, no pixel or frozen-byte change):**
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6003 passed / 1 skipped / 242 of 243 suites** · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done: 114/114 ok,
0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (113 … 678 …)` (12-record boundary, kinds listed), `modal button host-leak OK (10 … 9 … 38 … 228 …)` (6-record boundary, listed ×2 each @MinionStaminaPoolModal, @MontageAddHeroModal, @StaminaEditModal), input `164` and checkbox `60` comparisons, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0
undeclared / 24 DECLARED**. Numbers as reported by the SC-501 ticket-owner at `LANDED_SHA`; the dispatcher relayed, not re-ran.
```

(Numbers above are the r2 implementer's; owner updates this file if the review or a fix round changes them.)
