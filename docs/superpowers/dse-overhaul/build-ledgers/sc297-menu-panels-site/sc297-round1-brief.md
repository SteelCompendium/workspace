# SC-297 round 1 brief — survey + prototype of the DSE chrome panel on the v2 site

You are a design/survey worker for the SC-297 ticket-owner. **You never call the tracker
(Linear) — not to read history, not to post.** Everything you need is in files.

## 1. Context loading (do this first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/decisions.md`
  — read it in full (it is short). The ticket description is quoted there verbatim.
- Workspace rules: `/home/scott/code/steelCompendium/workspace/CLAUDE.md` (rule 1 especially),
  `docs/working-preferences.md`.
- Design contract: workspace `DESIGN.md` sections **"Card header system (the '6-slot header')"**
  and **"The element chrome panel"**. Read both fully. Then the plugin spec
  `draw-steel-elements/docs/superpowers/sc169-element-menu-panel-spec.md` (read the
  CSS-contract and mobile/print sections; skim the rest).
- Worktree (your ONLY write location):
  `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site`. Every submodule is on
  branch `sc297-menu-panels-site`. **Verify `pwd` starts with `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site` before any write.** Never write under
  `/home/scott/code/steelCompendium/workspace/` — that is the shared main checkout. The
  workspace-level files (`DESIGN.md`, `CHANGELOG.md`) live in YOUR worktree's superproject
  at `/home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/DESIGN.md` etc. — but
  this round does NOT edit them.
- Fetch-and-rebase first, inside the worktree's clones (their refs are independent of the
  main checkout):
  - `v2`: `git fetch origin && git rebase origin/main`. Cut at `f9347707dd`. Tracked branch
    is `main`. Record the resulting sha.
  - `steel-etl`: `git fetch origin && git rebase origin/main`. Cut at `093da29`. Record sha.
  - `draw-steel-elements`: read-only this round (reference for the CSS). Cut at `c2a5cec`.
    Tracked branch is `develop`. Do not edit it.

## 2. The task

Scott's ask, verbatim from the ledger: *"Instead of having these buttons floating in the
card, I want to add the menu panels that we have in the DSE plugin and put the functionality
in there."*

This round produces (a) a bounded survey, (b) a working prototype on two card families,
(c) before/after screenshots, and (d) a short written port spec with the open questions.
It does NOT do the full rollout.

### 2a. Survey (bounded — these files, not the whole tree)

Site side (`v2/docs/javascripts/`, `v2/docs/stylesheets/`, `v2/mkdocs.yml`):
- How the current top-center control strip is built: which scripts mount which buttons into
  the card head (`scc-card-copy.js`, `sc-pins.js`, `sc-encounter.js`, `sc-export.js`,
  `sc-scale.js` for the in-chip scaler), the CSS that positions them (`steel-cardhead.css`,
  `steel-pins.css`, `steel-copylink.css`, `steel-encounter.css`, `steel-export.css`), the
  hard-coded rem offsets, hover reveal, mobile handling, print handling.
- Which card families carry the strip today (statblock `.sb-wrap`, featureblock `.fb-wrap`,
  `.sc-ability`, `.sc-trait`, `.sc-kit`, previews, nested sub-features?) and whether embedded
  cards inside Read chapters get it or only the strict `h1+hr+card` card pages.
- The plain-page `.sc-pageact` strip (`sc-pageact.js`, `steel-pageact.css`) — how it relates.
- Whether steel-etl's site templates (`steel-etl/internal/site/cards.go` and friends) emit
  any strip DOM server-side, or the strip is purely client-mounted.

Plugin side (`draw-steel-elements`, read-only):
- The chrome panel CSS block at the foot of `styles-source.css` ("Element chrome") and the
  DOM shape `src/framework/chrome/mountChrome.ts` produces. Extract the exact geometry,
  material and depth rules (option D + E3 + tuck) so the site port is a faithful transplant,
  not an approximation — Scott's standing rule is *"mirror it fully rather than
  approximating it"*.

### 2b. Prototype

In the worktree's `v2`, build a **shared chrome-panel container** for site cards that
replaces the top-center strip: one right-anchored plate seated outside the card, bottom edge
on the card's top border, right edge `10px` inside the card's border-box right edge, E3
hairline-crown material + tuck depth, hover/`:focus-within` reveal on desktop, always visible
with reserved top space on narrow/touch widths, absent in print. Consumers (copy-link, pin,
encounter-add, exports) mount into it; visual order fixed by CSS `order` so mount order does
not matter (the `sc-pageact.js` pattern). Grow right-to-left as in the plugin.

