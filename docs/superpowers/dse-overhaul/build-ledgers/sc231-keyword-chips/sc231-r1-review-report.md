# SC-231 round 1 — independent review report

## Executive summary
- **Verdict: FIX-ROUND** (1 HIGH). Branch `sc231-keyword-chips` @ `05e26ea` (base `origin/develop` `6c4f6aa`); tree left clean (`git status --porcelain` empty before and after).
- **HIGH-1:** removing `--keywords` from the base chip group (styles-source.css:8416) takes the small-caps voice, muted colour and subheading size off the Keywords cell in the **grid and ledger** kwUsage modes on screen. Keywords now render "Magic, Melee, Strike, Weapon" in plain case next to a small-caps "MAIN ACTION". That regresses review L-6 (styles-source.css:8814), and CHANGELOG.md:29 says those modes are unchanged.
- The owner's DOM ruling holds in a real browser: each link appears exactly once, always inside its chip. No link is in a separator, there are no invisible Tab stops and there is no aria-hidden subtree. Real Obsidian draws the chips too (checked with the camera on a private Xvfb).
- **Freeze:** re-measured `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`. My two sweeps produced the same 55 names as rebaseline.txt, byte for byte. Every difference is 1–2 glyphs in the Keywords text row (44–508 px, the largest box 441x30). **This cannot be avoided** under the one-DOM rule: splitting the text node alone, with no elements, moves the same 48 feature and statblock lines. The comma-in-chip and keep-`<p>` variants move 48 too. Unwrapping without splitting moves 0.
- MEDIUM-1: jest does not cover the real renderer's `<p>…</p>\n` shape. With 05e26ea's bug put back, feature.test.ts still passes 62/62.
- Gates at 05e26ea: tsc and lint clean; jest 4003 passed / 1 skipped / 206 of 207; lifecycle 6/6; shots 524 ok, 0 FAIL; parity 0 GAPs / 0 undeclared / 16 DECLARED, exit 0.

## Findings

### HIGH-1 — grid and ledger Keywords lose the chip band's small-caps voice on screen
- **Where:** styles-source.css:8416-8420 (and its `body.theme-light` twin, formerly just below). `.dse-feature__meta-cell--keywords` was taken out of the shared chip rule that supplies `font-size: var(--dse-fs-subheading); font-variant: small-caps; text-transform: lowercase; letter-spacing: .04em; color: var(--dse-fg-muted)` (plus the box). The replacement per-keyword rules (8475-8503) are scoped `:not([data-dse-kwusage='text'|'grid'|'ledger'])`, so no rule brings the voice back in grid or ledger. The grid and ledger arms (8727-8810) only strip the box and rely on the base group for the voice. The L-6 comment at 8814 says this outright ("keep the chip band's SMALL-CAPS VOICE in grid and ledger … site … leave `.sc-ability__chip`'s small-caps standing").
- **Evidence:** `statblock-kwusage-grid--steel-{dark,light}.png` and `statblock-kwusage-ledger--steel-{dark,light}.png` moved between base and head. Keywords went from "MAGIC, MELEE, STRIKE, WEAPON" (small caps, muted) to "Magic, Melee, Strike, Weapon" (normal case, bigger and brighter in ledger), while Type still reads "MAIN ACTION". Crops: `evidence-r1rev/statblock-kwusage-grid--steel-dark-before-after-diff.png` and `…-ledger--steel-dark-…`. Side effect in light mode: the Keywords cell also loses the faint `rgba(0,0,0,.02)` wash that Type keeps (`…-ledger--steel-light-…`, `…-text--steel-light-…`).
- **Failure scenario:** a user with Settings → keyword display = Grid or Ledger gets mismatched Keywords and Type cells, and a site-parity regression, the moment this lands. Nothing catches it: steel-dark and steel-light are unfrozen, and no parity pair covers the chip band.
- **Fix:** keep non-crest modes byte-identical by construction. Put `--keywords` back into both original group selectors (8420 and the light twin). Then, inside the crest-scoped block (the same `:not([data-dse-kwusage=…])×3` prefix), reset only the Keywords cell's box: `padding:0; border:none; background:none; display:block` (or whatever crest needs). Also make sure `.dse-feature__kw` doesn't inherit a doubled `font-size` from the cell: the cell keeps `--dse-fs-subheading`, so set the chip to `font-size: inherit` or `1em`. **Acceptance:** `statblock-kwusage-{text,grid,ledger}--steel-{dark,light}.png` byte-identical to origin/develop (6 files), and crest steel shots show the chips unchanged. Then correct or confirm CHANGELOG.md:29.

