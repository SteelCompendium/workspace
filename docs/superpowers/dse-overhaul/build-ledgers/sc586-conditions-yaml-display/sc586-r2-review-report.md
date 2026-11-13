# SC-586 r2 independent review report

Executive summary
- Verdict: LAND. No HIGH or MEDIUM findings. Both ticket items are fixed in real Obsidian 1.14.4 (Electron 43.7.7 / Chrome 150), not only in jsdom.
- Reviewed dse `3a5986d3..57618b62` (5 commits) and superproject `25f315ea`. Tree left as found: dse clean at `57618b62`, superproject `25f315ea` with its pre-existing ` M draw-steel-elements`. main.js was rebuilt from HEAD after the revert proof.
- Gates, all re-measured: tsc+lint exit 0; jest 11808/1 skipped with the shots cache (= 11795 + 13); lifecycle 21+16+9+4+7+4+1 = 62/62; e2e `333/336 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`; shots 592, 978, 240, clip 147; freeze 280/280; parity 0/0/24.
- Revert proof (ConditionsModal.ts set back to `3a5986d3`): jest 10 failed / 335 passed of 345; e2e COND-H01 and COND-H02 0/2 ok. Matches r1.
- Real-Obsidian probe: 30 colour spellings and 9 icon spellings run through the real modal. Every ticket and D2/D3 case is right, opening and pressing Escape writes nothing, no probe span is left behind, and picks don't affect the other condition.
- F1 (oklch/lab/lch/color()/color-mix): the row DOES draw a visible colour and the pipette reads selected, but the chooser opens at white. A canvas fallback on the computed value fixes all five forms (pixels measured). Recommendation: FOLD (about 6 lines, cannot regress); see LOW-2. If the owner drops it, nothing else blocks.
- Also: the helper's doc comment and the ledger's F1 text are wrong about `currentcolor`/`inherit` in Electron (they seed `#dadada`, not white): LOW-1. The `"skull "` jest test title promises "once" but does not assert it: LOW-3.

## Findings

### LOW-1: `conditionColorHex` doc comment (and ledger F1 / r1 report) misdescribe Electron behaviour
- `draw-steel-elements/src/elements/conditionColorHex.ts:12-14`: "it can never disagree with `isConditionColor`" and "`undefined` for ... `inherit`, which stays itself".
- Measured in Electron, with a probe on `<body>`: `currentColor`/`currentcolor`/`inherit`/`unset`/`revert` compute to the body colour `rgb(218, 218, 218)`, so they seed `#dadada`. They do not return undefined or white. `initial` gives `#ffffff`, `var(--text-accent)` gives `#a68af9` (matches the row), `Canvas` gives `#121212`, and `light-dark(red, blue)` gives `#0000ff`. "Stays itself" is jsdom-only behaviour. Separately, `CSS.supports` accepts `oklch()`/`lab()`/`lch()`/`color()`/`color-mix()`, but the helper returns undefined for them, so it does disagree with `isConditionColor`.
- Failure scenario: a maintainer trusts the comment. They then reason wrongly about the keyword cases, or about why oklch seeds white. The ledger F1 line repeats the same wrong claim for `currentcolor`/`inherit`.
- Fix: reword the comment. Suggested: "`undefined` for an unparseable string or a colour whose computed value is not `rgb()`/`rgba()` (CSS Color 4 spaces: `oklch()`, `lab()`, `color()`, `color-mix()`); keywords such as `currentcolor`/`inherit` resolve against `<body>`, not the row". Also correct the ledger's F1 wording. No behaviour change is needed for the keywords: `#dadada` is close to what the row draws (`rgba(220, 226, 230, 0.88)`) and better than white.

