# SC-650 r2 — independent adversarial review

You are the independent reviewer for ticket SC-650. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. You did not write this code.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc650-montage-outside-edit-window/decisions.md`
  (the requirement and every ruling, verbatim).
- The implementer's brief and report in the same dir: `sc650-brief-r1-implement.md`, `sc650-r1-impl-report.md`
  (read its summary; judge its claims by probing, not by trusting them).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/`
  `sc608-outside-edit-tracker-window-ledger.md` and its `sc608-r3-review-report.md` / `sc608-r5-rereview-report.md`
  (the initiative version of this fix and the traps its review found: L1–L5, I7), and
  `sc626-montage-focus-after-write/sc626-r2-review-report.md` (LOW-1 = this bug, measured; its probe method P06/P07/
  P19/P20 is the one to reuse).
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~480 KB; read in parts:
  "The battery, in order", "Jest timeouts under load", "Lifecycle and e2e notes", "THE exit-code footgun", "Current
  expected numbers"; grep "self-disabling", "mouse press", "SC-556", "SC-607", "SC-612", "drawn-from").
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc650-montage-outside-edit-window`, dse branch
  `sc650-montage-outside-edit-window`. Review range: `5f962390..69ffe410` (6 commits). Do not commit to this branch;
  if you need to mutate code for a probe, do it in a scratch `git worktree add` of the branch at an absolute path
  under your private scratch folder, or revert your probe edits with `git -C <abs path> checkout -- <file>` before you
  finish, and leave `git status --porcelain` as you found it.
- Scott's live-vault dirt in the MAIN checkout's dse (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`
  / `demo-vault/*.md`) is expected — ignore.

## 2. The task

Requirement (verbatim, ticket): "Expected: the same handling initiative got in SC-608, at least focus handed back to
the rebuilt card's control that opened the window." Inherited Scott ruling (SC-608): "Option 1" — "Focus goes to the
same control in the reloaded tracker, the one you opened the window from. Anything typed or staged in the window is
dropped [...] It cannot overwrite the outside change." Notice `OUTSIDE_CLOSE_NOTICE` only when the window closed
because of an outside edit, never on the montage's own write.

**Execute and probe, don't just read.** At minimum:
1. Real Obsidian probes (the e2e/lifecycle harness or your own driver script in your scratch folder), Reading view
   AND Live Preview, for each window: Log an action (bar/row/cell openers), Add a hero (chrome and board corner),
   Set limits, edit sheet on a recorded cell. Outside edit inside the block → window closes, Notice shown once, focus
   on the opener (record `document.activeElement` label). Outside edit above/below the block. Own write → no Notice,
   SC-626 focus behaviour intact. Escape with no write → opener, no Notice.
2. SC-608's traps applied to montage: two montage blocks in one note (slot matching; a montage inserted/removed above
   → Notice, no focus move to the wrong card); Sync-like burst of two outside edits; outside edit that changes only
   bytes the model drops (a YAML comment); focus elsewhere at the time (another pane, the editor) → focus must NOT be
   pulled in; popout window if the harness supports it; plugin unload with a pending hand-off.
3. Pinned sidebar (if montage can be pinned): does a window left open there write to stale model objects
   (`correctMontageEntry` / `removeMontageEntry` delta on an old entry, model.ts ~497-524)? Data integrity: content
   above/below the block survives; two montage blocks don't cross-talk; the outside edit always survives.
4. Vacuity: revert the src change against the new tests (jsdom + e2e) and confirm they go RED; run 2–3 mutants of
   your own choosing.
5. Re-run the battery yourself: tsc, lint, jest, e2e full; lifecycle at least parts 4 and 7 (and the part holding
   any new scenario); shots + freeze + parity if the diff touches CSS, a rendered DOM, or the harness.
6. Initiative regression: INIT-W01..W13 e2e and SC-608 jsdom still green if windowHandoff.ts changed.
7. Judge whether the mechanism would carry over to SC-656 (negotiation: outside edit drops focus from a negotiation
   button — no window involved) — one paragraph, no code.

Expected numbers (CURRENT at `5f962390`, plus the implementer's additions): jest 13344 + new / 2 skipped
fresh (1 after shots) · lifecycle 64/64 (65 if G-S140 added) in SEVEN `--only=` parts — WITH the equals sign; part 7
`G-S108,G-S112,G-S115` takes ~200 s, so log to a unique file + rc file and poll it · e2e `598+N/613+N ok, 0 failed,
15 known-bug, coverage: P/P pairs` · shots 592, 163/978, 40/240, clip 147 · freeze 280/280 · parity 0/0/24.
Known flakes: G-S91 FAIL is real unless "host too slow" after two re-runs; G-S115 (g) suspected flake (SC-633) —
re-run part 7 once; INIT-W10 (SC-654); SET-X03/X04 (SC-657); SC-622 dirty `demo-vault/.obsidian/appearance.json`
fails G-S97 — restore it first. Jest "Exceeded timeout" = real hang until proven otherwise.

## 3. Footguns

- Devbox: `devbox run -c <abs plugin dir> -- bash <script-file>`; no `cd` in compound commands; record exit codes
  inside the script file; never pipe a gate into `tail`.
- `git -C <abs path>` for every git command.
- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc650-r2-<your agent id>/`;
  unique script/log names; Write tool for files (no heredocs).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad; no `rm` with a variable target.**
  Leave throwaway files in place.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Long jobs: log to a per-run unique path and poll that log/rc file; never wait for a background notice; never key a
  wait on a scratch filename another run might have written.
- If the report-file write is blocked, return the report inline.
- You cannot `SendMessage` me. Need input → end with STATUS: NEEDS_CONTEXT and the question. Any message you send
  anyway starts with `SC-650:`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc650-montage-outside-edit-window/sc650-r2-review-report.md`
— ≤10-line executive summary first (verdict LAND / FIX, counts by severity), then findings by severity
(CRITICAL/HIGH/MEDIUM/LOW/INFO) each with file:line, failure scenario, evidence (probe id + measured result) and
prescribed fix; probe table; battery numbers; vacuity/mutant results; SC-656 paragraph; paths of every log.

## 5. Return contract

Raw facts: verdict, counts by severity, head sha reviewed, measured battery numbers, absolute path of the report and
every evidence artifact. No prose.
