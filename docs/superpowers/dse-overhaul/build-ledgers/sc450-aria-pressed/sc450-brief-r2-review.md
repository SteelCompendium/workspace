# SC-450 R2 — independent adversarial review brief

## 1. Context loading

- Ledger (current-state spec): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-decisions.md`.
- Implementer's report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-r1-implement-report.md` (read the executive summary and audit table; verify, don't trust).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc423-portrait-frame-ledger.md`.
- Repo: `/home/scott/code/steelCompendium/worktrees/sc450-aria-pressed/draw-steel-elements`, branch `sc450-aria-pressed`, head `99ae762`, base `origin/develop` `f818002`. Review `f818002..99ae762`.
- Use `git -C <absolute path>` for every git command. Do not commit to the branch; leave the tree as you found it (verify with `git status` + sha at the end). If you need an unfixed tree, make a scratch tree with `git -C <repo> worktree add --detach /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-r2-scratch f818002` (it needs its own `npm ci`), and remove it afterwards with `git -C <repo> worktree remove`.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected.
- **You never call the tracker (Linear).**

## 2. The task

Ruling (ticket description, verbatim from the ledger):

> For each: does it go through `iconButton`'s `setPressed` (which stamps both), or set `aria-pressed` by hand? If by hand, does the Steel sheen rule visibly differ between the in-place state and a rebuilt one? Probe computed styles the way `assertPortraitMarkParity` in `visual-harness/shoot.mjs` does. Fix any that drift; consider a lint/jest guard that forbids a bare `aria-pressed` write on a `.dse-btn` outside `iconButton`.

Owner decisions: scope = every in-place `aria-pressed` write in `src/`; the guard is required; fix shape = handle `setPressed` or one exported helper.

Execute and probe, do not just read:

1. **Audit completeness.** Independently grep `src/` for every way `aria-pressed` can be written (setAttribute, toggleAttribute, `ariaPressed`, `attr:` objects, spreads/helpers forwarding an attribute map, string-built attribute names). Any site the implementer missed is a finding.
2. **Audit correctness.** For at least two sites marked NO DRIFT and every site marked DRIFTS, verify in a real browser (harness Playwright page) that the in-place vs rendered computed styles match after the fix, dark and light, at rest + hover + focus-visible. Grep `styles-source.css` for every `data-pressed` / `aria-pressed` selector and check none is left that the fix doesn't satisfy.
3. **Guard strength.** Try to slip a bare write past the guard (different call shapes, multiline, a helper indirection). Check every allowlist entry's reason holds. A guard that a plausible future edit bypasses is a finding.
4. **Harness gate strength.** Revert the TS fix (scratch tree) and confirm the new parity gate goes red; confirm it is not vacuous (it actually toggles in place and the element survives without rebuild).
5. **Tests.** Confirm the new jest tests fail on unfixed code.
6. **Behaviour.** The fix must not change click/keyboard behaviour, persistence, or first-paint pixels. Compare `npm run shots` output of base vs head (byte-diff the PNG set); report how many PNGs changed and why.
7. Re-run the full `dse-verify` battery on head.

## 3. Gates — `dse-verify`

`/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Expected at base `f818002`: tsc/lint clean · jest 4810 passed / 1 skipped / 227 of 228 suites (+ the branch's new tests) · lifecycle 25/25 · e2e `63/73 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs` · shots 572, 0 FAIL, existing in-run parity lines OK + the new one · freeze `freeze OK (276/276 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED. Exit codes via a script file only.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc450-aria-pressed/sc450-r2-review-report.md`, logs under `.../logs/` prefixed `sc450-r2-`. Open with a ≤10-line executive summary (verdict APPROVE / APPROVE_WITH_FINDINGS / REQUEST_CHANGES, counts by severity). Findings by severity (HIGH/MED/LOW/INFO) with file:line, failure scenario, prescribed fix.

## 5. Return contract

Final text goes to the ticket-owner, not a human: verdict, head sha reviewed, findings list (severity, file:line, one line each), measured gate numbers, and absolute paths of every artifact.

## Footguns

- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file; run gates in the FOREGROUND (timeout up to 600000 ms). Never background a gate and wait for a notification.
- Never `pkill`/`killall` by pattern; kill only by PID whose command line contains your own worktree path.
- Never `rm -rf` anything under `.superpowers/` other than your own `sc450-` scratch.
- devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc450-aria-pressed/draw-steel-elements -- bash /abs/script.sh`. `rm -f main.js styles.css` before jest.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT and the question. Any message you do send must start with `SC-450:`.
