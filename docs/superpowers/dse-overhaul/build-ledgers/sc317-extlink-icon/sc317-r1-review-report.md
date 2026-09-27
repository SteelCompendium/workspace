# SC-317 independent review, round 1 (dse 64e88eb, superproject docs 01ca911)

## Executive summary

- **Verdict: CHANGES_REQUIRED.** One MED (F2 orphan-wrap: an airtight form exists and was measured, so per the ledger it gets folded in). Everything else is LOW or INFO.
- Counts: CRITICAL 0 / HIGH 0 / MED 1 / LOW 1 / INFO 4.
- Battery at 64e88eb: tsc clean. lint clean, exit 0. jest **4043 passed / 1 skipped / 208 of 209 suites / 3 snapshots**. lifecycle **19/19 ok** (port 9287). shots **524 PNGs, 0 FAIL** (host-copy pin OK 1.14.2, button host-leak OK 684, inline host-leak OK **1128**, link token-override OK). freeze **`freeze OK (260/260 …)`**. parity **0 gaps / 0 undeclared / 16 declared**, exit 0.
- Icon correctness holds. It is on every plugin-root and `.dse-modal` `.external-link`. It takes the anchor colour in dark and light, and follows a forced distinct `:hover` colour. It is not underlined and is not in selected text. Obsidian's `background-image`/`padding-inline-end` stay neutralised (none / 0px with the host on). There is no icon under `data-dse-print="on"`, in real `@media print`, on `.internal-link`, or outside plugin roots.
- The glyph provenance claim is verified. The SVG sha256 is `a7c6a118…` in 1.13.7, 1.14.0 and 1.14.2, with the path geometry byte-identical.
- The shipped orphans in a 16px window at every line edge. In 401 widths × 7 texts, the shipped form orphaned in 16–46 widths per text. **Candidate v4** (padding gutter + absolute `::before`) had **0 orphans in every text, including overflow-wrap emergency breaks**. At rest in the card-body font it matched the shipped form with **0 differing pixels**. The ledger's WJ form (v1) is **not airtight**: it fails at emergency breaks.
- The host-leak sweep does sample `::after` and can go red (live-hole proof). However, it samples a narrow allowlist. A bare `.external-link::after { opacity: 0 }` or `{ background-image: … }` stays green (LOW-1).
- No overlap with SC-230/231/236/255/272/284/338: no shared hunks.

## Findings

### MED-1: the shipped icon orphans onto its own line, and the code and test say it cannot

