# SC-580 r1 — implementer brief

Your final text goes to the SC-580 ticket-owner, not a human. **Workers never call the tracker**
(Linear) — not to read history, not to post.

## 1. Context loading

- Read first: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/decisions.md`
  (the ledger; it outranks anything else you read about this ticket).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc580-conditions-type-to-search`.
  Plugin: `…/sc580-conditions-type-to-search/draw-steel-elements`, branch
  `sc580-conditions-type-to-search`, at develop `3ad68185`. Before starting:
  `git -C <plugin path> fetch origin` and confirm `origin/develop` is still `3ad68185`; if it moved,
  `git -C <plugin path> rebase origin/develop` and say so in your report (then `npm ci` if
  `package.json`'s obsidian version changed).
- **Verify `pwd`/paths before every write. Never write anything under
  `/home/scott/code/steelCompendium/workspace/`** except your report files in the ledger dir.
  The workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
  `/home/scott/code/steelCompendium/worktrees/sc580-conditions-type-to-search/CHANGELOG.md`.
  The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked
  `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, ignore it.
- Read `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` sections
  "The battery, in order", "Devbox wrapping", "Stale main.js", "Load-sensitive jest suites",
  "Lifecycle and e2e notes", "THE exit-code footgun", and the CURRENT block of "Current expected
  numbers". It is ~370 KB: read it in parts (sed -n ranges / grep), never whole.
- Prior art in this window (landed; ledgers in
  `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`):
  SC-431 (Escape in the Add search: `sc431-escape-field*`), SC-603 (focus hand-back:
  `sc603-focus-after-pool-apply*`), SC-436 (the e2e rollout that found this: `sc436-e2e-conditions-modal*`).

## 2. Task

The bug: `draw-steel-elements/docs/initiative-tracker.md:430` says "Click '+ Add condition' (or
just start typing) to open the type-ahead search." Typing does nothing: with focus on
"+ Add condition", typing `daz` leaves the window unchanged. Cause: `src/views/ConditionsModal.ts`
`onOpen` has no window-level keydown handler that routes printable keys to the Add input.

Ledger decision (owner, 2026-11-12): **Add the key handler** — make the documented behaviour real,
do not retract the doc.

Behaviour spec:

1. While the Conditions window is open, a keydown that originates **inside this modal** and whose
   target is **not a text-entry control** (input, textarea, select, contenteditable) and that is a
   **printable character** — `evt.key.length === 1`, not a space, no Ctrl / Meta / Alt (Shift is
   fine), not `evt.isComposing` — opens the Add search by the same path a click on
   "+ Add condition" takes, with that character in the input and the dropdown filtered by it.
   Typing `daz` quickly (no pause) must end with `daz` in the input and Dazed offered — the 2nd and
   3rd keys must not be lost or doubled. If the Add search is already open but focus is elsewhere
   in the window, the key goes to the end of the input and focus moves there.
2. Do not take keys away from anything that owns them: Space / Enter on a focused button, Tab,
   arrows, Escape (SC-431's escape consumer must behave exactly as today), any select's own
   type-ahead (duration pickers), any modifier chord (Obsidian hotkeys), and keys that originate in
   another modal stacked above this one.
3. Register the listener through the modal's existing lifecycle/registration helper so it is
   removed on close; no listener on `document`/`window` that survives the modal.
4. Prove in **real Obsidian** that Obsidian's keymap/Scope delivers the key (the jest comment at
   `test/dom/views/conditions-modal-matrix.test.ts:569` says this needs Obsidian's real keymap). If
   a DOM listener does not receive it in real Obsidian, use the modal's `scope` instead, and say
   which you used and why.

Tests:

- e2e: `e2e/specs/conditions-modal/cond-integrity.e2e.ts` — turn the `knownBug('SC-580', '[COND-N07] …')`
  marker into a regular passing test (drop the "no control is meant to handle it yet" comment);
  extend it to type `daz` and assert Dazed is offered and the input reads `daz`. Add negative e2e
  coverage for at least: Space on the focused "+ Add condition" button (does whatever it did before;
  does not type a space into a search), and a Ctrl/Meta chord (does not open the search). If the e2e
  coverage manifest needs a new control×key pair for this, add it. **Never put a bracketed ticket id
  (e.g. `[SC-580]`) in a test title — the runner reads bracketed ids as scenario ids.** Scenario ids
  are global; pick fresh `COND-Nxx` ids that grep shows unused.
- jest: unit coverage in `test/dom/views/conditions-modal-matrix.test.ts` (or a sibling) for the
  routing rules above (printable opens; space/modifier/select/input/other-modal do not; already-open
  appends), and update the comment at line 569.
- No lifecycle scenario is expected. If you find you need one, use id `G-S100` and stop to report
  first (STATUS: NEEDS_CONTEXT) — part placement has rules.
- Docs: `docs/initiative-tracker.md` already claims the behaviour; tighten its wording only if the
  final rule differs (e.g. "start typing a condition's name"). Add a `## Unreleased` bullet to the
  worktree superproject's `CHANGELOG.md` (user-facing words: typing a letter in the Conditions
  window now opens the Add search with it typed).

