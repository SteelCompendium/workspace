# SC-379 slice 1 — kit `track()` + standing region + ended band (IMPLEMENTATION)

You are the slice-1 implementer for SC-379. Your final text goes to the ticket-owner, not a
human. **You never call the tracker (Linear)** — not to read, not to post. You cannot spawn
agents. You may be replaced by a fresh worker later, so everything you learn goes in files.

## 1. Context loading (in order)

1. Ledger — Scott's rulings verbatim + the owner's rulings:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/sc379-decisions.md`.
   The locked direction is in the 2026-10-09 02:40 entry. The owner's four rulings on the
   spec's open questions are in the "Impl spec written" entry — they are final.
2. **The spec — your task definition:** `…/sc379-negotiation/sc379-impl-spec.md`. Read all
   of it. This brief only adds environment, gates and the return contract.
3. The design reports if a spec line is unclear: `sc379-r1-design-report.md`,
   `sc379-r2-design-report.md` (read the section you need, not the whole file).
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`. The plugin is
   the submodule `draw-steel-elements/` on branch `sc379-negotiation` @ `cd8cddc` (two
   mock-only commits on top of `9ded832`). **First action:**
   `git -C /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements fetch origin`
   then `git -C <same> rebase origin/develop` — `origin/develop` is **`8a256c5`** (SC-378,
   two small commits; the rebase should be clean). Then `npm ci` (node_modules exist from
   the design round, but `package.json` may have moved).
