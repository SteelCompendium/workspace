# SC-648 r3 — implementer: review fixes + rebase + land prep

You are the SC-648 r3 implementer (fix round). Your final text goes to the SC-648 ticket-owner, not a human.
Re-read the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/decisions.md`
first (new entries: the dispatcher's rebase instruction, the new baseline, the r2 rulings), then the r2 review report
`sc648-r2-review-report.md` in the same dir. Your r1 brief `sc648-brief-r1-implementer.md` still holds for every
rule, path, scratch-folder and gate-running footgun — re-read its §1 and §3; use scratch subfolder
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc648-r3-impl/`.
Workers never call the tracker.

## 1. Review findings to fix (verbatim from r2, with the owner's ruling)

- **LOW-1 (FOLD):** `e2e/driver/negotiation.ts:149-156`. The helper's comment and check assume a menu with no room
  below ends at the button's top. Obsidian (1.14.4 and 1.15.1) actually moves it up to end at the button's bottom,
  covering the button. Measured: button 1046–1070, menu 1033–1071. No current test hits this case. If one ever puts
  the button within about 40 px of the window bottom, it fails even though the product is right. Fix: use
  `Math.abs(m.bottom - b.bottom) <= tol` as the second vertical check and correct the comment.
- **INFO-2 (FOLD, comment only):** Obsidian's own ⋮ buttons use `setParentElement(btn).showAtPosition({x, y: bottom,
  width, overlap: true, left: true})`. The `view.ts:169` comment about `width` holds only without `overlap: true`.
  Correct the comment to say so. Do NOT change the call — adopting Obsidian's form is optional and not needed.
- INFO-1 (menu covers its own button near the window bottom — Obsidian's own menus and the mouse path do the same)
  and INFO-3 (hidden zero-size Reading-view copy; the keyboard can't reach it): no action.
- INFO-4: the rebase in §2 covers it.

Out of scope (do not fix): SC-659 (Space-opened menu ignores the first Escape), SC-639, SC-640, SC-641, SC-649.
SC-649 is editing a different part of `e2e/driver/negotiation.ts` in parallel — touch only the SC-648 helper there.

## 2. Rebase (dispatcher instruction, quoted from the ledger)

> SC-629 landed; dse develop is now **3e88b3f5**, workspace main **dc16b57d**. Before land-ready: rebase dse onto
> 3e88b3f5; superproject branch on current workspace main with the CHANGELOG commit and ONE pointer bump.

Steps (all `git -C <absolute path>`, never `cd X; git …`):
1. Plugin `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position/draw-steel-elements`:
   commit the fixes, `git fetch origin`, `git rebase 3e88b3f5` (verify `origin/develop` is still 3e88b3f5; if it
   moved, stop and report). SC-629 touched `e2e/README.md` — resolve any conflict keeping both sides.
2. `npm ci` only if `package.json` / the lockfile changed between 09c879f2 and 3e88b3f5.
3. Superproject `/home/scott/code/steelCompendium/worktrees/sc648-negotiation-menu-position`: `git fetch origin`,
   rebase the branch onto `origin/main` (must be dc16b57d or later — report the sha). It must carry exactly the
   CHANGELOG commit (bullet under `## Unreleased`; on a CHANGELOG conflict keep every other bullet) and then **one**
   commit `chore: bump draw-steel-elements to <short sha> (SC-648: negotiation options menu opens beside the button
   from the keyboard)` staging only the `draw-steel-elements` pointer at the final rebased plugin head. No other
   pointer changes: `git -C <super> diff origin/main --stat` must show only `CHANGELOG.md` and
   `draw-steel-elements`. If a later fix moves the plugin head, amend that one bump commit rather than adding a
   second. No AI-attribution trailers.

## 3. Gates on the rebased head — new baseline at 3e88b3f5

jest 13325 passed / 2 skipped fresh (13326 / 1 with the shots cache) · lifecycle 64/64 · e2e `592/608 ok, 0
failed, 16 known-bug, coverage: 416/416 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip
147 · freeze 280/280 · parity 0/0/24.

Expected with SC-648: tsc + lint clean · jest 13327 / 2 · lifecycle 64/64 (seven parts, `--only=` with the equals
sign; check each log's first lines list only that part's ids) · e2e `596/611 ok, 0 failed, 15 known-bug,
coverage: 417/417 pairs`.

**styles.css changed in SC-629** (`styles-source.css`), so the old `18730938…f1f9` no longer applies: compare your
build's sha256 with a clean **3e88b3f5** build (e.g. `git -C <plugin> worktree add <abs scratch path> 3e88b3f5`
and build there, or `git archive 3e88b3f5` into a scratch dir). If identical, shots / freeze / parity carry; if
not, run them per dse-verify.

Known flakes and the gate-running rules are in your r1 brief §3 — they all still apply. Never `rm` anything in /tmp
or the scratchpad; never pkill by pattern; long gates: log to a file, find YOUR pid, wait with repeated
`timeout 175 tail --pid=<pid> -f /dev/null`, read the log's own summary; no Monitor, no waiting on background
notifications; never key a wait on a scratch filename.

## 4. Report & return

Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc648-negotiation-menu-position/sc648-r3-implementer-report.md`,
≤10-line executive summary first (inline if the write is blocked). Final text: STATUS, plugin head sha + commits
since 3e88b3f5, superproject head + its two commit shas + its base sha, each finding's disposition, every gate number
(e2e `OBSIDIAN-E2E done:` line verbatim, lifecycle per part, jest, styles.css sha vs the clean 3e88b3f5 build),
artifact paths. `Drive-by fixes:` and `Follow-ups:` separately. You cannot message me; for input end with STATUS:
NEEDS_CONTEXT. Any message you send anyway starts with `SC-648:`.
