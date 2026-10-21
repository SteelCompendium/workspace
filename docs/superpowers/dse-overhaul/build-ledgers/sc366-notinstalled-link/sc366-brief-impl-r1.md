# SC-366 implementer brief, round 1

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/decisions.md (the ledger — current state; quote from it, don't reinterpret).
- Read: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (the gate battery, command shapes, freeze/parity rules, rebaseline flow).
- Read: /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements/AGENTS.md (or CLAUDE.md) if present.
- Worktree: /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link — dse at draw-steel-elements/, branch `sc366-notinstalled-link`, cut from `develop` @ `188755b`. Verify `pwd` before any write. Every git command uses `git -C <absolute path>` — never `cd X; git …`.
- First: `git -C /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements fetch origin` and confirm `origin/develop` is still `188755b`; if it moved, rebase onto it and note the new sha.
- You NEVER call the tracker (Linear) — not to read, not to post.
- The workspace-level files live in YOUR worktree's superproject at /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/ — never edit under /home/scott/code/steelCompendium/workspace/ (except writing your report into the ledger dir above). The main checkout's dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault — expected, not yours, don't touch or flag it.

## 2. The task
The not-installed degrade card in `src/elements/shared/RefUnwrapView.ts` (~line 359–367) draws a "View on steelcompendium.io" link, `a.dse-ref-web-card__link.external-link`, inside `.dse-ref-notice.dse-ref-web-card`. It renders in Obsidian's host link colour, not the plugin's `--dse-accent` teal-cyan, because `.dse-ref-notice` isn't in the `.dse-card a` / `.dse-feature a` colour family (styles-source.css ~8893–8905).

Ticket ask (verbatim): "Decide whether this link should use the plugin's link colour, then add `.dse-ref-notice` (or the link class) to the colour family. Visual change: needs a crop for review."

Owner decision (verbatim from the ledger): "YES, the link uses the plugin's link colour. ... Scope: add the link class (`.dse-ref-web-card__link`) to that family — the narrowest selector, so the notice card's other text is untouched. Must mirror the family's exact gating (steel theme, not print) and its :hover rule."

Do:
1. Add the link to the existing colour family selectors (both the base and the :hover rule) in `styles-source.css` with identical gating — or, if the family is generated/duplicated elsewhere (built `styles.css`, a token map, a parity contract), follow the repo's established mechanism. Check how `styles.css` is produced and whether it is committed.
2. Confirm the SC-317 external-link arrow follows the link colour (it should, via currentColor) in both light and dark.
3. Check print mode: the family is `:not([data-dse-print="on"])`, so print keeps its current look — confirm print shots of this card (if any) are unchanged.
4. Add/extend a test only if the repo has an existing pattern that pins these colour-family selectors (e.g. a CSS contract test). Don't invent a new harness.
5. SC-422 (text-scale CSS) and SC-326 (montage board CSS) are editing styles-source.css in other worktrees concurrently — keep your edit to this one link, no reformatting or neighbour cleanup.
6. Commit on the branch (conventional message, e.g. `fix(css): SC-366 ground not-installed card link to --dse-accent`). No co-author or AI attribution trailers. Do not push.

## 3. Evidence (Scott reviews a crop; he is colourblind)
- Produce BEFORE (develop 188755b) and AFTER crops of the not-installed card, light and dark scheme, at a scale where the link and its arrow are legible (crop tightly to the card, 2x if the harness supports it). Find the existing shot of this card in visual-harness (grep for `ref-web-card` / not-installed fixtures). If no shot exists, say so and render one via the harness's existing mechanism.
- Also measure the computed `color` of the link before and after (getComputedStyle in the harness) and report the rgb values plus the token name. Name colours in words in your report (e.g. "teal-cyan accent", "host purple-blue link") — never hue alone.
- Save evidence in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/ with `sc366-` prefixed filenames.

## 4. Gates (dse-verify skill, in order). Expected numbers at dispatch (CURRENT @ 188755b):
- tsc (incl. `tsc -p e2e`) + lint (incl. e2e/) clean
- jest 5257 passed / 1 skipped / 229 of 230 suites (fresh worktree: one fewer passed + 2 skipped until `npm run shots` has run — compare after shots)
- lifecycle `OBSIDIAN-LIFECYCLE done: 27/27 ok, 0 failed` (set your own DSE_LIFECYCLE_PORT, e.g. 9366)
- e2e `OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`
- shots 572, 0 FAIL
- freeze `freeze OK (276/276 …)` — if this change moves frozen bytes (the not-installed card may be frozen), that is EXPECTED for a sanctioned visual change: do NOT touch the baseline; ship `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/rebaseline.txt` (ready-to-apply hash lines) + before/after crops per dse-verify, and list exactly which frozen shots moved. Any moved shot that is NOT this card is a red.
- parity LAST: 0 GAPs / 0 undeclared / 24 DECLARED
Run `npm ci` first in the fresh worktree.

## 5. Footguns
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc366-notinstalled-link/draw-steel-elements && <cmd>'`. Devbox eats `$?`/`$PIPESTATUS`; never pipe a gate into tail. Run gates via a wrapper script FILE that records the exit code, output redirected to a log.
- The session scratchpad is shared by every agent. Use ONLY a private subfolder: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-impl-r1-<your agentId or a random suffix>/ with uniquely named scripts and logs.
- Run gates in the FOREGROUND (timeout up to 600000 ms; split if needed). Never background a gate and wait for a notification — it won't come. Redirect long output to a file rather than streaming it (600 s stream watchdog).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc366-notinstalled-link/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*` etc.) or the shared `.superpowers/` dir. Delete only paths you created and recorded.
- Commit after every coherent step.

## 6. Report & return contract
- Report file: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/sc366-report-impl-r1.md. It must OPEN with a ≤10-line executive summary (verdict, branch sha, gate numbers, frozen shots moved, computed colours before/after).
- If the report-file write is blocked by your harness, return the report inline.
- Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose, PLUS the absolute filesystem path of every evidence artifact (crops, logs, rebaseline.txt, report). List `Drive-by fixes:` (made) and `Follow-ups:` (left alone) separately.
- You cannot SendMessage me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I'll resume you. If you ever send a message anyway, its first word must be `SC-366:`.
