# SC-628 r1 implementer brief — montage: hand-typed values of the wrong type

You are the r1 implementer for Linear ticket SC-628. Your final text goes to the ticket-owner, not a human.

## 1. Context loading (do this first)

- Read the decisions ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc628-montage-wrong-type-values/decisions.md`.
  It is the ONLY source of the rulings; it quotes the ticket. **You never call the tracker** (Linear) — not to read
  history, not to post. Everything you need is in the ledger and this brief.
- Read `/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values/draw-steel-elements/AGENTS.md` (or
  CLAUDE.md) and the battery section of the `dse-verify` skill:
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 1–245 (the battery table,
  devbox wrapping, jest timeouts, lifecycle/e2e notes, exit-code footgun) and the section "Current expected numbers"
  (starts ~line 1529; read only the CURRENT paragraph). The file is ~470 KB: read it in parts, never whole.
- Worth a look for the shared approach (read-only, not yours to edit): the negotiation twin's ledger
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/decisions.md` and its
  report `sc638-r1-implementer-report.md` in the same dir. Note: that twin's `e2e/driver/dse.ts` `openNote` change
  (an error card counts as drawn) is on ITS branch, not on develop — if you need the same thing, make it yourself and
  say so in your report.
- Prior montage art (landed; read only what you need): `src/elements/montage/model.ts` header comments (SC-482 omit
  rule, SC-625 unknown-key carry), `docs/superpowers/dse-overhaul/build-ledgers/sc625-montage-unknown-yaml-keys-ledger.md`.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values`, branch
`sc628-montage-wrong-type-values` in every submodule. All code work is in
`/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values/draw-steel-elements`. Verify with
`git -C <that path> branch --show-current` before any write. **Never** write under
`/home/scott/code/steelCompendium/workspace/` except your report file in the ledger dir. The workspace-level files
(CHANGELOG.md) live in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc628-montage-wrong-type-values/CHANGELOG.md` — never under
`/home/scott/code/steelCompendium/workspace/`. The main checkout's dse dirt (`demo-vault/Welcome.md` modified,
untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

