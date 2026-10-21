# SC-366 follow-up brief: remove the left stripe from the ds-scc degrade cards (implementer, r1)

## 1. Context loading
- Read FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/decisions.md — especially the section "Follow-up: the left stripe (2026-10-21)". The earlier rounds in that file (link colour) are LANDED; don't redo them.
- Read: /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md (battery, command shapes, freeze rules).
- Read: DESIGN.md rule 7 in YOUR worktree: /home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/DESIGN.md (search "No decorative colored left-borders").
- Worktree: /home/scott/code/steelCompendium/worktrees/sc366-stripe-remove. The dse repo is at draw-steel-elements/, on branch `sc366-stripe-remove`, cut from `develop` @ `bc4a0c5`.
  - Verify `pwd` before any write.
  - Every git command uses `git -C <absolute path>`.
  - First `git -C <dse> fetch origin` and confirm origin/develop is still bc4a0c5. If it moved, rebase onto it and report the new sha.
- You NEVER call the tracker (Linear).
- Workspace-level files (CHANGELOG.md) live in YOUR worktree's superproject at /home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/. Never edit under /home/scott/code/steelCompendium/workspace/, except to write reports and evidence into the ledger dir.
- The main checkout's dse dirt (demo-vault/Welcome.md, compendium-manifest.json, demo-vault/*.md) is Scott's live vault. Ignore it.

## 2. The task
Scott's ruling, 2026-10-21, verbatim from the ledger:
> "Colors look good.  For the left-stripe,  i thought those were banned in the design.  Can we get those removed?"

Owner scope, verbatim from the ledger:
> "Scope: `.dse-ref-notice`'s `border-left: 3px solid var(--color-blue)` (styles-source.css ~495 on develop bc4a0c5). That class is shared by BOTH ds-scc degrade cards (the not-installed card `.dse-ref-web-card` and the `renderRefNotice` notice card), so both lose the stripe. Replacement per rule 7's "borders-all-around": the card keeps its existing 1px `--background-modifier-border` on all four sides and its `--background-secondary` ground — no new accent device. Update the SC-149 CSS comment that justifies the "informational blue accent"."

Out of scope, so don't touch them: every other left stripe (`.dse-error-card` ~416, and the role/tier/act stripes ~3009, 3524, 5211, 7018, 9891). Other efforts are editing styles-source.css concurrently, so change only this rule and its comment.

Do:
1. Delete the `border-left` declaration from `.dse-ref-notice` in `styles-source.css`. Then grep src/ and the test/ tree for anything that asserts the old stripe (`border-left`, `--color-blue`, "informational blue") on these cards, and update it.
2. Rewrite the SC-149 comment above the rule so it no longer claims a blue accent. Cite DESIGN rule 7 / SC-366 in one line.
3. Check whether any other CSS rule adds a stripe or inset shadow to `.dse-ref-web-card` / `.dse-ref-notice` (e.g. print rules, `box-shadow: inset`). Report what you find. Remove it only if it is the same stripe.
4. Add a jest assertion that `.dse-ref-notice` has no `border-left` declaration, so the stripe can't come back. Put it in the existing `test/dom/theme/notInstalledLinkColour.test.ts`, or next to it if that's a better fit. Bite-prove it: restore the declaration, see the test fail, revert byte-clean. Use the Edit tool, not sed. Check `git -C <dse> status --porcelain` afterwards.
5. Commit in dse (e.g. `fix(css): SC-366 drop the left stripe from the ds-scc degrade cards (DESIGN rule 7)`). No co-author or AI attribution trailers. Do not push.
6. CHANGELOG: in /home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/CHANGELOG.md, find the existing bullet under `## Unreleased` that begins `- **DSE plugin: the "View on steelcompendium.io" link in the not-installed card`. Append this sentence to the end of that bullet's last line, after "Print is unchanged.", separated by one space:
   `The card's blue left stripe is also gone, from this card and from the other compendium-reference notice card; both now have a plain border all round.`
   Commit only CHANGELOG.md in the superproject: `docs(changelog): SC-366 degrade cards lose the left stripe`. Leave the draw-steel-elements pointer UNSTAGED. No trailers. Do not push.

