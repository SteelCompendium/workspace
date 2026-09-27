# SC-317 scoped re-review: fix round 1 (dse 64e88eb..f9f5f3d, superproject 3bd5b90)

## Executive summary

- **Verdict: APPROVE_WITH_NITS.** No findings above INFO. There are 3 nits (N1–N3); none blocks.
- **(1) The v4 defect is real, and my own round-1 recommendation was wrong.** On the real `perk/links` fixture, v4 paints the glyph over "campaign notes on envoys" (glyph at x 525–536 while its anchor's text ends at x 111). In the 401-width sweep it painted over unrelated text 26–182 times per text in 7 of 9 texts.
- **(2) The shipped WJ form never paints over text, and has 0 orphans on ordinary prose:** 0 overlaps and 0 orphans across the 7 ordinary-prose texts × 401 widths × both schemes (5 single-link and 2 multi-link wrapping paragraphs).
  - Residual, only under a forced mid-word break: bare URL 25/401 (6.2%), `View on steelcompendium.io` 16/401 (4.0%). The glyph starts the next line and never overlaps.
  - It is not underlined (0 ink pixels in the gutter with the glyph hidden). Real Ctrl+C copies no U+2060 in text/plain or text/html.
- **(3) No form beats both.** Two candidates were measured.
  - `content: ''` (in place of the WJ) has 0 orphans and 0 overlaps and is pixel-identical at rest. But in the forced-break case it hangs the glyph past the container edge instead: 24/401 URL widths (up to +9 px) and 43/401 web-card widths (up to +15 px).
  - A two-layer mask on the anchor has 0 orphans and 0 overlaps, but it erases the `:focus-visible` ring.
  - Only Obsidian's own `background-image` is clean on every count, and it cannot use currentColor.
- **(4) LOW-1 is closed.** All 4 live-hole probes (opacity, background-image, transform, padding-inline-end) go RED. The hover pass is real: a hover-only rule goes RED in the hover pass alone. A focus-visible-only rule stays green (N2).
- **(5) INFO-1:** the RTL glyph renders mirrored at the inline end. Its ink pixels overlap a horizontally flipped LTR glyph at 0.998 (Jaccard), versus 0.266 unflipped.
- **(6)** Every mutation of the new jest assertions goes red, 8 of 8. The INFO-3 "fix" is still logically implied by its regex (N3).
- **(7) Gates at f9f5f3d:** shots 524 PNGs, 0 FAIL, inline host-leak OK 1130. freeze `260/260`. parity `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0.

## (1) v4 defect: real, reproduced two ways

- **Real fixture** (`probe10-v4-real.mjs`, `probe11-v4-where.mjs`): the unmodified `perk/links` page at 900px. 1249c17's exact v4 rule was injected over the live sheet (`rv2/v4-1249c17.css`).
  - The anchor's two fragments are x 538–758 (line 1) and x 55–111 (line 2).
  - v4 paints the glyph at **x 525–536, y 284–295**. That is on line 2, directly over "campaign notes on envoys" (`p10-real-perk-links-{dark,light}-v4.png`). The shipped form puts it after "entry" (`…-ship.png`).
- **Mechanism, measured:**
  - The glyph's right edge sits on the **first fragment's inline-start (538)**, not on the union's right edge (758) as the fix report and the CSS comment say. Its bottom comes from the last fragment.
  - That is, the containing block of a split `position: relative` inline runs from the first fragment's start to the last fragment's end. When the link wraps so that its last line ends to the left of where it began, that width is negative, and `inset-inline-end: 0` pins the glyph to the start column.
  - This explains why my round-1 URL probe (`rv-orphan-url4-*`) looked correct: that anchor began at the line start, so the width stayed positive. It also explains why my round-1 orphan detector missed the defect: it measured the anchor's client rects (the padding box), not where the glyph was painted. **My v4 recommendation in round 1 was wrong.**
- **Sweep** (`probe6-glyph-locate.mjs`: the glyph is painted magenta by the probe and located by its pixels, one screenshot per width 120–520; 4 forms stacked):

  | Text | v4 over text | v4 detached | ship over text | ship detached |
  |---|---|---|---|---|
  | plain | 40 | 40 | 0 | 0 |
  | hyphenated | 92 | 0 | 0 | 0 |
  | `)` after | 40 | 46 | 0 | 0 |
  | `(` before | 26 | 50 | 0 | 0 |
  | CJK | 83 | 0 | 0 | 0 |
  | bare URL | 0 | 0 | 0 | **25** |
  | web-card copy | 0 | 18 | 0 | **16** |
  | perk/links two-link paragraph | **131** | 0 | 0 | 0 |
  | two external links (802 glyphs) | **182** | 0 | 0 | 0 |

  The counts are identical in dark and light (`probe6-g{1,2,3}.log`). The r1 inline-block form showed 0 over text and 16–46 detached per text. Obsidian's own form (`obs`) showed 0 / 0 everywhere.

## (2) The shipped WJ form (f9f5f3d)

- It never paints over text: 0 in 4,010 placements across 9 texts × 401 widths, in each scheme.
- It has 0 orphans on all 7 ordinary-prose texts, including the perk/links two-link paragraph and a paragraph with two external links, where the first one wraps.
- **Residual, only under an `overflow-wrap` forced mid-word break:** bare URL 25/401 widths (6.2%); web-card copy 16/401 (4.0%), in the window 156–171 px. In every one of those, the glyph starts the next line; none overlaps text.
- **Not underlined:** the gutter band (14.2 × 28 CSS px) has 263/265 ink pixels with the glyph shown and **0** with its paint made transparent, so no underline reaches the gutter. The pseudo's `text-decoration-line` is `none`.
- **Copy:** a real Ctrl+C of the fixture paragraph puts clean text on the clipboard, with no U+2060 in text/plain or text/html. `getSelection()` is also clean (`probe8.log`).

## (3) Is there a form that beats both? None found.

| Candidate (measured) | Over text | Orphans | Other defect |
|---|---|---|---|
| shipped (WJ inline `::after`) | 0 | URL 25, web-card 16 | — |
| **v5**: the shipped rule with `content: ''` in place of `'\2060'` | 0 (all 9 texts) | **0** (all 9 texts) | at rest, 0 differing pixels vs shipped in serif, `sans-serif` and `monospace`; **but** under a forced break the glyph hangs past the container edge: URL 24/401 (up to +9.2 px), web-card 43/401 (up to +15.2 px). That trades an orphan for overflow or clipping. |
| **mk**: anchor padding + a `linear-gradient(currentColor)` square + a two-layer mask on the anchor | 0 | 0 | **the `:focus-visible` ring disappears**: the focused-vs-rest diff falls from 2872 px (ship) to 14 px (`p7-*-mk-focus.png`); 297–299 px differ from ship at rest |
| Obsidian `background-image` + padding | 0 | 0 | no currentColor (the reason D2 rejected it) |

Keeping the shipped form is the right call. v5 is the only near-miss. It is worth a line to the owner only if hanging past the edge is judged better than starting a new line.

## (4) LOW-1: the widened sweep

I ran a throwaway, untracked copy of shoot.mjs at f9f5f3d, with a `<style>` that toggles together with the host sheet. It has been deleted and `git status` is clean; the copy is kept as text at `rv2/sweep-probe-copy-f9f5f3d.mjs.txt`.

| Injected host-shaped rule | Result |
|---|---|
| none (control) | OK, 1130 |
| `.external-link::after { opacity: 0 }` | **RED**, 4 (rest + hover × dark/light) |
| `… { background-image: linear-gradient(red, red) }` | **RED**, 4 |
| `… { transform: scale(2) }` | **RED**, 4 |
| `.markdown-rendered a.external-link.ds-scc-web::after { padding-inline-end: 0 }` | **RED**, 4 |
| `.external-link:hover::after { opacity: .2 }` | **RED**, 2, in the `a:hover` pass only, so the hover pass is real |
| `.external-link:focus-visible::after { opacity: .2 }` | **GREEN**, see N2 |

## (5) INFO-1: RTL

`probe9-rtl.mjs` puts Hebrew link text in a `dir="rtl"` paragraph inside the plugin card body.

- The anchor matches `:dir(rtl)`, and the computed `mask-image` is the mirrored SVG.
- The painted glyph sits at the inline end (left of the link) and points up-left (`p9-{dark,light}-rtl.png`).
- Compared by ink pixels (Jaccard overlap), RTL vs the mirrored LTR glyph is **0.998 / 0.999**; RTL vs the unmirrored LTR glyph is 0.266 / 0.267.

## (6) jest mutations

The suite is `headingEmphasisLinkHostRegrounding.test.ts`, 30 tests. Each mutation was reverted with `git checkout`, and `git status` was empty after each.

| Mutation | Result |
|---|---|
| unscope from print | 5 failed |
| `content: ''` | 1 failed (regression guard) |
| `display: inline-block` | 1 failed |
| add `position: absolute` | 1 failed |
| `padding-inline-end: 0.9em` | 1 failed |
| drop `text-decoration: none` | 1 failed |
| RTL block removed | 1 failed |
| RTL mask replaced by `transform` | 1 failed |

## Nits

- **N1 (INFO), `styles-source.css:17048-17056` and the fix report's "THE DEVIATION":** the v4 mechanism is described as "the UNION of all line fragments… right edge (line 1's)… glyph painted at x≈750". Measured, the glyph was painted at x 525–536, with its right edge on the first fragment's inline-start. Fix: reword the comment to "the containing block of a split relative inline runs from its first fragment's start to its last fragment's end; when the link's last line ends left of where it began, `inset-inline-end: 0` pins the glyph to the first fragment's start column, on the last line". The conclusion (reject v4) stands.
- **N2 (LOW/INFO), `visual-harness/shoot.mjs:3685-3692`:** the doc comment says reading the glyph in `readOneLinkTagged` "closes both [hover and focus-visible] at once". The focus-visible pass reads the `glyph_*` keys but only compares `LINK_REST_PROPS`, so a focus-visible-only host rule on the pseudo stays green (probe above). Fix: add the same `glyph_*` comparison loop to the focus-visible block that the hover block has, or reword the comment to say hover only.
- **N3 (INFO), test "the glyph rule exists and is inside the same print-excluded scope":** the new `expect(glyph![0]).toContain(':not([data-dse-print="on"])')` can never fail on its own. The regex that produced `glyph` already requires `ANCHOR`, which contains that text. The test still goes red on unscope, through the null check. That makes it the same strength as the round-1 tautology, with different wording. No action needed.

## Gates (at f9f5f3d; run in order: shots, freeze, parity)

| Gate | Result |
|---|---|
| shots | 524 PNGs, 0 FAIL; host-copy pin OK 1.14.2; button host-leak OK 684; inline host-leak OK **1130**; link token-override OK. Log `logs/sc317-rv2-shots-155725.log` |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, exit 0. Log `logs/sc317-rv2-freeze-*.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`, exit 0. Log `logs/sc317-rv2-parity-160458.log` |

Tree state: dse clean at f9f5f3d and superproject clean at 3bd5b90, both before and after. The mutations and the sweep copy were reverted or deleted. Nothing was committed.

## Artifacts

Everything is under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/rv2/`:

- Scripts: `probe6-glyph-locate.mjs`, `probe7-mk-focus.mjs`, `probe8-underline-copy-rtl.mjs`, `probe9-rtl.mjs`, `probe10-v4-real.mjs`, `probe11-v4-where.mjs`, `mutate2.py`.
- Candidate CSS: `v4-1249c17.css`, `cand-v5.css`.
- Sweep copy (text only): `sweep-probe-copy-f9f5f3d.mjs.txt`.
- Logs: `probe6-{g1,g2,g3,v5a,v5b,mk}.log`, `probe6-summary-*.json`, `probe7.log`, `probe8.log` (its RTL block is superseded by probe9), `probe9.log`, `probe11.log`, `p2/`, `p3/`, `sweep-*.log`, `mut2-*.log`.
- Screenshots:
  - `p10-real-perk-links-{dark,light}-{ship,v4}.png`
  - `p6-*-v4-overlap-w*.png`, `p6-*-ship-orphan-w*.png`, `p6-*-w225.png`
  - `p7-*.png`, `p8-*.png`, `p9-*.png`

Round-1 probes reused unmodified: `../rv1/probe2-orphan.mjs`, `../rv1/probe3-pixels.mjs`.

## Round 3 (delta f9f5f3d..2897cc5, superproject ef62d70): APPROVE

- **(a) N1 fixed (a098362):** the comment at `styles-source.css:17050-17067` now states the measured mechanism:
  - the containing block runs from the first fragment's start to the last fragment's end, and its width goes negative when the link's last line ends left of where it began;
  - so the glyph pins to the first fragment's start column, on the last line;
  - it quotes the measured x 525–536 against x 111, and why round 1 missed it.
- **(b) N2 genuinely compares (fe91b20).** Harness rebuilt; throwaway sweep copy at 2897cc5 (`rv3/sweep-probe-copy-2897cc5.mjs.txt`, deleted from the tree).
  - Control: GREEN, `= 1132 comparisons`.
  - `.external-link:focus-visible::after { opacity: .2 }`: **RED**, 2 problems (`a:focus-visible|external-link::after`, dark and light), exit 1.
- **(c) N3 can now fail on its own (2897cc5).**
  - An appended `[data-dse-element] :where(a).external-link::after {…}` fails 1 test (the new occurrence count), exit 1.
  - Limit (INFO, no action): the guard matches only the `:where(a)` spelling. An appended `a.external-link::after {…}` stays green (30/30); freeze is the backstop.
- Both mutations were reverted with `git checkout`, and the suite is clean at 30/30. dse is clean at 2897cc5 and the superproject clean at ef62d70; nothing was committed. Logs: `rv3/sweep-{control,focusonly}.log`, `rv3/mut3-{dup-where,dup-plain}.log`, `rv3/jest-suite-clean.log`.
