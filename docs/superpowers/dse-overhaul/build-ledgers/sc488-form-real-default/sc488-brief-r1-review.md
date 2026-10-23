# SC-488 r1 — independent review (reviewer B)

Your final text goes to the ticket-owner, not a human: raw facts (verdict, shas, measured numbers), no prose — plus the absolute path of every artifact you produced. **Workers never call the tracker** (Linear) — not to read history, not to post. You authored none of this code; you edit no source and make no commits.

## 1. Context loading

- Ledger (the "Design" section D1–D9 is the spec under review): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-decisions.md`
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-impl-report.md`
- Design survey (today's code map; §4 behaviour table): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r0-survey-report.md`
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc488-form-real-default`, plugin `.../draw-steel-elements`, branch `sc488-form-real-default`. Review sha: **459ce81** on base **e4c5cf6**. `git -C <plugin> fetch origin`; report if `origin/develop` moved past the base (do not rebase).
- dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- e2e harness guide: `<plugin>/e2e/README.md`.

## 2. The task — execute and probe, do not just read

Ticket spec (verbatim): "**Expected:** an absent select shows the value the block will actually use, and the preview matches the saved result."

Review the diff `e4c5cf6..459ce81` against D1–D9 (quoted from the ledger — read them there). Probe at least:

1. **Real Obsidian** (e2e harness's headless Obsidian, own Xvfb, never `:1`; experimental + `authoringControls` on), on the base and on the tip:
   - `ds-skills` with no `style:` -> dropdown shows `Default (ledger)` selected, preview shows the ledger layout, Save writes no `style`.
   - `ds-roll` `roll: Might test` -> mode dropdown `Default (test)`, difficulty `Default (none)`, preview caption has no "difficulty"; edit `roll:` to `Power Roll + Might` -> label relabels to `Default (power-roll)` live through the real `DropdownComponent.selectEl`, and the preview follows.
   - Pick an explicit option -> written; then pick Default again -> not written; a source with `style: sheet` (stamina) switched to Default -> the line is removed and nothing else changes.
   - `style:` with a null value -> D5.
   Record how you drove it (scratch spec/script path). Base should be RED on the display/preview probes, tip GREEN.
2. **User-file integrity** (this writes into user files): content above and below the fence survives byte-exact; two same-kind blocks in one note do not cross-talk; hand-written comments/key order inside the block — regressions vs base only.
3. **D2 label rule**: zero / one / many hits and a throwing `parse` -> labels as specified; recompute still runs when another field is invalid (Save disabled); the sentinel value never reaches the written YAML, validation input, or preview data.
4. **D6/D7**: a synthetic REQUIRED select (jest) has no sentinel, seeds schema `default` if in enum else enum[0], is written; the removed SC-483 strip code leaves no dead references; all SC-483 outcome tests still pass and only the three ledger-named expectations were re-asserted (diff every changed existing assertion).
5. **Reopen after Save** on the same view (adopted view / re-render): the form re-derives from the NEW source.
6. **Mutation-test** the new jest tests (revert the fix; break the label rule; seed again) — confirm red.
7. **Full dse-verify battery**, independently, at the tip. Expected: tsc (incl. `tsc -p e2e`) and lint clean · jest **5725 passed / 1 skipped / 238 of 239 suites** (after a shots run) · lifecycle **31/31** · e2e **`101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs`** · shots **580**, 0 FAIL, with the button host-leak, modal button host-leak, pipette, pressed-toggle and both text-scale lines and no ALLOWLISTED line · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

**Evidence for Scott (required):** two PNG screenshots from the tip in real Obsidian of the open block edit form: (1) `ds-skills` with no `style:` — the style dropdown expanded or clearly showing `Default (ledger)`, with the ledger preview visible; (2) `ds-roll` `roll: Might test` — mode `Default (test)` and difficulty `Default (none)` visible with the preview caption. Save them under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-shot-skills.png` and `.../sc488-r1-shot-roll.png`. Look at each one yourself before reporting and describe what is visible in one line each.

Findings by severity (BLOCKER / HIGH / MEDIUM / LOW / INFO) with file:line, a concrete failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT.

Out of scope (do not raise as findings, but note if this change makes them WORSE): SC-489, SC-493, SC-494, SC-492.

## 3. Run rules (each has cost real time before)

- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc488-r1-review-b-<6 random chars>/`. Uniquely named scripts and logs inside it only. Create files with the Write tool, not heredocs. Probe specs you must place inside the worktree to run: delete them by exact path before you finish and confirm `git -C <plugin> status --porcelain` is empty (gitignored `e2e/.out/` run folders may stay — list them, do not delete them).
- Exit codes: each gate as a script FILE that `cd`s to the plugin, redirects output to a log, writes its own rc file; run as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements -- bash <abs script path>`. Read each gate's summary line.
- **One gate per Bash call, each blocking foreground** (lifecycle / e2e / shots separately). No `run_in_background`, no Monitor. Never `cd` inside a compound command. `git -C <abs path>` for every git command. To compare against the base, use `git -C <plugin> worktree add <scratch abs path> e4c5cf6` (a scratch worktree) — never check out the base in the reviewed worktree.
- `rm -f` of `main.js`/`styles.css` by explicit path before jest. **No glob `rm`, no `rm -r` loops.** Never touch `/tmp/dse-obsidian-lifecycle-*` or `.superpowers/` outside this effort's dir.
- Lifecycle: `DSE_LIFECYCLE_PORT=9313`.
- Kills: PID only, proven yours (`pgrep -af "worktrees/sc488-form-real-default/"` or `readlink /proc/<pid>/cwd`). Never `pkill`/`killall` by pattern.
- Never `--headed`, never `DISPLAY=:1`.
- Jest footgun: `--selectProjects dom <path>` swallows the path; put the path first.
- Never key a wait-loop on a scratch filename or its contents.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected; ignore it.
- If a Bash call is refused or seems to hang, do not retry the same shape — do it another way.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r1-review-report.md`, opening with a **≤10-line executive summary** (verdict, finding counts, probe base/tip scores, gate numbers, screenshot paths). If the write is blocked, return it inline.

## 5. Return contract

Final text: verdict, finding counts by severity, gate numbers, report path, screenshot paths, every log/probe path. No prose.

You cannot `SendMessage` me — `to: 'main'` routes to the dispatcher, not me. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever send a message anyway, its first word must be `SC-488:`.

Redirect long-running output to files — the 600 s stream watchdog kills silent agents.
