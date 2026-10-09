# SC-379 slice 2 — argument tab chips, dossier cards, docs, changelog, freeze package (IMPLEMENTATION)

Same rules as slice 1 (`sc379-s1-impl-brief.md` §1, §3, §5, §6 apply unchanged — read them).
This brief adds slice 2's scope and the extra deliverables. Your final text goes to the
ticket-owner, not a human; never call the tracker; never spawn agents; never push.

## 1. Context

- Ledger `sc379-decisions.md` (Scott's rulings verbatim; owner rulings). Locked direction:
  *"A1 gauges, buttons in the tab"* — the appeal/mention chips stay INSIDE "Make an
  Argument"; the bottom Motivations/Pitfalls cards carry only "Mark spent"/"✓ Spent".
- Spec `sc379-impl-spec.md` §8 "Slice 2", plus §1 (argument tab + cards DOM), §4 fixes 2–5,
  §5 (`negotiation-appeal` interaction capture), §6 remaining tests, §7 docs.
- Slice-1 state: branch `sc379-negotiation`, plugin submodule, tip **`1d98148`** on base
  `origin/develop` `1ac4e5a`; the slice-1 review report `sc379-s1-review-report.md` and
  any fix-round report — read their executive summaries; slice 2 must not undo a slice-1
  fix. First action: `git -C <abs plugin path> fetch origin`; if `origin/develop` moved past
  `1ac4e5a`, rebase and say so in the report.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`. **Workspace-level
  files live in the worktree's superproject** —
  `/home/scott/code/steelCompendium/worktrees/sc379-negotiation/CHANGELOG.md` — never under
  `/home/scott/code/steelCompendium/workspace/`.

## 1b. FIRST: the slice-1 fix round (commit each as its own `fix(steel): SC-379 s1 review …` commit, before any slice-2 work)

From `sc379-s1-review-report.md` (read the full finding text there; quoted here as the
reviewer wrote it):

- **M1 — "in print, the rails run through every seal's numeral."** Cause: `.dse-track__mark`
  (`styles-source.css:14476`) has no background in the base tier; it only becomes opaque in
  the Steel tier (`:14575`). Fix: add `background-color: var(--dse-surface)` to the base
  `.dse-track__mark` (the token the root plate uses, `:2504`). This changes print bytes of
  the 6 negotiation lines (fine — they are the sanctioned set) and must not reach any other
  element's print.
- **M2 — "the touch target on the Patience seals shrank, and the retargeted D-2 tests no
  longer check it."** Before, the bubbles read `--dse-control-min` (44px under
  `pointer: coarse`, `:11294-11300`); the new horizontal slot (`:14469`) is fixed at 1.9em
  (~30px) / 1.6em at ≤420px (`:2674`). Owner ruling: **fix** — give the slot a hit box
  driven by `--dse-control-min` with the mark centred inside (visual size unchanged), and
  re-pin the three D-2 tests in `test/dom/theme/controlDensity.test.ts:217-230` to measure
  that hit size/density (they must fail if the hit box shrinks to 10px).
- **L1 — quoted YAML numbers.** `clampStanding` and Complete don't convert to numbers first:
  `current_interest: "3"` + 1 → `"31"` → clamps to 5; `current_patience: "2"` − 1 is written
  as `.nan`. Fix: `Number(...)` before the arithmetic and keep the clamp's result finite
  (non-finite → the unclamped current value, never NaN). Add the quoted-number test.
- **L2 — vacuous clamp tests** at `test/dom/elements/negotiation.test.ts:957-978` (4+1=5 and
  1−1=0 pass with the clamp deleted). Rewrite them so each fails when the clamp is removed
  (e.g. 5+1 → 5, 0−1 → 0 via a reachable path, or test `clampStanding` directly with
  out-of-range inputs).

The INFO items are dropped by owner ruling — do not act on them.

## 2. Scope — spec §8 "Slice 2", exactly (plus M3)

- **M3 (reviewer finding, folded here):** "after a Complete Argument that leaves the
  negotiation live, the argument tab is out of date. The checkboxes stay ticked and the
  chosen tier stays checked, while the model's current argument has already been reset
  (`ArgumentView.ts:308-331`; `setEnded` does nothing when the ended state doesn't change,
  `:72-73`). SC-340's view adoption keeps the view across our own write, so the
  'echo-rebuild clears it' comment at `:10-14` no longer holds in real Obsidian." Fix it
  together with fix 2 (immediate recompute): after Complete, the tab's chips, modifiers and
  chosen tier reset from the model without relying on a rebuild; delete the stale comment;
  add a test that Completes and asserts the tab's state matches the model.

- Chips styled in the tab (`.dse-optchip` pressed-chip grammar: ◆/◇ motivation, orange
  warning-triangle pitfall, "SPENT" struck-through state) — fixes the 300px
  letter-by-letter wrap of "Higher Authority" (owner-folded follow-up).
- Modifiers with the "why" hints (fix 5); tooltip "Easy" → "Medium" (fix 4 — confirmed from
  the Heroes book by the owner); immediate recompute of the tier rows on chip/modifier
  change (fix 2); chosen tier row ringed + check + "CHOSEN" (fix 3); Complete's accent
  variant once a tier is chosen + its hint.
- `MotivationsPitfallsView` → the dossier cards with Spent chips only.
- `negotiation-appeal` INTERACTION_SHOTS capture.
- Remaining tests (§6).
- Docs: `docs/negotiation-tracker.md` per §7 (chips in the tab unchanged in meaning; "Mark
  spent" on the cards; the ended band; what deliberately does not change). `npm run
  docs-shots` for the negotiation images if the manifest covers them (it starts its own
  Xvfb). CHANGELOG `## Unreleased` bullet in the worktree superproject.
- **Freeze package** (division of labor, dse-verify "Freeze semantics"): workers never edit
  the baseline. Deliver `…/sc379-negotiation/rebaseline.txt` (the 6 moved lines, `<sha256>
  <filename>`, verified identical across 2 clean `npm run shots` runs) and
  `…/sc379-negotiation/widening.txt` (the new ids' print lines, additions-only; scripted
  collision check against the current baseline = 0 hits). Plus before/after crops of the 3
  moved print ids: `sc379-s2-freeze-<id>-{before,after}.png` ("before" from a clean sweep of
  the base).
- Out of scope: harness viewport (SC-349), montage/recoveries onto `track()` (SC-380),
  anything slice 1 settled.

## 3. Gates — full battery at the final commit (same shapes as slice 1)

Expected at base `1ac4e5a`: jest 4254/1, lifecycle 19/19, shots 544, freeze 262/262,
parity 0/0/24. After slice 1: jest 4292/1, shots 552, freeze exactly 6 mismatches (all
`negotiation*`), parity 0/0/24. After slice 2: jest ≥ 4292 + your tests, shots 552 + 4
(`negotiation-appeal`), freeze **still exactly those 6 mismatches** — the new ids are
additions and invisible to the check — parity unchanged. Logs → `sc379-s2-gate-<name>.log`.

Owner-eyes PNGs into the ledger dir: `sc379-s2-<default|appeal|ended>-<dark|light>[-narrow].png`
for the default state, the appeal interaction and the ended state, wide dark/light + 300px
dark; plus the docs images you regenerated (list their paths).

## 4. Report + return

`sc379-s2-impl-report.md` (≤10-line executive summary first). Return: STATUS, final sha +
base sha, each gate's measured line, the 6 moved names + the widening names, report path,
absolute path of every PNG/log/txt, `Drive-by fixes:`, `Follow-ups:`.
