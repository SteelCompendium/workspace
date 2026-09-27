# SC-317 implementer brief — plugin-drawn external-link icon

## 0. Context loading (read first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/sc317-decisions.md`
  (read it in full — it holds the ticket scope and the owner decisions D1–D5 you implement).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon`. The plugin is
  `draw-steel-elements/` inside it, on branch `sc317-extlink-icon`. **Run `pwd` before every
  write and confirm you are under `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/`.**
  Never edit anything under `/home/scott/code/steelCompendium/workspace/` except your report
  files in the ledger dir.
- Workspace-level files (DESIGN.md, CHANGELOG.md) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/DESIGN.md` and
  `.../worktrees/sc317-extlink-icon/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.
- First: `git -C .../draw-steel-elements fetch origin && git -C .../draw-steel-elements rebase origin/develop`.
  Expected base: `origin/develop` = `619c4bd`. DSE tracks `develop`; never touch `main`, never
  create a tag or release.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery,
  devbox shapes, exit-code footgun, stale-main.js protocol, freeze semantics) and
  `draw-steel-elements/AGENTS.md` / `CLAUDE.md` if present.
- **You never call the tracker (Linear)** — not to read, not to post.

## 1. The task

Scott (2026-09-14, verbatim): "I would like the external link icon".

Plugin links that leave the vault must show an external-link icon, as a designed part of the
plugin's own link styling. Background (ticket description): SC-202 round 4 re-grounded
`a.external-link` inside plugin cards so Obsidian's own arrow (a `background-image` on the
anchor + `padding-inline-end: 0.9em`) no longer leaks in. That re-grounding STAYS
(`styles-source.css`, "SC-202 r4 — HEADING + EMPHASIS + LINK" block, GROUP 7 at ~line 17005);
the harness must keep matching the vault.

Implement per ledger D1–D5:

1. **Glyph** (D1): Obsidian's own external-link arrow shape. Extract the real SVG from
   Obsidian's app.css (the `.external-link` `background-image` url — `~/.config/obsidian/obsidian-*.asar`,
   newest version; `shoot.mjs` / `obsidian-host-pin.mjs` already know how to read it) rather
   than redrawing it. Cite the source version in a comment.
2. **Colour** (D2): draw it on a pseudo-element (`::after`) with `mask-image` (+
   `-webkit-mask-image`) and `background-color: currentColor`, so it follows the anchor's own
   teal-cyan in steel-dark and steel-light, and its hover colour. No `filter`.
3. **Spacing** (D3): a small gap, glyph ~0.75–0.85em, aligned optically with the text. The
   pseudo-element must not be underlined, must not be selectable text, and must not wrap
   onto a line by itself if avoidable (e.g. keep the pseudo inline-block with no leading
   whitespace; report what you chose and whether orphan-wrap can still happen).
4. **Screen-only** (D4): add the icon in the existing `:not([data-dse-print="on"])` scope, as a
   companion to GROUP 7 (a new sub-rule next to it, with a comment in the block's own style
   explaining it is the plugin's designed icon, not a re-grounding). Print keeps no icon —
   Obsidian's own sheet strips it in print. Consequence: frozen print bytes should NOT move.
   If any frozen byte moves, stop and diagnose; do not produce a rebaseline for an
   unexplained move.
5. **Scope survey**: find every anchor the plugin renders that leaves the vault —
   `rewriteSccAnchors` (`src/refs/rewriteSccAnchors.ts` emits `external-link ds-scc-web`),
   MarkdownRenderer prose (`a.external-link`), and any plugin-built `<a href="http…">` without
   the class. Decide per case: prose-style links get the icon; anchors that are styled as
   buttons/chips/chrome do NOT. Report the list with file:line and your call per item. If a
   plugin-built prose link lacks the class, the fix is to give it the class at build time,
   not to widen the CSS selector to `a[href^=http]` — unless you find that is clearly wrong,
   in which case report NEEDS_CONTEXT.
6. **Harness**: update the `perk/links` fixture if needed (`visual-harness/entry.ts` ~855–890
   already carries an `external-link ds-scc-web` anchor) and the inline host-leak sweep in
   `visual-harness/shoot.mjs` (~3461–3925: it compares computed style with vs. without
   Obsidian's host copy, including "external-link icon material"). The sweep must stay
   green AND must now also sample the new `::after` (with-host vs without-host equality of
   its mask/size/margin/colour), so a future host rule reaching the pseudo-element would be
   caught. Update its printed expected-count line honestly.
7. **Tests**: add jest coverage per the repo's conventions (e.g. a CSS-source assertion that
   the icon rule exists, is inside the print-excluded scope, and uses currentColor; and any
   class added at build time in step 5).
8. **Docs**: DESIGN.md (worktree copy) — one short entry in the link/component section saying
   external links carry the plugin-drawn arrow, screen-only, currentColor. CHANGELOG.md
   (worktree copy) — one bullet under `## Unreleased`.