Out of scope (other tickets, same window — do not fix even if you see them): SC-581, SC-582,
SC-583, SC-585, SC-586, SC-587. Report anything else you notice under `Follow-ups:`; fix in place
only obviously-correct, local, gate-neutral things and list them under `Drive-by fixes:`.

Commit after every coherent step on the plugin branch (and the CHANGELOG in the worktree
superproject branch); nothing may sit uncommitted through a gate. Do not push. Do not tag anything.

## 3. Gates (dse-verify, full battery, in order) and expected numbers

Baseline at `3ad68185`: tsc + lint clean · jest **10676 passed / 2 skipped** in a fresh worktree
(10677 / 1 once shots has cached its css) · lifecycle **59/59** · e2e
**`OBSIDIAN-E2E done: 278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`** · shots **592**,
`button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)`
· freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after your change: jest up by your new tests; lifecycle 59/59 unchanged; e2e **0 failed,
3 known-bug** (SC-257, SC-355, SC-384), ok count up by COND-N07 plus your new tests, coverage
`Y/Y` with Y = 171 or 171 + your new pairs; shots 592 and freeze 280/280 unchanged (if a frozen
byte moves, stop and report — do not touch the baseline); parity 0/0/24.

Lifecycle runs in SIX `--only` parts (comma-separated ids), one Bash call each, output to a log:
1. `G-S7a … G-S9a` (21) 2. `G-S9b … G-S40` (16) 3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4) 5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7) 6. `G-S92,G-S96` (2).
Take the exact id lists for parts 1 and 2 from the dse-verify battery row (it lists the SCENARIOS
order) — do not invent them. Report the union.

Rules for running gates:

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc580-conditions-type-to-search/draw-steel-elements -- bash <script>`.
  Never `cd` inside a compound command; never trust an echoed `$?` inside `bash -c`; record exit
  codes from a script file and read each gate's own summary line. No `| tail` on a gate.
- `rm -f main.js styles.css` in the plugin root (literal absolute paths) before `npx jest`.
- On a timeout-shaped jest red in a load-sensitive suite, check `/proc/loadavg` and re-run the suite alone.
- The Bash tool backgrounds any call over 180 s and notifies on completion. Run each gate as one call
  with output redirected to a unique log; if it gets backgrounded, wait with
  `timeout 175 tail --pid=<your pid> -f /dev/null` on YOUR OWN pid (check `/proc/<pid>/cwd` is in your
  worktree) and then read the log. Never key a wait-loop on a scratch filename or its contents — the
  scratch dir is shared across sessions and branches; read the process's own output at a per-run unique path.
- Redirect long-running output to files; never stream it (the 600 s stream watchdog kills silent agents).
- Scratch: use a private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc580-r1-impl/`
  with uniquely named scripts and logs. Write scratch files with the Write tool.
- **Never `rm -rf` a `/tmp` glob or any shared dir; never `rm` with a shell-variable path; never
  `pkill`/`killall` by pattern** — kill only a PID whose cwd/command line is in your worktree.
  Never delete anything under `.superpowers/` except files you created.
- Use `git -C <absolute path>` for every git command.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc580-conditions-type-to-search/sc580-r1-implementer-report.md`,
opening with a ≤10-line executive summary (verdict, branch sha(s), every gate number). Copy gate
logs next to it as `sc580-r1-gate-<gate>.log`. If the report write is blocked by your harness,
return the report inline.

## 5. Return contract

Final text: raw facts, no prose — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin branch sha,
superproject branch sha, every gate's measured number vs. the expected above, keyboard mechanism used
(DOM listener vs scope) with the real-Obsidian evidence, `Drive-by fixes:`, `Follow-ups:`, and the
absolute path of every artifact (report, logs, screenshots).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent by any name, and
`to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with
STATUS: NEEDS_CONTEXT and the question. If you ever do send a message anyway, its first word must be `SC-580:`.
