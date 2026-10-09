# SC-379 round 1 — negotiation tracker: Steel design candidates (DESIGN ROUND, no production code)

You are a design worker for the ticket-owner of SC-379. Your final text goes to the
ticket-owner, not a human. **You never call the tracker (Linear)** — not to read, not to post.
You cannot spawn agents.

## 1. Context loading (do this first, in order)

1. Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/sc379-decisions.md`
   (Scott's ask verbatim + the owner's rulings). The ticket image (the current tracker, as
   Scott sees it in Obsidian) is `sc379-ticket-image.png` in the same dir — look at it.
2. Worktree: `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`. The plugin is the
   submodule `draw-steel-elements/` inside it, on branch `sc379-negotiation`, cut from
   `origin/develop` @ `9ded832`. Verify before any write:
   `git -C /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements rev-parse HEAD`
   → `9ded832…`. **Never write under `/home/scott/code/steelCompendium/workspace/`** except the
   ledger dir named in §4 — the main checkout is shared and gets reset. Workspace-level docs
   (`DESIGN.md`, `docs/…`, `reference/…`) are read from YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/sc379-negotiation/…`.
3. Read (worktree copies):
   - `DESIGN.md` — the "High-Fantasy Steel" design language. This is the standard the ask names.
   - `draw-steel-elements/AGENTS.md` and `draw-steel-elements/.repo-docs/font-sizes.md`
     (never hardcode a `font-size`; the nine `--dse-fs-*` role tokens only).
   - `docs/working-preferences.md` → "Scott is colorblind" and "Do the right thing over
     minimizing work".
   - The current tracker: `draw-steel-elements/src/elements/negotiation/` (view, model,
     definition, `example.yaml`), the four reused sub-views in
     `draw-steel-elements/src/drawSteelAdmonition/negotiation/`, `src/model/NegotiationData.ts`,
     and the negotiation rules in `draw-steel-elements/styles-source.css` (~130 matching lines:
     grep `negotiation`, `dse-pi`, `dse-pr__`).
   - The framework kit it could reuse: `draw-steel-elements/src/framework/kit/` (cardHead,
     tabs, powerRollPanel, steppers, chips…).
   - Precedent — how the sibling trackers were overhauled into Steel. Read summaries, not whole
     files: `docs/superpowers/dse-overhaul/build-ledgers/sc191-montage-overhaul/sc191-decisions.md`
     and the top of `sc191-impl-spec.md`; then look at the landed result by rendering it (§2
     step 1). The mock tooling that round used is `draw-steel-elements/visual-harness/sc191/`
     (static mock HTML + CSS on the real tokens + a small shoot script) — reuse that pattern.
   - Rules context (what a Director needs at the table during a negotiation):
     `reference/draw-steel-reference.md`, negotiation section (grep `Negotiation`, read that
     section only).

## 2. The task

Scott's ask, verbatim from the ledger:

> * Overhaul the UI to be in the High Fantasy Steel style
> * [image: a real-Obsidian screenshot of the CURRENT negotiation tracker, steel-dark — card
>   head "NEGOTIATION / CONVINCING FRODO TO REMEMBER THE TASTE OF STRAWBERRIES", the Patience
>   0–5 track, the Interest 5→0 list, and the top edge of the two tabs "Make an Argument" /
>   "Learn Motivation/Pitfall"]

The owner's reading: the tracker today is the pre-overhaul layout wearing Steel tokens. The
montage, initiative and project trackers each got a designed Steel composition; this one has
not. Produce candidates for Scott to choose between. **This round writes no production
code** — no edits to `src/`, `styles-source.css`, fixtures, tests, or the harness's shared
files.

Steps:

1. **See the present.** `npm ci` in the worktree's `draw-steel-elements/` (fresh worktree, no
   `node_modules`), then render the current negotiation element and the landed sibling
   trackers with the browser harness (`npm run shots -- --element=<id>`; see
   `visual-harness/README.md`) — negotiation, montage, project, initiative, encounter, in
   steel-dark and steel-light. Look at every PNG you make.
2. **Critique** the current negotiation tracker against `DESIGN.md` and against the landed
   siblings: concretely what is un-Steel or weak (materials, hierarchy, density, the Patience
   track vs. the Interest list being two different idioms for the same kind of 0–5 value, the
   tab panel, the raw checkboxes, the Motivations/Pitfalls lists, what state is hard to read at
   a glance mid-session, narrow/sidebar behaviour at 300px). Short — a list, not an essay.
3. **Design 3 genuinely different candidate compositions** (A, B, C) — different in structure
   and at-a-glance read, not three tints of one layout. Each must:
   - show the same content and affordances the tracker has today (name, Patience 0–5,
     Interest 0–5 with its six outcome lines, the two tabs and everything inside them,
     Motivations, Pitfalls, the ⋮ menu). Do not drop a function; do not add one.
   - be built from existing kit parts and tokens wherever one exists. List any new part a
     candidate needs.
   - **never let hue be the only channel** (Scott is colorblind; blue-vs-purple and
     red-vs-green in particular): current value, spent/used states, tier outcomes, and the
     difference between Motivations and Pitfalls must each be carried by shape, position,
     label, icon or fill as well.
   - keep the persisted YAML shape (`example.yaml`) unchanged. If a candidate would want a
     model change, say so explicitly and show it working without the change.
   - keep the selectable-row / radio semantics keyboard-reachable (don't design something that
     can only be a mouse target).
   - use only `--dse-fs-*` role tokens for sizes, and real `--dse-*` material tokens.