### MEDIUM-1 — jest never exercises the real renderer's output shape (wrapper + trailing whitespace)
- **Where:** src/elements/feature/renderFeature.ts:97-146 (`chipifyKeywords` wrapper detection); test/dom/elements/feature.test.ts SC-231 block. The mock renderer in test/mocks/obsidian-core.ts appends a bare text node.
- **Evidence:** with renderFeature.ts checked out at `5bdef15` (the pre-05e26ea bug: the whole `<p>` became one chip), `npx jest test/dom/elements/feature.test.ts` gives **62 passed / 62**. Log: `sc231-r1rev-jest-vacuity-pre05e26ea.log`.
- **Failure scenario:** a refactor of the wrapper detection brings back the one-giant-chip bug. jest stays green, and freeze is the only thing that notices.
- **Fix:** add a test that calls `renderFeature` directly with a `renderMd` stub that mimics marked/Obsidian: `el.innerHTML = '<p>Attack, <a href="x">Weapon</a></p>\n'; return Promise.resolve();`. Assert that `.dse-feature__meta-value` has only chip and separator spans as children (no `<p>`), and that the `<a>` is the same node inside chip 2 (keep a reference before the await). Or export `chipifyKeywords` and test it directly on that DOM.

### LOW-1 — crest mode: copy-paste and screen-reader text lose the separators
- **Where:** styles-source.css:8501 (`.dse-feature__kw-sep { display:none }`).
- **Measured (Chromium, steel-dark crest):** `textContent` = "Attack, Weapon" (unchanged). `innerText` and a selection copy = "attack\nweapon" (base: one inline run). The separators are left out of the accessibility tree, so the chips are read as a list with no commas. Print and the text, grid and ledger modes still copy "Attack, Weapon".
- **Note:** the site does the same (`.join("")`, gap only), so this matches parity. It's the owner's call. If the separators should stay audible, switch 8501 to the visually-hidden recipe already used at 8558 in place of `display:none`. A separator never holds a link (verified), so focus is unaffected.

### LOW-2 — malformed keyword entries now print differently
- `keywords: ["**Bold**, Kw", "  spaced  ", "Trailing,", …]` becomes chips "Bold | Kw | spaced | Trailing | …". Print text is now "Bold, Kw, spaced, Trailing, Magic, Magic"; the old run kept "Trailing,, Magic". So "print unchanged" and "textContent unchanged" (the renderFeature.ts:63-74 doc comment and the CHANGELOG) hold only for well-formed lists. That's arguably better; just don't claim it's universal. Duplicates are kept (Magic, Magic), and a comma inside a link's text or inline code is never split (verified).

### LOW-3 — stale cross-reference
- styles-source.css:8417 says "see the crest-mode block below, ~4442". The block is at ~8448-8503. Fix the line reference.

### INFO
- **Chip vs site `.sc-ability__chip`** (steel-ability-cards.css:134-138), computed in steel-dark:
  - gap: 8px, matches (.4rem at 20px).
  - horizontal padding: 12px, matches.
  - vertical padding: 1.84px vs site 0.4px.
  - font-size: 18.4px (`--dse-fs-subheading` = 1.15em) vs site 17.6px. The comment's own 1.1em target isn't what ships; this predates SC-231.
  - radius: 7.36px (`--dse-radius` 0.4em) vs site 5px.
  - chip height: 36.9px.
  - border, fill, small-caps, lowercase and letter-spacing all match.
  - The keyword chip is identical to the existing Type chip recipe, so it's consistent inside the plugin. The deltas are inherited, not new.
- **Scoping:** every new rule carries `[data-dse-theme='steel']:not([data-dse-print="on"])`. No hex. Two rgba literals are copied from the Type chip (not tokens; same as existing practice). New selectors reach only `.dse-feature__kw`, `.dse-feature__kw-sep` and the Keywords `.dse-feature__meta-value`. Nothing touches `.dse-optchip`. Print does not pick up the chip CSS: print diffs are sub-pixel only.
- **Wrapping:** 15 keywords at 300px wrap cleanly into 7 rows with no visible separators and no overflow. At 900px they fit in 2 rows. The Type chip drops to its own row once Keywords fill the width. Worth a look from Scott. (`evidence-r1rev/sc231-r1rev-p-long-{300-dark,900-light}.png`)
- **Surfaces:** every Keywords cell comes through `renderFeature.ts` `cell()`: `ds-feature`, statblock and featureblock abilities, kit and hybrid signature abilities (CardLayout and display/layouts), SettingsPreview. Scc links are rewritten inside `ElementView.renderMarkdown` before chipify runs (view.ts:233-237), so the order is correct. `statblock/view.ts:150` (the monster head eyebrow) is a different field and correctly untouched.
- **Tests:** with src reverted to base, 4 of the 6 new tests fail. The 2 that pass (empty and dash) are regression guards by design.
- **History:** 4 superseded commits (cb564a0, fa214b1, 442c439, 6578ea6) are still on the branch. Squash at landing.