- **Where:** `styles-source.css:17055-17062` (comment: "there is therefore no browser break opportunity between the last character of the link text and the glyph, so it cannot wrap onto a line by itself…"). The rule is at `styles-source.css:17068-17084` (`display: inline-block` at :17070). The test title `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts:184` says "does not wrap onto its own line by design (D3)", but it only asserts `display: inline-block`. The implementer report's D3 paragraph makes the same claim.
- **Failure scenario (measured):** Chromium puts a soft-wrap opportunity between a text character and an atomic inline (`inline-block`). I ran `probe2-orphan.mjs`: the harness `perk/links` page, steel dark and light, with the host sheet on. It builds a plugin-body paragraph and varies the container width 1px at a time from 120 to 520. The shipped icon sits alone at the start of the next line in these windows:

  | Link text | Widths where it orphans |
  |---|---|
  | `own entry` | 220–235 (16) |
  | `self-contained` | 251–266 (16) |
  | `own entry)` | 16 widths |
  | CJK text | 207–222 (16) |
  | a URL | 41 widths |
  | `View on steelcompendium.io` (the web card's own text) | 46 widths |

  Obsidian's own form (`background-image` + `padding-inline-end` on the anchor) had **0** orphans for every text. Screenshots: `rv1/rv-orphan-dark-w220.png` (row 1 = shipped, row 2 = candidate, row 3 = Obsidian geometry), plus `rv-orphan-{hy,paren,cjk,url,webcard}-*.png`. The same page confirms one thing still works: a link that wraps across two lines puts its icon after the last fragment (`rv1/rv-perk-links-{dark,light}-para.png`).
- **Airtight forms tested (probe-only; nothing was written to the branch):**
  - **v1, the ledger's suggestion:** an inline `::after` with `content: '\2060'`, sized by `padding-inline-end: 0.8em` and a `mask-position: 100% 50%` / `mask-size: 0.8em 0.8em`.
    - Pros: it closes every normal soft-wrap orphan (plain, hyphenated, paren and CJK texts all 0). It stays baseline-relative and font-independent: the ink-centroid offset from the shipped glyph is -0.26 device px in all 4 font families tested.
    - **Not airtight.** Under `overflow-wrap` emergency breaks, when the trailing unbreakable run plus the icon is wider than the line, Chromium breaks before the WJ. The URL text orphaned in 25 of 401 widths and the web-card text in 16 of 401 (156–171 px). `white-space: nowrap`, `overflow-wrap: normal` and `word-break: normal` on the pseudo did not help (v2, `probe2-v2-url.log`).
    - At rest it is not byte-identical: 223 antialiasing pixels differ, within about 0.13 CSS px. The mask on an inline box snaps to whole CSS px (see the `rv1/tune/` sweep).
  - **v3:** padding on the anchor plus an absolute `::after`. **Fails.** The out-of-flow placeholder at the end adds its own break opportunity, and the padding orphaned in 25 of 401 URL widths (`rv-orphan-url3-*`).
  - **v4, recommended:** Obsidian's own geometry. The gutter is `padding-inline-end` on the anchor (padding sits in the last glyph's box and cannot be split off). The glyph is an absolutely positioned **`::before`**; its placeholder sits at the link's start, where a break already exists, and it is positioned to the inline end of the last fragment.
    - **Airtight:** 0 orphans in all 7 texts × 401 widths × both schemes, including the emergency-break URL and web-card texts. That matches Obsidian row for row (`rv-orphan-url4-*`, `rv-orphan-webcard4-*`, `rv-orphan-v4-*`).
    - No new split before the link: with `(` directly before the anchor, 0 of 401 widths split it (`probe2-lead-v4b.log`).
    - A three-line anchor puts the icon at the end of the last fragment (`rv-orphan-url4-dark-w131.png`).
    - **At rest it renders identically to the shipped form: 0 differing pixels** in dark and light (`rv1/tune4/p3-0.25.log`). Row height and the position of the following text are unchanged.
    - Trade-off: the glyph is placed relative to the content-area bottom, like Obsidian's own `background-position-y`, so it depends on the font's descent. Offsets measured against the shipped glyph: 0 px in the card-body serif, 1 CSS px in the interface/monospace stacks, 2 CSS px in `sans-serif`/the display face (`rv1/fonts/`). It also needs `position: relative` on the anchor.
- **Prescribed fix (exact CSS):** replace the `::after` rule at `styles-source.css:17068-17084` with the following. Keep D1 (the same data-URI SVG) and D2 (`currentColor` via mask, no `filter`).

  ```css
  :is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(a).external-link {
  	padding-inline-end: 0.95em;   /* 0.15em gap + 0.8em glyph — Obsidian's own gutter shape; never orphans */
  	position: relative;           /* containing block for the glyph below */
  }
  :is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(a).external-link::before {
  	content: '';
  	position: absolute;
  	inset-inline-end: 0;
  	bottom: 0.25em;               /* measured: pixel-identical to the r1 inline-block glyph in the card-body font */
  	width: 0.8em;
  	height: 0.8em;
  	background-color: currentColor;
  	mask-image: url("…same data URI…");
  	-webkit-mask-image: url("…same data URI…");
  	mask-repeat: no-repeat;
  	-webkit-mask-repeat: no-repeat;
  	mask-size: contain;
  	-webkit-mask-size: contain;
  	user-select: none;
  	-webkit-user-select: none;
  }
  ```

  The companion's `padding-inline-end: 0.95em` beats GROUP 7's `padding-inline-end: 0` only by source order, because both have specificity (0,3,0). Either fold the value into GROUP 7 (and update `test/…/headingEmphasisLinkHostRegrounding.test.ts:153`, which pins `padding-inline-end: 0;`) or add a jest assertion that pins the order. Also:
  - Rewrite the comment at :17055-17062 and the test at :184 to state the real invariant: the gutter is anchor padding, and the glyph is out of flow.
  - Update the four jest tests to match `::before`.
  - Change DESIGN.md:270 from "`::after`" to `::before` plus the padding gutter.
  - Move the shoot.mjs `::after` sampling to `::before`, and add the anchor's `position` and `paddingInlineEnd`. `paddingInlineEnd` is already in `EXTERNAL_LINK_PROPS`.
  - Freeze should still be 260/260: the rule stays inside the print-excluded scope, and Obsidian's `.print .external-link { padding-right: 0 }` applies in real print. This needs re-measuring.
  - If the owner prefers baseline-relative placement over airtightness, v1 is the fallback. Its exact CSS is `rv1/cand-v1.css` minus the `.probe-wrap.cand` prefix. It must be reported as "not airtight under emergency breaks".

