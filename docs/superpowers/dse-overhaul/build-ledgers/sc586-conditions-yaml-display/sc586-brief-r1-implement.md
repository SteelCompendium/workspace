# SC-586 r1 — implementer brief

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc586-conditions-yaml-display/decisions.md`
  (ticket text verbatim + owner decisions D1-D4). It is the spec. There are no Scott rulings.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display`, branch
  `sc586-conditions-yaml-display` in every submodule. Your repo is
  `/home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display/draw-steel-elements`
  (dse, tracked branch `develop`). Verify `pwd`/`git -C <abs> branch --show-current` before any write.
- First: `git -C <dse abs path> fetch origin` and confirm `origin/develop` is still `3a5986d3`
  (your branch is cut there). If develop moved, rebase onto it and say so in your report.
- **Workers never call the tracker (Linear)** — not to read, not to post.
- Read the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  — it is ~430 KB, read it in parts: "The battery, in order" (l.20-220) and the top of
  "Current expected numbers" (l.1496 onward, first entry only). Also read the dse repo's AGENTS.md.
- Prior art in the same file (landed): SC-585, SC-581, SC-582, SC-580, SC-583, SC-361. Their
  ledgers are under `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`
  if you need precedent for test style.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — not yours, ignore it, never touch the main checkout.

## 2. The task

Fix the two items in `src/views/ConditionsModal.ts` exactly as the ledger's ticket text and
D2-D4 say. Quoting the ticket:

> 1. **A named colour opens the colour chooser at white.** With `color: teal`, the custom-colour
>    button is marked selected and says "teal, selected", but opening the chooser starts at white
>    instead of teal.
> 2. `icon: ""` **presses no icon choice.** The row shows the default icon, but "Use default" is
>    not shown as selected.

Pointers (current line numbers at `3a5986d3`):
- Item 1: l.~527 `input.value = entry.color && /^#[0-9a-f]{6}$/i.test(entry.color) ? entry.color : COLOR_INPUT_DEFAULT;`.
  Seed the native `<input type=color>` with the `#rrggbb` (lowercase) equivalent of any colour
  `isConditionColor` accepts — named, `#rgb`, `#rrggbb`, `rgb()/hsl()`, any case; drop alpha.
  Unparseable stays `#ffffff`. Look at how `isConditionColor` / `sameColor` already parse colours
  and reuse that machinery rather than adding a second parser. It must work in real Obsidian
  (Electron); if the existing helper resolves names via the browser, check what it does in jsdom
  and make the jest tests honest about it (no test that passes only because jsdom stubs something).
  Opening/closing the chooser without a pick must write nothing to the note.
- Item 2: l.~403 `setPressedState(button, value === entry.icon)` and l.~426 visible-list rule.
  Compare against the trimmed icon (blank/whitespace-only -> "Use default" pressed; `"skull "` ->
  the skull choice pressed); a whitespace-only icon must not add a blank `Icon:` chip. Check the
  parser keeps `icon: ""` / `icon: "  "` through to `entry.icon` (or drops it) and say which.
- Tests:
  - `test/dom/views/conditions-modal-matrix.test.ts` ~l.982-1006: the two `test.failing` markers
    become plain tests (remove the `.failing`; retitle so the title no longer reads as a known bug;
    **no bracketed ticket id in any test title**). Add jest coverage for: named colour, `#rgb`,
    uppercase hex, `rgb()`, unparseable (stays white), whitespace-only icon, `"skull "` icon,
    and that a whitespace icon adds no blank chip. Prove each new test fails with the fix reverted
    (report how many fail).
  - e2e: add one real-Obsidian test per item in `e2e/specs/conditions-modal/` (follow the
    existing COND-* naming/numbering there — pick the next free ids; scenario ids come from test
    titles, so never put a bracketed ticket id in a title). Item 1: a fixture condition with
    `color: teal`, open the row editor, assert the custom colour input's `.value` is `#008080`
    and the note is unchanged. Item 2: fixture `icon: ""`, assert "Use default condition icon"
    has `aria-pressed="true"` and the note is unchanged. Reuse an existing fixture note if one
    fits; otherwise add one beside the others.
