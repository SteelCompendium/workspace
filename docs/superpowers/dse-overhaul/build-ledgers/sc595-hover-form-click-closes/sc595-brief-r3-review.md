# SC-595 r3 — independent adversarial review (reviewer)

You are the r3 independent reviewer for SC-595. You did not write this code or its design. Your final text goes to the ticket-owner, not a human. Execute and probe — do not just read.

## 1. Context loading

- Ledger (spec + owner rulings O1-O7): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md`
- Design: `sc595-r1-diagnosis-report.md` (§4 A, §5, §6) in the same dir. Implementation brief: `sc595-brief-r2-impl.md`. Implementer's report: `sc595-r2-impl-report.md` (read its executive summary; dive in only where needed).
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, lifecycle notes, exit-code footgun, "Block edit form Save and embeds (SC-556)").
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`, dse branch `sc595-hover-form-click-closes` at HEAD `0f5c9c98` on base `eaa8742a`; superproject branch head `597f6203 (the draw-steel-elements pointer is modified and unstaged by design, for wt-finish)`. `git -C <abs> fetch origin`; review `git -C …/draw-steel-elements diff eaa8742a..HEAD`. Do not commit to the branch; any probe change is scratch, reverted, `git status` clean at the end.
- **Workers never call the tracker** (Linear).

## 2. The task

Review the branch against the ledger's O4/O5 (quoted verbatim):

> **Design A adopted** (r1 report §4 A, steps 1-3): keep the hover preview alive while a DSE modal opened from it is open — the modal stops its own `click` events at its document in the bubble phase (`stopPropagation`, NEVER `preventDefault`), only when the opener's element sits inside `.hover-popover`; after the opening event, the modal re-pushes its keymap scope (`app.keymap.popScope(scope); app.keymap.pushScope(scope)`) so Esc works. Implemented once in `DseModal` / `managedModal.ts` so it covers every DSE modal opened from a preview (r1 §5 table).

> O5: r1 related bug 1 (Esc does nothing in a form opened from a preview; in LP Esc moves focus into the editor behind the form) — **folded in** (design A step 3).

Probe adversarially, at minimum:
1. **Real Obsidian, real CDP mouse**, RV and LP: does a click in the form keep form and preview? Typed edit saves via a real Save click, no Notice? Esc closes the form and leaves the preview; after close, does Esc / outside click behave normally (popover scope back on top, preview dismissable)? Run G-S83 yourself and also at least one probe G-S83 does not cover (e.g. a modal from a preview in a note that is ALSO open in another pane; two forms opened in succession from the same preview; a click in a form opened from an ordinary (non-preview) embed — nothing must change there).
2. **No leak outside a preview**: a modal opened from a normal note / embed registers no document listener and pushes no extra scope. A listener or scope left behind after close (incl. a modal closed during its open event, before the deferred re-push runs).
3. **Things a stopped click might break** inside these modals: Obsidian toggles, dropdowns, `Menu`, suggests, colour picker in ConditionsModal, links, DSE document/window listeners (RecoveriesStrip click-outside, ConditionsModal capture listener, sccLinkClickHandler). Does a click on the modal backdrop still close the modal as before?
4. **Coverage of r1 §5**: is every listed modal opened from a preview covered by the anchor plumbing? Nested modal (FreeHealConfirmModal from StaminaEditModal)? ConditionsModal from the initiative tracker in a preview?
5. **Write paths unchanged**: confirm by diff that pin / `pinnedTarget` / `lastWrite` / `keepFormOpenOn` / SC-552 code is untouched; SC-584's G-S64 (zk)-(zn) still pass.
6. **Tests have teeth**: re-run the implementer's mutants yourself and add at least two of your own; confirm G-S83 is red on base (run it against a base build).
7. **Battery**: re-run tsc, lint, jest, lifecycle part 5 (with G-S83), and e2e. Expected: tsc/lint clean; jest 7177 + the branch's new tests non-skipped passed / 2 skipped (SC-568 load timeouts green alone); lifecycle part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` 5/5; e2e `258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs` (RECOV-R07 load flake: re-run alone). If you have time, lifecycle part 3 too (G-S64 is the SC-584 control).
8. **The scope re-push is timer-based** (`HOVER_SCOPE_REPUSH_MS = 200` in `managedModal.ts`, not the 0 ms r1 specified: the implementer measured that Obsidian's click-to-edit helper pushes the popover's scope ~150 ms after the click over text, so a 0 ms re-push left Escape dead). Judge this hard: what happens to Esc pressed in the first 200 ms; on a slow / loaded host does Obsidian's push ever land after 200 ms (measure the actual delay distribution under load); is there a structural alternative that does not race a timer (e.g. re-push when the keymap's top scope is not the modal's — on the modal's own `keydown` capture, on focus, or by observing `app.keymap` — or an Escape handler that does not depend on scope order) using public API? If you find a better one, prototype it in scratch and measure it in real Obsidian; prescribe it as a fix with evidence.
9. Docs: CHANGELOG bullet in the worktree superproject reads plainly and is accurate; `sc595-dse-verify-proposal.md` is accurate.

Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failure scenario, and a prescribed fix. Verdict: LAND or FIX.

## 3. Footguns (all apply)

- No compound `cd`: `git -C <abs>`; `devbox run -c /home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/draw-steel-elements -- <cmd>`; exit codes via a script FILE run through devbox; never pipe a gate into `tail`.
- Never `rm` with a variable target; never a glob `rm` under /tmp; delete only literal paths you created.
- One gate per Bash call, in the FOREGROUND; no background gates or Monitors (except shots, then poll its own log). Redirect long output to files; lifecycle in `--only` parts, one call each; G-S56 stays last in SCENARIOS order.
- Never set `DSE_LIFECYCLE_PORT`. Private `DSE_CAMERA_TMP` per run.
- Kill scratch processes by literal PID only, only PIDs whose cwd/cmdline is inside YOUR worktree or scratch. Never `pkill`/`killall` by pattern.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r3-review-<your agentId>/`.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's and expected; never write in the main checkout's `draw-steel-elements`.
- SC-573 and SC-578 run gates concurrently: expect load.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. Need input → end with `STATUS: NEEDS_CONTEXT` and the question. If you message anyway, first word `SC-595:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-r3-review-report.md`, OPENING with a ≤10-line executive summary (verdict, finding counts by severity, gate numbers). Logs with the `sc595-r3-` prefix next to it.

## 5. Return contract

Final text: raw facts — verdict, findings (severity, file:line, one line each), gate summary lines, mutant results, and the absolute path of every artifact.