Stay out of these areas (other tickets have unlanded branches there): `.dse-feature__kw*`
keyword chips (SC-231), the ds-feature example (SC-236), ds-skills header (SC-255),
`.dse-optchip` (SC-338), the by-SCC rule eyebrow (SC-272), modal text scale (SC-230), card
header narrow form (SC-284). If your change must touch one, report the overlap.

**Commit after each coherent step** (CSS rule; survey/class fix; harness sweep; tests; docs).
Nothing sits uncommitted through a gate.

## 2. Gates (dse-verify battery, in order) — expected numbers at base 619c4bd

| Gate | Expected |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (after `rm -f main.js styles.css`) | 4038 passed / 1 skipped / 208 of 209 suites / 3 snapshots, plus your new tests |
| `DSE_LIFECYCLE_PORT=<pick 92xx free> npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 19/19 ok, 0 failed` |
| `npm run shots` | 524 PNGs (or + any new capture you add), 0 FAIL; host-copy pin OK/PARTIAL; button host-leak OK; inline host-leak sweep OK with its new count |
| `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/draw-steel-elements/visual-harness/shots` | `freeze OK (260/260 …)` expected (D4: screen-only) |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared / 16 DECLARED / exit 0. If the icon creates a new parity delta vs the v2 site, report it verbatim; do not silence it by declaring a deferral without saying so. |

Shape: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/draw-steel-elements && npx jest' > <logfile> 2>&1` — gate command LAST, no pipes, output redirected to a
per-run unique log path under the ledger dir (e.g. `sc317-r1-jest-<timestamp>.log`). Read the
tool's own summary line from the log. **Run every gate in the FOREGROUND** (Bash timeout up to
600000 ms). Never background a gate and wait for a notification — it never comes.
jest timeouts in `settings-tab` / `settings-preview` under load: check `/proc/loadavg` and
re-run before believing them.

## 3. Evidence (for Scott's eye)

From your own `npm run shots` output (steel-dark and steel-light, the `perk/links` capture
and one SCC-link capture of your choice), produce tight crops (~2x, PNG) of the link with the
icon, in both schemes, and one hover-state crop if the harness can produce it. Also produce
the matching "before" crops from a clean `origin/develop` 619c4bd shots run (use a separate
throwaway clone/worktree dir under `/tmp/claude-1000/…/scratchpad` or the ledger dir, never
the main checkout) — or, cheaper, `git stash`-free: check out 619c4bd in a scratch
`git worktree add` of the dse repo inside your worktree dir, and remove it afterwards.
Put crops in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/crops/`
named `sc317-<capture>-<scheme>-{before,after}.png`. Also crop the same link from an
`*--steel-print.png` after-shot to show print has no icon.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc317-extlink-icon/sc317-r1-impl-report.md`.
It must OPEN with a ≤10-line executive summary (verdict, final dse sha, each gate's number).
Then: the scope-survey table (file:line, call), the exact CSS you shipped (glyph source
version, sizes, gap), freeze result, parity result, a `Drive-by fixes:` list and a
`Follow-ups:` list, and the absolute path of every evidence artifact (crops, logs).

## 5. Rules and footguns

- **Kill processes only by PID, and only a PID whose command line contains
  `/home/scott/code/steelCompendium/worktrees/sc317-extlink-icon/`** (`pgrep -af
  "worktrees/sc317-extlink-icon/"`, check each line). Never `pkill`/`killall` by pattern —
  other sessions run the same gates concurrently.
- Never edit `.superpowers/sdd/freeze-baseline.sha256` or `check-freeze.sh`. Never `rm -rf`
  anything under `.superpowers/` except your own `sc317-extlink-icon/` subpaths.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output, or a per-run
  unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the dispatcher. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and
  the question in your report. If you ever do send a message anyway, its FIRST WORD must be
  `SC-317:`.
- No `just deploy*`, no tags, no releases, no push to `main`. Do not push at all unless this
  brief says so (it does not); commit locally on `sc317-extlink-icon`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict
(DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), final dse sha, measured gate numbers,
freeze + parity lines verbatim, and the absolute path of the report and every evidence
artifact. No prose.
