# SC-299 review 1 — independent adversarial review brief

You are an `orchestration:reviewer` for the SC-299 ticket-owner. You did NOT write this
code. **Workers never call the tracker (Linear)** — not to read, not to post. Your final
text goes to the ticket-owner, not a human.

## 1. Context loading

- Ledger (rulings R-1..R-4 are the acceptance criteria):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-decisions.md`
- Round-1 brief (what the implementer was told) and report (what it claims):
  `…/sc299-montage/sc299-round1-brief.md`, `…/sc299-montage/sc299-round1-report.md`
  (read the executive summary, then the body).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc299-montage/draw-steel-elements`,
  branch `sc299-montage`, base `origin/develop` `e12c6bd`, head `1762555`.
  Diff under review: `git diff e12c6bd..1762555` (plus the superproject commit
  `cf5f7da` for CHANGELOG). **Verify `pwd` before any write; never touch
  `/home/scott/code/steelCompendium/workspace/`.** `node_modules` is installed there.
- Design source: `visual-harness/sc191/mock6.js:1841-1856`, `round2.css:307-345`, `:1750`.

## 2. What to do — execute and probe, do not just read

1. Re-run the battery yourself per the dse-verify skill
   (`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`) — tsc,
   lint, `rm -f main.js styles.css && npx jest`, shots, freeze
   (`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <shots dir>`),
   parity last. Devbox wrap with absolute paths, output to files
   `…/sc299-montage/sc299-rv1-<gate>.log`, gate command LAST in the `bash -c` string.
   Expected: freeze `260/260`, parity `0 GAPs / 0 undeclared / 16 DECLARED`, jest all
   green. Compare the numbers to the round-1 report's.
2. Runtime probes in jsdom (write throwaway tests under a `sc299-probe` filename you delete
   afterwards, or a node script) — at minimum:
   - one-tap quick log writes exactly `{hero, round, result}` (no `skill`/`note` keys) and
     produces exactly ONE vault write (the tracker debounces — count `vault.modify` calls);
   - quick log on the LAST hero to act in the LAST round: does the montage complete
     correctly, does the bar stand down, does the tally/verdict update once;
   - quick log when the hero already has an entry that round (can this happen? the trio
     only renders on empty sockets — prove a double-click cannot double-log: click twice
     fast before the rebuild);
   - a quick log while `successes` is one short of `success_limit` → outcome flips to
     `total`;
   - past-round empty cell: opens the sheet with `{kind:'new', hero, round:<past>}`; logging
     lands `round: <past>` and does not disturb `nextHeroToAct`; a future-round empty cell
     and an empty cell on a complete montage carry NO `role`;
   - skill-reuse: the quick path logs no skill, so `skills_used` is untouched — prove it;
   - read-only host (`canPersist=false`): trio rendered, `disabled`, no handler fires;
   - keyboard: Tab order reaches cell → three quick buttons; Enter on a quick button logs
     WITHOUT opening the sheet; Enter/Space on the cell opens the sheet only;
   - integrity: a note-file with content above and below the block survives a quick log
     byte-for-byte outside the block (the existing montage tests have this harness shape —
     reuse it); two montage blocks in one note do not cross-talk.
3. Nesting/a11y: the cell is `div[role=button]` with real `<button>`s inside. Judge the
   implementer's resolution (its report states the choice). Is any control unreachable or
   double-firing? Is the `role="group"` label sane for a screen reader?
4. CSS: does the trio match the mock (size, border, colour tints, hover accent, narrow
   `margin-left:auto`)? Open the `mid` dark/light shots and the narrow shot and LOOK.
   Confirm the print shots show `to act` with no buttons. Check the new rules did not land
   inside the wrong nesting block (the file uses CSS nesting; SC-191 review-2 H-1 was a
   specificity trap of exactly this kind — search "H-1's dedup half" in styles-source.css).
5. Docs: `docs/gm-trackers.md` sentences are plain-language and true to behaviour; both
   CHANGELOG entries present; no attribution trailers in any commit message
   (`git log e12c6bd..HEAD --format=%B`).

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc299-montage/sc299-review1-report.md`,
opening with a ≤10-line executive summary: verdict (LAND-READY / FIX ROUND NEEDED),
findings count by severity, your gate lines verbatim. Then findings by severity
(HIGH/MED/LOW/INFO) each with file:line, failure scenario, prescribed fix; then the probe
table (probe → PASS/FAIL → evidence). Copy any evidence images into the ledger dir with the
`sc299-rv1-` prefix and list their paths.

Return contract: final text = raw facts (verdict, counts, gate numbers, report path,
evidence paths). No prose.

## 4. Footguns

- If the report-file write is blocked, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions/branches; read the process's own output or a per-run path.
- Redirect long output to files; run gates in the foreground; never background a gate and
  wait for a notification — it never comes (600s watchdog kills silent agents).
- You cannot `SendMessage` the ticket-owner; `to: 'main'` reaches the dispatcher, not the
  owner. Need input → end your turn with `STATUS: NEEDS_CONTEXT` + the question in the
  report. If you ever message anyway, the FIRST WORD must be `SC-299:`.
- Devbox eats `$?`; `| tail` masks failures. Read the tools' own summary lines.
- Never edit `.superpowers/sdd/freeze-baseline.sha256`; never `rm -rf` under
  `.superpowers/`; delete only your own `sc299-probe*` files.
- Do not commit fixes — you review; findings go in the report.
