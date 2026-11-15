# SC-652 r1 — implementer brief

You implement SC-652 in an isolated worktree, ship tests, run the full dse battery, and report raw facts.
**You never call the tracker (Linear)** — not to read history, not to post. Your context is the files below.

## 1. Context loading (read first)

- Ledger (current rulings — read it whole, it overrides anything you infer):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc652-wrapper-keys-kept/decisions.md`
- Workspace rules: `/home/scott/code/steelCompendium/workspace/AGENTS.md`, project footguns in
  `/home/scott/code/steelCompendium/workspace/.claude/orchestrate/PROJECT.md` §8 (all of them apply).
- Plugin rules: `<worktree>/draw-steel-elements/AGENTS.md` (or CLAUDE.md) if present.
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — ~490 KB, read it in
  parts: lines 1-250 (the battery, devbox wrapping, jest timeouts, lifecycle/e2e notes, exit-code footgun) and the
  "Current expected numbers" section (grep `^## Current expected numbers`, read the CURRENT paragraph only).
- Prior art, landed (read the ledgers' rulings sections, not whole): in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`:
  `sc625-montage-unknown-yaml-keys-ledger.md`, `sc637-negotiation-unknown-yaml-keys-ledger.md`,
  `sc628-montage-wrong-type-values-ledger.md`. Existing suite to extend or mirror:
  `draw-steel-elements/test/dom/elements/wrapperDefaultKeys.test.ts`.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc652-wrapper-keys-kept` — branch `sc652-wrapper-keys-kept`
in every submodule. The plugin is `<worktree>/draw-steel-elements`, at dse `develop` `ad21dc87`. First:
`git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `ad21dc87`; if it moved,
rebase onto it and say so in the report. Verify `pwd`/paths before any write. **Use `git -C <absolute path>`
for every git command, never `cd X; git …`.** Never edit anything under
`/home/scott/code/steelCompendium/workspace/` except your report files in the ledger dir above. The main
checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is
Scott's live vault — expected, not yours, do not touch or flag it.

A fresh worktree has no `node_modules`: run `npm ci` once in `<worktree>/draw-steel-elements` (through
`devbox run -c <abs plugin dir> -- bash <script file>`, output to a log) before the first gate.

## 2. The task

The ticket: when the plugin writes any block, (a) a `prefs:` map whose keys the plugin does not use (e.g.
`prefs: {boardDensity: compact}`) is deleted whole on the first write; (b) `collapsed: yes` is deleted on the
first write. Expected: "the plugin keeps what it cannot read, the same way SC-625 keeps unknown montage keys."

Owner rulings, quoted verbatim from the ledger:

> **Scope: anything the framework removes from a block's data on read comes back on write, by value.**
> Concretely, all of these must survive a write (any element, any write path: in-block interaction, outside-edit
> refresh, block edit form Save):
> - every key of a `prefs:` map, whatever happens to it on read: applied overrides, unknown/typo keys,
>   attr-less (behavioural or css-bearing) keys, `perBlock: false` keys, SC-406 gated keys (switch on or off);
>   in the author's original key order;
> - a `prefs:` value that is not a map at all (`prefs: compact`, `prefs: [a, b]`, `prefs:` with no value);
> - a non-boolean `collapsed:` (`collapsed: yes`, `collapsed: 1`, `collapsed: "true"`), and likewise a
>   non-boolean `collapsible:` / `collapse_default:` wherever the framework claims (removes) them;
> - the same three keys on the non-mapping-body rescue path (`peelLeadingCollapseKeys`), if it can drop a
>   non-boolean there.
> This reverses SC-406's "typo keys are still dropped on write (as they always were)" comment; that comment is
> updated with the change. Ticket text ("keeps what it cannot read") plus the SC-625 / SC-637 precedent.

> **Behaviour on screen is unchanged.** A kept-but-unusable value still warns in the console
> exactly as today and is still not applied (an unknown pref does nothing; `collapsed: yes` still means "not
> set", so the global default decides). No new reading of `yes`/`no` as booleans. `styles.css` should not change.

> **Not SC-599.** Values are kept by VALUE; their formatting follows whatever the existing
> `stringifyYaml` re-emit does today (flow map may become block map, quotes may change). No source-text-preserving
> editing, no `yaml` Document API, nothing that decides SC-599's question.

> **Placement:** the reserved keys keep today's order (`prefs:` ... `collapsed:` ... body), each
> emitted where it is emitted today. A block with none of the reserved keys stays byte-untouched (no wrapper).

> **SC-514 (ds-hero writes `prefs:` twice) is not ours,** but this change must not make it more
> likely: installing the `prefs:` wrapper in more cases (unknown-only maps) must not produce a second `prefs:`
> line on ds-hero (`HeroModel.serializeStateSplice`, see `withCollapseKeys` doc at collapsedKey.ts ~124) or on
> any other element that already writes the line itself. Report any element where it does.

> **SC-644 overlap:** SC-644 (parked on Scott, code done) touches `pipeline.ts` and the collapse path.
> Keep this change to what a write keeps — `extractCollapseKeys` / `extractPrefOverrides` / `withReservedKeys`
> and their callers — and do not change how the collapse state is resolved (`resolveCollapseState`) or how
> settings reach open blocks. Tell the dispatcher about the shared files at land-ready.

Starting points (from the ticket's agent notes): `src/framework/chrome/collapsedKey.ts` (`extractCollapseKeys`
pops a non-boolean but never adds it to `popped`; `withPeeledKeys`, `withCollapseKeys`, `withReservedKeys`),
`src/framework/prefOverrides.ts` (`extractPrefOverrides`, `PrefPassthrough`, `withPrefOverrides`),
`src/framework/pipeline.ts` (~338-353 pops, ~527-532 installs the wrapper), `src/authoring/FormModal.ts`
(the block edit form runs the same wrapper — it must keep the same things). Find every other caller of
`extractPrefOverrides` / `extractCollapseKeys` and cover it. Types like `popped: Record<string, boolean>` will
need widening to `unknown`; keep the wrapper's "installed only when something was removed" property.

Tests, per the repo conventions (study `wrapperDefaultKeys.test.ts` and the SC-625/637 tests first):
- Unit/jsdom: each ruling bullet above has a test — kept on write, same value, original `prefs:` key order,
  console warning still emitted, override still not applied, collapse state unchanged (e.g. `collapsed: yes`
  renders the same as no `collapsed:`), block without reserved keys byte-identical after a write.
- Write-path coverage: at least one in-block interaction write, the block edit form Save, and the
  outside-edit refresh path, across at least three element types incl. one `collapseKeysOwnedByModel` element
  (`ds-stamina` or `ds-skills`) and `ds-hero`.
- **Integrity probes** (required for anything writing user files): content above and below the block survives;
  two same-kind blocks in one note don't cross-talk (one with `prefs: {boardDensity: compact}`, one without);
  a hand edit to the kept line followed by another write keeps the new hand-edited value; a second write after
  the first does not duplicate any reserved line.
- Real Obsidian: add e2e cases (the SC-625 precedent added them to the integrity e2e suite) for at least the two
  ticket examples written through a real click. Pick free scenario ids by grepping the e2e suite — ids are
  global. **Never put a bracketed ticket id in a test title** (the e2e runner reads titles for scenario ids).
  If you mark something `test.failing`/known-bug, say why in the report.

Commit after every coherent step (small commits in `draw-steel-elements` on branch `sc652-wrapper-keys-kept`).
**Never push anything to origin, not even the branch.** Do not touch the superproject (no CHANGELOG, no pointer
bump) — the owner handles that.

## 3. Gates (all required; dse-verify owns the command shapes)

Run in order against `<worktree>/draw-steel-elements`. Baseline at `ad21dc87`:
- tsc (incl. `tsc -p e2e`) and lint: clean.
- jest: **13403 passed / 2 skipped** in a fresh worktree, plus your new tests (report the exact delta). Jest's
  default timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise.
- lifecycle: **64/64**. Run it in SEVEN parts with `--only=` (equals sign — with a space the runner runs the
  whole suite), ids comma-separated, one part per Bash call, each logged to its own file:
  1. `G-S7a … G-S9a` (21)  2. `G-S9b … G-S40` (16)  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4)  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)  7. `G-S108,G-S112,G-S115` (3)
  (Expand parts 1 and 2 from the SCENARIOS list in the lifecycle runner; G-S56 stays LAST in SCENARIOS order.)
  Part 7 takes ~200 s, over the 180 s tool limit: launch it with output to a log file and its own exit-code file,
  then poll the pid (`kill -0 <pid>`) in short foreground calls — never wait for a background notification.
