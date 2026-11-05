**Please look at the before/after pictures below and say whether the pinned hero column looks right.** When a montage board is too wide and scrolls sideways, the hero names now stay on the left while the rounds slide under them. A board that fits looks exactly as before.

## What changed on wide boards

- The "Hero" corner and each hero name stay at the left edge while you scroll to later rounds and the Tally.
- That column now has a solid background, so the rounds scrolling under it do not show through. Before, it was see-through banding over the card.
- A thin grey vertical line runs down the column's right edge, so you can see where the rounds go under it.
- Tab and Shift+Tab never land on a round cell that is hidden under the column. The board scrolls the cell out first.
- The row "+" button and the corner "+" button work at any scroll position, with mouse and touch.

## What did not change

- Boards that fit inside the card: pixel-identical to before. All 34 montage screenshots and all 280 frozen print screenshots match.
- The narrow stacked layout (420 px and below): unchanged, no pinned column.
- Print: unchanged.

## Pictures (each one: BEFORE on the left, AFTER on the right)

**1. Dark theme, scrolled to the middle.** Before: the names have scrolled away, so you cannot tell which row is which hero. After: "Hero" and the three names stay on the left in a solid very dark grey-blue column. The rounds slide under it and are cut off at a thin lighter-grey line.

{{IMG:sc490-r1-dark-fine-mid-before-after.png}}

**2. Light theme, scrolled to the middle.** Same as picture 1. The column is a solid near-white with black names, and the line is mid-grey.

{{IMG:sc490-r1-light-fine-mid-before-after.png}}

**3. Dark theme, not scrolled yet.** This is the one change you can see before scrolling. The column is now solid instead of see-through. It is the same shade to within 1–2 levels, plus the new thin line.

{{IMG:sc490-r1-dark-fine-rest-before-after.png}}

**4. Light theme, not scrolled yet.** Same as picture 3. Apart from the line, before and after look the same.

{{IMG:sc490-r1-light-fine-rest-before-after.png}}

**5. Touch screen (coarse pointer), dark, scrolled to the far end.** The pinned column is wider here because it holds the large touch-size "+" buttons.

{{IMG:sc490-r1-dark-coarse-end-before-after.png}}

**6 and 7. A long card: five heroes and a long brief, dark and light, scrolled to the middle.** The column's solid colour is matched to the card's colour near the top of the card. The card's background is a gentle diagonal fade, so on a tall card the column's colour can be slightly off from the card beside it. On this tall card the pinned column is a little lighter than the round cells next to it: up to 7 levels out of 255 in dark theme, where it reads as a slightly lighter grey strip, and up to 9 in light theme, where it reads as a slightly whiter strip. Before this change the difference was 0 to 1 levels. On a normal-height card it is 1 to 3 levels. If that bothers you, I can make the column draw the card's exact fade instead. That takes a little more code.

{{IMG:sc490-r2-dark-longbrief-board-before-after.png}}

{{IMG:sc490-r2-light-longbrief-board-before-after.png}}

**Optional, your call:** on a narrow pane (about 420 px wide), the pinned column takes about a quarter of the board's width. That is the name column's existing width, not something this change sets. If you would like it narrower when the board scrolls, say so and I will file it as a separate ticket.

---

Mechanics (no action needed):

- dse branch `sc490-montage-pin-hero-column` @ `e4f394fa` on develop `09ece2eb`; superproject @ `a01d8001`.
- How it works: `BoardView` marks a board `data-overflow="on"` only while it is wider than its frame, using a ResizeObserver registered through the owner so it is cleaned up. The pin, the solid fill and the edge line apply only under that mark. `keepFocusedCellInView` counts the pinned column's width.
- Gates: tsc and lint clean · jest 6425 passed / 1 skipped / 254 of 255 suites · lifecycle 50/50 in five parts · e2e 128/128 ok, 0 failed, 89/89 pairs · shots 592, 0 FAIL, host-leak 161/966, `montage board scroll OK` for fine and coarse pointer in dark and light · freeze 280/280, no rebaseline · parity 0 / 0 / 24. The reviewer re-ran tsc, lint, jest, shots, freeze and parity on the final head, with matching results.
- Can-fail proofs: each of these broke the extended `montage board scroll OK` gate with its own message: no sticky rule, the old focus helper, no z-index, a see-through fill, and pinned cells scrolling the board when they take focus. Lifecycle G-S13 now checks the pin on every write, and it fails in real Obsidian without the sticky rule.
- Review: an independent reviewer found 0 HIGH and 0 MEDIUM issues. One LOW was fixed: the solid colours are now tied to the card token by comments and a jest guard. One INFO was also fixed: the gate now checks light theme too. The other INFO notes were invisible or harness-only. A scoped re-review after the rebase found nothing.
