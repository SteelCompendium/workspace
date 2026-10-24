# SC-501 r2 brief — fix: sweep the roll strip's Modifiers buttons instead of exempting them

You are an `orchestration:implementer` worker. Your final text goes to the SC-501
ticket-owner, not a human.

## 1. Context loading

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-decisions.md`
  (sections "r1 survey result" and "Owner rulings on r1" are your spec), then the r1 survey
  report `.../sc501-hostleak-exemptions/sc501-r1-survey-report.md` (exec summary + the
  "prescribed fix" section). The r1 prototype is in
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r1-survey/`
  (`tree-c98bd82-proto/visual-harness/shoot.mjs` and `sc501r1-instrumentation.patch`) — use it as
  a reference; the instrumentation patch is NOT to be committed as-is.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements`,
  branch `sc501-hostleak-exemptions`, base dse `develop` `c98bd82`. Before writing:
  `git -C <that path> fetch origin`, confirm `git -C <that path> log --oneline -1` is `c98bd82`
  and `origin/develop` is still `c98bd82` (if it moved, rebase onto it and say so). `node_modules`
  is already installed there (r1 ran `npm ci`).
- The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state — never
  write there except your report in the ledger dir. Its dse dirt (modified `demo-vault/Welcome.md`,
  untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected.
- **You never call the tracker (Linear)** — not to read history, not to post.
- Do NOT edit `dse-verify`'s SKILL.md, CHANGELOG.md, or any workspace-level file. I draft the
  skill text. Your only file is `visual-harness/shoot.mjs` (plus a test file only if one already
  covers these helpers).

## 2. The task (owner rulings, verbatim from the ledger)

- "FIX (not document): open the roll strip's Modifiers disclosure by a real click in
  assertBtnHostLeak before tagButtons, with a loud assertion that no roll panel stays [hidden]
  (fail, never skip). Within dispatcher's "fix that removes illegitimate exemptions"."
- "FOLD: same click into assertInputHostLeak and assertCheckboxHostLeak (same cause, same file);
  implementer measures and explains the new input/checkbox lines."
- "FOLD: permanent per-record listing in btnExemptionBoundary (distinct kind keys under each
  reason) so the next drift names its kinds. Applies to the gallery and modal passes that share
  the helper."

Dispatcher constraint (verbatim): "Harness-only: visual-harness/shoot.mjs. … never widen
exemptions silently."

Details:
- The click must be real and idempotent (if the disclosure is already open, do not toggle it shut).
  Do it on every scheme pass (dark and light) the sweep navigates. Comment the WHY next to it
  (SC-279 collapsed-by-default Modifiers disclosure, `rollBar.ts:112`; SC-205 doctrine "MOUNT THE
  CHROME, don't exempt it"; SC-501).
- The assertion: if any roll strip Modifiers panel is still `[hidden]` (or has no client rects)
  after the click, the sweep FAILS with a message that names the reason, never skips.
- Make sure this only affects the host-leak sweep pages, not any screenshot capture: frozen bytes
  must not move (freeze 280/280).
- Boundary listing: keep the existing `N× reason` line, and under each, list the distinct kind
  keys (one per line, sorted, with a per-key count). Keep it compact.
- Commit after each coherent step, messages `fix(SC-501): …` / `test(SC-501): …`. No AI
  attribution trailers in commit messages.

Expected in-run lines after the fix (from the r1 prototype — measure and report the real ones):
- gallery: `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)` with a
  **12-record** boundary = 10× focus-visible disabled + 2× hover no hit point, now listing kinds
  (the 10 = 8 old + 2 `roll|…dse-rollbar__reset|disabled`; the 2 = `initiative|dse-btn.dse-init__stamina`).
  Kind count may stay 113; if it moves, explain each added/removed kind.
- modal pass: unchanged `modal button host-leak OK (10 … 9 … 38 … 228 …)`, 6-record boundary
  (6 focus-visible disabled), now with kinds listed.
- input sweep: was 164 comparisons; r1 inferred 4 missing from `roll|dse-stepper__input` having no
  box. Report the new number and confirm (or refute) that inference. Same for the checkbox sweep.
- If any newly swept button now shows a real host-leak difference, STOP: do not allowlist it, do
  not widen anything; end with STATUS: NEEDS_CONTEXT and the property diff.

## 3. Gates — full dse-verify battery

Follow `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` for order
and command shapes. Lifecycle and e2e are required to land. Expected at `c98bd82` (CURRENT):
tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5872 passed / 1 skipped / 241 of
242 suites** (a fresh worktree reads 1 fewer passed / 2 skipped until a shots run has cached
`visual-harness/dist/obsidian-app.css` — compare after shots) · lifecycle **34/34** · e2e
**`OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs`** · shots **592**,
0 FAIL, with the expected `OBSIDIAN APP.CSS PIN DRIFT` warning (rc stays 0, SC-376) · freeze
**`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Command-shape rules (each one has hung or broken a worker before):
- `devbox run -c /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements -- <cmd>`.
  Never `cd` inside a compound command. `git -C <absolute path>` for every git command.
- Each gate is **one blocking foreground Bash call** (timeout 600000), output redirected to a log
  file, not streamed. Split lifecycle / e2e / shots / parity into separate calls.
  **No `run_in_background`, no Monitor, no background jobs.**
- Exit codes from a script file run through devbox (`devbox run -c <path> -- bash <script>`),
  never `bash -c '…; echo rc=$?'`. Read each gate's own summary line.
- Scratch: private folder `<scratchpad>/sc501-r2-<your agentId>/` (scratchpad =
  `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad`).
  Write scripts with the Write tool, uniquely named (never `gate.sh`).
- **No `rm` with a shell-variable target, no glob `rm`.** Overwrite with `>` or use fresh names.
  Never `rm -rf` under `/tmp` by pattern (other efforts' lifecycle vaults match
  `/tmp/dse-obsidian-lifecycle-*`). Never touch `.superpowers/` beyond your report; never touch the
  freeze baseline.
- Never `pkill`/`killall` by pattern. Kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is
  inside YOUR worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated
  across sessions. Read the process's own output or a per-run unique path.
- Redirect long-running output to a file — the 600s stream watchdog kills silent agents.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc501-hostleak-exemptions/sc501-r2-impl-report.md`,
opening with a ≤10-line executive summary. Then: commits (sha + subject), the exact printed
gallery / modal / input / checkbox host-leak lines (copy them verbatim from the shots log, incl.
the new boundary listing), every battery number, and `Drive-by fixes:` / `Follow-ups:` lists.
If the report-file write is blocked, return the report inline.

## 5. Return contract

Final text: raw facts — STATUS, head sha, measured numbers, no prose — plus the absolute path of
every evidence artifact (report, every gate log). Confirm `git -C <worktree> status --short` is
clean apart from untracked `node_modules` if any.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` goes to
the dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and
the question. If you ever do send a message anyway, its FIRST WORD must be `SC-501:`.
