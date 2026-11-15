# SC-648 r2 — independent reviewer brief

You are the r2 independent reviewer for SC-648. You did not write this code. Your final text goes to the SC-648
ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/decisions.md`
  (ticket text, scope limits, owner decisions). The r1 implementer's report is
  `sc648-r1-implementer-report.md` in the same dir — read its summary, but verify, don't trust.
- **Workers never call the tracker** (Linear) — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position`; plugin at
  `.../draw-steel-elements`, branch `sc648-negotiation-menu-position`, head **544fd4e0** on dse `develop`
  **09c879f2**. Review the diff `git -C <plugin> diff 09c879f2..HEAD` plus the superproject CHANGELOG commit.
  **Use `git -C <absolute path>`** for every git command. Do not commit to the branch; probes go in your scratch.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read "The battery",
  "Devbox wrapping", "Lifecycle and e2e notes", "THE exit-code footgun", the CURRENT numbers block).
- The main checkout's dse dirt (Scott's live vault) is expected — ignore it, never touch the main checkout.

## 2. What to check — execute and probe, don't just read

1. Correctness of the fix in `src/elements/negotiation/view.ts` (options-menu onClick):
   - Enter and Space on the ⋮ button open the menu beside the button in Reading view AND Live Preview, and in the
     pinned sidebar / a popout window if the negotiation can render there (check the right `document` is used).
   - Mouse click unchanged (`showAtMouseEvent`).
   - Button at the card's right edge, narrow window, scrolled page: menu stays on-screen; inspect the measured
     rects yourself in real Obsidian (write a throwaway e2e probe or use the driver; leave it uncommitted).
   - Any other keyboard-like activation (assistive tech, `detail === 0` from a programmatic `.click()`) behaves.
2. Shared-chrome survey: confirm or refute the owner's claim that `new Menu(` / `showAtMouseEvent` have exactly
   one call site in `src/`, and look for OTHER popovers / dropdowns positioned from a click event's coordinates
   (any element) that would show the same corner bug from the keyboard.
3. Tests are not vacuous: revert the fix locally (stash or a scratch worktree, never on the branch) and confirm
   the NEGO-R06 e2e and the new jest tests go red; restore. Check the new e2e ids are globally unique and no test
   title carries a bracketed ticket id like `[SC-648]`.
4. Scope: no change to the menu's items (SC-641), Reset focus (SC-639), SC-640, or the power-roll / standing code
   (SC-649, parallel). CHANGELOG bullet is plain-words, user-facing, under `## Unreleased`; no pointer bump commit.
4b. Out of scope: the Space-opened menu ignoring its first Escape is filed as SC-659 — do not report it as a finding; do check NEGO-R07's multi-Escape close cannot leave a menu open for the next test.
5. Re-run the battery yourself: tsc, lint, jest, the full e2e (r1 measured `OBSIDIAN-E2E done: 595/611 ok, 0 failed, 16 known-bug, coverage: 417/417 pairs`; jest 13319 passed / 2 skipped fresh; expect the same: `0 failed`, known-bug 16,
   `coverage: Y/Y pairs`), lifecycle all seven parts (64/64), and the styles.css-identity check (if identical to
   a clean 09c879f2 build, shots / freeze / parity carry).

Baseline at 09c879f2: jest 13317 passed / 2 skipped fresh (13318 / 1 with the shots cache) · lifecycle 64/64 ·
e2e `OBSIDIAN-E2E done: 591/608 ok, 0 failed, 17 known-bug, coverage: 416/416 pairs` · shots 592, host-leak
163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0 / 0 / 24.

Lifecycle runs in SEVEN parts with `--only=` (equals sign; with a space the runner runs the whole suite — check
the log's first lines list only that part's ids): `G-S7a … G-S9a` (21) · `G-S9b … G-S40` (16) ·
`G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` · `G-S57,G-S62,G-S61,G-S56` ·
`G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` · `G-S92,G-S96,G-S97,G-S99` · `G-S108,G-S112,G-S115` (~200 s). Take
exact ids for parts 1–2 from the runner's SCENARIOS list.

Known flakes: G-S91 FAIL is real unless it says the host was too slow after two re-runs; G-S115 (g) suspected flake
(SC-633), re-run part 7 once; INIT-W10 (SC-654), SET-X03 / SET-X04 (SC-657) e2e flaked once each under load;
SC-622: restore `demo-vault/.obsidian/appearance.json` in the plugin worktree before blaming a G-S97 failure.
Jest "Exceeded timeout" is a real hang until proven otherwise (30 s default, SC-568).

### How to run gates without stalling

- Private scratch subfolder ONLY: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r2-review/`,
  uniquely named scripts/logs, created with the Write tool.
- Each gate via a script file: `devbox run -c <abs plugin dir> -- bash <abs script>`, output to its log, exit code
  to its own `.rc`. Never pipe a gate into `tail`. Never `cd` inside a compound command.
- The Bash tool moves calls over 180 s to the background: start long gates with output to a log, find YOUR node
  pid (`readlink /proc/<pid>/cwd` inside your plugin dir), then wait in repeated foreground calls
  `timeout 175 tail --pid=<pid> -f /dev/null`, then read the log's own summary line. Do not wait for a
  background notification and do not use Monitor.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (workers hung on the permission
  prompt). Never `pkill`/`killall` by pattern — kill only PIDs whose cwd is inside this worktree.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/sc648-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-ROUND). Findings by severity
(HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario and a prescribed fix each. If the write is
blocked, return the report inline.

## 4. Return contract

Final text: raw facts — verdict, sha reviewed, findings count by severity, every gate's measured numbers (e2e
`OBSIDIAN-E2E done:` line verbatim, lifecycle per part, jest, styles.css sha), the revert-probe result, the
shared-chrome survey result (one line), and the absolute path of every artifact (report, logs, probe output).

You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end with
STATUS: NEEDS_CONTEXT and the question. If you ever send a message anyway, its FIRST WORD must be `SC-648:`.