### LOW-1: the new `::after` sweep samples a narrow allowlist; common host-shaped leaks pass green

- **Where:** `visual-harness/shoot.mjs:3503` (`EXTERNAL_LINK_AFTER_PROPS`), with its literal copy in `readTaggedInline` (`:3556-3560`). There is also no `::after` read in the hover and focus passes (`readOneLinkTagged`, `:3632`).
- **Proof:** I ran a throwaway, untracked copy of `shoot.mjs`: only the inline sweep runs, and a `<style>` toggles together with the host sheet. It has been deleted, and `git status` is clean. The copy is kept as text at `rv1/sweep-probe-copy.mjs.txt`.

  | Injected host-shaped rule | Sweep result |
  |---|---|
  | none (control) | `inline host-leak OK … = 1128 comparisons` |
  | `.markdown-rendered a.external-link.ds-scc-web::after { width: 2em; background-color: red }` | **RED**, 4 problems (backgroundColor and width, dark and light) |
  | `.external-link::after { opacity: 0 }` (icon invisible in a real vault) | **GREEN**, 1128 |
  | `.external-link::after { background-image: linear-gradient(red, red) }` (glyph repainted red) | **GREEN**, 1128 |

  So the sweep genuinely samples the pseudo-element and can fail, but only for the 11 listed properties. Obsidian sets nothing on `a::after` today: a scan of the pinned 1.13.7 sheet found 131 `::after` selectors, none reaching an anchor. This is future-proofing, not a live leak.
- **Fix:** widen the sampled list (both copies) with `content`, `opacity`, `visibility`, `filter`, `transform`, `backgroundImage`, `verticalAlign`, `maskPosition`/`webkitMaskPosition`, `position`, `marginInlineEnd` and `paddingInlineStart`/`paddingInlineEnd`. Sample the pseudo in the `:hover` pass too. If v4 lands, sample `::before`, plus `insetInlineEnd`/`bottom` and the anchor's `position`.

### INFO-1: RTL glyph is not mirrored

Obsidian swaps to a mirrored SVG under `:dir(rtl) .external-link`: `public/images/2308ab1944a6bfa5c5b8.svg`, sha256 `a44ac4cb…`, identical in 1.13.7, 1.14.0 and 1.14.2. The plugin's glyph always points up-right. Optional fix: a `:dir(rtl)` mask swap, or `transform: scaleX(-1)` on the pseudo. Neither form was tested under RTL.

### INFO-2: the scope survey misses one anchor (the call is still right)

`src/framework/kit/undoNotice.ts:51` creates an anchor with `activeDocument.createElement('a')`. It is a `role="button"` "Undo" with no `href`, inside an Obsidian `Notice`, outside every plugin root. It correctly gets no icon. The survey said the only anchor creations were `createEl('a'` sites. Every other call is confirmed:

- `rewriteSccAnchors` web branch: gets the icon.
- The vault branch removes `external-link`: no icon.
- `RefUnwrapView` web card: the root carries `data-dse-element` (`RefUnwrapView.ts:143`), so it gets the icon.
- `SidebarPanel` note link: in-vault, no icon.
- `renderMarkdown` (`view.ts:234-235`) is the only `MarkdownRenderer.render` call site, and `cx.sccAnchors` is wired in production (`main.ts:415`).

In the harness, every anchor under a plugin root, gallery plus `perk/links`, is either an icon on the one `.external-link` or none (155 raw `scc.v1:` anchors plus 1 `.internal-link`) (`rv1/probe4.log`).

### INFO-3: jest gaps (non-blocking)

The new tests are non-vacuous. Each mutation went red and was reverted byte-clean:

| Mutation | Result |
|---|---|
| drop `currentColor` | 1 failed |
| unscope from print | 5 failed |
| `width: 0.9em` | 1 failed |
| add `filter` | 1 failed |
| mask-image renamed | 1 failed |
| RefUnwrapView class removed | 1 failed |

Two gaps:

- An additional **unscoped** `[data-dse-element] a.external-link::after {…}` rule stays green (29/29). The freeze gate is the backstop for that: the `perk-links--steel-{print,realprint}` pair is in the baseline.
- `test:168-175`'s `expect(ANCHOR).toContain(':not([data-dse-print="on"])')` asserts a constant, so it is tautological. The test's real teeth are the regex match.

