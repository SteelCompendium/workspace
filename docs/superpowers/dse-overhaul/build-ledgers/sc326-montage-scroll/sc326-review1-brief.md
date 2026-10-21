# SC-326 review 1 brief — independent adversarial review of the montage-scroll fix

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/sc326-decisions.md` (owner decisions 1–6 define the target).
- The implementer's brief and report: `sc326-r1-brief.md`, `sc326-r1-report.md` in the same dir (read the report's executive summary, then whatever you need).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc326-montage-scroll/draw-steel-elements`, branch `sc326-montage-scroll`, base dse `develop` @ `188755b`. Review the diff `git -C <that path> diff 188755b..HEAD`. First `git -C <path> fetch origin` and report whether `origin/develop` moved past `188755b`.
- Use `git -C <absolute path>` for every git command. You are a REVIEWER: do not commit to the branch. Probes and temporary edits are fine if reverted byte-clean (`git status --porcelain` empty at the end); scratch clones go in your private scratch folder (below).
- Read the `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **You never call the tracker (Linear).** The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.

## 2. The task — execute and probe, not just read

1. **Does it actually fix the bug in the real chain?** In real Chromium (Playwright, as `visual-harness/shoot.mjs` uses it), with a ≥12-round montage at a desktop pane, fine AND coarse pointer: can every cell, the tally and the header cells be reached by scrolling, by mouse wheel/trackpad (shift+wheel), by touch drag (coarse), and by keyboard Tab? Is there any ancestor (`.dse-mt__board-wrap`, the card/section, `.dse-chrome`, print-scoped frames) that still clips? Check wider and narrower panes, including just above the 420px narrow breakpoint.
2. **Regressions:** border + radius on the frame; vertical behaviour (`overflow-y`); focus-visible outlines at the board edges; the coarse quick-trio and row-action buttons; any popover/menu anchored inside the board; light, dark and print themes; a scrollbar appearing on a board that does NOT overflow (sub-pixel overflow, e.g. 1px rounding) — probe several pane widths for a spurious scrollbar.
3. **The new gate:** is it real? Re-run the can-fail (restore `overflow: hidden` → it must fail loudly), and try at least one other plausible regression (e.g. the clip moved to `.dse-mt__board-wrap`, or a hidden column of cells) to see whether it catches it. Check the MED-1 trap from SC-299 (`elementFromPoint` viewport-relative; `null` hits must be their own loud line). Check it runs under coarse emulation for real (not silently fine).
4. **Re-run the battery yourself** (at least tsc, lint, jest, shots, freeze, parity; lifecycle and e2e too if time allows — the implementer's numbers are claims). Expected at base `188755b`: tsc/lint clean · jest 5257 passed / 1 skipped / 229 of 230 suites plus the branch's new tests (fresh worktree: one fewer passed and 2 skipped until shots has run once) · lifecycle 27/27 · e2e `83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs` · shots 572, 0 FAIL + the new OK line · freeze `freeze OK (276/276 …)` byte-identical · parity 0 GAPs / 0 undeclared / 24 DECLARED.
5. **Owner eyeball concern:** in `sc326-r1-after-coarse-scrolled-right-tally.png` (scrolled fully right) the tally column's failure chip ("× 0") appears to sit flush against the board's right border — check whether the last column's right padding/edge is actually reachable at max `scrollLeft` (grid overflow vs. the cell's padding box), under fine and coarse, and whether the same chip is flush at base when nothing overflows.
6. **Round 2 (scroll preservation across writes):** the implementer's round 2 adds TS so the board keeps its horizontal scroll across the montage view's rebuild-on-write. Review it with the same rigor: measured before/after in a real environment, can-fail test, clamp behaviour when the round count changes, two montage blocks in one note not sharing scroll state, the leaf/note close + reopen path, no leak of saved state. Read `sc326-r2-report.md` too.
8. **Scott-facing evidence:** the implementer's screenshots clone the `mid` fixture's DOM, so the header says "Round 3 / 3" while rounds 9–12 show in-play trios. Produce a clean pair from a GENUINE ≥12-round montage source (a montage block configured with 12 rounds, rendered through the real element, coarse pointer, ~900px pane, steel dark): `sc326-rv1-scott-before.png` (base `188755b`, tally clipped) and `sc326-rv1-scott-after-right.png` (branch head, scrolled fully right, tally visible). Crop to the card. Scratch clone of the base goes in your private scratch folder via `git worktree add` (never re-point anything); remove it afterwards.
7. Scope: CSS changes confined to montage board rules (SC-422 is editing other CSS concurrently); `draw-steel-elements/CHANGELOG.md` bullet accurate and plain.

Findings by severity (HIGH/MED/LOW/INFO) with file:line, a failure scenario, and a prescribed fix.

## 3. Footguns (mandatory)

- Devbox: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc326-montage-scroll/draw-steel-elements && <cmd> > <log> 2>&1'`. Never trust an echoed `$?` inside `bash -c`; read the tool's own summary line. Never pipe a gate into `tail`. `rm -f main.js styles.css` before `npx jest`. Own `DSE_LIFECYCLE_PORT` (e.g. 9287).
- Redirect long-running output to a file; run gates in the FOREGROUND one at a time (timeout up to 600000 ms). Never background a gate and wait for a notification — it never comes.
- **Scratchpad is shared by every agent.** Use ONLY `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc326-rv1-<your agentId or random suffix>/` with uniquely named files. Never key a wait-loop on a scratch filename or contents.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc326-montage-scroll/` or your scratch folder. Never `rm -rf` a `/tmp` glob or the shared `.superpowers/` dir. Never touch the freeze baseline. No tags, pushes, deploys, `wt-finish`.
- Load-sensitive jest suites: on a timeout-shaped red, check `/proc/loadavg` and re-run.
- If the report-file write is blocked, return the report inline.
- **You cannot `SendMessage` me** — `to: 'main'` reaches the dispatcher. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-326:`.

## 4. Report & return

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc326-montage-scroll/sc326-review1-report.md`, opening with a ≤10-line executive summary (verdict: LAND-READY / FIX-ROUND). Logs as `sc326-rv1-<gate>.log`, any screenshots as `sc326-rv1-<name>.png` in the ledger dir.

Final text goes to the ticket-owner, not a human: verdict, findings list (severity, file:line, one line each), measured gate summary lines, and the absolute path of every evidence artifact. No prose.
