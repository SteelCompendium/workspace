# SC-679 r2 independent reviewer brief

You are the independent, adversarial reviewer for ticket SC-679 in the `draw-steel-elements` Obsidian
plugin. You did not write this code. **Execute and probe, do not just read.** Your final text goes to the
ticket-owner (an agent), not a human. This brief is self-contained.

## 1. Context loading

1. Decisions ledger (the ticket's expected behaviour, established facts, owner rulings R1-R3, scope):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/decisions.md`.
   **Workers never call the tracker (Linear): not to read, not to post.**
2. The implementer's report: read its executive summary first, the body where you need it:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r1-implementer-report.md`.
   Treat its claims as claims: re-measure the ones that matter.
3. Adapter footguns: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` section 8.
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — 480 KB, do
   NOT read it whole. Lines 20-40 (battery table), 136-147 (devbox), 158-246 (jest timeouts, lifecycle / e2e
   notes, exit-code footgun); `cut -c1-1500` long lines.

What you are reviewing:

- Land branch `sc679-suggest-enter-double-value` in the plugin clone
  `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements`, head
  `c1181989b7eb8711d8a15e6065ee56cfcae8c35b`, base dse `origin/develop` @ `129beb18af27c641cca026ec519090af20372715`. Diff: `git -C <clone> diff 129beb18af27c641cca026ec519090af20372715..c1181989b7eb8711d8a15e6065ee56cfcae8c35b`.
  Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value` carries a
  `CHANGELOG.md` commit (`ffa0feb9`).
- Scratch proof tree (SC-443 tip `ae9025ea` + the fix + flipped markers + new authoring e2e), local only,
  never landed: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc679-r1-impl/on-sc443`, branch `sc679-on-sc443`. The patch of everything above the fix:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-on-sc443.patch`.
- The SC-443 worktree (`/home/scott/code/steelCompendium/worktrees/sc443-e2e-editor-insert`) is READ-ONLY
  and belongs to another effort: never write, build or run in it.

You may run things in the land worktree and in the scratch tree, and make your own scratch git worktrees
under your private scratch folder. **Do not commit to or modify the land branch.** Do not push anything.

## 2. The task

Scott's expected behaviour, verbatim from the ticket: "Expected: after any accept, the cursor sits after
the inserted text and the list closes (or re-filters for the new position)."

Owner rulings R1-R3 and the out-of-scope list are in the ledger: read them there, they are the acceptance
bar. The implementer's R2 mechanism: `selectSuggestion` does `replaceRange`, `setCursor` to `start.ch + value.length`, remembers `{line, ch, line text}` in a private `accepted` field and calls `this.close()`; `onTrigger` returns null while the cursor and that line's text are exactly as the accept left them, and the first `onTrigger` call anywhere else clears the memory. The implementer rejected "offer nothing when the only match equals the query" because `recoveries` / `recoveries_max` on `ds-stam` would still re-open a two-row list after accepting `recoveries`.

Review for correctness against R1-R3, then try to break it. Real Obsidian is the truth for anything about
the suggestion list and the cursor; jsdom cannot show it.

### Required probes (real Obsidian, through the scratch tree's authoring e2e driver; add throwaway specs
in a scratch copy, never in the land branch)

1. The ticket's repro, exactly: `ds-roll` block (experimental switch on), empty line, type `mode: `, click
   `opposed`, press Enter. And step 4's variant (Escape, then Enter).
2. The shipped path: `ds-stam` and `ds-skills` key lists, gate OFF, accept on an empty line with nothing
   typed (mouse, Enter, Tab), then Enter.
3. Is any list on screen after an accept, in every one of: key / value list, click / Enter / Tab,
   empty / typed prefix? Check the DOM for the suggestion container, not only the driver's helper.
4. R3 regressions: typing after an accept (`: ` after a key with listed values opens the value list; more
   letters re-filter); a fully hand-typed key or value; a key that is a prefix of another key; case
   differences between what is typed and the listed word (`MODE`, `Opposed`); Backspace after an accept
   (does the list come back, and is that sane).
5. The R2 mechanism's blast radius on everyday typing with NO accept involved: does any list that used to
   show no longer show, or the reverse? Compare against a clean base build where it matters.
