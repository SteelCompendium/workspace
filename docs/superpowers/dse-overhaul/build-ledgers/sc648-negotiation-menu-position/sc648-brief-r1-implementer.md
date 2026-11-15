# SC-648 r1 — implementer brief

You are the r1 implementer for SC-648. Your final text goes to the SC-648 ticket-owner, not a human.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/decisions.md`
  (the ticket text, scope limits and owner decisions are quoted there — it replaces the ticket thread).
- **Workers never call the tracker** (Linear) — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position`
  - plugin: `.../sc648-negotiation-menu-position/draw-steel-elements`, branch `sc648-negotiation-menu-position`,
    must be at dse `develop` **09c879f2** (verify: `git -C <plugin> log -1 --format=%h`; if `origin/develop` has
    moved, do NOT rebase — report it).
  - superproject: branch `sc648-negotiation-menu-position` at workspace `origin/main` **7219b96d**.
  - Verify `pwd`/paths before every write. **Use `git -C <absolute path>` for every git command**, never `cd X; git …`.
  - Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at
    `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position/CHANGELOG.md` — never under
    `/home/scott/code/steelCompendium/workspace/`.
- Read the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (large — read
  "The battery, in order", "Devbox wrapping", "Jest timeouts", "Lifecycle and e2e notes", "THE exit-code footgun",
  and the CURRENT block under "Current expected numbers"). Also read the plugin's own AGENTS.md / CLAUDE.md.
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc439-e2e-negotiation-ledger.md`
  and `.../sc642-negotiation-complete-focus-ledger.md` (skim the summaries only).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault and expected — ignore it, never touch the main checkout.

## 2. The task

Ticket (quoted from the ledger):

> **What happens:** Tab to a negotiation card's ⋮ options button and press Enter. The menu (with "Reset
> negotiation") opens in the top-left corner of the Obsidian window, far from the card. A mouse click opens it
> beside the button, as expected.
>
> **Expected:** the menu opens beside the button however it was opened.

> Cause: `src/elements/negotiation/view.ts:152` calls `m.showAtMouseEvent(event)`; a click synthesised from the
> keyboard has `clientX` / `clientY` 0. Fix shape: when `event.detail === 0`, `showAtPosition({ x: rect.left,
> y: rect.bottom })` from the button's rect.

(At 09c879f2 the call is at `view.ts:165`, inside the `iconButton(... control: 'negotiation.menu' ...)` onClick.)

Do:

1. **Fix**: in that onClick, keyboard/assistive activation (`event.detail === 0` — the repo already uses this
   test, see `src/framework/chrome/focusHandoff.ts:41`; reuse a helper if one is exported) opens the menu with
   `showAtPosition` anchored to the button's `getBoundingClientRect()` (below the button, left-aligned is the
   ticket's shape; check `node_modules/obsidian/obsidian.d.ts` for the `MenuPositionDef` fields — `width`,
   `overlap`, `left` — and pick the form that keeps the menu on-screen for a button at the card's right edge).
   **Pass the button's own document** if `showAtPosition` takes one (sidebar / popout windows). The mouse path
   stays `showAtMouseEvent(event)` unchanged. Short comment naming SC-648 and why.
2. **Scope limits (from the ledger, do not cross):** position only — do not change the menu's items (SC-641 may
   change them), do not fix Reset's focus loss (SC-639) or SC-640, and stay out of the negotiation power-roll /
   standing code (SC-649 is editing it in parallel). If you find you must touch those, stop and report
   STATUS: NEEDS_CONTEXT.
3. **Tests:**
   - Flip the e2e marker `knownBug('SC-648', '[NEGO-R06] …')` in `e2e/specs/negotiation/reset.e2e.ts` to a plain
     test (drop `failsWith`). Tighten it if cheap: the menu's top-left should sit at/near the button's
     bottom-left (keep a tolerance; the menu can flip near a window edge).
   - New e2e: Space on the button (same expectation); Live Preview Enter (see the LP negotiation specs —
     `e2e/specs/negotiation/live-preview.e2e.ts` — and the dse-verify note that the LP active tab is
     session-remembered); a mouse-click regression (menu still opens at the pointer / beside the button) if no
     existing test already pins it. New ids must be globally unique scenario ids (grep all of `e2e/`); **never put
     a bracketed ticket id like `[SC-648]` in a test title** — the runner reads titles for scenario ids. Follow
     the manifest / coverage-pair conventions if a new (control, interaction) pair appears (e.g. `press:Space`
     on `negotiation.menu`); the run must still end `coverage: Y/Y pairs`.
   - jsdom/jest: a unit test that a `detail: 0` click calls `showAtPosition` with the button's rect-derived
     position (and the button's document if passed), and a `detail: 1` click calls `showAtMouseEvent`. Follow
     how existing negotiation jest tests mock `obsidian`'s `Menu` (grep `test/` for `Menu`).
4. **CHANGELOG**: one user-facing bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`
   (plain words, e.g. "Negotiation: the ⋮ options menu opened with Enter or Space now appears beside the button
   instead of the top-left corner of the window."). Commit it on the superproject branch as its own commit.
   **Do NOT commit a submodule pointer bump** — the owner does exactly one at the end.
5. Commit in the plugin after every coherent step (fix, tests). Conventional messages, no AI attribution
   trailers, no `[SC-648]`-style brackets in test titles (commit messages may say `fix(SC-648): …`).

## 3. Gates (dse-verify battery, in order) — expected numbers at 09c879f2

Baseline: tsc + lint clean · jest **13317 passed / 2 skipped** fresh (13318 / 1 with the shots cache) · lifecycle
**64/64** · e2e **`OBSIDIAN-E2E done: 591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs`** · shots
**592**, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**.

Expected after your change: jest up by your new tests; e2e known-bug **16** (NEGO-R06 flipped), ok up by 1 + your
new e2e, `0 failed`, coverage Y/Y (Y may grow by new pairs).

- **A fresh worktree has no `node_modules`: run `npm ci` once first** (through `devbox run -c <abs plugin dir> --
  bash <script>`, output to a log).
- **Lifecycle runs in SEVEN parts with `--only=` (equals sign — with a space the runner runs the whole suite;
  check the log's first lines list only that part's ids):**
  1. `G-S7a … G-S9a` (21 — take the exact ids from the runner's SCENARIOS list)
  2. `G-S9b … G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4)
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3; ~200 s)
  Ids comma-separated. G-S56 stays LAST in SCENARIOS order.
- **shots / freeze / parity:** build `styles.css` and compare its sha256 with a clean 09c879f2 build (the SC-628 /
  SC-637 owners recorded `18730938…f1f9`). If identical, they carry — say so; otherwise run them per dse-verify.
- Known flakes (re-run before believing): G-S91 FAIL is real unless it says the host was too slow after two
  re-runs; G-S115 (g) suspected flake (SC-633) — re-run part 7 once on a loaded host, any other failure is real;
  INIT-W10 e2e (SC-654) and SET-X03 / SET-X04 e2e (SC-657) each flaked once under load. SC-622: the Obsidian camera
  can leave `demo-vault/.obsidian/appearance.json` dirty in the plugin worktree, which made G-S97 fail — restore it
  (`git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json`) before blaming your change.
- Jest's default timeout is 30 s (SC-568): treat "Exceeded timeout" as a real hang until proven otherwise.

### How to run gates without stalling (this has hung workers before)

- Private scratch subfolder ONLY: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r1-impl/`
  with uniquely named scripts and logs (`sc648-r1-jest.log`, …). Create scripts with the Write tool.
- Run each gate via a script file: `devbox run -c <abs plugin dir> -- bash <abs script>`; the script redirects the
  gate's output to its log and writes the exit code to its own `.rc` file. Never pipe a gate into `tail`.
- **Never `cd` inside a compound command.** No `devbox run -- bash -c 'cd …'` chains from elsewhere.
- **The Bash tool moves any call over 180 s to the background.** For lifecycle parts and e2e: start the script
  with output to a log, record the node pid (pick the one whose `readlink /proc/<pid>/cwd` is YOUR plugin dir),
  then wait in foreground calls `timeout 175 tail --pid=<pid> -f /dev/null` repeated until it exits, then read the
  log's own summary line. **Do not rely on a background-completion notification and do not use Monitor** — it
  will not wake you.
- **Never key a wait-loop on a scratch filename or its contents** — the scratch dir is pre-populated across
  sessions and branches. Read the process's own output, or write to a per-run unique path.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers hung on a
  permission prompt doing that) — overwrite with `>` or use a new filename. The one exception dse-verify names
  (`rm -f main.js styles.css` in YOUR plugin root before jest) may be done with a literal absolute path.
- **Never `pkill`/`killall` by pattern**; kill only a PID whose cwd is inside your worktree.
- Never `rm -rf` a shared `/tmp` glob (lifecycle vaults of other efforts match it).
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/sc648-r1-implementer-report.md`.
It must open with a ≤10-line executive summary. If the report-file write is blocked by your harness, return the
report inline.

## 5. Return contract

Final text: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin branch head sha + commit list,
superproject CHANGELOG commit sha, the `showAtPosition` form you chose and why (one line), every gate's measured
numbers (jest passed/skipped, lifecycle per part, the e2e `OBSIDIAN-E2E done:` line verbatim, styles.css sha vs
baseline), the new e2e ids, and the absolute path of every evidence artifact (logs, report). List any
`Drive-by fixes:` (already made) and `Follow-ups:` (left alone) separately.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the
dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your
report. If you ever do send a message anyway, its FIRST WORD must be `SC-648:`.