- Docs: if a dse doc (README / docs page) describes the Conditions window's colour chooser or
  icon picker behaviour, update it. A `## Unreleased` CHANGELOG bullet goes in YOUR worktree's
  superproject: `/home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display/CHANGELOG.md`
  — **never** under `/home/scott/code/steelCompendium/workspace/`. Commit it on the superproject
  branch `sc586-conditions-yaml-display` but do NOT commit a submodule pointer bump (the
  dispatcher does that at landing).
- Commit in dse after every coherent step (fix, tests, e2e), on branch `sc586-conditions-yaml-display`.
  Do not push. Never tag.

## 3. Gates (dse-verify battery, in order)

Expected at base `3a5986d3`:
- tsc + lint clean (incl. `tsc -p e2e` and lint of `e2e/`).
- jest **11794 passed / 2 skipped** fresh without the shots cache (11795 / 1 with it). Yours =
  that + your new tests (the two `test.failing` markers already count as passed; converting them
  changes nothing). Before jest, `rm -f main.js styles.css` in the plugin root (literal paths) if
  present, per the skill.
- lifecycle **62/62**, in SEVEN separate `--only=` calls (comma-separated ids), one call each:
  1. `G-S7a … G-S9a` (21) — take the exact id lists from `visual-harness/obsidian-lifecycle.mjs`
     SCENARIOS order; parts are: ids up to G-S9a (21); `G-S9b … G-S40` (16);
     `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
     `G-S57,G-S62,G-S61,G-S56` (4); `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
     `G-S92,G-S96,G-S97,G-S99` (4); `G-S108` (1).
  - G-S91 has a known timing flake (SC-616): a part-5 red on G-S91 alone -> re-run part 5 before
    blaming the change.
  - SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty in
    your worktree, which makes G-S97 fail. Before part 6, `git -C <dse abs> status --short
    demo-vault/.obsidian/appearance.json`; if dirty, `git -C <dse abs> checkout -- demo-vault/.obsidian/appearance.json`.
  - Any Bash call over 180 s is moved to the background by the tool; it still writes its log.
    Redirect each part to its own log and read the log's summary line. A read-only wait on your
    own node pid: `timeout 175 tail --pid=<pid> -f /dev/null` (find the pid whose
    `readlink /proc/<pid>/cwd` is your worktree's dse dir).
- e2e: `OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` at base
  (known bugs SC-257, SC-355, SC-384). Yours should be 333/336 ok (+2), 0 failed, 3 known-bug,
  coverage Y/Y (state Y).
- shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze **280/280**
  (no rebaseline expected — if freeze moves, STOP and report: never touch
  `.superpowers/sdd/freeze-baseline.sha256`); parity **0 / 0 / 24**. If `styles.css` is
  byte-identical to a clean `3a5986d3` build you may say so, but run shots + freeze anyway since a
  modal shot may show a hand-written colour.

## 4. Footguns (all apply)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc586-conditions-yaml-display/draw-steel-elements -- <cmd>`;
  never `cd` inside a compound command. Devbox eats `$?`/`$PIPESTATUS` in any quoting — record
  exit codes from a **script file** run as `devbox run -c <dse abs> -- bash <script>`, and read
  each gate's own summary line. Never pipe a gate into `tail`.
- Every git command as `git -C <absolute path>`.
- Your private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc586-r1-impl/`
  — uniquely named scripts and logs inside it (the scratchpad is shared by every agent). Use the
  Write tool for scratch files (no heredocs).
- **Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir; no `rm` with a shell-variable
  target; delete only literal paths you created.**
- Never `pkill`/`killall` by pattern. Kill only by PID, and only a PID whose cwd
  (`readlink /proc/<pid>/cwd`) is inside your worktree.
- Run gates in the foreground, one per call, output redirected to a per-run log. No `Monitor`,
  no waiting for a notice of a job you backgrounded yourself — poll the job's own log.
- Never key a wait-loop on a scratch filename or its contents — a stale log from another branch
  can match. Read the process's own output, or use a per-run unique path.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever message anyway, the
  first word must be `SC-586:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc586-conditions-yaml-display/sc586-r1-impl-report.md`.
Open it with a ≤10-line executive summary. Your final text goes to the ticket-owner, not a human:
raw facts only — verdict, dse commit shas (and superproject CHANGELOG commit sha), every gate's
measured summary line, the revert-proof counts, the parser finding for `icon: ""`, `Drive-by fixes:`
and `Follow-ups:` lists, and the absolute path of every log/evidence artifact.
