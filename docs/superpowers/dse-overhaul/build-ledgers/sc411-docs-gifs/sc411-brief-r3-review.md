# SC-411 round 3 — independent review brief (reviewer tier)

You are the **independent reviewer** for **SC-411: automated docs GIFs for every DSE
element**. You did not write this code. Your final text goes to the ticket-owner, not a
human. **Execute and probe — do not just read.**

## 1. Context loading

1. Ledger (Scott's rulings verbatim + owner rulings O1–O10 + round log):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/decisions.md`
2. Design spec: `…/sc411-docs-gifs/sc411-r1-design.md` (§B–F). Ledger wins on conflict.
3. Implementation reports: `…/sc411-docs-gifs/sc411-r2a-report.md`, `…/sc411-r2b-report.md`.
4. Gate skill: `/home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/.claude/skills/dse-verify/SKILL.md`.

**Workers never call the tracker (Linear).**

Branch under review: plugin `/home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements`
branch `sc411-docs-gifs` @ `8bb21fa` (rebased onto `origin/develop` @ `0ecb90e`; review
`git -C … diff 0ecb90e..8bb21fa`),
plus the worktree superproject's `sc411-docs-gifs` branch @ `b53caba` (PROJECT.md edit; diff it against `origin/main`).
**Do not commit to the branch.** Probes that need edits: make them, observe, then revert
byte-clean (`git -C … diff` empty) before you return — or do them in a scratch clone.

## 2. What to verify (Scott's acceptance, verbatim from the ledger)

> * `npm run docs-shots` regenerates every GIF from scratch with no manual step; a fresh
>   clone + devbox can run it.
> * No hand-recorded GIF remains in `docs/Media/`; `docs-manifest.mjs` lists every one.
> * `docs/superpowers/dse-7.0.0-release-audit.md` updated: the SC-388 hand-record note is
>   replaced by this ticket.

> 5. **Determinism and gates.** Frames must be stable across two runs (same frame count, same
>    key frames) or the capture is useless as a regeneration target. The `shots` / freeze /
>    parity gates must not move — `docs-shots` writes only to `docs/Media/`, never to
>    `visual-harness/shots/`. Keep file sizes sane (target under ~1 MB each; frame rate and
>    palette are the levers).

Probes (minimum — add your own):

P1. **Fresh clone + devbox.** `git clone` the branch (from the worktree's plugin repo, by
    absolute path) into a NEW dir under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/r3-clone/`;
    with only `devbox run -c <clone>` + `npm ci` + `npm run docs-shots -- --only=counter.gif`
    (and one Obsidian GIF, e.g. `--only=stamina-bar.gif`), confirm it runs with no manual
    step and the output GIFs are **byte-identical** to the committed ones. Note node version
    used. Delete the clone dir when done (only that dir).
P2. **Stability:** `--check-stable` on all 7 GIFs. Then prove the check can fail: break
    determinism temporarily (e.g. drop `seed`, or disable a determinism knob) and show exit 1
    with a useful message; revert.
P3. **Full `npm run docs-shots`** → `git status` clean (all 7 GIFs + every PNG byte-identical
    to committed); nothing new under `visual-harness/shots/` (tracked or untracked).
P4. **Failure modes:** a `write: true` step that produces no write fails the entry loudly
    (both cameras if feasible); an unknown step key / bad selector fails at manifest load; a
    `kind: 'gif'` entry for a deferred element (e.g. `party`) is refused by the guard from both
    sources; a failed Obsidian GIF entry's error shot lands in `dist/docs-errors/` with a sane
    name. Revert every probe.
P5. **Encoder correctness:** decode each committed GIF with an independent decoder (Python
    Pillow or the linuxbrew ffmpeg — comparison only) and check frame count, per-frame delays
    vs the manifest holds (after identical-frame merging), loop flag, and per-pixel error vs
    the source frames in `visual-harness/dist/docs-gif-frames/` (report mean and max Δ).
P6. **Gates unmoved:** tsc, lint, jest (`rm -f main.js styles.css` first), shots, freeze,
    parity — expected numbers from `sc411-r2b-report.md` (shots 568 / 0 FAIL, freeze
    274/274, parity 0 GAPs / 0 undeclared / 24 DECLARED). Lifecycle only if `src/`/`main.ts`
    changed.
P7. **Visual:** look at every GIF's frames (contact sheets in `r2a-evidence/`, `r2b-evidence/`,
    or make your own). Does each frame show what its step claims? Any deferred UI ("Pin to
    sidebar" chrome, deferred elements), tooltips, notices, clipped modals, cursor in the wrong
    place, stray focus rings? Name colours in words (the project owner is colorblind).
P8. **Docs:** every element page's GIF reference resolves to a committed file; README shows
    the initiative GIF; the README / visual-harness README passages about hand-recorded GIFs are
    gone and the new docs accurately describe the gif shape, `--check-stable`, and the
    determinism knobs; release audit lines replaced; CHANGELOG Unreleased bullet present and
    user-facing; PROJECT.md footgun sentence accurate.
P9. **Code review:** correctness of the step runner and both drivers (race conditions in
    write-waiting, selector scoping inside the element root, clip computation, cleanup of
    pages/processes on failure, temp-file hygiene), validation completeness, test quality (do
    the new jest tests fail when the code is broken? mutate one line and see), and whether the
    code reads like the surrounding harness code.

P10. **Portrait/cell outline diagnosis (time-box ~30 min; owner will file a product bug from
    your answer — product code is NOT changed in SC-411).** r2b's F1 (report Follow-ups §1)
    says an acted hero's portrait gains the Steel acted frame (`styles-source.css` ~13848,
    `.dse-init__portrait-toggle[data-taken]`) only after a FULL re-render, not after the
    in-place repaint (`view.ts` ~737). But in the LAST frame of
    `initiative-tracker-conditions.gif` (after the Conditions modal closes) the NON-acted
    portraits (Frodo, Sam, Orc #1) and both minion cells also show a pale rectangular outline
    that frame 0 (initial render) lacks. Find the actual rule(s) responsible (computed styles
    on initial render vs after re-render; attributes present on each), state whether it is one
    bug or two, and give a minimal real-Obsidian or harness repro. Evidence:
    `…/r2b-evidence/f1-obsidian-portrait.png`, `…/r2b-evidence/initiative-tracker-conditions-contact.png`.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc411-docs-gifs/sc411-r3-review.md`
— ≤10-line executive summary first (verdict LAND-READY / FIX-ROUND, counts by severity).
Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO), each with `file:line`, a
concrete failure scenario, and a prescribed fix. Then the probe table P1–P9 with measured
results. Evidence under `…/sc411-docs-gifs/r3-evidence/`.

