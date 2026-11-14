# SC-621 r6 report (implementer B): residual wording fix + the single pointer bump

**Executive summary**
- Status DONE. dse head `27120710` (one new comment-only commit on `96955985`, over origin/develop `b1e4f027`).
- Superproject head `1907a338` on origin/main `e7e34279` (unchanged since r4): exactly 2 commits, CHANGELOG `3022c223` (the old `ad3ae246`, amended) and the one pointer bump `1907a338`. No push.
- `git ls-tree HEAD draw-steel-elements` = `2712071071ddad48174da287ef5b6f04cab8d453` = dse head; `git status --porcelain` clean.
- tsc and lint clean. main.js sha256 `a866bb273eb4261a2d6e28bfb64ffa682e41f10ece8dd529ffd2d6362c6461eb` = r4's. styles.css `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` unchanged. No other gate (behaviour unchanged).
- Skill proposal residual list header fixed the same way.

## dse comment commit (`git show 27120710`)
```diff
@@ -1054,10 +1054,10 @@ export class ReadingModeBlockHost implements BlockHost {
 					// agreement does not rule out the tie: with the block the card was drawn from twinned (in the note it was drawn from, or now), the
 					// placement must also be the unique cheapest one (SC-612's rule, `placedUniquely`), exactly as a whole-note pin at write time.
 					// Accepted, in plain words: (a) a refusal here repeats on every click of a preview or embed that is not redrawn, until it is reopened
-					// (the same as SC-607's refusals for a part that did not change); (b) three residuals stay written, as before, because no rule over the
-					// text can see them: R1, a move among text-identical blocks; R2, the drawn-from section deleted while a neighbour is renamed to its name
-					// (the cheapest reading keeps the drawn-from counter); R3, a change of more than LINE_MAP_MAX_EDITS lines around the block in the same
-					// write, which `placedUniquely` cannot price, so the agreed map stands (SC-612's accepted cap).
+					// (the same as SC-607's refusals for a part that did not change); (b) three residuals stay written, as before: R1, a move among
+					// text-identical blocks, and R2, the drawn-from section deleted while a neighbour is renamed to its name (the cheapest reading keeps the
+					// drawn-from counter), which no rule over the text can see; R3, a change of more than LINE_MAP_MAX_EDITS lines around the block in the
+					// same write, which `placedUniquely` cannot price, so the agreed map stands (SC-612's accepted cap).
 					const drawnPin = { text: from.text, lineStart: from.line };
 					if (this.twinned(whole, drawnPin) && !this.placedUniquely(whole, drawnPin, at.line)) return;
 				}
```

## CHANGELOG hunk (`3022c223`, SC-621 bullet; diff of the amend vs the old `ad3ae246`)
```diff
@@ -14,8 +14,8 @@ go under an *Internal* sub-heading.
   preview could then be written into the other counter, with no message. It is now refused, nothing is written, and the "changed on disk first" Notice shows. The same holds when, in the
   same outside change, an identical counter next to yours was added or removed (the note then reads the same either way). Because such a preview or embed is often not redrawn by Obsidian,
   it keeps refusing on every click until you reopen it (move the pointer away and hover again, or reopen the note); the reopened preview saves as usual. Three cases are still written, as
-  before, because the note's text cannot tell them apart: an identical counter moved to another place among the identical ones, the shown section deleted while a neighbouring section is
-  renamed to its name, and, in a note with identical counters, an outside change of more than about 400 lines in the same write. A note without identical counters, and a note open in its own
+  before: an identical counter moved to another place among the identical ones, and the shown section deleted while a neighbouring section is renamed to its name (the note's text cannot tell
+  these apart); and, in a note with identical counters, an outside change of more than about 400 lines in the same write (too large for the plugin to compare). A note without identical counters, and a note open in its own
   pane (SC-612), are not affected.
 
 - **DSE plugin: in the Conditions window, "or just start typing" now also works after you click the window's title or an empty part of it (SC-613).**
```

## Commits
- Superproject: `git log --oneline origin/main..HEAD`
```
1907a338 chore: bump draw-steel-elements to 27120710 (SC-621: a part-of-note preview or embed refuses a click instead of writing the other i
3022c223 docs: CHANGELOG Unreleased bullet for a part-of-note preview or embed refusing a click when the shown counter was removed with a ne
```
- Logs: `sc621-r6-gate-tsc.log`, `sc621-r6-gate-lint.log`, `sc621-r6-gate-build-mine.log` in this dir. Skill proposal: `sc621-skill-proposal.md`.

Drive-by fixes: none. Follow-ups: none.
