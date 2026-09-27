# SC-230 round 3 — fix round report

## Executive summary

- **Verdict: DONE.** All five r2 findings closed. MEDIUM-1 (compounding) and MEDIUM-2
  (unanchored print guard) fixed with the reviewer's prescribed selector shape; LOW-1
  (title scaling) implemented per the owner's default (scale it); LOW-2 (evidence) replaced
  with real-Obsidian 1.14.2 captures; LOW-3 (CHANGELOG/docs) done.
- Base: `origin/develop` **c524fd2**. Head: **`0dbab595f2293a07a3498a6cf2f2d6b2e7dc647d`**
  (branch `sc230-modal-text-size`), 5 commits ahead of base (2 from r1's earlier round + 3
  new this round), clean rebase, no conflicts. `npm ci` run (package.json/lock changed,
  JSZip→fflate).
- Gates: tsc clean; lint clean exit 0; jest **3990 passed / 1 skipped / 205 of 206
  suites**, 0 failed — base-at-tip (bare `c524fd2`, measured separately) is **3983
  passed / 1 skipped / 205 of 206**, so this branch's own net delta is **+7 tests**, same
  suite count; shots **524 PNGs, 0 FAIL**, plus a new real-browser runtime gate
  ("modal text-scale anchoring OK"); freeze **`freeze OK (260/260 …)`, exit 0** against the
  SC-328-updated baseline; parity **0 GAPs / 0 undeclared / 16 DECLARED, exit 0**.
- Real Obsidian 1.14.2 (private Xvfb + CDP, scratch vault, deleted after): base body text
  stays 15px at both 100%/140% (bug reproduces); head body text and title both go
  15px→21px (exactly ×1.4) at 140%; head's ratio stays exactly ×1.4 (not ×1.96) even with
  Obsidian's own `.modal-content` reset neutralized live (the MEDIUM-1 scenario); head at
  100% is **byte-identical** (same SHA256) to base at 100%.
- 6 evidence PNGs produced, all real Obsidian, cropped to the whole dialog box.

## Per-finding status

