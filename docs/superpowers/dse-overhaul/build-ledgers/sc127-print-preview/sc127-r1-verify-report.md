# SC-127 round 1 — verify report

**VERDICT: bug CONFIRMED in real Obsidian, dark theme.** Severe (WCAG contrast ~1.2–1.4:1
vs. the 4.5:1 minimum) on card titles, characteristic labels, and section labels
throughout every element tested. **White-below-the-fold: NOT reproduced in real
Obsidian** — the reading pane stays Obsidian's own dark chrome (transparent, inheriting
`rgb(28,28,28)`) all the way to the bottom of a scrolled note; that artifact is
harness-only (the browser camera's fixed-height review page/sheet background).
**Light theme (control): clean** — all four sampled pairs pass WCAG AAA (12.6:1–21:1).
Contrast pairs below; 18 PNGs in
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r1/`. Real PDF export
via CDP `Page.printToPDF` was attempted and is **not available** against Obsidian's
Electron page target (`'Page.printToPDF' wasn't found`) — abandoned per the brief's
15-minute allowance; the existing `--steel-realprint` browser-harness shot stands in.
Worktree left clean, no commits, no source edits, Xvfb/Obsidian processes killed.

## Setup

- Worktree: `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
  branch `sc127-print-preview`, tip `e4bcd0f` (unchanged; `git status` clean throughout and
  at hand-back).
- `npm ci` (via the worktree superproject's devbox, which resolves Node v24.4.1 — the
  repo's own `devbox.json` alone falls back to nvm's Node v20.11.1, which has no global
  `WebSocket` and cannot run the camera's raw-CDP transport; use
  `cd .../worktrees/sc127-print-preview && devbox run -- bash -c 'cd .../draw-steel-elements && …'`
  as the brief says, not `devbox run` from inside `draw-steel-elements` itself).
- `npm run build-no-check` — fresh `main.js`/`styles.css` (2026-09-23 21:26).
- Private Xvfb on `:87` (repo's own `.devbox/nix/profile/default/bin/Xvfb`, started and
  killed by this session only), camera run with `DSE_CAMERA_DISPLAY=:87
  DSE_CAMERA_PORT=9287`, `DSE_CAMERA_TMP` under this session's scratch dir. `:1`/`9223`
  never touched; confirmed via `ps` before and after that only my own Xvfb/Obsidian PIDs
  existed and that they exited cleanly.
- **How the captures were produced**: `visual-harness/obsidian-camera.mjs`'s `--docs`
  mode is the only path with the pref-set plumbing (`entry.pref` →
  `frameworkV2.services.prefs.set('printPreview', 'on'/'off')`, real Obsidian note, real
  `.dse-head`/`.dse-sb`/etc. DOM). I added **temporary, uncommitted** entries to
  `docs-manifest.mjs` (one per requested element, `pref: ['printPreview','on']`, plus a
  `statblock` preview-off pair and a full-leaf-framed statblock pair) and three small
  **temporary, uncommitted** additions to `obsidian-camera.mjs`: (a) `await
  setChromeBg(args.bg ?? 'dark')` in docs mode (was hardcoded to `'dark'`) so `--bg=light`
  drives a real light-chrome control run; (b) an `--onlyPrefix=` filter so one Obsidian
  spawn can sweep every `sc127-r1-*` entry instead of one spawn per shot; (c) a
  `entry.measure` hook that runs `getComputedStyle`/contrast sampling on the statblock
  capture, and an `entry.kind === 'pdf'` branch that tried `Page.printToPDF` (failed, see
  above). **Both files were `git checkout`-reverted before this report was written** —
  `git status` in the worktree is clean, nothing was committed.

## Contrast measurements (statblock, dark theme, Print preview ON)

Computed live via `getComputedStyle` inside the real Obsidian page (not eyeballed), WCAG
relative-luminance contrast ratio (4.5:1 minimum for normal text):

| Element | Text color | Effective background | Ratio | Verdict |
|---|---|---|---|---|
| Card title ("Human Bandit Chief") | `rgb(0,0,0)` | `rgb(28,28,28)` (Obsidian's `view-content`) | **1.23:1** | FAIL — near-invisible |
| Characteristic label ("Might") | `rgb(51,51,51)` | `rgb(28,28,28)` | **1.35:1** | FAIL — near-invisible |
| Lower-card label ("Weakness") | `rgb(0,0,0)` | `rgb(28,28,28)` | **1.23:1** | FAIL — near-invisible |
| Body text ("8 damage; pull 1") | `rgb(218,218,218)` | see note below | **1.40:1 (corrected)** | FAIL — near-invisible |

**Note on the body-text row**: my automated "walk up `parentElement` until
`background-color` has alpha > 0" probe reported this text's ancestor background as
`rgb(28,28,28)` (12.19:1, a pass) — that's a tooling gap, not the real answer. The probe
only reads the CSS `background-color` property; the "Signature Ability" callout box this
text actually sits inside paints white through a different mechanism (background-image or
similar) the probe doesn't see. **Visually (both screenshots, see below) that box's
background is opaque white**, so I recomputed the ratio against `rgb(255,255,255)`:
**1.40:1 — also a fail**, just for the mirror-image reason (light "dark-theme" ink
orphaned on a card that happened to render its own white paper). This is a real,
independently confirmed second failure mode, not a measurement artifact once corrected.

Same probe, **light theme (control), Print preview ON** — all pass, no correction needed
(the whole page is already white, so the probe's blind spot never matters):

| Element | Text color | Effective background | Ratio | Verdict |
|---|---|---|---|---|
| Card title | `rgb(0,0,0)` | `rgb(255,255,255)` | **21.00:1** | PASS |
| Characteristic label | `rgb(51,51,51)` | `rgb(255,255,255)` | **12.63:1** | PASS |
| Body text | `rgb(34,34,34)` | `rgb(255,255,255)` | **15.91:1** | PASS |
| Lower-card label | `rgb(0,0,0)` | `rgb(255,255,255)` | **21.00:1** | PASS |

## White-below-the-fold: NOT reproduced in real Obsidian

The dispatcher's hypothesis (harness twin) was that below ~1140 CSS px the background
turns white while text stays light. In real Obsidian I scrolled the note's actual
scrollable pane (`markdown-preview-sizer`, scrollHeight 2660 vs. clientHeight 1021 — the
card genuinely overflows one screenful) to its bottom and sampled the viewport midpoint:
the element under the point is the preview sizer itself, `background-color:
rgba(0,0,0,0)` — **transparent, inheriting Obsidian's own dark `view-content` background**
in the dark run and white in the light run. No boundary, no color change, in either theme.
`sc127-r1-statblock-dark-preview-on-leaf.png` (full reading-pane, chrome included) shows
the same: uniformly dark everywhere except the one ability card that paints its own white
box. **Conclusion: the "white below the fold" behavior is a browser-harness capture
artifact** (a fixed-viewport review page's own sheet/background, cut off at the
viewport), **not a real-Obsidian bug** — the real reading pane scrolls normally and never
shows a stray white region.

## What the images show, in plain words

- **`sc127-r1-statblock-dark-preview-off.png`** (control, no bug): the plugin's normal
  Steel dark rendering. Crisp, fully readable — white/light-grey text throughout on
  charcoal card panels with subtle borders. No problem exists without the pref.
- **`sc127-r1-statblock-dark-preview-on.png`** (the bug, full card): background goes
  flat near-black (Obsidian's own dark chrome, not a "paper" fill). The subtitle "Human,
  Humanoid", the title "Human Bandit Chief", the Size/Speed/Stamina/Stability/Free-Strike
  labels, the "Immunity:"/"Weakness:"/"Movement:" labels, and the Might/Agility/Reason/
  Intuition/Presence labels are all rendered in black or dark charcoal ink — essentially
  invisible against the near-black card; you can only make out ghost letterforms. The big
  bold numbers (1M, 5, 120, 2, 5 and the +2/+3/etc. characteristic values) stay bright
  white and are fine. Below that, one ability — "Whip and Magic Longsword", tagged
  "Signature Ability" — sits in its own bright white box; its bold title and "Power
  Roll + 2" heading are readable black-on-white, but its lighter secondary lines ("Magic,
  Melee, Strike, Weapon", "Main action", the three damage-tier outcomes) are a pale grey
  that's hard to read against that white box — the same underlying mistake in the
  opposite direction. Every other ability below that (Kneel Peasant!, Bloodstones, End
  Effect, Supernatural Insight, the three Villain Actions) sits on the plain dark card and
  reads fine — white/light-grey body text on near-black, correctly high contrast.
- **`sc127-r1-statblock-light-preview-on.png`** (control): identical layout, but the
  entire page is off-white paper and every ink color (black bold titles, medium-grey
  meta lines, near-black body copy) reads cleanly — this is what the print layout is
  clearly designed to look like, and it is correct here because the surrounding
  background actually is light.
- **`sc127-r1-statblock-dark-preview-on-leaf.png`** (full reading pane, dark, chrome
  visible): confirms the whole note view — including the empty area past the card — stays
  one uniform charcoal-black, no white patch anywhere except the intentional callout box.
- **`sc127-r1-negotiation-dark-preview-on.png`**: the mirror-image failure, whole-card.
  This element's print mode DOES paint an opaque near-white card, but most of its own text
  — "Patience", "Interest", the progress-bar track, "Appeals to Motivation", "Mentions
  Pitfall", every checkbox label, "Motivations", "Pitfalls" and their descriptions — is a
  very pale, washed-out grey (clearly the ink color meant for Obsidian's dark chrome,
  unconverted) and is barely legible against that near-white card. Only a few emphasized
  interest-tier lines ("Remembers the smell of strawberries", "Doesn't remember the taste
  of strawberries", "Thinks you're after the ring; becomes hostile") render true black and
  stay readable.
- **`sc127-r1-feature-dark-preview-on.png`**: same pattern as statblock — bold labels
  ("Trigger:", "Effect:", "Power Roll + Might", "Special (2 Malice):", "Aftermath:") render
  dark/black on the near-black card and are hard to read; the sentence text after each
  colon is white and reads fine; the nested "Inner Feature" callout is its own white box
  whose bold heading is readable but whose lighter "Inner effect text." line is pale grey
  on white — nearly invisible, same as statblock's Signature Ability box.
- **`sc127-r1-hero-dark-preview-on.png`**: the worst of the set — here even the big bold
  characteristic values (+2/+2/-1/+0/+1) and the character name "Torin Stonefist" are dark
  ink on the near-black card and hard to read, alongside the usual faint subtitle/labels;
  section headers ("Characteristics", "Stamina", "Heroic Resource", …) and most body prose
  stay white and legible. The "Bleeding" condition pill is its own near-white chip whose
  label text is pale and low-contrast against it.
- **`sc127-r1-montage-dark-preview-on.png`**: the least affected — only the top eyebrow
  ("Montage Test") and title ("Cross the Ashfall Wastes") render dark-on-dark and are hard
  to read; the dense test-tier table, round tracker and "Running a montage test" reference
  copy below are all white-on-dark and fully legible.
- `sc127-r1-featureblock-*`/`sc127-r1-initiative-*` (both themes) captured for completeness,
  not individually described here — same title/label-vs-body-text split as feature/statblock.

## Real PDF export — attempted, not available

Tried `Page.printToPDF` over the same raw-CDP connection the camera already uses for
screenshots (`Page.captureScreenshot` works fine on this target). It fails immediately:
`Error: Page.printToPDF: 'Page.printToPDF' wasn't found` — Obsidian's Electron renderer
target doesn't expose that CDP method (consistent with the file's own header note that
Electron doesn't implement several Browser/Page-domain commands Playwright/CDP tooling
expects). Did not pursue Electron's native File → Export to PDF menu automation as a
replacement within the ~15-minute allowance the brief gives this item. **No PDF artifact
produced.** The existing `visual-harness/shots/*--steel-realprint.png` browser-harness
capture (real `@media print` emulation, `SC-170`) is the acceptable stand-in the brief
names, and is not reproduced here since it's not new evidence.

