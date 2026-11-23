# SC-644 r1 implementer brief — settings reach open blocks

Final text goes to the SC-644 ticket-owner, not a human. Raw facts only.

## 0. Context loading (do first)

- Read the ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/decisions.md`.
  It is the current state; this brief quotes it.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks`.
  Plugin: `…/draw-steel-elements`, branch `sc644-settings-reach-open-blocks`, cut from dse `develop` `941b814f`.
  Superproject branch `sc644-settings-reach-open-blocks` at workspace origin/main `016b1cdd`.
  First: `git -C <plugin> fetch origin` and confirm `origin/develop` is still `941b814f`; if it moved, rebase onto it and
  report the new base sha. Same for the superproject vs `origin/main`.
- **Never edit the shared main checkout** `/home/scott/code/steelCompendium/workspace/` (except writing your report into
  the ledger dir above). Workspace-level files you touch (CHANGELOG.md) live in YOUR worktree's superproject:
  `/home/scott/code/steelCompendium/worktrees/sc644-settings-reach-open-blocks/CHANGELOG.md`.
  The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`)
  is Scott's live vault and expected — do not report it.
- Use `git -C <absolute path>` for every git command; never `cd X; git …`. Verify `pwd`/paths before any write.
- **You never call the tracker (Linear)** — not to read history, not to post.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections "The battery, in order"
  (lines 1-133), "Devbox wrapping", "Stale main.js", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code
  footgun" (lines 134-241). It is ~370 KB: read in parts with `sed -n 'A,Bp' | cut -c1-1500`, never whole. Also
  `draw-steel-elements/AGENTS.md` and `draw-steel-elements/e2e/README.md` (known-bug rule, coverage gate).
- Prior art (landed): SC-440 ledger `docs/superpowers/dse-overhaul/build-ledgers/sc440-e2e-settings-tab-ledger.md`
  (settings e2e, `data-dse-control` ids, settings manifest, jsdom `test/dom/views/settings-matrix.test.ts`,
  `settings-integrity.test.ts`, helper `_settingsHarness.ts`).

## 1. The bug

Changing these settings does nothing to blocks already on screen; they only take effect when the note is reopened:

- **Collapsible by default** (`collapsibleDefault` pref) — an open stamina bar keeps its Collapse button.
- **Start collapsed** (`collapseDefault` pref).
- **Show edit button on rendered blocks** (`authoringControls` pref; only visible with the experimental switch on) — the
  pencil does not appear on open blocks.

Ticket's agent notes: `src/framework/pipeline.ts:623-624` reads collapsible / start-collapsed only when the chrome is
(re)mounted, and there is no `prefs.subscribe`; `pipeline.ts:595` is the same for `authoringControls`. The pipeline
comment saying a pref flip "triggers a rebuild" holds only for views that subscribe — correct that comment.

## 2. Required behaviour (quoted from the ledger)

> - O1. Switching "Collapsible by default" OFF on a block that is currently collapsed must
>   EXPAND it (a block with no Collapse control must never be stuck collapsed — the existing
>   collapse invariant). Switching it back ON leaves the block expanded. Block keys still win
>   over the global preference (SC-169 ladder: block keys > global prefs > built-in default).
> - O2. Pending Scott's answer on "Start collapsed", implement the recommended behaviour
>   (below) so an approval needs no extra round; keep the switch a small, isolated branch.
>   Recommendation put to Scott: flipping "Start collapsed" does NOT collapse or expand blocks
>   already on screen; it applies to blocks drawn afterwards (opening a note, re-rendering).

Also:
- "Show edit button" ON → the pencil appears on open blocks that qualify (same gate as today:
  `cx.host.canPersist && !def.noAuthoringButton && isAuthoringControlsOn(prefs)` — never on embeds/exports, never on
  `ds-hero`); OFF → it disappears. Both for chrome elements (pencil is a panel item) and non-chrome elements (card-corner
  pencil via `view.authoringAnchor()`).
- Rebuilding the chrome on a pref flip must NOT re-render the element body, must NOT lose the block's current
  collapsed/expanded state (except O1's forced expand), must not steal focus, and must keep the
  `ensureCollapseInvariant(root)` safety net.
- "Start collapsed" is an isolated branch: make it obvious in code where the "apply to open blocks too" alternative
  would go (one small conditional / one function), with a comment citing SC-644 and the pending decision.

## 3. Design constraints

- **Reusable mechanism.** SC-645 (the "Edit Recoveries with a popover" setting does not reach an open stamina bar) is
  queued next and should reuse what you build. Prefer one pipeline-level subscription to the prefs store that reacts to a
  declared set of keys, over three ad-hoc listeners. Do NOT fix SC-645 or SC-646 / SC-647 / SC-651 here — leave their
  `knownBug` markers untouched.
- **No leaks.** The subscription must be disposed when the view unloads (Component lifecycle / `register`). The shots
  run has host-leak gates (baseline host-leak 163/978, modal host-leak 40/240) — they must not move.
- Find how existing live-updating prefs are wired (reduce motion, fonts, rolling — `view.ts:47` mentions a child that
  subscribes to roll prefs) and mirror that pattern rather than inventing a second one.
- Check the settings-tab preview renders (`settings-preview`) still behave.
- No change to `styles.css` is expected. If you change CSS or anything that moves frozen print bytes, STOP and report
  (freeze rule: never touch the shared baseline).

## 4. Tests

- Flip the two e2e markers to plain tests (delete the `knownBug` wrapper and its `failsWith`, keep the `[SET-L01]` /
  `[SET-G06]` ids and wording): `e2e/specs/settings/live-behavioural.e2e.ts` (`SET-L01`), `e2e/specs/settings/gate-on.e2e.ts`
  (`SET-G06`). Make `SET-G06` assert both directions if cheap (on → appears, off → disappears).
- Add e2e tests (new unused `SET-*` ids; grep first — scenario ids are GLOBAL across all specs):
  (a) Collapsible by default OFF on a block that is collapsed → it expands and the Collapse button is gone (O1);
  (b) Start collapsed ON with a note open → the open block stays expanded; reopening the note → the block is collapsed (O2).
  Never put a bracketed TICKET id (e.g. `[SC-644]`) in a test title — the runner reads titles for scenario ids. A plain
  `SC-644` in a comment is fine.
- jsdom tests for the pipeline mechanism: each pref flip on an open block (chrome and non-chrome element), block key
  overriding the pref, forced expand per O1, collapse state kept on unrelated remount, subscription disposed on unload
  (flip after unload does nothing / no error), embed/canPersist=false never gets a pencil. Mutation-check your key
  tests (break the product line, see red, restore) and list the mutants in your report.
- Expected new coverage pairs: probably none (same controls, new tests). If the coverage count moves, explain why.

## 5. Gates (dse-verify battery, full)

Baselines at `941b814f`:
jest **12875 passed / 1 skipped** with the shots cache (fresh worktree 12874 / 2) · lifecycle **64/64** ·
e2e **`560/586 ok, 0 failed, 26 known-bug, coverage: 416/416 pairs`** · shots **592**, host-leak **163/978**, modal
host-leak **40/240**, capture clip **147** · freeze **280/280** · parity **0 / 0 / 24**.

Expected after your change: jest = baseline + your new tests; lifecycle 64/64; e2e known-bug **24** (26 − 2), ok and total
up by your new tests, 0 failed, coverage Y/Y; shots/freeze/parity unchanged.

Battery mechanics (all of these have bitten someone):
- `npm ci` through devbox first (fresh worktree has no node_modules): `devbox run -c <plugin abs path> -- npm ci`.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (use literal absolute paths).
- Devbox: `devbox run -c <plugin abs path> -- bash -c '…'`; never `cd` inside a compound command. Devbox eats `$?`: run each
  gate through a SCRIPT FILE (`devbox run -c <path> -- bash <script>`) that writes `rc=$?` to a unique file, and read each
  gate's own summary line as the truth. No `| tail` on a gate.
- Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign; with a space the runner silently runs the whole ~30 min
  suite — check the log's first lines list only that part's ids). Comma-separated:
  1. `G-S7a … G-S9a` (21) — take the exact list from the SKILL / the runner's SCENARIOS order
  2. `G-S9b … G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4)
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3; about 200 s)
  G-S56 stays LAST in SCENARIOS order. One part per Bash call, output to a unique log. The Bash tool backgrounds any call
  over 180 s: for part 7 (and any slow part) start it with output to a log, then poll with
  `timeout 175 tail --pid=<your node pid> -f /dev/null` on YOUR OWN pid (`/proc/<pid>/cwd` is your worktree), then read
  the log. Report the union.
