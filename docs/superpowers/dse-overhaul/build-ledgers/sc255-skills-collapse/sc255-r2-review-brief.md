# SC-255 r2 — independent adversarial review of the `ds-skills` header removal

You did not write this code. Execute and probe; do not just read.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/decisions.md`
- The implementer's brief: `.../sc255-skills-collapse/sc255-r1-impl-brief.md`. **The implementer died
  before writing its report** — there is no `sc255-r1-impl-report.md`. Its gate logs are in
  `.../sc255-skills-collapse/sc255-r1-logs/` and its commits are `8dc12b6`, `c4e6e8b`, `cbbb190` on top of
  `6c4f6aa`. Derive the behaviour changes from the diff yourself, and list them explicitly in your report
  (what a user would notice: `collapsible: false`, session persistence, prefs, title/heading visibility) —
  the owner needs that list for Scott. Its shots dir may have been left mid-regeneration; regenerate.
- Precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc169-menu-panel-ledger.md`
  §4 "`ds-stamina`" + §7 (the same change on `ds-stamina`).
- Gate rules: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read in full).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`, branch
  `sc255-skills-collapse`, base `origin/develop` (expected `6c4f6aa`; `git fetch origin` inside the clone
  and check). Review the diff `origin/develop...HEAD`. Verify `pwd` before any write.
- **You never call the tracker (Linear).** Do not commit fixes: you are the reviewer. You may write
  scratch probe tests but must leave the branch's working tree clean (revert/stash your probes) when done.

## 2. What to verify

Scott's ruling (verbatim): "Remove the old. Replace with the consistent option that all card elements use."
Owner rulings: per-group collapsibles stay; only the whole-element wrapper goes; the expected freeze
delta is the Skills print lines only — any non-skills frozen line moving is a defect.

Probe at minimum:
1. The whole-element "Skills" header is gone and nothing else in the card changed (group headers,
   tallies, chips/ledger/hero-picks styles, the `-hidden` forms, narrow widths).
2. YAML contract: `collapse_default: true` starts collapsed via chrome; `collapsible: false`
   behaviour (compare to `ds-stamina`); keys round-trip byte-identically after a skill toggle; content
   above/below the fence survives; two `ds-skills` blocks in one note don't cross-talk; a hand-edited
   body survives a re-trigger. Run these as real tests, not by reading.
3. Global prefs `collapseDefault` / `collapsibleDefault` behave for skills as for other chrome elements.
4. Dead code: nothing left referencing the removed SessionStore slot/title; nothing removed that is
   still live. Comments in `view.ts`/`definition.ts` accurate.
5. Tests: did coverage move to chrome behaviour or just get deleted? Any vacuous test (passes with the
   change reverted)? Try reverting the view.ts change and see which tests fail.
6. Re-run the full battery yourself (dse-verify order: tsc, lint, jest, obsidian-lifecycle, shots,
   freeze, parity last). Confirm freeze fails on exactly the lines in
   `.../sc255-skills-collapse/rebaseline.txt`, and that those lines' hashes equal your own shots'
   hashes (determinism across a different run).
7. Eyeball every before/after PNG pair in `.../sc255-skills-collapse/before/` vs `after/` and the
   crops in `crops/`: is the only visible difference the removed header and the resulting upward shift?
   Report anything else (spacing collapse, lost top border/padding, heading hierarchy, orphaned rule).
8. Docs/CHANGELOG entry accurate.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r2-review-report.md`,
opening with a <=10-line executive summary (verdict: APPROVE / APPROVE-WITH-FIXES / REJECT; counts by
severity; your battery numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure
scenario, prescribed fix.

## 4. Return contract

Final text goes to the ticket-owner: raw facts — verdict, sha reviewed, finding counts, battery numbers
— plus absolute paths of every artifact you produced. No prose.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements && <cmd>'`.
  Its sh wrapper eats `$?`/`$PIPESTATUS`; never pipe a gate. Redirect each gate to a per-run log under
  `.../sc255-skills-collapse/sc255-r2-logs/` and echo the exit code into it inside the `bash -c`.
- Run gates in the FOREGROUND with output redirected to files; never background a gate and wait for a
  notification. The 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches match.
- **Kill processes only by PID, and only ones whose command line contains `worktrees/sc255-skills-collapse/`**
  (`pgrep -af "worktrees/sc255-skills-collapse/"`, check each line). Never `pkill`/`killall` by pattern —
  other efforts run the same gates concurrently.
- Never edit the shared freeze baseline or anything in the main checkout except your report/logs in the
  ledger dir. Never `rm -rf` anything in `.superpowers/` except your own `sc255-r2-*` files.
- `token-coverage.test.ts` red on a D3-token-map row you didn't touch = stale worktree superproject copy;
  rerun with `DSE_TOKEN_MAP_PATH=/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with
  `STATUS: NEEDS_CONTEXT` + the question. Any message you send anyway starts with `SC-255:`.
