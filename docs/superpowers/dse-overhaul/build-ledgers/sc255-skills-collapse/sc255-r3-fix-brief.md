# SC-255 r3 — fix round on the `ds-skills` header removal (comments, docs, tests only)

You may be a replacement worker. Everything is in files.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/decisions.md`
  — read the "Finding rulings (owner, 2026-09-25)" section: it says exactly which findings you fix.
- Review report (the findings, verbatim, with file:line and prescribed fixes):
  `.../sc255-skills-collapse/sc255-r2-review-report.md` §1 and §2. Probe tests to turn into real tests:
  `.../sc255-skills-collapse/sc255-r2-logs/zz-sc255-r2-probe.test.ts` (P1 and P6/h3).
- Gate rules: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree repo: `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`,
  branch `sc255-skills-collapse`, currently at `cbbb190` on base `6c4f6aa`. Verify `pwd` and branch before
  any write. `git fetch origin`; if `origin/develop` moved past `6c4f6aa`, rebase onto it and report the new base.
  Never touch DSE `main`; never tag or release DSE.
- **You never call the tracker (Linear).**

## 2. The task — fix exactly these (from the ledger)

- **MEDIUM-1**: fix the false "no SessionPersist" claim at `view.ts:11`, `skills.test.ts:183`, `:245-248`
  per the report's prescribed fix (the base wrapper DID persist at slot `open`; chrome persistence
  predates SC-255; chrome is now the only mechanism). Retitle the test accordingly.
- **LOW-1 (partial)**: fix ONLY the comment at `test/dom/elements/skills.test.ts:74-77` that this diff made
  false. **Deleting `resolveCollapsePrefs` / the ComponentWrapper side channel is SC-364 — OUT OF SCOPE. Do
  not touch `src/prefs/catalog.ts`, `src/model/ComponentWrapper.ts`, or the other stale references listed
  under LOW-1.**
- **LOW-2**: fix the stale wrapper comments at `definition.ts:1-4`, `skills.test.ts:1-4`,
  `styles-source.css:3395`, `chromeRound2.test.ts:460-473`. Comments only.
- **LOW-3**: the docs and CHANGELOG must name the removed header as it actually read: "Skill List".
- **LOW-4**: CHANGELOG entry follows the file's existing tag convention (e.g. `[FIX]` if that is what
  entries use) and says the practical effect: a block that starts collapsed now opens with one click on
  the element menu instead of two.
- **LOW-5**: delete the file
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/before/chrome-skills-menu--steel-dark.png`
  (it is not a genuine before shot). Touch nothing else in `before/`.
- **LOW-6**: add P1 (and P6/h3) from the probe file as real tests in `test/dom/elements/skills.test.ts`.
  Confirm each FAILS with base `view.ts` restored (`git show 6c4f6aa:src/elements/skills/view.ts > src/elements/skills/view.ts`,
  run the test, then `git checkout -- src/elements/skills/view.ts`) and passes on the branch. Record both runs.
- **INFO-3**: in `docs/superpowers/sc169-element-menu-panel-spec.md` (~lines 543-546, 599-603), mark the
  "`ds-skills` still has two collapse mechanisms" item resolved by SC-255 (find which repo holds it; if it
  is in the workspace superproject, edit YOUR worktree copy at
  `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/docs/...`, never under
  `/home/scott/code/steelCompendium/workspace/`, and commit it on the superproject branch `sc255-skills-collapse`).

No runtime behaviour change is expected from this round. Commit per coherent step (`fix(skills)`/`test(skills)`/
`docs(skills)`, mention SC-255, **no AI attribution / Co-Authored-By trailers**). Do not push.

## 3. Gates (full battery, dse-verify order)

| Gate | Expected |
|---|---|
| tsc | clean |
| lint | clean, exit 0 |
| jest | all green; 3996 passed / 1 skipped / 206 of 207 suites / 3 snapshots **plus the tests you add** |
| obsidian-lifecycle | `done: 6/6 ok, 0 failed`, exit 0 |
| shots | 524, 0 FAIL |
| freeze | `FREEZE VIOLATED (20 checksum mismatches, 0 missing)` on exactly the 20 names in `rebaseline.txt` |
| parity (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED, exit 0 |

Then hash the 20 shots and diff against
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/rebaseline.txt`:
they must be **identical** (this round changes no pixels). If any differs, stop and report — do not
rewrite `rebaseline.txt`. Never edit the shared baseline.

## 4. Report

`.../sc255-skills-collapse/sc255-r3-fix-report.md`, opening with a <=10-line executive summary
(verdict, final sha(s) — DSE and superproject if touched, gate numbers, rebaseline hash diff result).
Write the skeleton FIRST, then fill it in, so nothing is lost if you are cut off. Then per finding:
what changed, file:line. `Drive-by fixes:` / `Follow-ups:` sections.

## 5. Return contract

Final text goes to the ticket-owner: raw facts (verdict, shas, numbers) + the absolute path of every
artifact (report, logs under `.../sc255-skills-collapse/sc255-r3-logs/`). No prose.

## Footguns

- If the report-file write is blocked, return the report inline.
- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements && <cmd> > <log> 2>&1; echo EXIT=$? >> <log>'`.
  Devbox's sh eats `$?`/`$PIPESTATUS`; never pipe a gate.
- Run every gate in the FOREGROUND, output redirected to a per-run log file. Never background a gate and
  wait for a notification — it never arrives. The 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents; stale logs from other branches match.
- **Kill processes only by PID, and only ones whose command line contains `worktrees/sc255-skills-collapse/`**
  (`pgrep -af "worktrees/sc255-skills-collapse/"`, check each line). Never `pkill`/`killall` by pattern —
  other efforts (SC-236 and others) run the same gates concurrently.
- Never `rm -rf` anything in `.superpowers/` beyond the single file LOW-5 names.
- `token-coverage.test.ts` red on a D3-token-map row you didn't touch = stale worktree superproject copy;
  rerun with `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT` + the question. Any message you send anyway starts with `SC-255:`.