## 3. Evidence (Scott reviews crops; he is colourblind)
- No harness fixture shows these cards; SC-469 tracks adding one, so don't build one.
- Render BEFORE (bc4a0c5) and AFTER crops in a private scratch page, the way the r1 evidence was made. Reuse or adapt /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/sc366-review-r1-probe.mjs. You can also look at the r1 scratch in /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-impl-r1-a7f3/. Copy anything you reuse into your own folder first and never edit the originals.
- Cover BOTH cards: the not-installed card and the notice card (`renderRefNotice`, with message + hint). Do light and dark, at 2x, with the real Obsidian CSS loaded.
- Make each crop LABELLED with a text banner, e.g. "BEFORE (develop bc4a0c5): 3px blue stripe on the left edge" and "AFTER: plain 1px border on all four sides". The label must carry the difference, not colour.
- Measure the computed `border-left-width`, `border-left-color` and `border-top-color` before and after, and report them.
- Save evidence in the ledger dir with `sc366-stripe-` prefixed filenames.

## 4. Gates (dse-verify skill, in order). Expected numbers at dispatch (develop bc4a0c5, from the dispatcher):
- tsc (incl. `tsc -p e2e`) and lint (incl. e2e/): clean.
- jest: 5457 passed / 1 skipped / 232 of 233 suites, plus your new test(s). On a fresh worktree compare only after `npm run shots`.
- lifecycle: 30/30 ok, 0 failed. Set your own `DSE_LIFECYCLE_PORT=9368`.
- e2e: 89/93 ok, 0 failed, 4 known-bug, coverage 64/64 pairs.
- shots: 580, 0 FAIL.
- freeze: 280/280. These cards are in no frozen shot, so ANY moved frozen shot is a red. Report it; do not rebaseline.
- parity, LAST: 0 GAPs / 0 undeclared / 24 DECLARED.
- Run `npm ci` first.

## 5. Footguns (adapter §8: 1, 9, 10, 11, 12, 13)
- **Devbox:** always `devbox run -c /home/scott/code/steelCompendium/worktrees/sc366-stripe-remove/draw-steel-elements -- bash <script file>`. Never `cd` inside a compound command.
  - Write each gate as a script FILE (use the Write tool) that runs one gate, redirects output to a log and writes its exit code.
  - Read each gate's summary line, not just the rc. `bash -c '…; echo rc=$?'` under devbox always records 0.
  - Never pipe a gate into tail.
- **Scratch:** the session scratchpad is shared. Use ONLY /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-stripe-impl-<random suffix>/, with uniquely named scripts and logs. Create scratch files with the Write tool, not heredocs.
- **No glob deletes:** no `rm` with a glob, ever, and never `rm -rf` a shared dir (`/tmp/dse-obsidian-lifecycle-*`, `.superpowers/`). Delete only exact paths you created.
- **Run gates in the FOREGROUND** (timeout up to 600000 ms). Never background a gate and wait for a notification. Redirect long output to a file.
- **Wait-loops:** never key one on a scratch filename or its contents.
- **Killing processes:** never `pkill`/`killall` by pattern. Kill only by PID, and only when its command line contains `worktrees/sc366-stripe-remove/`.
- **Commits:** commit after every coherent step.

## 6. Report & return contract
- Write the report to /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/sc366-report-stripe-impl-r1.md. Open it with a ≤10-line executive summary: verdict, dse sha, superproject CHANGELOG sha, gate numbers, frozen shots moved, before/after border measurements.
- If the report-file write is blocked by your harness, return the report inline.
- Your final text goes to the ticket-owner, not a human: raw facts and absolute paths of every evidence artifact. List `Drive-by fixes:` and `Follow-ups:` separately.
- You cannot SendMessage me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message, its first word must be `SC-366:`.
