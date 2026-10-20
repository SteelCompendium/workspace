# SC-360 r6 scoped re-review: the r5 delta at dse `9cae8d3` (`6ab681a` + 2 commits, base `d58cf6a`)

**Executive summary**
- **Verdict: LAND.** HIGH 0 · MEDIUM 0 · LOW 1 (a wording nit, optional) · INFO 1.
- **MEDIUM-A is fixed.** A YAML-invalid block with no `_dse_anchor` now pins with exactly one stamped letter-led id, with no Notice. This holds for a duplicate key, a tab indent and a CRLF note. A YAML-invalid block that mentions the key is still refused: one Notice, no write, no panel.
- **The `includes` check only affects blocks that already have a YAML error.** It refuses a broken block that mentions `_dse_anchor` in a comment or another value. That is safe (nothing is written) and rare, so INFO.
- **LOW-A is accurate.** The CHANGELOG now matches what I measured: one extra tracker once for an already-split pair, then stable. One phrase reads ambiguously (LOW-1).
- **LOW-B: the new test is real.** It fails when the branch is removed.
- **Gates.** tsc and lint clean. jest `Tests: 1 skipped, 5013 passed, 5014 total`, `229 of 230` suites, as expected. Stress and e2e were skipped per the brief: the delta touches only `anchor.ts`, tests and CHANGELOG.

Reviewed: `9cae8d3b9b1872a6d3914a9ad1b924ee98285393`. The r5 commits are 5708c72 (red-first tests) and 9cae8d3 (fix + CHANGELOG). The tree was clean before and after, and nothing was committed.
Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc360-flaky-undo/sc360-evidence/r6-rereview/`.

## Findings

### LOW-1: "opens one tracker per press" can be read as the bug it fixes
- **Where:** `CHANGELOG.md:51`.
- **Problem:** "An encounter that already carries such an id now opens one tracker per press" can be read as "every press opens a new tracker", which is exactly the old bug.
- **Prescribed fix (optional):** "…now reopens the same tracker on every press." The next sentence ("If its old tracker was already hit by the bug, it may open one more tracker one last time; the old tracker keeps its state") matches what I measured (`[2,2,2]` in the r4 probe) and can stay.

### INFO-1: a broken-YAML block that mentions `_dse_anchor` anywhere is refused
- **Where:** `src/framework/sidebar/anchor.ts:104`. For example, `# see _dse_anchor docs`, or `label: my _dse_anchor note`.
- **Measured** (`probe-pin.log`): refused, note unchanged, 0 panels, the anchor Notice.
- **Judgment: it doesn't matter.**
  - It needs a YAML error and the literal key text together.
  - Nothing is written.
  - The block already shows its own error card.
  - Fixing the YAML error makes the block parse, and then a comment-only mention is stamped normally (probed: the parseable comment case pins with 1 id).
  - The Notice's advice does not fit that rare case, but no work is lost.
  - A real readable anchor in broken YAML still short-circuits before the parse and is reused (probed).
- No action.

## Checks
1. **MEDIUM-A** (`probe-pin.log`, both `sendToSidebar` and `requestPinToSidebar`):

   | Block | Result |
   |---|---|
   | Duplicate key, no anchor | ret true, 1 `_dse_anchor: <[a-df][0-9a-f]{5}>`, 1 panel, 0 Notices |
   | Tab indent, no anchor | same |
   | CRLF duplicate key, no anchor | same; the stamped line keeps the CRLF ending |
   | Unreadable anchor line (`# c`) | refused: note unchanged, 0 panels, 1 Notice |
   | Broken YAML + `_dse_anchor` only in a comment or another value | refused (INFO-1) |
   | Broken YAML + readable anchor | reused, note unchanged, 1 panel |

2. **LOW-A:** the wording is accurate against the r4 measurement. See LOW-1 for the ambiguous phrase.
3. **Mutations** (`mut-summary.txt`), run over the anchor, sidebarInitiative and registration test files (93 tests):

   | Mutation | Change | Result |
   |---|---|---|
   | MA | revert the MEDIUM-A fix (always refuse on a parse error) | 1 red: "a body with a YAML error but no `_dse_anchor` is still stamped" |
   | MA2 | drop the `includes` refusal | 1 red: "…that mentions `_dse_anchor` is refused" |
   | MB | remove `requestPinToSidebar`'s unreadable-anchor branch | 1 red: the new LOW-B test |

   Each mutation was reverted with `git checkout -- src`.
4. **Gates** (exit codes captured in a script file, `g-rc.txt`, all rc=0):
   - tsc clean, lint clean
   - jest `Test Suites: 1 skipped, 229 passed, 229 of 230 total` / `Tests: 1 skipped, 5013 passed, 5014 total`
