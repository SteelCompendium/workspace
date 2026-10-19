# SC-426 round 1 — implement (orchestration:implementer)

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc426-detail-stamina/decisions.md
  (the ledger — distilled current state; it quotes the ticket spec verbatim).
- Read the gate skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md
  (battery order, devbox wrapping, THE exit-code footgun, e2e known-bug rule).
- Read /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements/AGENTS.md.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina . Repo you change:
  /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements , branch
  `sc426-detail-stamina`, currently at origin/develop f8e050f. Before any write:
  `git -C <that path> fetch origin && git -C <that path> rebase origin/develop`; if develop moved past
  f8e050f, say so in your report with the new sha.
- Verify `pwd`/paths before every write. NEVER write under /home/scott/code/steelCompendium/workspace/
  except your report into the ledger dir above. Use `git -C <absolute path>` for every git command —
  never `cd X; git …` (a failed cd once ran git in the shared main checkout).
- You never call the tracker (Linear) — not to read, not to post. The ledger is your context.

## 2. The task
Fix the bug exactly as the ticket spec (quoted verbatim in the ledger) describes:

> **Expected:** the cell, the detail-row number and the detail-row bar all show 10/40. **Actual:** the
> cell shows 10/40 and the note gets `current_stamina: 10`, but the detail row still reads 40/40 with a
> full bar.
>
> **Cause:** `src/elements/initiative/view.ts:1665-1674` opens the modal with the cell span and
> `barEl=null, rowEl=null`; the Apply callback (~1852-1895) refreshes only the cell.
>
> **Fix direction:** in the callback, also refresh the detail row (number, bar, state chip) when
> `group.selectedInstanceKey === instanceKey`.

Requirements:
- Line numbers in the spec may have drifted; find the real sites.
- Reuse the EXISTING detail-row refresh path (whatever the detail-row's own stamina edit uses to
  update number / bar / state chip, e.g. winded/dying chip) rather than writing a parallel one-off.
  Mirror the existing pattern fully (Scott's standing rule: consistency over minimal work).
- When the edited instance is NOT the selected one, the detail row must not change (it shows a
  different creature). Cover that with a test too.
- Also cover temp stamina if the same modal sets it and the detail row shows it.
- Survey: are there OTHER modal entry points in initiative (minion pool, squad/group cells, conditions,
  other grid-cell routes) that open with null bar/row and leave the detail row stale the same way?
  If it is the same bug class on the stamina-from-cell route family, fix it in this round and test it.
  Anything else: do NOT fix — list it under `Follow-ups:` with file:line and a one-line repro.
- Remove the known-bug markers (dse-verify known-bug rule — they FAIL once the bug is fixed):
  - e2e/specs/initiative/stamina-entry.e2e.ts ~148-153: `knownBug('SC-426', …)` -> plain test
    (keep its ID; fix the comment above it so it describes the now-correct behaviour).
  - test/dom/elements/stamina-entry-points-matrix.test.ts ~188, ~193: two `test.failing('[E12] …
    [known bug SC-426]')` -> plain `test(...)`, drop the "[known bug SC-426]" suffix.
- Add a bullet under the Unreleased section of draw-steel-elements/CHANGELOG.md in plain user
  language (match neighbouring bullets' style). Check docs/superpowers/dse-7.0.0-release-audit.md:
  if it lists SC-426 or this bug, mark it fixed citing SC-426 (not a sha), as SC-324 did.
- Commit after every coherent step (fix, tests, docs). Conventional commit messages ending `(SC-426)`.
  NO Co-Authored-By / AI attribution trailers in commit messages.
- Do not push. Do not create tags or releases (standing order).

## 3. Gates — run the full dse-verify battery in order, in your worktree
Expected numbers at dispatch (dse-verify CURRENT, develop f8e050f):
- tsc (incl. `tsc -p e2e`) and lint (incl. e2e/) clean
- jest 4767 passed / 1 skipped / 227 of 228 suites. test.failing already counts as passed, so
  converting the two markers leaves 4767; your NEW tests add to that. Report the exact number.
- lifecycle 25/25 (set your own DSE_LIFECYCLE_PORT, e.g. 9291, in case another session is on 9262)
- e2e: expected `62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` (was 61/72, 11 known-bug).
  If you add an e2e scenario, M grows; report what you got and why.
- shots 572, 0 FAIL · freeze `freeze OK (276/276 …)` (first paint should not change — if freeze
  moves, STOP and report; do not touch the baseline) · parity 0 GAPs / 0 undeclared / 24 DECLARED.
Read every gate's exit code through a script file (dse-verify "THE exit-code footgun").

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc426-detail-stamina/sc426-r1-implement-report.md
opening with a <=10-line executive summary (verdict, head sha, gate numbers). Then: files changed,
the refresh path you reused, the survey result, `Drive-by fixes:` and `Follow-ups:` lists.
If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, branch head sha, measured
gate numbers, report path, and the filesystem path of every evidence artifact (logs). No prose.

## Footguns
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches, and a stale log from another branch will match. Read the process's own
  output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills
  silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms); do not background a gate and
  "wait for the notification" — it never comes.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc426-detail-stamina/draw-steel-elements -- bash -c 'cd <abs path> && <cmd> > <log> 2>&1; echo $? > <rc-file>'`
  style; devbox's sh wrapper eats $? / PIPESTATUS, never pipe a gate into tail.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale main.js shadows main.ts).
- `npm ci` if package.json's obsidian version changed after rebase.
- Never pkill/killall by pattern. Kill only by PID whose command line contains
  `worktrees/sc426-detail-stamina/` (check `pgrep -af "worktrees/sc426-detail-stamina/"`).
- Never `rm -rf` the shared .superpowers/ dir; touch only sc426-detail-stamina/ inside it.
- Never `--headed` e2e on DISPLAY :1.
- You cannot SendMessage me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the
  dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the
  question. If you ever send a message anyway, its FIRST WORD must be `SC-426:`.
