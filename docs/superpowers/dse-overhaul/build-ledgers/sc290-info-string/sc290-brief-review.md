# SC-290 independent review brief

## 1. Context loading

- Read: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/decisions.md` (ledger; spec
  quoted verbatim), the implementer brief `sc290-brief-impl.md` and report `sc290-impl-report.md` in the same dir,
  and `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rereview-report.md` § N-6
  (the original finding and its probe).
- Battery reference: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc290-info-string/draw-steel-elements`, branch
  `sc290-info-string`, head **013063a**, base `origin/develop` **0d69ec9**. Review `git -C <path> diff 0d69ec9..013063a`.
- **You did not write this code. You are an adversarial reviewer: execute and probe, do not just read.**
- Every git command uses `git -C <absolute path>`. Do not commit to the branch; do not push. Probe scratch goes in a
  per-run unique dir under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/` prefixed
  `sc290-review-`. Never write elsewhere in the main checkout.
- **You never call the tracker (Linear).**

## 2. The task

Spec (ticket, verbatim):

> Both `SidebarBlockHost.replaceSource` and `ReadingModeBlockHost.replaceSource` re-emit the fence line as
> `${fence}${language}` from an `OPEN_FENCE = /^([`~]{3,})(\S*)/` first-token parse, so any interactive write to a
> block whose fence carries an info string past the language token (e.g. ```` ```ds-counter extra ````) rewrites the
> fence line and silently drops the extra tokens.
>
> Fix: preserve the full info string in both `replaceSource` re-emits.

Probe at minimum:
1. **Every fence writer.** Independently grep for every place an opening fence line is reassembled (both hosts, Live
   Preview host, pipeline, any prefs/serialize path). Did the fix miss one?
2. **Integrity probes** (this writes into user files): content above and below the block survives a write; two
   same-language blocks with DIFFERENT info strings in one note don't cross-talk (a write to block 2 leaves block 1's
   fence intact, and vice versa); identical-twin blocks differing only by info string — does locating the block
   (body match / line match) still find the right one?; a hand-edited info string survives a re-trigger; CRLF line
   endings; trailing whitespace on the fence line; tabs between tokens; tilde fences; 4+ backtick fences; a fence
   with info string inside a callout / blockquote (`> ```ds-counter extra`) if the hosts support those.
3. **Does preserving the info string change block LOCATION or identity anywhere?** (e.g. code that matches the
   fence line by `${fence}${language}` equality to find the block again after a write).
4. **The tests are not vacuous**: check out the base versions of the source files only (keep the new tests), run the
   new tests, confirm they fail; restore.
5. **Real Obsidian**: run `npm run e2e` and `npm run obsidian-lifecycle` yourself (own `DSE_LIFECYCLE_PORT`, e.g.
   9293). If the implementer added an e2e test, confirm it fails on base. If not, write a throwaway probe (scratch
   vault, not committed) showing a `ds-counter extra` fence survives a real click write in Reading mode, and report it.
6. Re-run tsc, lint, jest; confirm the implementer's numbers.

Expected numbers (base): tsc/lint clean · jest 4732 passed / 1 skipped / 227 of 228 suites + the branch's new tests ·
lifecycle 25/25 · e2e `59/71 ok, 0 failed, 12 known-bug, coverage: 47/47 pairs` (+ whatever the branch added) ·
freeze `276/276 OK` · parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 3. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; run every gate in the FOREGROUND in one tool call (timeout up to 600000 ms).
  Never background a gate and end your turn waiting for a notification.
- Devbox eats exit codes; piping eats failures — wrapper script files or redirected output, read the summary lines.
  Shape: `devbox run -c <dse path> -- bash -c 'cd <dse path> && <cmd>'`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc290-info-string/`.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` anything in `.superpowers/` outside your own
  `sc290-review-*` dir.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. Any message you send anyway starts with `SC-290:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc290-info-string/sc290-review-report.md`, opening with a
≤10-line executive summary (verdict APPROVE / FIX-REQUIRED, counts by severity, gate lines). Findings by severity
(BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, a concrete failure scenario, and a prescribed fix.

## 5. Return contract

Final text to the ticket-owner, raw facts: verdict, head sha reviewed, findings list (severity, file:line, one line
each), each gate's summary line as you measured it, and the absolute path of every artifact (report, probe logs).

## 6. Implementer judgment calls to scrutinize (from sc290-impl-report.md)

- Trailing whitespace on the fence line is still dropped on write (keeps language-only output byte-identical). Is
  that consistent with "preserve the full info string" (CommonMark trims the info string)? Any case where it bites?
- A fence with a space before the language (```` ``` ds-counter ````) used to LOSE its language on write; it now
  round-trips unchanged. Confirm that is a fix, not a regression in how the block is matched/rendered.
- Already known and being ticketed separately — do NOT report as new findings, but say if the diff makes them worse:
  dead `src/utils/CodeBlocks.ts` with the same re-emit bug; `SidebarBlockHost` cannot locate a block in a CRLF note
  (pre-existing); `dse.expectNoteBlock` / `makeFakeContext` don't recognise info-string fences.
