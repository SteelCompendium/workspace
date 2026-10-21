# SC-456 implementer brief (round 1)

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc456-e2e-fence-integrity/decisions.md (the ledger; rulings O1–O5 are binding). Background only: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-report.md section "INFO-1".
- Worktree: /home/scott/code/steelCompendium/worktrees/sc456-e2e-fence-integrity — plugin at `.../draw-steel-elements`, branch `sc456-e2e-fence-integrity`, base dse `develop` @ 188755b. Run `git -C <abs path> fetch origin && git -C <abs path> rebase origin/develop` first; report the base sha you end up on. Verify `pwd`/paths before every write. Never write under /home/scott/code/steelCompendium/workspace/ except your report in the ledger dir. Use `git -C <absolute path>` for every git command, never `cd X; git …`.
- Read the dse-verify skill: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (battery, devbox wrapping, exit-code footgun, e2e rules) and `draw-steel-elements/e2e/README.md`.
- Workers never call the tracker (Linear) — not to read, not to post.

## 2. Task
Ticket SC-456 description (verbatim): "The after-every-test note-integrity check in `draw-steel-elements/e2e/driver/invariants.ts` … and `dse.expectNoteBlock` (`e2e/driver/dse.ts`) record only the first token of each opening fence line. Two consequences: It cannot catch a write that rewrites the opening fence line of the block under test (the SC-290 bug class). … It does not recognise `~~~` fences or a space before the language (```` ``` ds-counter ````), so it reports false failures on writes that are correct. Fix: compare the full opening fence line, and parse fences the same way the product does (`src/framework/host/fenceLine.ts`, added by SC-290). The jest fake `makeFakeContext` has the same first-token limitation."

Apply ledger rulings O1–O5 verbatim (quote them from decisions.md, do not reinterpret). In short the surfaces are:
- `e2e/driver/invariants.ts`: `FENCE_OPEN`, `skeletonOf`, `fencesOf`, `integrityProblems` (closing-fence detection is currently `trim() === '```'`).
- `e2e/driver/dse.ts`: `declareTarget`, `elementIdOf`, `expectNoteBlock` (anything else keyed on the first token).
- the jest fake `makeFakeContext` (find it — likely under `test/mocks/`) — same first-token limitation; make it recognise the same fence forms and keep the info string.
- Existing behaviour that MUST stay: SC-455 quote-prefix fences (`> ```ds-x`, `> > ```ds-x`), SC-453 CRLF notes (lines keep their `\r`; byte-exact comparison), unterminated-fence detection, `exempt` mode, twin-block sibling detection.

Required proof (jest, since the driver logic is pure functions — put tests under `test/`; name them so a reader finds them, e.g. `test/unit/e2eIntegrity.test.ts`):
- a `~~~` and a ```` ```` ```` (4-backtick, inner ``` line) fence: correct writes give NO problems;
- ```` ``` ds-x ```` (space before language) is targetable as type `ds-x` (O2);
- a target block whose opening line changes (```` ```ds-counter extra ```` -> ```` ```ds-counter ````) IS reported; same for a changed closing line (O3); a target whose BODY changes is not;
- a sibling (non-target) change still reported; quote-prefix and CRLF cases still pass;
- if O1 led you to mirror rather than import the product parser: a case table asserting the mirror and `matchFenceMarker`/`parseOpenFenceLine` agree.
- Mutation probe (report it, do not commit it): temporarily revert SC-290's fix in `src/framework/host/fenceLine.ts` `emitOpenFenceLine` to emit `${open.prefix}${open.fence}${open.language}`, run the e2e test(s) that write an info-string fence (`--only=` the RECOV-I01 id or whatever exercises it) and show the after-test INVARIANT (not just the spec's own assertion) now fails; restore and confirm `git -C … status` shows no `src/` change.

Concurrency: SC-460 and SC-422 may add e2e tests concurrently on other branches — keep the change scoped to the integrity helpers; don't reorganise spec files (O5).

Commit after every coherent step (message prefix `test: SC-456 …`; no AI attribution / Co-Authored-By trailers). Do not push.

Drive-by fixes allowed only if obviously correct, local to a file you touch, and gate-neutral — list them under `Drive-by fixes:`. Anything else goes under `Follow-ups:` untouched.

## 3. Gates (dse-verify; devbox-wrapped; script files under your private scratch dir)
Expected numbers at base 188755b (dse-verify CURRENT):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest: 5257 passed / 1 skipped / 229 of 230 suites, PLUS your new tests (state the delta). On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — that is expected, report it as such (O4 skips shots). `rm -f main.js styles.css` in the plugin root before `npx jest`.
- lifecycle: `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed`. Set your own `DSE_LIFECYCLE_PORT` (e.g. 9301) — others run concurrently.
- e2e full run (no --only): `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` (if you add no e2e tests). If the stricter invariant now flags a test on base, that is a FINDING — stop and report (STATUS: NEEDS_CONTEXT) with the failure bundle path, do not loosen the check to make it pass.
- O4 proof: sha256 of built `main.js` and `styles.css` on your head vs. base 188755b (build both the same way); `git -C … diff --stat 188755b..HEAD` lists only `e2e/` and `test/` paths.

## 4. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc456-e2e-fence-integrity/sc456-impl-report.md. It must OPEN with a ≤10-line executive summary (verdict, head sha, gate numbers). If the report-file write is blocked by your harness, return the report inline.

## 5. Footguns
- Scratch: the session scratchpad is shared by every agent. Use a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc456-impl-<your agentId>/` with uniquely named scripts and logs. Never key a wait-loop on a scratch filename or its contents — read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms); never background a gate and "wait for a notification" — it never comes.
- Devbox eats `$?`: run gates via a script file that captures `rc=$?` itself, or make the gate the last command; never pipe a gate to `tail`.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains your worktree path. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`) or the shared `.superpowers/` dir — delete only paths you created and recorded.
- Never `--headed` e2e on DISPLAY=:1.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, never touch it.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever send a message anyway, its FIRST WORD must be `SC-456:`.

## 6. Return contract
Your final text goes to the ticket-owner, not a human: raw facts only — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), head sha, base sha, each gate's measured line, mutation-probe result, Drive-by fixes:, Follow-ups:, and the absolute path of every evidence artifact (report, gate logs, failure bundles).
