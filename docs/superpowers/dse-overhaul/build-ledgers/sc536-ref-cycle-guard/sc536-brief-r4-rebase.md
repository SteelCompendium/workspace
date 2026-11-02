# SC-536 r4 — rebase onto f81a277 + two folds + drop the SKILL.md hunk (orchestration:implementer, r2 author resumed)

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/decisions.md` — read "Owner rulings on r3 findings".
- Review: `sc536-r3-review-report.md` (INFO-3, INFO-5) in the same dir.
- Worktree `/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard`; plugin branch `sc536-ref-cycle-guard` @ `432c50e2` (on `458abe3`); superproject worktree branch `sc536-ref-cycle-guard` @ `2f5eb7d1`.
- dse `develop` is now **`f81a277`** (SC-533 landed: `src/framework/chrome/mountChrome.ts` only, plus lifecycle G-S54). Verify with `git -C <plugin abs path> fetch origin` and `git -C <plugin abs path> rev-parse origin/develop`.
- **You never call the tracker.** Main-checkout dse dirt is Scott's live vault — never touch the main checkout.

## 2. Task (rulings quoted verbatim from the ledger)
"r4 = rebase onto f81a277 (keep G-S54 and G-S56 both; G-S56 last) + INFO-3 + INFO-5 + drop the dse-verify SKILL.md hunk from the superproject branch → proposal file `sc536-dse-verify-row4-proposal.md` in the ledger dir. Full battery."
- "INFO-3 (G-S56 base-failure text reads calls and raws in two evals): FOLD into r4 — read both in one `t.ev`."
- "INFO-5 (G-S56 detaches other leaves and runs last): FOLD into r4 — a comment at G-S56 saying so, and that a later scenario must set up its own leaves."
- Dispatcher instruction, verbatim: "your superproject branch edits .claude/skills/dse-verify/SKILL.md (row 4) — that file is dispatcher bookkeeping and row 4 has moved (now 43/43 with G-S53 + G-S54); please drop that hunk from the branch and put the proposed G-S56 text in a proposal file."

Steps:
1. Plugin: rebase `sc536-ref-cycle-guard` onto `origin/develop` (`f81a277`); resolve `obsidian-lifecycle.mjs` keeping G-S54 and G-S56, G-S56 last. `npm ci` only if `package.json`'s obsidian version changed. Commit INFO-3 + INFO-5 as one small commit.
2. Superproject worktree (`/home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard`, never `/home/scott/code/steelCompendium/workspace/`): remove the `.claude/skills/dse-verify/SKILL.md` change from the branch (a new commit that restores the file to its state on the superproject branch's base — check with `git -C <superproject worktree> diff <base>..HEAD -- .claude/skills/dse-verify/SKILL.md` that the branch's net diff for that file is empty). Keep the CHANGELOG bullet. If main moved, you may fast-forward/rebase the superproject branch onto `origin/main` first; never stage the `draw-steel-elements` pointer bump.
3. Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc536-ref-cycle-guard/sc536-dse-verify-row4-proposal.md`: the exact G-S56 sentence to add to dse-verify row 4 and the new count (44/44, halves as you measured them), written against the row as it is on `origin/main` now. Text only; the dispatcher applies it.

## 3. Gates (dse-verify, each one blocking foreground call)
tsc (incl. `-p e2e`), lint, jest, lifecycle two `--only` halves, e2e, shots, freeze, parity.
Expected (baselines @f81a277 + SC-536): jest **6228 passed / 1 skipped / 249 of 250** (6208 + 20; explain any other delta) · lifecycle **44/44** (dispatcher's halves at f81a277 are 22 + 21; put G-S56 in the half that keeps both under 600 s, report the split) · e2e `124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` (CHR-F02 known flake SC-539: re-run once and report both if it flakes) · shots 592, 0 FAIL, button host-leak 157/942 · freeze `freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.
If shots exceeds the 600 s tool timeout, do not wait on a notification: re-run it so it fits, or read its own log file for the final line.

## 4. Report
Append an `## r4` section to `sc536-r2-impl-report.md` with its own ≤10-line summary at the top of that section; logs `sc536-r4-*.log`, scripts `sc536-r4-*.txt`, in the ledger dir.

## 5. Footguns (obey all)
- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents; read the process's own output or a per-run unique path.
- Redirect long-running output to a file.
- One blocking foreground Bash call per gate ≤ 600 s; no `run_in_background`, no `Monitor`.
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc536-ref-cycle-guard/draw-steel-elements -- bash <script file>`; never `cd X && …`; `git -C <abs path>` always.
- Exit codes from a script file run through devbox; never pipe a gate into `tail`.
- Scratch via the Write tool in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc536-r4-<yourAgentId>/`.
- No `rm` with a variable target or glob; literal absolute paths you created only. Never `rm -rf` `/tmp/dse-obsidian-*` globs or `.superpowers/`.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd/command line is inside your worktree.
- Never `:1` for Xvfb. Never touch the freeze baseline.
- Out of scope: SC-541, SC-542, SC-537, SC-539.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` + the question if needed. Any message you send anyway starts with `SC-536:`.

## 6. Return contract
Raw facts to the ticket-owner: new plugin head sha + commits over f81a277, superproject head sha + net file list vs its base, measured gate numbers, lifecycle half split, plus absolute paths of every artifact (incl. the proposal file).