## Artifacts

Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r1-verify-report.md`

PNGs, all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r1/`:

- `sc127-r1-statblock-dark-preview-on.png`
- `sc127-r1-statblock-dark-preview-off.png`
- `sc127-r1-statblock-dark-preview-on-leaf.png`
- `sc127-r1-statblock-light-preview-on.png`
- `sc127-r1-statblock-light-preview-off.png`
- `sc127-r1-statblock-light-preview-on-leaf.png`
- `sc127-r1-feature-dark-preview-on.png` / `sc127-r1-feature-light-preview-on.png`
- `sc127-r1-featureblock-dark-preview-on.png` / `sc127-r1-featureblock-light-preview-on.png`
- `sc127-r1-hero-dark-preview-on.png` / `sc127-r1-hero-light-preview-on.png`
- `sc127-r1-initiative-dark-preview-on.png` / `sc127-r1-initiative-light-preview-on.png`
- `sc127-r1-montage-dark-preview-on.png` / `sc127-r1-montage-light-preview-on.png`
- `sc127-r1-negotiation-dark-preview-on.png` / `sc127-r1-negotiation-light-preview-on.png`

Raw camera logs (this session's scratch dir, not durable — quoted in full above where it
matters): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/3a3267bf-ca7b-4859-a161-38ee3f6c31da/scratchpad/sc127/{run-dark-full.log,run-light-full.log,run-pdf.log,measure-dark.txt,measure-light.txt}`.

## Bounds compliance

No edits to `src/` or `styles-source.css`. Full battery not run. Freeze baseline/script
untouched. Both temporary harness-script edits (`visual-harness/obsidian-camera.mjs`,
`visual-harness/docs-manifest.mjs`) were `git checkout`-reverted before finishing;
`git status` in the worktree reads clean. No commits made. Xvfb (`:87`) and every spawned
Obsidian instance (port `9287`) were started by this session and are confirmed stopped;
`:1`/`9223` were never referenced.
