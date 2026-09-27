# SC-284 round 1 — implementer brief: give `.dse-head` a narrow (stacked) form

You are a Sonnet implementer. Your final text goes to the SC-284 ticket-owner, not a human.

## 0. Context loading (do this first)

1. Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/decisions.md`.
   It holds the ticket spec verbatim. There are no Scott rulings yet.
2. Read the gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
   (battery order, devbox command shapes, freeze rules). Also read
   `draw-steel-elements/AGENTS.md` in your worktree.
3. **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow`, DSE at
   `.../draw-steel-elements`, branch `sc284-cardhead-narrow`. Verify `pwd` / `git -C <path> branch --show-current`
   before every write. **Never write anything under `/home/scott/code/steelCompendium/workspace/`**
   (the shared main checkout) except your report file in the ledger dir. The workspace-level files for
   this effort live in YOUR worktree's superproject (`/home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow/`), never under `workspace/`.
4. Fetch and rebase first: `git -C .../draw-steel-elements fetch origin && git -C ... rebase origin/develop`.
   Expected base: `origin/develop` = `6c4f6aa`. DSE tracks `develop`; never touch `main`. No tags, ever.
5. **You never call the tracker (Linear)** — not to read, not to post.

## 1. The task

Ticket spec (verbatim from the ledger):

> the plugin's `.dse-head` has no narrow-width form. At ~300px (sidebar leaf) the head's deck wraps one word
> per line. The v2 site stacks its header columns at <=30em; the plugin port never adopted that stacking. The
> SC-191 mocks had to hide the crest and both count chips by hand to compensate.
>
> This will bite every element that adopts `cardHead` in a sidebar, not just the montage element.

**Reference behavior to port** — the v2 site's narrow rule:
`/home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow/v2/docs/stylesheets/steel-cardhead.css`
lines ~145–183 (`@media (max-width: 30em)` block and the SC-115 `.sc-card__sig-card` twin). It: drops the
third (right-rail) column, re-places the right eyebrow/primary/deck into rows 4/5/6 of column 2, left-aligns
them (`justify-self: start; text-align: left; margin-left: 0`), gives the right primary a small top margin,
lets line-style decks wrap normally (`white-space: normal; overflow-wrap: anywhere`), and keeps the crest
spanning every lane in column 1.

**DSE code:** `draw-steel-elements/styles-source.css` "cardHead (§2.7)" block (~line 13575, `.dse-head`,
`.dse-head__{eyebrow,primary,deck}--{left,right}`), and `src/framework/kit/cardHead.ts`.
Consumers of `cardHead(`: party, statblock, featureblock, montage (HeadView.ts), roll, shared/CardLayout.ts,
feature/renderFeature.ts, negotiation, encounter, project.

**The trigger must be the card's own width, not the viewport.** A sidebar leaf is ~300px inside a wide
window, so a viewport `@media` query never fires there. Use a container query.

**Preferred mechanism (verify it; deviate only with a measured reason in your report):**
make `.dse-head` its own container (`container: dse-head / inline-size`) and, inside
`@container dse-head (max-width: <threshold>)`, re-place its CHILDREN (the right slots → column 2,
rows 4/5/6, left-aligned). You cannot change `.dse-head`'s own `grid-template-columns` from inside its own
query, but you don't need to: the third track is `auto`, so once nothing sits in it it collapses to 0 width.
This avoids adding a wrapper element (a new DOM node may trip the parity gate) and avoids putting
containment on card roots.

Containment footguns you MUST probe for (and report per consumer):
- `container-type: inline-size` makes the element's width ignore its content. Any consumer where
  `.dse-head` is shrink-to-fit (inline-block, float, abspos, flex item with content-based basis, grid item
  in an `auto` track) will collapse it to ~0 width. Check every consumer above in the harness at wide AND
  narrow widths.
- Layout containment suppresses baseline export and makes `.dse-head` a containing block for
  absolute/fixed descendants — check nothing in any head relied on either.
- If the preferred mechanism breaks a consumer, report which and why, then pick the least invasive
  alternative (e.g. an existing named container on that element's root, such as montage's `dse-mt`).

**Threshold:** match v2's intent (v2's `30em` in a media query = 480px at the default 16px). Note that `em`
inside a container-query condition resolves against the container's own font-size, not 16px — choose a
unit that lands near 480px in Obsidian and say which in a comment.

**Also check** whether any DSE deck/eyebrow/chip slot has `white-space: nowrap` (or similar) that causes
the one-word-per-line / overflow symptom, and port v2's wrap rule for the narrow form if so.

