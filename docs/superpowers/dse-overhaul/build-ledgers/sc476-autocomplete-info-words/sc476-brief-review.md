# SC-476 reviewer brief — independent review of round 1

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc476-autocomplete-info-words/decisions.md` (authoritative rulings).
- Implementer brief + report in the same dir: `sc476-brief-impl.md`, `sc476-impl-report.md` (read the
  executive summary, then whatever you need).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words`; plugin at
  `.../draw-steel-elements`, branch `sc476-autocomplete-info-words`, base `origin/develop` `e31e1a0`.
  Diff: `git -C <plugin abs> diff e31e1a0..HEAD` and the superproject's `git -C <worktree abs> log origin/main..HEAD`.
- Round-1 state: plugin head `37d625c` (`504f884` fix+tests, `37d625c` dse CHANGELOG); superproject
  `c3eca47` (CHANGELOG-only). The superproject's modified-but-uncommitted `draw-steel-elements`
  pointer is EXPECTED (the dispatcher bumps it at landing) — not a finding.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- **You never call the tracker (Linear).** You do not edit product code; you may write throwaway
  probe tests in your scratch folder (or temporarily in the worktree, reverted before you finish —
  leave `git status` clean and report it).

## 2. Task
Adversarial review of the SC-476 fix: the authoring suggester (`src/authoring/fenceScan.ts`
`scanFenceState`, consumers `schemaSuggest.ts` and `suggest.ts`) must take a fence's language as the
first whitespace-delimited token of the trimmed info string, matching SC-457's `fenceLanguage` rule
(`/^\S*/.exec(info.trim())![0]`), lowercased as before. Execute and probe — don't just read:
- Run jest probes for edge cases: ```` ```ds-counter extra ````, ```` ``` ds-counter ````, tab separators,
  `~~~` fences, an info string of only spaces, a non-ds language with extra words, nested/longer
  fences, a closing fence with trailing spaces, `{` attribute-style info (```` ```ds-counter {x} ````).
- Confirm completions are actually offered end-to-end at the schemaSuggest level, and that nothing
  new is suggested OUTSIDE ds blocks (e.g. ```` ```js ds-counter ```` must not count as ds-counter).
- Check the test pins genuinely fail on the old code (revert the fix locally, run, restore).
- Check the implementer's O2 case-sensitivity finding against the hosts (implementer: authoring
  lowercases; `parseOpenFenceLine` in `src/framework/host/fenceLine.ts` keeps case, hosts compare
  with `===`, `registry.get` is exact). MEASURE whether a real Obsidian (the binary the lifecycle
  gate uses) renders ```` ```DS-Counter ```` as the ds-counter block at all — e.g. with a throwaway
  copy of a lifecycle scenario or the e2e harness run against a scratch vault you create and record.
  Report: rendered yes/no, and so whether lowercasing in the suggester offers completions for a block
  that never renders (or the reverse).
- Re-run tsc, lint and jest yourself; lifecycle/e2e only if the diff touches anything beyond
  `src/authoring/`, tests and changelogs (report which you ran).
Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 3. Footguns (mandatory)
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc476-autocomplete-info-words/draw-steel-elements -- bash -c '<cmd>'`
  with absolute paths; never `cd X && …` in a compound outer command; never pipe a gate into `tail`.
  `rm -f main.js styles.css` in the plugin root before `npx jest`.
- Every git command `git -C <absolute path>`.
- Private scratch folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc476-rev-<your agentId>/`;
  unique file names; Write tool for files; no glob `rm`; never touch `.superpowers/` beyond your report.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc476-autocomplete-info-words/`.
- Redirect long output to a file; run gates in the foreground; never key a wait-loop on a scratch
  filename or its contents.
- You cannot `SendMessage` me (`to: 'main'` reaches the dispatcher, not me). Need input → end with
  STATUS: NEEDS_CONTEXT and the question. Any stray message must start with `SC-476:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc476-autocomplete-info-words/sc476-review-report.md`,
opening with a ≤10-line executive summary (verdict APPROVE / APPROVE-WITH-FIXES / REJECT). If the
write is blocked, return it inline.

## 5. Return contract
Final text to the ticket-owner, raw facts: verdict, findings list (severity, file:line, one line
each), gate numbers you measured, `git status` of the worktree at exit, absolute paths of every
artifact.
