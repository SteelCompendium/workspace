# SC-318 round 2 — implement Option A (screen-only heading tokens) + evidence

You are the implementer for ticket SC-318. Your final text goes to the ticket-owner, not a
human: raw facts (verdict, shas, measured numbers), no prose.

## 1. Context loading (do this first)

- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/decisions.md`
  in full — especially "Owner rulings, round 1". It is the spec. Workers NEVER call the
  tracker (Linear) — not to read history, not to post.
- Read `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/sc318-r1-survey-report.md`
  (Q1 for the exact file:line of every rule/test to touch; Q5 Option A for the numbers).
  Its probe scripts are in `.../sc318-card-headings/r1-survey/` (reuse `survey-headings.mjs`
  for the screen-vs-print table).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc318-card-headings`, branch
  `sc318-card-headings` in every submodule. DSE = `<wt>/draw-steel-elements`. Verify `pwd`
  and branch before every write. NEVER write under `/home/scott/code/steelCompendium/workspace/`
  except the ledger dir `.superpowers/sdd/sc318-card-headings/` (reports/evidence).
  **The workspace-level files (`CHANGELOG.md`, `docs/superpowers/dse-overhaul/D3-token-map.md`)
  live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc318-card-headings/<file>` — never under
  `/home/scott/code/steelCompendium/workspace/`.**
- Fetch-and-rebase first: `git -C <wt>/draw-steel-elements fetch origin && git -C <wt>/draw-steel-elements rebase origin/develop`.
  Expected origin/develop = `5a20d5f` (if it moved, rebase onto the new tip and say so).
  If `package.json`'s obsidian version changed, `npm ci`. Superproject worktree: `git fetch
  origin && git rebase origin/main` (expected `9a7e39b` or later).
- Read DSE's own `AGENTS.md` / `CLAUDE.md` for conventions (changelog, tests).

## 2. The task

Owner rulings, round 1 (verbatim from the ledger):

> - **Implement Option A, SCREEN-ONLY, as the branch proposal** Scott will see: mint
>   `--dse-fs-h1..h6` = 1.618 / 1.462 / 1.318 / 1.188 / 1.076 / 1 x body; lh 1.2/1.2/1.3/1.4/1.5/1.5;
>   weight 700/680/660/640/620/600; letter-spacing -0.015/-0.011/-0.008/-0.005/-0.002/0em;
>   margin-block 1 body-em, margin-top 2.5 body-em when following `p, pre, table, ul, ol`
>   (Obsidian's own rule, expressed so it scales with the body size). Freeze must read 260/260.
>   The ask offers A (branch) / C (compact 1.25..1em, shown by probe) / leave (UA).
> - **Acceptance invariant:** for every heading that A governs, the harness SCREEN computed
>   font-size / line-height / weight / margins at default size equal the PRINT twin's computed
>   values (screen == print == vault). Report the table.
> - **Scaling:** tokens scale exactly as the existing `--dse-fs-heading` / `--dse-fs-subheading`
>   tokens do (Obsidian text-size setting, SC-230 modal scaling); at default they land on the
>   px above.
> - **Plugin tags:** roster heading, region title (CHARACTERISTICS), initiative bare h3/h4 share
>   the tokens via explicit declarations (the classed ones get `font-size: var(--dse-fs-hN)`).
>   **`.dse-hero__name` (h2) does NOT change** — it is the hero card's NAME, which is SC-232's
>   territory (card-name sizes); pin it explicitly to today's rendered values with a comment
>   citing SC-232. Keep the existing pins on `.dse-skills__group-title` (subheading) and
>   `.dse-mt__guide-title` (label). Steel tracker uppercase/weight rule (~10715) stays.
> - **Tests/docs:** empty `fontSizeContract.test.ts` UA_RESTATEMENTS (tokens replace them);
>   update `headingEmphasisLinkHostRegrounding.test.ts` pinned sizes, `tokens.ts`/`tokens.test.ts`,
>   `token-coverage.test.ts`, `theme-steel.test.ts` invariants, `font-sizes.md`, and six rows in
>   the WORKTREE superproject's `docs/superpowers/dse-overhaul/D3-token-map.md`.
> - Side finding LOW `D3-token-map.md:689` `--dse-fs-control` drift -> FOLD (same file, doc line).
> - Side finding LOW no fixture for card-body h1..h6 -> FOLD: add ONE screen harness capture
>   with an h1..h6 ladder in a card body (plus a blockquote-h6 ability header if cheap). If the
>   harness auto-produces print twins for it, those are new unbaselined files: report them as a
>   widening candidate, do NOT touch the baseline. Skills group title fixture -> DROP (its size
>   is pinned and untouched here).
> - Parity: no new pair (the site has no card-body heading node to pair with). Declared stays 16.
> - CHANGELOG: one `## Unreleased` bullet in the WORKTREE superproject CHANGELOG.md; plus DSE's
>   own changelog if its AGENTS.md convention requires one.

