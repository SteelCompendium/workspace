# SC-679 r1 implementer brief

You are the implementer for ticket SC-679 in the `draw-steel-elements` Obsidian plugin. This brief is
self-contained. Your final text goes to the ticket-owner (an agent), not a human.

## 1. Context loading (do this first)

1. Read the decisions ledger:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/decisions.md`.
   It holds the ticket's expected behaviour, the facts already established, and the owner rulings R1-R3.
   **Workers never call the tracker (Linear): not to read history, not to post.**
2. Read the plugin's `AGENTS.md` in your worktree, and the adapter footguns:
   `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` section 8.
3. Gates: the `dse-verify` skill,
   `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. The file is 2400 lines /
   480 KB: do NOT read it whole. Read lines 20-40 (the battery table; row 4 lists the seven lifecycle
   `--only=` parts), 136-147 (devbox wrapping), 158-246 (jest timeouts, lifecycle / e2e notes, the exit-code
   footgun). Use `cut -c1-1500` on long lines.

Your worktree (the ONLY place you edit):

- superproject: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value`
- plugin clone: `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`
- branch `sc679-suggest-enter-double-value` in both. Base: dse `origin/develop` @
  `129beb18af27c641cca026ec519090af20372715`.

First step: `git -C <plugin clone> fetch origin`, confirm `origin/develop` is still `129beb18`. If it moved,
rebase onto the new sha and say so in the report. Verify `pwd` / paths before any write. **Never write
under `/home/scott/code/steelCompendium/workspace/`** except your report file in the ledger dir (section 5).
The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/CHANGELOG.md`.

A fresh worktree has no `node_modules`: run `npm ci` in the plugin clone first (through a script file, see
footguns), output to a log.

## 2. The task

### The bug

Inside a `ds-*` code block the key / value autocomplete (`DsSchemaSuggest`,
`src/authoring/schemaSuggest.ts`) can be accepted with nothing typed. `selectSuggestion` (lines 123-126)
calls `replaceRange` only. With an empty range the editor leaves the cursor in FRONT of the inserted text
and the old list stays on screen; the next Enter writes the first row again in front of the accepted text
(`mode: power-rollopposed`; on the shipped `ds-stam` key list, `collapsiblecollapsible`).

Scott's expected behaviour, verbatim from the ticket: "Expected: after any accept, the cursor sits after
the inserted text and the list closes (or re-filters for the new position)."

Owner rulings R1-R3 in the ledger are the target. Restated here only as a pointer: read them there.

### What to build

**A. The fix, on the land branch** (`src/authoring/schemaSuggest.ts`; keep it small):

- After any accept, set the cursor directly after the inserted text (R1). The `/ds` suggester
  (`src/authoring/suggest.ts:64-70`) already does this with `setCursor`; mirror that pattern.