5. Required reading in the worktree: `draw-steel-elements/AGENTS.md`,
   `draw-steel-elements/.repo-docs/font-sizes.md` (never hardcode a font-size), the gate
   skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (sections "The battery, in order", "Devbox wrapping", "THE exit-code footgun", "In-run
   gates inside npm run shots", "Freeze semantics" — division of labor), and
   `docs/working-preferences.md` → "Scott is colorblind".
6. Never write under `/home/scott/code/steelCompendium/workspace/` except the ledger dir
   above (files prefixed `sc379-`). Workspace-level files (`CHANGELOG.md`, `DESIGN.md`) live
   in YOUR worktree's superproject `/home/scott/code/steelCompendium/worktrees/sc379-negotiation/…`
   — slice 1 does not touch them anyway.

## 2. The task — spec §8 "Slice 1", exactly

Build everything spec §8 lists under **Slice 1** (kit `track.ts` + export + tests;
`NegotiationData` methods; the 0–5 clamp; `PatienceInterestView` rewritten; head crest;
`view.ts` `refreshStanding` / `data-ended` / the band; Complete disabled with the over-hint
and the static roll when ended; CSS for root/head/patience/interest/track/band;
`fixture-ended.yaml` + its capture; the `negotiation-narrow` entry; updated and new tests).
Nothing from slice 2. Port from the mocks (spec "Visual reference"); never import mock files
into production code; the mock dir `visual-harness/sc379/` stays as is.

Rules that override anything the spec is vague on:
- Scott's words, from the ledger: *"A1 gauges, buttons in the tab"* and *"Go ahead and keep
  the negotiation band that you added"*. Slice 1 leaves the argument tab's chips where they
  are today (slice 2 restyles them).
- **No YAML shape change.** `example.yaml` parses and renders exactly as before.
- Sizes only via `--dse-fs-*` role tokens; colors only via `--dse-*` tokens (no rgba
  literals — the mocks have some; replace with tokens). The **Steel scoping rule**
  (`dse-verify` "Freeze semantics"): new rules must not reach any OTHER element's print.
- Hue is never the only channel for a state (filled vs hollow-dashed, ring, "NOW" tag).
- Every seal is a real `<button role="radio">` in a `role="radiogroup"` with roving
  `tabindex`; arrow keys move along the rail; selection persists through the existing
  `persist()` path (no new write paths).
- Commit after every coherent step (`git -C <abs path> …`), so nothing sits uncommitted
  through a gate. Commit messages: conventional, `feat(steel): SC-379 …` /
  `test(steel): SC-379 …`; **no AI/Claude attribution or co-author trailers.** No push.
- Out of scope — do NOT touch: the harness viewport (`shoot.mjs` 900×1200 — owner ruling 1,
  SC-349 owns it), montage / recoveries migration onto `track()` (SC-380), slice-2 items,
  `freeze-baseline.sha256` / `check-freeze.sh` (never edited by workers).

Extras: report **`Drive-by fixes:`** (made — obviously correct, local to a touched file,
no gate baseline moved) and **`Follow-ups:`** (left alone) separately.

## 3. Gates — `dse-verify`, full battery, in order, after the final commit

Run from the worktree's plugin dir via devbox, each gate the LAST thing in its `bash -c`
string, output redirected to a per-run file under the ledger dir (`sc379-s1-gate-<name>.log`):

| Gate | Expected at base `8a256c5` | Expected after slice 1 |
|---|---|---|
| `npm run tsc` | clean | clean |
| `npm run lint` | clean, exit 0 | clean, exit 0 |
| `rm -f main.js styles.css` then `npx jest` | 4219 passed / 1 skipped | ≥ 4219 + your new tests, 0 failed (timeout-shaped reds in `settings-tab`/`settings-preview` under load: check `/proc/loadavg`, re-run) |
| `DSE_LIFECYCLE_PORT=9291 npm run obsidian-lifecycle` | `19/19 ok, 0 failed`, exit 0 | same (exit 2 = environment, retry with another port) |
| `npm run shots` | 544 PNGs, 0 FAIL, `host-copy pin OK/PARTIAL`, `button host-leak OK` | 544 + your new ids × 4 schemes, 0 FAIL |
| `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements/visual-harness/shots` | `freeze OK (262/262 …)` | **exactly 6 mismatches**, all `negotiation*--steel-{print,realprint}.png` — any other name is a leak you must fix |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 24 DECLARED, exit 0 | unchanged |

Also produce, for the owner's eyes: `sc379-s1-<state>-<dark|light>[-narrow].png` copies of
the new `negotiation`, `negotiation-ended`, `negotiation-narrow` steel-dark/light shots
into the ledger dir, and the 3 moved print ids as before/after crops
(`sc379-s1-freeze-<id>-{before,after}.png`; "before" = the shot at `8a256c5`, e.g. from a
`git stash`/checkout of the base — label which).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/sc379-s1-impl-report.md`,
opening with a **≤10-line executive summary**: final sha, each gate's measured line, the 6
moved freeze names, new capture ids, test delta, and the two extras lists. Then the detail.
If the report-file write is blocked by your harness, return the report inline.

## 5. Footguns (each has cost real time here)

- Node/npm are not on PATH: every command is
  `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements && <cmd>'`
  run from `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`. Devbox's wrapper
  eats `$?`/`$PIPESTATUS`; never pipe a gate (`| tail`), never `; echo` after it — redirect
  to a file, read the tool's own summary line.
- Every git command is `git -C <absolute path> …`. Never `cd X; git …`.
- A stale built `main.js` shadows `main.ts` for jest: `rm -f main.js styles.css` before
  every `npx jest`.
- Run gates in the FOREGROUND with output redirected to a file; the 600 s stream watchdog
  kills silent agents, and a backgrounded job never wakes you — do not "wait for a
  notification".
- Never key a wait-loop on a scratch filename or its contents — the dir is shared across
  sessions and branches; a stale log from another branch will match.
- Never `pkill`/`killall` by a command pattern — other efforts run the same gates. Kill
  only by PID whose command line contains `worktrees/sc379-negotiation/`.
- Never `rm -rf` anything in `.superpowers/` other than your own `sc379-` files. Never
  edit `freeze-baseline.sha256` or `check-freeze.sh`.
- Never run `steel-etl site` with `pipeline.yaml`; this slice never needs steel-etl at all.
- The worktree's superproject checkout is older than the main checkout; if
  `token-coverage.test.ts` goes red on a missing token row, compare the two copies of
  `docs/superpowers/dse-overhaul/D3-token-map.md` before believing it (dse-verify §8.4) —
  not a reason to edit the branch.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session, not to me. If you need input mid-task, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question in your report — I see your
  completion notification and will resume you with the answer. If you ever do send a
  message anyway, its FIRST WORD must be `SC-379:`.

## 6. Return contract

Final text to the ticket-owner — raw facts, no prose: STATUS (DONE / NEEDS_CONTEXT /
BLOCKED), final sha + base sha, each gate's measured line, the 6 moved freeze names, the
report path, **the absolute path of every PNG/log you produced**, `Drive-by fixes:`,
`Follow-ups:`.