**Fetch first:** `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is `afd1436c`
(the branch is cut there). If develop has moved, rebase onto it and report the new base. Superproject: `git -C
<worktree> fetch origin`; origin/main is `c1825403` at dispatch.

**A fresh worktree has no `node_modules`**: run `npm ci` in the plugin dir once before the first gate, through a script
file (`devbox run -c <abs plugin dir> -- bash <abs script>`), output to a log.

## 2. The task

Implement the owner rulings M1–M4 in the ledger (quoted here verbatim — the ledger wins if they ever differ):

> **M1. Scalar title → shown as text.** A number or boolean `title:` (`2024`, `true`, `3.5`) is shown as its text
> ("2024", "true", "3.5") wherever the title appears (head, aria labels, the error-card / Notice prefix, any modal
> title that names the montage). `null` / absent / empty keeps today's behaviour. Same for any other text the montage
> reads from the block top level (`description` is already handled; check nothing else breaks).

> **M2. Quoted number → read as a number.** In the six number keys (`rounds`, `success_limit`, `failure_limit`,
> `successes`, `failures`, `current_round`) a string that is a plain finite number after trimming (`"3"`, `" 3 "`,
> `"0"`) is read as that number. Every reader (board columns, tallies, outcome, limits window pre-fill, round
> arithmetic) sees a number; no `+=` ever concatenates. A string that is NOT a number (`banana`, `""`) is read as the
> parser default for that key (the same value an absent key gets: rounds 2, limits 0, counters 0, current_round 1). A
> boolean, map or list in a number key is read the same way (as the default).

> **M3. Untouched values are written back as typed.** A value the montage did not change on that write is written
> back with the same value AND type the user typed: `title: 2024` stays `title: 2024` (never `"2024"`),
> `current_round: "1"` stays `"1"` after Add a hero, `rounds: banana` stays `banana` after a write that does not touch
> rounds. A value the montage DOES change is written as a plain number (`rounds: "3"` + Add a round → `rounds: 4`).
> SC-482's omit-absent-defaults rule is unchanged. (Value-level only: formatting, comments and quotes stay SC-599's —
> same boundary as SC-638 R2.) **SC-625 constraint:** `model.ts` carries unknown keys as own properties of the model
> and each entry, so never add a non-schema own property to the model or an entry to remember the typed value — use a
> module-private WeakMap (SC-637's negotiation approach) or extend the existing `recordingDefaults` record.

> **M4. A map or list where the title should be → plain error card naming the key; the card writes nothing.** Same
> form as SC-638 R3 / encounter's `Invalid data: … must be …` (e.g. "Invalid data: 'title' must be text."). No raw
> JavaScript message (`is not a function`, `Cannot read properties`, `_a.`) reaches the card. A map or list in a number
> key follows M2 (read as the default), NOT an error, and is written back as typed per M3.

> **Scope: montage only.** No negotiation code (SC-638 is the negotiation twin, another owner; its files are not
> ours). Do not extract a shared helper into the framework or out of another element; a montage-local helper (or reuse
> of an existing framework helper) is fine. Out of scope: SC-629, SC-631, SC-650 (other montage bugs), SC-630, SC-632
> (design questions), SC-599 (formatting), SC-652. Entry-level and participant-level wrong types (`round: "2"` on a
> logged action, `name: 5` on a hero) are NOT in the ticket: r1 reports what they do today as a Follow-up (no fix),
> and I rule on them then.

> **Markers:** `[MONT-W01]`, `[MONT-W02]` flip to plain tests (remove the `knownBug('SC-628', …)` wrapper; their
> assertions stay unless they contradict M1–M4). Update the file header comment so it no longer describes them as
> markers. New tests at unit + jsdom level for every input above; new e2e for: `title: true` (or a float) renders and
> round-trips unchanged after a write; `current_round: "1"` + End round → `current_round: 2`; `successes: "2"` (or a
> limit) + the write that increments it → a number; one M3 round trip (`title: 2024` stays `2024` after a write); one
> M4 error card (map title: plain error naming `title`, note byte-identical after the test's interactions). New e2e ids
> continue `MONT-W04…` (W03 is SC-629's). Never a bracketed ticket id in a test title. New fixtures under the e2e
> montage vault next to `wrong-title.md` / `quoted-rounds.md`.

> **CHANGELOG** bullet under `## Unreleased` in the worktree superproject (one bullet, user-facing). ONE dse pointer
> bump at land-ready, superproject on current workspace origin/main, no interim pointer commits.

Notes:
- TDD: write the failing unit / jsdom tests first, watch them fail on the base, then fix.
- If adding jsdom `test.failing` markers is NOT what you want here — there are none for SC-628 today; just add plain
  tests. `[MONT-W03]` and any SC-629 / SC-631 markers stay exactly as they are.
- The e2e runner reads test titles for scenario ids; ids are global. Grep `command grep -a -rn "MONT-W0" e2e/` before
  choosing ids. If a new fixture needs a coverage-manifest row, it does not — fixtures are not controls; coverage must
  stay 416/416.
- If the suspected entry/participant wrong types (`round: "2"`, hero `name: 5`) produce a raw JS error or LOSE data on
  a write, say so loudly in Follow-ups with the exact input and what happens — do not fix them.