### INFO-4: implementer crops, one line each

| Crop | What it shows |
|---|---|
| `crops/sc317-perk-links-dark-after.png` | Yes: teal "entry" plus a teal arrow icon. The underline is cropped off (too tight, as the owner already ruled). |
| `crops/sc317-perk-links-dark-before.png` | Yes: "entry" with no icon. |
| `crops/sc317-perk-links-light-after.png` | Yes: the icon in steel-light teal. Same tightness. |
| `crops/sc317-perk-links-light-before.png` | Yes: no icon. |
| `crops/sc317-perk-links-dark-hover.png` | Link and icon under `:hover`, but the hover colour equals the rest colour, so this does not show colour tracking. My probe does show it: a forced hover colour `rgb(0,200,0)` gives an icon of `rgb(0,200,0)` (`rv1/probe1.log`). |
| `crops/sc317-perk-links-light-hover.png` | Same as the dark hover crop. |
| `crops/sc317-perk-links-print-after.png` | Yes: "own entry" in print with no icon. |

## Probe facts (for the record)

- Computed style with the host sheet on and off (`rv1/probe1.log`, dark and light):
  - Anchor: `background-image: none` and `padding-inline-end: 0px` with the host sheet both on and off.
  - `::after`: `content ""`, `inline-block`, 12.797px square, `background-color` equal to the anchor `color` (rgb(77,184,199) dark / rgb(42,123,136) light), `text-decoration-line: none`, `user-select: none`, `vertical-align: -0.8px`, `margin-inline-start: 2.4px`.
  - Setting an inline colour on the anchor moves the icon with it.
- Paragraph selection text: `"…See the Steel Compendium's own entry for the supernatural trait…"`, with no extra code points.
- `.dse-modal` external link: gets the icon. `.dse-modal` internal link: no icon. External link outside any plugin root: no plugin icon (Obsidian's own padding of 13.5px applies there, as expected).
- Print twin (`data-dse-print="on"`) and realprint (`emulateMedia print`, root stamped `on`): `content: none`, anchor `background-image: none` and `padding: 0`.
- Overlap check: the SC-317 hunks are styles-source.css ~17022-17084, shoot.mjs 3493-3860, `RefUnwrapView.ts:361-367` and 2 test files. Nearest neighbours on the other branches:

  | Branch | Hunks |
  |---|---|
  | SC-230 | styles 7671-7739; shoot 5016, 5330 |
  | SC-231 | styles 8416-8452 |
  | SC-255 | styles 3395 |
  | SC-284 | styles 13589-13693 |
  | SC-338 | styles 14023, 15347-15365 |
  | SC-236 / SC-272 | no shared files touched in this diff's hunks |

- Tree state: the dse worktree was clean before and after at `64e88eb`. The superproject shows ` M draw-steel-elements` before and after, which is the implementer's unstaged pointer. Every probe edit was reverted (`git checkout --`), and the untracked sweep copy was deleted.

## Artifacts

Gate logs (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/logs/`):
`sc317-rv1-tsc-*.log`, `sc317-rv1-lint-*.log`, `sc317-rv1-jest-111522.log`, `sc317-rv1-lifecycle-111554.log`, `sc317-rv1-shots-111829.log`, `sc317-rv1-freeze-*.log`, `sc317-rv1-parity-112555.log`.

Probes and evidence (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/rv1/`):

- Scripts: `probe1.mjs`, `probe2-orphan.mjs`, `probe3-pixels.mjs`, `probe4-anchors.mjs`, `mutate.py`, `sweep-probe-copy.mjs.txt`.
- Candidate CSS: `cand-v1.css`, `cand-v2.css`, `cand-v3.css`, `cand-v4.css`, `cand-v4b.css` (the recommended form; the probe scopes it under `.probe-wrap.cand`).
- Logs: `probe1.log`, `probe2-*.log`, `probe2*-rows-*.json`, `probe3-v1.log`, `probe4.log`, `sweep-{control,a-width,b-opacity,c-bgimage}.log`, `mut-*.log`, `git-status-before-sweepprobe.txt`, `tune/`, `tune4/`, `fonts/`.
- Screenshots:
  - `rv-perk-links-{dark,light}-para.png`: the whole link phrase with its surroundings, a two-line wrap.
  - `rv-orphan-*-w*.png`: rows are shipped / candidate / Obsidian geometry, at the first orphan width.
  - `rv-rest-compare-*.png`: the same three forms at rest.
  - `rv-v1-icon-*.png`: tight icon clips.