| Finding | Status | Where |
|---|---|---|
| MEDIUM-1 (scale compounds ×1.96 when host reset absent) | **FIXED** | `styles-source.css` — `.dse-modal` never itself scaled; commit `3eda109` |
| MEDIUM-2 (print guard unanchored, FOLLOWUPS #43 shape) | **FIXED** (same commit as MEDIUM-1) | `styles-source.css`; DOM-level `Element.matches` pin in `scaleRules.test.ts` |
| LOW-1 (title unscaled, inverted hierarchy at 140% in 1.14.2) | **FIXED** — owner default (scale it) | `src/framework/kit/managedModal.ts` (title-text span) + `styles-source.css`; commit `0dbab59` |
| LOW-2 (r1 evidence overclaimed, harness-only) | **FIXED** — real-Obsidian captures produced this round | `sc230-r3-evidence-*.png` (6 files, below) |
| LOW-3 (no CHANGELOG entry; help text) | **FIXED** | `CHANGELOG.md`, `src/prefs/catalog.ts`, `docs/settings.md`; commit `0dbab59` |

## MEDIUM-1 / MEDIUM-2: the fix

`.dse-modal` is no longer ever a font-size-scaling arm — it is ONLY the print-anchor guard
(`.dse-modal:not([data-dse-print="on"]) :is(.dse-modal__body, .dse-modal__footer)`), exactly
the reviewer's prescribed shape (two separate rules, not one shared `:is(...)`). The bare
pre-SC-230 `[data-dse-element]:not([data-dse-print="on"])` rule is restored verbatim as its
own rule. This makes the compounding scenario structurally impossible (not just empirically
avoided): `.dse-modal`'s own font-size never carries the multiplier, so there is nothing left
to compound with the body/footer arm regardless of whether Obsidian's own `.modal-content`
reset is present.

**Real-browser runtime pin (MEDIUM-1's explicit ask — jsdom can't compute calc()/var()):**
`visual-harness/shoot.mjs`'s new `assertModalTextScaleAnchoring(page)`, wired into `npm run
shots` (runs on every non-narrowed invocation, same skip convention as the other
own-navigation gates). It builds a synthetic `.dse-modal`/`.dse-modal__body` pair twice — once
with an intervening node mimicking Obsidian's absolute `.modal-content` reset, once without —
and asserts the scaled/base ratio is exactly 1.4 in **both**. Confirmed passing:
`modal text-scale anchoring OK (.dse-modal__body scales exactly x1.4 at textScale 1.4, with
AND without an intervening .modal-content-style absolute font-size reset — no compounding)`
(`sc230-r3-shots.log:575`).

**DOM-level assertion (MEDIUM-2's explicit ask):** `test/dom/theme/scaleRules.test.ts`'s new
`describe('the print guard is anchored on .dse-modal itself …')` block uses real
`Element.matches()` (jsdom supports selector matching even though it can't resolve
calc()/var() values) to prove a print-stamped `.dse-modal[data-dse-print="on"]`'s body/
footer/title all stop matching their scale-rule selectors, while an unstamped `.dse-modal`'s
do match.

`fontSizeContract.test.ts`'s ALLOWLIST is keyed one selector per rule (confirmed by reading
its `collectFontSizes()` — the full comma-joined selector text of the enclosing rule is the
key), so the single r1-round entry is now three: the restored bare element-root key, the
modal body/footer key, and the modal title key.

## LOW-1: the title

`setDseTitle()` (`src/framework/kit/managedModal.ts`) now wraps the title text in a
`.dse-modal__title-text` span instead of writing it directly onto `titleEl` (Obsidian's own
`.modal-title`). `.modal-title` itself is untouched by any DSE rule — Obsidian's own,
version-dependent absolute size (`--font-ui-large` in the pinned 1.13.7 harness sheet,
`--font-ui-medium` in installed 1.14.2 — confirmed drift) still computes there. The span
inherits that value via plain `1em`, and a new anchored rule
(`.dse-modal:not([data-dse-print="on"]) .dse-modal__title-text { font-size: calc(1em *
var(--dse-text-scale)); }`) multiplies it — the same "re-apply below the reset via 1em" idiom
the body/footer rule uses, aimed at a real DSE-owned child instead of Obsidian's own chrome.
`aria-labelledby` is unaffected (accessible-name computation walks all descendant text of the
referenced element). At scale 1 this is definitionally a no-op (`calc(1em * 1) = 1em`) —
confirmed both by the jest pins and by the real-Obsidian byte-identical 100% comparison below.

Two new `managedModal.test.ts` cases pin the span's existence/singularity (no stray spans
accumulate across `setDseTitle()` calls).

## LOW-2: real-Obsidian evidence

The reviewer's probe (`sc230-r2-obsidian-probe.mjs`) was the starting point; its "did not
close modals between steps" bug is fixed properly this round: modal closing now uses a REAL
CDP-dispatched `Escape` keydown/keyup (Obsidian's own Modal-default close, per
`managedModal.ts`'s own doc comment) with a poll-until-gone wait, replacing both the r2
script's blind sleep AND a first attempt at DOM `.click()`-based closing, which proved
unreliable in this environment (plain `element.click()` silently no-op'd on real, visible,
enabled buttons under CDP for this Obsidian/Electron build — confirmed by direct
comparison; switching every click in the probe to a real `Input.dispatchMouseEvent` sequence,
and the modal-close step specifically to `Escape`, fixed it). One modal open per capture,
verified in the JSON (`sc230-r3-obsidian-probe.json`) and by eye in every PNG.

All 6 requested captures, real Obsidian 1.14.2, private Xvfb + private CDP port + scratch
vault/udd (deleted after), cropped via CDP `Page.captureScreenshot`'s own `clip` region to the
modal's measured bounding rect (title bar through Done button, close-X visible, nothing
clipped):

| File | What |
|---|---|
| `sc230-r3-evidence-base-140.png` | base (`c524fd2`) conditions modal, 140% |
| `sc230-r3-evidence-head-140.png` | head conditions modal, 140% (title scaled) |
| `sc230-r3-evidence-head-140-title-unscaled.png` | head, 140%, title arm disabled via a probe-time `styles.css` post-build edit (never committed) — shows the LOW-1 problem this round fixed |
| `sc230-r3-evidence-head-100.png` | head, 100% |
| `sc230-r3-evidence-base-100.png` | base, 100% (for the required byte/pixel comparison, not separately requested by name) |
| `sc230-r3-evidence-note-140.png` | the same conditions block rendered in a note, 140%, reference |

**Byte/pixel comparison, head-100 vs base-100:** identical SHA256
(`14f6f276fcf8625494c69a745c3c14960030d925b76a7baf5cc0e59ce337eefe`), identical dimensions
(480×211), pixel-for-pixel identical (`PIL` compare). 100% is unchanged from base, exactly as
required.

## Measured px (real Obsidian 1.14.2, `sc230-r3-obsidian-probe.json`)

| Variant | Scale | `.modal-content` reset | body | titleText | footer btn |
|---|---|---|---|---|---|
| base | 100% | present | 15 | — (no span on base) | 12.75 |
| base | 140% | present | **15 (bug: unchanged)** | — | 12.75 |
| head | 100% | present | 15 | 15 | 12.75 |
| head | 140% | present | **21 (×1.4)** | **21 (×1.4)** | 17.85 (×1.4) |
| head | 140% | **neutralized** (MEDIUM-1 scenario) | **21 (×1.4, NOT ×1.96)** | 21 (×1.4) | 17.85 |
| head | 100% | neutralized | 15 | 15 | 12.75 |
| head-title-unscaled | 100% | present | 15 | 15 | 12.75 |
| head-title-unscaled | 140% | present | 21 (×1.4) | **15 (unscaled, as intended by the probe override)** | 17.85 |

The MEDIUM-1 row is the direct answer to the brief's explicit ask: body text with
`.modal-content`'s reset neutralized is **21px = ×1.4**, not ×1.96 (would be 29.4px).
`dseModal` and `modalContent` measured 15 in every row (expected — `.dse-modal` itself is
never scaled after this round's fix; `.modal-content` is Obsidian's own absolute rule,
untouched either way since the neutralize override targets a live injected `<style>`, not the
plugin's own sheet).

## Gate numbers

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | **3990 passed / 1 skipped / 205 of 206 suites**, 3 snapshots, 0 failed |
| `npx jest` on bare `c524fd2` (base-at-tip, measured separately for the delta) | 3983 passed / 1 skipped / 205 of 206 suites |
| **Net delta, this branch's own tests** | **+7**, 0 failed, same suite count |
| `npm run shots` (after `rm -f main.js styles.css`) | **524 PNGs, 0 FAIL**; new `modal text-scale anchoring OK` line present |
| `check-freeze.sh` | **`freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0** (SC-328-updated baseline, 16 Skills lines) |
| `npm run parity` (run last) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s), exit 0** |

