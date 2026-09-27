# SC-317 implementation round 1 — report

## Executive summary

- **Verdict: DONE.**
- Final dse sha: `64e88ebfb571422e7499e47dc69d49c86db522ea` (branch `sc317-extlink-icon`, base `619c4bd`).
- Superproject (docs) sha: `01ca911fc4d47e725fe70b93b199b494a851d15a`.
- `npm run tsc`: clean. `npm run lint`: clean, exit 0.
- `npx jest`: **4043 passed / 1 skipped / 208 of 209 suites / 3 snapshots** (base 4038 + 5 new tests).
- `npm run obsidian-lifecycle`: **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0.
- `npm run shots`: **524 PNGs, 0 FAIL**; every in-run sweep OK, incl. the widened inline host-leak sweep.
- `check-freeze.sh`: **`freeze OK (260/260 …)`**, exit 0 — **zero frozen bytes moved** (D4 confirmed empirically, not just by scope).
- `npm run parity`: **0 GAPs / 0 undeclared / 16 DECLARED / exit 0** — unchanged composition, no new delta from the icon.
- No rebaseline needed. Nothing pushed; all commits local to `sc317-extlink-icon`.

## Commits

dse repo (`draw-steel-elements`, all on branch `sc317-extlink-icon`, base `619c4bd`):

1. `ec48285` — `feat(theme): SC-317 — plugin-drawn external-link icon (D1-D5)` — the CSS rule (`styles-source.css`), the `RefUnwrapView` class fix, and their jest coverage.
2. `64e88eb` — `test(harness): SC-317 — inline host-leak sweep samples the new ::after icon` — `visual-harness/shoot.mjs` widened to sample the new pseudo-element.

