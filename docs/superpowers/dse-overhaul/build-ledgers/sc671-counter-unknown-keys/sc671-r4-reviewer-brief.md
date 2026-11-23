# SC-671 r4 — independent review brief: counter writes keep YAML keys the counter does not know

You are an independent, adversarial reviewer. You did not write this code. **Execute and probe — do not just read.**

## 1. Context loading (do this first)

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/decisions.md`
  (owner rulings are binding — the review checks the code against them, and may also challenge a ruling: say so as a
  finding).
- r1 implementer report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r1-implementer-report.md`
  (read the executive summary and the design / enumeration sections; treat its claims as unverified).
- r3 rebase report (executive summary): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r3-rebase-report.md`.
  The four commits were rebased `129beb18` -> `bdf0255e` with no conflict (range-diff: four `=`). An earlier review round
  (r2) was dispatched on the pre-rebase head and died without a report — you are the first reviewer of this code.
- **You never call the tracker (Linear)** — not to read history, not to post.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys`, plugin at
  `/home/scott/code/steelCompendium/worktrees/sc671-counter-unknown-keys/draw-steel-elements`, branch
  `sc671-counter-unknown-keys`. Head under review: dse `16cbd05f` on develop `bdf0255e`; superproject
  CHANGELOG commit `cd79d841` + pointer bump `cfd52772` (on `8e7a7bbe`). Run `git -C <plugin abs path> fetch origin` and report whether `origin/develop`
  is still `bdf0255e` (do not rebase).
- **You do not change the branch.** No commits, no edits to tracked files in the worktree. Probes (temporary test
  files, mutants, scratch fixtures) go in a scratch clone you make with
  `git -C <plugin abs path> worktree add --detach <your scratch dir>/dse-probe 16cbd05f` (an absolute path under
  your private scratch dir; `npm ci` there, or symlink nothing — a real install). Leave the probe worktree registered
  and say so in the report; do not `rm` it.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is
  Scott's live vault — expected, not yours, don't touch or report it.
- Gate reference: the `dse-verify` skill, `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`
  lines 20-246 (very long lines; read in parts with `cut -c1-2000`) and the CURRENT paragraph at line 1534.
- Prior art for comparison: montage `src/elements/montage/model.ts` (SC-625), negotiation
  `src/model/NegotiationData.ts` + `src/elements/negotiation/model.ts` (SC-637), `src/elements/shared/undeclaredDefaults.ts`
  (SC-482), the reserved wrapper keys in `src/framework/` (SC-652).

## 2. What to review

The diff `bdf0255e..16cbd05f` in the plugin, and the superproject CHANGELOG bullet. The ticket: pressing − or +
on a `ds-counter` deleted every key the counter does not know (`note_to_self: keep me`, `extra: {a: 1}`).

Check the code against each owner ruling in the ledger (Not SC-599 / Placement / "Known" / SC-482 intact / Every
write path / No shadowing / Scope / SC-442 overlap). Then try to break it. This change writes into user files, so the
integrity probes are mandatory — run each as a real test (jsdom or e2e), not by reading:

1. Content above and below the fence survives a write; so does a second, unrelated block in the note.
2. Two `ds-counter` blocks in one note, each with different unknown keys (and one pair of IDENTICAL twins): a press on
   one never changes the other's bytes and never moves a key across.
3. Hand-edited content survives a re-trigger: outside edit adds / removes / changes an unknown key, then a press —
   the outside edit wins, nothing stale comes back. Also: outside edit lands while a press's write is pending.
