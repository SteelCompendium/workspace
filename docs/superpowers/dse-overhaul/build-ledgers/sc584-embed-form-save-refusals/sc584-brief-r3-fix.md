# SC-584 r3 — fix round on the r2 review, after a rebase onto dse develop a339e7b3 (implementer)

Your final text goes to the ticket-owner: raw facts, no prose. **Workers never call the tracker.** This brief is
self-contained and replacement-ready; all binding footguns of sc584-brief-r1-impl.md §4 still apply (re-read them).

## 1. Context to load
Ledger dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc584-embed-form-save-refusals/
- decisions.md — read all; "Owner rulings on r2" is your spec (quoted below too).
- sc584-r2-review-report.md — the findings with their file:line, scenarios and prescribed fixes; the probe file
  sc584-r2-probe.test.ts.txt holds P1 P1d P2 P2n P3 P4 P5 P13 P14 as jest tests you can adapt; sc584-r2-mutate.py.txt
  and sc584-r2-mutants.log hold the reviewer's mutants (mA … mJ).
- sc584-brief-r1-impl.md (original task, footguns §4) and sc584-r1-impl-report.md (your r1 report).

Worktree: /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals, branch
sc584-embed-form-save-refusals; dse HEAD 525115b0, superproject 0c430d0d.

## 2. Step 0 — rebase
SC-572 landed: dse develop is now **a339e7b3** (was eeed5182). It changes the minion pool modal and adds e2e
POOL-C05/C06. `git -C <dse> fetch origin`, `git -C <dse> rebase origin/develop` (expect a339e7b3; if develop moved
further, rebase onto it and report the sha). If package.json changed, `npm ci`. Build a clean a339e7b3 styles.css
(e.g. `git archive a339e7b3` into your scratch folder, build) for the CSS comparison — the old 4295ca33 no longer
applies if SC-572 changed CSS.

## 3. The task — owner rulings on r2, verbatim from the ledger
- "HIGH-1 (…): FOLD into r3 — regression of SC-556's host guarantee. Take the reviewer's fix (a): record the host's own
  last write inside `Vault.process` ({note text after the write, line of the written block}); in `rebasePin`, when the
  part is stale and the body at open equals that write's body, rebase the pin onto that write's note text and line,
  so mapLine/pinnedTarget judge every outside edit since the +. Remove `openTimeBodyLine` unless a case it alone covers
  is needed — and then it must refuse P1/P1d/P2/P2n/P3 (no block-only placement; `^id` marker required for a `#^id`
  link). Add P1, P1d, P2, P2n, P3 as refusal tests; case 1 (short note, heading hover, whole long-note hover F3) still
  lands."
- "MEDIUM-1 (…): FOLD — reword to what the code guarantees after r3." (dse CHANGELOG.md, superproject worktree
  /home/scott/code/steelCompendium/worktrees/sc584-embed-form-save-refusals/CHANGELOG.md, sc584-dse-verify-proposal.md)
- "MEDIUM-2 (…): FOLD the proposal correction. The bug itself: FILED SC-595 (Backlog, Medium). Out of scope for SC-584."
  (a mouse CLICK inside a form opened from a hover closes popover and form; typed text lost; keyboard path works)
- "LOW-1 (plain `![[Note#^a]]` embed with a twin, stale part one line longer than the block now -> refused; base saved;
  jest P5): FOLD — search the `^id` marker after the part's end only for a block inside a callout/quote; a plain fenced
  block keeps base behaviour (after its closing fence). P5 test lands."
- "LOW-2 (mutants mA, mF, mG, mH survive): FOLD — after r3, each surviving mutant of code that still exists is killed
  by a test or shown equivalent."
- "LOW-3 (test name says form-open only, but `:694` also places card (+/-) write pins via the rule): FOLD — state and
  test the card-write behaviour of the r3 mechanism; card writes must be no wider than base for twin shapes (SC-480
  guarantees; G-S73 green). Rename the test."
- "LOW-4 (lifecycle control (zc) is vacuous — the form closes with the embed's redraw): FOLD — replace with a jest host
  control with teeth (P13-style); drop (zc) or keep it only labelled as a no-write smoke check with a comment saying
  why it is not a control. Pre-existing (z): comment only."
- "INFO-1 … and INFO-3 …: FILED SC-596 (Backlog, Low). r3 covers INFO-3 only where fix (a) naturally gives the + then
  pencil callout case a pin from the host's own write; no general null-pin change in SC-584."
