# SC-621 r3 — independent adversarial review (orchestration:reviewer, reviewer C — fresh identity; you did not author any of this)

## 1. Context loading
1. Binding gates + footguns: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-brief-common-gates-footguns.md
2. Ledger: decisions.md (same dir) — the ticket statement, Scott's standing ruling, and the "owner rulings on r1" (the spec you review against).
3. r1 design report `sc621-r1-design-report.md` (exec summary + §C/§F) and r2 implementation report `sc621-r2-impl-report.md` (same dir).
4. Worktree /home/scott/code/steelCompendium/worktrees/sc621-part-pin-one-sided-edit; dse branch `sc621-part-pin-one-sided-edit` @ 56ad4d1c
   on origin/develop 14521bf0; superproject branch @ 0dcc3bb3. Review range `14521bf0..56ad4d1c` and the superproject CHANGELOG commit.
   Workers never call the tracker. Do NOT commit to the branch; probes go in scratch exports, restore anything you touch by literal path.

Note: SC-613 landed (dse develop 9b94baf2, Conditions window only); the common brief now names 9b94baf2. Review 56ad4d1c on 14521bf0 as is; do NOT rebase — the owner rebases after your review. jest on 56ad4d1c is 11868 / 2.

## 2. Task — execute and probe, do not just read
Standing ruling (Scott, 2026-11-10, verbatim): "Save nothing with a notice is fine."
Ticket Expected (verbatim): "nothing is written, and the "changed on disk first" Notice shows. It must never go into a different counter."

Hunt for, with evidence:
- **Any different-counter write** the fix leaves or introduces in part-of-note previews/embeds (heading hover, `^id` hover, section embed;
  RV and LP; card + / - and form Save; both timings: outside write before the click, and between rebase and write). Build your OWN cells
  beyond r1's sweep layouts (r1 and r2 share an author lineage of the sweep; do not trust its coverage): e.g. three or more identical
  counters, twins separated by prose, twins in different sections, CRLF notes (SC-619 path through `cardLinkLine`), the edit far from the
  pair, the edit inside the twin run, an `^id` mark moved, nested callouts, a capped `editDistance` give-up (>400 edits).
- **Any new refusal outside the ruled class** (ledger: "an identical counter added or removed next to the drawn-from one by an outside
  edit, in a twin note, oracle tie; repeats until the preview/embed is redrawn or reopened"): e.g. a refusal with no outside edit, in a
  note without identical counters, one that survives reopen, a refusal for the card's OWN prior write (SC-607 own-write pins /
  `strictPins`), a sibling preview's + in the same note.
- **Lifecycle / write path regressions** of the change: own-write pins, whole-note pins (SC-612 rule P unchanged?), drawn-as-whole-note path.
- **Test quality**: are r2's new tests red on 14521bf0 source where they claim to be; does the sweep's oracle assertion actually bind
  (mutate the fix: remove the twin gate, gate on drawn only (M2), invert, skip `placedUniquely` — each must be killed by a named test or
  the sweep); is G-S115 red on a 14521bf0 bundle in (a)-(f) (run it on a scratch export of 14521bf0 and of 56ad4d1c).
- **Docs**: CHANGELOG bullet true and plain, mentions the repeat-until-reopen property; code comment states residuals R1/R2; skill proposal
  numbers match logs.
- Re-run: full jest once on 56ad4d1c; lifecycle part 7 (`G-S108,G-S112,G-S115`) and part 6 (`G-S92,G-S96,G-S97,G-S99`). Real Obsidian
  probe of at least the ticket's shapes A and C plus your own new cells on the 56ad4d1c bundle (scratch export).

Findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) with file:line, a failing scenario (cell, observed vs expected), and a
prescribed fix. Verdict: LAND or FIX.

## 3. Report
/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc621-part-pin-one-sided-edit/sc621-r3-review-report.md (<=10-line executive
summary first: verdict, finding counts by severity, real-Obsidian cell counts, jest/lifecycle numbers). Artifacts prefixed `sc621-r3-`.

## 4. Return contract
Per the common brief: raw facts, shas, numbers, absolute paths of every artifact. State dse HEAD and `git status --porcelain` at the end
(unchanged from 56ad4d1c, clean).