- e2e full run 320-460 s: same — log to a unique file, poll your own pid, read the `OBSIDIAN-E2E done:` line.
- shots can pass 600 s under load: log + rc file, poll.
- Known flakes: G-S91 FAIL is a real signal unless the line says the host was too slow after two re-runs. G-S115 (g) is a
  suspected flake (SC-633): re-run part 7 once on a loaded host; any other failure is real. INIT-W10 e2e flaked once under
  heavy load (SC-654). SC-622: the Obsidian camera tool can leave `demo-vault/.obsidian/appearance.json` dirty, which made
  G-S97 fail — `git -C <plugin> checkout -- demo-vault/.obsidian/appearance.json` before blaming your change.
- Jest's timeout is 30 s (SC-568): an "Exceeded timeout" is a real hang until proven otherwise; re-run that suite alone.

## 6. Commits

- Commit inside the plugin after every coherent step (message prefix `fix(SC-644):` / `test(SC-644):`).
- Superproject: one commit for the CHANGELOG bullet under `## Unreleased` in YOUR worktree's `CHANGELOG.md` (follow the
  SC-643 / SC-440 bullets' style: plain words, what the user sees), then exactly ONE pointer-bump commit
  `chore: bump draw-steel-elements to <sha> (SC-644)` at the very end, after your last plugin commit. No interim pointer
  commits. The superproject branch must sit on current workspace origin/main. Do NOT push anything. Do NOT run
  `just wt-finish` / landing.
