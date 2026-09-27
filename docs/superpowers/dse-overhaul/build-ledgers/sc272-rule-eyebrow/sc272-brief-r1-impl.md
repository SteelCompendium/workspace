# SC-272 round 1 — implementer brief

You are the implementer for Linear ticket SC-272. Your final text goes to the ticket-owner (an
agent), not a human.

## 1. Context loading

- Read the decisions ledger FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/decisions.md`.
  It quotes the ticket verbatim. Workers never call the tracker (Linear) — not to read, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc272-rule-eyebrow`. The plugin is at
  `/home/scott/code/steelCompendium/worktrees/sc272-rule-eyebrow/draw-steel-elements`, branch
  `sc272-rule-eyebrow`. Verify `pwd` before every write. NEVER write anything under
  `/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir.
- Read `draw-steel-elements/AGENTS.md` (and CLAUDE.md if present) in the worktree.
- First: `git fetch origin && git rebase origin/develop` in the DSE clone. Expected origin/develop
  = `6c4f6aa` (if it has moved, rebase onto the new tip and note the sha). Never touch DSE `main`.
  Never create tags or releases.
- Commit after every coherent step. Commit messages: no Claude/AI attribution, no Co-Authored-By.

## 2. Task

Ticket (verbatim from the ledger):

> the site's rule tile types a rule by its group directory (`COMBAT`, `DICE` — `steel-etl/internal/site/cards.go:594-599`), and SC-120's `genericLayout.steel` eyebrow implements "last dot-segment of `type`, humanized" to match — but the eyebrow can never render anything except the literal `Rule`: all 153 corpus rule files carry bare `type: rule` in frontmatter, and the group lives only in the `scc:` code, which `genericNoteAdapter` never captures into `GenericNote.type`.
>
> Fix direction: have the adapter (or a `typeAdapters` entry) derive the group from the `scc:` type segment (e.g. `rule.combat` → `Combat`) so the eyebrow carries real information in by-SCC mode. SC-120 shipped the interim mitigation (eyebrow suppressed when it duplicates the card title, so inline rules don't render "RULE / RULE").

Do this:

1. **Survey briefly (report it in ≤10 lines):** locate `genericNoteAdapter`, `GenericNote.type`,
   `typeAdapters`, the `genericLayout.steel` eyebrow logic and SC-120's duplicate-title
   suppression. Check the real corpus scc codes for rules (the compendium data the plugin reads —
   e.g. `/home/scott/code/steelCompendium/workspace/data/` or the plugin's own fixtures/manifest;
   read-only) and list the distinct rule type segments (e.g. `rule.combat`, `rule.dice`, any
   multi-level like `rule.x.y`, and any rule with bare `rule` type). Also read
   `steel-etl/internal/site/cards.go` ~lines 580-610 in the worktree to see exactly how the site
   humanizes the group, so the plugin matches it (casing, hyphen handling).
2. **Implement** the fix direction: the group comes from the `scc:` type segment so the rule
   eyebrow shows e.g. `Combat`. Rules:
   - Prefer the narrowest change: only rules (or a `typeAdapters` entry for rule) — do not change
     the eyebrow for other generic families unless the survey shows they have the same bug and
     the change is the same one line; if so, report it as a follow-up instead of doing it.
   - Fallbacks: no `scc:`, a malformed code, or a bare `rule` type segment must keep today's
     behavior exactly (eyebrow `Rule`, and SC-120's duplicate-title suppression still applies).
   - An explicit frontmatter `type:` more specific than `rule` (e.g. `rule.combat`) must still
     work as it does today.
   - Match the site's humanization (step 1).
3. **Tests:** unit tests that pin: `rule.combat` scc → `Combat`; a multi-word/hyphenated group
   (if the corpus has one) humanized the site's way; missing scc → `Rule`; bare `rule` scc
   segment → falls back; the duplicate-title suppression still suppresses when the derived
   eyebrow equals the card title. Make at least one test fail on the pre-fix code (state which).
4. **Visual evidence for Scott:** before/after screenshots of a steel rule card whose eyebrow
   changes (dark and light if the harness gives both). Before = origin/develop build, after = your
   branch. Use the visual harness (`npm run shots` produces browser shots; if no existing fixture
   exercises a rule with an `scc:` code, add a fixture/capture for it — say so in the report).
   Crop to the card. Save under
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/evidence/`
   with names `sc272-<what>-{before,after}-{dark,light}.png`.

