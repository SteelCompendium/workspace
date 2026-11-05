# SC-520 r6 report
## Executive summary
- STATUS: DONE. dse `7bd8040b` (1 new commit on `91e03844`, base origin/develop `248e202b`, confirmed unchanged). Harness-only.
- G-S49 object moved to just before G-S56 (order now G-S59, G-S49, G-S56; G-S56 is last in SCENARIOS). Pure move: sorted-line multiset of the file identical before/after except the one added header line; `git diff --stat` 185+/184-.
- Header comment says G-S49 sits after G-S59 and before G-S56, which stays last.
- `node --check` ok; tsc rc=0, lint (incl. e2e/) rc=0.
- Lifecycle part 5 `--only=G-S59,G-S49`: 2/2 (G-S59 ok, G-S49 ok, in that order); part 4 `--only=G-S57,G-S62,G-S61,G-S56`: 4/4. No G-S59 timeout seen.
- main.js / styles.css byte-identical to a build of 91e03844's sources: sha256 `5725ce95eb8c403563c8b9a656b158cb4fcc64db3b96bcd641a7fd09a0f80659` (main.js), `2c13b12bac46a49083bf0b64a36cc9a46c658c8f97e129500c40d69b179dbcd6` (styles.css) both builds; `git diff HEAD -- src styles-source.css package.json` empty.
- sc520-dse-verify-proposal.md updated (G-S49 before G-S56, part layout unchanged).

## Artifacts
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc520-r6-w4k9/`: `gate-tsc.log gate-lint.log gate-lc5.log gate-lc4.log hash-after-lc.txt old.sorted new.sorted`, `at91-bundle/`.
Proposal: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc520-lp-callout-menu-click/sc520-dse-verify-proposal.md`

## Drive-by fixes:
none.
## Follow-ups:
none.
