# SC-459 r4 — rebase onto dse develop ba20072 and re-gate (+ fixes, if listed)

## 1. Context
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/decisions.md` (read the 2026-10-21 dispatcher entry). r2 report `sc459-r2-implement-report.md`, r3 review `sc459-r3-review-report.md`, same dir.
- dse repo `/home/scott/code/steelCompendium/worktrees/sc459-scroll-pin-gate/draw-steel-elements`, branch `sc459-scroll-pin-gate`, current head `be5607c` on `188755b`. `git -C <dse> fetch origin`; confirm `origin/develop` is `ba20072`; `git -C <dse> rebase origin/develop`. Run `npm ci` only if `package.json` changed between 188755b and ba20072 (check `git -C <dse> diff --stat 188755b ba20072 -- package.json package-lock.json`). `git -C <absolute path>` for EVERY git command.
- You never call the tracker. Never touch the main checkout (its dse dirt is Scott's live vault, expected).

## 2. Task
1. Rebase as above. Expect no conflicts (SC-366 touched `styles-source.css` and a new jest test only).
2. FIXES: apply these r3 findings, verbatim from `sc459-r3-review-report.md` (all FOLD per the ledger's "Owner rulings on r3 findings"):
   - **LOW-1** `obsidian-lifecycle.mjs:1201`: sampling stops at 2400 ms but the pin is released at about 3090 ms, so G-S8 never checks scrollTop across the release. A rebuild still short when the pin's 2.5 s timer ends would clamp unseen. Fix: sample until the attribute is gone plus about 10 frames (cap about 5 s); assert scrollTop held and min-height recovered to >= st0 before release.
   - **LOW-2** `previewScrollPin.ts:38-39`: "5501px -> 2486px" should be 2446px. That is the observer-measured minimum, and the gate itself prints 2446.
   - **LOW-3** `previewScrollPin.ts:27`: "comes only from a DSE block drawn FRESH" claims more than r1 tested (four non-DSE shapes). Scope it to SC-459's measurements.
   - **INFO-1** `previewScrollPin.ts:6`: line is 121 chars; reflow.
   - **INFO-2** `obsidian-lifecycle.mjs:1202/1207`: `on.rebuilt` is computed but never asserted. Owner ruling: phase 1 asserts the tracker was ADOPTED (not rebuilt), so a future change that stops adoption is visible.
   - **INFO-3** `obsidian-lifecycle.mjs:1219`: the nopin-js FAIL message hides the scrollTop drop to 2001; add stMin to it.
   - **INFO-4** `obsidian-lifecycle.mjs:1202`: "rebuilt" is also true when no tracker renders at all; assert a connected root exists.
   - **INFO-5** (part): update the stale one-line G-S8 description at `obsidian-lifecycle.mjs:24` to describe the two phases. Do NOT edit the workspace `.claude/skills/dse-verify/SKILL.md` (the dispatcher does that at landing).
   - **INFO-6** `previewScrollPin.ts:41-42`: "a scroller this pin never touched" is inexact for an external edit in the only pane.
   Scope stays: the G-S8 scenario object, its line-24 description, and the `previewScrollPin.ts` header comment. SC-460 is editing `obsidian-lifecycle.mjs` elsewhere. Out of scope: SC-470 (second pane / external edits). Report the new G-S8 runtime (it grows with LOW-1).
3. Built-output check: sha256 of built `main.js` + `styles.css` at your head vs a build of `ba20072`. State byte-identical or not.
4. Commit any fix as its own commit; no co-author trailers, no Claude/AI attribution.

## 3. Gates (dse-verify skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) — expected at ba20072
- tsc (incl. e2e) + lint clean; also `npx eslint visual-harness/obsidian-lifecycle.mjs` clean
- jest **5260 passed / 1 skipped / 230 of 231 suites** (no shots cache: one fewer passed, 2 skipped — say which)
- lifecycle `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed` with the two-phase G-S8 ok line
- e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`
- discrimination on the final head: nopin-js and nopin-css `--only=G-S8` FAIL, stock ok (reuse `sc459-r2-build-bundles.sh` / `sc459-r2-disc.sh`, copied into your private folder and re-pointed at the new base)
- shots/freeze/parity: skip ONLY if step 3 is byte-identical; otherwise shots 572 0 FAIL, freeze 276/276, parity 0 GAPs / 0 undeclared / 24 DECLARED.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc459-scroll-pin-gate/sc459-r4-report.md`, ≤10-line executive summary first; logs prefixed `sc459-r4-`.

## 5. Footguns
- If the report-file write is blocked by your harness, return the report inline.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc459-r4-<yourAgentId>/`; no generic script names.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Gates in the FOREGROUND only.
- Devbox `devbox run -c <dse> -- bash -c 'cd <dse> && …'`; capture rc in a wrapper script file; never pipe a gate into `tail`.
- Own `DSE_LIFECYCLE_PORT` in 9300–9399.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc459-scroll-pin-gate/`.
- Never `rm -rf` a `/tmp` glob; delete only exact paths you created. Under `.superpowers/` touch only `sc459-r4-` files.
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. Need input → end with STATUS: NEEDS_CONTEXT. Any message you send anyway starts with `SC-459:`.

## 6. Return contract
Raw facts to the ticket-owner: STATUS, head + base shas, each gate line + rc, discrimination FAIL/ok lines, built-output shas, `git status` clean, Drive-by fixes / Follow-ups, absolute artifact paths.
