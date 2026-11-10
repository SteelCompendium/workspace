# SC-556 r1 — implement: a block edit form's Save never falls back to a twin (global strict)

You are the SC-556 implementer. Your final text goes to the SC-556 ticket-owner, not a human.

## 1. Context loading
- Read the ledger first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc556-outside-edit-open-form/decisions.md`.
- Prior art, read as needed (do not read whole):
  - SC-552 ledger: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc552-twin-form-after-click-ledger.md`. The lines about K-strict / `pinOnly` / unterminated fence / G-S64 are the relevant ones.
  - SC-552 r1 diagnosis, §3 "Strict" and §5 "Test design": `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc552-twin-form-after-click/sc552-r1-diag-report.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc556-outside-edit-open-form`, branch `sc556-outside-edit-open-form` in every submodule. The DSE repo is `<worktree>/draw-steel-elements`. Check where you are before any write. Never write under `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir. The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc556-outside-edit-open-form/CHANGELOG.md`.
- Fetch and rebase first: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `6270e84a`. If it moved, rebase onto it and say so in your report.
- **Never call the tracker** (Linear): don't read history from it and don't post to it.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault. It is expected; ignore it and don't touch it.

## 2. The task
Scott's ruling, verbatim from the ledger (2026-11-10). It answers option 1 of the owner's ask: "Save nothing. The form stays open and a Notice says: 'Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first.' The outside change is kept."
> Save nothing with a notice is fine.

The code at 6270e84a:
- `src/framework/host/ReadingModeBlockHost.ts` `replaceSource` (~line 853): a pinned write goes to `pinnedTarget(content, pin)` when that pin can be placed again. If it cannot, it falls back to `resolveWriteTarget` (which finds an identical twin), unless the caller passed `options.pinOnly`, in which case nothing is written (`'miss'` → `dropped` → droppedWriteNotice).
- At 6270e84a only forms that were KEPT OPEN past their view (SC-552's "K") pass `pinOnly`. Find where (`FormModal.ts` / `BlockHost.ts:55,120`).

Change: **every block edit form Save that has a pin is pin-only.** If the form's own block was edited or deleted while the form was open, Save writes nothing, the existing dropped-write Notice shows, and the form stays open. This applies to all forms, kept open or not. Forms without a pin (`SidebarBlockHost` has no `pinPosition`) keep their current behavior; say in your report whether any other form path lacks a pin.

Verify, don't assume:
- **The form stays open on a dropped Save in the non-kept-open case.** SC-552 asserted this for kept-open forms only.
- **The Notice text is exactly** "Draw Steel Elements: a change to a block in <note> was not saved — the block changed on disk first." (`host/droppedWriteNotice.ts`).
- **Writes from the card itself are not pin-only.** They have no pin (or don't take this path). Only the form's Save is affected; ds-hero's "Edit definition" goes through FormModal, so it is included.

Update the docs and comments that describe pin-only as kept-open only: `lineMap.ts`'s "Known limit" paragraph (the 400-line limit now applies to every form's Save), `BlockHost.ts` doc comments, and the `replaceSource` comment. Add a CHANGELOG `## Unreleased` bullet in plain words. Example: "Saving a block's edit form after that same block was changed or deleted elsewhere (Sync, another editor) no longer writes your edit into an identical block. Nothing is saved, a Notice says so, and the form stays open."

## 3. Tests
**Jest: red on 6270e84a, green on the fix.** Prove red by running the new tests against base and quote the failure. Cover:
- (a) Three identical `ds-counter` blocks. The middle block's form is open and not kept open. The middle block's body is changed outside. Save writes nothing: the note is byte-identical after Save, the Notice is shown, and the form is still open.
- (b) Same setup, but the middle block is deleted while its card is not thrown away. Same expectations.
- (c) The 2-twin variant of (a).
- Controls, each of which must still save into the form's own block:
  - a twin above is edited or deleted;
  - lines are inserted above and below the block;
  - a unique block with an edit elsewhere in the note;
  - a form on the note's unterminated trailing fence.
- Integrity: content above and below the written block survives byte-for-byte, and the twins are untouched.

**Lifecycle (real Obsidian):** extend SC-552's G-S64 with phases for (a) and (b) in real Obsidian, so the scenario count and the five-part split are unchanged. If G-S64 can't hold them, add **G-S68** (reserved for this ticket). Put it in part 3 right after G-S64, and write a dse-verify proposal file `sc556-dse-verify-proposal.md` in the ledger dir. **Do not edit the dse-verify SKILL.md.** G-S56 stays LAST in SCENARIOS order.

## 4. Gates (dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`)
Baseline at 6270e84a:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean.
- jest 6492 passed / 1 skipped / 257 of 258 suites. Your new tests add to this; report the delta.
- lifecycle 52/52. Run it in FIVE separate `--only` calls:
  - `G-S7a … G-S9a` (21)
  - `G-S9b … G-S40` (16)
  - `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9)
  - `G-S57 G-S62 G-S61 G-S56` (4)
  - `G-S59 G-S49` (2)
  
  Take the exact id lists from dse-verify's CURRENT.
- e2e: `OBSIDIAN-E2E done: 128/128 ok, 0 failed, 0 known-bug, coverage: 89/89 pairs`.
- shots 592, 0 FAIL, host-leak 163/978, capture clip OK · freeze 280/280 · parity 0/0/24. **If `styles.css` is byte-identical to a 6270e84a build**, these carry under the dse-verify precedent. Prove it with sha256 of both builds' `styles.css` and say so; then you need not run shots, freeze or parity. If `styles.css` changed, run them.

## 5. Footguns
- No compound `cd`. Use `git -C <abs>` for every git command and `devbox run -c <abs path to draw-steel-elements> -- …` for node/npm.
- Record exit codes from a script FILE run through devbox, never `bash -c '…; echo rc=$?'` (devbox eats `$?`). Read each gate's own summary line.
- One gate per Bash call, in the foreground, output redirected to a file, so the 600 s stream watchdog does not kill you. No background gates, no Monitor.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle and e2e run a private `DSE_CAMERA_TMP` inside your scratch folder.
- Never `rm` with a variable target, never a glob `rm`, never `rm` under `/tmp` by pattern. Delete only literal paths you created.
- Kill scratch processes by literal PID only, and only after `readlink /proc/<pid>/cwd` shows they are inside your worktree. Never `pkill`/`killall` by pattern.
- Scratch: your private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-impl-r1/`. Name every script and log uniquely inside it, and write scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated across sessions and branches, so read the process's own output.
- Commit after every coherent step in `<worktree>/draw-steel-elements` on branch `sc556-outside-edit-open-form`. Commit the CHANGELOG in the worktree superproject. Do not push, land, `wt-finish`, tag or deploy. No AI attribution trailers in commit messages.
- Never `rm -rf` anything under `.superpowers/` other than your own files.
- If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. You cannot SendMessage me; `to: "main"` goes to the dispatcher. If you message anyway, the first word must be `SC-556:`.
- If writing the report file is blocked, return the report inline.

## 6. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc556-outside-edit-open-form/sc556-r1-impl-report.md`. Open it with a summary of 10 lines or fewer, then cover:
- shas (dse branch head, superproject commit);
- files changed, with line counts;
- red-on-base proof;
- each gate's summary line and the absolute path of its log;
- the `styles.css` hashes;
- `Drive-by fixes:` and `Follow-ups:` lists.

Final text: verdict (DONE / BLOCKED / NEEDS_CONTEXT), shas, measured numbers, and the absolute path of every evidence artifact. Raw facts, no prose.
