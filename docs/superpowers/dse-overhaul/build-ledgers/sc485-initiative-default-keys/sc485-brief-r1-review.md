# SC-485 r1 — independent adversarial review: ds-initiative default keys

Role: orchestration:reviewer (Opus). You did NOT design or write this change. EXECUTE AND PROBE — do not just read. You change no tracked file on the branch (probe files are temporary: delete them and keep copies in your scratch folder).

## 1. Context loading

1. Ledger (authoritative; every ruling verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/decisions.md` — the section "Owner rulings on the r0 report (2026-10-23)" is the spec. Struck-through text is superseded.
2. Design report: `…/sc485-initiative-default-keys/sc485-r0-design-report.md` (exec summary, §2, §9, §10).
3. Implementation report: `…/sc485-initiative-default-keys/sc485-r1-impl-report.md`.
4. Worktree: `/home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys`, plugin at `…/draw-steel-elements`, branch `sc485-initiative-default-keys`, head `bf0e678` on base `d152ea4`. Superproject head `3f1adc1 (on origin/main 00e2f37)`. Verify with `git -C <abs path> log --oneline -1` first; if they differ, stop and return NEEDS_CONTEXT.
5. dse-verify skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`.

Workers never call the tracker (Linear).

## 2. What to check (findings by severity BLOCKER/HIGH/MEDIUM/LOW/INFO, each with file:line, a failure scenario, and a prescribed fix)

- **Contract, byte-level.** Build a byte-check harness (jsdom jest through the real `ElementPipeline.run` + a real DOM write, or model-level `serialize(parse(src))` with mutations) over a wide grid of sources: every filled key present/absent independently for top/hero/group/creature/instance, statblock refs vs none, squads with/without captain, born-captained, authored partial instances. For each, compare head vs base `d152ea4`: (1) every fully-authored source writes byte-identically to base; (2) every key absent and untouched is omitted; (3) every authored key is written; (4) every changed absent key is written (objects/arrays whole).
- **Pool unit.** The C22/C23 scenario: pool write, re-parse, readout must match base live view (`12/18 (6)`). Try every way into a squad: MinionStaminaPoolModal, captain promote/relieve, kill a minion, Reset encounter, heal back to full. Check an `undefined` trio key counts as untouched (C14).
- **Snapshot timing.** statblock-only hero/creature writes no merged `name`/`max_stamina`/`image`/`with_captain`, including via the SIDEBAR path (`prepareModel`, SidebarPanel), not only the reading-mode pipeline.
- **Idempotence / re-parse.** `serialize(parse(serialize(parse(x)+mutation)))` fixed point; a re-parse of a written block reads the same model as before the write (every combatant's stamina, conditions, turn state, malice, round).
- **Integrity probes (this writes into user files):** content above/below the block survives; two `ds-initiative` blocks in one note don't cross-talk (records are per instance); a hand-edited block re-triggers cleanly (external edit → re-parse → write omits correctly); a user-deleted key regenerates cleanly.
- **Real Obsidian.** Run the new e2e spec and add your own real-Obsidian probes (via `npm run e2e -- --only=…` or a temporary spec you delete after) for the ticket repro, a statblock-only creature if the vault can host one, and a squad pool write + reopen.
- **Mutation.** Mutate the key pieces (drop the resolveRefs re-snapshot; drop the pool unit; treat `undefined` as changed in the unit; record generated instances per key; drop name-first) and confirm a test goes red for each. Report survivors.
- **Helper additivity.** Every SC-466/SC-482 test passes unchanged (`git diff d152ea4 -- test/` shows no edits to their files).
- **Scope.** Diff touches only the files the brief allowed. Check CHANGELOG bullet wording is plain and accurate.
- **Gates.** Re-run tsc, lint, full jest, lifecycle (own `DSE_LIFECYCLE_PORT=9353`), full e2e. Watch lifecycle G-S8/G-S15 on `tall.md` for vacuity (does the anti-vacuity check still bite with the smaller first write?). Expected: jest per impl report; lifecycle 32/32; e2e all ok, 0 failed, 0 known-bug, coverage Y/Y. Shots/freeze/parity: verify the implementer's logs (paths in its report) show `592`, `freeze OK (280/280 …)`, `0 GAPs / 0 undeclared / 24 DECLARED` with rc 0; re-run only if src outside initiative changed. KNOWN ENVIRONMENT BREAK (2026-10-23, ledger): Obsidian auto-updated to 1.15.0, so `npm run shots` stops with `HOST COPY DRIFTED` (pinned host copy 1.14.0) after writing the 592 PNGs and before the host-leak/text-scale checks. That stop alone is not a finding; do not patch shoot.mjs or the pin.

## 3. Command rules (each has cost real hours)

- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys/draw-steel-elements -- bash <script file>`; the script cds to the absolute path, runs ONE gate, redirects output to a log, writes `rc=$?` to an rc file. Never `cd X && devbox run …`; `bash -c '…; echo rc=$? > f'` under devbox always records 0.
- One blocking foreground call per gate, `timeout: 600000`; no `run_in_background`, no Monitor, no `&`.
- Write tool for scripts/scratch (never heredoc), in YOUR private folder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-review-<random 6 chars>/`, unique names (prefix `sc485-r-`). Scratchpad is shared by every agent.
- `git -C <absolute path>` always. No glob `rm`. Delete only exact paths you created. Never `pkill`/`killall` by pattern — only a PID whose `readlink /proc/<pid>/cwd` is in your worktree.
- Never key a wait-loop on a scratch filename/contents (stale files from other branches match).
- Main checkout is shared state: edit nothing there but your report. Its dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's vault — expected.
- Never push, tag, or release. Leave `status --porcelain` empty at the end (quote it).

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/sc485-r1-review-report.md`, opening with a ≤10-line executive summary (verdict LAND-READY / FIX-REQUIRED, counts per severity, byte-check case count + matches, mutants red/total, real-Obsidian probes pass/total, gate lines). Then findings by severity with file:line, scenario, prescribed fix. If the write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: raw facts (verdict, sha reviewed, numbers, findings one line each), plus the absolute path of every artifact; `ls -la` them and quote it before your final message.

You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher, not me. Need input → end with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, first word `SC-485:`.

## 6. Owner notes for this round (2026-10-23)

- Implementer deviations to check specifically: (1) `e2e/specs/initiative/stamina-entry.e2e.ts` INIT-STAM-E08 was re-based (no `current_stamina` after damage then heal to full) — confirm that is the contract and not a masked regression; (2) INIT-DEF-E01/E03/E04 press three controls via wdio directly to stay inside the coverage gate (filed as SC-500, out of scope) — confirm the tests still assert the note file exactly.
- Implementer's gate logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-impl-x4k7qp/` (`sc485-i-*.log` + `.rc`).
- Out of scope (do not report as findings, already ruled): SC-500; plugin-built "Create tracker block" output; pre-existing condition normalisation and quote stripping; key order.
