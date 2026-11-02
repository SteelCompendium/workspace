# SC-481 r2 — implement Option 1 (identical twin blocks: no vanish, no wrong value, no wrong-block write)

You are the implementer for ticket SC-481. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading
- Ledger (read first; rulings are there): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/decisions.md`
- Diagnosis report (your spec — read §1–§3 in full): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r1-diag-report.md`
- The diagnosis worker's real-Obsidian probe kit (fixtures, scenario injection, the in-page prototype of the fix, extracted Obsidian app.js): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r1-diag-a69a8a02591085ed8/` (`scripts/`, `run6/p481-proto.json`, `harness/obsidian-lifecycle-p481.mjs`, `sc481-run.sh`). Reuse it for your red/green probes and for designing G-S53.
- SC-518 (landed; twin focus handling you must keep green): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc518-form-save-focus/decisions.md` (MEDIUM-1).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the battery, its order, command shapes, freeze/parity rules.
- Plugin guidance: `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements/AGENTS.md` (if present) and the plugin's test conventions.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish`; plugin `.../draw-steel-elements` on branch `sc481-twin-block-vanish`. Verify `pwd`-equivalent before any write: every path you write starts with `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/`. First: `git -C <plugin abs path> fetch origin` and confirm `origin/develop` is still `9be397e`; if it moved, rebase onto it and note the new sha. Run `npm ci` if `node_modules` is missing or `package.json` changed.
- The workspace-level `CHANGELOG.md` you edit lives in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`. The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.

## 2. The task
Owner rulings (verbatim from the ledger, 2026-10-29):
- "Adopt Option 1. Option 2 (private renderer API) only as a fallback if Option 1's remount fails a gate; Option 3 rejected (leaves wrong-block writes)."
- "Scope: the vanish AND the wrong value AND the wrong-block write, Reading view + Live Preview — one root cause. Sidebar out of scope (not affected)."
- "No SC-480 park: independent, proceed." — do NOT change how `locateByBody` / `resolveWriteTarget` choose among several equal bodies (that is SC-480, parked on Scott). Out of scope.

Implement Option 1 as the report specifies (§3 "Option 1": (a) adoption-path remount into the element the root left if Obsidian still uses it; (b) on every processor call, release + remount any live view of the same doc/path whose plain-fence element now resolves to a body different from its known body; the claim guard at `viewRegistry.ts:177` uses the line where the write landed). Deviate only with a reason written in your report. If Option 1 cannot be made to pass a gate, stop and return STATUS: NEEDS_CONTEXT with the evidence before reaching for Option 2.

Order:
1. **Red first.** Jest cases that fail on 9be397e: the twin element-reuse shape (old upper root/element left connected at the twin's position) → after the processor call each element shows its own block's value, a write from the twin's card lands in the twin's block, no element is left empty; 3 twins; the false-collision guard line; non-twin notes never trigger the remount (no extra renders); quote/callout window sections skipped. Commit the red tests.
2. **Fix.** Commit.
3. **Lifecycle G-S53** in `visual-harness/obsidian-lifecycle.mjs`, per the report's "G-S53 (lifecycle) asserts" list (Reading view 2 twins upper-then-lower; 3 twins; montage; adoption off; form Save upper then lower click; Live Preview upper-then-lower). Asserts: DOM card count == block count, each card's displayed value equals its block on disk per position, a lower click changes only the lower block, the note equals the fixture with exactly the intended changes. Prove it FAILS on a 9be397e bundle and PASSES on HEAD. Commit.
4. **Integrity probes** (real Obsidian, report the numbers): content above, between and below the twins survives byte-for-byte; two different-body blocks still keep 2/2 with no extra remounts; a hand edit to one twin, then a click, survives; deleting one twin then clicking the other gives the right result; SC-518 keyboard Save on the upper twin still ends focus (with ring) on the edited card's pencil; scroll stays put (tall note, scrollTop before/after).
5. **Mutation checks:** disable (a), disable (b), revert the guard-line change — each must be caught by at least one jest case or G-S53 phase. Report which.
6. **CHANGELOG** bullet under `## Unreleased` in the worktree superproject (user-facing, plain words: with two identical blocks in a note, editing one no longer makes the other disappear, show the wrong number, or write into the first block). Commit in the superproject. Do not bump the superproject's submodule pointer.

Commit after every coherent step; never leave work uncommitted through a gate.

## 3. Gates (dse-verify battery, in its order, on your final HEAD)
Expected (CURRENT @ 9be397e, plus your additions):
- tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean
- jest **6148 + your new cases passed / 1 skipped / 248 of 249 suites (+1 if you add a suite)** — after a shots run (fresh worktree reads one fewer / 2 skipped until shots has cached `visual-harness/dist/obsidian-app.css`)
- lifecycle **42/42** (41 + G-S53), as two `--only` halves (21 + 21) in two separate foreground calls; G-S50, G-S8, G-S15, G-S42, G-S1..G-S6i, G-S7a/b must stay green
- e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`**
- shots **592**, 0 FAIL, button host-leak 145/870, modal 228, input 15/176, checkbox 7/116, prose 106 [212]
- freeze **280/280** (no rebaseline expected; if frozen bytes move, stop and report — never touch the shared baseline)
- parity **0 GAPs / 0 undeclared / 24 DECLARED**
Known flakes: jest timeout at initiative-default-keys under load (SC-506); e2e CHR-L01 panel-reveal timeout (SC-529); shots montage wheel check (SC-521). Re-run once and report both runs if one appears.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc481-twin-block-vanish/sc481-r2-impl-report.md`, opening with a **≤10-line executive summary** (verdict, HEAD sha, superproject sha, gate numbers, red→green proof). Gate logs as `sc481-r2-gate-<name>.log` in the same dir. 1–2 after-fix screenshots of the twin note (Reading view) as `sc481-r2-*.png` there.

## 5. Return contract
Final text: raw facts, no prose — verdict, commit shas (plugin + superproject), measured gate numbers, red/green and mutation results, `Drive-by fixes:` and `Follow-ups:` lists, and the **absolute path of every evidence artifact**.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Every gate is ONE blocking foreground Bash call under 600 s. No `run_in_background`, no Monitor, no background jobs. Lifecycle = two `--only` halves in two calls.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc481-twin-block-vanish/draw-steel-elements -- bash <script file>`. Never `cd X && …` compound commands. `git -C <abs path>` for every git command. Devbox eats `$?`: record exit codes inside a script file and read each gate's summary line; never pipe a gate into `tail`.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc481-r2-impl-<your agentId>/` with uniquely named scripts/logs. Use the Write tool for scratch files (no heredocs). No `rm` with a shell-variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only a PID you started whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree or scratch. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`); delete only paths you created and recorded. Never touch the shared `.superpowers/` dir beyond your own `sc481-` files; never edit `.superpowers/sdd/freeze-baseline.sha256`.
- Use a unique `DSE_LIFECYCLE_PORT` (e.g. 93xx) for probe runs.
- ⛔ Never create a tag or release on draw-steel-elements. Never push; the dispatcher lands.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-481:`.
