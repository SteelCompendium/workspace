# SC-432 r4 rebase brief (implementer A, resume) — Scott approved: "Looks good, land it"

No product changes. Rebase + full re-gate only. Workers never call the tracker. `git -C <absolute path>` for every git command. Do not push. Do not bump the dse submodule pointer.

## Footguns (adapter §8, mandatory)
- **12:** the session scratchpad is shared. Every script and scratch file goes in a private folder: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc432-free-recovery/sc432-r4-impl-scripts/`, uniquely named (`sc432-r4-*.sh`). Never a generic `gate.sh`.
- **13:** run gates as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc432-free-recovery/draw-steel-elements -- bash /abs/path/sc432-r4-<gate>.sh`. Never `cd` inside a compound command. Create scratch/script files with the Write tool, not heredocs. No glob `rm` (delete only named files you created). An echoed `$?` inside `bash -c` always reads 0; record exit codes inside the script file and read each gate's summary line.
- **9 / 11:** never `pkill`/`killall` by pattern; kill only by PID whose command line contains `worktrees/sc432-free-recovery/`. Never `rm -rf` a shared `/tmp` glob or the shared `.superpowers/` dir.
- Run gates in the FOREGROUND, output redirected to files (the 600 s stream watchdog kills silent agents); never background a gate and wait for a notification. Never key a wait on a scratch filename or its contents.
- `rm -f main.js styles.css` (named files) in the plugin root before jest. Own `DSE_LIFECYCLE_PORT` (e.g. 9291). Never `--headed` on `:1`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's vault; ignore it.

## Steps
1. dse (`/home/scott/code/steelCompendium/worktrees/sc432-free-recovery/draw-steel-elements`, branch `sc432-free-recovery`, head `1cbf6f6` on `71ac43a`): `fetch origin`, rebase onto `origin/develop` = `bc4a0c5` (or newer — report it). **Expected touch-point:** SC-466 changed `src/elements/stamina-bar/model.ts` so writes keep only the declared keys. Any of our tests asserting a legacy stamina-bar block's written text (e.g. STAM-Q13*, the `recoveries`-without-`recoveries_max` path, jest legacy-block tests) may now need updating to the new key-preserving output — update the ASSERTION to the new correct output; never reintroduce default keys. If a conflict needs hand resolution, record file + hunk + resolution.
2. Superproject (`/home/scott/code/steelCompendium/worktrees/sc432-free-recovery`, branch `sc432-free-recovery`, CHANGELOG commit `8e22782`): fetch, rebase onto `origin/main` = `61a8288` (or newer). Keep the SC-432 bullet under `## Unreleased`.
3. `npm ci` only if package.json / package-lock changed in the incoming range.
4. Full battery: tsc (incl. `-p e2e`), lint, jest, lifecycle, e2e full, shots, freeze (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <worktree>/draw-steel-elements/visual-harness/shots`), parity.

Baseline at bc4a0c5: jest 5457 / 1 skipped / 232 of 233 · lifecycle 30/30 · e2e 89/93 ok, 4 known-bug, coverage 64/64 · shots 580 · freeze 280/280 · parity 0/0/24.
Expected after (our branch adds +30 jest, removes the one SC-432 knownBug, adds 5 e2e tests and 2 coverage pairs): jest ~5487 / 1 skipped / 232 of 233 · lifecycle 30/30 · e2e 0 failed, known-bug 3, coverage ~66/66 · shots 580 · freeze 280/280 · parity 0/0/24. Explain any difference (other landings may have touched the same tests).

## Report
Logs `sc432-r4-<gate>.log` in the ledger dir; report `sc432-r4-rebase-report.md` opening with a ≤10-line executive summary (new dse head + base, superproject sha + base, conflicts y/n with files, every gate number, e2e run id). If the report write is blocked, return it inline. Final text: raw facts + absolute paths of every artifact. You cannot SendMessage me; if blocked end with STATUS: NEEDS_CONTEXT. If you ever message anyway, first word `SC-432:`.