## Freeze: independent verification
- My sweep 1 (`sc231-r1rev-freeze-head.log`) and sweep 2 (`…-head2.log`): `FREEZE VIOLATED (55 checksum mismatches, 0 missing)`. The mismatch set is identical to rebaseline.txt's names (sorted diff empty). `sha256sum -c rebaseline.txt` passes against both sweeps. All 524 `--steel-*` PNGs are byte-identical between my two sweeps.
- Base control (renderFeature.ts + styles-source.css at origin/develop, same tree): `freeze OK (260/260 …)` (`sc231-r1rev-freeze-base.log`).
- The 55 lines cover 28 ids: 27 twin+realprint pairs, plus `chrome-collapsed-trio`, which moved on realprint only. Every Keywords-bearing capture carries a Keywords band.
- Pixel diffs (`evidence-r1rev/sc231-r1rev-diff-print.tsv`) are a single band ≤30px tall per file, on 1–2 glyphs of the Keywords text:
  - 324/328 px, 33x22 — "W" of Weapon: feature*, chrome-collapsed-rollout.
  - 44/45 px, 8x10 — one comma: statblock*, chrome-*.
  - 179 px, 27x22 — statblock-roleless-corpus.
  - 505/508 px, 441x30 — "M" plus "p": statblock-kwusage-ledger.
- **Avoidability probe** (scratch variants of `chipifyKeywords`, feature and statblock print subset, 58 frozen lines; HEAD calibration = 48 mismatches). Every variant was reverted byte-clean.

  | Variant | Mismatches |
  |---|---|
  | A: unwrap `<p>` and drop the trailing "\n", no split | **0** |
  | B: keep `<p>` and "\n", chips inside it | 48 |
  | C: comma inside the preceding chip, separator holds only " " | 48 |
  | D: split into adjacent **text nodes only**, no elements | 48 |
  | F: ", " inside the preceding chip, no separator (one boundary per keyword) | 42 |

  The movement comes from breaking the text run into more than one text node. Chromium positions glyphs slightly differently after a text-node boundary. Element placement doesn't matter. Any one-DOM chip design moves these bytes. The only freeze-neutral option would branch the DOM on print, which the dse-verify rule "print cannot be branched around" forbids. **Conclusion: the 55-line rebaseline is unavoidable. It needs Scott's sanction.** Once HIGH-1 is fixed, rebaseline.txt still applies unchanged: the fix touches screen-only selectors, so re-verify with one sweep.

## Gates (measured at 05e26ea, foreground)
| Gate | Result | Log |
|---|---|---|
| tsc | clean | sc231-r1rev-tsc.log |
| lint | clean | sc231-r1rev-lint.log |
| jest | 4003 passed / 1 skipped / 206 of 207 suites / 3 snapshots | sc231-r1rev-jest.log |
| obsidian-lifecycle | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed` | sc231-r1rev-lifecycle.log |
| shots | 524 ok, 0 FAIL; all host-leak / host-copy pin lines OK (×2 sweeps) | sc231-r1rev-shots-head.log, -head2.log |
| freeze | `FREEZE VIOLATED (55 checksum mismatches, 0 missing)` | sc231-r1rev-freeze-head.log, -head2.log |
| parity (last) | `**0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).**`, rc=0 | sc231-r1rev-parity.log |
| real-Obsidian camera (feature, dark, Xvfb :187 / port 9287) | chips render ATTACK / WEAPON | sc231-r1rev-obsidian-camera.log |

## Artifacts
Logs are in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/`: `sc231-r1rev-*.log` (tsc, lint, jest, lifecycle, shots-head, shots-head2, shots-base, freeze-head, freeze-head2, freeze-base, parity, jest-vacuity-revert-src, jest-vacuity-pre05e26ea, var{H,A,B,C,D,F}, obsidian-camera, probe-build, domprobe.err).

Evidence is in `…/sc231-keyword-chips/evidence-r1rev/`: before/after/diff crops, the DOM probe JSON and script, the variant patcher and runner, narrow-width shots, and the real-Obsidian crop.

Scratch leftovers: `visual-harness/shots/feature--obsidian-steel-dark.png` (gitignored, from the camera run). The demo-vault files notes-gen created were removed. The ignored-file set matches its state at the start.
