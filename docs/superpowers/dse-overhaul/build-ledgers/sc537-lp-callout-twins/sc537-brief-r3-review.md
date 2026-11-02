# SC-537 r3 — independent adversarial review of the r2 implementation

You are the independent reviewer for ticket SC-537. You did not write this code. Your final text goes to the ticket-owner, not a human.
**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading
- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/decisions.md` (ticket facts, owner rulings — authoritative).
- Design: `.../sc537-lp-callout-twins/sc537-r1-diag-report.md` (§1 base measurements, §2 mechanism, §3 Option A incl. risks, Gate, Jest, mutants). Prototype + real-Obsidian probe tooling (read-only, copy what you need): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r1-diag-w537a/`.
- Implementation report: `.../sc537-lp-callout-twins/sc537-r2-impl-report.md` (read its summary, deviations, follow-ups).
- Parent fix context: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc481-twin-block-vanish/` (decisions.md, sc481-r3-review-report.md for the probe style that found SC-481's HIGH).
- Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.
- **Worktree:** `/home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins` (plugin branch `sc537-lp-callout-twins`, HEAD `4e3de39c` on dse `f81a277`; superproject `97636536` (CHANGELOG only, on 367015f3)). Verify with `git -C <abs path> log --oneline -1`. Review only — do NOT commit to the branch; if you temporarily modify files for mutants/probes, restore them; end with `git status --short` empty in plugin and superproject. Never work in `/home/scott/code/steelCompendium/workspace/` (its dse dirt is Scott's live vault — ignore it).

## 2. The task — execute and probe, don't just read
Owner rulings in force (verbatim): "Adopt Option A. … Option C (write-time refuse) DROPPED …"; "§2.5 click-opens-source: FILED SC-540 … OUT OF SCOPE for SC-537 — do not touch the click shield."; "CHANGELOG: remove the SC-481 bullet's parenthetical … and add an SC-537 bullet under ## Unreleased (user-facing, plain words, mention the form edit could be erased)."

1. Diff review `458abe3..HEAD` (plugin) and the superproject CHANGELOG commit: correctness, scoping, cleanup (listener lifecycle on plugin unload / editor destroy), per-keystroke cost, no touches to `livePreviewScrollHold.ts` (SC-522), the click shield or callout chrome CSS (SC-520/SC-540).
2. **Real-Obsidian probes on a HEAD bundle** (Live Preview), beyond G-S57: 2/3 identical callouts all click orders incl. rapid/in-flight clicks (within the 400 ms debounce); form Save upper then lower; two blocks per callout; nested; callout twin + plain-fence twin; two panes on the same note (LP+LP, LP+Reading) — clicks in one pane must not mis-remount views in the other; undo (Ctrl+Z) after a write; typing inside one callout's source while the other is drawn (no false remount, `knownBody` not advanced by typing); a non-DSE callout twin pair (nothing happens); a large note (many callouts) — measure the listener's per-keystroke cost; scroll position in a tall note across the remount (SC-478/SC-522 territory — measure, don't fix). Anything that writes into user files gets integrity probes: content above/below the written region survives; twins don't cross-talk; hand-edited content survives.
3. **Red/green yourself:** run G-S57 on the 458abe3 bundle (must FAIL with §1-like numbers) and on HEAD (must PASS). Re-run the reported mutants and add your own (e.g. drop the editor scoping, drop the `docChanged` guard, drop the early return) — does jest or G-S57 catch each?
4. Re-run: tsc/lint, jest, lifecycle (`--only` lists, one blocking foreground call each — the implementer's half 2 took 532 s, so split the 44 scenarios into THREE `--only` calls to stay under 600 s; the implementer's split is in its gate logs `sc537-r2-gate-lifecycle-{1,2}.log`), e2e. Trust the implementer's shots/freeze/parity only if no CSS/visual-harness shot path changed; say which.
5. Scrutinise the three deviations in the impl report (reconcile takes the editor VIEW; the editor pass judges LP CALLOUT widgets only; processor-time calls unchanged) and the touched `test/dom/framework/livePreviewScrollHold.test.ts:545` (expects 2 registerEditorExtension calls). Measure the per-update cost on a large note (implementer did not).
6. Findings by severity (HIGH/MEDIUM/LOW/INFO) with file:line, failure scenario, and a prescribed fix. Verdict: LAND-READY or NOT.

Expected numbers (CURRENT @ f81a277 → expected on HEAD): tsc/lint clean; jest 6208/1/249 of 250 → 6208+N per the impl report; lifecycle 43/43 → 44/44 (split per the impl report); e2e 124/124, 0 failed, 0 known-bug, 87/87 (known flake CHR-F02, SC-539).

## 3. Report
`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc537-lp-callout-twins/sc537-r3-review-report.md`, opening with a **≤10-line executive summary** (verdict, counts by severity, the gate numbers you measured). Logs as `sc537-r3-*.log`, any deciding screenshot as `sc537-r3-*.png` in the ledger dir.

## 4. Return contract
Final text: raw facts — verdict, findings list (severity, file:line, one line each), measured numbers, absolute paths of every artifact.

## Footguns (all apply)
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- One blocking foreground Bash call per gate / Obsidian run (< 600 s; scope with `--only=`). No `run_in_background`, no Monitor, no background jobs.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc537-lp-callout-twins/draw-steel-elements -- bash <script file>`. Never `cd X && …`; never `cd` inside a compound command; `git -C <abs path>` for every git command. Devbox eats `$?` — record exit codes from inside a script file.
- Scratch: private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc537-r3-review-<your agentId>/`, uniquely named files. Write tool for scratch files (no heredocs). No `rm` with a shell-variable target, no glob `rm`.
- Never `pkill`/`killall` by pattern; kill only a PID you started whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside your worktree/scratch. Never `rm -rf` a shared `/tmp` glob (e.g. `/tmp/dse-obsidian-lifecycle-*`). Never touch the shared `.superpowers/` dir beyond your own `sc537-` files.
- Unique `DSE_LIFECYCLE_PORT` (e.g. 9539).
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. If you need input, end with STATUS: NEEDS_CONTEXT. If you ever message anyway, the FIRST WORD must be `SC-537:`.
