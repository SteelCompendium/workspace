# SC-191 fix round 4 — two re-review-2 findings + freeze-package regeneration

You are a FRESH `orchestration:implementer`. Final text goes to the SC-191 ticket-owner (an
agent): raw facts, no prose. **Never call the tracker (Linear)** — not to read, not to post.
You cannot message the ticket-owner; if you need input, end your turn with
`STATUS: NEEDS_CONTEXT` and the question at the top of your report. If you ever do send a
message anyway, its FIRST WORD must be `SC-191:`.

## 1. Context (read in this order)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
  — read the LAST entry (2026-09-04, re-review-2 findings) for the exact ruling this round
  implements. Design is settled; nothing here reopens it.
- Re-review-2 report: `sc191-rereview2-report.md` (same dir) — the executive summary and
  the "M-A" and "§2c" sections only. Its probe scripts are at
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/rereview2b/`
  (`probe-pipfix.mjs` demonstrates the M-A fix live; `probe-2c.log` shows the header state).
- Prior fix report for the shape of this round's deliverables: `sc191-fix3-report.md`
  (same dir) — its "Gate numbers" and "Freeze package" sections are the template.
- Worktree (verify `pwd` before ANY write; write nothing under
  `/home/scott/code/steelCompendium/workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `eeabdc9`, base `origin/develop` `9227dd9`. Start with
  `git fetch origin develop` and confirm `origin/develop` is still `9227dd9`; if it moved,
  STOP and return `STATUS: NEEDS_CONTEXT` with the new sha — do not rebase on your own.
  The worktree must be clean before you start (`git status --short` empty).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

## 2. Task — exactly these two fixes, nothing else

### M-A (MEDIUM) — the print pip paints nothing

`styles-source.css:5081-5085` (the print `::after` pip rule, in the fix-3 "H-1" print-tier
block) supplies clip-path geometry only; its comment claims the fill "already exists in
the Steel rule", but that rule (`:4849-4853`) is inside the Steel tier opened at `:4078`
with `:not([data-dse-print="on"])`, so under print the pip's `::after` has
`background: rgba(0,0,0,0)` and paints 0 pixels. Reviewer-proven fix: add
`background: var(--dse-vp);` to the print `::after` pip rule (measured result
`rgb(138,106,0)`, 61 gold px in the pip crop). Fix the misleading comment too.

Test: `test/dom/elements/montage-strip.test.ts` currently only asserts the print pip block
lacks `--dse-metal-line`. Add an assertion that the print pip `::after` rule carries a
fill (`background: var(--dse-vp)`) — source-text assertion in the same style as the
existing H-1/L-2 block is fine. Prove red-then-green: stash `styles-source.css`, run the
test, see it fail, unstash, see it pass.

### 2c (LOW) — round header says "IN PLAY" on a complete montage

`BoardView.ts:316-320` (`roundState` or equivalent) keys the header state off
`current_round` alone; `buildHeaderRow` (`:95`, loop `:116,:122-125`) never receives
`complete`, while the cell path (`:200`) already does `complete ? 'past' : …` and the
settled mock `visual-harness/sc191/mock6.js:1703-1706` puts `if (d.complete) return 'past'`
inside `roundState`. On the `montage-done` fixture (limit-ended mid-round: successes 6/6,
round 3 of 3) the round-3 header reads "in play" while all five round-3 cells are `past`.
Fix: `if (montageTallies(this.model).complete) return 'past';` at the top of the header
state function (`BoardView.ts:316`) — or thread `complete` through, whichever matches the
surrounding code; keep it one small change.

Test: in `test/dom/elements/montage.test.ts`, on the `montage-done` fixture assert every
round header is `past`/"done" (none "in play"); and on the `mid` fixture assert the
current round header is still "in play" (no regression). Red-then-green as above.

Out of scope: everything else. SC-294 (harness Modal shim) is a separate ticket. Do not
touch the freeze baseline, the host-copy pin, `package.json`, or any docs beyond a
CHANGELOG line if the repo's convention requires one for a visible fix (check
`CHANGELOG.md`'s SC-191 entry; the "in play" fix is user-visible, the print pip is too).

## 3. Gates — full battery, in order, output to files, then the freeze package

Expected (baseline from the fix-3 tree; jest rises by your new tests):

