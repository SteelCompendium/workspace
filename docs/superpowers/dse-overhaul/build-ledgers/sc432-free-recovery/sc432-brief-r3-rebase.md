# SC-432 r3 rebase brief (implementer A, resume)

Same worktree, footguns, gate wrapper rules (scripts ONLY in your private dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r3-impl-scripts/`), and return contract as r1/r2. Workers never call the tracker. Use `git -C <absolute path>` only. Do not push.

1. dse (`/home/scott/code/steelCompendium/worktrees/sc432-free-recovery/draw-steel-elements`, branch `sc432-free-recovery`, head `21a0244`): `git fetch origin`, rebase onto `origin/develop` = `71ac43a` (SC-454 deleted `src/utils/CodeBlocks.ts` + `test/unit/utils/code-blocks.test.ts`; `test/dom/views/minion-stamina-pool-modal.test.ts` now saves via `replaceFenceBody`). If origin/develop is past 71ac43a, rebase onto the newest and report it.
2. Superproject (`/home/scott/code/steelCompendium/worktrees/sc432-free-recovery`, branch `sc432-free-recovery`, CHANGELOG commit `8511748`): fetch, rebase onto `origin/main` = `44dc0ea`. Keep the SC-432 bullet under `## Unreleased`; do not bump the dse submodule pointer.
3. Report every conflict and how you resolved it (file, hunk). Run `npm ci` only if package.json/package-lock changed.
4. Full battery: tsc, lint, `rm -f main.js styles.css` then jest, lifecycle (own `DSE_LIFECYCLE_PORT`), e2e full, shots, freeze, parity. Expected: jest **5287** passed / 1 skipped / **229 of 230** suites (5257 baseline + our +30); lifecycle 27/27; e2e 89/92 ok, 0 failed, 3 known-bug, 59/59; shots 572; freeze 276/276; parity 0/0/24. Explain any difference.

Logs `sc432-r3-<gate>.log`; report `sc432-r3-rebase-report.md` with ≤10-line executive summary (new shas, conflicts y/n, gate numbers, e2e run id). Final text raw facts + artifact paths; NEEDS_CONTEXT if blocked.
