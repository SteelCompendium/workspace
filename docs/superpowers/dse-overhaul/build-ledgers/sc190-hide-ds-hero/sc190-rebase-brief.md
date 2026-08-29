# SC-190 rebase + battery re-verify brief (2026-08-29)

## Context — read these files first

- Decisions ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/sc190-decisions.md`
- Prior implementation report (full surface inventory): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190/sc190-report.md`
- Gate skill (REQUIRED, read fully): `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`

You never call the tracker (Linear) — not to read history, not to post. All context is in the files above.

## Situation

SC-190 ("Hide the ds-hero Element") was implemented and approved. Scott's ruling, verbatim from the ledger: **"land it"** (2026-08-28). The branch is `sc190-hide-hero`, single commit `089d65e` ("SC-190: hide ds-hero from discovery for 7.0.0"), in the existing worktree:

```
/home/scott/code/steelCompendium/worktrees/sc190-hide-hero/draw-steel-elements
```

Since it was cut, `origin/develop` moved 33 commits (SC-186 micro-round → … → SC-205 @ `c09cf6f`). The branch is 1 ahead / 33 behind. Your job: rebase it onto `origin/develop` @ `c09cf6f`, verify the hide contract still holds against the new base, and re-run the full dse-verify battery. Do NOT land, push, or touch anything outside this worktree. Do all work inside the worktree — verify `pwd` before any write; NEVER edit `/home/scott/code/steelCompendium/workspace/` (the shared main checkout).

## Task

1. In the worktree's `draw-steel-elements`: `git fetch origin` is already done (origin/develop = `c09cf6f`); confirm, then `git rebase origin/develop` on branch `sc190-hide-hero`.
2. Resolve conflicts preserving BOTH intents: keep the incoming develop-side changes AND keep SC-190's removal of every ds-hero advertising surface. Likely conflict zones: `CHANGELOG.md`, docs files (`hero-suite.md`, `README.md`, `docs/index.md`, `migrating-to-7.md`, etc.), `visual-harness/docs-manifest.mjs`, `test/dom/authoring/{insert,suggest}.test.ts`. If `package.json`'s obsidian version changed in the rebase, run `npm ci` before anything else (stale node_modules produce phantom tsc errors).
3. **Drift check** — the 33 new commits may have re-introduced ds-hero advertising. After the rebase, grep the user-facing docs (`README.md`, `docs/*.md` — NOT `.repo-docs/` or `docs/superpowers/`, which are engineering history and stay untouched), `visual-harness/docs-manifest.mjs`, and any NEW discovery-loop code (anything new iterating `registry.all()` for user-facing listings, e.g. in `src/authoring/`) for `ds-hero` / "hero sheet" advertising. Apply the same treatment the prior report describes (hide from discovery loops via the `hidden` flag; remove docs advertising). The element itself stays fully registered and rendering — per Scott's ruling in the ticket: "we keep the code, but we hide it … If they read the sourcecode to find it, fine". Do NOT touch `heroSheet.test.ts`, `heroInSidebar.test.ts`, `anchor.ts`, or the `_dse_anchor` pipeline exemption — load-bearing for ds-encounter.
4. Amend/absorb any resolution or drift fixes so the branch stays clean (one commit, or `089d65e`-rebased plus at most one small follow-up commit — your call, but say which).
5. Run the FULL battery per dse-verify, in order, with devbox wrapping exactly as the skill specifies (absolute paths, `bash -c`, gate command LAST in the string, no pipes/`; echo` after it; `rm -f main.js styles.css` before jest).

## Expected battery numbers (current as of SC-205 land-ready on this exact base, 2026-08-28)

- `npm run tsc`: clean. `npm run lint`: clean, exit 0.
- `npx jest`: base is **3257 passed / 1 skipped / 185 suites**. SC-190 adds 2 tests, so expect ~3259 passed / 1 skipped / 185 suites — report the actual numbers; 0 failures is the gate. Load-sensitive footgun: on a timeout-shaped red in `settings-tab`/`settings-preview` suites, check `/proc/loadavg` and re-run before believing it.
- `npm run shots`: all captures OK (474 PNGs at SC-205), print-twin parity clean, and TWO in-run gates must print their OK lines: `host-copy pin OK …` (or `host-copy pin PARTIAL` — expected on a machine with no Obsidian asar ≥ 1.13.7, not a failure) and `button host-leak OK (111 button kinds × 3 states … = 666 comparisons …)`. Run shots twice; the two runs must be deterministic for the frozen set (the freeze check below is the arbiter).
- Freeze: `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc190-hide-hero/draw-steel-elements/visual-harness/shots` → expect **freeze OK (210/210), 0 checksum mismatches**. SC-190 is docs/discovery-only; ANY mismatch is a leak to diagnose, never a rebaseline.
- `npm run parity` (LAST): **0 GAPs, 0 undeclared WARNs, 16 DECLARED rows, exit 0**.
- Skip `obsidian-shots` unless a display is available; don't fake it.

## Known non-defect footgun (do not "fix" the branch for it)

The worktree's SUPERPROJECT checkout may be pinned to an old workspace main, so `token-coverage.test.ts` can find a stale `docs/superpowers/dse-overhaul/D3-token-map.md` by candidate-path search and report a phantom red. Diagnose by comparing the worktree's copy vs `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/D3-token-map.md` (`grep -c` a token present only in the newer copy); clear it with the test's own `DSE_TOKEN_MAP_PATH` env override pointed at the main checkout's copy. Never edit the branch for this.

## Report

Write your report to `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc190-hide-ds-hero/sc190-rebase-report.md` (effort-prefixed name — the sdd dir is shared global state). If the report-file write is blocked by your harness, return the report inline.

Report contents: rebase result (final sha(s), base sha, conflicts hit and how resolved), drift-check findings (files touched, or "none found"), each gate's ACTUAL numbers verbatim from the tool's own summary lines, and the filesystem path of every artifact you produced (logs, the report itself).

## Return contract

Your final text goes to the ticket-owner, not a human — raw facts only (verdict, shas, measured numbers), no prose, plus the filesystem path of every evidence artifact. Do not push. Do not post anywhere.

Footguns, mandatory:
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Check the exit path per dse-verify's exit-code rules (gate command LAST, no pipes).
- Never background a gate and wait for a notification — run gates in the foreground, redirected to a file.
- You cannot SendMessage your parent — if you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-190:`.
