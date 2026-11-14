# SC-626 r2 reviewer brief — independent adversarial review of the montage focus fix

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/decisions.md`
- The r1 implementer brief (what was asked): `sc626-brief-r1-implementer.md` in the same dir. Read the r1 report
  (`sc626-r1-implementer-report.md`) only AFTER you have formed your own view of the diff — do not anchor on it.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc626-montage-focus-after-write`, dse branch
  `sc626-montage-focus-after-write`, head `11fbded6` on dse `develop` `a5313f9d`. Diff: `git -C <dse path> diff a5313f9d..HEAD`.
  Every git command is `git -C <absolute path>`. Do not commit to the branch except scratch probes you then revert;
  put probe specs/tests in your scratch folder or revert them before you finish (report the final `git status`).
- **You never call the tracker.**
- Gate reference: the `dse-verify` skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  (long lines: `sed -n 'A,Bp' | cut -c1-600`). Adapter footguns: `.claude/orchestrate/PROJECT.md` §8.
- Prior art for the pattern: `docs/superpowers/dse-overhaul/build-ledgers/sc614-*` (initiative) and `sc438-*`
  (montage e2e, how SC-626 reproduces); kit helper `src/framework/kit/controlFocus.ts`; Live Preview carry
  `src/framework/host/livePreviewFocusCarry.ts`.

## 2. Requirement (ledger, verbatim)

> A keyboard user tabs to a montage button (for example End round) and presses Enter. The write lands,
> the card is redrawn, and keyboard focus is gone: it sits on the page, not on the button. The same
> happens when the round strip is opened or closed, and when a montage window closes after it wrote.
> The user has to tab back from the top of the note after every action.
>
> Expected: focus returns to the same control after the redraw (or to its nearest equivalent when the
> control no longer exists).

> A fix must cover Reading view AND Live Preview.

> Follow the prior-art rule from SC-614 / SC-585 / SC-613: focus is restored only when it
> was inside the card (or the window that wrote) before the action; a write with focus elsewhere
> (outside edit, file-change re-render, click while focus is outside the card) never pulls focus in.

## 3. What to do — execute and probe, not just read

1. Make your own list of every montage control that writes or rebuilds (`src/elements/montage/*.ts`), every local
   rebuild (strip, guide), and the three windows. Check each against the fix: focus kept, successor sensible, no
   path missed. Compare with the implementer's table afterwards and name any gap.
2. Probe in real Obsidian (e2e probe specs run with `--only` / `--element=montage`, kept in scratch or reverted),
   Reading view AND Live Preview: keyboard Enter / Space on controls, the windows closing after Log / Add a hero /
   Set limits (and closing WITHOUT a write — must not misplace focus), End round on the last round, the negative
   rule (focus outside the card, an outside edit to the note while focus is in another pane / another block, two
   montage blocks in one note — focus must not jump to the other block's twin control), embeds / hover previews if
   the montage renders there.
3. Check the tests are not vacuous: revert the `src/` change (keep the tests), run the new and flipped tests, and
   count the reds. A test that stays green with the fix reverted is a finding.
4. Check initiative / conditions behaviour is unchanged if the kit was touched.
5. Re-run the full battery yourself (tsc, lint, jest, lifecycle in seven parts, full e2e, shots, freeze, parity —
   order and part lists in the r1 brief §3). Report each summary line.

## 4. Gates — expected

Baseline at `a5313f9d` (SC-615 landed): jest 12133 / 1 with shots cache · lifecycle 64/64 · e2e `424/437 ok,
0 failed, 13 known-bug, coverage: 233/233 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, clip 147 ·
freeze 280/280 · parity 0 / 0 / 24. After the fix: e2e known-bug **9** (the 4 SC-626 ones become ok), plus the r1
report's new-test counts; everything else as the r1 report claims — verify it.
Lifecycle signals: G-S91 FAIL is real unless "host too slow" after two re-runs; G-S115 (g) with the "changed on disk
first" Notice on a loaded host gets ONE re-run of part 7; restore `demo-vault/.obsidian/appearance.json` before
blaming G-S97 (SC-622); jest "Exceeded timeout" is a real hang until proven otherwise.

## 5. Footguns

Same list as the r1 brief §4 — read it. In particular: **never `rm`/`rm -f`/`rm -rf`/`rmdir` anything in /tmp or
the scratchpad**; leave throwaway files. Private scratch folder:
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc626-r2-rev/`.
`devbox run -c <dse path> -- bash <script file>`; no `cd` in compound commands; kill only your own PIDs; redirect
long output to files; poll your own pid, never wait on a background notice. If the report write is blocked, return it
inline. You cannot `SendMessage` me; for input end with `STATUS: NEEDS_CONTEXT`. Any stray message starts `SC-626:`.

## 6. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc626-montage-focus-after-write/sc626-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX, finding counts by severity, gate numbers). Findings by
severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, the failure scenario, and a prescribed fix. Paths of
every evidence artifact. Final text to me: raw facts only — verdict, counts, gate lines, report path.
