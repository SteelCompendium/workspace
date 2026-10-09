# SC-127 round 2 — diagnose the dark-vault Print preview and design "the preview draws its own paper"

You are an `orchestration:reviewer` worker (design + survey round). Your final text goes to
the SC-127 ticket-owner (an agent), not a human: raw facts, no prose, plus the absolute path
of every artifact you produce. **Workers never call the tracker (Linear).**

## Context loading (read first, in this order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-decisions.md`
   — Scott's ruling (quoted verbatim there) and the rescope. Read it instead of any thread.
2. Round-1 report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r1-verify-report.md`
   and its PNGs under `.../sc127/r1/` — what real Obsidian shows in a dark vault with Print
   preview ON, and the light-vault control. Look at the deciding PNGs.
3. Worktree: `/home/scott/code/steelCompendium/worktrees/sc127-print-preview/draw-steel-elements`,
   branch `sc127-print-preview`, cut from dse `origin/develop` `e4bcd0f`. Verify `pwd`
   before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/`.
4. Skills: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (battery, devbox wrapping, "Freeze semantics" head, "Steel scoping rule"),
   `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md`, and
   `visual-harness/README.md` in the worktree.
5. Devbox: Node is NOT on PATH. Always
   `cd /home/scott/code/steelCompendium/worktrees/sc127-print-preview && devbox run -- bash -c 'cd draw-steel-elements && <cmd>'`.
   Devbox's sh wrapper eats `$?`; never pipe a gate into `tail`; redirect to files.

## The approved direction (from the ledger — do not re-litigate)

The print preview (`printPreview` pref → `data-dse-print="on"` on every element root, also
stamped during real print by `src/framework/printMedia.ts`) must draw its own light "paper"
regardless of Obsidian's theme, so on screen it previews what the PDF export produces. The
`*--steel-realprint.png` harness shot (real print media, `body.theme-light` forced, real
Obsidian sheet) is the target look. The harness twin `*--steel-print.png` STAYS captured
over the dark scheme (`shoot.mjs` COMBOS `{ theme:'steel', bg:'dark', print:true }`) — it
becomes the regression gate for this bug. Do NOT change the combo.

## Task A — diagnose (file:line, measured)

The print tier already defines paper tokens: `styles-source.css` ~line 14194
`[data-dse-element][data-dse-print="on"]…{ --dse-surface:#fff; --dse-page-bg:#fff;
--dse-fg:#000; --dse-heading:#000; … }` (padded to (0,4,0) specificity; see SC-170 notes
there and the `@media print` twin block just above it). Yet in a dark vault the preview shows
black labels/titles on a near-black card and, lower down, a white region under light text.
Find out exactly why, with `file:line` for each cause:

- Which rules leave the card/root/section background transparent (or `none`) under
  `data-dse-print="on"` so black ink lands on Obsidian's dark page? (Ink-saving
  `background: none` rules in the print tier are the first suspects — grep the print tier
  and `@media print` blocks.)
- Which text nodes get their `color` from Obsidian host tokens (`--text-normal`,
  `--text-muted`, `--text-faint`, `--h*-color`, `--link-color`) or from inheritance off
  `.markdown-preview-view` instead of `--dse-fg`/`--dse-heading`? Which get it from
  `--dse-fg` correctly?
- r1 settled the "white region" question two ways: (i) the harness twin's whole page
  going white below ~1140 CSS px is a HARNESS-ONLY artifact (real Obsidian's reading pane
  stays dark to scroll-bottom) — find what in `shoot.mjs`/the harness page paints it
  (sheet/page background sized to the viewport?) and say whether it is worth fixing so the
  twin is honest, but do not spend more than a few minutes on it; (ii) the signature-
  ability box (`.dse-feature` with the "Signature Ability" badge) IS painted white in real
  Obsidian, via a background-image-painted box, while its keywords/body text stay pale grey
  (`rgb(218,218,218)`, 1.40:1). Find which rule paints that box and why its text reads the
  host's `--text-normal` rather than `--dse-fg`.
