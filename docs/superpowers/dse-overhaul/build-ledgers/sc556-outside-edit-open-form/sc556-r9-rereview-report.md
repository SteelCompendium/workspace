# SC-556 r9 scoped re-review: r8 delta (dse f69b8fd6 on develop 10db67e3, superproject 5c5641e7)

**Verdict: LAND.** Findings: 0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW, 2 INFO.
- MEDIUM-A (r7) is fixed: a lagging cache that points at a twin no longer verifies for `^id`. I tested K1, K5 and four new variants: the id directly after the fence, after a blank line, and a twin carrying a different `^id` (both placements). All write nothing and show one Notice. A current cache still saves into the `^id` block, including with an upper-case marker.
- MEDIUM-B (r7) is fixed:
  - in real Obsidian, a hover preview of `[[note#^blk]]` with an identical block above writes nothing and shows 1 Notice (base and a3ac0769 wrote the upper block);
  - K3 and K2 write nothing;
  - heading, block, nested and whole-note embeds, unique-text hovers and + then pencil in embeds all still save (measured);
  - `partialPins` does not leak onto a later pin, because each `pinPosition()` makes a fresh object.
- LOW-1: in a hover preview, + then pencil on a block whose text is unique is now refused, also in a SHORT note and for a hover of a whole note. Base saves it. There is no ambiguity and no outside change. This extends the r6-dropped long-note case.
- LOW-2: a `^id` on a CALLOUT that holds the counter with more callout text after it, plus an identical callout elsewhere, is refused. Base wrote the wrong callout, so this is an improvement on base; a3ac0769 wrote the right one.
- Mutations: 21/21 killed, including V2, MARKER, PARTIAL, WHOLE and NODEL. Gates: tsc and lint rc 0. jest t30: 6634 passed / 2 skipped / 258 of 259. Lifecycle part 3: 9/9, with G-S64 (zh) green. styles.css sha256 `4295ca33…` equals a clean 10db67e3 build.
- The rebase is clean. The range-diff shows patches 1, 2 and 5 as `=`. Patches 3 and 4 differ only in their dse CHANGELOG hunk, with SC-558's bullet kept above ours. `git diff 10db67e3 f69b8fd6` touches only SC-556 files.

## Findings

### LOW-1: a hover preview + then pencil is refused even when the block is unique (also in short notes and whole-note hovers)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts:789` (a hover has no `src`, so its pin starts partial) and `:926` (a partial pin is refused).
- **Scenario:** hover over `[[small note]]`, press + on the preview card, then its pencil, then Save. The section text is the old one (5) and the note now has 6. The text search finds nothing and the pin stays partial, so Save is refused with "the block changed on disk first". Nothing changed outside, and the block is the only one in the note.
- **Measured** (scratch scenario X-R9HOV):

  | Case | HEAD f69b8fd6 | a3ac0769 | base 6270e84a |
  |---|---|---|---|
  | hover whole small note, + then pencil | refused, 1 Notice | wrote `Edited` | wrote `Edited` |
  | hover heading of a long note, + then pencil | refused, 1 Notice | refused | wrote `Edited` |

  The jest version (W1) gives `ok=false`.
- **Status:** the owner dropped the long-note version in the r6 follow-ups, and the CHANGELOG's "or the block changed before you opened the form" covers it. It now also reaches short notes and whole-note hovers, which saved on base.
- **Optional fix (keeps the hard rule):** when a partial pin cannot be rebased, place it only if EXACTLY ONE fence of the host's language in the note holds `knownBody`. Then no twin exists to land on.
- **Owner's call:** accept it under the r7 ruling, or apply the fix.

### LOW-2: a `^id` on a callout that holds the counter (with text after it) and has an identical callout elsewhere is refused
- **Where:** `ReadingModeBlockHost.ts:870-876`. The marker is looked for right after the COUNTER's closing fence. For an id that names a container (a callout), the next non-blank line is the callout's own text (`> after text`), not `^cal`.
- **Measured** (real Obsidian, `![[r9-cal-src#^cal]]`, the lower of two identical callouts):
  - HEAD: refused, 1 Notice.
  - a3ac0769: wrote the lower one (right).
  - base: wrote the UPPER one (wrong).
  - With no identical callout, HEAD saves (the text search is unique).
  - The jest version (B1) agrees.
