# SC-610 r2 — independent adversarial review

You are a reviewer for the SC-610 ticket-owner. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. You did not write this code; review it, do not fix it (the author fixes).

## 1. Context loading

- Ledger (current state, binding): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/decisions.md` — ticket text and owner decisions O1-O6.
- The author's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r1-impl-report.md` (read the executive summary and the survey; treat its claims as claims to check, not facts).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero`; plugin at `.../draw-steel-elements`, branch `sc610-montage-nameless-hero`, head `3a0f3079` on base `7866426e` (dse develop). Diff: `git -C /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements diff 7866426e..HEAD`. Superproject worktree head `2bd2a2f6` (CHANGELOG bullet). Do not commit to the branch; probes go in scratch. Use `git -C <absolute path>` for every git command.
- Gate reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (about 360 KB; read the "battery, in order" table, "Devbox wrapping", "Stale main.js", "Load-sensitive jest suites", "Lifecycle and e2e notes", "THE exit-code footgun"; grep for the rest). Do NOT edit it.
- Precedent: `sanitizeEntry` / `sanitizeEntries` and the `MontageEntry` L-2 doc comment in `src/elements/montage/model.ts`; SC-606 ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc606-montage-edit-no-skills/` (`decisions.md` O2; `sc606-r2b-review-report.md` for the probing style that worked).

## 2. What to do — execute and probe, not just read

1. Every participant read site in the plugin (grep `participants`, `.name`, `findParticipant`, BoardView, HeadView, OutcomeBandView, view.ts, LogActionModal, the cell keyboard opener, reset, addMontageHero, tally, next-hero, and any non-montage reader) — is any site still unguarded for each O1 shape (null `- `, `- 7`, `- Ash`, `{}`, `name: ''`, `name: 7`)? Write scratch jest probes (in scratch, run against the worktree with a `--rootDir`/path that does not commit them, or copy into the tree and delete the literal file after) that drive the real model and DOM for each shape.
2. O3 integrity probes on the serialized note text: (a) content-bearing bad items survive log / edit / remove / reset / add hero / counter writes, intact and in their original position; (b) two good heroes and bad items interleaved — no cross-talk, good heroes' `skills_used` correct, order kept; (c) a bad item the user later fixes by hand (adds `name:`) becomes a normal hero cleanly; (d) an entry (`entries[]`) whose `hero` names no usable participant still behaves as on base; (e) duplicate names, and a good hero named the same as a bad item's text; (f) whether the empty-item drop (if the author chose it) can ever drop something with content.
3. §B.5 key order and omit-empty still hold for every write; SC-606 behavior (no `skills_used` key added by an unrelated write) still holds.
4. Re-run jest (expect 7707 + new tests passed / 2 skipped fresh, or +1/-1 after a shots run) and e2e (`278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`). Optionally lifecycle part 5 (`G-S59 G-S49 G-S73 G-S77 G-S83 G-S87 G-S91`, 7/7) — it holds G-S87 (montage cell opener).
5. Check the tests the author added are red on base `7866426e` (check out the test files onto a base export in scratch, or `git stash`-free: `git -C <plugin> worktree add <scratch path> 7866426e` then copy the test files) and green on head.
6. Read the CHANGELOG bullet for accuracy and plain words.

## 3. Footguns (binding)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc610-montage-nameless-hero/draw-steel-elements -- bash <script file>`; script files written with the Write tool; never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c`; no pipes after a gate; read each gate's own summary line. `rm -f main.js styles.css` (literal paths) in the plugin root before jest.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r2-<yourAgentId>/`, uniquely named files.
- **Never `rm -rf` a `/tmp` glob.** Delete only a literal path you created. No `rm` with a shell-variable target (it hangs on a permission prompt). Never touch `.superpowers/` beyond your own report file.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd/command line is inside this worktree or your scratch.
- Redirect long output to files; the 600 s stream watchdog kills silent agents. Never key a wait-loop on a scratch filename you did not create for this run. The Bash tool backgrounds calls over 180 s and notifies on completion; for a lifecycle part use `timeout 175 tail --pid=<your own node pid> -f /dev/null` to wait, then read the log.
- Leave the worktree clean (no stray probe files) when you finish; report `git status --porcelain` of the plugin.
- The main checkout's dse dirt (demo-vault files, compendium-manifest.json) is Scott's live vault — ignore it.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its FIRST WORD must be `SC-610:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc610-montage-nameless-hero/sc610-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, gate numbers you measured). Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, the failure scenario (input block text -> action -> observed vs expected), the probe that shows it, and a prescribed fix.

## 5. Return contract

Final text: raw facts — verdict, finding counts by severity with one line each, measured gate numbers, and the absolute path of the report and every probe/log artifact.
