# SC-574 r1 — independent reviewer brief

## 1. Context

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc574-pool-modal-custom-conditions/decisions.md`,
  the implementer brief `sc574-r1-implementer-brief.md` and its report
  `sc574-r1-implementer-report.md` in the same dir. You did not write this code.
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc574-pool-modal-custom-conditions/draw-steel-elements`,
  branch `sc574-pool-modal-custom-conditions`, head `580c9f84` (verify), base dse develop
  `c3fd8323`. Review `git -C <that path> diff c3fd8323..HEAD`. Do not commit to the branch; any
  probe code goes in a scratch copy or is reverted (`git -C … stash`/`checkout -- <file>` on files
  YOU changed only) before you finish — leave the tree exactly at `580c9f84` and clean.
- Read the `dse-verify` skill (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`,
  ~290 KB, read in parts) before running any gate.
- Main checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected.

## 2. Task — execute and probe, don't just read

Spec (ticket, verbatim):

> 1. A custom condition (one that isn't a built-in Draw Steel condition) shows no icon in the
>    modal, so you can't see it or remove it there. The initiative tracker shows a fallback icon
>    for it (SC-186).
> 2. If the same condition appears twice as plain text in the note, one click removes both copies.
>
> **Expected:** custom conditions show the same fallback icon as the tracker, and one click
> removes one copy.

Probe at least:

- Is the fallback icon truly the tracker's (same source, not a copied literal that can drift)?
  Compare a custom condition's rendering in the tracker vs the modal (icon, aria-label, color,
  effect, object entry with its own `icon`, object entry with no key, empty-string key,
  whitespace key).
- Removal by position: duplicates (strings, objects, mixed string+object of the same key),
  removing first vs second vs last, rapid double-click, keyboard Enter/Space on a duplicate,
  focus hand-off after removal (SC-572 behavior) incl. removing the last icon.
- Persistence integrity: the saved note after removal — other conditions, other minions, other
  creatures, the rest of the block and text outside it survive; two pool modals / two blocks
  don't cross-talk; removal + damage in one session both persist once (DC-6 in the file header).
  Format change on write-back is SC-592 and out of scope — note but don't count as a finding
  unless this diff made it worse.
- Tests: are the flipped `test.failing` cases and the new jest/e2e cases non-vacuous? Mutate the
  fix back (in a scratch stash) and confirm they fail. Check no e2e title carries a bracketed
  ticket id, and that the new scenarios are in the manifest so coverage stays Y/Y.
- Re-run the gates yourself: tsc, lint, jest, e2e (full), and the lifecycle part(s) that touch
  the pool modal (find them in dse-verify / the lifecycle SCENARIOS list); shots + freeze if the
  diff touches any CSS or rendered fixture.

Expected numbers at base `c3fd8323`: jest 7200 passed / 1 skipped · lifecycle 54/54 (five
`--only` parts: `G-S7a … G-S9a` 21; `G-S9b … G-S40` 16;
`G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` 9; `G-S57 G-S62 G-S61 G-S56` 4;
`G-S59 G-S49 G-S73 G-S77` 4) · e2e `260/265 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (known bugs SC-257, SC-355, SC-384, SC-580, SC-588)
(the branch adds scenarios — check the implementer's claimed numbers) · shots 592, host-leak
163/978, modal host-leak 39/234, capture clip 147 · freeze 280/280 · parity 0/0/24.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc574-pool-modal-custom-conditions/sc574-r1-reviewer-report.md`,
opening with a ≤10-line executive summary (verdict: LAND-READY or FIX-REQUIRED, counts by
severity). Findings by severity (HIGH/MED/LOW/INFO) with file:line, a failure scenario, and a
prescribed fix. Gate summary lines verbatim. If the report write is blocked, return it inline.

## 4. Return contract

Final text goes to the ticket-owner: verdict, shas, measured numbers, artifact paths. No prose.

## 5. Footguns

- `devbox run -c <abs dse path> -- bash <script-file>`; never `cd` inside a compound command;
  devbox eats `$?` and `| tail` eats failures — exit codes from a script file, output to logs.
- `git -C <absolute path>` for every git command.
- Each gate is ONE blocking foreground call (600 s limit; lifecycle in `--only` parts). No
  `run_in_background`, no Monitor; never wait on a notification.
- Private scratch:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r1-rev/`,
  unique names, Write tool for files. Never key a wait-loop on a scratch file name/content.
- No `rm` with a variable or glob; never `rm -rf` `.superpowers/` or a `/tmp` glob.
- Never `pkill`/`killall` by pattern; kill only PIDs whose cwd/cmdline is inside this worktree.
- Stale superproject pin → `token-coverage.test.ts` phantom red: use `DSE_TOKEN_MAP_PATH` at the
  main checkout's `docs/superpowers/dse-overhaul/D3-token-map.md`.
- You cannot `SendMessage` me; end with `STATUS: NEEDS_CONTEXT` if blocked. Any stray message
  starts with `SC-574:`.
