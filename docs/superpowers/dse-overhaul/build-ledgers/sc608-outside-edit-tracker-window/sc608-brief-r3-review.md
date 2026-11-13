# SC-608 r3 — independent review (reviewer)

Your final text goes to the ticket-owner, not a human: raw facts, no prose padding.

## 1. Context loading

- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/decisions.md` (Scott's ruling + owner rulings are the spec), the r1 survey `sc608-r1-survey-report.md` (§3 measurements, §8 risks), and the r2 implementer report `sc608-r2-impl-report.md` (same dir). Read the report's claims as claims to check, not facts.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window`, dse `draw-steel-elements/` on branch `sc608-outside-edit-tracker-window`. Review range: `d984b115..9761eceb` (dse); superproject `21aa20e4 (on origin/main 298a4ef9)`. Verify HEAD before anything. Do NOT commit to the branch; probes go in your scratch dir, and the worktree must be `git status` clean when you finish.
- **You never call the tracker (Linear).**
- Gates: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (read only the parts you need). Footguns: `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8.

## 2. The task

Adversarial review: **execute and probe, don't just read.** Check the fix against the spec in the ledger:

- Scott's ruling, verbatim: **"Option 1"** (window closes on an outside edit; "Focus goes to the same control in the reloaded tracker, the one you opened the window from. Anything typed or staged in the window is dropped [...] It cannot overwrite the outside change.")
- Owner rulings (Notice only on outside-edit closes; sidebar closes only when the block content changed, otherwise stays open and Apply WRITES; hand-off keyed by sourcePath + pane + tracker index; never steal focus — root's own document, popouts; LP dying-control case; Reset confirm hand-off).

Probe at least (real Obsidian via the e2e harness, re-using `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r1-survey/zz-probe608.e2e.ts.txt` as a starting point):
1. Every window × Reading view / Live Preview / pinned sidebar × in-block / out-of-block outside edit: window state, Notice count, `document.activeElement`, and **what the note contains after Apply** (no silent loss anywhere; no outside change overwritten).
2. The tracker's own saves (Apply, Enter, Done, Cancel, Escape, captain crossing 0, Reset) — no Notice, focus unchanged from base.
3. Same note in Reading view AND pinned (ZZ8-10), two trackers in one note (`two-trackers.md` if present): focus goes to the right copy, Notice shows once.
4. Focus theft: outside edit while focus is legitimately elsewhere (another pane/popout after the window closes by other means, a mouse-opened window with focus outside the tracker) — must not pull focus.
5. Rapid repeated outside edits (Sync burst) while the window is open; an outside edit that deletes the tracker block or removes the creature.
6. Leaks: listeners/timers/MutationObservers left behind after close or plugin unload; Notice spam.
7. Tests: are the new jest/e2e tests red on `d984b115` and do they assert the real behaviour (not vacuous)? Re-run a mutation or two yourself.
8. Re-run the gates you need to trust the report: at minimum jest and the full e2e; spot-check one lifecycle part that covers the initiative tracker.

Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and prescribed fix.

## 3. Rules (footguns — obey all)

- Every git command as `git -C <absolute path> …`; never `cd X; git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc608-outside-edit-tracker-window/draw-steel-elements -- <cmd>`; never `cd` inside a compound command. Record exit codes from a script FILE run through devbox; read each gate's summary line.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc608-r3-review/` — uniquely named files; write them with the Write tool.
- Never `rm -rf` a `/tmp` glob or any glob; no `rm` with a shell-variable target. Never `pkill`/`killall` by pattern; kill only a PID verified yours (`readlink /proc/<pid>/cwd`).
- Never touch the shared `.superpowers/` dir beyond your report file; never the freeze baseline. Never edit the main checkout `/home/scott/code/steelCompendium/workspace` (its dse vault dirt is Scott's, expected).
- Each gate as ONE blocking foreground call, output to a log file, not streamed; no background jobs or Monitor. Never key a wait-loop on a scratch filename or its contents.
- Never put a bracketed ticket id in a test title. Never push, tag, or run `just deploy*` / `wt-finish` / `wt-rm`.
- You cannot `SendMessage` me; return `STATUS: NEEDS_CONTEXT` with the question. If you ever message anyway, first word `SC-608:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc608-outside-edit-tracker-window/sc608-r3-review-report.md`, opening with a ≤10-line executive summary (verdict: LAND / FIX-FIRST, counts by severity, gate numbers you re-ran). If the write is blocked, return it inline. Final text: STATUS, the summary, absolute paths of every artifact.

## 5. Specific items from the owner

- **Design call to judge:** the implementer did NOT reuse SC-602's `armSuccessorFocus` (keyed by block line, claims only at new-view mount; in Reading view the new section exists before the old view unloads, so the claim would miss). New `src/framework/chrome/windowHandoff.ts` does its own slot lookup (same note, same pane/embed, same position among the pane's trackers), using `controlFocus.ts`/`focusHandoff.ts` primitives. Is this a justified second path or a duplicate mechanism that should be folded into SC-602's? Probe the claimed miss.
- **Possible pre-existing data loss to confirm or refute (implementer follow-up 2):** "A tracker written by an unflushed mutation at the instant of an outside edit still compares as 'changed' (Notice) — correct, but ElementView's flush-on-unload then writes the old model; pre-existing behaviour." Does the flush-on-unload overwrite the outside edit? Reproduce on d984b115 and on HEAD; report whether SC-608 makes it more or less likely.
- Mutants M11 (`outsideClose` guard removed) and M13 (open-time token ignored) survived and were declared equivalent — confirm or refute.