- Commit after every coherent step (the dse branch and, separately, the superproject CHANGELOG commit). Commit
  messages: conventional, prefixed with the ticket (`fix(SC-628): …`, `test(SC-628): …`). No Co-Authored-By or
  AI-attribution trailers (Scott's rule). Do NOT make the superproject pointer-bump commit — the owner asks for that
  separately at land-ready; but DO commit the CHANGELOG bullet in the superproject branch.
- Lifecycle id G-S132 is reserved if — unexpectedly — you need a lifecycle scenario. Expected: none.

## 3. Gates (dse-verify battery) and expected numbers

Baseline at `afd1436c`: jest **12922 passed / 2 skipped** fresh (12923 / 1 with the shots cache) · lifecycle
**64/64** · e2e **`570/593 ok, 0 failed, 23 known-bug, coverage: 416/416 pairs`** · shots 592, host-leak 163/978,
modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.

Expected after your change: tsc + lint clean (incl. `tsc -p e2e` and lint of `e2e/` if the skill says so) · jest
12922 + your new tests, 2 skipped fresh · lifecycle 64/64 · e2e known-bug **21**, ok **572 + N**, total **593 + N**
(N = your new e2e tests), `0 failed`, coverage **416/416** · if the built `styles.css` is byte-identical to a clean
`afd1436c` build (compare sha256), shots/freeze/parity carry and need not run; otherwise run them and expect the
baseline numbers.

Order: tsc, lint, jest (`rm -f main.js styles.css` in the plugin root before `npx jest`), lifecycle (seven parts),
e2e (full run, no `--only`), then shots/freeze/parity only if styles.css changed.

**Lifecycle runs in SEVEN parts with `--only=` — equals sign; with a space the runner silently runs the whole suite.**
Check the first lines of each part's log name only that part's ids. Parts (ids comma-separated, keep this order):
1. `G-S7a … G-S9a` (21 ids — take the exact list from the skill's battery row / `visual-harness/obsidian-lifecycle.mjs`
   SCENARIOS order)
2. `G-S9b … G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3)
Report the union (must be 64/64). The Bash tool backgrounds any call over 180 s: run ONE part per call, output to a
unique log, and poll your OWN node pid (`/proc/<pid>/cwd` inside your worktree) with
`timeout 175 tail --pid=<pid> -f /dev/null`, then read the log. Never wait for a background-completion notice.

Known flakes (re-run before believing, then report both runs):
- G-S91 FAIL is a real signal, unless it says the host was too slow after two re-runs.
- G-S115 (g) suspected flake (SC-633): re-run part 7 once on a loaded host; any other failure is real.
- INIT-W10 e2e flaked once under heavy load (SC-654).
- SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty in YOUR worktree, which
  makes G-S97 fail; `git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` before blaming the change.
- Jest's default timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise — re-run that
  suite alone first.

e2e also takes long: run it as one call with output to a unique log and the same pid-poll pattern.

## 4. Footguns (every one has cost real time)

- **Exit codes:** devbox's wrapper eats `$?`/`$PIPESTATUS`; `| tail` eats failures. Run each gate via a script FILE
  that captures the code (`devbox run -c <abs plugin dir> -- bash <abs script>`), or read the gate's own summary line
  (jest "Tests:", `OBSIDIAN-LIFECYCLE done:`, `OBSIDIAN-E2E done:`).
- **Scratch:** put scripts and logs in a private subfolder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc628-r1-impl/`
  with unique names. Write scratch files with the Write tool, not heredocs.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and never `rm` with a shell-variable
  path — the permission prompt hangs a background worker forever. Leave throwaway files in place; overwrite with `>`.
  The one sanctioned delete is the literal `rm -f main.js styles.css` inside the plugin dir before jest (use the literal
  absolute paths).
- **Git:** always `git -C <absolute path>`, never `cd X; git …`. Never `cd` inside a compound command; use
  `devbox run -c <abs path>`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose `/proc/<pid>/cwd` or command line is
  inside your worktree.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is pre-populated across sessions and
  branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run
  unique path.
- **Redirect long-running output to a file** rather than streaming it — the 600 s stream watchdog kills silent agents.
- **No background jobs or Monitors for gates.** Run each gate as a foreground call; where the tool backgrounds it
  anyway (>180 s), poll your own pid as above.
- Never `git checkout -- .`; never edit generated output; never tag or release `draw-steel-elements`.
- If the report-file write is blocked by your harness, return the report inline.
- **You cannot `SendMessage` me** — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher,
  not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I
  will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-628:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc628-montage-wrong-type-values/sc628-r1-implementer-report.md`.
It must OPEN with a ≤10-line executive summary: verdict, dse head sha + base, superproject CHANGELOG sha, gate numbers
(jest passed/skipped, lifecycle union, e2e done line verbatim, styles.css sha vs base), count of new tests by level.
Then: commits (sha + subject), the design (where the typed value is remembered, how serialize writes it back), a table
of every input from the ruling and what the card shows / what a write produces, `Drive-by fixes:`, `Follow-ups:`
(incl. the entry/participant wrong-type survey), and the absolute path of every log and evidence artifact.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only (verdict, shas, measured numbers), no prose,
plus the absolute path of the report and of every evidence artifact (logs, failure bundles). Start with
`STATUS: DONE` / `STATUS: BLOCKED` / `STATUS: NEEDS_CONTEXT`.
