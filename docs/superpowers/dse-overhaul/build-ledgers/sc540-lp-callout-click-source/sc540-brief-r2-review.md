# SC-540 r2 brief — independent adversarial review

You are the independent reviewer for Linear SC-540. You did not write this code. Your final text goes to the ticket-owner, not a human.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/decisions.md` (the FIX RULE is the spec — judge against it).
- Implementer report: `…/sc540-lp-callout-click-source/sc540-r1-impl-report.md` (exec summary + Step A table + interactive-child usages).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc537-lp-callout-twins/sc537-r1-diag-report.md` §2.5; `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc522-lp-embed-scroll/sc522-r1-SRC-obsidian-embed-click-handler.txt`.
- **Workers never call the tracker** (Linear).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc540-lp-callout-click-source`, branch `sc540-lp-callout-click-source`. Review plugin HEAD `992375b6` on base `eaf64ba6`; superproject `5a18ee74`. `git -C <plugin> fetch origin` first and report whether origin/develop moved. Do NOT commit to the branch (scratch builds in your own scratch folder / `git worktree add` into an absolute path under it). The main checkout's dse dirt (demo-vault/Welcome.md etc.) is Scott's live vault — ignore it.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` battery table + CURRENT.

## 2. The task — execute and probe, not just read
Diff: `git -C <plugin> diff eaf64ba6..992375b6`, superproject `git -C <super> diff 53d4aa68..5a18ee74`.
In REAL Obsidian 1.15.0 Live Preview (the lifecycle harness's Obsidian, own port e.g. 9541), on HEAD and on the base bundle, probe at least:
1. The ticket: real CDP + click on a counter in a `> [!note]` callout: written, callout still a card, selection and scrollTop unchanged. Keyboard Enter on the pencil.
2. Every "must NOT change" item of the FIX RULE: callout text / title click still enters source; `</>` still enters source; foldable chevron folds; internal link in a card in a callout opens (click, Ctrl-click, hover preview with Ctrl if available); plain fence; LP embed (SC-522 G-S52 behaviour); Reading view unchanged (the class must not appear there).
3. Other DSE blocks in callouts with their own interactions: a text input / number input in a card (focus + typing must not open source and must not lose characters), a checkbox, a drag-select of card text, the stamina bar modal, ds-initiative, a collapsed one-liner's Expand. Right-click/context menu inside the card.
4. Every app.js use of `.interactive-child` the implementer listed — check each for a side-effect now active in callouts (e.g. keyboard handling, drag, selection, mobile tap).
5. Nesting: callout-in-callout, embed-in-callout, callout-in-embedded-note.
6. Twin interplay: re-run lifecycle G-S57 (SC-537) and G-S52 (SC-522) on HEAD. With callouts now staying drawn after a click, look for any new stale/misrouted write in two identical callouts (2 callouts, + upper then + lower, form Save upper then + lower), and report disk values. (Rapid-click misroutes within ~270 ms are SC-544 — note but do not count them.)
7. G-S62 discriminates: run it on the base bundle and on a "no callout mark" mutant bundle (must FAIL), and on HEAD (must PASS). Mutate the selector (e.g. drop the callout clause, mark only in Reading view) and check jest goes red.
8. Implementer follow-ups to probe in real Obsidian: (i) Mod+A (Ctrl+A) with focus in a DSE text/number input inside an LP callout — what is selected, on base vs HEAD, and is it acceptable (compare with the same input in a plain fence and an LP embed); (ii) double-click and triple-click on card text and on a control inside an LP callout — does it open source, select a word, or misbehave, base vs HEAD.
9. Re-run the battery yourself where cheap enough: tsc/lint, jest, lifecycle in THREE `--only` parts, e2e. Shots/freeze/parity: re-run only if the implementer's numbers look off or styles changed.
Expected numbers: tsc/lint clean · jest 6269 passed / 1 skipped / 249 of 250 (after a shots run; fresh 6268 / 2) · lifecycle 47/47 as three parts 21 + 16 + 10 (part 3 = G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S57 G-S62 G-S56) · e2e 124/124 ok, 0 failed, 0 known-bug, coverage 87/87 (+ pointer parked line) · shots 592 0 FAIL 161/966 · freeze 280/280 · parity 0/0/24.

## 3. Rules
Same command and safety rules as the implementer brief `sc540-brief-r1-impl.md` §4 — read and obey them (one blocking foreground call per gate; `devbox run -c <abs path> -- bash <script>`; no `cd … &&`; `git -C`; private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r2-review-<suffix>/`; no `rm` with variable targets, no glob rm; never pkill by pattern; never rm a shared /tmp glob; unique lifecycle port; redirect long output to files; never key a wait-loop on a scratch filename).

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc540-lp-callout-click-source/sc540-r2-review-report.md`, opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, gate numbers). Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario (measured), and prescribed fix. If the write is blocked, return the report inline.

## 5. Return contract
Raw facts only: verdict, shas, numbers, findings list, absolute paths of every artifact. You cannot `SendMessage` me; for input, end with STATUS: NEEDS_CONTEXT and the question. Any stray message's first word must be `SC-540:`.
