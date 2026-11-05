**Can I close this as Canceled (not a bug)?** Both identical tall blocks do draw their card in Live Preview. The earlier test counted wrong.

Below is the second block, scrolled into view in real Obsidian. The full Outer Strike card sits under the "Middle." line, with the nested Ref Strike card inside it.

{{IMG:sc543-r1-shot-a-block2.png}}

**Why the earlier test saw one card:** Live Preview's editor (CodeMirror) only keeps blocks near the visible part of the note on the page. Each of these cards is about 1,500 px tall. So at the top of the note only the first card is on the page, and at the bottom only the second. The SC-536 test counted cards at the top and at the bottom and got 1 both times. When you scroll to either block, its card is there.

**Proof it is not the plugin:** a throwaway test plugin that draws a plain 1,800 px box shows the same count, with identical or different text. With a 300 px box, both stay on the page.

Nothing changes in the plugin and nothing needs to land. The one useful lesson goes into our test guide: in Live Preview, scroll to each block before checking it, and never count cards on the page.

---
Details:
- Tested on draw-steel-elements `develop` @ `fb24f8a2`, real Obsidian 1.15.0, Live Preview, 1440×1100 window.
- The two blocks are separate widgets with separate content, and each card loads once (4 reference lookups in total, as expected).
- Cards on the page, at first draw / block 2 scrolled into view / bottom / top:
  - Two identical tall reference blocks: 1 / 2 / 1 / 1.
  - Same two blocks, one with a trailing space: 1 / 2 / 1 / 1.
  - Two tall cards with no reference: 1 / 2 / 1 / 1.
  - Throwaway plugin, 1,800 px box: 1 / 2 / 1 / 1.
  - Throwaway plugin, 300 px box: 2 / 2 / 2 / 2.
- Mechanism: CodeMirror's viewport is the visible area plus about 500 px either side (`getViewport`, app.js 1.15.0 @421594). Obsidian first guesses a code block is 50 px tall (@2641739), so the first draw builds both. Once the first card measures 1,529 px, the second block's widget is dropped from the page. It is rebuilt from cache when you scroll to it.
- Neither SC-537's change nor SC-522's area is involved.
