# SC-450 R1 — implement brief (audit + fix + guard)

## 1. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-decisions.md` — the current-state spec. Read it fully.
- Prior art (the same bug, fixed once): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc423-portrait-frame-ledger.md`. It describes how `repaintTurn` drifted, the sheen rule, and `assertPortraitMarkParity` / `measurePortraitMarks` in `visual-harness/shoot.mjs`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc450-aria-pressed`. Your repo is `/home/scott/code/steelCompendium/worktrees/sc450-aria-pressed/draw-steel-elements`, branch `sc450-aria-pressed`, currently at `origin/develop` `8ab5e91`.
- First: `git -C <repo> fetch origin && git -C <repo> rebase origin/develop`. Expect it to still be `8ab5e91`; if develop moved, rebase and note the new base sha in your report. Run `npm ci` if `package.json`/lockfile changed.
- **Verify `pwd`/paths before any write. Use `git -C <absolute path>` for every git command — never `cd X; git …`** (a failed `cd` once ran git in the shared main checkout). Never edit anything under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault and expected — do not flag or touch it.
- **You never call the tracker (Linear)** — not to read history, not to post.
- Read the DSE repo's own `AGENTS.md`/`CLAUDE.md` before editing.

## 2. The task

Ruling (ticket description, verbatim from the ledger):

> For each: does it go through `iconButton`'s `setPressed` (which stamps both), or set `aria-pressed` by hand? If by hand, does the Steel sheen rule visibly differ between the in-place state and a rebuilt one? Probe computed styles the way `assertPortraitMarkParity` in `visual-harness/shoot.mjs` does. Fix any that drift; consider a lint/jest guard that forbids a bare `aria-pressed` write on a `.dse-btn` outside `iconButton`.

Listed sites: negotiation `ArgumentView` / `MotivationsPitfallsView`; montage `LogActionModal`; `ConditionsModal`.

Owner decisions (ledger): scope is EVERY in-place `aria-pressed` write in `src/`, not only the listed four; build the guard (not just consider it); fix shape is the iconButton handle's `setPressed` where a handle exists, else ONE exported helper next to `setPressed` — no scattered per-view `toggleAttribute('data-pressed')` copies.

Steps:

1. **Audit.** Find every write of `aria-pressed` in `src/` (`setAttribute('aria-pressed'`, `toggleAttribute`, `.ariaPressed =`, template/`attr:` objects passed to `createEl`, helpers that forward it). For each site record: file:line; the element (is it a `.dse-btn`? created by `iconButton`?); initial render path vs in-place update path; whether `data-pressed` is stamped on both paths.
2. **Probe.** For each by-hand site on a `.dse-btn` (or any element a `:not([data-pressed])` / `[data-pressed]` selector in `styles-source.css` matches — grep the CSS for every `data-pressed` selector and list them), compare computed styles of the in-place-toggled element vs a freshly rendered element in the same state, dark and light, at least the same keys `measurePortraitMarks` compares (backgroundColor, backgroundImage, boxShadow, borderTopColor, borderTopWidth; add `color` if relevant). A jsdom test cannot compute cascade — use the visual harness (Playwright page, as `assertPortraitMarkParity` does). Record DRIFTS / NO DRIFT per site, with the differing values.
3. **Red tests first.** For each drifting site, a jest test that toggles in place and asserts `data-pressed` follows `aria-pressed`; confirm it fails on unfixed code, then fix.
4. **Fix** every drifting site per the fix shape above. Sites that already stamp both: leave alone. A non-`.dse-btn` site that no `data-pressed` selector can match: still route it through the helper if that is a one-line, behaviour-neutral change; otherwise allowlist it in the guard with the reason.
5. **Harness gate.** Add a computed-style parity assertion in `visual-harness/shoot.mjs` modelled on `assertPortraitMarkParity`, covering each fixed site (in-place toggle vs rendered state, both directions, dark and light). It must print an OK line with a comparison count. Prove it goes red with your TS fix reverted (then restore, verify by `git status`/sha).
6. **Guard.** A jest test that scans `src/**/*.ts` and fails on any `aria-pressed` write outside the iconButton module / the helper, except an explicit allowlist (each entry: file + one-line reason). Prove it goes red by temporarily adding a bare write (then remove it).
7. **Evidence for Scott.** For ONE drifting site that is the most visible, capture a before/after crop pair: on unfixed code, the control right after an in-place click (showing the wrong sheen), and on fixed code the same click. Narrow crop around the control, dark theme. Name the visible difference in words (e.g. "pressed button keeps the unpressed metal gradient"); do not describe it by hue alone. If NO site drifts visibly, say so plainly and skip the crops.
8. **Docs.** A bullet under `## Unreleased` in the DSE repo's `CHANGELOG.md` if any user-visible state changed. Commit after every coherent step (red test, fix, harness gate, guard, changelog) with `SC-450` in the message. No co-author trailers.

Out of scope: any restyling of the sheen rule itself; any other iconButton behaviour. If you find a different bug, report it under `Follow-ups:` — do not fix it.

## 3. Gates — the `dse-verify` skill

Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery order, devbox shapes, exit-code footgun, stale `main.js` rule). Run the full battery in order. Expected at base `8ab5e91`:

- tsc (incl. `tsc -p e2e`) and lint clean
- jest **4806 passed / 1 skipped / 227 of 228 suites** (+ your new tests; report the delta)
- lifecycle **`OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`**
- e2e **`OBSIDIAN-E2E done: 63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`** — required to land
- shots **572 PNGs, 0 FAIL**, existing in-run lines (`turn mark parity OK (20 comparisons)`, `portrait mark parity OK (… 6 comparisons …)`, text-scale lines) still OK, plus your new parity line
- freeze **`freeze OK (276/276 …)`**
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

Read exit codes through a **script file** (`rc=$?` inside a file run as `devbox run -- bash /abs/gate.sh`), or the tool's own summary line. Never trust an echoed `$?` inside `bash -c`, in any quoting. `rm -f main.js styles.css` in the plugin root before `npx jest`. On a timeout-shaped jest red in settings-tab/settings-preview, check `/proc/loadavg` and re-run before believing it.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-r1-implement-report.md`. Logs and evidence under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/logs/` and `.../evidence/`, every filename prefixed `sc450-`. The report must open with a **≤10-line executive summary**, then: the audit table (site, file:line, path, stamps data-pressed?, DRIFTS/NO DRIFT + differing values), commits, gate numbers, `Drive-by fixes:`, `Follow-ups:`.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict (DONE / DONE_WITH_CONCERNS / BLOCKED / NEEDS_CONTEXT), head sha, base sha, commit list, measured gate numbers, the audit verdict per site — plus the **absolute path of every evidence artifact** (report, logs, crops).

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000 ms); never background a gate and "wait for a notification" — it will not come.
- Never `pkill`/`killall` by a command pattern — other worktrees run the same gates concurrently. Kill only by PID whose command line contains `worktrees/sc450-aria-pressed/`.
- Never `rm -rf` anything under `.superpowers/` other than your own `sc450-` files.
- devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`; devbox picks its project from the CALLER's cwd — use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc450-aria-pressed/draw-steel-elements -- …` to get the plugin's devbox (nodejs 24).
- Never create a git tag or release on draw-steel-elements. Do not push; the owner and dispatcher land.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I see your completion notification and will resume you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-450:`.