## 3. Gates

Follow the `dse-verify` skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
(read it — command shapes, the `rm -f main.js styles.css` before jest, devbox exit-code traps).
Battery in order: tsc, lint, jest, shots, freeze check, parity LAST. The obsidian-lifecycle gate
is optional here (no lifecycle code touched) — skip unless you touch block lifecycle.

Expected numbers (measure the origin/develop baseline yourself if a number disagrees — it moves):
- tsc / lint clean.
- jest: ~3919+ passed / 1 skipped / 202 of 203 suites on origin/develop (SC-282 landed after the
  last recorded figure; record the true baseline) — your branch = baseline + your new tests, 0 failed.
- shots: ~524 PNGs, 0 FAIL (more if you add a capture).
- freeze: `check-freeze.sh` against the shared baseline, **260 lines**, expect 260/260 OK.
  If frozen `*--steel-print.png` bytes move: DO NOT edit the shared baseline
  (`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/freeze-baseline.sha256` is
  read-only for you). Instead ship
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/rebaseline.txt`
  (ready-to-apply `<sha256>  <filename>` lines, verified deterministic across 2 runs) plus
  before/after crops of each moved shot in `evidence/`, and report the count.
- parity: 0 GAPs / 0 undeclared WARNs / 16 DECLARED, exit 0.

## 4. Footguns (all apply)

- **Kill processes only by PID, and only a PID whose command line contains
  `/worktrees/sc272-rule-eyebrow/`.** Never `pkill`/`killall` by pattern — other sessions run the
  same `shots`/`parity`/chrome commands right now in other worktrees (SC-338 incident). Use
  `pgrep -af "worktrees/sc272-rule-eyebrow/"` and check each line before killing.
- Devbox: `devbox run -- bash -c 'cd /abs/path && cmd'`. Its sh wrapper eats `$?`; never pipe a
  gate into `tail`. Redirect long output to a file and read the tool's own summary lines.
- Run every gate in the FOREGROUND with output redirected to a file. Never background a gate and
  wait for a notification — it will not come. Redirect long-running output to a file rather than
  streaming it (the 600s stream watchdog kills silent agents); use `timeout` up to 600000 ms per
  call and split if needed.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is shared across
  sessions/branches; write logs to per-run unique paths (e.g. include `sc272` and a timestamp).
- `.superpowers/` is shared global state: never `rm -rf` it or anything outside
  `.superpowers/sdd/sc272-rule-eyebrow/`.
- `npm ci` if `package.json`'s obsidian version changed on rebase.
- If a doc-reading test (token-coverage) goes red, compare the worktree's
  `docs/superpowers/dse-overhaul/D3-token-map.md` with the main checkout's before believing it
  (adapter footgun 8.4); override via `DSE_TOKEN_MAP_PATH`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with
  `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway,
  its FIRST WORD must be `SC-272:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc272-rule-eyebrow/sc272-r1-impl-report.md`.
It opens with a ≤10-line executive summary: verdict, DSE sha(s), base sha, jest numbers
(baseline → branch), shots, freeze N/260, parity, whether frozen bytes moved.

## 6. Return contract

Final text: raw facts only — STATUS (DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED), branch
+ head sha, base sha, gate numbers, the survey's distinct rule groups, files changed, the test that
fails pre-fix, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of EVERY evidence
artifact (report, logs, screenshots, rebaseline.txt if any).