6. Integrity (this writes into the user's note): text above and below the block and a second `ds-*` block
   in the note are byte-identical after an accept; two same-language blocks do not cross-talk; an accept on
   the last line of the block and on the last line of the file; a note with CRLF line endings; a line with
   text after the cursor (`mode: |tail`); one Ctrl+Z after an accept, and Ctrl+Z then redo.
7. Multiple cursors / a non-empty selection when the list is accepted; an accept in Source mode as well as
   Live Preview; an accept inside a block nested in a callout or list item if the list triggers there at
   all.
8. Out-of-scope behaviours must be unchanged versus base, not worse: SC-678 (`max|_stamina` + accept),
   "no `: ` after a key accept", "already-present keys offered again". Report any difference.
9. The `/ds` suggester (`src/authoring/suggest.ts`) and the compendium search insert: unaffected?

### Probes aimed at this mechanism (the `accepted` memory)

10. Stale memory across editors: accept in note A (cursor left at line N, ch C), then switch to note B (or a
    second pane, or a second block) where line N has the identical text, put the cursor at ch C: is the list
    wrongly withheld there? Same question after closing and reopening the note, and with two panes on the
    same note.
11. Accept, then: arrow away and back to the same spot; click elsewhere and back; type one character and
    Backspace; Ctrl+Z and redo; an outside change to the note (another pane edits a different line; the
    same line). In each case say whether a list shows and whether Enter does what a user would expect.
12. The `close()` call: any console error or page error when `selectSuggestion` runs with the list already
    closed, or when the accept comes from a mouse click versus Enter? Is `this.context` cleared by `close()`
    in a way that breaks a second accept?
13. The implementer's follow-up, measure on a clean base build AND on the head: a key or value typed in
    full by hand (no accept), then Enter. On base, is Enter swallowed once, or every time until Escape? On
    head? Report both. (The owner has ruled this out of scope for the fix: it gets a Backlog ticket. Your
    measurement goes into that ticket; do not prescribe folding it in unless the head made it WORSE.)
14. AUTH-G17 pins "Tab does not accept a row" (Obsidian's own behaviour): say whether pinning it is
    sound or brittle.

### Also check

- The jest tests: does each new test fail on base for the reason it claims (check out the base file into a
  scratch worktree and run it)? Is any test vacuous (passes with the fix reverted)? Does the test editor
  model an empty-range insert the way real CodeMirror does?
- The flipped markers and new e2e tests in the patch: sound assertions, no arbitrary sleeps, ids unique,
  would each fail on SC-443's unfixed tip?
- Nothing from SC-443 leaked onto the land branch (no e2e authoring driver, no `stampControl` lines).
- `CHANGELOG.md` bullet: true, plain words, names what the user sees. No AI attribution in any commit.
- The diff applies on SC-443's tip with at most the trivial neighbour conflict in `schemaSuggest.ts`.

## 3. Gates to re-run yourself (land branch at `c1181989b7eb8711d8a15e6065ee56cfcae8c35b`)

Each as ONE blocking foreground call through a script file run as
`devbox run -c /home/scott/code/steelCompendium/worktrees/sc679-suggest-enter-double-value/draw-steel-elements -- bash <script>`,
output to a uniquely named log in your scratch folder.

| Gate | Expect |
|---|---|
| `npm run tsc`, `npm run lint` | clean |
| `npx jest` | `13711 passed / 2 skipped` in a worktree without the shots cache (13712 / 1 with it): base 13702 + 9 new, 0 failed |
| scratch tree: `npm run e2e -- --element=authoring` | `OBSIDIAN-E2E done: 77/79 ok, 0 failed, 2 known-bug, coverage: 46/464 pairs (partial run …)`; the 2 known-bug are SC-675's |
| land branch: full `npm run e2e` | `OBSIDIAN-E2E done: 658/667 ok, 0 failed, 9 known-bug, coverage: 418/418 pairs` (known load flakes: INIT-W10, SET-X03, SET-X04, INIT-W09, NEGO-R05; re-run once before calling one real) |
| lifecycle | re-run only the parts that touch editor typing / suggest if any exist (say which, or "none"); the implementer's full 64/64 stands otherwise. Verify its logs show seven parts with only their own ids |
| shots / freeze / parity | verify the implementer's `styles.css` byte-identity claim yourself (build base and head, compare sha256); if identical they carry (592; 280/280; 0 / 0 / 24) |

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
- Devbox: Node/npm are not on PATH. `devbox run -c <abs plugin dir> -- bash <script file>`; never
  `cd X && devbox run …`; an echoed `$?` inside `bash -c` is always 0, so capture `rc=$?` inside the script
  file and read each gate's own summary line. No pipes after a gate.
- Every git command as `git -C <absolute path> …`.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/5812b474-3aec-46a6-8f06-0ef85cf1e10a/scratchpad/sc679-r2-review/`.
  Everything you create goes there, uniquely named; never a generic name at the scratchpad root. The
  implementer's folder `…/scratchpad/sc679-r1-impl/` is read-only for you except running e2e in its scratch
  tree; prefer your own `git worktree add` copy of branch `sc679-on-sc443` if you need to edit specs.
- Write scratch files with the Write tool. No `rm` with a variable or glob; no `rm -rf` of a shared `/tmp`
  pattern. Never `pkill` / `killall` by pattern: kill only a PID whose `readlink /proc/<pid>/cwd` is inside
  your own scratch folder or the land worktree and that you started.
- No background jobs or monitors for gates; if the tool backgrounds a long call, poll its own log.
- The main checkout's `draw-steel-elements` dirt (`demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: expected, not a finding.
- Never tag, release, deploy, `just wt-finish` or `just sync`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc679-suggest-enter-double-value/sc679-r2-reviewer-report.md`.
It MUST open with an executive summary of at most 10 lines: VERDICT (APPROVE / APPROVE-WITH-FIXES /
REJECT), counts by severity, each gate's measured summary line, the one-line answer to "is any list on
screen after any accept".

Body: findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with file:line, a concrete failure
scenario (keystrokes -> what the note and cursor end up as), and a prescribed fix. Then the probe table
(probe -> measured result). Then `Follow-ups:` (things outside this ticket worth a ticket, each with a
one-line reason) — may be "none".

## 6. Return contract

Final text to the ticket-owner: raw facts only (VERDICT, finding counts, measured gate numbers), no prose,
plus the absolute path of every artifact you produced (report, logs, any screenshots, scratch trees).
