# SC-231 round 1 — implementer brief: one chip per keyword (steel screen)

## 1. Context loading
- Read the ledger FIRST: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/decisions.md
- Worktree: /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips — work ONLY in its `draw-steel-elements/` (branch `sc231-keyword-chips`). Run `pwd` and verify before every write. NEVER write under /home/scott/code/steelCompendium/workspace/ except your report files in the ledger dir. Never touch DSE `main`; never create tags/releases.
- Rebase first: `git -C <wt>/draw-steel-elements fetch origin develop && git -C <wt>/draw-steel-elements rebase origin/develop` (expected origin/develop = 6c4f6aa; if it moved, rebase onto the new tip and note the sha). If package.json's obsidian version changed, `npm ci`.
- Read `draw-steel-elements/AGENTS.md` (and CLAUDE.md) and the workspace skill /home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md before gating.
- You NEVER call the tracker (Linear) — not to read, not to post.

## 2. The task
Ticket SC-231 spec (verbatim from ledger):
> The site renders each keyword as its own `.sc-ability__chip` (`steel-ability-cards.css`); the plugin renders the whole Keywords value as ONE chip, since `renderFeature.ts` produces it as a single markdown-rendered, comma-joined text node rather than a list of discrete keyword strings.
> Would need the keywords value split into a list before render, theme-agnostically, without touching the Legacy text-run path.

Do:
1. Survey: how `renderFeature.ts` emits the Keywords value (markdown-rendered? can a keyword contain a link / markdown?), how `.dse-feature__meta-cell--keywords` is styled in `styles-source.css` (~4333, scoped `[data-dse-theme='steel']:not([data-dse-print="on"])`), and how the site does it: `/home/scott/code/steelCompendium/worktrees/sc231-keyword-chips/v2/docs/stylesheets/steel-ability-cards.css` `.sc-ability__chip` (+ whatever JS/markup emits it; grep v2/docs/javascripts and steel-etl for `sc-ability__chip`).
2. Implement: split the keywords value into discrete keywords (theme-agnostic, in the render path), emit one element per keyword, and style each as its own chip in the steel SCREEN theme, matching the site's per-keyword chip (gap, padding, border, radius, type — reuse existing `--dse-*` tokens; no new hex literals). Preserve the text content exactly.
3. HARD constraint: the Legacy theme's inline "Label: value" text run and ALL print output (`data-dse-print="on"`, steel-print + steel-realprint) must render byte-identically. Recommended shape: per-keyword spans with the literal ", " separator kept as text between them (so textContent and legacy/print rendering are unchanged), and the separators hidden/replaced by the flex gap only under the steel screen scope. Your call if you find a better shape — but freeze must stay 260/260.
4. Edge cases to handle + unit-test: single keyword; empty/absent keywords (no empty chips); keywords with markdown/links (if the renderer allows); whitespace around commas; a trailing comma. Also check any other surface that renders a Keywords meta-cell (ability card vs feature, sidebar/preview, compendium embeds) — grep for the meta-cell class; report every surface touched or deliberately left alone.
5. Keep the diff local to keyword emission + its CSS. Do NOT touch `.dse-optchip` (SC-338 owns its focus ring) or the ds-feature example fixtures (SC-236). If a fixture needs a multi-keyword example that doesn't exist, add one in a new fixture rather than editing shared ones, and say so.
6. Commit after each coherent step (survey notes need no commit; render split; CSS; tests). Conventional messages prefixed `feat(feature): SC-231 …` / `test(...)`. No Claude/AI attribution trailers in commits.
7. If DSE keeps a CHANGELOG `## Unreleased`, add one user-facing bullet there (per its AGENTS.md).

## 3. Gates (dse-verify battery, in order, all in YOUR worktree's draw-steel-elements, run in the FOREGROUND, output redirected to per-run files under the ledger dir prefixed `sc231-r1-`)
Wrap: `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips/draw-steel-elements && <cmd> > /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/sc231-r1-<step>.log 2>&1; echo rc=$? >> …same log'`. Never pipe a gate into tail.
Expected (current tree, 2026-09-24; verify the pre-change baseline on the rebased tree before your change if unsure):
- tsc clean; lint clean exit 0
- jest: ~3919+ passed / 1 skipped / 202 of 203 suites (baseline + your new tests; report exact numbers)
- `npm run obsidian-lifecycle`: `6/6 ok, 0 failed`
- `npm run shots`: 524 PNGs (+ any you add), 0 FAIL
- freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc231-keyword-chips/draw-steel-elements/visual-harness/shots` → `freeze OK (260/260 …)`, 0 FAILED. If ANY frozen line moves: STOP changing the baseline (never edit it), diagnose; if the movement is unavoidable, write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/rebaseline.txt` (ready-to-apply hash lines, generated from real bytes) plus before/after crops, and say so.
- parity LAST: `npm run parity` → 0 GAPs / 0 undeclared WARNs / exactly 16 DECLARED, exit 0. If a keyword-chip parity pair exists and changes verdict, report it.

## 4. Evidence
Produce, under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/evidence-r1/:
- before/after crops of the steel-screen Keywords band for a multi-keyword ability (dark AND light), from the harness shots (before = shots from origin/develop tip before your change — capture them first, into a separate dir).
- one crop of the same ability on the live v2 site styling if you can render it (the v2 page in the worktree via the built site or a static render); if not feasible, say so.
- a legacy-theme crop showing the text run unchanged.

## 5. Report
Write /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc231-keyword-chips/sc231-r1-impl-report.md. It MUST open with a ≤10-line executive summary. Final text goes to the ticket-owner, not a human: raw facts only — verdict, commit shas, measured gate numbers, the freeze line verbatim, parity line verbatim, list of surfaces touched, Drive-by fixes:, Follow-ups:, and the absolute path of EVERY evidence artifact and log.

## Footguns (read all)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents.
- Run every gate in the FOREGROUND. Never background a gate and "wait for a notification" — it will never come. Use Bash timeout up to 600000; if a step needs longer, split it.
- NEVER `pkill`/`killall` by pattern. Other worktrees run the same gate commands concurrently. Kill only by PID, and only a PID whose command line contains `worktrees/sc231-keyword-chips/` (check with `pgrep -af "worktrees/sc231-keyword-chips/"` and read each line first).
- devbox: Go/Node not on PATH; `devbox run -- bash -c 'cd <abs path> && …'`; devbox's sh eats `$?`/`$PIPESTATUS` — capture rc inside the bash -c.
- Never `rm -rf` the shared `.superpowers/` dir; only ever delete inside `.superpowers/sdd/sc231-keyword-chips/`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report — I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-231:`.
- Commit after each coherent step; nothing sits uncommitted through a gate.