## 4. Return contract

Raw facts — verdict, finding counts, shas reviewed, measured numbers — **plus the absolute
path of every evidence artifact**. Blocked → `STATUS: NEEDS_CONTEXT` + the question.

## Footguns

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc411-docs-gifs/draw-steel-elements && <cmd>'`
  (devbox picks its project from the CALLER's cwd unless `-c`); single quotes; the command
  whose result you need LAST — no `| tail`, no `; echo`; redirect long output to a per-run
  unique log and read it separately.
- **Every git command uses `git -C <absolute path>`** — never `cd X; git …`.
- **Never `pkill`/`killall` by pattern.** Kill only by PID, and only a PID whose command line
  contains `worktrees/sc411-docs-gifs/` or your `r3-clone/` path.
- Real Obsidian: private Xvfb, never `DISPLAY=:1`; pick your own CDP port if the default is
  busy.
- Stale `main.js` shadows `main.ts` for jest — `rm -f main.js styles.css` first.
- **Never `rm -rf` anything under `.superpowers/`** except dirs you created in
  `.superpowers/sdd/sc411-docs-gifs/` (`r3-clone/`, `r3-evidence/`).
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other
  branches match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file — the 600 s stream watchdog kills silent agents.
  **Do not background a gate and end your turn waiting for it** — a job you start does not
  wake you. Run in the foreground with a long timeout, or poll it yourself.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'`
  routes to the TOP-LEVEL session, not to me. Need input → end with `STATUS: NEEDS_CONTEXT`.
  If you ever do send a message anyway, its FIRST WORD must be `SC-411:`.
