# SC-356 round 2 — independent review brief (of the A30 implementation)

## 1. Context loading
- Read: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md`, the implementer briefs `sc356-r1-brief.md`, `sc356-r2-brief.md` and reports `sc356-r1-impl-report.md`, `sc356-r2-impl-report.md` in the same dir, and `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- Code under review: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/draw-steel-elements`, branch `sc356-hostleak-modal-buttons`, diff `origin/develop..HEAD` (base should be `772c3cd` or later — confirm) (head `b01268c` per the r2 implementer report; confirm it). Superproject doc commit `db07e0a` on origin/main `27ed1bf`. Plus the worktree superproject's dse-verify SKILL.md edit.
- Use `git -C <absolute path>` for every git command. Do NOT commit to the branch — you are a reviewer; if you want to try a fix, do it as an uncommitted probe and revert it (`git -C … checkout -- <file>`) before you finish, and say so.
- You never call the tracker.

## 2. The task — adversarial review, EXECUTE AND PROBE, not just read
Ticket scope (verbatim, ledger):
> This ticket is to make the gallery sweep cover modal-only buttons as well, either by mounting them in the gallery or by adding a modal pass, and to add `aria-pressed` to the grouping key.
> Related gap found in the SC-338 review: the chips still take their height (30px), background and unpressed text color from Obsidian rather than from plugin tokens. A modal-aware sweep would surface that too.
Scott's ruling (ledger, verbatim): "A30" — the option that read: "**A30: plugin look, 30px tall (recommended).** Same fill and labels as A, but the chips keep today's 30px height. Nothing gets harder to tap. On a phone, today's chips are 40px tall; I would keep that by following Obsidian's control height rather than fixing 30px." The `.dse-swatch` leaks are deliberately allowlisted citing SC-361 (owner ruling) — judge the allowlist's narrowness, not its existence.

Probe at least:
1. Is the modal pass actually live? Inject your own leaks (a different property/kind than the implementer used — e.g. drop a pinned background, or add a `button { letter-spacing }` rule to the host copy only) and confirm FAIL. Confirm a modal that fails to open FAILs loudly rather than skipping.
2. Coverage: does it really reach every plugin modal with buttons? Grep `src/` for Modal subclasses yourself and compare against the implementer's list. Are pressed/unpressed (`aria-pressed`) chips now separate kinds, in both gallery and modal passes? Are hover / focus-visible states really driven inside the modal (check `matches(':focus-visible')`/hover assertions, not just rest)?
3. A30 fidelity: verify independently in REAL Obsidian (camera on a private Xvfb/port, or the asar app.css) that every chip kind, idle and pressed, dark and light, is 30px tall on desktop with the plugin fill and idle ink (r1b A30 row: fill rgb(26,30,33)/rgb(246,248,248), idle ink rgba(220,226,230,.62)/rgb(85,89,96)), pressed ink and teal-cyan selected outline unchanged, labels centred — and that the height really follows Obsidian's control height (40px on phones), not a literal. Check freeze 280/280 yourself. Check the Conditions-modal changes from SC-468/SC-474 (e2e COND-E02..E06) still pass and that the modal-pass drivers did not paper over them.
4. Scope fence: diff of shoot.mjs is confined to the host-leak sweep / tagButtons (SC-422 also edits shoot.mjs; flag anything that would make that rebase painful).
5. Re-run the full dse-verify battery on the branch head and report every line verbatim. Expected at base `772c3cd`: tsc (incl. e2e) / lint clean · jest 5536 passed / 1 skipped / 233 of 234 suites (+ new tests) · lifecycle 31/31 · e2e 89/93 ok, 0 failed, 4 known-bug, coverage 64/64 · shots 580, 0 FAIL (gallery + modal host-leak lines OK) · freeze `freeze OK (280/280 …)` · parity 0 GAPs / 0 undeclared / 24 DECLARED.
6. Docs edit accuracy in the worktree superproject (dse-verify SKILL.md host-leak bullet, CHANGELOG Unreleased bullet, DESIGN.md if touched) — and that the superproject fast-forward did not move the dse clone off its branch.

## 3. Footguns (all apply)
- Devbox (adapter footguns 1, 13): `devbox run -c <abs dse path> -- bash <script-file>`; never `cd` inside a compound command; record exit codes from a script FILE run through devbox and read each gate's summary line (`bash -c '…; echo rc=$?'` under devbox always records 0); no `| tail` on gates. Write scratch files with the Write tool, not heredocs. No glob `rm`.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED. Use a private subfolder `sc356-r2-review-<random suffix>/` with uniquely named scripts/logs.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout ≤600000ms per call). Never background a gate and wait.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*`) or `.superpowers/`; delete only paths you created.
- Never touch `.superpowers/sdd/freeze-baseline.sha256`.
- Main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`, `demo-vault/*.md`) is Scott's vault — expected.
- Real-Obsidian camera: private Xvfb + port (`DSE_CAMERA_DISPLAY`, `DSE_CAMERA_PORT`), never `:1`.
- Never tag/release/push.
- You cannot `SendMessage` me — `to: 'main'` reaches the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT. If you ever send a message anyway, first word `SC-356:`.

## 4. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r2-review-report.md` (inline if blocked), opening with a ≤10-line executive summary.

## 5. Return contract
Final text to the ticket-owner, raw facts: VERDICT (LAND-READY / FIXES NEEDED), findings by severity (CRITICAL/HIGH/MED/LOW/INFO) each with file:line, failure scenario, prescribed fix; every gate line verbatim; the branch sha reviewed; absolute paths of every evidence artifact.