- e2e: **`OBSIDIAN-E2E done: 612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`** plus your new
  cases (report the new totals; coverage must stay Y/Y). Same long-run handling as lifecycle part 7.
- shots **592**, host-leak 163/978, modal host-leak 40/240, capture clip 147; freeze **280/280**;
  parity **0 / 0 / 24**. If `styles.css` is byte-identical to a clean `ad21dc87` build you may report shots /
  freeze / parity as "carry (styles.css identical, sha …)", but say which you ran.

Known flakes (re-run once before calling a failure real; report every re-run):
- G-S91 FAIL is real unless it says the host was too slow after two re-runs.
- G-S115 (g) suspected flake (SC-633): re-run part 7 once on a loaded host; any other failure is real.
- INIT-W10 e2e flaked once under heavy load (SC-654). SET-X03 / SET-X04 e2e flake now and then (SC-657).
- SC-622: the Obsidian camera can leave `demo-vault/.obsidian/appearance.json` dirty in YOUR worktree, which makes
  G-S97 fail; `git -C <worktree>/draw-steel-elements checkout -- demo-vault/.obsidian/appearance.json` first.

## 4. Footguns (every one has cost real time)

- devbox: `devbox run -c <abs plugin dir> -- bash <script file>`; never `cd` inside a compound command; devbox
  eats `$?` — record exit codes from inside a script file, and read each gate's own summary line. Never pipe a
  gate into `tail`.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad** (two workers hung on a
  permission prompt doing that). Leave throwaway files in place. Never `rm` with a shell-variable path. Never a
  glob delete.
- Never `pkill`/`killall` by pattern. Kill only a PID whose `readlink /proc/<pid>/cwd` or command line is inside
  your worktree.
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r1-impl/`
  with uniquely named scripts and logs; write scratch files with the Write tool.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions
  and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run each gate as a blocking foreground call where it fits under the tool limit; no `run_in_background` waits,
  no Monitor waits.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the
  dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in
  your report; I will resume you. If you ever send a message anyway, its FIRST WORD must be `SC-652:`.
- If the report-file write is blocked by your harness, return the report inline.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc652-wrapper-keys-kept/sc652-r1-impl-report.md`.
It opens with a ≤10-line executive summary (verdict, final dse sha, gate numbers vs baseline). Then: files
changed and why; every caller of the extract functions and how each is covered; any element where `prefs:`
would be written twice (SC-514); any SC-644 file overlap; `Drive-by fixes:` and `Follow-ups:` lists; every flake
re-run.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts only — verdict, dse branch head sha, commit list,
measured gate numbers, new test counts, new e2e ids — plus the absolute path of every evidence artifact you
produced (report, gate logs). No prose.
