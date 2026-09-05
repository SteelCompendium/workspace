# SC-191 fix round 3 + re-gate — review-2 findings, rebased onto the SC-202 tip

You are the `orchestration:implementer` that built slice 4 and fix 2 (or a fresh
replacement). Final text goes to the SC-191 ticket-owner (an agent): raw facts, no prose.
**Never call the tracker (Linear).** You cannot message the ticket-owner; if you need input,
end with `STATUS: NEEDS_CONTEXT` and the question at the top of your report. A stray
message's FIRST WORD must be `SC-191:`.

## 1. Context

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-decisions.md`
  — read the LAST entry (2026-09-03 "review-2 findings … Fix round 3 folds"): it is this
  round's scope. Spec `sc191-impl-spec.md`. Review: **`sc191-review2-report.md` lines
  325–614 are the findings — read every folded finding IN FULL there** (file:line, failure
  scenario, prescribed fix). Your own `sc191-slice4-report.md` / `sc191-fix2-report.md`.
- Worktree (verify `pwd`; write nothing under `workspace/`):
  `/home/scott/code/steelCompendium/worktrees/sc191-montage-overhaul/draw-steel-elements`,
  branch `sc191-montage-overhaul` @ `8cd9d30`, currently based on `origin/develop` `69eb5f7`.

## 2. Step 1 — REBASE FIRST (SC-202 landed)

`git fetch origin develop` inside the clone; expected tip **`9227dd9`** (SC-202: Obsidian
1.14.0 host-copy pin bump + input host-CSS re-grounding). `git rebase origin/develop`;
`npm ci` if `package.json`'s obsidian version changed. Conflicts: resolve only trivially
mechanical ones (adjacent CHANGELOG bullets); anything in `src/`, `styles-source.css`,
`visual-harness/` → abort and `STATUS: NEEDS_CONTEXT` with the hunks. Then run `npm run
shots` ONCE on the rebased tree BEFORE fixing anything and record: does `host-copy pin OK`
print against 1.14.0, does the button host-leak sweep print OK, and did ANY montage capture
change bytes vs the pre-rebase run (compare against the reviewer's run-2 hashes in
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/review2/`
or your own fix-2 run). Any montage byte change caused by the rebase alone is reported as
"SC-202 integration delta" with the capture ids — do not hide it inside the fix.

## 3. Step 2 — the findings (reviewer's summary verbatim; full text in the report)

> H-1: the cheat-sheet strip has no print layout — every strip rule is in the print-excluded Steel tier, but print force-opens every collapsible — so it prints as an unlaid-out run-on blob; with the strip pinned the printed card loses the tier table entirely (the guide stands down to a pointer at the blob). This is baked into the exact bytes the sanctioned rebaseline would pin, so it must be fixed and the freeze package regenerated BEFORE the ask reaches Scott.
>
> M-1: on a complete montage the per-row chip stays live and, after End round N, writes an entry at round = rounds + 1 — invisible and un-editable on the board while its tally applies. M-2: entries serialises out of §B.5's fixed key order on the fresh-block/old-shape path, churning the user's file twice. M-3/M-4: the sheet drops the settled mock's difficulty words on the tier hint and its subject-line title (it repeats its own eyebrow instead).
>
> L-1 — the sheet CSS block's comment claims a Steel scoping gate it does not have.
> L-2 — the strip's screen-state hint prints. `src/elements/montage/StripView.ts:93-96`
> L-3 — logging the winning success removes `Undo` in the same breath.
> L-4 — the sheet drops the mock's skill hint. `LogActionModal.ts:297-310` renders no hint
> L-5 — the documented YAML example teaches a shape the serializer deliberately deletes.
> L-6 — "stored, never recomputed" is in the changelog but not in the user docs.
> I-1 — YAML comments inside a `ds-montage` block do not survive the first write.
> I-3 — every sheet open adds a permanent closer to the view.

Owner notes:
- **H-1:** the strip must print as a laid-out tier table (rows × Easy/Medium/Hard, badges,
  seals with words, pips in print ink `#8a6a00`) whenever print force-opens it — mirror
  how the guide/foot panel prints; light-on-white print ground, no bright-white, no
  half-opacity. Look at the after-print crop yourself before reporting.
- **M-1:** on a complete montage every logging control (per-row chip, cells' log path) is
  disabled exactly like the bar; nothing may ever write `round > rounds`. Add the test.
- **M-2:** §B.5 key order on EVERY serialize path; test parse→serialize→parse identity on
  the fresh-block and old-shape paths byte-for-byte.
- **L-3:** the done-state bar is `Undo` + `Reopen` (when reopenable) + danger `Clear all`.
- **I-1:** first confirm on the PRE-rebase base or on `9227dd9` with the OLD montage element
  (e.g. `git stash`/worktree of `69eb5f7`) whether a `# comment` inside a `ds-montage` block
  already vanished on first write before SC-191. Report the one-line answer. If
  pre-existing: no code change (owner ruling: dropped). If new: fix it.
- Everything else per the reviewer's prescribed fix. Out of scope: I-2 (SC-294), I-4, I-5,
  I-6, and every review-1 dropped item.

Tests red-before-green for each behavioural item (H-1 via a print computed-style/DOM test,
M-1, M-2, L-3, I-3). Docs edits for L-5/L-6 in `docs/gm-trackers.md`.

## 4. Step 3 — full battery on the FINAL rebased tree

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`, in order,
output to files, plain bash/node for exit-code-sensitive steps (devbox swallows `$?`):
tsc; lint; `rm -f main.js styles.css && npx jest`; `npm run shots` ×2 (sha256 identical) —
expected in-run lines now include `host-copy pin OK` (1.14.0) AND the button host-leak
sweep OK; `check-freeze.sh` (expected: exactly the 2 montage print lines mismatch, 0 others
— if SC-202 changed the baseline's line count, read the new count from the skill and report
it); `npm run parity` LAST (0 GAPs / 0 undeclared / the declared set the skill documents).
Expected jest ≥ 3643/1 plus yours; shots 508 (+ any new capture id).

Regenerate the freeze package from THIS final tree into the ledger dir: `rebaseline.txt` (2
lines), `widening.txt` (all new montage print captures, additions-only, 0 collisions), the
four crops `sc191-freeze-montage--steel-{print,realprint}-{before,after}.png` (before =
baseline bytes), plus **new crops for the strip-pinned print** (`sc191-freeze-montage-strip-pinned--steel-print-after.png`)
since H-1 is about that surface. Verify every hash line against both runs. Never edit the
baseline; never touch the pin/listings/asar.

## 5. Commit + report

One commit on top of the rebased branch: `SC-191 fix 3 — review-2 findings (strip print
layout, complete-state guards, key order, sheet copy)`. No push, no tags, no trailers,
superproject pointer untouched. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc191-montage-overhaul/sc191-fix3-report.md`
(≤10-line executive summary first; the rebase result + SC-202 integration delta; per
finding what changed with file:line and the red-then-green test; I-1 answer; gate numbers
incl. the host-copy pin and host-leak lines verbatim; freeze package paths + line counts;
after-crop descriptions; `Drive-by fixes:` / `Follow-ups:`; artifact paths). Return per
that structure: `STATUS`, new base sha, new tip sha, whether `npm ci` ran, everything
above. If the report write is blocked, return it inline. Footguns: never background a gate
and wait; no scratch-filename wait loops; redirect long output to files.
