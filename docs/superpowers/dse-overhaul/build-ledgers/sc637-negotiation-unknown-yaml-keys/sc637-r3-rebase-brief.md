# SC-637 r3 — rebase round (resume of the r1 implementer)

Same worktree, branch, footguns and report rules as `sc637-r1-implementer-brief.md` (re-read its sections 3-4).
r2 review: LAND-READY on `4e30dcfb`, no code changes requested (rulings in the ledger). This round only moves the
branch onto the new bases and re-gates.

1. **dse:** `git -C <plugin abs> fetch origin`; `origin/develop` should be **`941b814f`** (SC-440 settings-tab e2e
   landed: tests, settings manifest, `data-dse-control` ids on settings controls; it touches `e2e/README.md` — expect a
   conflict there; keep both sides' content). Rebase `sc637-negotiation-unknown-yaml-keys` onto it. If it moved past
   `941b814f`, rebase onto the newest and say so. Run `npm ci` only if `package.json` / `package-lock.json` changed.
   Check no `NEGO-*` / scenario id now collides with SC-440's (`SET-*`) or anything else (scenario ids are global),
   and no bracketed ticket id in any test title.
2. **Superproject:** `git -C /home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys fetch origin`,
   rebase the CHANGELOG commit onto **current workspace `origin/main`** (at least `c588bbaa`; resolve any CHANGELOG
   conflict by keeping every other bullet). Then make exactly ONE pointer-bump commit on top:
   `chore: bump draw-steel-elements to <new dse head short sha> (SC-637: negotiation writes keep keys the negotiation does not use)`.
   Final superproject shape: `origin/main` + CHANGELOG commit + pointer bump, nothing else
   (`git -C <wt> log --oneline origin/main..HEAD` shows exactly 2). The gitlink must equal the dse branch head. Do not
   push anything.
3. **Battery on the rebased dse head:** tsc, lint, jest (fresh), lifecycle (seven `--only=` parts, as in the r1
   brief), e2e (full). Also build `styles.css` and compare sha256 with a clean `941b814f` build (expected both
   `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` unless SC-440 changed CSS; if the base build
   differs from 18730938…, report both and say whether branch == base).
   Expected: the base numbers moved with SC-440 and I do not have them yet. Report the head numbers; our deltas over
   any base are jest +39 tests, e2e ok +7 / total +5 / known-bug -2, coverage pairs unchanged. If e2e shows any
   failure, re-run that spec alone on the head AND on a clean `941b814f` checkout (scratch `git worktree add` in your
   private dir) to tell a base problem from ours.
4. Update `sc637-skill-proposal.md` numbers to the rebased head.

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc637-negotiation-unknown-yaml-keys/sc637-r3-rebase-report.md`,
≤10-line summary first: new dse head, superproject `log --oneline origin/main..HEAD`, gitlink, conflicts and how
resolved, every gate number, styles.css hashes, logs. Never `rm` anything in /tmp or the scratchpad.
Final text to the owner: raw facts, shas, numbers, artifact paths.
