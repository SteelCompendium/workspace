# SC-443 r5 — rebase onto develop `8c08bce2`, apply the SC-679 hand-off patch, fix the r4 review findings, full battery

You are the implementer on ticket SC-443 (e2e rollout, Tier 3: the editor insert paths of the `draw-steel-elements`
Obsidian plugin). This brief is self-contained: a fresh worker can run it from the files alone.

**Workers never call the tracker (Linear)** — not to read history, not to post. Never push to origin. Never tag.

## 1. Context loading

1. The ledger — read from "Resume 2026-11-23" to the end; it is the current state and carries every ruling quoted
   below: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/decisions.md`
2. The two review reports in the same directory. Read each executive summary, then the full text of every finding
   this brief folds (the findings are your task list, verbatim):
   `sc443-r4a-review-report.md` (H-1, L-1, L-2, L-3, L-4) and `sc443-r4b-review-report.md` (MEDIUM-1, LOW-1, LOW-2,
   INFO-1, INFO-2, INFO-3, INFO-5, PB-1, PB-2, "Cite, not new").
3. Your own r3 report `sc443-r3-rebase-report.md` (same directory) for the gate script shapes that worked.
4. The SC-679 hand-off patch and, for what the fix does, the top of the SC-679 ledger:
   `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc679-suggest-enter-double-value/sc679-on-sc443.patch`
   and `…/sc679-suggest-enter-double-value/decisions.md`.
5. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the gate table at the
   top and the `**CURRENT` paragraph only).

**Worktree:** plugin repo `/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements`,
branch `sc443-e2e-editor-insert`, head `6c5a073c` (8 commits on `d582e7ff`), tree clean. `origin/develop` there is
already fetched at `8c08bce2`. The superproject worktree is on workspace origin/main `e7f6b4a1` with the pointer
unstaged — leave the superproject alone, do not commit there. **Verify the path before any write.** Never write
under `/home/scott/code/steelCompendium/workspace/` except your report file. The main checkout's dse dirt is Scott's
live vault; ignore it.

## 2. Task

### 2a. Rebase and the SC-679 hand-off

Dispatcher, verbatim: "SC-679 landed first — dse origin/develop is now 8c08bce2 (was d582e7ff; 7 commits: accepting
an in-block suggestion with nothing typed leaves the cursor after it and closes the list). […] Relayed from the
SC-679 owner, verbatim: "SC-443 hand-off: whichever of SC-443 and SC-679 lands second applies that patch. It applies
on SC-443 tip `ae9025ea` plus this land diff. If SC-443 lands without it, its `knownBug('SC-679')` markers AUTH-G13,
AUTH-G14, AUTH-K09 and the jsdom `test.failing` marker will start failing as 'unexpectedly passing'." The patch
("holds the real-Obsidian tests for this fix (3 known-bug markers flipped, 13 new e2e tests, 1 jsdom marker
flipped)") […] Rebase onto 8c08bce2 and apply the patch before reporting land-ready."

Owner ruling, verbatim:

> R5-1 — […] One combined round r5 then does: rebase onto `8c08bce2` (overlap: `src/authoring/schemaSuggest.ts` —
> develop's SC-679 behaviour wins, re-apply only the `data-dse-control` attributes), apply `sc679-on-sc443.patch`
> (written against `ae9025ea`; adapt by hand where r3 moved the context), the r4 findings, and the full battery.

- Rebase the 8 commits onto `8c08bce2` (the scope A reviewer's scratch rebase had no conflicts). Keep the commit
  structure; new work goes in new commits on top (`test(SC-443): …`). Commit after every coherent step.
- Apply the patch (`git -C <plugin path> apply --3way` or `am -3`; by hand where it does not apply). After it: no
  `knownBug('SC-679')` and no SC-679 `test.failing` remain; AUTH-G13, AUTH-G14, AUTH-K09 are plain tests; the 13 new
  e2e tests of the patch are present and pass. Check the patch's new ids against the ids this branch added in r3
  (AUTH-I23..I26) — renumber the patch's tests if any collide. Drop the workaround comment at
  `gate-on.e2e.ts:58-59` that r4a H-1 names.
- State in the report what the patch's tests are (ids, one line each) and whether you had to adapt any hunk.

### 2b. Review findings to fix (owner rulings, verbatim from the ledger)

> - L-1 (no throwing network guard on the authoring specs; AUTH-C10 with its stub removed sent a real request) →
>   **fold**: every authoring spec runs under a network guard that throws (the SC-440 `requestUrlFn` mechanism),
>   and the manifest comment matches what the code does.
> - L-2 (AUTH-C09 says Shift-click or Ctrl-click, drives only Ctrl; mutant M12 survives e2e) → **fold**: drive
>   Shift-click on the snapshot command through real input so M12 goes red in e2e; titles say what is driven.
> - L-3 (K01 / K02 key accept has no screen check) → **fold**: complete the line after the accept and assert the
>   block draws as a DSE element.
> - L-4 (middle-click / right-click on a search row reaches `onChooseSuggestion`; not in the manifest) → **fold**:
>   one manifest pair and plain e2e test(s) pinning what a middle-click and a right-click do today. **No bug
>   ticket**: Obsidian's own suggestion list hands every mouse button to the chooser for every plugin; the row does
>   its default action, nothing is lost.

> - MEDIUM-1 (`schemaSuggestMatrix.test.ts:158` pins `mode:flat` as correct) → **fold**: the row becomes the SC-688
>   `test.failing`.
> - LOW-1 (SC-678 marker cannot flip under a "no list mid-word" fix) → **fold** as prescribed.
> - LOW-2 (SC-677 marker tied to `copyCode()`) → **fold** as prescribed (drive through `dispatchReferenceChoice`
>   with Ctrl; assert a Notice and no escaped rejection).
> - INFO-1 (jsdom list case hits the whitespace branch only), INFO-2 (empty quoted line rule untested), INFO-3
>   (snapshot case has no cursor assertion) → **fold**: one jsdom case / assertion each, same files.
> - INFO-5 (SC-676 markers pass `file=null`) → **fold if it needs no guess at the fix**: give the markers a file
>   and a metadata cache stub so a cache-based fix also flips them; otherwise leave and say so.

Notes:
- L-1: prove the guard — remove AUTH-C10's own stub in a throwaway edit, run AUTH-C10 alone, confirm it goes red
  WITHOUT any request leaving (no "resolving compendium release…" Notice), then restore. Report the result. If the
  guard needs an edit to an `e2e/driver/*` file that exists on develop, keep it additive and list it.
- L-4: if the manifest's interaction vocabulary has no fit for a middle / right click, extend it minimally and say
  how. Middle-click and right-click may be one pair or two — say which and why. Real mouse input only.
- LOW-1 / LOW-2: after the change each marker must still FAIL today for its stated reason (a `test.failing` that
  passes makes jest red).
- Out of scope, dropped by ruling (do not touch): r4a INFO items (gate restore, census cascade, Home / End /
  ArrowUp / Cmd-click pairs, the three weak-but-acceptable checks), r4b INFO-4.

### 2c. New bug markers (tickets are filed — cite these keys)

> - PB-1 → filed **SC-687** […]: an insert command or a compendium insert run with the cursor inside an existing
>   fenced block (or the frontmatter) breaks that block. Markers: jsdom `test.failing` + one e2e
>   `knownBug('SC-687')`, each asserting only that the existing block's fences and text are intact after the
>   command (or the note is unchanged), so a refusal and a move-below fix both flip it.
> - PB-2 → filed **SC-688** […]: accepting a value right after `key:` with no space writes `key:value`. The ticket
>   also carries the value-list twin of SC-678 (`mode: te|st` → `mode: testst`). Markers: jsdom `test.failing` for
>   each of the two (asserting only that the accepted line parses / the tail is not doubled) and one gate-ON e2e
>   `knownBug('SC-688')` for the no-space accept.

- SC-687 jsdom: cover the insert command, a compendium insert, and the frontmatter case (three `test.failing`, or
  one per shape). The e2e marker follows the reviewer's probe AUTH-ZR1 (ds-stam block, cursor on its empty body
  line, palette "Insert Draw Steel: Counter"); its probe file is
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-rev-r4b/zz-r4b-probe.used.e2e.ts`
  (read-only). Use the next free `AUTH-I*` / `AUTH-G*` ids; never a bracketed ticket id in a test title.
- No product fixes. `src/` may change ONLY to add `data-dse-control` attributes. A further new product bug: commit,
  finish what does not depend on it, and end with `STATUS: NEEDS_CONTEXT` once, listing every bug.

### 2d. Scenario ids

Check every id you add against develop `8c08bce2` and, read-only,
`/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements/e2e` (in flight). A duplicate
makes the runner exit 2.

## 3. Gates — the full dse-verify battery, in its order, at your FINAL head

| Gate | Baseline at `8c08bce2` | Expected on this branch |
|---|---|---|
| tsc (incl. `tsc -p e2e`), lint | clean | clean |
| jest (fresh) | 13944 passed / 2 skipped | 0 failed; about 14195 / 2 plus what this round adds — state the exact number and account for the delta from 14187 |
| jsdom census | 82 | 88 |
| lifecycle (seven `--only=` parts) | 64/64 | 64/64 |
| e2e full | `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs` | `0 failed`; tests = 673 + 74 + 13 (patch) + this round's new tests; known-bug = 5 + SC-687 + SC-688 = 7 (no SC-679 marker left); coverage `Y/Y` with Y = 464 + the L-4 pair(s). State the exact line and account for every test and pair |
| shots | 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 | unchanged |
| freeze | 280/280 | 280/280 |
| parity (last) | 0 / 0 / 24 | 0 / 0 / 24 |
| built `styles.css` | — | byte-identical to a clean `8c08bce2` build |
| `src/` diff vs `8c08bce2` | — | the three `data-dse-control` attribute edits only |

Known flakes on a loaded host, each allowed ONE re-run and reported: lifecycle G-S61 torn-read (SC-668), G-S115 (g)
(SC-633); e2e INIT-W09 / INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657), NEGO-R05, NEGO-R08 (one sighting on
SC-679). Any other failure is real. An "Exceeded timeout" in jest is a real hang until the suite passes alone.
Never edit `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`.

## 4. Mechanics and footguns

- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert/draw-steel-elements -- bash <script file>`;
  the script file records the exit code; never `cd X && …` in a compound call; read each gate's summary line.
- `git -C <absolute path>` for every git command.
- Each gate is ONE blocking foreground call, or a `nohup` job writing a per-run unique log and exit-code file that
  you poll with short blocking sleeps. No `run_in_background`, no Monitor, never wait for a notification.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — the scratch dir is pre-populated
  across sessions and branches, and a stale log will match. Your r3 logs are still in your scratch folder: use NEW
  names (prefix `r5-`) in
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc443-r5-impl/`.
- No `rm`, `rm -f`, `rm -rf`, `rmdir` in `/tmp` or the scratchpad; no `rm` with a variable or glob target anywhere.
  Never touch `.superpowers/` beyond your report file.
- Never `pkill` / `killall` by pattern; kill only your own PID after checking `readlink /proc/<pid>/cwd`. SC-442 and
  other efforts run the same gates on this host now.
- Do not touch `src/framework/host/livePreviewFocusCarry.ts`. List any edit to an `e2e/driver/*` file that exists
  on develop.
- `sed -i` / editor commands only on absolute paths inside the worktree (an SC-679 worker's stray `sed -i` hit the
  main checkout).
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the
  TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT
  and the question in your report — I see your completion notification and will resume you with the answer. If you
  ever do send a message anyway, its FIRST WORD must be your ticket key (`SC-443:`) — the dispatcher routes strays by
  that key and cannot judge content to guess.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc443-e2e-editor-insert/sc443-r5-fix-report.md`, opening
with an executive summary of at most 10 lines: STATUS, head sha and base sha, each gate's measured summary line,
tests added / changed, markers by ticket, any new bug. Body: the rebase and patch application (hunks adapted); one
entry per finding (L-1..L-4, MEDIUM-1, LOW-1, LOW-2, INFO-1/2/3/5, SC-687, SC-688) with file:line and what now
asserts what; the L-1 guard proof; the full list of e2e ids on the branch with a one-line description of the new
ones; the manifest pair delta; per-gate log paths; flake re-runs; `Drive-by fixes:` and `Follow-ups:`.

## 6. Return contract

Final text goes to the ticket-owner, not a human — raw facts only: STATUS, head sha, base sha, each gate's measured
numbers, counts, bugs, and the filesystem path of every artifact (report, logs). No prose.