### LOW-2 (F1): CSS Color 4 spellings draw a visible colour but the chooser opens at white. Recommendation: FOLD
- Measured in the real modal, from fixture notes:

  | `color:` | row glyph computed | pipette | chooser |
  |---|---|---|---|
  | `oklch(0.6 0.1 180)` | `oklch(0.6 0.1 180)` (visible green-teal) | selected, filled | `#ffffff` |
  | `oklch(70% 0.25 30)` | `oklch(0.7 0.25 30)` | selected | `#ffffff` |
  | `color(display-p3 0 0.5 0.5)` | same | selected | `#ffffff` |
  | `lab(50% 40 59.5)` | `lab(50 40 59.5)` | selected | `#ffffff` |
  | `color-mix(in srgb, red, blue)` | `color(srgb 0.5 0 0.5)` | selected | `#ffffff` |

  This is the ticket's item-1 symptom for these spellings. D2 says "Any CSS colour the row renders", and the owner's DROP condition was "unless the row renders them as a visible colour". The row does render them, so that condition is met. The open question is whether Scott writes these by hand. Modern palette tools emit `oklch()`, so it is plausible but rare.
- Canvas readback, measured in the same Electron: `fillStyle = <value>` on a 1x1 canvas, then `getImageData` gives:
  - `oklch(0.6 0.1 180)`: `[35,147,130]`
  - `oklch(70% 0.25 30)`: `[255,65,45]`
  - `color(display-p3 0 0.5 0.5)`: `[0,130,129]`
  - `color(display-p3 1 0 0)`: `[255,0,0]`
  - `lab(50% 40 59.5)`: `[191,87,0]`
  - `lch(50% 60 180)`: `[0,143,117]`
  - `color-mix(in srgb, red, blue)`: `[128,0,128]`

  Canvas fails for keywords and `var()` (it gives the prior fillStyle or black). Use it only as the fallback when the computed value is not rgb, so feed it the computed string, never the raw note text. The computed path already resolves keywords and `var()`. Together the two paths cover every colour `isConditionColor` accepts.
- Prescribed fold (in `conditionColorHex.ts`, replacing `if (!rgb) return undefined;`):
  ```ts
  const computed = doc.defaultView.getComputedStyle(probe).color;
  let rgb: number[] | undefined = /^rgba?\(.../.exec(computed)?.slice(1, 4).map(Number);
  if (!rgb) { // CSS Color 4 spaces keep their own syntax when computed: paint it and read the sRGB pixel back
      const canvas = doc.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return undefined; // jsdom: no canvas
      ctx.fillStyle = computed; ctx.fillRect(0, 0, 1, 1);
      rgb = Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
  }
  ```
  Cost: one jest test with a `getContext` stub (the pattern the deleted marker used) and one e2e assertion. For example, add a third hero condition `color: "oklch(0.6 0.1 180)"` to `hand-written.md` and expect `#239382` under the pinned 1.14.4. It cannot regress, because the branch only runs where the helper returns undefined today. jsdom never reaches it for the current tests: cssstyle computes names/rgb/hsl to `rgb()`. Update the doc comment (LOW-1) in the same commit.
- If DROP: file the above as a Backlog ticket. Nothing else depends on it.

### LOW-3: the `"skull "` jest test does not assert the "once" its title promises
- `draw-steel-elements/test/dom/views/conditions-modal-matrix.test.ts:1125`. The title says "the skull choice is the pressed one, once", but the body only asserts `pressedIn(...) === ['Icon: skull']`.
- Failure scenario: a half-fix updates the pressed comparison but leaves the keep-visible rule on `entry.icon`. The grid then gains a duplicate, unpressed `Icon: skull ` chip, and this test still passes. The blank-icon tests catch the keep-visible half for whitespace-only icons, but nothing catches it for a non-blank icon with stray spaces.
- Fix: add `expect(Array.from(o.container.querySelectorAll('[data-dse-control="cond.icon"]')).filter((b) => b.getAttribute('aria-label')?.trim() === 'Icon: skull')).toHaveLength(1);`.

