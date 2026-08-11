# SC-143 fix report — ds-kit band headers rendered "super small"

Branch: `sc143-kit-headers` (worktree `/home/scott/code/steelCompendium/worktrees/sc143-kit-headers`)
Base: dse main `e141582`

## Symptom

Scott (owner): the kit card's three band headers — "Equipment", "Kit Bonuses", "Signature
Ability" — render "super small". Screenshot on SC-143 shows all three band heads dwarfed by
neighboring text (the tile values, the flavor text, even the "Martial Kit" kicker eyebrow).

## Root cause

`styles-source.css` (`.dse-card__band-head`, SC-100 commit `3f982aa`, the ONLY commit that
ever touched this rule — `git log -L` confirms no later regression from SC-112/SC-121/plan
22 touched it) sets:

```css
[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-card__band-head {
	...
	font-size: 0.8em;
	...
}
```

This is a **straight numeral transcription** of the site's `steel-kit.css`:

```css
.sc-kit__band-head {
	font-family: var(--md-small-header-font); font-variant: small-caps;
	text-transform: uppercase; letter-spacing: .07em; font-size: .8rem;
	...
}
```

The bug: the site's rem root is 20px (MkDocs Material's `html { font-size: 125%; }` = 125%
of the 16px browser default), so `.8rem` on the site computes to **16px** — but the plugin
author copied the bare numeral `.8` into `0.8em` on the plugin side without applying that
20px-vs-16px base ratio. `styles-source.css` documents this exact class of bug and the
correct fix method elsewhere in the same file (§A / line ~4777: *"font-size is the ONE
figure that is not a literal port... the site's 1.35rem is matched by RATIO... not by
transcribing the number"*) — this one rule (SC-100's original band-head) is the one place
that convention was skipped.

`.dse-card__band-head` is a direct child of `.dse-card__band` -> `.dse-card`, and `.dse-card`
carries no font-size override (only `line-height`/`padding`/color/background rules), so it
inherits the element root's ambient 16px (`[data-dse-element] { font-size: calc(1em *
var(--dse-text-scale)) }`, inert at the default scale of 1). `0.8em` against that 16px
ambient renders **12.8px** — noticeably smaller than every neighboring label, confirmed by
a live-browser `getComputedStyle` probe against the built harness (see below). The correct
plugin-side value, matching the site's actual rendered 16px against the plugin's own 16px
ambient, is **`1em`** — not a coincidence: 16px/16px = 1, same as the site's 16px/20px * (site
rem ratio 1.25) applied the other direction.

## Fix

One line, `styles-source.css` (`.dse-card__band-head`): `font-size: 0.8em;` -> `font-size: 1em;`
(plus a comment explaining the root cause for future readers). No other property needed a
change:

- `letter-spacing: 0.07em` is relative to the rule's own computed font-size, so it rescales
  automatically with the fix (0.896px -> 1.12px) — no separate edit.
- `margin-bottom`/`padding-bottom` (em-relative) rescale proportionally too, which is the
  intended behavior (they were authored to track the band-head's own font size).
- `font-weight` was never set here (inherits ambient 400/normal) — matches the site's
  `.sc-kit__band-head`, which also declares no font-weight. No bold was added.

## Sweep (shared machinery)

`.dse-card__band-head` is the SHARED CSS rule CardLayout's generic Steel band machinery
(`SteelCardComposition.bands()`, `CardLayout.ts` `renderSteel()`) emits for every band with a
`head`. Grepped `bands:`/`SteelBand` across `src/`: **`ds-kit` is currently the only consumer**
(`src/elements/display/layouts.ts`). Because the fix lives on the shared selector (not a
kit-scoped override), any future `bands()` adopter inherits the corrected size automatically —
no per-family fix needed today, and none will be needed later either.

## Measured before/after (live-browser `getComputedStyle`, Playwright against the built
visual harness, `element=kit&fixture=default&theme=steel`, both `bg=dark` and `bg=light` —
identical numbers in both schemes since neither theme touches font-size on this rule)

| | Before | After |
|---|---|---|
| `.dse-card__band-head` font-size | **12.8px** | **16px** |
| `.dse-card__band-head` letter-spacing | 0.896px | 1.12px |
| `.dse-card__band-head` font-weight | 400 (unchanged) | 400 (unchanged) |
| Comparison: `.dse-tiles__value` (kit stat number) | 16px / 700 | 16px / 700 (unchanged) |
| Comparison: nested ability card's `.dse-section__title` ("Effect") | 16px / 700 | 16px / 700 (unchanged) |
| Comparison: `.dse-head__eyebrow--line` ("Martial Kit" kicker) | 13.6px | 13.6px (unchanged) |

The band heads now match the nested ability card's own section-head font-size exactly (16px),
and are appropriately larger than the deliberately-smaller "Martial Kit" kicker eyebrow
(13.6px) and the tile labels (`.dse-tiles__label`, 10.88px, unchanged) — the header/label
type hierarchy now reads correctly instead of inverted.

## Regression coverage

`test/dom/theme/steelTypography.test.ts` — new `describe('kit band-head font-size
(SC-143)', ...)` block, same source-text-parsing pattern the rest of that suite uses (jsdom
never applies the real stylesheet — CSS is stubbed via `identity-obj-proxy` in
`jest.config.ts` — so every font-size/spacing assertion in this suite matches against a
comment-stripped copy of `styles-source.css`, not a rendered DOM). Two `it`s:

1. Pins `.dse-card__band-head`'s Steel-scoped `font-size` declaration to exactly `1em` and
   explicitly asserts the old `0.8em` is absent (regression guard).
2. Confirms `letter-spacing: 0.07em` is untouched.

The real computed-pixel proof (12.8px -> 16px, both schemes) is this report's live-browser
probe, cited in both new test comments as the "honest limit" callout the file's own mono-slot
test uses for the same jsdom limitation.

## Battery (branch `sc143-kit-headers`, worktree, post-fix)

| Gate | Result |
|---|---|
| `npm run tsc` | clean, exit 0 |
| `npm run lint` | clean, exit 0 |
| `npx jest` | **2542 passed, 1 skipped, 2543 total / 159 suites (1 skipped) / 3 snapshots** — baseline was 2540+1skip/159; +2 is exactly this fix's new test cases |
| `npm run shots` | **314 shots, 0 FAIL** |
| freeze (`check-freeze.sh`) | **188/188 legacy+print PNGs byte-identical, 0 mismatches** — no rebaseline needed. `.dse-card__band-head`'s Steel rule carries the standing `:not([data-dse-print="on"])` guard, so print never rendered this rule either before or after the fix; `kit--steel-print.png` was verified byte-identical to the pre-fix capture. |
| `npm run parity` | **0 gaps, 0 undeclared warnings, 16 declared deferrals, exit 0** — unchanged composition from main; `.dse-card__band-head`/`.sc-kit__band-head` is not a mapped parity pair, so this fix could not move any parity-compared rule |

No freeze rebaseline lines needed — 188/188 clean, confirmed by regenerating the entire
314-shot set on the fixed CSS and re-running `check-freeze.sh` a second time (still
188/188).

## Evidence

Before/after crops (Steel dark and Steel light, kit head through the top of Kit Bonuses),
generated from real harness captures (`element=kit&fixture=default&theme=steel`):
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/evidence/kit-dark-before-after.png`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/19b5ef2c-c696-441d-91ac-21746efdff4a/scratchpad/evidence/kit-light-before-after.png`

(Uploaded inline to the SC-143 Linear comment.)

## Commits

- `styles-source.css`: `.dse-card__band-head` font-size fix + root-cause comment.
- `test/dom/theme/steelTypography.test.ts`: SC-143 regression coverage.

Commit SHA: `94cfb17` — "fix(steel,kit): band-head font-size was a stray 0.8em, not 1em (SC-143)"
on branch `sc143-kit-headers`. No AI attribution trailers per workspace convention, pointer
left unstaged, no tags/deploys.
