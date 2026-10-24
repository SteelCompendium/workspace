# SC-501 r3 brief — fold-in fix round + rebase onto efc17de (resume of the r2 implementer)

Same rules as `sc501-r2-brief.md` (command shapes, scratch folder, no variable/glob rm, no
background gates, no pkill by pattern, tracker off-limits, shoot.mjs only, no workspace files).
Use a fresh private scratch subfolder `<scratchpad>/sc501-r3-<agentId>/`.

## Inputs
- Ledger `sc501-decisions.md` — sections "Owner rulings on r2 review" (your spec) and the
  SC-493 entry. Review report `sc501-r2-review-report.md` (LOW-1, LOW-2, INFO-1, FU-1 sections).

## Step 1 — rebase
`git -C /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements fetch origin`,
then rebase the branch onto origin/develop **`efc17de`** (SC-493 landed: FormModal guard + new
`src/framework/blockBody.ts`, no harness/gallery change). If `package.json` changed, run `npm ci`
via `devbox run -c <worktree>`. Report the rebased sha of the existing 1918a29 commit.

## Step 2 — the fold-ins (owner rulings, verbatim from the ledger)
- "FU-1: measurement = 0 -> FOLD into r3: assert a box right after tagging in the input and
  checkbox sweeps (fail, named, never skip); turn the input focus-visible branch that silently
  skips a box-less input (shoot.mjs ~3321, ~3496-3511, per INFO-1) into a failure."
- "LOW-1 (modal boundary kind key never names the modal, shoot.mjs:2703-2705, :3057): FOLD into
  r3 — include the scenario from the label sweepTaggedButtons already receives."
- "LOW-2 (stale comment range c0e761b..c98bd82, shoot.mjs:2622): FOLD into r3 — say "until SC-501"."
Out of scope (filed, do NOT touch): SC-512 (enabled roll Reset fixture), SC-513 (click-to-mount
controls: ability roll bar, hero ability bodies). INFO-3 dropped — leave the per-reason map.
Prove the FU-1 assertion can fail (sabotage in a scratch copy or temporarily, then revert): one
box-less input and one box-less checkbox each must exit 1 with a named problem.
Commit as new commits (`fix(SC-501): …`, `docs(SC-501): …`), no AI trailers.

## Step 3 — full battery on the rebased head
Expected at efc17de: tsc (incl. e2e) / lint (incl. e2e) clean · jest **6003 passed / 1 skipped /
242 of 243 suites** (compare after shots) · lifecycle **36/36** · e2e **`OBSIDIAN-E2E done:
114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**, 0 FAIL, expected
`OBSIDIAN APP.CSS PIN DRIFT` warning · freeze **280/280** · parity **0 / 0 / 24**.
Host-leak lines expected unchanged in counts (gallery 113/678, 12 records; modal 10/9/38/228,
6 records but now naming the modal scenario; input 164; checkbox 60). Copy every host-leak line
verbatim (incl. the boundary listing) into the report.

## Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-r3-impl-report.md`
(≤10-line exec summary first). Final text: STATUS, shas (each commit), numbers, absolute paths of
every log. Can't SendMessage me — end with STATUS: NEEDS_CONTEXT if blocked; any stray message
starts with `SC-501:`.