### INFO
- INFO-1: `CHANGELOG.md:22` (superproject `25f315ea`) lists `#AABBCC` among the spellings that now open correctly. Upper-case 6-digit hex already worked on base: the regex was `/i` and the input lowercases. The r1 jest "upper-case hex" case passes on base, by design. Harmless; optionally drop `#AABBCC` from the bullet.
- INFO-2: `transparent` seeds `#000000` (alpha dropped per D2). The row draws an invisible glyph and the pipette reads selected, which is the SC-361 rule. `#00808080` and `rgb(0 128 128 / 50%)` seed `#008080`. Matches D2.
- INFO-3: icon spellings measured in the real modal. `""`, `"  "` and `"\t"` press only "Use default". `"skull "` and `" skull"` press only `Icon: skull`, with no duplicate chip in Electron. `"anchor"` (not suggested) is shown first and pressed. Searching `sku` shows the pressed state where it matches. Clearing the search with real Backspace restores the list and the pressed state. Pre-existing, out of scope and consistent with the row: `"Skull"` and `"not-an-icon"` draw no glyph in the row, and the picker presses a matching blank chip. `"lucide-skull"` draws skull and presses an `Icon: lucide-skull` chip (with the skull glyph), not the `skull` choice.
- INFO-4: clicking the already-pressed "Use default" on `icon: ""` or `icon: "  "` writes once and removes the blank `icon:` line. It adds no junk. That is a user pick, so D3 is satisfied.
- INFO-5: the Red preset spelled `rgb(192,57,43)` marks the pipette, not Red, because SC-361 compares strings. This is pre-existing. The chooser now seeds `#c0392b` correctly. `#C0392B` presses Red and seeds `#c0392b`.
- Integrity (real Obsidian): picking a colour through the custom input (`#123456`) made 1 write. It changed only `dazed.color`; ABOVE/BELOW, the fence and `hexed: icon: ""` were untouched. A following icon pick on Hexed made 1 write and changed only `hexed.icon`. Opening the editor and closing with Escape wrote nothing for all 30 colour and 9 icon spellings, and the note bytes were unchanged. The aria-label and `data-selected` follow the SC-361 rule as before; that code is unchanged.
- Test titles: no bracketed ticket id. `[COND-H01]`/`[COND-H02]` are scenario ids and unique in `e2e/specs`. The two former `test.failing` markers are plain tests now. 5 of the 15 new/changed jest tests pass on base by design as regression guards: upper-case hex, dismiss-no-write, unparseable, no colour, and the pick/Use-default round trip. None is vacuous.

## Gates (measured, dse worktree at `57618b62`)

| Gate | Result | Log |
|---|---|---|
| tsc | exit 0, no diagnostics | `tsc.log` |
| lint | exit 0 (only the .eslintignore deprecation notice) | `lint.log` |
| jest (shots cache present) | `Test Suites: 1 skipped, 275 passed`; `Tests: 1 skipped, 11808 passed, 11809 total` | `jest.log` |
| lifecycle p1-p7 | 21/21, 16/16, 9/9, 4/4, 7/7 (G-S91 no flake), 4/4 (appearance.json clean), 1/1 = 62/62 | `lc1.log` … `lc7.log` |
| e2e | `OBSIDIAN-E2E done: 333/336 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs` (known bugs SC-257, SC-384, SC-355) | `e2e.log` |
| shots | 592 PNGs; button host-leak 163 kinds = 978; modal host-leak 40 kinds = 240; capture clip 147 | `shots.log` |
| freeze | `freeze OK (280/280 ...)` | `freeze.log` |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).` | `parity.log` |
| revert jest | `Tests: 10 failed, 335 passed, 345 total` | `jest-revert.log` |
| revert e2e | `OBSIDIAN-E2E done: 0/2 ok, 2 failed` | `e2e-revert.log` |
| probe (real Obsidian) | ZZPROBE-11..14 4/4 ok | `probe2.log`, `probe-out2/*.json` |

All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc586-r2-review/`. `probe1.log` and `probe-out/` come from a first probe that was discarded: `openNote` resets fixtures, which undid its `externalEdit`s. Only its page-side resolution table, `probe-out/page-resolution.json`, is valid. That table compares the computed-style value with the canvas pixel for 37 spellings.