- Native controls under the preview (inputs, selects, buttons, checkboxes that use
  Obsidian's own tokens via the host copy — see `OBSIDIAN_HOST_BUTTON_CSS` in `shoot.mjs`
  and `styles-source.css`'s host-rules comment): which stay dark-themed on the paper?

Use the browser harness for measurement: `npm run shots -- --element=<id>` narrows to one
capture id (read `shoot.mjs`'s arg parsing; the twin's `#mount` subtree snapshot for
`assertPrintTwinDelta` already records computed `color`/`backgroundColor` per node — reuse
it if handy). Elements to measure: `statblock-charline-two`, `feature`, `featureblock`,
`hero`, `initiative`, `montage`, `negotiation`, `encounter`.

## Task B — design, and RENDER the options

Propose the mechanism. Evaluate at least these shapes and render each (dark vault AND light
vault, via the browser harness — the twin combo for dark is already there; for light you
may temporarily add a `{theme:'steel', bg:'light', print:true}` combo in a scratch copy of
the run, NOT committed) so Scott can pick from pictures:

- **A. Paper on the root, edge to edge.** Under `[data-dse-print="on"]` the element root
  paints an opaque `background: var(--dse-page-bg)` (#fff), sets `color: var(--dse-fg)`
  (#000) so every descendant inherits black, and re-points the CONSUMED Obsidian host tokens
  (`--text-normal`, `--text-muted`, `--text-faint`, `--text-accent`, `--link-color`,
  `--background-primary`, `--background-secondary`, `--background-modifier-form-field`,
  `--background-modifier-border`, `--background-modifier-hover`, `--interactive-normal`,
  `--interactive-hover`, `--interactive-accent`, `--checkbox-*`, whichever the plugin's DOM
  actually reads — measure, don't guess) to their light-theme values, scoped to the root, so
  native controls go light too. No frame.
- **B. A + a visible sheet.** Same as A plus a thin neutral hairline (`#ccc`-ish) and a
  small margin/padding so the paper reads as a page sitting on the dark desk.
- **C. Minimal.** Paper + black ink on the root only; native controls stay host-themed
  (dark controls on white paper). Include it so the trade-off is visible even if you
  recommend against it.

For each option state: what real print (`@media print`, which also carries
`data-dse-print="on"` via `printMedia.ts`) does with the rule — it must render identically
on paper (white on white is fine; a frame is NOT fine on paper unless hidden under
`@media print`); whether any `*--steel-realprint.png` bytes move (they must not — run the
realprint combo before/after and `sha256sum` the files); the specificity plan against the
(0,4,0) padding convention and `test/dom/framework/theme-print.test.ts`; the jest guards
that will need updating (`token-coverage`, `PRINT_INVARIANT`, `printTwinDeltaAllowedSet`,
`theme-print`); and what `assertPrintTwinDelta` in `shoot.mjs` can now tighten (the twin
and realprint should converge — measure the residual computed-style diff per option with
the existing delta machinery and report which of `color`/`fontFamily`/
`webkitPrintColorAdjust`/`backgroundImage` still differ and why).

Also check per-block overrides: `printPreview` has `attr: 'print'` so `prefs: { printPreview:
on }` inside one block is presumably allowed (`src/framework/prefOverrides.ts`) — the
paper is per element root, which is the right unit; confirm nothing in the design assumes a
whole-note toggle.

**Recommend one option** with reasoning. Anything that is a taste call (frame or no frame,
margin size, hairline vs shadow) goes to Scott — name it as a taste call and render it.

## Deliverables

- Report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r2-design-report.md`,
  opening with a ≤10-line executive summary: root causes (one line each with file:line),
  recommended option, realprint-moved count (must be 0), predicted twin-lines-moved count,
  taste calls for Scott, PNG list.
- Rendered PNGs under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/r2/`
  named `sc127-r2-<option>-<element>-<dark|light>.png`; plus a `before` for each
  element (the current dark twin). Crop to the element; Scott reviews from these images.
  Name colours in prose in the report (Scott is colourblind).
- One patch file per option: `sc127-r2-option-<A|B|C>.patch` (`git diff` of the worktree
  tree for that option) in the ledger dir. **Do not commit.** Leave the worktree branch
  CLEAN at the end (`git status` empty apart from ignored build output); the implementer in
  round 3 applies the chosen patch.

## Bounds

- Full battery NOT required this round; `npm run shots` on the affected element ids and
  the realprint hash check are. Do not touch `.superpowers/sdd/freeze-baseline.sha256` or
  `check-freeze.sh`.
- No Obsidian camera this round (r1 did that). Browser harness only.
- Time-box each option's prototype; three rough renders beat one polished one.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output, or write to
  a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream
  watchdog kills silent agents. Run `npm run shots` in the FOREGROUND with output
  redirected; never background it and wait for a notification.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message
  anyway, its FIRST WORD must be `SC-127:`.
- `rm -f main.js styles.css` in the plugin root before any `npx jest` you run (stale
  bundle shadows `main.ts`).
- Never `rm -rf` anything under `.superpowers/`; only write in `.superpowers/sdd/sc127/`.

## Return contract

Final text: recommended option; root causes (file:line, one line each); realprint moved
(number); twin lines predicted to move (number); taste calls; absolute paths of the report,
patches and PNGs. No prose beyond that.
