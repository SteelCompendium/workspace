# SC-356 round 4: rebase-only round onto 54f8f88+, full battery

The round-3 re-review of dse `2796ab8` on `8d890f9` says LAND-READY with no findings to fix (`sc356-r3-rereview-report.md`). This round only moves the branch onto the current bases.

## Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md`. Read the bottom sections, including "SC-361 coordination".
- dse clone: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/draw-steel-elements`, branch `sc356-hostleak-modal-buttons` @ `2796ab8`.
- Superproject: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons` @ `f87af93`.
- Use `git -C <absolute path>` for every git command. Never call the tracker.

## Tasks
1. Run `git -C <dse> fetch origin`. `origin/develop` should be `54f8f88` or newer (SC-483: `src/authoring/FormModal.ts` + its test only). Rebase onto the tip and report its sha.
   - **If the tip now contains SC-361** (`git -C <dse> log origin/develop --grep=SC-361`), apply the SC-361 coordination ruling from the ledger, verbatim: "both branches add a host re-grounding block labelled "E." at the same spot in styles-source.css. Keep both blocks and relabel the second one "F.". Then delete the SC-361 entry from HOSTLEAK_KNOWN_LEAKS in shoot.mjs and re-run shots."
   - In that case also update the dse-verify SKILL.md bullet so it no longer describes the allowlist, and say so in the report.
   - If SC-361 is not on the tip, change nothing about the allowlist.
2. FormModal is a modal-pass scenario. Confirm it still opens and sweeps the same kinds.
3. Superproject: `git -C <wt> fetch origin`, then `git -c submodule.recurse=false -C <wt> rebase origin/main`.
   - The CHANGELOG has moved, so if `## Unreleased` conflicts, keep every bullet.
   - Do NOT run `git submodule update`.
   - Afterwards, confirm the dse clone is still on its branch.
4. Run the full dse-verify battery ONCE on the final head.

   Expected at `54f8f88`:
   - tsc (incl. e2e) and lint (incl. e2e) clean
   - jest **5601 passed / 1 skipped / 234 of 235**, plus the branch's 6 tests (≈5607)
   - lifecycle **31/31**
   - e2e **95/98 ok, 0 failed, 3 known-bug, coverage 66/66**
   - shots **580**, 0 FAIL, with these lines:
     - gallery `button host-leak OK (112 … 672 …)`
     - `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … 228 …)`
     - `100 … ALLOWLISTED … (SC-361 …)`. This line should be absent if SC-361 was reconciled.
     - `text scale OK (1626 …)`
     - `text scale once OK (104184 / 208 loads …)`
   - freeze **280/280**
   - parity **0/0/24**

   Lifecycle and e2e are required.

## Footguns (adapter §8: 1, 9, 10, 11, 12, 13)
- Devbox: `devbox run -c <abs dse path> -- bash <script-file>`. Never `cd` inside a compound command. Record exit codes from a script FILE and read each gate's summary line. No `| tail`.
- Scratch: create a NEW private subfolder `sc356-r4-impl-<suffix>/` in the shared scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`. Write files with the Write tool. No glob `rm`.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated across sessions and branches, so a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; the 600s stream watchdog kills silent agents. Shots runs past 600s: launch it from a script file with output to a per-run log, and wait on its own PID or exit file. Never wait on a background-task notification.
- Never kill by pattern. Only kill PIDs whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` shared globs or `.superpowers/`. Never touch the freeze baseline. If freeze moves, STOP.
- Main-checkout dse dirt is Scott's live vault, not yours. Leave it alone.
- No tag, push or release. Never run `wt-finish` / `deploy*`.
- You cannot `SendMessage` me, and `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT. If you do send a message, the first word must be `SC-356:`.

## Report and return
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r4-impl-report.md`, opening with a summary of 10 lines or fewer. If the write is blocked, return the report inline.

Return raw facts:
- STATUS
- dse head and develop base shas
- superproject head and origin/main shas
- `git range-diff 8d890f9..2796ab8 <newbase>..HEAD` summary
- whether SC-361 was reconciled
- every gate line, verbatim
- the absolute path of every artifact