- Commit messages: no Claude/AI attribution or Co-Authored-By trailers (Scott's global rule).
- Do not edit `.claude/skills/dse-verify/SKILL.md`. If its numbers should change, put the proposed text in
  `<ledger dir>/sc644-skill-proposal.md`.

## 7. Safety footguns (each has cost real time)

- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, never a glob, never a path built from a
  shell variable. Leave throwaway files in place; overwrite with `>`. (The one allowed `rm` is the literal
  `rm -f <plugin abs path>/main.js <plugin abs path>/styles.css` before jest.)
- Never `pkill` / `killall` by pattern. Kill only by PID whose `/proc/<pid>/cwd` is inside your worktree.
- Scratch: a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc644-r1-impl/`
  with uniquely named scripts/logs. Write scratch files with the Write tool, not heredocs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and
  branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Run gates as blocking calls you poll yourself; never wait for a background-completion notice (it never wakes you).
- Never `--headed` e2e; never use `DISPLAY=:1`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to the dispatcher. If you
  need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message,
  its FIRST WORD must be `SC-644:`.

## 8. Report

Write `<ledger dir>/sc644-r1-impl-report.md` (ledger dir =
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc644-settings-reach-open-blocks/`). It must OPEN with a
≤10-line executive summary: verdict, dse head sha + base, superproject head sha + base, every gate number vs baseline.
Then: design (the mechanism, where it lives, how SC-645 would reuse it, where the O2 switch is), files changed, tests added
(ids), mutants run and their result, `Drive-by fixes:` (already made, local, obviously correct), `Follow-ups:` (left alone).
If the report write is blocked by your harness, return the report inline.

Your final text: the same executive summary plus the absolute path of every evidence artifact (report, gate logs).
