# SC-361 r2 brief — implementation (orchestration:implementer)

## 1. Context loading

- Read first, in full: the ledger
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/decisions.md`.
  It is current state; it supersedes anything else you read (incl. the r1 report's "open
  questions", which Scott has now answered).
- Then the r1 design report §4 and §7 (Option B design + "what the implementation round would
  touch"): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/sc361-r1-design-report.md`.
  The working Option B prototype CSS and the real-Tab-focus capture script are in r1's scratch:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r1-design-1792550042879830531/sc361-capture.cjs`
  (read-only for you — copy what you need into your own scratch folder).
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery,
  command shapes, footguns) and `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/DESIGN.md`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus`; dse submodule
  `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/draw-steel-elements`, branch
  `sc361-swatch-focus`, currently `188755b` with no commits of its own.
  **First:** `git -C <dse abs path> fetch origin` then `git -C <dse abs path> rebase origin/develop`;
  it must land on **`bc4a0c5`** (if `origin/develop` is past `bc4a0c5`, rebase onto `bc4a0c5`
  exactly and report the newer sha). Run `npm ci` after the rebase (package.json may have moved).
- Verify `pwd`/paths before every write. **Use `git -C <absolute path>` for every git command —
  never `cd X && git …`.** All workspace-level files you read live in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/` — never write
  under `/home/scott/code/steelCompendium/workspace/` except your report/evidence in the ledger dir.
- The worktree's superproject pin is stale relative to develop (adapter footgun 4): if
  `token-coverage.test.ts` reports missing token-map rows, compare the two copies of
  `docs/superpowers/dse-overhaul/D3-token-map.md` and use `DSE_TOKEN_MAP_PATH` pointed at the main
  checkout's copy — never edit the branch to "fix" it.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — expected; never touch it.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. The task

Scott's ruling, verbatim from the ledger (2026-10-21):

> * option B looks good
> * Lucide check
> * showing the check on the pipette is ok

Option B (r1 report §4): the selected swatch shows a **white Lucide `check` with a dark
outline** drawn inside the swatch; **keyboard focus uses the standard kit focus ring**.

Implement, in the dse submodule:

1. **Selection mark.** Replace `.dse-swatch[aria-pressed='true']`'s outline ring
   (`styles-source.css` ~L2192) with the check glyph (pseudo-element; Lucide `check` path
   `M20 6 9 17l-5-5`, dark under-stroke + white stroke as in the r1 prototype — reuse its
   geometry). No outline/box-shadow ring may remain on the pressed state.
2. **Focus ring.** Add `.dse-swatch:focus-visible` to the **shared kit focus-ring rule**
   (~L15409) and delete the exclusion comment at ~L15405–15407. Do NOT write a separate earlier
   focus rule: `test/…/kit-index.test.ts:230 focusRule()` takes the first `:focus-visible` rule
   with `--dse-focus-ring`, and an earlier swatch rule fails L239.
3. **Pipette (custom colour) swatch** — the `<label class="dse-swatch dse-swatch--custom">`
   wrapping `<input type=color>` (`src/views/ConditionsModal.ts` ~L388):
   - **Focus:** the label shows the same kit ring when its input is keyboard-focused
     (`.dse-swatch--custom:has(> input:focus-visible)` in the same shared rule). This also
     closes SC-473 (folded in — ledger).
   - **Selected:** when the condition's colour is set and is not one of the `SWATCHES` presets
     (compare case-insensitively), the pipette swatch shows the check. Owner's design call:
     the pipette swatch then fills with the custom colour and the check replaces the pipette
     glyph, so it reads exactly like a selected preset; when not selected it looks as today.
     Do **not** put `aria-pressed` on the `<label>` (invalid ARIA); mark it with a class or
     `data-` attribute, and expose the state accessibly in a valid way (e.g. the input's
     `aria-label` names the current custom colour / that it is selected) — report what you chose.
   - **Size:** the pipette renders 22.5px vs 19.5px for the presets (em sizes resolve against
     different fonts). Make it match the presets.
