# SC-638 r2 — independent adversarial review: negotiation wrong-type values

You review work you did not write. Execute and probe — do not just read.

## 1. Context loading

- Ledger (binding rulings R1–R4, Scope, Markers):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/decisions.md`.
- The implementer's report (read its executive summary and the input table; treat its claims as claims to check):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/sc638-r1-implementer-report.md`.
- **You never call the tracker (Linear).**
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values`, plugin
  `/home/scott/code/steelCompendium/worktrees/sc638-negotiation-wrong-type-values/draw-steel-elements`, branch
  `sc638-negotiation-wrong-type-values`. Diff under review: `git -C <plugin> diff afd1436c..HEAD` (dse) and the
  superproject CHANGELOG commit(s) on `git -C <worktree> log origin/main..HEAD`. The dse base is now `afd1436c` (diff `afd1436c..HEAD`, compare base behaviour against `afd1436c`, not `620d5774`). Head sha to review: `daf75fc5`.
- **Do not commit to the branch.** Probes go in a private scratch dir:
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc638-r2-review/`.
  If you need to edit source for a mutant, do it in a separate `git worktree add` of the plugin repo at an absolute
  path inside that scratch dir (made with `git -C <plugin> worktree add <abs path> HEAD`), never in the branch's tree.
  node_modules: symlink or `npm ci` there.
- dse-verify skill (battery, command shapes, flakes):
  `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` lines 20-244 (`cut -c1-2000`).

## 2. What to check

1. **Every input in the ledger's Ticket section** (case 1, case 2, and the three from the SC-637 owner's comment):
   render it (jsdom harness or a scratch unit/jsdom test) and confirm the R1/R3/R4 outcome. No raw JS message
   (`is not a function`, `Cannot read properties`, `_a.`, `_g.`, `undefined`) on any card.
2. **Hunt for inputs the implementer missed**: other wrong types in every key the negotiation reads (`initial_*`,
   `current_*` as maps/lists/booleans/null/`.nan`/`Infinity`, `hasBeenAppealedTo: "yes"`, `lieUsed: 1`, `i3: [a]`,
   `reusedMotivation: "no"`, a motivation named `"5"` vs `5`, duplicate names, empty-string names). Any remaining raw
   error or data loss is a finding; anything ruled out of scope by the ledger is not.
3. **R2 integrity** — untouched values round-trip by value AND type on every write path (seal clicks, chips, Complete
   Argument, Reset, the sidebar host `SidebarBlockHost.ts`). SC-637's unknown keys still survive every path. Content
   above/below the fence survives; two blocks in one note do not cross-talk; a hand-edit after a write is not undone
   by the next write. Check that whatever holds the typed value cannot be serialized as an extra key or shadow a field.
4. **R4** — one shared reading of a standing; seal and ending agree for 0.4, 0.5, 4.5, 4.49, -1, 7, "3", banana, null,
   true. The drawn seal is unchanged from base for every one of these (compare against `afd1436c`).
5. **Tests are not vacuous**: mutate the fix (revert R4's shared reading, drop the item-shape check, coerce-and-write
   strings in R2) in your scratch worktree and show the new tests go red. Confirm the flipped markers (NEGO-W02, W03,
   K03, K04) assert what the ledger says and that no assertion was weakened to pass.
6. **Gates**: re-run tsc, lint, jest, and the full e2e yourself (`0 failed`, coverage Y/Y; expected on `afd1436c`: known-bug 21, ok 576, total 597, coverage 416/416 — ledger "Baseline moves").
   Lifecycle only if the diff touches anything a lifecycle scenario drives beyond the negotiation model (say which).
   Lifecycle is SEVEN parts with `--only=A,B,C` (equals sign); ids in dse-verify.
7. **Shared e2e driver change**: r1 changed `e2e/driver/dse.ts` `openNote` to count a card carrying
   `data-dse-error-stage` as drawn. Check it cannot turn a real regression (a block that should render but now errors)
   into a green test elsewhere — e.g. does any non-error test still assert content after `openNote`? Probe one.
8. **Ruled for you to probe** (ledger, r1 follow-up 2): wrong types in non-text fields (`initial_patience: [1]`,
   `hasBeenAppealedTo: maybe`, `lieUsed: 1`, `current_interest: {a: 1}`). Raw JS error or data loss on a write = a
   finding; reads oddly but agrees with R4 and round-trips = INFO only.
9. Top-level non-map block (`hello`, a list, `42`) shows a plain error and writes nothing; an empty / comment-only
   block is still refused exactly as on base (SC-493 contract; ledger supersedes the "fresh default" line). The fix
   round will replace its raw message with a plain one (already ruled) — note it, it is not a finding.
10. CHANGELOG bullet is user-facing and accurate; `e2e/README.md` fixture rows updated; no bracketed ticket id in any
   e2e test title; commit messages carry no AI attribution.

## 3. Footguns

- Devbox: `devbox run -c <plugin abs path> -- bash <script file>`; `$?` echoed inside `bash -c` is always 0 — read each
  gate's own summary line. Never pipe a gate into `tail`. `git -C <abs path>` for every git command; never `cd` in a
  compound command.
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad**, no `rm` with a shell variable, no glob
  `rm`. Leave throwaway files in place. The only allowed `rm` is the literal
  `rm -f <your scratch worktree abs path>/main.js <same>/styles.css` (or the branch tree's two literal paths) before jest.
- Never `pkill`/`killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your own tree.
- Any Bash call over 180 s is backgrounded by the tool: start long gates with output to a unique log, poll your OWN pid
  with `timeout 175 tail --pid=<pid> -f /dev/null`. No `Monitor`, never wait for a completion notice. Never key a wait on
  a scratch filename from another run.
- Known flakes: G-S91 (real unless "host too slow" after two re-runs), G-S115 (g) one re-run of part 7, INIT-W10 e2e
  under heavy load (re-run alone once), G-S97 after a dirty `demo-vault/.obsidian/appearance.json` (restore it first).
  Jest "Exceeded timeout" is a real hang until proven otherwise.
- `grep` is ugrep and skips `e2e/run.mjs` as binary: `command grep -a`.
- Never write under `/home/scott/code/steelCompendium/workspace/` except your report.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. If you need input, end with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a
  message anyway, its FIRST WORD must be `SC-638:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc638-negotiation-wrong-type-values/sc638-r2-review-report.md`,
opening with a ≤10-line executive summary (verdict LAND / FIX, counts by severity, gate numbers you measured). Then
findings by severity (HIGH / MEDIUM / LOW / INFO), each with file:line, a failure scenario (exact YAML + action), and
a prescribed fix. Then probes run and mutants tried (with results).

## 5. Return contract

Your final text goes to the ticket-owner, not a human: verdict, finding counts by severity with one line each, measured
gate numbers, and the absolute path of every artifact (report, logs, probe files).
