# SC-627 r1 implementer brief — Montage "Add a hero" refuses a duplicate name

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc627-montage-duplicate-hero/decisions.md`
  (the ledger: the ticket text and the owner's rulings — it is the spec; do not read the tracker).
- **You never call the tracker (Linear)** — not to read, not to post. The ticket-owner does that.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc627-montage-duplicate-hero`.
  Plugin: `.../sc627-montage-duplicate-hero/draw-steel-elements`, branch
  `sc627-montage-duplicate-hero`, at dse develop `7b9e82cf`. Verify `pwd`/branch before any
  write. First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `7b9e82cf`
  (if it moved, rebase onto it and say so in your report).
- Never edit anything under `/home/scott/code/steelCompendium/workspace/` (the shared main
  checkout) except writing your report into the ledger dir above. Its dse dirt
  (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`/`demo-vault/*.md`) is Scott's
  live vault — expected, not yours, do not report it.
- Read the dse plugin's `AGENTS.md`/`CLAUDE.md` and the `dse-verify` skill
  (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, ~460 KB —
  read it in parts: "The battery, in order", "Devbox wrapping", "Jest timeouts under load",
  "Lifecycle and e2e notes", "THE exit-code footgun", "Current expected numbers").
- Prior art (landed): SC-438 montage e2e (`e2e/specs/montage/`, `e2e/driver/montage.ts`),
  SC-625 (`src/elements/montage/model.ts` keeps unknown keys — never put a non-schema own
  property on the model or an entry), SC-626 (montage focus after a write).

## 2. The task

Ticket SC-627 verbatim (from the ledger):

> On a board that already has Kira, Add a hero → "Kira" → Add writes a second `- name: Kira`.
> The board then shows two Kira rows. [...] Expected: Add a hero refuses a name already on the
> board and says why (as it already refuses an empty name).

Implement the owner rulings in the ledger exactly (quote, do not reinterpret):

> 1. **Matching rule: trimmed, case-insensitive.** A typed name is "already on the board" when
>    `typed.trim().toLowerCase()` equals some existing hero's `name.trim().toLowerCase()`.
> 2. **How it refuses:** same channel as the empty name — the Add button is disabled while the
>    typed name is taken — plus an inline message saying why, reusing the existing
>    `.dse-mt__sheet-warn` element pattern from `LogActionModal.ts:236-252` (role="alert",
>    `hidden` when not shown). Message text: `Kira is already on the board` (the board's spelling
>    of the name). No new CSS: `styles.css` must stay byte-identical.
> 3. **Defence in depth:** the Add `onClick` re-checks, and the view's `onAdd` callback re-checks
>    against the LIVE model at commit time (the board can change while the modal is open) and
>    writes nothing on a duplicate. `addMontageHero` in `model.ts` stays a dumb append OR gains a
>    guard — implementer's choice, but no write may happen for a duplicate.
> 4. **Existing names = hero entries only** (`isHero` items with a string name); bare non-hero
>    items in `participants:` (SC-610 shapes) are ignored, never crash.
> 5. **Out of scope:** boards that ALREADY hold duplicate names (hand-written YAML) — leave
>    behaviour unchanged; Enter in the name field (SC-632); outside-edit focus (SC-650); skill
>    casing warning (SC-631); type coercion (SC-628).

Code pointers: `src/elements/montage/ConfigModals.ts` (`MontageAddHeroModal`, Add button
disabled on empty), `src/elements/montage/view.ts:~476` (`openAddHero`), `model.ts:~586`
(`addMontageHero`), `LogActionModal.ts:232-252` (warn element pattern). Give the modal the
taken-check as a function evaluated against the live model (not a snapshot array), so a hero
added by an outside edit while the window is open counts.

Tests:
- **jsdom** (`test/dom/elements/…` montage suites): exact duplicate, casing variant, padded
  (`"  Kira  "`) all disable Add and show the message; a fresh name hides the message and
  enables Add; deleting back to a fresh name clears the message; the view callback writes
  nothing for a duplicate even if the modal check is bypassed; a non-hero bare item in
  `participants` does not crash and does not count as a name. Each must fail on `7b9e82cf`
  (prove it: run the new tests against the unfixed source, e.g. `git stash` the src change, and
  record the red count).
- **e2e**: flip `knownBug('SC-627', '[MONT-H07] …')` in `e2e/specs/montage/add-hero-modal.e2e.ts`
  to a plain `it(...)` and strengthen it: the Add button is disabled and the warn message is
  visible with the expected text, and no write happens (`dse.expectNoWrite`). Add at most 2–3
  more e2e tests (casing variant refused; typing on to a fresh name re-enables Add and adds
  exactly one hero). New scenario ids must be globally unique (grep `e2e/` for the id first:
  continue the `MONT-H*` series). **Never put a bracketed ticket id like `[SC-627]` in a test
  title** — the runner reads bracketed ids in titles as scenario ids.
- No lifecycle scenario is needed (if you think one is, stop and say so; id G-S129 is reserved
  for this ticket).

Commit after every coherent step (fix, jsdom tests, e2e), in the plugin repo on branch
`sc627-montage-duplicate-hero`, messages prefixed `fix(SC-627):` / `test(SC-627):`. No
co-author or AI attribution trailers. Do not push. Do not touch the superproject.

## 3. Gates (dse-verify battery, all against your worktree's plugin)

Baseline at `7b9e82cf`: tsc + lint clean · jest **12681 passed / 2 skipped** (fresh worktree,
before shots) · lifecycle **64/64** · e2e `OBSIDIAN-E2E done: 484/504 ok, 0 failed, 20 known-bug,
coverage: 287/287 pairs` · shots **592**, host-leak 163/978, modal host-leak 40/240, capture
clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Expected after your change: tsc/lint clean; jest = 12681 + your new tests passed, 2 skipped
(fresh) — report the exact number; lifecycle 64/64; e2e `(485+N)/(504+N) ok, 0 failed, 19
known-bug, coverage: Y/Y pairs` where N = new e2e tests (report Y; it may grow if you add a
new control pair — say why); `styles.css` byte-identical to a `7b9e82cf` build (report both
sha256); shots 592 with host-leak/modal host-leak/capture clip numbers as above or explained;
freeze 280/280 (0 FAILED); parity 0/0/24 LAST.

Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign; with a space the runner silently
runs the whole suite — check the log's first lines show only your part's ids):
1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4) 7. `G-S108,G-S112,G-S115` (3).
Take the exact id lists for parts 1 and 2 from the dse-verify skill (it lists them). Comma
separated. G-S56 stays LAST in part 4. One part per Bash call, output redirected to a log file;
part 7 takes about 200 s, over the 180 s tool limit, so start it with output to a log and wait
with `timeout 175 tail --pid=<YOUR node pid> -f /dev/null` repeated (your pid = the one whose
`/proc/<pid>/cwd` is your worktree's `draw-steel-elements`).

Known flakes / traps:
- G-S91 FAIL is real unless it says the host was too slow after two re-runs.
- G-S115 (g) suspected flake (SC-633): one re-run of part 7 on a loaded host; anything else is real.
- INIT-W10 e2e flaked once under heavy load (SC-654): one re-run of the init spec allowed.
- SC-622: the Obsidian camera can leave `demo-vault/.obsidian/appearance.json` dirty in YOUR
  worktree, which made G-S97 fail; `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming the change.
- Jest timeout is 30 s: "Exceeded timeout" is a real hang until proven otherwise.
- `rm -f main.js styles.css` (literal names, in the plugin root, via `git -C`-free plain path) before `npx jest` — stale build shadowing (dse-verify).
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc627-montage-duplicate-hero/draw-steel-elements -- bash /abs/path/script.sh`.
  Devbox eats `$?`/`$PIPESTATUS`; never pipe a gate. Record exit codes from a SCRIPT FILE
  (`rc=$?` inside the file), and read each gate's own summary line as the truth.
- Every git command as `git -C <absolute path>`; never `cd X && git …`.

## 4. Scratch, reports, safety

- Your private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc627-r1-impl/`
  — uniquely named scripts and logs inside it (e.g. `sc627-r1-jest.sh`, `sc627-r1-e2e.log`).
  Write scratch files with the Write tool.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and never
  `rm` with a shell-variable path. Leave throwaway files in place; overwrite logs with `>` or
  use fresh names. (The only allowed rm is the literal `rm -f main.js styles.css` in your
  plugin root.)
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside your worktree.
- Run each gate as one blocking foreground call (split lifecycle into its parts, e2e and shots
  in their own calls). No `run_in_background`, no `Monitor`. Redirect long output to a file
  rather than streaming it (the 600 s stream watchdog kills silent agents). If a call is moved
  to the background by the tool, poll the gate's own log / your pid — never wait on a
  notification, and never key a wait on a scratch filename that might pre-exist from another
  session: use per-run unique log names.
- Report file: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc627-montage-duplicate-hero/sc627-r1-implementer-report.md`.
  It must open with a ≤10-line executive summary. If the write is blocked, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose. Verdict; commit
shas (plugin branch head); each gate's measured summary line; the red count of your new tests
against unfixed source; styles.css sha256 before/after; `Drive-by fixes:` and `Follow-ups:`
lists; and the absolute path of every evidence artifact (logs, report). If you need input
mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question — you cannot
`SendMessage` me (a message to `main` reaches the dispatcher, not me; if you ever send one,
its first word must be `SC-627:`).