Notes:
- Keep SC-202's re-grounding (the rule still owns h1..h6 in plugin roots so a vault == harness);
  change the values. Do NOT make the change print-inclusive. Do NOT edit `.dse-head*` or
  `.dse-section__title` rules (SC-232 / SC-235 territory) or the parity selector map.
- If the `:root` token block uses `--dse-fs-large-scale` for heading tokens, follow the
  pattern of `--dse-fs-heading` exactly, and report whether the screen==print invariant still
  holds at default (it must).
- Heading comments that describe the UA scale must be updated to the new truth.
- Write a jest test that fails on develop and passes on the branch for at least: h6 in a card
  body >= body size; token values; `.dse-hero__name` unchanged. Prove it can fail (revert CSS,
  run, restore) and report.
- **Commit after every coherent step** (tokens+CSS; tests; fixture; docs; changelog). Nothing
  sits uncommitted through a gate or a build.

## 3. Gates (the `dse-verify` skill owns the battery:
`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read it)

Run each in the FOREGROUND with output redirected to a per-run log under
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r2-logs/`
(prefix `sc318-r2-`). Read each tool's own summary line. Expected:
- tsc clean; lint clean.
- jest: measure the base on `5a20d5f` first (expected ~4119 total, 1 skipped), then the branch
  = base + your new tests, 0 failures. `rm -f main.js styles.css` in the plugin root before jest
  (dse-verify "stale main.js").
- `npm run obsidian-lifecycle`: `19/19 ok, 0 failed`.
- `npm run shots`: 532 PNGs + your new capture's files, 0 FAIL.
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh <wt>/draw-steel-elements/visual-harness/shots`
  -> `freeze OK (260/260 …)`. If ANY frozen line fails, STOP and return NEEDS_CONTEXT with the
  failing ids (no rebaseline is planned; print must not move).
- parity (LAST): 0 GAPs / 0 undeclared / 16 DECLARED.

## 4. Evidence (in `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/r2-evidence/`)

All crops at 1:1 CSS px (same scale in every column — crop, never rescale one column). Dark
steel twin unless stated. Label each column/row with plain text inside the image.
1. `sc318-before-after.png`: rows = perk "Familiar Statblock" (h6), hero CHARACTERISTICS region
   title, ancestry or class prose h3 (include the paragraph above it so the top margin shows),
   initiative "Heroes" h3 + a group h4. Columns = Today (`5a20d5f`) / Option A (branch).
2. `sc318-ladder.png`: your new h1..h6 fixture, columns = Today (UA) / Option A (branch) /
   Option C (probe: h1 1.25em, h2 1.2, h3 1.15, h4 1.1, h5 1.05, h6 1em; lh 1.3; weight 700;
   margin-block-start calc(1.25em/ratio), end calc(0.5em/ratio) — injected CSS, not committed).
   Include the card NAME (head) in each column so heading-vs-name size is visible.
   Caption each row with the measured computed px.
3. A text table `sc318-measure.txt`: per heading level and per plugin tag — screen today,
   screen branch, print twin; font-size / line-height / weight / margin-top / margin-bottom.
4. Narrow: at the narrowest existing captures that show headings (e.g. perk-narrow), count
   line wraps per heading base vs branch; report new wraps and any mid-word break.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc318-card-headings/sc318-r2-implement-report.md`
Open with a <=10-line executive summary (shas, gate numbers, invariant holds y/n). Then: commits,
the measure table, narrow table, can-fail proof, `Drive-by fixes:` and `Follow-ups:` sections.

## 6. Return contract and footguns

- Final text: verdict, dse sha(s), superproject sha, gate numbers, and the filesystem path of
  EVERY evidence artifact (PNGs, logs, report).
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is
  pre-populated across sessions and branches, and a stale log from another branch will match.
  Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog
  kills silent agents. Run every gate in the FOREGROUND; never background a job and wait for a
  notification (it never comes). Use `timeout` up to 600000 ms per call.
- Devbox: `devbox run -- bash -c 'cd <abs> && <cmd> > <log> 2>&1'`; the wrapper eats `$?` and
  a pipe (`| tail`) hides failures — read the log's own summary line.
- Kill processes only by PID, and only a PID whose command line contains
  `worktrees/sc318-card-headings/` (`pgrep -af "worktrees/sc318-card-headings/"`, check each
  line). NEVER `pkill`/`killall` by pattern — other efforts run shots/parity concurrently.
- Never touch the freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`). Never `rm -rf`
  anything under `.superpowers/` except your own `sc318-card-headings/r2-*` dirs.
- No tags, releases, or pushes. Never touch DSE `main`.
- Token-map test footgun (PROJECT.md 8.4): `token-coverage.test.ts` reads the D3 token map by
  candidate-path search; make sure it reads YOUR worktree's edited copy (use its
  `DSE_TOKEN_MAP_PATH` override pointed at the worktree superproject file if needed) and say
  which copy it read.
- You cannot `SendMessage` me. If you need input, end your turn with STATUS: NEEDS_CONTEXT and
  the question. If you ever send a message anyway, its first word must be `SC-318:`.
