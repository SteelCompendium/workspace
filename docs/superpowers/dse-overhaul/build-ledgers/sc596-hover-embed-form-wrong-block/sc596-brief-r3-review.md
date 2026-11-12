# SC-596 r3 — independent adversarial review (orchestration:reviewer; you did NOT write this code or its design)

## Context loading
1. Ledger (binding rulings): /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc596-hover-embed-form-wrong-block/decisions.md
2. Common gates/footguns (binding): …/sc596-hover-embed-form-wrong-block/sc596-brief-common-gates-footguns.md
3. The implementer's report: …/sc596-r2-impl-report.md (executive summary first). The design report sc596-r1-design-report.md only
   as the spec of WHAT was meant — judge the code on its own; do not assume the design is right.
4. dse-verify SKILL sections "Block edit form Save and embeds (SC-556)" (~line 336, incl. SC-584 and "Hover card writes (SC-594)"
   bullets) and "Hover preview modals (SC-595)" (~line 405).
Worktree /home/scott/code/steelCompendium/worktrees/sc596-hover-embed-form-wrong-block, dse branch sc596-hover-embed-form-wrong-block
(review `git -C <dse> diff <base>..HEAD`, base = the sha the report names). Workers never call the tracker. Make NO commits on the
branch; probes go in scratch files restored by `git checkout --` / literal-path delete.

## What to probe (execute, don't just read)
- The invariant: no FORM or CARD write from an embed / hover preview of part of a note ever lands in an identical twin. Hunt for a
  shape the sweep misses: constructs (plain fence, callout, header-less quote, quote whose first line is a fence, nested quote/callout,
  list item, footnote), link shapes (block/heading embed, block/heading hover, whole-note embed/hover, a link with an alias `|x`, a
  heading with trailing spaces / punctuation, nested heading levels), timing (edit before open, edit while open, + then pencil, two +
  then pencil, a write from a second pane), cache lag both ways, a second identical embed of the same part in the same note.
- The refusing pin: every path that produces one; that it is never mapped against the whole note; that `hasPin()` true does not keep
  a form open in a shape where it then CAN write somewhere (ledger Q2 CONDITION — check the implementer's shape list against the code).
- Q4 (card null-pin path): verify the implementer's measurement and verdict independently (a few jest cells).
- Regressions: the SC-584 r5 shapes still save (two identical counters, no + first, pencil on the lower -> lower; block and heading
  embeds; callout DOM ordinal); plain non-embedded forms unchanged; the 36 hover cells now save into the hovered counter only.
- Tests have teeth: re-run their red-on-base claims; mutate the new guards (at least 10 mutants) and report killed/survived.
- G-S96: read it; confirm it is red on base for the right reason (twin written) and green on head, not vacuous (the form is really
  kept open by a second pane; nothing written AND one Notice AND the outside edit kept). Run part 6 yourself.
- Integrity: content above/below the block survives a refused and an accepted Save; two same-kind blocks don't cross-talk; deleted
  code (`rebasePin`, `verifiedPinLine`, `embedStartLine`, `searchedPinLine`) truly has no callers and no test still imports it.
- Gates: re-run jest and lifecycle part 6 and e2e yourself; others may carry from the implementer's logs if their shas match HEAD.

## Report
…/sc596-hover-embed-form-wrong-block/sc596-r3-review-report.md — <=10-line executive summary (verdict LAND / FIX; counts by
severity), then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO) each with file:line, the failure scenario, the probe that
shows it (path), and a prescribed fix. Probe files and logs alongside, prefixed `sc596-r3-`. Final text: raw facts + every artifact
path. Confirm the worktree is clean at the end and no Obsidian process of yours is left.

## Owner additions after r2 (branch HEAD c02598c1 on base 5f7c5336)
- r2 FOLDED Q4: card writes with a null pin now get the same refusing pin (commits a65207fc, 2c0bc7a3). Verify independently.
- r2 RE-TARGETED lifecycle G-S64 `(zh)` (commit f142ae87): a hover form on `[[note#^id]]` with an identical block above used to be
  expected to refuse; now Save lands in the linked block. Judge whether that is correct (the link names exactly that block, verified)
  and that the re-targeted phase still has teeth (it must fail if the write went to the block above).
- Part 6 is `--only=G-S92,G-S96` (comma-separated).