**Do not** hide the crest or the count chips — the ticket's point is that the mocks had to do that by hand.
Keep the change confined to the cardHead block of `styles-source.css` (plus a comment) and, only if truly
needed, `cardHead.ts`. Do NOT touch these areas (other in-flight tickets own them): `renderFeature.ts`,
`.dse-feature__kw*`, `.dse-feature__meta-cell--keywords`, `.dse-feature__meta-value` (SC-231); the ds-feature
example (SC-236); ds-skills (SC-255); `.dse-optchip` (SC-338); by-SCC rule eyebrow (SC-272); modal text scale
(SC-230). If an unavoidable overlap appears, stop and report it.

**Regression guard:** add a narrow-width visual-harness shot (see `manifest.narrowShots` in
`visual-harness/shoot.mjs` and how existing narrow shots are declared) covering at least montage plus two
other cardHead consumers with a right rail (e.g. statblock and roll or negotiation) at ~300px, and a
jest test per repo conventions if one fits (e.g. asserting the container rule exists / the head declares the
container). New narrow shots are not in the freeze baseline (only print is frozen) — say how many shots you
added.

**Changelog:** add one user-facing bullet under `## Unreleased` in `draw-steel-elements/CHANGELOG.md`.

**Commit after each coherent step** (CSS change; tests; harness shot; changelog). Nothing sits uncommitted
through a gate run.

## 2. Evidence for Scott (required)

Produce before/after PNG pairs at ~300px width (sidebar-leaf width) for: montage, statblock, and one more
consumer with a right rail. "Before" = `origin/develop` 6c4f6aa behavior, "after" = your branch. Also one
wide-width (normal note width) after-shot of the same three proving nothing changed there. If a display is
available, prefer real-Obsidian sidebar shots via `obsidian-camera.mjs` (it has a sidebar-leaf mode); otherwise
the harness narrow shots. Save everything under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/evidence/` with names
`sc284-<consumer>-<narrow|wide>-<before|after>.png`. Also produce a single side-by-side composite
`sc284-compare-narrow.png` (before left, after right, one row per consumer, labeled in text) if you can
(ImageMagick `montage`/`convert` if on PATH or in devbox; skip if not available and say so).

## 3. Gates (dse-verify battery, in order) — expected numbers at dispatch

| Gate | Expected |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` (first `rm -f main.js styles.css` in the plugin root) | all green; base ~3969 passed / 1 skipped (measured at an older base — report your exact numbers; any red must be shown to also be red on 6c4f6aa) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| `npm run shots` | 524 + your new narrow shots, 0 FAIL |
| `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow/draw-steel-elements/visual-harness/shots` | `freeze OK (260/260 …)`, exit 0 |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0 |

Wrap every command: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc284-cardhead-narrow/draw-steel-elements && <cmd> > <per-run-unique-log> 2>&1; echo rc=$? >> <log>'`
and read the log. Devbox eats `$PIPESTATUS`; never pipe a gate into `tail`.

**If the freeze check moves ANY frozen print line:** do NOT edit the shared baseline. Diagnose why print
moved (a narrow form should not fire at print width). If it is a genuine, unavoidable consequence, produce
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/rebaseline.txt`
(`<sha256>  <filename>` lines, verified identical across 2 shots runs) plus before/after crops of each moved
shot in `evidence/`, per dse-verify's sanctioned-rebaseline procedure — and report it prominently.

## 4. Footguns (read every one)

- **Kill processes only by PID, and only a PID whose command line contains
  `/worktrees/sc284-cardhead-narrow/`** (`pgrep -af "worktrees/sc284-cardhead-narrow/"`, check each line).
  NEVER `pkill`/`killall` by pattern — other sessions run the same shots/parity/obsidian gates concurrently
  and a pattern kill destroys their runs.
- **Run every gate in the FOREGROUND** with output redirected to a per-run unique file. Never background a
  gate and wait for a notification — it will never come. Redirect long output to a file rather than
  streaming it (the 600s stream watchdog kills silent agents); use `timeout` up to 600000ms per call.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches. Read the process's own output, or write to a per-run unique path.
- `.superpowers/` is shared global state — never `rm -rf` it or anything in it except files you created
  under `.superpowers/sdd/sc284-cardhead-narrow/`.
- Stale `main.js` shadows `main.ts` for jest — `rm -f main.js styles.css` in the plugin root before `npx jest`.
- `npm ci` if `package.json`'s obsidian version changed on rebase.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the
  question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be
  `SC-284:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc284-cardhead-narrow/sc284-r1-impl-report.md`.
It must open with a ≤10-line executive summary: STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED),
final DSE sha, mechanism chosen + threshold, per-gate numbers, freeze result, whether any frozen line moved.
Then: per-consumer probe table (wide OK? narrow stacks? containment side effect?), files changed, commits,
`Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every evidence artifact.

Your final text (to the ticket-owner): raw facts only — verdict, sha, measured numbers, evidence paths.