- "INFO-2 (…P14): appended to SC-594's agent notes. Out of scope."
- "F3 (whole long-note hover `[[long note]]` scrolled to the card: HEAD saves, base refused; uncovered): FOLD — jest
  host test required; lifecycle phase optional (G-S77 in part 5 if added; part 3 stays as is)."

Out of scope (do not touch): SC-594 (card writes in hover previews), SC-595 (hover popover closes on a click inside
the form), SC-596 (block-only part edited before open without a +; general null-pin forms).

Design notes for fix (a), to settle in your report:
- Which writes count as "the host's own last write": a card (+/-) write of THIS host, completed inside
  `Vault.process`. A write by a sibling host (another pane's card of the same block) does not — then refuse as today.
  Say how long the record lives (cleared on the next outside modify? on re-render?) and why it cannot go stale into
  a later, unrelated form open.
- The pin from the record is a whole-note pin of the record's note text; every outside edit since then is judged by
  the existing `mapLine` / `pinnedTarget` (pin-only, body check). P1-P3 must refuse BECAUSE of that judgement.
- Keep the r1 jest tests that still describe intended behaviour; delete or rewrite those tied to `openTimeBodyLine`
  if you remove it, and say which.

## 4. Gates — full battery per dse-verify on the rebased branch. Expected:
- tsc (incl. `-p e2e`), lint (incl. `e2e/`) clean.
- jest: a339e7b3 CURRENT is 7082 passed / 1 skipped WITH the shots CSS cache (fresh worktree: one fewer passed, 2
  skipped) + your net new tests. SC-568 load timeouts possible — re-run those suites alone.
- lifecycle 53/53 (54/54 with G-S77) in five `--only` parts, each its own foreground call: `G-S7a … G-S9a` (21);
  `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4);
  `G-S59 G-S49 G-S73` (3, + G-S77 if added, before G-S56 in SCENARIOS order). Report wall times.
- e2e `OBSIDIAN-E2E done: 254/262 ok, 0 failed, 8 known-bug, coverage: 163/163 pairs`.
- styles.css sha equal to your clean a339e7b3 build -> shots 592 / host-leak 163/978 / modal host-leak 39 kinds / 234
  comparisons / capture clip 147, freeze 280/280, parity 0/0/24 carry (say so). If it differs, STOP: NEEDS_CONTEXT.
- Red on base: the new refusal tests P1 P1d P2 P2n P3 PASS on a339e7b3 (base refused) and FAIL on 525115b0 rebased
  (show it: run them once against the r1 source on the new base, keep the log). Case-1 / F3 / P5 landing tests FAIL on
  a339e7b3.
- Mutations: re-run m1-m6 where the code still exists, plus mA mF mG mH (sc584-r2-mutate.py.txt), plus at least one
  of your own on the last-write record (e.g. accept a sibling host's write; do not clear the record).

Commits on the dse branch (one coherent step each, no AI attribution, no tags, no pushes). Superproject: CHANGELOG.md
only; no dse pointer bump.

## 5. Scratch, report, return
- Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc584-r3-implementer/
  (create it; unique script names). Gate logs: ledger dir, sc584-r3-gate-<name>.log.
- Report: ledger dir sc584-r3-fix-report.md, ≤10-line executive summary first; then one line per ruling (FIXED how /
  why not), design of fix (a), commits, gate lines, red-on-base, mutants, `Drive-by fixes:`, `Follow-ups:`.
- Footgun reminders: no compound `cd` (`git -C`, `devbox run -c <abs dse path> -- bash <script>`); no `rm` with a
  variable target, no glob `rm` under /tmp; one gate per Bash call in the foreground, no background gates or Monitor —
  if the harness backgrounds a long call, poll that process's own log until it ends; never set DSE_LIFECYCLE_PORT;
  private DSE_CAMERA_TMP if you run shots; kill by literal PID only (SC-575 and others run Obsidian concurrently);
  never `rm -rf` under `.superpowers/`; never key a wait-loop on a scratch filename; you cannot SendMessage me — end
  with STATUS: NEEDS_CONTEXT if you need input (any stray message starts with `SC-584:`); if the report write is
  blocked, return it inline.
- Return: STATUS, new base sha, dse HEAD, superproject HEAD, `git status --porcelain` both, each gate's summary line,
  absolute paths of every evidence artifact.
