# SC-361 r1 brief — design/prototype round (orchestration:reviewer)

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/decisions.md`
  (the ledger — current requirements and rulings; it supersedes anything you infer elsewhere).
- Read: `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/DESIGN.md` (design
  language) and the "Scott is colorblind" section of
  `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/docs/working-preferences.md`.
  Workspace-level files live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/` — never write anything under
  `/home/scott/code/steelCompendium/workspace/` except your report/evidence in the ledger dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus`, dse submodule at
  `.../draw-steel-elements` on branch `sc361-swatch-focus`, expected HEAD `188755b`
  (= `origin/develop`). Verify with `git -C <abs path> log --oneline -1` before starting;
  if `origin/develop` has moved (`git -C <abs path> fetch origin`), report it, do not rebase.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- Use `git -C <absolute path>` for every git command; never `cd X && git …` (a failed cd once
  ran git in the shared main checkout).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — expected, ignore it, never touch it.

Relevant code (dse submodule): `styles-source.css` ~L2173–2205 (`.dse-swatches`, `.dse-swatch`,
`.dse-swatch[aria-pressed='true']`, `.dse-swatch--custom`) and the comment near L15407 explaining
why `.dse-swatch` is excluded from the shared kit focus ring; `src/views/ConditionsModal.ts`
~L376–390 (swatch buttons + the custom swatch, which is a `<label>` wrapping an
`<input type="color">` — focus lands on the INPUT, so it needs a `:focus-within`/equivalent
answer too); `visual-harness/mocks/sc186-*` (an existing static mock of the modal);
`visual-harness/shoot.mjs` ~L3106 (the existing chip focus/pressed harness entry for swatches).
Prior failed attempt evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc338-chip-focus/evidence-r2/sc338-grid-swatch.png`.

## 2. The task

Ticket requirements, verbatim from the ledger:

> * A focused unselected swatch must not look like a selected one.
> * A focused selected swatch must look different from an unfocused selected one.
> * The difference can't rely on color alone.
> * The swatches sit about 7px apart (`gap: 0.45em`), so a ring drawn farther out than the current selection ring will run into the neighboring swatch.

> **Options to prototype:** a dashed focus ring; moving the selection mark to something else (a check glyph, or an inset ring) so that focus can use the standard ring; or wider spacing plus a concentric outer ring.

Scott is colorblind: focus vs. selected must be distinguishable in grayscale.

Do:

1. Prototype **at most 3** options (pick from the list above; you may merge or replace one if
   you find a clearly better candidate — say why). Prototype CSS lives ONLY in your private
   scratch folder — **do not commit to the `sc361-swatch-focus` branch** and do not edit
   `styles-source.css` in the worktree this round.
2. Render each option in **real Chromium with real keyboard focus** (`:focus-visible` reached
   by pressing Tab / arrow keys, not a faked class), on top of the real built plugin CSS and
   Obsidian app CSS (`visual-harness/dist/obsidian-app.css` exists after a `npm run shots`
   build, or build what you need) — in **both light and dark themes**. Cover the plain swatch
   buttons and the custom (color-input) swatch.
3. For each option, measure: non-text contrast (WCAG 1.4.11, ≥3:1) of the focus indicator
   and the selection mark against the modal background AND against the worst-case adjacent
   swatch colors in the palette (the lightest and darkest swatch hexes); whether anything
   collides with the neighbouring swatch at the 0.45em gap (and at Obsidian's smallest and
   largest UI font size if cheap); the grayscale distinguishability of the four states.
4. Produce evidence (all magnified at least 3x with nearest-neighbour or device scale factor —
   the swatches are tiny):
   - **One deciding grid image** `sc361-r1-grid.png`: rows = options, columns = the four states
     *unselected · unselected+focused · selected · selected+focused*, light and dark side by
     side, every cell text-labelled in the image (state name + option letter). Include a
     "today" row (current develop) at the top for reference.
   - The same grid in grayscale: `sc361-r1-grid-gray.png`.
   - Per-option close-ups if useful (`sc361-r1-opt-<letter>.png`).
5. Recommend ONE option with reasoning (requirements met, contrast numbers, how it fits
   DESIGN.md, implementation cost incl. what the shared kit ring rule / shoot.mjs swatch entry /
   parity would need). Name every color in prose (e.g. "the gold accent ring", "the white
   check with a dark outline") — never "the blue one" alone.
6. List what the implementation round would touch (files, and which gates — freeze-frozen
   shots, parity declared set, `pressed toggle parity` in shots — it may move), so I can brief it.

Keep scope to the swatches: SC-422 (text-scale CSS) and SC-326 (montage board CSS) are being
changed concurrently by other efforts.

## 3. Gates

This is a design round: no battery is required and none should be run against the worktree
branch. If you run `npm run shots` to get `visual-harness/dist/obsidian-app.css`, that is fine
(it builds into the worktree; do not commit anything). Baselines for reference only
(dse-verify CURRENT, develop @ 188755b): shots 572 / 0 FAIL, freeze 276/276, parity 0 GAPs /
0 undeclared / 24 DECLARED.

## 4. Scratch, reports, evidence

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r1-design-<unique>/`
  where `<unique>` is e.g. `$(date +%s%N)` — create it, record its path in your report, put
  every script/log there with a unique name. The scratchpad is shared by every agent; never
  use a generic name like `gate.sh` or `shot.mjs` at its top level.
- Evidence: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r1/`
  (create it).
- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/sc361-r1-design-report.md`.
  It must open with a **≤10-line executive summary** (recommended option, one-line why, the
  key contrast numbers, deciding image paths).

## 5. Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run long jobs in the FOREGROUND (with output redirected); do not end
  your turn "waiting for a notification" — a job you start does not wake you.
- Devbox: Node etc. are not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/draw-steel-elements -- bash -c 'cd <abs dse path> && <cmd> > <log> 2>&1'`;
  devbox's sh wrapper eats `$?` — capture exit codes inside a script file.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains
  `worktrees/sc361-swatch-focus/`. Never `rm -rf` a shared glob (`/tmp/dse-*`, `.superpowers/`);
  delete only paths you created and recorded.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the dispatcher, not to me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question. If you ever do send a message anyway, its FIRST
  WORD must be `SC-361:`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose — STATUS, the
recommended option letter, measured contrast numbers per option, whether the worktree is
still clean (`git -C … status --short`), your scratch folder path, and the **absolute path of
every evidence artifact and the report**.
