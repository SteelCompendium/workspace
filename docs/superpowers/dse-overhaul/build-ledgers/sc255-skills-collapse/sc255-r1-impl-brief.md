# SC-255 r1 — implementer brief: remove `ds-skills`' own whole-element "Skills" collapse header

You may be a replacement worker. Everything you need is in files; nothing is in conversation memory.

## 1. Context loading (do this first)

- Read the effort ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/decisions.md`.
  Read any `sc255-*-report.md` already in that dir (prior rounds).
- Read the precedent: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc169-menu-panel-ledger.md`
  §4 "`ds-stamina`" (lines ~249-262), the "Ten, not two" freeze note (~line 315) and §7. That is the
  same change done to `ds-stamina`; copy its shape.
- Read the workspace skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  in full before running any gate (battery order, devbox command shapes, freeze rules, rebaseline deliverable).
- Read `draw-steel-elements/AGENTS.md` in your worktree.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse`. The repo you edit is
  `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements`, branch
  `sc255-skills-collapse`. Run `pwd` and `git branch --show-current` before any write. **Never edit
  anything under `/home/scott/code/steelCompendium/workspace/`** (the shared main checkout) except
  writing your report/evidence files into the ledger dir named below.
- **Rebase first:** inside the DSE clone, `git fetch origin && git rebase origin/develop`. Expected
  `origin/develop` = `6c4f6aa`. If it has moved, rebase onto the new tip and say so in the report.
  If `package.json`'s obsidian version changed, `npm ci` before tsc. **Never touch DSE `main`**; never
  create a tag or release on draw-steel-elements, ever.
- **You never call the tracker (Linear)** — not to read history, not to post. The ledger is your
  source of truth.

## 2. The task

Scott's ruling (verbatim from the ledger, SC-169 ruling 3, general to every card element):

> "Remove the old. Replace with the consistent option that all card elements use."

Owner rulings (verbatim from the ledger):

> Per-GROUP collapsibles (Crafting / Exploration / ... group headers) stay. Only the whole-element
> wrapper is the double affordance.

> Expected freeze delta is every frozen Skills print line (the baseline currently holds 20 skills
> lines = 10 capture ids x print twin + realprint, incl. `chrome-skills-menu` and the two `-hidden`
> ids), not the 2 the ticket predicted in August. Any NON-skills frozen line moving is a defect, not
> a rebaseline candidate.

Concretely:

1. In `src/elements/skills/view.ts`, delete the whole-element kit `collapsible(...)` wrapper (the
   "Skills" header, ~line 125-150) so the skills list mounts directly as `ds-stamina`'s bar does.
   The standard element-menu chrome collapse becomes the only whole-element collapse. Remove the now
   dead code it leaves (the whole-element SessionStore slot constant, the title constant, the
   `resolveCollapsePrefs` call if nothing else needs it, stale header comments) — but only what is
   genuinely dead.
2. Keep `collapseKeysOwnedByModel: true` in `definition.ts` and the YAML contract: `collapsible:` /
   `collapse_default:` stay model fields that the block body round-trips **byte-identically**; the
   chrome panel reads them as the authored collapse contract (as on `ds-stamina`). Verify and test:
   - `collapse_default: true` still starts the element collapsed (now via chrome);
   - `collapsible: false` is honoured by chrome (report exactly what it does now vs. before);
   - toggling a skill selection with those keys authored rewrites the block body with the keys
     intact and in place, and content above/below the fence untouched (integrity probe);
   - two `ds-skills` blocks in one note do not share collapse state.
   Update the header comments in `view.ts` / `definition.ts` that describe the old wrapper.
3. Update/rewrite tests that asserted the wrapper (`skills.test.ts`, `pref-overrides.test.ts`, any
   others — grep). Do not delete coverage; re-point it at chrome behaviour, as SC-169 did for stamina.
4. Check the global collapse prefs (`collapseDefault` / `collapsibleDefault`) still reach `ds-skills`
   through chrome, and say in the report whether anything about them changed for skills.
5. Docs: grep DSE `docs/`, `README.md`, the schema docs and the authoring example for anything that
   describes the Skills header and fix it. Add one bullet to DSE `CHANGELOG.md` under its unreleased
   section (follow that file's existing convention; if there is none, report it — don't invent one).
6. Commit after each coherent step on branch `sc255-skills-collapse` (conventional commit messages
   prefixed `feat(skills)`/`test(skills)`/`docs(skills)`, mention SC-255). **No AI attribution or
   Co-Authored-By trailers in commit messages.** Do not push.

## 3. Gates (dse-verify battery, in order, full)

Before changing code, on the rebased base, run `npm run shots` once and copy every
`visual-harness/shots/*skills*--steel-print.png` and `*skills*--steel-realprint.png` into
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/before/`, and run
the freeze check to confirm the base reads `freeze OK (260/260 …)`. (If the base is not 260/260, stop
and report — the machine baseline is out of sync.) Also record the base jest totals.

After the change, full battery. Expected numbers (last measured in dse-verify for SC-343, 2026-09-24;
SC-282 landed after, so re-measure the base jest totals yourself):

| Gate | Expected |
|---|---|
| `npm run tsc` | clean |
| `npm run lint` | clean, exit 0 |
| `npx jest` | all green; totals = base totals +/- the tests you add/remove (SC-343 recorded 3969 passed / 1 skipped / 204 of 205 suites / 3 snapshots) |
| `npm run obsidian-lifecycle` | `OBSIDIAN-LIFECYCLE done: 6/6 ok, 0 failed`, exit 0 |
| `npm run shots` | 524 PNGs, 0 FAIL (count may change only if you add fixtures — say so) |
| `check-freeze.sh` | FAILS on exactly the Skills print lines (expected: the 20 skills lines — 10 capture ids x `--steel-print` + `--steel-realprint`), every other line OK. Report the exact failing list. Anything non-skills failing is a defect: fix it. |
| `npm run parity` (LAST) | 0 GAPs / 0 undeclared WARNs / 16 DECLARED / exit 0 |

Freeze command:
`bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements/visual-harness/shots`

**Rebaseline deliverable (do NOT edit the shared baseline `.superpowers/sdd/freeze-baseline.sha256` — ever):**
- Run `npm run shots` twice after your final commit; the moved lines' hashes must be identical across
  both runs. Write them as `<sha256>  <filename>` lines (same filename form as the baseline file) to
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/rebaseline.txt`.
- Copy the after PNGs to `.../sc255-skills-collapse/after/`.
- Make before/after side-by-side crops (top ~900 px, where the header was) for at least
  `skills--steel-print`, `chrome-skills-menu--steel-print` and `skills-ledger--steel-print`, into
  `.../sc255-skills-collapse/crops/sc255-<id>-before-after.png` (label each half BEFORE / AFTER in
  text on the image). Also one screen-scheme (non-print) before/after crop of `skills` in the default
  steel dark shot so Scott sees what users see on screen.
- Note SC-349: the Skills captures stop at 2400 px, so the lower list is not byte-covered — say in the
  report whether the header removal changes what falls inside the 2400 px window.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc255-skills-collapse/sc255-r1-impl-report.md`.
It must OPEN with a <=10-line executive summary (verdict, final sha, gate numbers, freeze failing
count). Then: the diff summary by file, the behaviour-change list (anything a user would notice:
`collapsible: false`, session persistence, prefs, title/heading visibility), the exact freeze failing
list, the rebase base sha, and `Drive-by fixes:` / `Follow-ups:` sections.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, branch sha, measured
numbers, freeze failing list count — **plus the absolute path of every evidence artifact** you
produced (report, rebaseline.txt, before/, after/, crops, gate logs). No prose.

## Footguns (all apply)

- If the report-file write is blocked by your harness, return the report inline.
- Devbox: Node/npm are not on PATH. Always `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/draw-steel-elements && <cmd>'`.
  Devbox's sh wrapper eats `$?`/`$PIPESTATUS`, and piping a gate (`| tail`) eats failures: redirect
  each gate's output to a per-run log file under your ledger dir (e.g. `sc255-r1-logs/<gate>-<n>.log`)
  and capture the exit code inside the `bash -c` (`...; echo EXIT=$? >> log`).
- Run every gate in the FOREGROUND with output redirected to a file. Never background a gate and wait
  for a notification — it never arrives. Redirect long-running output to a file rather than streaming
  it — the 600s stream watchdog kills silent agents. Use Bash `timeout` up to 600000 ms; if a gate
  needs longer, run it in chunks or re-run, never park.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across
  sessions and branches, and a stale log from another branch will match. Read the process's own output,
  or write to a per-run unique path.
- **Kill processes only by PID, and only ones whose command line contains your own worktree path
  `worktrees/sc255-skills-collapse/`** (`pgrep -af "worktrees/sc255-skills-collapse/"`, check each line,
  then `kill <pid>`). Never `pkill`/`killall` by pattern (e.g. `npm run shots`, `chrome-headless-shell`,
  `obsidian`) — other efforts (SC-236, SC-340, SC-331 …) run the same gates concurrently and a pattern
  kills them too.
- Never `rm -rf` the shared `.superpowers/` dir or anything in it except your own `sc255-*` / this
  effort's subdirectory contents.
- A workspace-level file (DESIGN.md, CHANGELOG.md, docs/) that you need to edit lives in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc255-skills-collapse/<file>` — never under
  `/home/scott/code/steelCompendium/workspace/`. (This task should need none.)
- If `token-coverage.test.ts` fails on a D3-token-map row you did not touch, it is the stale worktree
  superproject copy (adapter footgun 8.4): rerun with `DSE_TOKEN_MAP_PATH` pointed at
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md`; not a defect.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
  `to: 'main'` routes to the TOP-LEVEL session (the dispatcher), not to me. If you need input mid-task,
  end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report — I see your completion
  notification and will resume you with the answer. If you ever do send a message anyway, its FIRST
  WORD must be `SC-255:`.
