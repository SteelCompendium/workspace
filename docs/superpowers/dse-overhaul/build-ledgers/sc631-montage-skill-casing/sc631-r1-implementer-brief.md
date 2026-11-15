# SC-631 r1 — implementer brief: the montage "skill already used" warning ignores casing and spaces

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose,
plus the absolute path of every evidence artifact you produced. You never call the tracker (Linear) — not to
read history, not to post. Everything you need is in this brief and the ledger.

## 1. Context loading

- Ledger (read first, it is the current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc631-montage-skill-casing/decisions.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing` — branch
  `sc631-montage-skill-casing` in the superproject and every submodule. The plugin is
  `<worktree>/draw-steel-elements`, at dse `develop` `3e88b3f5`. Superproject at workspace main `7cea83eb`.
- First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `3e88b3f5`;
  if it moved, `git -C <worktree>/draw-steel-elements rebase origin/develop` and say so in the report.
- Verify paths before any write. **Never edit anything under `/home/scott/code/steelCompendium/workspace/`**
  except your report in the ledger dir. The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's
  superproject: `/home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing/CHANGELOG.md`.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections "The battery, in
  order", "Devbox wrapping", "Stale main.js", "Jest timeouts under load", "Lifecycle and e2e notes", "THE
  exit-code footgun", and "Freeze semantics" as needed. The file is ~370 KB: read it by line range
  (`grep -n '^##'` for headings).
- Prior art, landed (ledgers in `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`):
  SC-627 (`sc627-montage-duplicate-hero*` — same trimmed, case-insensitive rule for hero names; see
  `model.ts` ~:689), SC-438 (montage e2e), SC-628 (typed values), SC-629.

## 2. The task

Ticket (verbatim): "In the Log an action window, the montage warns when a hero uses a skill they already used.
It compares the text exactly, so "nature" after "Nature" gets no warning. The warning never blocks the log, so
nothing breaks; the Director just misses the reminder. Expected: the warning ignores casing (and probably
surrounding spaces)."

Rulings (from the ledger, verbatim):

1. "**Matching rule: trimmed, case-insensitive** — the SC-627 rule. A typed skill is "already used" when
   `typed.trim().toLowerCase()` equals some entry of the hero's `skills_used` compared the same way. The
   `excluding` subtraction (editing an entry) uses the same comparison."
2. "**The warning names the skill as the board stores it** (the SC-627 "board's spelling" rule): typing
   "nature" after "Nature" shows `Kira already used Nature in this montage — reuse is not allowed`."
3. "**Warn, never block — unchanged.** No write-path change: the logged skill is recorded as typed (as
   today); `skills_used` is not deduplicated or recased. Log stays enabled."
4. "**Never crash on odd YAML**: non-string or blank items in `skills_used` (SC-610 / SC-628 shapes) are
   ignored by the comparison, as today."
5. "**Tests**: the jsdom `[K04]` marker becomes a plain test (drop "known bug SC-631" from its title);
   unit tests on `wouldReuseSkill` for casing, padding, the edit exclusion in other casing, odd items; one
   new e2e `MONT-L12` in `e2e/specs/montage/log-modal.e2e.ts` (padded other-casing skill shows the warning
   in the board's spelling, Log stays enabled). Never a bracketed ticket id in a test title."
6. "**User-facing**: one CHANGELOG bullet under `## Unreleased`."
7. "**Out of scope**: SC-650, SC-655, SC-658, SC-630, SC-632; exact-match removal on undo/correct/remove
   (report as a follow-up if it matters)."

Where: `src/elements/montage/model.ts` `wouldReuseSkill` (~:602) and its caller
`src/elements/montage/LogActionModal.ts` `refreshSkillWarning` (~:244). Ruling 2 means the model must tell the
modal WHICH stored skill matched (e.g. a sibling helper returning the matched stored string or `undefined`,
with `wouldReuseSkill` kept as a boolean wrapper if other callers/tests use it — your choice; keep the API
small). Reuse or share the SC-627 normalisation (~:689) rather than writing a third copy if that stays tidy.
Update the doc comments. Check the edit-sheet case: an entry logged as "Nature", reopened for edit, typed
"NATURE" must NOT warn against itself; a hero with "Nature" used twice (once in the edited entry) still warns.

Tests:
- jest unit (`test/unit/model/montage-tally.test.ts`, next to the existing `wouldReuseSkill` tests): other
  casing, surrounding spaces, stored value with spaces/other casing, the edit exclusion in other casing, a
  `skills_used` holding a number / null / blank string, and a non-match ("Nature" vs "Natures").
- jsdom: flip `test.failing('[K04] …[known bug SC-631]')` in `test/dom/elements/montage-matrix.test.ts` to a
  plain `test`, title without the ticket id; also assert the warning text names "Nature" (board spelling).
- e2e: new `it('[MONT-L12] …')` in `e2e/specs/montage/log-modal.e2e.ts` modelled on MONT-L04 (~:67): type
  `' nature '` for Kira (who used "Nature"); the warning shows with textContent
  `Kira already used Nature in this montage — reuse is not allowed`; Log stays enabled. Keep it short.
- CHANGELOG bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`, plain words, matching
  the style of the SC-629 / SC-627 bullets already there.

Report anything else you notice as `Follow-ups:`; obviously-correct local fixes in files you touch as
`Drive-by fixes:`.

## 3. Gates (dse-verify, full battery, in order) and the numbers to expect

Fresh worktree: run `npm ci` in `<worktree>/draw-steel-elements` once first (through
`devbox run -c <abs plugin dir> -- bash <script file>`, output to a log).

Baseline at `3e88b3f5`: tsc (incl. `tsc -p e2e`) and lint clean · jest **13325 passed / 2 skipped** fresh
(13326 / 1 with the shots cache) · lifecycle **64/64** · e2e
**`OBSIDIAN-E2E done: 592/608 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs`** · shots **592**,
host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Expected after the fix: jest 13325 + your new tests (the flipped marker already counts as passed), 0 failed ·
lifecycle 64/64 · e2e `593/609 ok, 0 failed, 16 known-bug, coverage: 416/416 pairs` (one new test, no new
pair; if a new pair appears, say why) · `styles.css` should be byte-identical to a clean `3e88b3f5` build (no
CSS change) — then shots 592, freeze 280/280 and parity 0/0/24 still must be run and reported. If any frozen
hash moves, do NOT touch the baseline: write
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc631-montage-skill-casing/sc631-rebaseline.txt`
plus before/after crops and say so.

Lifecycle runs in SEVEN parts with `--only=` (EQUALS SIGN; with a space the runner silently runs the whole
suite — check the first lines of each log print only that part's ids). One part per Bash call:
- `G-S7a … G-S9a` (21), `G-S9b … G-S40` (16) — take the exact id lists from dse-verify's lifecycle row
- `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
- `G-S57,G-S62,G-S61,G-S56` (4)
- `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
- `G-S92,G-S96,G-S97,G-S99` (4)
- `G-S108,G-S112,G-S115` (3) — takes about 200 s
A part over 180 s is moved to the background by the Bash tool: start it with output to a unique log, then wait
with `timeout 175 tail --pid=<your node pid> -f /dev/null` in repeated calls and read the log. Your pid is the
one whose `readlink /proc/<pid>/cwd` is your worktree's `draw-steel-elements`. e2e and shots likewise: unique
log + rc file, poll by pid, never wait for a background-completion notice.

Known flakes: a G-S91 FAIL is real unless it says the host was too slow after two re-runs. G-S115 (g) is a
suspected flake (SC-633): re-run part 7 once; any other failure is real. INIT-W10 e2e flaked once under heavy
load (SC-654); SET-X03 / SET-X04 e2e flaked once (SC-657) — re-run the spec once and report both runs. SC-622:
the Obsidian camera can leave `demo-vault/.obsidian/appearance.json` dirty, which fails G-S97 —
`git -C <plugin dir> checkout -- demo-vault/.obsidian/appearance.json` before blaming the change. Jest timeout
is 30 s: an "Exceeded timeout" is a real hang until proven otherwise (re-run the suite alone).

## 4. Footguns (each cost real time once)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc631-montage-skill-casing/draw-steel-elements -- bash <script file>`.
  Never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c`; no `| tail` on a gate.
  Record exit codes from a script file; read each gate's own summary line.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (literal absolute paths only).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, and never `rm` with a shell
  variable or a glob: it hangs on a permission prompt. Leave throwaway files in place; write new uniquely named ones.
- Your scratch: the private folder
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc631-r1-impl/`
  (already created) with uniquely named scripts and logs. Create files with the Write tool.
- `git -C <absolute path>` for every git command, never `cd X; git …`.
- Kill only by PID, only a PID inside your worktree (`readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern.
- Run each gate as a blocking foreground call where it fits; no Monitor. Never key a wait-loop on a scratch
  filename or its contents — read the process's own output or a per-run unique path.
- Redirect long-running output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`)
  is Scott's live vault — expected, not yours, do not touch or report it.
- Commit after every coherent step. In dse: commits on branch `sc631-montage-skill-casing`, messages like
  `fix(SC-631): …` / `test(SC-631): …`. In the superproject: ONE commit for the CHANGELOG bullet, then at the very
  end ONE `chore: bump draw-steel-elements to <sha> (SC-631: …)` pointer commit. No interim pointer commits. Do
  not push anything. Do not tag. Git commit messages: no Claude/AI attribution or Co-Authored-By trailers.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question; I will resume you. If you ever send a message anyway, its first word must be `SC-631:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc631-montage-skill-casing/sc631-r1-implementer-report.md`.
Open it with a ≤10-line executive summary (verdict, dse head sha, superproject head sha, every gate's measured
number). Then: the diff summary by file, tests added/changed, the edit-sheet behaviour checked, `Drive-by fixes:`,
`Follow-ups:`, and evidence paths. If the report-file write is blocked by your harness, return the report inline.

Return contract: final text = verdict, shas, measured numbers, report path, evidence paths. No prose.
