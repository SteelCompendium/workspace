# SC-501 r2 review brief — independent adversarial review of the harness fix

You are an `orchestration:reviewer` worker. You did not author this fix and did not design it.
Your final text goes to the SC-501 ticket-owner, not a human.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-decisions.md`
  ("Owner rulings on r1" is the spec). Then the r1 survey report `sc501-r1-survey-report.md`
  (exec summary) and the implementer's `sc501-r2-impl-report.md` in the same dir.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements`,
  branch `sc501-hostleak-exemptions`. Review range: `a993a60..HEAD_SHA` (the branch is rebased onto SC-487's `a993a60`) (HEAD_SHA given in the
  dispatch prompt). Verify with `git -C <path> log --oneline a993a60..HEAD`. Do not commit to the
  branch; if you prototype, do it in a scratch copy under your private folder.
- Main checkout `/home/scott/code/steelCompendium/workspace` is shared global state — write only
  your report there. Its dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` /
  `demo-vault/*.md`) is Scott's live vault — expected.
- **You never call the tracker (Linear).**

## 2. What to check — execute and probe, don't just read

Spec (owner rulings, verbatim): "FIX (not document): open the roll strip's Modifiers disclosure
by a real click in assertBtnHostLeak before tagButtons, with a loud assertion that no roll panel
stays [hidden] (fail, never skip)." / "FOLD: same click into assertInputHostLeak and
assertCheckboxHostLeak (same cause, same file); implementer measures and explains the new
input/checkbox lines." / "FOLD: permanent per-record listing in btnExemptionBoundary (distinct
kind keys under each reason) so the next drift names its kinds. Applies to the gallery and modal
passes that share the helper."
Dispatcher constraint: "Harness-only: visual-harness/shoot.mjs. … never widen exemptions silently."

Probe at least:
1. Re-run the shots gate yourself and confirm the printed gallery / modal / input / checkbox lines
   match the implementer's report, and freeze 280/280.
2. Can-fail: break the click (e.g. in a scratch copy, skip it or click the wrong node) and confirm
   the sweep FAILS loudly rather than falling back to exemptions. Also: is the click idempotent if
   the disclosure is already open (no toggle-shut)?
3. Does the click leak into any screenshot capture or another sweep sharing the page (ordering,
   page reuse between dark/light passes)?
4. Is the "no panel stays hidden" assertion specific enough — would it pass vacuously if the roll
   section disappeared from the gallery, or if the selector stops matching?
5. Exemption accounting: are the remaining 12 gallery records exactly the expected ones
   (10 focus-visible disabled = 8 old + 2 roll Reset; 2 hover no hit point = initiative stamina)?
   Did any exemption get wider anywhere?
6. Are there OTHER collapsed-by-default disclosures in the gallery hiding swept controls the same
   way (search `open: false` / `[hidden]` / `dse-collapse` across `src/` and the gallery entry)?
   Report them as findings with evidence; do not fix.
7. Code quality of the boundary listing and comments (accuracy of every comment claim).

Findings by severity (HIGH / MEDIUM / LOW / INFO) with file:line, failure scenario, prescribed fix.
Verdict: APPROVE / APPROVE_WITH_NITS / REQUEST_CHANGES.

## 3. Gates

Expected (dse-verify develop `a993a60` after SC-487 landed — jest 5958 / 1 skipped, lifecycle 36/36, e2e 114/114 with 79/79 — plus this fix): shots **592**, 0 FAIL, expected
`OBSIDIAN APP.CSS PIN DRIFT` warning (rc 0, SC-376); freeze **`freeze OK (280/280 …)`**; numbers
for the host-leak lines as in the implementer's report. Run lifecycle / e2e only if you find the
fix could affect them (harness-only change — say why or why not).

Command-shape rules:
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command; `git -C <absolute path>` for every git command.
- Each gate is **one blocking foreground Bash call** (timeout 600000), output redirected to a log
  file. **No `run_in_background`, no Monitor, no background jobs.**
- Exit codes from a script file run through devbox, never `bash -c '…; echo rc=$?'`.
- Private scratch folder `<scratchpad>/sc501-r2rev-<your agentId>/` (scratchpad =
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`),
  uniquely named scripts written with the Write tool.
- **No `rm` with a shell-variable target, no glob `rm`.** Never `rm -rf` under `/tmp` by pattern.
  Never touch `.superpowers/` beyond your report or the freeze baseline.
- Never `pkill`/`killall` by pattern; kill only a PID whose cwd is inside YOUR scratch or the sc501 worktree.
- Never key a wait-loop on a scratch filename or contents. Redirect long output to a file.
- If you make a scratch git worktree, use `git worktree add` at a literal absolute path under your
  private folder and remove it by that literal path.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-r2-review-report.md`,
opening with a ≤10-line executive summary. If the write is blocked, return it inline.

## 5. Return contract

Final text: verdict, finding counts by severity, shas, measured numbers, no prose — plus the
absolute path of every evidence artifact. Confirm the sc501 worktree is unchanged by you
(`git -C <path> status --short`, HEAD sha).

You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-501:`.

## 6. Addendum (owner, after r2 returned)

HEAD_SHA = `1918a29` (one commit on `a993a60`). Also measure, on `1918a29`, for owner ruling
FU-1: how many records in the INPUT sweep and the CHECKBOX sweep currently have no box (0×0 or
0 client rects) when compared — list them by kind key, per scheme. A temporary probe in a scratch
copy is fine; do not commit. Report this as its own section, "FU-1 measurement".
The 10 focus-visible-disabled gallery records now list roll stepper (disabled) as well as roll
Reset — check r1's "8 old + 2 Reset" arithmetic against what the boundary prints and explain the
composition at `c98bd82` vs `1918a29`.
