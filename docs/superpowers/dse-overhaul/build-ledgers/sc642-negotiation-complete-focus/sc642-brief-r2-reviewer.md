# SC-642 r2 reviewer brief — independent adversarial review of the Complete Argument focus fix

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc642-negotiation-complete-focus/decisions.md`
- r1 implementer report (read its executive summary, mechanism, survey and mapping; then verify, do not trust):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc642-negotiation-complete-focus/sc642-r1-implementer-report.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc642-negotiation-complete-focus`, dse submodule branch
  `sc642-negotiation-complete-focus` at head `01af056d` on dse `develop` `12aaf5b5`. Review `git -C <dse path> diff 12aaf5b5..01af056d`.
  **Do not commit to the branch.** Probes, mutants and scratch bundles go in your private scratch folder (a
  `git archive` export for mutant bundles, `DSE_LIFECYCLE_BUNDLE` / a scratch copy for e2e if needed) — leave the
  worktree's tracked files exactly as you found them (`git -C <dse path> status` clean at the end).
- **You never call the tracker (Linear).**
- Required reading: workspace `AGENTS.md`, `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8,
  the `dse-verify` skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (very long lines:
  `sed -n 'A,Bp' | cut -c1-600`; sections "The battery, in order", "Devbox wrapping", "Stale main.js", "Jest timeouts
  under load", "Lifecycle and e2e notes", "THE exit-code footgun", CURRENT numbers ~line 1531).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc626-montage-focus-after-write*`
  (same kit helper; its r2 review is the model for this one).

## 2. The task

Ticket requirement and owner decisions: quote them from the ledger (sections "Ticket requirement" and "Owner
decisions"); judge the diff against them, verbatim.

Execute and probe, do not just read:

1. Re-run the full battery yourself (numbers below) and report each summary line.
2. Vacuity: revert only the `src/` change (scratch copy or stash-free approach: build a bundle from `12aaf5b5`'s `src/`
   with the branch's tests) and confirm every new jsdom test and every new/flipped e2e test goes red; report counts.
3. Mutants (at least 3, one source edit each), e.g. restore unconditionally (ignoring "focus was inside the card"),
   wrong landing control, no Live Preview carry. Each must turn at least one test red; report which.
4. Real-Obsidian probes beyond the tests: Reading view and Live Preview; Complete Argument when it ends the
   negotiation / is the last argument (if reachable); focus outside the card during an outside edit; two negotiation
   blocks in one note (focus must not jump to the other card); mouse click on Complete Argument (must not steal focus
   oddly). Integrity: the note bytes change only as Complete Argument already did on `12aaf5b5`.
5. Scope: SC-639's markers (`NEGO-F01`, `NEGO-L03`, jsdom `K05`) still known-bug; no edits to `src/model/NegotiationData.ts`
   or the Reset path; montage / initiative / conditions focus behaviour unchanged; kit change (if any) small and reusable.
6. The r1 mechanism claim: Chromium's focus fixup blurs the disabled Complete button ~13-19 ms after the press, ~450 ms BEFORE the debounced write; no rebuild involved. Verify it independently. Also judge r1's note that a MOUSE press on Complete now also moves focus to the first chip (no focus ring): is that acceptable, or should the hand-off be keyboard-only (on base a mouse press leaves focus on body)?
7. Judge the landing control the implementer chose against the ticket's "Expected" line, for a keyboard user.

Findings by severity (CRIT / HIGH / MED / LOW / INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Gates (expected)

Baseline at `12aaf5b5`: tsc + lint clean · jest 13032 passed / 2 skipped fresh (13033 / 1 with the shots cache) · lifecycle 64/64 · e2e `576/597 ok, 0 failed, 21 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 · freeze 280/280 · parity 0 / 0 / 24. Branch expected (from r1): jest 13041 passed / 2 skipped fresh (+9) · lifecycle 64/64 · e2e `582/601 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` · shots 592 / 163/978 / 40/240 / 147 · freeze 280/280 · parity 0 / 0 / 24.

Lifecycle runs in SEVEN parts with `--only=` (equals sign; a space runs the whole suite — check the log's first lines),
comma-separated, one part per Bash call, logged, pid polled:
1. `G-S7a … G-S9a` (21; ids from the SCENARIOS array in `visual-harness/obsidian-lifecycle.mjs`) 2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` 4. `G-S57,G-S62,G-S61,G-S56` (G-S56 LAST)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` 6. `G-S92,G-S96,G-S97,G-S99` 7. `G-S108,G-S112,G-S115` (~200 s)

Known signals: G-S91 FAIL is real unless "host too slow" after two re-runs. G-S115 (g) suspected flake (SC-633): one
re-run of part 7. INIT-W10 e2e flaked once under load (SC-654): one `--only=INIT-W10` re-run. SC-622: restore
`demo-vault/.obsidian/appearance.json` before blaming a G-S97 red. Jest "Exceeded timeout" = real hang until proven
otherwise. `rm -f main.js styles.css` (literal absolute path in the plugin root) before `npx jest`.

## 4. Footguns

- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad.** Leave throwaway files in place. No
  `rm` with a shell-variable target anywhere.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc642-r2-rev/`;
  uniquely named scripts and logs; Write tool for scratch files.
- Devbox: `devbox run -c <abs dse path> -- bash <script file>`; never `cd` inside a compound command; rc only from a
  script file; never pipe a gate into `tail`. Every git command `git -C <absolute path>`.
- Redirect long output to files (600 s stream watchdog). Calls over 180 s get backgrounded: poll your own pid with
  `timeout 175 tail --pid=<pid> -f /dev/null` (pick it by `/proc/<pid>/cwd`). Never wait on a monitor/background notice.
- Never key a wait-loop on a scratch filename or its contents.
- Never `pkill`/`killall` by pattern; kill only PIDs in your worktree. Never `rm -rf` a shared `/tmp` glob.
- e2e: never `--headed` on `:1`; `command grep -a` for `e2e/run.mjs`.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` and the question if you need input. Any message you
  send anyway starts with `SC-642:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc642-negotiation-complete-focus/sc642-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, finding counts by severity, battery numbers).

## 6. Return contract

Final text to the ticket-owner: verdict, finding counts, each gate's summary line, vacuity/mutant counts, report path,
evidence paths. No prose.
