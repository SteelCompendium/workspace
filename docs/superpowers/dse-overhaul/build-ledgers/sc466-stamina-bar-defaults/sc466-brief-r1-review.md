# SC-466 r1 independent review brief

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/decisions.md` (ledger, authoritative), then the implementer's brief `sc466-brief-r1-impl.md` and report `sc466-r1-impl-report.md` in the same dir (read the report's executive summary and the parts you need; verify its claims, don't trust them).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults`; plugin repo `draw-steel-elements` on branch `sc466-stamina-bar-defaults`, base dse `origin/develop` `0ce76dd` (confirm with `git -C … fetch origin`; if develop moved, review against the branch's merge-base and say so). Diff under review: `git -C /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements diff 0ce76dd..HEAD`, plus the superproject CHANGELOG commit on the worktree superproject's branch.
- You are a REVIEWER: do not commit to the branch. Probe code goes in your private scratch dir or in uncommitted test files you delete (by exact path) before finishing; leave `git status` as you found it.
- **Workers never call the tracker** (Linear). The ledger is your context.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- Out of scope: `src/framework/host/` (SC-457 in flight), SC-432's Spend Recovery surfaces.
- Also out of scope (already ruled; do not raise as findings): SC-482 — the same default-key leak in other ComponentWrapper blocks such as ds-skills (filed Backlog); and the pre-existing reorder of an authored `collapse_default` to class order on write (owner DROP, see ledger).
- Implementer's state at dispatch: dse `e0e2fdc` (3 commits on `0ce76dd`), superproject CHANGELOG `52a22fa`. Implementer's numbers: jest 5423/1/232 of 233; lifecycle 29/29; e2e 89/93 ok, 0 failed, 4 known-bug, 64/64; shots 572; freeze 276/276; parity 0/0/24. New e2e test STAM-W11.

## 2. The task

Adversarial review of the SC-466 fix. Spec and owner rulings are in the ledger — quoted verbatim there; judge the diff against them, especially:

> Rule for the fix: a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today.

and the SC-169 standing constraint (authored `collapsible:` / `collapse_default:` keep round-tripping).

**Execute and probe, don't just read.** At minimum:
- Re-run the full `dse-verify` battery yourself (numbers below) — your e2e run is the evidence of record.
- Mutation-test the new tests: revert the fix (or break presence tracking for one key at a time) and confirm the new jest and e2e tests go red.
- Trace every writer of a ds-stamina-bar / ds-stamina block (stamina modal Apply, Catch Breath, Recoveries strip, popover, undo toast, chrome collapse toggle, initiative or hero-sheet paths that write this block if any, pref-overrides) and confirm the presence information survives each one — the classic failure is a clone/`new StaminaBar(...)` path that drops it, so a second write after the first re-adds the defaults. Probe the SECOND and THIRD consecutive write, and undo after a write.
- Integrity probes in a real Obsidian (the e2e driver or lifecycle harness): content above/below the fence survives; two same-kind blocks (one minimal, one fully authored) don't cross-talk; a user hand-edit between writes (e.g. adding `height: 2`) is honoured by the next write; external edit then write.
- Verify the presence record never serializes (real `yaml`/`stringifyYaml`), is per-instance, and that a fully-authored block's bytes are identical to `0ce76dd` (diff the outputs of both builds on the same fixtures).
- Check fixture changes in existing tests: every changed expectation must correspond to a source that omitted the key; no assertion weakened otherwise.

## 3. Gates — expected numbers

Baseline at `0ce76dd` (dse-verify CURRENT): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5408 / 1 skipped / 231 of 232 suites** + the implementer's new tests (compare after a shots run) · lifecycle **29/29** · e2e **88/92 ok, 0 failed, 4 known-bug, coverage 64/64** + the new test(s) · shots **572**, 0 FAIL · freeze **276/276** (no rebaseline expected; any delta is a finding) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Gate procedure: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

Run rules:
- One gate per Bash call: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements && npm run <x> > <log> 2>&1; echo rc=$? > <rcfile>'`. Never a compound `cd X && devbox run …` outside the quotes; never pipe a gate through `tail`.
- `rm -f main.js styles.css` in the plugin root before `npx jest`.
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r1-review-<your agentId>/`; uniquely named scripts/logs; create files with the Write tool, not heredocs. Never glob `rm`; delete only exact paths you created.
- Own `DSE_LIFECYCLE_PORT` (e.g. 9297).
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains `worktrees/sc466-stamina-bar-defaults/`. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or any shared glob; never `rm -rf` under `.superpowers/`.
- Never `--headed` / `DISPLAY=:1`.
- Redirect long output to files; run gates in the FOREGROUND (a backgrounded gate's notification never wakes you). Never key a wait-loop on a scratch filename or its contents.
- `git -C <absolute path>` for every git command. No commits, tags, pushes.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/sc466-r1-review-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, counts by severity, your gate numbers, e2e run id). Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix. List each probe and its result, and each mutation and whether it went red. If the report-file write is blocked, return the report inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, severity counts, sha reviewed, measured gate numbers, paths of every evidence artifact. No prose.

You cannot `SendMessage` me (a depth-2 agent cannot address its parent; `to: 'main'` reaches the dispatcher, not me). Need input → end with STATUS: NEEDS_CONTEXT and the question. If you message anyway, first word `SC-466:`.
