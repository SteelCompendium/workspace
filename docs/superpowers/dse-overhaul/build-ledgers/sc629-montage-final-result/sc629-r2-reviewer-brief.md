# SC-629 r2 — independent adversarial review

Your final text goes to the ticket-owner, not a human: raw facts (verdict, findings by severity with file:line,
measured numbers), no prose, plus the absolute path of every evidence artifact. You never call the tracker.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc629-montage-final-result/decisions.md`
- The implementer's brief and report (same dir): `sc629-r1-implementer-brief.md`, `sc629-r1-implementer-report.md`.
  Read the report's summary; judge the CODE, not the report's claims.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc629-montage-final-result`, branch
  `sc629-montage-final-result`. Review the dse diff `10c271fe..b68d6a0a` and the superproject commits on top of
  workspace main `20004425`. `git -C <abs path>` for every git command. Do not commit to the branch; if you
  need to try a mutant, do it in a scratch `git worktree add` of the plugin repo at an absolute path under your
  private scratch folder, and revert nothing in the real worktree.
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~370 KB —
  read by line range: "The battery, in order", "Devbox wrapping", "Lifecycle and e2e notes", "THE exit-code
  footgun", "Freeze semantics").

## 2. The task

The ruling under review (owner D1, verbatim): "fix in the model — `pending` only while the montage is NOT
complete; a complete montage at 0/0 is `failure` (verdict word "Total Failure", heading "Final result", skull
crest, matching the rule line). The SC-629 e2e marker MONT-W03 becomes a plain test. User-facing: one CHANGELOG
bullet under `## Unreleased`."

Execute and probe, do not just read:
- Every reader of `montageOutcome` / `BAND_WORD` / `BAND_ICON` / `data-band` (band, head, any chrome/sidebar
  summary, CSS keyed on `data-band`): for a complete-0/0 board, do they all agree? Does anything still say "Not
  started", show the hourglass, or style as pending?
- The live 0/0 case is unchanged ("This montage" / "Not started").
- Edge cases: `rounds: 0`; unset limits (0); a limit-completed montage at 0/0 (is that reachable?);
  `current_round` far past `rounds`; quoted / typed values (SC-628 `setNumber` rule); Add a round from the
  complete-0/0 state goes back to live "Not started"; Reset progress / Clear all; back to round N.
- Mutant check: revert the model change and confirm the new jest tests and MONT-W03 go red (tests not vacuous).
- Re-run tsc, lint, jest and full e2e yourself; run lifecycle part(s) only if the diff touches anything a
  lifecycle scenario covers (say which you ran and why). Shots + freeze if the implementer's report says any
  shot changed or if `styles.css` / a shot fixture changed.
- CHANGELOG bullet: plain words, accurate, under `## Unreleased`; superproject has exactly one CHANGELOG commit
  and one pointer bump at the tip, pointing at the dse head; no interim pointer commits.

Expected numbers (baseline at `10c271fe`): jest 13307 passed / 2 skipped fresh · lifecycle 64/64 · e2e
`585/604 ok, 0 failed, 19 known-bug, coverage: 416/416 pairs` · shots 592 · freeze 280/280 · parity 0/0/24.
After the fix e2e should read `586/604 ok, 0 failed, 18 known-bug, coverage: 416/416 pairs` plus any new e2e.

Out of scope: SC-631, SC-650, SC-655, SC-630, SC-632.

## 3. Footguns

- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound command; never
  trust an echoed `$?` inside `bash -c`; no `| tail` on a gate; read each gate's own summary line.
- `rm -f main.js styles.css` (literal paths) in the plugin root before `npx jest`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, never `rm` with a variable or
  glob. Leave throwaway files in place.
- Private scratch folder:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc629-r2-rev/`;
  uniquely named scripts and logs; create files with the Write tool.
- Kill only by PID inside your worktree (`readlink /proc/<pid>/cwd`); never `pkill`/`killall` by pattern.
- Each gate is a blocking foreground call; no `run_in_background`, no Monitor; never key a wait-loop on a
  scratch filename. A lifecycle part over 180 s: log to a unique file, wait with
  `timeout 175 tail --pid=<your node pid> -f /dev/null`, read the log. Lifecycle `--only=` takes an EQUALS sign.
- Known flakes: G-S91 FAIL is real unless "host too slow" after two re-runs; G-S115 (g) re-run once (SC-633);
  INIT-W10 e2e under heavy load (SC-654); SC-622 `demo-vault/.obsidian/appearance.json` dirt fails G-S97 —
  restore it first. Jest "Exceeded timeout" (30 s) is a real hang until proven otherwise.
- Main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
  Scott's live vault — expected, ignore.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. Any message
  you send anyway must start with `SC-629:`.
- Redirect long output to files (600 s stream watchdog).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc629-montage-final-result/sc629-r2-reviewer-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX-FIRST, counts by severity, measured numbers).
Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, prescribed fix. If the
report-file write is blocked, return it inline.
