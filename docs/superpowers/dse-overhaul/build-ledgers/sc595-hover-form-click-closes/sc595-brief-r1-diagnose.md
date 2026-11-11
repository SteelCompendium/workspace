# SC-595 r1 — diagnosis round (reviewer, probe-and-design; NO implementation)

You are the r1 diagnosis worker for SC-595. Your final text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (read first, it is the spec and current state): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md`
- Prior art (read the parts named, not whole dirs):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc584-embed-form-save-refusals/sc584-r2-review-report.md` → "MEDIUM-2" (F2) and its probe logs `sc584-r2-probe-obsidian-head-f2.log`, `sc584-r2-probe-obsidian-base-f2-f3.log` in the same dir. Find how that reviewer drove a real CDP mouse in lifecycle Obsidian and reuse it.
  - `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` → "Block edit form Save and embeds (SC-556)" → the SC-584 bullet's "Authoring footguns" (2) (the `hp.hide = () => {}` stand-in), plus "The battery, in order" and "Lifecycle and e2e notes" for how lifecycle runs.
  - SC-552 ledger `docs/superpowers/dse-overhaul/build-ledgers/sc552-twin-form-after-click/` (form kept open only while its note is shown) — skim its decisions.md only.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`, dse at `draw-steel-elements/` on branch `sc595-hover-form-click-closes` at `eaa8742a` (== origin/develop at dispatch). `git -C <abs> fetch origin` and confirm `origin/develop` is still `eaa8742a`; if it moved, note it, do not rebase.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. The task

Find out exactly **why** the first mouse click inside a block edit form opened from a hover preview closes the popover and the form, and propose fix designs. **Do not change any tracked file in the worktree** (scratch probes only; if you must add a probe test or scenario, keep it uncommitted or in your scratch folder, and `git -C … status` must be clean when you finish).

Answer, with evidence (decompiled Obsidian source lines, runtime probe output):

1. **What closes the popover.** Obsidian's `HoverPopover` in the lifecycle Obsidian's `app.js` (decompile / grep it; the lifecycle harness downloads or caches an Obsidian build — find where). Which listener (document `mousedown`/`pointerdown`? `onMouseOut` timer? `hide()` on focus change?) fires on a click inside a modal that is not a DOM descendant of the popover's `hoverEl`? Is there a supported/structural way to tell it "this element counts as mine" (e.g. child-popover / `isShownOrHasChildren`-style checks, `hoverEl.contains`, a `shouldShow` hook, `app.workspace` hover-parent semantics, the way Obsidian's own suggest/menu inside a popover avoids it)?
2. **What closes the form.** Trace the DSE path from the popover's `hide()`/unload to the form's `close()` (file:line in `draw-steel-elements/src/`). Is it SC-552's "kept open only while its note is shown" rule, the host's `onRenderChildUnload`, or something else?
3. **Which of keyboard focus, mousedown, pointerdown, click actually triggers it** — probe each in real Obsidian (RV and LP), with timings.
4. **Fix designs** — at least two, each with: mechanism, files touched, what the user sees (does the hover preview stay visible behind the form? what happens to the preview when the form closes by Save / Cancel / Esc?), risk to SC-552 / SC-556 / SC-584 behaviour (a form whose pin depends on a live host/section — what happens to the pin and to Save if the popover's view is gone while the form stays?), popout-window compatibility, and how a test in jest and a real-mouse lifecycle phase (new scenario **G-S83**, part 5) would prove it. Candidates to evaluate at minimum: (A) keep the popover alive while the form is open (structural hook, or a guard that refuses the popover's dismissal while a DSE form opened from it is open, restoring normal dismissal when the form closes); (B) let the popover close but keep the form open and savable (decouple the form from the popover's view lifetime). Recommend one, and say whether the choice between them is a user-visible trade-off Scott should rule on.
5. Does the same click-dismiss also hit any OTHER DSE modal opened from a hover preview (e.g. conditions modal, minion pool modal, any `Modal` opened from a card in a popover)? List them and whether they lose state; a quick real-Obsidian probe of one or two is enough.

Bound yourself: this is a diagnosis round. Stop when 1-5 are answered with evidence; no implementation.

## 3. Gates

None required (no tracked change). If you run lifecycle to probe, follow dse-verify's command shapes. Expected baseline at `eaa8742a` for reference: lifecycle 54/54 in five parts.

## 4. Footguns (all apply)

- No compound `cd`: use `git -C <abs>` and `devbox run -c <abs path to draw-steel-elements> -- …`.
- Never `rm` with a variable target; never a glob `rm` under /tmp; delete only literal paths you created.
- One gate per Bash call, in the foreground; no background gates or Monitors. Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents).
- Never set `DSE_LIFECYCLE_PORT`. Give each run a private `DSE_CAMERA_TMP`.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree. Never `pkill`/`killall` by pattern.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r1-reviewer-<your agentId>/`; uniquely named scripts/logs inside it.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected; ignore it. Never write in `/home/scott/code/steelCompendium/workspace/draw-steel-elements`.
- Concurrent efforts SC-573 and SC-578 run lifecycle/e2e on this host: expect load.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-595:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-r1-diagnosis-report.md`. It must OPEN with a ≤10-line executive summary (mechanism in one line, form-close path in one line, recommended design in one line, whether Scott needs to rule). Put probe logs next to it with the `sc595-r1-` prefix.

## 6. Return contract

Final text: raw facts, no prose — verdict, root-cause file:line (Obsidian and DSE), recommended design, the Scott-decision yes/no, and the absolute path of every artifact you produced (report, logs, probe scripts).