Superproject worktree (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`):

3. `01ca911` — `docs: SC-317 — DESIGN.md component row + CHANGELOG entry for the external-link icon`.

The superproject's submodule pointer (`draw-steel-elements` → `64e88eb`) is currently an **unstaged** diff in the superproject worktree (`git status`: `M draw-steel-elements`) — bumping it is a landing-time step per the workspace's own convention, not something this round committed, since the brief did not ask for it and no push/land step was in scope.

## Scope survey (every anchor the plugin renders that can leave the vault)

| # | Site (file:line) | Class carried | Leaves the vault? | Call | Action taken |
|---|---|---|---|---|---|
| 1 | `src/refs/rewriteSccAnchors.ts:34-38` (the `web` branch of `rewriteSccAnchors`) | Already `external-link` (stamped by Obsidian's own `MarkdownRenderer` on any external-protocol markdown link, before this function runs) + this function adds `ds-scc-web` | Yes — rewrites to `https://steelcompendium.io/scc/<code>/`, `target="_blank"` | **Prose** — a normal inline link inside rendered markdown body text | None needed — the class was already present; the new CSS selector (bare `.external-link`) picks it up automatically. Exercised by the pre-existing `perk/links` harness fixture (`visual-harness/entry.ts` ~883), which carries this exact literal shape (`class="external-link ds-scc-web"`). |
| 2 | `src/elements/shared/RefUnwrapView.ts:361` (`webCard`, the "not installed locally" degrade card) | Was `dse-ref-web-card__link` only — **no** `external-link` | Yes — `href` is a `https://steelcompendium.io/scc/<code>/` URL, `target="_blank"` | **Prose** — plain "View on steelcompendium.io" text link inside a `.dse-ref-notice` card, no button/chip chrome | **Fixed at build time**: added `external-link` to the `cls` string (commit `ec48285`). Covered by a new assertion in the existing `refUnwrapView.test.ts` test for this card. Not covered by the visual harness — deliberately: `styles-source.css`'s own SC-202 r4 comment records "there is deliberately NO `scc`/`ref` fixture" in the harness (`ds-scc` needs a real synced compendium to render this state; its coverage is the jsdom suite), so no fixture change was needed or made. |
| 3 | `src/framework/sidebar/SidebarPanel.ts:204` (`renderHeader`'s note-name link) | `dse-sidebar__panel-note` | **No** — `href="#"`, click is `preventDefault()`-ed and calls `workspace.openLinkText(...)`, pure in-vault navigation | Internal navigation, not a link leaving the vault | Out of scope — excluded, no class, no icon. |
| 4 | Any other plugin-body markdown link (`[text](https://…)` inside a career/class/perk/montage-guide/etc. "content"/prose field) | `external-link` — stamped generically by Obsidian's `MarkdownRenderer.render` (the single shared call site, `src/framework/view.ts:234`, used by every markdown-rendered field) for any external-protocol href | Yes | **Prose** | Covered generically by the same CSS selector; no enumerable fixed set of call sites (content-dependent), no code change. This is the same class of link item #1 above already proves out via `perk/links`. |

No plugin-built anchor was found styled as a button/chip that also leaves the vault — the only literal `createEl('a', …)` call sites in `src/` are items #2 and #3 above (grepped `createEl('a'` project-wide, excluding tests), plus the SCC-anchor rewrite (#1) which mutates existing DOM rather than creating it. No anchor needed widening the CSS selector beyond the existing `.external-link` class — every case above already carries, or now carries, that class.

## The CSS shipped (`styles-source.css`, GROUP 7 companion, right after the SC-202 r4 GROUP 7 re-grounding)

**Glyph source (D1):** Obsidian's own external-link arrow SHAPE, extracted verbatim (not redrawn) from `.external-link { background-image: url(public/images/6155340132a851f6089e.svg) }` in **Obsidian 1.14.2**'s real `app.css` (the newest installed asar at the time of the change — `~/.config/obsidian/obsidian-1.14.2.asar`, read via the same `readAsarFile` reader `obsidian-host-pin.mjs` already uses). Extracted SVG sha256: `a7c6a118d17f6a296037b519e9891e08951de59c289fe41ec2596a63c3b28516`. Only the XML prolog and the `class='i-external'`/explicit `width`/`height` attributes were dropped (an Obsidian-internal JS hook and redundant sizing this rule's own `mask-size` replaces) — `viewBox`, every `stroke-*` attribute and the `<path>` geometry are byte-identical to the source.

```css
:is([data-dse-element], .dse-modal):not([data-dse-print="on"]) :where(a).external-link::after {
	content: '';
	display: inline-block;
	width: 0.8em;
	height: 0.8em;
	margin-inline-start: 0.15em;
	vertical-align: -0.05em;
	background-color: currentColor;
	mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%23888888' stroke-linecap='round' stroke-linejoin='round' stroke-width='9.38%25'%3E%3Cpath d='M14 9 L3 9 3 29 23 29 23 18 M18 4 L28 4 28 14 M28 4 L14 18'/%3E%3C/svg%3E");
	-webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%23888888' stroke-linecap='round' stroke-linejoin='round' stroke-width='9.38%25'%3E%3Cpath d='M14 9 L3 9 3 29 23 29 23 18 M18 4 L28 4 28 14 M28 4 L14 18'/%3E%3C/svg%3E");
	mask-repeat: no-repeat;
	-webkit-mask-repeat: no-repeat;
	mask-size: contain;
	-webkit-mask-size: contain;
	user-select: none;
	-webkit-user-select: none;
}
```

- **Colour (D2):** `mask-image`/`-webkit-mask-image` (alpha channel of the SVG only — the source's own `#888888` stroke colour is irrelevant to the mask, it's fully opaque) + `background-color: currentColor`. No `filter` anywhere. Result: the glyph takes the anchor's own resolved colour — teal-cyan `--dse-accent` in both steel-dark/steel-light for every anchor covered by the pre-existing `.dse-card`/`.dse-feature`/etc. colour family, and whatever ambient colour an anchor outside that family resolves to (e.g. item #2's notice-card link) — and its `:hover` colour, for free, no separate hover rule.
- **Spacing/shape (D3):** glyph `0.8em` square (inside the ticket's 0.75–0.85em target), `mask-size: contain` (the source SVG's `viewBox` is square, so this scales cleanly), gap `margin-inline-start: 0.15em`, `vertical-align: -0.05em` for optical alignment with the surrounding text's x-height/cap line — tuned against the real crops below, not guessed. `content: ''` (never real text — structurally nothing to select) + `display: inline-block` (an atomic inline box a text-decoration line painted by the ancestor anchor does not continue under — so the glyph is never underlined, with no dedicated `text-decoration: none` needed) + `user-select`/`-webkit-user-select: none` (explicit, redundant given `content: ''`, kept for stated intent). **Orphan-wrap:** the rule inserts no leading whitespace and the pseudo is glued directly onto the anchor's own trailing text run, so there is no browser break opportunity between the last character of link text and the glyph — it cannot wrap onto its own line except at whatever break opportunity already existed earlier in that same trailing word (a pre-existing condition the pseudo's own CSS cannot undo). This is the same "glued trailing icon" shape any inline-block suffix icon uses; it is not airtight against an already-breaking word, but that is unavoidable at the point the pseudo is reached.
- **Screen-only (D4):** same `:not([data-dse-print="on"])` scope as every rule in the SC-202 r4 block. Verified empirically, not just by construction: `check-freeze.sh` reports **`freeze OK (260/260 …)`** — zero frozen `*--steel-print.png`/`*--steel-realprint.png` bytes moved.
- **D5 (re-grounding stays):** the pre-existing GROUP 7 re-grounding rule (`background-image: none`, etc.) is untouched — `git diff` on that hunk is empty; the new rule is purely additive, right after it.

## Harness changes (`visual-harness/shoot.mjs`)

- `perk/links` fixture: **unchanged** — it already carries the one `class="external-link ds-scc-web"` anchor needed (`visual-harness/entry.ts` ~883), and the new CSS is purely additive on that existing class, so no widening was needed.
- `readTaggedInline`: now also reads the external-link anchor's `::after` pseudo (`getComputedStyle(n, '::after')`) for `maskImage`, `webkitMaskImage`, `maskSize`, `webkitMaskSize`, `maskRepeat`, `webkitMaskRepeat`, `backgroundColor`, `width`, `height`, `marginInlineStart`, `display` — prefixed `after_` to avoid key collision with rest-state props of the same short name.
- `assertInlineHostLeak`: compares those `after_*` values bare vs. host-present, same contract as the pre-existing rest-state comparison, incrementing a new `afterComparisons` counter.
- Printed OK line now reads (measured, from the real `npm run shots` run):
  ```
  inline host-leak OK (0h1+1h2+12h3+5h4+0h5+2h6+35strong+11em+13b+5i+155a rest [488] + 2 external-link icon [2] + 2 external-link ::after icon (SC-317) [2] + a:hover [314] + a:focus-visible [314] + 4 synthetic (h1/h5/mark/code) [8] × dark/light = 1128 comparisons …)
  ```
  (base `619c4bd`, measured independently in a scratch worktree: `… = 1126 comparisons …`, i.e. +2 for the two new `::after` comparisons, 0 diffs both before and after.)

## Tests added

- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts` — new `describe('SC-317 — GROUP 7 companion: the plugin's own external-link icon (::after)', …)` block, 5 tests: the rule exists; it sits in the print-excluded scope; it draws via `mask-image`/`-webkit-mask-image` + `currentColor` and never `filter`; it is not selectable and does not wrap (content/display/user-select shape); the glyph's `width` falls inside D3's 0.75–0.85em target.
- `test/dom/elements/refUnwrapView.test.ts` — one new assertion in the existing "resolved code classifies as web" test: `link.classList.contains('external-link')` is `true`.

## Gate results (measured, in order)

| Gate | Result | Log |
|---|---|---|
| `npm run tsc` | clean | `sc317-r1-tsc-20260925-104932.log` |
| `npm run lint` | clean, exit 0 | `sc317-r1-lint-20260925-104943.log` |
| `npx jest` (after `rm -f main.js styles.css`) | **4043 passed / 1 skipped / 208 of 209 suites / 3 snapshots** | `sc317-r1-jest-20260925-105000.log` |
| `DSE_LIFECYCLE_PORT=9285 npm run obsidian-lifecycle` | **`OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed`**, exit 0 | `sc317-r1-lifecycle-20260925-105107.log` |
| `npm run shots` | **524 PNGs, 0 FAIL**; `host-copy pin OK` (Obsidian 1.14.2 verbatim); `button host-leak OK`; `inline host-leak OK` with the new `::after` count above; `link token-override probe OK` | `sc317-r1-shots-20260925-105402.log` |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`**, exit 0 | `sc317-r1-freeze-20260925-110119.log` |
| `npm run parity` | **`0 gap(s), 0 undeclared warning(s), 16 declared deferral(s).`**, exit 0 — same 16 declarations as base, byte-for-byte (external links are not a mapped parity selector, so the icon creates no new delta to report) | `sc317-r1-parity-20260925-110124.log` |

`(node esbuild.config.mjs production) / npm run build-no-check` also run manually mid-round to sanity-check the CSS compiled (`sc317-r1-build-20260925-104610.log`, `-104623.log`); `npm install` was required once (fresh worktree, no `node_modules`) — `sc317-r1-npminstall-20260925-104615.log`.

Load at jest time: `/proc/loadavg` read `2.47 2.58 2.94` before the run — comfortably quiet, no timeout-shaped red to second-guess.

## Evidence artifacts

All under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/`:

- `sc317-perk-links-dark-after.png` / `sc317-perk-links-light-after.png` — tight 2x crops of the `perk/links` fixture's external link ("…own entry[icon] for the supernatural…") in each scheme, this branch's own `npm run shots` output.
- `sc317-perk-links-dark-before.png` / `sc317-perk-links-light-before.png` — same crop, same fixture, from a clean scratch `git worktree` of `draw-steel-elements` at `origin/develop` `619c4bd` (built, shot, then removed — never the main checkout).
- `sc317-perk-links-dark-hover.png` / `sc317-perk-links-light-hover.png` — the same link under `:hover` (ad hoc Playwright probe against the built harness page, not a committed fixture/script). **Note:** this anchor's `:hover` colour is identical to its rest colour by pre-existing design (`.dse-card a:hover { color: var(--dse-accent); }` — same value as the rest rule, `styles-source.css` ~8165), so the crop shows no colour shift; what it does prove is that the `currentColor`-masked glyph tracks correctly under `:hover` too (no separate hover rule needed, none added).
- `sc317-perk-links-print-after.png` — crop of `perk-links--steel-print.png` ("own entry" with no icon), confirming D4.

Only one genuine `.external-link`-classed anchor exists anywhere in the visual harness today (`perk/links`'s own `ds-scc-web` anchor — confirmed by grep and by the pre-existing styles-source.css comment "there is deliberately NO `scc` fixture"), so this single capture also serves as "the SCC-link capture of your choice" the brief asked for as a second sample; there is no second one to pick.

Gate logs: all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/logs/` (`sc317-r1-*.log`, listed in the gate table above plus the build/npm-install sanity logs).

## Drive-by fixes

None. No pre-existing bug/typo was fixed in passing this round.

## Follow-ups (for the ticket owner to judge)

1. **`.dse-ref-web-card__link` (item #2 in the survey) never had its colour re-grounded to `--dse-accent`.** It renders at whatever ambient/Obsidian link colour resolves inside a `.dse-ref-notice` card (that container isn't one of the five named in the pre-existing `.dse-card a`/`.dse-feature a`/etc. colour family). This is pre-existing, unrelated to SC-317's own scope (D2 only asks the new icon to follow whatever colour the anchor already has, which it does), and changing it would be a separate visual/pixel decision, not a re-grounding — reporting it rather than fixing it in passing.
2. **The orphan-wrap mitigation (D3) is "glued, not airtight."** If the link text's own last word is already at a line-wrap boundary, the glyph can still end up alone on the next line (a property of any trailing inline-block icon, not specific to this implementation). No fixture in the corpus currently exercises a narrow-enough width to hit this; flagging it as a known, currently-unobserved edge case rather than building a narrow-width regression fixture for it (out of the brief's asked scope).
3. Nothing else surfaced — no parity delta, no freeze delta, no new host-leak.

## Files touched

dse repo (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/draw-steel-elements`):
- `styles-source.css`
- `src/elements/shared/RefUnwrapView.ts`
- `test/dom/theme/headingEmphasisLinkHostRegrounding.test.ts`
- `test/dom/elements/refUnwrapView.test.ts`
- `visual-harness/shoot.mjs`

Superproject worktree (`/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`):
- `DESIGN.md`
- `CHANGELOG.md`
- (unstaged) `draw-steel-elements` submodule pointer
