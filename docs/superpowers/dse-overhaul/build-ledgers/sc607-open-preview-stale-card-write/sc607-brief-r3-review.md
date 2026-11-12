# SC-607 r3 — independent adversarial review (orchestration:reviewer, a fresh identity: not the r1 designer, not the r2 implementer)

## Context loading (read first)
1. Ledger (rulings BINDING): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc607-open-preview-stale-card-write/decisions.md
   — "owner rulings on r1 open questions" (R-Q1 … R-Q6) and "Baseline moves".
2. Common gates/footguns (binding): same dir, sc607-brief-common-gates-footguns.md
3. The ticket (verbatim): "Expected: the click is saved into the counter the preview was drawn from, or it is refused with the
   "changed on disk first" Notice. It must never go into a different counter."
4. Read executive summaries only, then dive where you need: sc607-r1-design-report.md (§C rule, §D), sc607-r2-impl-report.md.
5. dse-verify SKILL (~375 KB, read in parts): "Block edit form Save and embeds (SC-556)" (~336-450) and the lifecycle notes (~177).
Worktree: /home/scott/code/steelCompendium/worktrees/sc607-open-preview-stale-card-write; dse branch `sc607-open-preview-stale-card-write`
at 1daa7d8a (base 622b0904). Review `git -C <dse> diff 622b0904..1daa7d8a`. Do NOT commit to the branch; probes go in scratch
files copied in and removed by literal path; `git -C <dse> status --porcelain` empty at the end. Workers never call the tracker.

## Task — execute and probe, not just read
1. **Invariant hunt.** Try to make a + / - or a form Save in an embed / hover preview write a DIFFERENT identical counter with the
   r2 code: jest probes beyond the committed sweep (three identical counters; a heading link whose section moves AND is edited;
   own + then outside edit then a second +; rebind / setMountedBody re-mounts (`remountReused.ts`) carrying a stale snapshot; a
   snapshot read that lands after an outside edit (N1 family) with a fresh cache; the R-Q2c fallback with a body that is unique in both
   texts but is a different block (N5 + a >400-line edit) — say whether it writes, and whether that is the documented residual; the
   R-Q3 guard with `embed.data` present / absent / non-string). Real Obsidian for at least 3 cells the sweep cannot model (your
   choice; one must be an embed). Report every different-counter write with a reproduction.
1b. **The amended R-Q3 guard (ledger "Owner rulings on r2").** Does it still refuse the hover MOUNT race (an outside write that lands
   between Obsidian's hover read and the card's snapshot, leaving the part unchanged)? Model it in jest AND try it in real Obsidian
   (instrument a scratch build to delay the snapshot read so the outside write lands inside the window). Does "only while `embed.data`
   still contains the card's part" open a hole (e.g. a part that occurs twice in the stale data)?
2. **No regressions where base saved.** Whole-note pins, plain non-embedded cards and forms, and part-of-note previews with no outside
   edit or an unrelated edit must behave exactly as at base. Prove it (run the base-vs-head sweep yourself, not the report's numbers).
3. **Tests with teeth.** Re-run the r2 mutants (sc607-r2-mutate.py.txt / sc607-r2-run-mutants.sh.txt); also say whether the redraw models in
   `reading-mode-host-form-pin.test.ts` ~170 and `reading-mode-host-hover-card.test.ts` ~193/335/557 (`section.current = …` without
   `host.rebind`) are vacuous under the new rule; add your own (at least 6) on guards r2 did not mutate. Is G-S99 red on base where it
   claims (re-run part 6 on a base bundle or check the saved log's lines against the scenario)? Is the control non-vacuous?
4. **G-S91 flake (SC-616).** r2 saw "title rv … the preview was gone" 3 times on the branch and 1 of 4 on clean base. Run G-S91 alone
   at least 6 times on the branch bundle and 6 times on a base bundle (alternate them, same host load); report the counts. Does the
   per-mount `cachedRead` touch that path (it is a card in a hover preview)?
5. **Cost.** The per-mount `cachedRead`: memory held per card (is a snapshot string released on unload / for whole-note sections?),
   any leak across re-mounts, and whether shots/freeze/e2e/lifecycle timings moved.
6. **Docs.** CHANGELOG bullets (both) and sc607-dse-verify-proposal.md: true to the measured behaviour, plain words, residuals named.
7. Gates (re-run, do not trust the report): tsc + lint, jest, lifecycle part 6 (`G-S92 G-S96 G-S99`) plus one other part of your
   choice, e2e. Numbers per the common file.

## Report
same dir, sc607-r3-review-report.md (<=10-line executive summary first: verdict LAND / FIX; findings by severity with file:line;
different-counter writes found (count + shapes); gates measured). Each finding: severity, file:line, failure scenario, prescribed
fix. Probes/logs alongside prefixed `sc607-r3-`. Private scratch:
/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc607-r3-reviewer/.
Final text: raw facts + every artifact path + `Follow-ups:`.
Out of scope (filed): SC-612 (whole-note head-trim bias). Do not report it as a finding.
