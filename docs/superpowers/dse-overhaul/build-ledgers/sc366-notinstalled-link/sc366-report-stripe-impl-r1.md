# SC-366 stripe removal, implementer r1 report

## Executive summary
- Verdict: DONE. Stripe removed from `.dse-ref-notice` (shared by both ds-scc degrade cards); SC-149 comment rewritten; 2 jest tests added (bite-proven).
- dse commit: `e025dd2` on branch `sc366-stripe-remove`, rebased onto origin/develop `772c3cd` (was cut from `bc4a0c5`; rebase was clean, `.dse-ref-notice` byte-identical across the two, package.json/lockfile unchanged so no second `npm ci`). Not pushed.
- Superproject CHANGELOG commit: `82382a2` (CHANGELOG.md only; `draw-steel-elements` pointer left unstaged). Not pushed.
- Gates at e025dd2: tsc + lint clean; jest 5538 passed / 1 skipped / 233 of 234 suites (5536 + 2 new); lifecycle 31/31 ok 0 failed (port 9368); e2e 89/93 ok, 0 failed, 4 known-bug, 64/64 pairs; shots 580, 0 FAIL; freeze 280/280 (0 frozen shots moved); parity 0 GAPs / 0 undeclared / 24 DECLARED.
- Computed style, both cards, before (bc4a0c5) -> after: dark `border-left` 3px solid rgb(2,122,255) -> 1px solid rgb(51,51,51); light 3px solid rgb(8,109,221) -> 1px solid rgb(228,228,228). `border-top-color` unchanged: dark rgb(51,51,51), light rgb(228,228,228). Left now equals top in width, style and colour.

## Changes
- `draw-steel-elements/styles-source.css`: deleted `border-left: 3px solid var(--color-blue)` from `.dse-ref-notice`; rewrote the SC-149 comment (no more "informational blue accent"; now "a prose message and a muted follow-up line, no accent device" plus one line citing SC-366 / DESIGN.md rule 7 borders-all-around). Nothing else in the file touched.
- `draw-steel-elements/test/dom/theme/notInstalledLinkColour.test.ts`: new `describe('SC-366 — the ds-scc degrade cards have no left stripe')` with 2 tests: (a) the `.dse-ref-notice` root rule is present and keeps `border: 1px solid var(--background-modifier-border)`; (b) no rule whose selector targets `.dse-ref-notice` or `.dse-ref-web-card` (root classes only, innermost rules so @media-nested ones count) declares `border-left*` or `border-inline-start*`.
- `CHANGELOG.md` (worktree superproject): sentence appended to the SC-366 bullet's last line, verbatim from the brief.

## Bite-proof
With the declaration restored via Edit, the new test fails (`Expected pattern: not /border-(left|inline-start)\b/`; 1 failed, 4 passed). Log: `sc366-stripe-gate-bite.log`. Reverted via Edit; the later `git diff`/commit shows only the intended removal, `git status --porcelain` in dse is empty after commit. (My pre-bite sha256 check used a relative path and so did not run; the proof of byte-clean revert is the committed diff, which contains exactly the comment change and the one deleted line.)

## Checks asked for
- Asserts of the old stripe in src/ or test/: none (`border-left` / `--color-blue` / "informational blue" hits in src/test are unrelated: steelMaterial.test.ts and tableHostRegrounding.test.ts comments about other components; RefUnwrapView.ts has none). Nothing to update beyond the new test.
- Other CSS touching these cards: grep for `dse-ref-notice` / `dse-ref-web-card` in styles-source.css finds only the root rule, `__msg`, `__hint`, and the SC-366 link colour rules (`a.dse-ref-web-card__link`, rest + hover). No print rule, no `box-shadow: inset`, no ::before/::after on the card (computed `box-shadow: none`, pseudo content `none` for both cards, both schemes). Nothing else removed.

## Evidence (Scott reviews; label text carries the difference, not colour)
Rendered in the visual harness page with the real pinned Obsidian 1.13.7 app.css on (`sheet=1`), Reading-view-shaped ancestors, DPR 2, DOM built with the same createDiv/createEl calls as `renderRefNotice` / `webCard`. Each PNG has a dashed-box banner reading "BEFORE (develop bc4a0c5): 3px blue stripe on the LEFT edge, 1px border on the other three sides" or "AFTER: plain 1px border on all four sides, no stripe", plus the card name and measured border values. BEFORE was rendered on bc4a0c5; since `.dse-ref-notice` is byte-identical on 772c3cd, it was not re-rendered. The notice-card sample text ("Unknown SCC code ...") is illustrative.
Dir: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc366-notinstalled-link/
- sc366-stripe-before-notinstalled-dark.png, sc366-stripe-before-notinstalled-light.png, sc366-stripe-before-notice-dark.png, sc366-stripe-before-notice-light.png
- sc366-stripe-after-notinstalled-dark.png, sc366-stripe-after-notinstalled-light.png, sc366-stripe-after-notice-dark.png, sc366-stripe-after-notice-light.png
- sc366-stripe-before-computed.json, sc366-stripe-after-computed.json (all four sides' width/colour, box-shadow, pseudo content)
- Probe script (scratch, not committed): /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc366-stripe-impl-k7x4q/sc366-stripe-probe.mjs
- Gate logs: sc366-stripe-gate-{tsc,lint,jest,lifecycle,e2e,shots,freeze,parity,bite}.log

## Notes
- Shots on this shared host took more than 600 s (load 12-17, several other shoot.mjs runs concurrent); the harness moved that one call to the background, I waited on its PID, and the log ends `GATE-RC=0`, 580 files, 0 FAIL, host-copy pin OK, button host-leak 112 kinds / 672 comparisons.
- `npm run host-css` was run once to cache dist/obsidian-app.css before jest (jest read 1 skipped, as expected).

Drive-by fixes: none.

Follow-ups: none new. (Other left stripes `.dse-error-card` ~416 and the role/tier/act ones are untouched, as scoped. SC-469 still covers a harness fixture for these two cards; the new test is a source-text pin because no fixture exists.)
