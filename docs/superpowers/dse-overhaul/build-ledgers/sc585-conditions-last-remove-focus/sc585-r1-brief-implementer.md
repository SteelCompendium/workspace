# SC-585 r1 — implementer brief: keep focus in the Conditions window when the last condition is removed with the Add search open

## 0. Context loading (do this first)

- Read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc585-conditions-last-remove-focus/decisions.md`. It is the current state; it overrides anything else you read.
- **You never call the tracker (Linear)** — not to read, not to post. Everything you need is here and in the ledger.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus` (superproject), plugin at `.../sc585-conditions-last-remove-focus/draw-steel-elements`, branch `sc585-conditions-last-remove-focus` in both. Verify with `git -C <abs> branch --show-current` before any write. **Every git command is `git -C <absolute path>`**, never `cd X; git …` (a failed `cd` once ran git in the shared main checkout).
- Base: dse `develop` @ `2074a152` (your branch sits there). Run `git -C <plugin> fetch origin` and confirm `origin/develop` is still `2074a152`; if it moved, rebase onto it and say so (and `npm ci` if `package.json`'s obsidian version changed).
- **Never edit anything under `/home/scott/code/steelCompendium/workspace/`** except your report/evidence files in the ledger dir. The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus/CHANGELOG.md`. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — ignore it.
- Read the gate skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — ~400 KB, read in parts: "The battery, in order" (lines ~20-220, incl. "Lifecycle and e2e notes") and the CURRENT entry of "Current expected numbers" (~line 1478). Prior art for this window's focus rules: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/` (SC-468, SC-474, SC-580, SC-581 ledgers) — skim only if needed.

## 1. The task

Bug (ticket, verbatim): "If you remove the last condition with the keyboard while the Add search is open, keyboard focus is lost: it lands on the page body, and the Add search stays open with nothing focused." Repro: Conditions window on a creature with two conditions; remove one; click "+ Add condition"; Shift+Tab (focus to the remaining condition's trash button; the search stays open); Enter → condition removed, focus on `<body>`.

Cause: `draw-steel-elements/src/views/ConditionsModal.ts` `removeAt` (~l.348-362) focuses `.dse-condal__add` when the list empties, but that button does not exist while the combobox is open (keyboard activation sends no mousedown, so the outside-close never arms).

Owner ruling (ledger, 2026-11-13) — implement exactly this:
> **Fix shape** — when a removal empties the list while the Add search is open, the search stays open and keyboard focus goes to the search's input (`.dse-condal__input`); its typed text is kept. When the search is closed, behaviour is unchanged (focus "+ Add condition"). Removing a non-last condition is unchanged (focus the row that shifted in / the previous row's cog). Sweep every other path that focuses `.dse-condal__add` and apply the same rule wherever it can run with the search open.

Notes:
- Prefer one small helper (e.g. `focusAddControl()`: input if `addOpen` and the input exists, else the button) used by `removeAt` and any other site the sweep finds. Do not change `closeAdd` (it re-renders the button first, so its focus target exists). Keep the existing comments' style; update the MED-3 comment in `removeAt`.
- Check the SC-580 `returnFocusEl` interplay: if the search was opened by a routed key while focus sat on the trash button that then gets removed, Escape afterwards must still land on a live control (it falls back to "+ Add condition" — verify, don't change unless it breaks).
- Check the dropdown's `aria-activedescendant`/menu state is sane after the list empties (no stale ids pointing at removed nodes).
- Out of scope (ledger): SC-586, SC-613, SC-614. The neighbouring `test.failing('SC-586 …')` marker stays failing.

## 2. Tests

- Jest: `test/dom/views/conditions-modal-matrix.test.ts` ~l.969-980 holds `test.failing('SC-585: keyboard-removing the last condition with the Add dropdown open leaves focus inside the window, not on <body>', …)`. Make it a normal `test(...)`, remove/update its "SC-585:" cause comment so it states settled behaviour, and prove it fails without your fix (stash the src change, run that test, record the failure). Add targeted tests: focus is exactly the `.dse-condal__input` after the last removal with the search open; typed query text survives; search closed → focus is "+ Add condition" (unchanged); non-last removal with the search open → focus on the shifted-in row's control as before, search still open; any other site your sweep changed. A test title may begin with "SC-585:" as the existing marker does, but **never a bracketed id**.
- e2e (real Obsidian, `npm run e2e`): add one test to the Conditions-modal specs under `e2e/specs/conditions-modal/` (pick the file that holds keyboard/focus or remove tests — `cond-rows.e2e.ts` or `cond-add.e2e.ts`) reproducing the ticket's repro by real keys (Shift+Tab, Enter) and asserting: the note no longer has the condition, the search is still open, `document.activeElement` is the search input (inside the modal, not `<body>`). Take the next free `[COND-…]`-style scenario id in that file's series (ids are global; the highest `COND-D` today is `COND-D19`; check the series the file uses). **Never put a bracketed ticket id (e.g. `[SC-585]`) in a test title** — the runner reads bracketed ids as scenario ids. Coverage must stay Y/Y.
- No lifecycle scenario (ledger). Do not add one.

## 3. Docs (part of done)

- Bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus/CHANGELOG.md`, in the style of the neighbouring dse bullets (plain user-facing words: what a keyboard user now sees).
- Plugin user docs only if they describe focus after removing a condition (grep `draw-steel-elements/docs` for "Add condition"); likely nothing.

Commits: commit in `draw-steel-elements` on branch `sc585-conditions-last-remove-focus` after each coherent step (code+jest, e2e). In the superproject commit only `CHANGELOG.md`. **Do NOT commit a superproject pointer bump for draw-steel-elements** — the owner does one bump at the end. Commit messages carry no AI attribution trailers.

## 4. Gates (dse-verify battery, in order) — expected numbers at dispatch

Baseline at `2074a152`: tsc + lint clean · jest **11707 passed / 2 skipped** without the shots cache (11708 / 1 with it) → yours = 11707 + your new tests (the flipped marker counts as passing either way — say how you counted) · lifecycle **61/61** · e2e **`OBSIDIAN-E2E done: 330/333 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** (known bugs SC-257, SC-355, SC-384) → yours = 330+k / 333+k, 3 known-bug, coverage Y/Y · shots **592**, 0 FAIL, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze **280/280** · parity **0 / 0 / 24**. No CSS change is expected; if `styles.css` is byte-identical to a clean `2074a152` build, say so (shots/freeze/parity must still run and report).

Lifecycle runs in SIX `--only` parts (comma-separated ids), one part per Bash call, each output to its own log:
1. `G-S7a … G-S9a` (21) — take the exact id lists from dse-verify's battery row / CURRENT section;
2. `G-S9b … G-S40` (16);
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9);
4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays last;
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7);
6. `G-S92,G-S96,G-S97,G-S99` (4).
Known noise, not your change: **G-S91 flakes** (SC-616 in flight) — if part 5 fails only on G-S91, re-run part 5 alone before believing it. **SC-622**: the Obsidian camera tool can leave `draw-steel-elements/demo-vault/.obsidian/appearance.json` dirty in your worktree, which makes G-S97 fail — `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change. Other efforts (SC-612 adds a G-S108 part 7 on its own branch; ignore) run lifecycles concurrently. Report the union, e.g. `61/61 (21+16+9+4+7+4)`.

Freeze: **you never touch the shared baseline** (`.superpowers/sdd/freeze-baseline.sha256`). If any frozen shot moves (not expected), stop and report it with the shot names.

## 5. Evidence

No screenshot needed (focus is not visible in a still). Evidence = the logs: the stash-proof failure output, the e2e log line(s) of your new test, and each gate's summary line. Keep logs in your scratch subfolder and list their absolute paths.

## 6. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc585-conditions-last-remove-focus/sc585-r1-implementer-report.md`. It opens with a **≤10-line executive summary** (verdict, dse sha, superproject sha, each gate's measured line). Then: what changed (file:line), the sweep result (every `.dse-condal__add` focus site and whether it can run with the search open), the stash proof, each gate's exact summary line, `Drive-by fixes:` (made — obviously correct, local, can't move a baseline) and `Follow-ups:` (left alone). If the report-file write is blocked by your harness, return the report inline.

## 7. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict (DONE / BLOCKED / NEEDS_CONTEXT), shas, measured numbers — no prose, **plus the absolute path of every evidence artifact** (report, logs).

## 8. Footguns (each has cost real time)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc585-conditions-last-remove-focus/draw-steel-elements -- bash <script-file>`; never `cd` inside a compound command. Devbox's sh wrapper eats `$?` and pipes eat failures — record exit codes from a script FILE run through devbox, output redirected to a log, and read each gate's summary line. Never pipe a gate into `tail`.
- Scratch: your own subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc585-r1-impl/` with uniquely named scripts/logs (the scratchpad is shared by every agent). Create files with the Write tool.
- **No `rm` with a variable or glob target** (held by the safety check; a background worker then hangs). **Never `rm -rf` a `/tmp` glob** — other efforts' lifecycle/e2e vaults match it. Delete only literal absolute paths you created. Never `rm -rf` anything under `.superpowers/`.
- **Never `pkill`/`killall` by pattern** — other efforts run the same gates concurrently. Kill only a PID whose `/proc/<pid>/cwd` is inside your worktree.
- Run each gate as one blocking foreground call (timeout 600000). The Bash tool moves calls over ~180 s to the background; when that happens, do NOT just wait for a notification — loop `timeout 175 tail --pid=<your node pid> -f /dev/null` (pick your pid by `/proc/<pid>/cwd`), then read the gate's OWN log. Never key a wait on a scratch filename or its contents from another run; write per-run unique log paths.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Stale `main.js`/`styles.css` in the plugin root can shadow sources for jest — see dse-verify "Stale main.js".
- Load-sensitive jest suites: a timeout-shaped red in the suites dse-verify lists → check `/proc/loadavg` and re-run alone before believing it.
- Commit after every coherent step; nothing sits uncommitted through a gate.
- You cannot `SendMessage` me — `to: "main"` reaches the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll resume you. If you ever message anyway, the FIRST WORD must be `SC-585:`.