- After any accept, no list is on screen (R2). Measure in real Obsidian (part C) what actually happens
  after the cursor fix: Obsidian may re-trigger `onTrigger` on the cursor move and re-open a one-row list
  showing just the accepted word (SC-443's implementer observed "the key list re-opens on the accepted
  word" for typed accepts). If it does, Enter would be swallowed by that list, which R2 forbids.
  Preferred remedy if needed: offer nothing when the only match equals the query exactly (same case), so a
  completed word shows no list. If you find a cleaner mechanism that meets R1-R3, use it and say why. If no
  mechanism meets R2 without breaking R3, STOP and return STATUS: NEEDS_CONTEXT with the measurements.
- R3 must still hold. In particular: `mode` typed fully followed by `: ` still opens the value list; typing
  `c` on a `ds-stam` line still lists every key starting with `c`; where one key is a prefix of another
  (check the real schemas for such a pair), typing the shorter key still lists both.
- Out of scope, do not fix and do not make worse: **SC-678** (a mid-word accept doubles the rest of the
  word, `max|_stamina` -> `max_stamina_stamina`), "no `: ` after a key accept", "already-present keys are
  offered again". If your change alters any of these, report exactly how.

**B. jest tests, on the land branch.** Extend `test/dom/authoring/schemaSuggest.test.ts` (or add a sibling
file): empty-range accept puts the cursor after the value (key list and value list); typed-prefix accept
still does; whatever rule implements R2 (e.g. exact-match gives no rows; prefix-of-another-key still gives
rows); R3 cases. Each new test must FAIL on `129beb18` for the behaviour it pins (show this for at least
the cursor test: run it against the unfixed file once and record the failure line). The existing mock
editor may not model the cursor-mapping of an empty-range insert; if so, make the test's editor model it
honestly (a real CodeMirror `EditorView`-backed helper is best; SC-443's branch has one,
`CmEditor`, which you may read for reference but must not copy wholesale: see D).

**C. Real-Obsidian proof, in a scratch tree that is never pushed or landed.** The e2e driver for the editor
suggesters exists only on SC-443's unlanded branch. Build the proof like this:

1. In your plugin clone: `git -C <plugin clone> fetch /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements sc443-e2e-editor-insert:refs/heads/sc679-sc443-base`
   (expect `ae9025ea`). The SC-443 worktree is READ-ONLY: never write, build or run anything inside it.
2. `git -C <plugin clone> worktree add <scratchpad>/sc679-r1-impl/on-sc443 -b sc679-on-sc443 sc679-sc443-base`,
   `npm ci` there, then cherry-pick your fix commit(s) (resolve the trivial `renderSuggestion` /
   `selectSuggestion` neighbour conflict if any).
3. In that scratch tree flip the SC-679 markers to plain tests: e2e `AUTH-G13`, `AUTH-G14`
   (`e2e/specs/authoring/gate-on.e2e.ts`), `AUTH-K09` (`e2e/specs/authoring/schema-suggest.e2e.ts`), the
   jsdom `test.failing` in `test/dom/authoring/authoringKnownBugs.test.ts`, and the nearby comments that
   describe the bug as present (e.g. `gate-on.e2e.ts:58`).
4. Add new e2e tests there (next free `AUTH-G*` / `AUTH-K*` ids), in real Obsidian:
   - value list, nothing typed, click a row, then Enter with NO Escape: a new line, `mode: opposed` whole,
     cursor on the new line (R2);
   - the same through the keyboard (Enter on a row, and Tab if the list accepts Tab);
   - shipped key list on `ds-stam` (gate OFF): pick a key with nothing typed, then Enter: the key line is
     whole, no doubled key;
   - typed-prefix accept (`mo` -> `mode`, `cur` -> `current_stamina`) still ends with the cursor after the
     word and no list on screen;
   - R3: after a key accept, typing `: ` opens the value list (a key with listed values);
   - one Ctrl+Z after an accept: report what it restores (observation unless the note is left damaged);
   - text above and below the block, and a second `ds-*` block in the same note, are byte-identical after
     the accept (integrity).
5. Run the authoring e2e subset in the scratch tree (`npm run e2e -- --element=authoring`; check
   `e2e/README` / `e2e/run.mjs` there for the exact flag). Expect `0 failed`, and 3 fewer known-bug than
   SC-443's own run of that subset. Also run the scratch tree's jest for `test/dom/authoring`.
6. Commit the flips + new e2e tests on `sc679-on-sc443` (scratch branch, local only) and write
   `git format-patch`-style output of everything on top of your cherry-picked fix to
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-on-sc443.patch`.
   Leave the scratch worktree in place for the reviewer and give its path. Do not push `sc679-on-sc443` or
   `sc679-sc443-base` anywhere.

**D. What does NOT go on the land branch:** nothing from SC-443 (no e2e authoring driver, no `CmEditor`
file copied over, no `stampControl` lines). The land branch is: the fix, its jest tests, docs.

**E. Docs, on the land branch:**

- A bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md` (path in section 1), in the
  style of its neighbours: plain words, what the user sees. Check whether the plugin's own
  `draw-steel-elements/CHANGELOG.md` takes entries for unreleased work (read its head and the plugin
  `AGENTS.md`); follow what the last few landed tickets did.
- If the plugin docs describe the autocomplete behaviour in a way your change makes wrong, fix it.

**Commits:** inside the plugin clone for plugin files (`fix(SC-679): …`, `test(SC-679): …`), in the
superproject for `CHANGELOG.md` (`docs(changelog): SC-679 …`). Do NOT stage the submodule pointer bump in
the superproject (landing does it). **No `Co-Authored-By` and no AI attribution in any commit message.**
Commit after every coherent step. Do not push.

## 3. Gates (land branch), expected numbers at `129beb18`

Run in this order, each as ONE blocking foreground call, through a script file run as
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements -- bash <script>`
with output redirected to a uniquely named log in your private scratch folder:

| Gate | Expect |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean |
| `npx jest` (remove a stale `main.js`/`styles.css` in the plugin root first, per the skill) | fresh worktree base is **13702 passed / 2 skipped** (13703 / 1 once a shots run has cached the app CSS); yours = base + your new tests, 0 failed |
| `npm run obsidian-lifecycle` in the seven `--only=` parts from the skill's row 4 (equals sign, one part per call) | union **64/64 ok, 0 failed** |
| `npm run e2e` (full) | `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (the land branch adds no e2e tests). Known flakes under load: INIT-W10, SET-X03, SET-X04, INIT-W09, NEGO-R05; re-run once before calling a failure real |
| shots / freeze / parity | not run IF you show the built `styles.css` is byte-identical to a build of `129beb18` and the diff touches no CSS, no element view and no fixture; record both sha256 sums. Base numbers that then carry: shots 592, freeze 280/280, parity 0 / 0 / 24. If the sums differ, run all three |

The lifecycle run takes about 14 minutes in total; a single part can run past 180 s, at which point the
Bash tool moves it to the background: then poll the part's own log / rc file (never wait for a notice).

## 4. Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents: the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output, or
  write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it: the 600 s stream watchdog kills silent
  agents.
- You cannot `SendMessage` me: a depth-2 agent cannot address its parent by any name, and `to: 'main'`
  routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn
  with STATUS: NEEDS_CONTEXT and the question in your report: I see your completion notification and will
  resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-679:`.
- Devbox: Go/Node/npm are not on PATH. `devbox run -c <abs plugin dir> -- bash <script file>`; never
  `cd X && devbox run …` in one compound command; an echoed `$?` inside `bash -c` is always 0, so capture
  `rc=$?` inside the script file and read each gate's own summary line. No pipes after a gate.
- Every git command as `git -C <absolute path> …`, never `cd X; git …` (a failed `cd` lands in the shared
  main checkout).
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc679-r1-impl/`.
  All your scripts, logs and the scratch git worktree go there, uniquely named. The scratchpad root is
  shared by every agent: never use a generic name like `gate.sh` at its root.
- Write scratch files with the Write tool (no heredocs). No `rm` with a variable or a glob in the path; no
  `rm -rf` of any shared `/tmp` pattern (`/tmp/dse-obsidian-lifecycle-*` belongs to every effort). Delete
  only literal paths you created.
- Never `pkill` / `killall` by pattern. Kill only by PID, and only a PID whose `readlink /proc/<pid>/cwd`
  is inside your worktree or your scratch folder.
- No background jobs or monitors for gates. If the tool backgrounds a long call, poll its log.
- The main checkout `/home/scott/code/steelCompendium/workspace` shows dirt in `draw-steel-elements`
  (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`): that is
  Scott's live vault, expected, not yours to touch or report.
- Never create a tag or release. Never run `just deploy*`, `just wt-finish` or `just sync`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r1-implementer-report.md`.
It MUST open with an executive summary of at most 10 lines: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), land
branch head sha (plugin) and superproject sha, the mechanism chosen for R2 in one line, each gate's
measured summary line, scratch-tree authoring e2e summary line.

Body: what Obsidian really does after an accept (measured: does `onTrigger` re-fire, does the list
re-open, with and without your R2 mechanism); files changed; tests added (ids / names) and the proof one
fails on base; any change to SC-678-type behaviour; the Ctrl+Z observation; `Drive-by fixes:` (made:
obviously correct, local to a file you touched, cannot move a gate baseline) and `Follow-ups:` (left
alone) as two explicit lists, either may be "none".

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only (STATUS, shas, measured numbers per
gate, the R2 mechanism), no prose, plus the absolute filesystem path of every artifact you produced (the
report, the patch file, each gate log, the scratch worktree).