## Commits (branch `sc230-modal-text-size`, base `origin/develop` `c524fd2`)

This round's 3 new commits (2 earlier r1-round commits, `0cb7699`/`5ff036a`/`7546028`, carry
forward unchanged from before the rebase):

1. `3eda109` — `fix(typography): SC-230 r3 — stop the modal text-scale compounding
   (MEDIUM-1/-2)` — the two-rule split, the real-browser runtime pin, the DOM-level
   `Element.matches` pin, the ALLOWLIST split.
2. `0dbab59` — `fix(typography): SC-230 r3 — scale the modal title too (LOW-1), CHANGELOG +
   docs (LOW-3)` — the title-text span, its CSS rule, its tests, CHANGELOG entry, help text.

No co-author trailers, no AI attribution, no tags, no pushes, DSE `main` untouched. Tree
clean before and after (`git status --porcelain` empty at every checkpoint); the two
temporary detached-HEAD checkouts to `c524fd2` (once to build the `base` probe bundle, once
to measure the base-at-tip jest count) were each followed immediately by `git checkout
sc230-modal-text-size` and a rebuild, confirmed clean.

## Drive-by fixes

None.

## Follow-ups (for the ticket owner to triage, not fixed here)

- None new. r2's INFO-1..5 were already dispositioned by the owner (no action needed) and
  are unaffected by this round's changes.

## Artifacts (absolute paths)

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-fix-report.md`
- Gate logs:
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-tsc.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-lint.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-jest.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-shots.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-freeze.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-parity.log`
- Real-Obsidian probe script + raw measurements:
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-obsidian-probe.mjs`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-obsidian-probe.log`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-obsidian-probe.json`
- Evidence PNGs (real Obsidian 1.14.2, cropped to the whole dialog box):
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-base-100.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-base-140.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-head-100.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-head-140.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-head-140-title-unscaled.png`
  - `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc230-modal-text-size/sc230-r3-evidence-note-140.png`
- Worktree (edited repo): `/home/scott/code/steelCompendium/worktrees/sc230-modal-text-size/draw-steel-elements`
  (branch `sc230-modal-text-size`, HEAD `0dbab595f2293a07a3498a6cf2f2d6b2e7dc647d`, clean).

## Files touched this round (delta over the r1-round tip)

- `styles-source.css` — the two-rule MEDIUM-1/-2 split + the new title rule.
- `src/framework/kit/managedModal.ts` — `setDseTitle()` wraps text in `.dse-modal__title-text`.
- `src/prefs/catalog.ts` — "Text size" help text mentions dialogs.
- `docs/settings.md` — same wording update.
- `CHANGELOG.md` — new `[FIX]` bullet, SC-230.
- `test/dom/theme/scaleRules.test.ts` — rewritten for the three-rule shape + the new
  DOM-level print-guard-anchoring assertions.
- `test/dom/kit/managedModal.test.ts` — two new title-span tests.
- `test/unit/build/fontSizeContract.test.ts` — ALLOWLIST split into three keys.
- `visual-harness/shoot.mjs` — new `assertModalTextScaleAnchoring()` runtime pin, wired
  into the main sweep.