- **Fix:** look for the marker after the end of the embedded PART (its section's last non-blank line, placed at `start`), not after the fence. For a code-block id the two are the same line. Add B1 as a test.

### INFO-1: everything else probed
- **Real Obsidian, HEAD** (`lc-r9-head.log`):
  - Heading, long note: Reading view and Live Preview save.
  - Block `^id`, long note, id on the next line or as its own paragraph: saves in Reading view and Live Preview.
  - Block `^id` with an identical block above: short and long, Reading view, and short in Live Preview, all write the embedded block.
  - An outside edit of a block-embedded block: nothing written, the outside change kept.
  - + then pencil in a heading embed: Reading view and Live Preview save.
  - Nested embed: saves, also after + then pencil.
  - Whole-note embed: saves, also after + then pencil.
  - Callout `^id` with no twin: saves.
  - Hovers that save: unique block in a long note, heading, whole note.
  - Hover with a twin: refused.
- **jest** (`probe-r9-head.log`):
  - K1, K1a–d and K5: refused, note unchanged.
  - K2 and K3: refused.
  - K4 (the link resolves to another note): the right block.
  - C1–C3 (current cache; id directly after, after a blank line, upper case): the `^id` block.
  - P1: a first partial pin, then a fresh rebased pin on the same host saves (`same object=false`).
  - W2: a whole-note embed with stale text saves.
- **Not measured:** canvas file nodes.

### INFO-2: docs
- Both CHANGELOG bullets match the final behaviour, apart from LOW-2 (a block-id embed of a callout with an identical callout is refused even though its id names it).
- `sc556-dse-verify-proposal.md` is clean:
  - the header says final for f69b8fd6 on 10db67e3;
  - G-S59 is no longer listed as a flake;
  - footgun 3 is one paragraph;
  - (zh) is listed.

## Mutations
`mutations.txt`; the 6 touched jest files; unmutated 350/350.

| Mutation | Failed tests |
|---|---|
| M1 pin-only for kept forms only | 6 |
| M2 rate limit back for form Saves | 4 |
| M3 force card writes too | 3 |
| M4 sidebar never forces | 1 |
| M5 notify ignores force | 5 |
| M6 forced Notice does not restart the clock | 1 |
| M7 unsavable not forced | 1 |
| M8 note-gone not forced | 1 |
| M9 `reported` not set on a drop | 9 |
| R1 no rebase | 19 |
| R2 no await | 16 |
| S1 take the first of two runs | 5 |
| R4 no trailing-blank trim | 1 |
| V1 no anchor-line check | 1 |
| V2 no link's-note check | 1 (killed now) |
| V3 no body check | 1 |
| V4 subpath path skipped | 4 |
| MARKER no `^id` marker check | 2 |
| PARTIAL `pinnedTarget` ignores the partial mark | 5 |
| WHOLE a whole-note embed also partial | 1 |
| NODEL a rebased pin stays partial | 15 |

## Gates
Logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc556-review-r9/` (`$S`).

| Gate | Result | Log |
|---|---|---|
| tsc (incl. `-p e2e`) | rc 0 | `$S/gate-tsc.log` |
| lint | rc 0 | `$S/gate-lint.log` |
| jest `--testTimeout=30000` | rc 0. `Test Suites: 1 skipped, 258 passed, 258 of 259 total` · `Tests: 2 skipped, 6634 passed, 6636 total` | `$S/gate-jest-t30.log` |
| lifecycle part 3 | `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`; (zh) "the hover card has no src; Save wrote nothing (the block above untouched), one Notice" | `$S/gate-lc-part3.log` |
| styles.css | sha256 `4295ca33cd77d5c337035c332dcf635b82072693fcca44cf760725f0bcb40a01` for the HEAD build and for a clean 10db67e3 build (`$S/b-10db67e3/styles.css`) | — |

Probe artifacts:
- `$S/r9-probes.diff`: `r9-probe.test.ts` and the X-R7EMB (extended) / X-R9HOV scratch scenarios.
- `$S/probe-r9-head.log`, `$S/lc-r9-head.log`, `$S/lc-r9-a3ac0769.log`, `$S/lc-r9-base.log`.
- `$S/mutations.txt`, `$S/mutate.py`, `$S/mutate-all.sh`.

Trees are as found: dse clean at f69b8fd6, superproject 5c5641e7 with ` M draw-steel-elements`, and the scratch worktree removed.