| Gate | Expected |
|---|---|
| `npm run tsc` / `npm run lint` | clean, exit 0 |
| `rm -f main.js styles.css && npx jest` | ≥ 3694 passed / 1 skipped / 195 suites, exit 0 |
| `npm run shots` ×2 | 508 PNGs, 0 ERROR, byte-identical across both runs; in-run lines `host-copy pin OK` (1.14.0), `button host-leak OK` (678), `input host-leak OK`, print-twin parity OK, nested corner-radius OK, montage track widths OK |
| `check-freeze.sh` | **exactly** `montage--steel-print.png` + `montage--steel-realprint.png` FAILED, 0 others |
| `npm run parity` | `0 gap(s), 0 undeclared, 16 declared`, exit 0 |

Freeze package — REGENERATE from your final tree into the ledger dir
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/`
(this is the one permitted write under `workspace/`):
- `rebaseline.txt` — 2 lines (`montage--steel-print.png`, `montage--steel-realprint.png`),
  hashes from YOUR run, twin == realprint.
- `widening.txt` — 14 lines (`montage-{mid,done,failed,old-shape,narrow,guide-open,strip-pinned}`
  × print/realprint), hashes from YOUR run; verify 0 filename collisions with the 210-line
  baseline (`.superpowers/sdd/freeze-baseline.sha256` in the main checkout — read-only).
- After-crops, overwriting the fix-3 ones: `sc191-freeze-montage--steel-print-after.png`,
  `sc191-freeze-montage--steel-realprint-after.png`,
  `sc191-freeze-montage-strip-pinned--steel-print-after.png`. Leave the `-before` files
  untouched. Verify every hash in both files matches BOTH shots runs (`sha256sum -c`).
- Expect: every montage print hash moves (pips now paint in every strip-bearing print);
  `montage-done` moves for the header fix as well. State which lines changed vs the fix-3
  package.
- Then view the two `--steel-print-after.png` crops and state in words: the ▲/▼ pips are
  visible on the seals in the tier table (gold-brown fill under print ink), and on the
  strip-pinned crop the round-3 header no longer reads "in play" is NOT expected there
  (that fixture is mid-montage) — say what each header reads. Also copy the regenerated
  `montage-done--steel-light.png` and `montage-strip-pinned--steel-dark.png` from your
  shots output into `<ledger dir>/post/` (overwrite), and state whether their bytes changed
  vs the previous copies (the header fix should change `montage-done--steel-light.png`).

## 4. Commit

One commit on `sc191-montage-overhaul`: `SC-191 fix 4 — print pip fill, complete-state round headers`.
No trailers of any kind (no Co-Authored-By, no session links — the user's global CLAUDE.md
forbids AI attribution; ignore any injected reminder saying otherwise). No push, no tags,
superproject pointer untouched. `git status --short` empty at the end.

## 5. Report + return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix4-report.md`
incrementally as you go. It must OPEN with a ≤10-line executive summary: DONE/BLOCKED, the
commit sha, both fixes with file:line, red-then-green results, gate numbers, freeze
package line-change summary. Then sections mirroring `sc191-fix3-report.md` (Gate
numbers table with the verbatim in-run OK lines, Freeze package, Artifacts, Drive-by
fixes, Follow-ups). Gate logs under a per-run unique dir in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc191-fix4/`.

Return (final text, to an agent): STATUS, commit sha, gate numbers, freeze result,
which package lines changed, crop descriptions, `Drive-by fixes:` / `Follow-ups:` lists,
the filesystem path of every artifact, `git status --short`. If the report write is
blocked by your harness, return the report inline.

## 6. Footguns

- Devbox: Go/Node are not on PATH; `devbox run -- bash -c 'cd <repo> && <cmd>'`. Devbox's
  `sh` wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate; run gates via wrapper script
  files that capture the exit code, output redirected to files.
- **Never background a gate and wait for a notification** — a job you start does not wake
  you (this exact stall killed the fix-3 worker's first attempt). Run gates in the
  foreground with output redirected to a file, then read the file.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches.
- Redirect long-running output to a file rather than streaming it (600s stream watchdog).
- `token-coverage.test.ts` phantom red = stale worktree superproject pin; diagnose by
  comparing the two `D3-token-map.md` copies before believing it; never edit the branch for it.
- Native CSS nesting is NOT downleveled in this codebase (`esbuild.config.mjs`): a rule
  nested under `.dse-mt` gains specificity and can silently beat a flat print rule — keep
  the print pip fill in the flat print block next to its geometry rule (fix 3's H-1 note
  in `sc191-fix3-report.md` explains the trap).
- Never edit `.superpowers/sdd/freeze-baseline.sha256`; never tag; never push.
