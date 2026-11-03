# SC-551 r2 — the same ownership proof for obsidian-camera (obsidian-shots + docs-shots' Obsidian half)

You are the SC-551 implementer, continuing on the same worktree/branch after r1. Your final text goes to the
ticket-owner: raw facts, shas, measured numbers, absolute paths of every artifact. Everything in
`sc551-brief-r1-impl.md` §1 (context, worktree rules, never call Linear) and §5 (footguns) still applies —
re-read both. Private resources for this round: Xvfb `:5400–:5439`, ports `47000–47999`.

## Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/decisions.md`
  — read rulings **R5, R6, R8** (new since r1).
- Survey report (read its exec summary + the camera section only):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r1-survey-report.md`;
  its probe P4 script is under `.../sc551-r1-survey-evidence/scripts/` — reuse it as the base repro.

## The task

Ruling R5, verbatim from the ledger:

> R5 — obsidian-shots / docs-shots Obsidian half (`visual-harness/obsidian-camera.mjs`): same wrong-instance race,
> proven harmful (survey P4: the unmodified camera ran `app.plugins.setEnable(true)` in a foreign Obsidian and would
> go on to delete/create notes, write appearance settings and `app.quit()` it). FOLD INTO THIS EFFORT, using the R1
> helper with the same rules: default port 0 read back from OUR process; explicit `DSE_CAMERA_PORT` keeps its
> pre-check plus the ownership proof; proof complete before any CDP connect/evaluate; every later target search
> (`:678`, `:1459`, `:1833`) uses only OUR proven port (and, if it re-reads the target list, only targets of our
> proven browser). Because the camera's user-data-dir persists, a STALE `DevToolsActivePort` is on disk (survey):
> the helper must delete it before spawning (or rely on our child's stderr line only) — apply that in the helper so
> lifecycle gets it too. No change to what the camera captures; shots/freeze bytes must not move.

Out of scope, cite and do not fix: the camera's shared default user-data-dir is **SC-554** (R6); the e2e
chromedriver port is **SC-553** (R7); the two evidence scripts are dropped (R8). Do not touch e2e, lifecycle
scenario code, `src/`, styles.

Steps: (1) base repro of P4 on the r1 sha (a fake/our-own decoy Obsidian or fake CDP server on a private port that
appears after the camera's pre-check; the camera must be shown attaching to it) — never another session's
Obsidian; (2) wire the helper into the camera (+ the stale-file rule into the helper, with a jest test for it);
(3) re-run the repro → exit 2 with the env message naming the port, no CDP connect to the decoy; (4) default port 0
run → camera works.

## Gates

- tsc (incl. `tsc -p e2e`), lint clean; jest = your r1 number + the new tests (report the exact line).
- `npm run obsidian-shots` once on the branch, on a private `DSE_CAMERA_DISPLAY` (`:54xx`) and NO `DSE_CAMERA_PORT`
  (the new port-0 default) — must finish with its normal success output and exit 0; and once more with
  an explicit private `DSE_CAMERA_PORT` (47xxx). Note: obsidian-shots uses the shared default camera udd
  (SC-554) — set `DSE_CAMERA_TMP` to a path under your private scratch folder for both runs so you cannot clobber
  another session's camera. Report the PNG count and compare the PNG set (names) to a run at the r1 sha with the
  same env, if time allows; byte differences in real-Obsidian PNGs between two runs are expected noise — say how
  many differ, don't chase them.
- If you can run docs-shots' Obsidian half cheaply (`obsidian-camera.mjs --docs`) do one run with private env;
  otherwise say why not.
- lifecycle: re-run ONLY part 1 (21) with a private explicit port, plus one cheap scenario with the default port 0,
  because the helper changed. e2e not needed again (e2e files untouched) unless you touched anything under `e2e/`.
- `main.js`/`styles.css` still byte-identical to the `eafe76e1` build.

## Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc551-lifecycle-cdp-port-race/sc551-r2-camera-report.md`,
opening with a ≤10-line executive summary; evidence under `.../sc551-r2-evidence/`. Update
`sc551-r1-dse-verify-proposal.md` if the camera text in SKILL.md (the "Run the camera on a PRIVATE Xvfb + port"
line ~336) should change. `Drive-by fixes:` / `Follow-ups:` lists at the end.
