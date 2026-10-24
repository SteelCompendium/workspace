# SC-513 r1 — survey brief (orchestration:reviewer)

## 1. Context loading
- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/decisions.md` (task verbatim, owner rulings, current baselines).
- Prior art (read the executive summaries, dive only as needed):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc501-hostleak-exemptions-ledger.md` and its dir (the SC-501 survey report is the closest model for this survey).
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc512-roll-reset-hostleak-ledger.md` and its dir (`galleryExtra=roll`, sweep-only second roll strip).
  - `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the "Button host-leak sweep" bullet (~line 197) and the CURRENT block (~line 1231). Also its battery table for the `shots` command shape.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed`; the plugin is `.../draw-steel-elements` on branch `sc513-hostleak-click-revealed` at `f89f69f` (= origin/develop). Run `git -C <dse path> fetch origin` and confirm `origin/develop` is still `f89f69f`; if it moved, say so in the report and survey on the new tip.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Verify `pwd`/paths before any write. All git commands as `git -C <absolute path> …`; never `cd X; git …` or `cd` in a compound command.
- The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, never touch it. You work only in the worktree.

## 2. The task (survey — no landing code)
The ticket, verbatim: "**Task:** list the click-to-mount controls in the gallery, then make the sweeps mount each one by a real click before tagging (the SC-205 rule "mount the chrome, don't exempt it"), with a failure if a mount produces nothing."

This round is the LIST plus a mount recipe, so the implementer round is well-specified. Deliver:

1. **Inventory.** Every control (button, input, checkbox, and any other element class the host-leak sweeps tag — read `assertBtnHostLeak`, `assertInputHostLeak`, `assertCheckboxHostLeak`, `assertModalBtnHostLeak` in `visual-harness/shoot.mjs` for exactly what they tag) that is NOT in the gallery DOM at load but IS created by a user click on something that IS in the gallery. Start from the two the ticket names (`rollController.ts:108-126` ability roll bar in feature and statblock cards; `hero/view.ts:657-672` hero ability bodies), then search the rest of `src/` for other click-to-create paths whose trigger exists in the gallery (e.g. `createEl`/`render` inside click handlers, expanders, toggled bodies, popovers/menus that are not modals — modals are covered by the modal pass; say if any non-modal popover/menu exists). For each: the trigger (selector, gallery section/record), what mounts, the control kinds it adds (in the sweep's own `section|tag.classes` kind-key form where you can), whether a second click unmounts it (toggle), and whether the same kind key already gets swept elsewhere in the gallery (then the mount adds comparisons of an existing kind, or nothing new).
2. **Out-of-scope boundary.** Click-to-mount paths you judge out of scope (e.g. trigger not in the gallery, trigger is a modal, mounts only an Obsidian-native element) — list each with a one-line reason.
3. **Mount recipe per control.** How the sweep should mount it by a REAL click (a dispatched pointer/mouse click via Puppeteer on the trigger element, like SC-501's `openRollModifiersForSweep` — never calling plugin internals), in the sweep's own page load only. Does it need a sweep-only gallery addition (like SC-512's `galleryExtra`) or can it click the existing gallery record? Prefer clicking existing records when that changes no capture — captures are separate page loads, confirm that for each sweep. Note anything that would change a photographed state.
4. **Prototype + measure (encouraged).** Prototype the mounts in `shoot.mjs` (and `entry.ts` only if needed), run `npm run shots` once, and report the new gallery `button host-leak` line (kinds / comparisons / boundary records by kind), the modal/input/checkbox lines, and whether any PNG's sha256 differs from base. Any NEW boundary record (a mounted control exempted) must be named and judged legitimate or not. Commit the prototype on a separate local branch `sc513-r1-proto` (`git -C <dse> switch -c sc513-r1-proto`, commit, then `git -C <dse> switch sc513-hostleak-click-revealed`), leaving `sc513-hostleak-click-revealed` clean at `f89f69f`. Never push.
5. **Failure design.** What "a mount produces nothing" should assert for each control (count of expected kinds, box present, etc.), and one can-fail probe you ran or would run.

Owner rulings, verbatim from the ledger:
- "Mount by REAL click (dispatch through the page, not by calling internals), in the sweep's own load only. Captures never perform these clicks, so zero shots/frozen bytes move. If a photographed-state change is unavoidable, it needs a widening file and Scott's sanction (owner asks)."
- "Every mount asserts it produced the expected controls (named FAIL, never skip). New kinds are ADDED; existing kinds stay compared."

Do NOT touch the freeze baseline (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256`) or any other effort's files.

## 3. Gates / run rules
- Base expectation (f89f69f): shots 592, 0 FAIL, `button host-leak OK (114 … 684 …)` with a 12-record boundary, modal `228`, input `164`, checkbox `60`. Freeze 280/280 (see dse-verify for the freeze-check command).
- Dev env is devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc513-hostleak-click-revealed/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command.
- Scratch: make a PRIVATE subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc513-r1-<your agent id or a random suffix>/` and put uniquely named scripts and logs inside it. Write scripts with the Write tool. Record exit codes from inside the script file (`echo rc=$? > <unique file>`), never `bash -c '…; echo rc=$?'` (devbox eats `$?`). Never pipe a gate into `tail`.
- Run each gate as ONE BLOCKING FOREGROUND Bash call (timeout up to 600000 ms), output redirected to a file. No `run_in_background`, no Monitor, no background jobs. Redirect long output to files rather than streaming it (the 600s stream watchdog kills silent agents).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- No `rm` with a shell-variable target and no glob `rm` (these hang on a permission prompt nobody answers). Never `rm -rf` anything under `.superpowers/` or a `/tmp` glob. Overwrite with `>` or use fresh unique names instead.
- Never `pkill`/`killall` by pattern. Kill only by PID, only a PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.

## 4. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc513-hostleak-click-revealed/sc513-r1-survey-report.md`. It must OPEN with a ≤10-line executive summary (count of in-scope click-to-mount controls, recommended mechanism, prototype measured numbers if any, any frozen-byte risk). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract
Your final text goes to the ticket-owner, not a human: raw facts — verdict, shas (base, proto branch head), measured numbers — no prose. Include the filesystem path of every evidence artifact (report, logs). If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; you cannot SendMessage me (a depth-2 agent cannot reach its parent; `to: 'main'` goes to the dispatcher). If you ever do send a message anyway, its FIRST WORD must be `SC-513:`.
