# SC-356 round 3: review fixes, rebase onto 95981f1+, full battery

## 1. Context loading
- Read FIRST: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md`, then `sc356-r2-impl-report.md` and `sc356-r2-review-report.md` in the same dir.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons`. The dse clone is `…/draw-steel-elements`, branch `sc356-hostleak-modal-buttons`, head `b01268c` on `772c3cd`. The superproject doc commit is `db07e0a` on `27ed1bf`.
- Use `git -C <absolute path>` for every git command. Never edit under `/home/scott/code/steelCompendium/workspace/` except to write your report in the ledger dir. Workspace-level docs live in YOUR worktree's superproject.
- You never call the tracker.

## 2. Tasks, in order
1. **Review findings to fix:** see §2a below. They are quoted verbatim from the review.
2. **Rebase the dse clone.** Run `git -C <dse> fetch origin`. `origin/develop` should be `8d890f9` or newer; rebase onto the tip and report its sha. Since your base, SC-457 landed (shared `fenceLanguage`, lifecycle G-S14). SC-422 also landed: text-size knobs stamped on chrome roots in the search modal, settings preview and sidebar, and `visual-harness/entry.ts` + `shoot.mjs` gained chrome-surface text-scale gates. **Expect a `shoot.mjs` conflict.** Resolve it so that BOTH SC-422's text-scale gates and SC-356's gallery + modal host-leak passes survive intact. Never drop or weaken either side. Document every conflict hunk and how you resolved it in the report. SC-432 then landed too: in the stamina modal, Spend Recovery is disabled for creatures, plus a no-pool hero confirmation (new e2e STAM tests). StaminaEditModal is one of your modal-pass scenarios, so re-verify it still opens and finds its controls. Explain any change in kind or exemption counts (e.g. a new disabled kind or focus-visible exemption) and any new modal the registry check reports (the no-pool confirmation may be a new Modal subclass or a ConfirmModal reuse).
3. **Rebase the superproject doc commit** onto current origin/main: `git -C <wt> fetch origin`, then `git -c submodule.recurse=false -C <wt> rebase origin/main`. Do NOT run `git submodule update`. Afterwards confirm the dse clone is still on its branch at your head. If `origin/main`'s dse-verify SKILL.md host-leak bullet changed, merge the two texts.
4. Commit after every coherent step.

### 2a. Review findings (verbatim)
The full review is in `sc356-r2-review-report.md`. Rulings are in the ledger section "Round 2 review". Fix exactly these:

- **LOW-1:** the block is described as modal-only, but in-note negotiation chips (`ArgumentView.ts:155`, `MotivationsPitfallsView.ts:79`, class `.dse-nt__chip`) also carry `.dse-optchip`. Today they keep their look only because their own rules are more specific. **Owner ruling:** correct the comment at `styles-source.css:~17176` ("only exist inside a MODAL") and the worktree dse-verify `SKILL.md:~194` ("modal-only and never mounts there"). Keep the block unscoped, and add a jsdom pin that `.dse-nt__chip`'s own height/display/fill/ink rules win over the SC-356 block.
- **LOW-2:** `display: flex` at `styles-source.css:~17197` is not Obsidian's value: Obsidian's `button` uses `inline-flex`, and the block also overrides the icon choice's own `inline-flex`. A chip in a non-flex parent would go full width. **Owner ruling:** use `inline-flex`, fix the comment, and update the jsdom pin.
- **LOW-3:** `assertModalRegistry` (`visual-harness/shoot.mjs:~2834`) sees only direct subclasses and only `<button>`s created in the same file. **Owner ruling:** make it see transitive subclasses (X extends Y extends Modal/DseModal) and inline `new Modal(` constructions. Do NOT attempt cross-file button-helper detection (dropped: the 3 declared-unreachable modals already build buttons through `footer()`, so it would need a call graph, and no live case exists).
- **INFO-4:** after SC-422 the harness can mount CompendiumSearchModal's rows, so its "not openable" reason is partly stale. The modal still has no `<button>`. **Owner ruling:** reword the reason accurately.
- **INFO-2:** the superproject trial merge conflicts in CHANGELOG `## Unreleased`. Keep both bullets. Re-check every number in your SKILL.md bullet after the rebase.

Out of scope (dropped in the ledger, do not touch): INFO-1, the SC-361 allowlist's tolerance across states. SC-361 deletes the entry outright.

## 3. Gates: full dse-verify battery at the final head
Expected at base `8d890f9`:
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **5585 passed / 1 skipped / 234 of 235 suites**, plus your 5 tests (+ any new ones)
- lifecycle **31/31**
- e2e **95/98 ok, 0 failed, 3 known-bug, coverage 66/66**
- shots **580**, 0 FAIL, including `text scale OK (1626 …)`, `text scale once OK (104184 / 208 loads …)`, gallery `button host-leak OK (…)` and `modal button host-leak OK (…)` with the SC-361 allowlist count. If a text-scale count moves because of your change, explain it.
- freeze **`freeze OK (280/280 …)`**
- parity **0 GAPs / 0 undeclared / 24 DECLARED**

Lifecycle and e2e are REQUIRED.

## 4. Footguns (adapter §8: 1, 9, 10, 11, 12, 13)
- Devbox: `devbox run -c <abs dse path> -- bash <script-file>`. Never `cd` inside a compound command. Record exit codes from a script FILE run through devbox and read each gate's summary line; `bash -c '…; echo rc=$?'` under devbox always records 0. No `| tail` on gates.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED. Use a NEW private subfolder `sc356-r3-impl-<random suffix>/` with uniquely named scripts and logs. Write scratch files with the Write tool, not heredocs. No glob `rm`.
- Never key a wait-loop on a scratch filename or its contents. The scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it; the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (≤600000ms per call). Never background a gate and wait for a notification.
- Never `pkill`/`killall` by pattern. Kill only PIDs whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` `/tmp/dse-obsidian-lifecycle-*` or `.superpowers/`. Never touch `.superpowers/sdd/freeze-baseline.sha256`. If freeze moves, STOP and report.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault, not yours. Expected.
- Never tag, release or push. Never run `just wt-finish` / `deploy*`.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT. If you ever message anyway, the first word must be `SC-356:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r3-impl-report.md`, opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## 6. Return contract
Raw facts only:
- STATUS
- new dse head sha and commit list, plus the develop sha it is rebased on
- superproject doc commit sha and the origin/main sha it sits on
- per-finding fix (finding id → commit)
- the conflict-resolution summary
- every gate summary line, verbatim
- `Drive-by fixes:` / `Follow-ups:`
- the absolute path of every artifact