4. **Host invariance (coordination with SC-356).** SC-356's in-flight modal host-leak pass
   allowlists `.dse-swatch` for these leaking properties, idle and pressed:
   `width/height`, `boxShadow` (Obsidian's button "plate" shadow), `color`, `fontSize`,
   `fontFamily`, `whiteSpace`, and at focus-visible `outlineStyle`/`outlineWidth` (Obsidian's
   grey focus halo is a box-shadow). Pin these in plugin CSS on the swatch so the swatch looks
   identical with and without Obsidian's host CSS, in the repo's existing anchor/`:where()`
   host-pin shape (see how SC-203/SC-338 pinned `.dse-optchip`/kit buttons; dse-verify's
   host-leak section). The visible consequence (no Obsidian plate shadow on the swatches) is
   accepted. SC-356 is not on develop; do not cherry-pick its code into this branch.
5. **Tests** (repo conventions; read neighbouring suites first):
   - jest: the swatch is in the kit ring rule (and the pipette `:has` selector); the pressed
     state has no outline ring and has the check pseudo-element; the custom-colour selected
     marker is set iff the colour is non-preset (ConditionsModal unit test), and preset
     swatches keep `setPressedState` behaviour.
   - shots: extend the pressed-toggle parity entry for swatches in `visual-harness/shoot.mjs`
     (~L3106) so it can see the check (it does not read pseudo-elements today) — assert the
     pressed swatch's `::after`/`::before` content/background is present and the unpressed one
     is not. Keep the run's summary line format.
   - e2e: if the COND-* e2e scenarios cover the colour row, add a real-Obsidian check that
     after a keyboard pick the focused, selected swatch shows both the ring (computed outline
     on `:focus-visible`) and the check. If the e2e coverage gate requires a new pair entry,
     add it. A new lifecycle scenario is NOT expected; if you add one, its id is `G-S24`.
6. **Scope:** swatch CSS + ConditionsModal colour row + their tests only. SC-422 (text-scale
   CSS), SC-326 (montage board CSS) and SC-356 (option chips) are editing nearby CSS
   concurrently — touch no other rules. Update the CHANGELOG under `## Unreleased` in the
   **worktree's superproject** (`/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/CHANGELOG.md`)
   only if dse has its own changelog convention for this — check `draw-steel-elements` for a
   CHANGELOG first and follow it; report which you did.

Commit inside the dse submodule after each coherent step (short imperative messages prefixed
`SC-361:`, **no AI/Claude attribution or Co-Authored-By trailers**). Do not commit the
superproject pointer bump. Do not push.

## 3. Gates — full dse-verify battery, in order, at your final head

Expected (dse-verify CURRENT @ `bc4a0c5`), with your deltas explained:

- tsc (incl. `tsc -p e2e`) clean; lint (incl. `e2e/`) clean
- jest **5457 passed / 1 skipped / 232 of 233 suites** + your new tests (state the delta)
- lifecycle `npm run obsidian-lifecycle` **30/30 ok, 0 failed**
- e2e `npm run e2e` **`89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** (+ any you add)
- shots **580**, 0 FAIL (+ the swatch parity line you extend; report its exact line)
- freeze **`freeze OK (280/280 …)`** — expected unchanged (swatches are modal-only). If any
  frozen byte moves, STOP and report; never touch the baseline.
- parity (LAST) **0 GAPs / 0 undeclared / 24 DECLARED**

Run each gate in the FOREGROUND with output redirected to a log in your scratch folder, and
record exit codes from a script file run via `devbox run -c <dse abs path> -- bash <script>`
(a `bash -c '…; echo rc=$?'` under devbox always records 0). Read each gate's summary line.

## 4. Evidence

Re-run the r1 capture approach (real Chromium, real Tab focus, built plugin CSS + Obsidian app
CSS, 4x, dark + light) against YOUR implemented CSS, producing:
- `evidence-r2/sc361-r2-after.png`: the four states (unselected · unselected+focused · selected ·
  selected+focused) plus "selected, neighbour focused", pipette idle / focused / selected
  (custom colour) / selected+focused — dark and light, every cell text-labelled.
- `evidence-r2/sc361-r2-after-gray.png`: the same in grayscale.
- If a display is available, one `npm run obsidian-shots`-style real-Obsidian crop of the
  Conditions modal colour row with a selected+focused swatch (`evidence-r2/sc361-r2-obsidian.png`);
  skip if headless, say so.
Evidence dir: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/evidence-r2/`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/sc361-r2-impl-report.md`,
opening with a **≤10-line executive summary** (head sha, gate numbers, deviations). Then:
commits, files touched, accessibility choice for the pipette, gate summary lines verbatim,
`Drive-by fixes:` (obviously correct, local, can't move a baseline) and `Follow-ups:` (left alone).

## 6. Footguns (adapter §8 — all apply)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-<unique>/`
  (`<unique>` e.g. a nanosecond timestamp) — every script/log inside it with a unique name;
  never a generic name at the scratchpad top level (footgun 12). Create scratch files with the
  Write tool, not heredocs.
- `devbox run -c <abs path> -- …`; never `cd` inside a compound command; no glob `rm` — delete
  only paths you created and recorded (footguns 1, 13). A Bash call that sits forever is
  probably blocked on a prompt — use the plain forms above.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains
  `worktrees/sc361-swatch-focus/` (footgun 9). Never `rm -rf /tmp/dse-*` or any shared glob
  (footgun 11) — lifecycle/e2e vaults of other efforts live there. Never `rm -rf` `.superpowers/`.
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches. Read the process's own output, or write to a
  per-run unique path.
- Redirect long-running output to a file rather than streaming it (600s stream watchdog). Run
  gates in the foreground; never end your turn "waiting for a notification" — a job you start
  does not wake you.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the dispatcher. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and
  the question. If you ever do send a message anyway, its FIRST WORD must be `SC-361:`.

## 7. Return contract

Your final text goes to the ticket-owner, not a human: raw facts, no prose — STATUS, dse head
sha + commit list, each gate's summary line and exit code, deviations from this brief,
Drive-by fixes / Follow-ups, your scratch folder, and the **absolute path of every evidence
artifact and the report**.
