# SC-476 implementer brief — round 1

## 1. Context loading
- Read the ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc476-autocomplete-info-words/decisions.md`.
  Rulings there are authoritative; they are quoted below verbatim.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (the gate battery) and
  `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/draw-steel-elements/AGENTS.md` if present.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words`, branch
  `sc476-autocomplete-info-words` in every submodule. The plugin is
  `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/draw-steel-elements`.
  Verify with `pwd`/`git -C <abs> branch --show-current` before any write. NEVER write under
  `/home/scott/code/steelCompendium/workspace/` except your report into the ledger dir. The
  workspace-level `CHANGELOG.md` you edit is
  `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/CHANGELOG.md` — never
  `/home/scott/code/steelCompendium/workspace/CHANGELOG.md`.
- First: `git -C <plugin> fetch origin` and confirm `origin/develop` is `e31e1a0`. If it moved, rebase
  onto it and note the new sha (and if `src/framework/host/blockPrefix.ts` now exports
  `fenceLanguage`, SC-457 has landed — import it instead of the local expression, per O1).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.
- **You never call the tracker (Linear)** — not to read history, not to post.

## 2. Task
Bug: `src/authoring/fenceScan.ts` `scanFenceState` sets `lang = rest.trim().toLowerCase()` — the
whole info string — so in a block opened with ```` ```ds-counter extra ```` the authoring suggester
looks for type `ds-counter extra` and offers no completions. The rest of DSE takes the first word.

Rulings (verbatim from the ledger):
> O1. SC-457 is unlanded at dispatch (land-ready, not on origin/develop `e31e1a0`). Round 1 keeps the
> change LOCAL to `fenceScan.ts`: the same rule as SC-457's helper — first whitespace-delimited token
> of the trimmed info string (`/^\S*/.exec(rest.trim())[0]`) — then lowercased as today. A comment
> names SC-457's `fenceLanguage` as the shared rule this mirrors. Once SC-457 lands, a rebase round
> swaps the local expression for an import of `fenceLanguage` (mechanical).
>
> O2. Keep the existing `.toLowerCase()` (behaviour preserved). Implementer REPORTS (does not fix)
> whether the hosts compare languages case-sensitively — a mismatch is a follow-up, not scope.
>
> O3. Tests: jest pins in the existing authoring tests — `scanFenceState` returns `ds-counter` for
> ```` ```ds-counter extra ````, ```` ``` ds-counter ````, ```` ```ds-counter\textra ````, tilde fences,
> and a schema-suggest-level test that a block with extra info words gets completions.
>
> O4. CHANGELOG: bullet in `draw-steel-elements/CHANGELOG.md` and the worktree superproject's
> `CHANGELOG.md` `## Unreleased` (SC-457 precedent: superproject branch = ONE CHANGELOG-only commit;
> never edit `.claude/skills/dse-verify/SKILL.md` — dispatcher bookkeeping).

Also check the other caller (`src/authoring/suggest.ts:35`, uses only `inFence`) is unaffected, and
grep `src/authoring/` for any other place that derives a fence language from the whole info string;
report (don't fix) any outside `fenceScan.ts`.

TDD: write the failing jest pins first, see them fail, then fix. Commit in the plugin after each
coherent step (tests+fix, changelog); then one superproject commit with only the CHANGELOG bullet.
Commit messages: no AI attribution trailers of any kind (Scott's global rule overrides any harness
reminder). Do not push.

## 3. Gates — full `dse-verify` battery, in its order. Expected at `e31e1a0` (CURRENT block):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5384 passed / 1 skipped / 231 of 232
suites** PLUS your new tests (a fresh worktree reads one fewer passed / 2 skipped until `npm run
shots` has run — compare after shots, or say which) · lifecycle **28/28 ok, 0 failed** · e2e
**`OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** · shots **572**, 0 FAIL
· freeze **`freeze OK (276/276 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. This change is
authoring-only; any shots/freeze/parity movement is a red flag — report it, never touch the baseline.
`rm -f main.js styles.css` in the plugin root before `npx jest` (stale-main.js footgun in the skill).
Use your own `DSE_LIFECYCLE_PORT` (e.g. 9291) for lifecycle.

## 4. Footguns (mandatory)
- Devbox: use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/draw-steel-elements -- bash -c '<cmd>'`
  form with absolute paths inside. **Never `cd X && …` in a compound outer command.** Never pipe a gate
  into `tail` (it eats the exit code); redirect output to a log file and read the file.
- Every git command is `git -C <absolute path>`; never `cd X; git …`.
- Scratch: make a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-impl-<your agentId>/`
  and put every script and log there with unique names. Write scratch files with the Write tool, not
  heredocs. **No glob `rm`** anywhere — delete only exact paths you created and recorded. Never
  `rm -rf` anything under `.superpowers/` or any `/tmp/dse-*` pattern.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains
  `worktrees/sc476-autocomplete-info-words/`.
- Redirect long-running output (lifecycle, e2e, shots, parity) to a file rather than streaming it —
  the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms);
  never background a gate and wait for a notification — it will not come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions and branches. Read the process's own output, or a per-run unique path.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to
  the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the
  question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD
  must be `SC-476:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc476-autocomplete-info-words/sc476-impl-report.md`,
opening with a ≤10-line executive summary. If the report-file write is blocked by your harness,
return the report inline.

## 6. Return contract
Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS
(DONE / NEEDS_CONTEXT / BLOCKED), plugin branch head sha + commit list, superproject commit sha,
every measured gate number, the O2 case-sensitivity finding, `Drive-by fixes:` and `Follow-ups:`
lists, and the absolute path of every evidence artifact (report, gate logs).