4. **Mock them** as static HTML + CSS under
   `draw-steel-elements/visual-harness/sc379/` (the only directory you create or edit in the
   repo), loading the real built stylesheet/tokens so the candidates sit in the true Steel
   materials, using the Frodo example data. Write a small `shoot-sc379.mjs` there to capture
   them. Captures required, for EACH candidate:
   - steel-dark, wide (the harness's normal card width): the default mid-negotiation state
     (Interest 3, Patience 3, "Make an Argument" tab open, one motivation ticked and one tier
     row selected so the selected/used states are visible);
   - steel-dark, wide: the "Learn Motivation/Pitfall" tab open;
   - steel-dark, wide: an ended state (Patience 0, or Interest 5) if the candidate treats it
     differently from mid-play; skip if identical in structure;
   - steel-light, wide: the default state;
   - steel-dark, narrow 300px (sidebar width): the default state.
   Plus the matching "before" (today's tracker) at steel-dark wide, steel-light wide and
   steel-dark 300px, so every candidate has a like-for-like before.
5. **Eyeball every PNG** before you report. Fix clipped text, overflow, illegible contrast and
   broken narrow layouts — a candidate that doesn't hold at 300px is not a candidate.
6. Commit the mock directory on the branch (`git -C <abs path> add visual-harness/sc379 &&
   git -C <abs path> commit`), no push. No AI/Claude attribution or co-author trailers in the
   commit message. `git -C … diff --stat origin/develop..HEAD` must show only
   `visual-harness/sc379/`.

Extras you notice (functional gaps vs. the rules, bugs in today's tracker, kit gaps) go in a
`Follow-ups:` list in the report. Do not build them.

## 3. Gates

No battery this round — nothing production changes. The one check: the diff-stat line in step
6, and `git -C /home/scott/code/steelCompendium/workspace status --short` unchanged from this
(pre-existing, not yours): ` m draw-steel-elements`.

For reference when you estimate implementation impact (current `develop` @ `9ded832`): jest
4218 passed / 1 skipped · shots 544 · freeze `262/262` · parity 0 GAPs / 0 undeclared / 24
DECLARED. Negotiation owns 6 frozen print lines (`negotiation`, `negotiation-checked`,
`negotiation-pr-checked` × `--steel-print` + `--steel-realprint`); say per candidate whether
print would change (it will — just confirm nothing else's print would).

## 4. Report + evidence paths

- PNGs → `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc379-negotiation/`,
  named `sc379-r1-<before|A|B|C>-<default|learn|ended>-<dark|light>[-narrow].png`.
- Report → `…/sc379-negotiation/sc379-r1-design-report.md`. **It must open with a ≤10-line
  executive summary** (the three candidates in one line each + your recommendation + why).
  Then, per candidate: what it is in plain words; what the Director reads at a glance; kit
  parts reused / new parts needed; rough implementation size; what it does at 300px; its
  weakness. Then the critique list, then `Follow-ups:`. **Name every color in prose** ("the
  amber tier row", "the teal current-value ring") — never "the highlighted one".
- If the report-file write is blocked by your harness, return the report inline.

## 5. Footguns (each has cost real time here)

- Node/npm are not on PATH. Every command: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc379-negotiation/draw-steel-elements && <cmd>'`
  (run `devbox` from `/home/scott/code/steelCompendium/worktrees/sc379-negotiation`). Devbox's
  wrapper eats `$?`/`$PIPESTATUS`; don't pipe a command whose result you need — redirect to a
  file and read the file.
- Every git command is `git -C <absolute path> …`. Never `cd X; git …` — a failed `cd` runs git
  in the shared main checkout.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run shots in the FOREGROUND and read the process's own output; do not
  background a job and "wait for a notification" — none will come.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Never `pkill`/`killall` by a command pattern (other efforts run the same commands). Kill
  only by PID, and only a PID whose command line contains `worktrees/sc379-negotiation/`.
- Never `rm -rf` anything in `.superpowers/` other than files you created with the `sc379-`
  prefix. Never touch `freeze-baseline.sha256` or `check-freeze.sh`.
- `visual-harness/shots/` is gitignored and regenerated — fine to write there via `npm run
  shots`, but your deliverable PNGs go to the ledger dir above.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session, not to me. If you need input mid-task, end your
  turn with `STATUS: NEEDS_CONTEXT` and the question in your report — I see your completion
  notification and will resume you with the answer. If you ever do send a message anyway, its
  FIRST WORD must be `SC-379:`.

## 6. Return contract

Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS
(DONE / NEEDS_CONTEXT / BLOCKED), the commit sha, the diff-stat line, the report path, **the
absolute path of every PNG you produced**, your one-line recommendation, and the `Follow-ups:`
list.