Scope of the prototype: **statblock** (Scott's example) and **ability card**. Leave other
families untouched this round. Keep the change structured so the rollout is "add a family
to a list", and write down how.

Do NOT add a collapse toggle this round — that is an open question for Scott (ledger §Open
questions). Leave the `.sc-pageact` plain-page strip untouched. Do not touch the in-chip
level scaler.

Use the site's own tokens/palette (`palette.css`, `steel-redesign.css`); the plugin's
`--dse-*` tokens do not exist on the site — map each one to its site counterpart and list
the mapping in the spec.

### 2c. Screenshots (the review medium — Scott reviews from images)

Build the site locally and shoot with playwright-core + Brave (procedure:
`v2/.repo-docs/development.md` → Build Process / Testing, and
`v2/.repo-docs/troubleshooting.md` → "Browser E2E: … Playwright via Brave works"). Building
needs the steel-etl pipeline output — use the worktree's scratch `data/`; the workspace
`justfile` has the recipes (`just --list`), run through devbox.

Produce, for the statblock card page and one ability card page, each in **dark** and
**light** scheme:
- BEFORE (current strip, hovered so the buttons are visible) — take these on the clean
  rebased tree before your edits.
- AFTER, hovered (panel visible) and at rest (panel hidden).
- AFTER at a phone width (~375px): panel always visible, reserved space, nothing overlapped.
- AFTER, a print-media render showing the panel absent.
- One tight crop of the panel/card-corner join so the "bottom edge sits on the border, border
  unbroken beneath the plate" rule can be checked by eye.

Name files `sc297-r1-<page>-<scheme>-<state>.png`. Put them in the ledger dir
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/shots/`.
Every caption in your report names colors in prose (Scott is colorblind).

### 2d. Written spec

`sc297-round1-port-spec.md` in the ledger dir: the file-by-file port plan for the full
rollout, the token mapping, the family list with which get the panel, the DOM contract for
consumers, the gates that will need updating (e2e specs, any golden HTML), and the open
questions for Scott — at minimum the four in the ledger plus anything the survey surfaces.
Lead with a recommendation on each question, one line of reasoning.

## 3. Gates

Run the v2 unit suite **before** any edit to record the baseline, and again after:
`devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc297-menu-panels-site/v2 && node --test tests/*.test.js > /path/to/unique-log 2>&1; echo exit=$?'`
(glob, not the directory — this Node rejects a directory arg). Report pass/fail counts both
times. Run the e2e specs that touch the card head / strip (`tests/e2e/*.e2e.cjs`; at least
`cardhead-mobile.e2e.cjs` and anything naming pins/encounter/copy). Report which passed,
which failed, and for failures whether the failure is the prototype legitimately changing an
asserted layout (expected — say so and name the assertion) or a real defect.

Commit your prototype on branch `sc297-menu-panels-site` in `v2` (do not commit shots or the
scratch `data/`). Report the sha.

## 4. Footguns (each has cost real time)

- Devbox: Go/Node/Python/just are not on PATH. Always
  `devbox run -- bash -c 'cd <abs path> && <cmd>'`. Devbox's `sh` wrapper eats `$?` and
  `$PIPESTATUS`; never pipe a gate through `tail`. Redirect output to a file and read it.
- **Never `git checkout -- .` in `v2`** — `docs/javascripts/` and `docs/stylesheets/` are
  hand-authored and live inside the mostly-generated `docs/` tree. Safe clean-up form:
  `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Write to a per-run unique path and read the process's own output.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run the site build and screenshot battery in the foreground with
  output redirected; do NOT background them and wait for a notification (a job you start
  does not wake you).
- Before iterating on pseudo-element CSS on statblock features, read
  `v2/.repo-docs/troubleshooting.md` → "Statblock/ability-card CSS edits have no visible
  effect".
- You cannot `SendMessage` the ticket-owner — a depth-2 agent cannot address its parent, and
  `to: 'main'` routes to the top-level dispatcher, not to me. If you need input mid-task,
  end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report; I will resume
  you with the answer. If you ever do send a message anyway, its FIRST WORD must be `SC-297:`.
- If the report-file write is blocked by your harness, return the report inline.
- If you touch anything outside your worktree path, verify
  `git -C /home/scott/code/steelCompendium/workspace status` is clean before reporting.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc297-menu-panels-site/sc297-round1-report.md`.
**It must open with a ≤10-line executive summary** (verdict, shas, gate numbers before/after,
the 2–3 deciding screenshots by path, the open questions in one line each). The body carries
the survey findings and the caption for every screenshot.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — no prose. Verdict,
`v2` sha and `steel-etl` sha after rebase and after commit, unit/e2e counts before and after,
the absolute path of the report, the spec, and **every screenshot you produced**, plus
`Drive-by fixes:` (already made, obviously correct, local) and `Follow-ups:` (left alone)
lists — empty lists stated as empty.