4. A block the user deletes and re-creates, or a counter with no unknown keys, is written byte-identically to
   `bdf0255e` (SC-482 behaviour unchanged; compare the two builds' output on the same sources).
5. Every write path the implementer enumerated — and any it missed (find them yourself: grep the view, the sidebar
   host, the stepper kit, the block edit form path for a schema-less element, undo paths) — keeps the keys.
6. Hostile and odd keys: `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON`, `valueOf`, a key equal to
   a Counter field in another case, an integer-looking key, an empty-string key, a key with a `null` / list / deep map
   value, a YAML merge key / anchor-alias (`&a` / `*a`) value, a duplicate of a known key in the source, very large
   values. No prototype pollution, no crash, no key dropped or doubled.
7. Reserved wrapper keys (`prefs`, `collapsed`, `collapsible`, `collapse_default`, incl. the SC-652 unusable forms)
   next to unknown keys: each written exactly once, in today's place. `_dse_anchor` (pinned sidebar): written once,
   and the pinned card still finds its block after a write (SC-662's "Backing block not found" must not return).
8. A non-map body (`hello`, a list, an empty block): behaviour identical to `bdf0255e` (that is SC-672 — not fixed
   here, but must not get worse or change shape).
9. Mutation check: break the fix in two or three plausible ways (drop the carry, write extras before known keys,
   carry a known key as unknown) and confirm the new tests go red. State how many of the new tests fail on
   `bdf0255e`. Look for vacuous tests (assertions that pass on the base, or that never reach the write).
10. **SC-442 cross-check.** SC-442 (unlanded, test-only) is an independent counter test suite. Its branch head
    `ed7130d9` lives in the clone at
    `/home/scott/code/steelCompendium/worktrees/sc442-e2e-counter-topup/draw-steel-elements` (READ-ONLY for you — never
    write, run or build there). In your probe worktree: `git fetch <that abs path> sc442-e2e-counter-topup` (confirm
    the fetched sha; if it is no longer `ed7130d9`, use what is there and say so), merge it onto `16cbd05f` in the
    probe only, and report: (a) does it merge cleanly — list every conflict; (b) run SC-442's counter jsdom suites
    (`counter-matrix`, `e2eCensus`) and its counter e2e specs plus this branch's new ones — the expected result is
    that ONLY the `knownBug('SC-671', '[CTR-U01] …')` marker changes outcome (reports as an unexpected pass / stale
    marker), and that flipping it to a plain test is green; (c) any plain SC-442 test that this change turns red;
    (d) duplicate scenario ids or fixture-census clashes between the two branches.
    Note: SC-442's branch still sits on the OLD base `129beb18`, three landings behind `bdf0255e` (SC-675, SC-434,
    SC-641 each touched e2e files). A merge conflict or red that comes from those landings and not from this branch's
    files is SC-442's own rebase work: list it in one line and move on. If the merge is too tangled to finish in about
    20 minutes, do the cross-check the cheap way instead: copy SC-442's counter fixture `unknown-keys.md` and its
    CTR-U01 scenario body into the probe as a plain test and run only that.
11. CHANGELOG bullet: plain words, accurate (keys are kept with the same VALUES; must not claim formatting, comments
    or quote style are kept — SC-599), under `## Unreleased`, in the worktree's superproject only.

12. **Bounded side probe (does not affect the verdict; stop after about 20 minutes of work on it).** r1 suspects the
    other persisted elements drop unknown keys the same way. In the probe worktree only, write ONE throwaway jest file
    that, for every registered element definition with `shape: 'persisted'` (or however the registry marks an element
    that writes), runs the model round trip `serialize(parse(data, raw))` on that element's own `example.yaml` plus
    one extra top-level line `note_to_self: keep me`, and prints a table: element id · key kept / dropped / parse
    throws. Model level only — no views, no UI, no fixes, no per-element digging. Put the table in the report under
    `Follow-ups:`; the owner files the ticket.

## 3. Gates — re-run them yourself on `16cbd05f` (in the worktree; it is clean and you leave it clean)

Expected: tsc and lint clean · jest `**13890 passed / 2 skipped** fresh (13891 / 1 once a shots run has cached `visual-harness/dist/obsidian-app.css`)` · lifecycle **64/64** (seven `--only=` parts) · e2e
`**`OBSIDIAN-E2E done: 664/671 ok, 0 failed, 7 known-bug, coverage: 418/418 pairs`**` · `styles.css` sha256 identical to a clean `bdf0255e` build (then shots / freeze / parity carry;
if it differs, run them: shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280,
parity 0/0/24).

- Lifecycle parts, one per Bash call, `--only=` with an EQUALS sign (a space runs the whole suite):
  1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
  2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
  3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
  4. `G-S57,G-S62,G-S61,G-S56` (4) — G-S56 stays LAST
  5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
  6. `G-S92,G-S96,G-S97,G-S99` (4)
  7. `G-S108,G-S112,G-S115` (3)
- **G-S61 (part 4) has a known flaky red, SC-668:** "the recorder's disk read was torn in N frames in a row, so its
  stale-frame check did not run (0 frame(s) …)". r1 saw it on the old base and on the branch; r3 saw G-S61 GREEN on
  `16cbd05f`. A G-S61 FAIL with exactly that torn-read line and 0 stale frames is SC-668 — re-run part 4 once, report
  it as such with the load average (`cat /proc/loadavg`); do not chase it. Any OTHER G-S61 assertion (a stale frame, a
  card that did not match its block) is real: G-S61 drives two counters, which this change touches.
- The Bash tool on this host backgrounds a call after about 120 s (r1 and r3 measured): poll with
  `timeout 100 tail --pid=<pid> -f /dev/null`.
- r3 left a registered scratch worktree of clean `bdf0255e` at
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r3-rebase/base-bdf0`
  (clean base build). You may use it read-only as the base for comparisons (item 4, item 8) if it is still there; if
  not, make your own `base-bdf0` next to your probe. Do not delete either. Two older registrations
  (`…/5812b474…/sc671-r1-impl/base-129`, `…/5812b474…/sc671-r2-review/dse-probe`) are stale `prunable` entries — leave
  them, do not run `git worktree prune`.
- **Scope of your gate re-run:** r3 measured the full battery green on this exact head (tsc, lint, jest 13890 / 2,
  lifecycle 64/64, e2e 664/671 ok / 0 failed / 7 known-bug / 418/418, styles.css = clean base). You re-run, yourself,
  in the worktree: tsc, lint, the FULL jest, lifecycle **part 4 only** (the part that drives counters), and the FULL
  e2e. Lifecycle parts 1-3 and 5-7 carry from r3 unless one of your findings touches them. Other efforts are running
  the same gates on this host; do not run two of your own gates at once.
- One existing test file was edited by r1: `test/dom/elements/wrapperDefaultKeys.test.ts` (three counter cases started
  from `title: Deaths`, an unknown key; they now start from `{}` or the `prefs:` map alone). Check that edit did not
  weaken what those three tests pin (SC-482 / SC-652 behaviour).
- Known flakes: G-S91 (real unless "host was too slow" after two re-runs); G-S115 cell (g) only (SC-633, one re-run);
  G-S97 → check `demo-vault/.obsidian/appearance.json` is clean first (SC-622); e2e SET-X03/X04 (SC-657), INIT-W09
  (SC-654 signature), NEGO-R05 — one re-run of that spec alone plus a note. Any counter or sidebar red is real until
  proven otherwise.

## 4. Footguns

- Devbox: `devbox run -c <abs plugin dir> -- bash <script file>`. `$?` echoed inside `bash -c '…'` is ALWAYS 0 —
  record exit codes from a script FILE and read each gate's own summary line. Never pipe a gate into `tail`.
- Never `cd` inside a compound command; absolute paths and `git -C <abs path>` for every git command.
- Private scratch dir only: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r4-review/`,
  uniquely named scripts and logs, created with the Write tool.
- **Never `rm` / `rm -rf` / `rmdir` anything in /tmp or the scratchpad**, no `rm` with a shell variable, no glob `rm`.
  The only allowed `rm` is the literal `rm -f <plugin abs>/main.js <plugin abs>/styles.css` before jest (in the
  worktree or your probe).
- Never `pkill` / `killall` by pattern; kill only a PID whose `/proc/<pid>/cwd` is inside your worktree or probe.
- Any call over about 120 s is backgrounded by the Bash tool: output to a unique log, then poll the log / your OWN node pid
  (`timeout 100 tail --pid=<pid> -f /dev/null`). No `Monitor`, never wait for a completion notice. Redirect long
  output to files — the 600 s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents from another run — the scratch dir is pre-populated
  across sessions and branches, and a stale log will match. Per-run unique paths and your own pid.
- Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` except your own report file.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not to me. If you need input mid-task, end
  your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway,
  its FIRST WORD must be `SC-671:`.
- Never push, tag, release, or run `just wt-finish` / `just deploy*` / `just sync`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc671-counter-unknown-keys/sc671-r4-review-report.md`.
It must open with a ≤10-line executive summary: verdict (LAND-READY / NOT LAND-READY), finding counts by severity,
measured gate numbers. Then findings by severity (CRITICAL / HIGH / MEDIUM / LOW / INFO), each with `file:line`, a
concrete failure scenario (the YAML and the press that shows it), and a prescribed fix. Then: the probe results table
for items 1-11 (and the item 12 table), the SC-442 cross-check result, mutation results, new product bugs outside this ticket's scope (as
`Follow-ups:`), gate log paths, proposed SKILL.md text if any.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, finding counts and one line per finding,
measured numbers per gate — no prose, plus the absolute path of every evidence artifact you produced.
