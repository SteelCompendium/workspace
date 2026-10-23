# SC-485 r1 — implement: ds-initiative stops writing default keys the user never wrote

Role: orchestration:implementer. You implement in an isolated worktree, ship tests, run the full battery, report raw facts.

## 1. Context loading (read first, in order)

1. Ledger (authoritative current state, every ruling verbatim): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/decisions.md`. The section "Owner rulings on the r0 report (2026-10-23)" is your spec. Anything struck through is superseded — do not act on it.
2. Design report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/sc485-r0-design-report.md` — read the exec summary, §1 (inventory of filled keys), §2 (API + pool unit), §3, §9 (tests), §10 (evidence). Its prototype is reference only (do not copy blindly; re-derive and test): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r0-design-q7k2m9/proto/model.ts` and `proto/resolveRefs.ts`; probe cases C01–C25, M02–M04 in `…/sc485-r0-design-q7k2m9/zzSc485Probe.test.ts.txt`.
3. Prior art: SC-482's helper `src/elements/shared/undeclaredDefaults.ts` and its tests; SC-482 ledger `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc482-wrapper-default-keys-ledger.md` (read only if you need precedent).
4. `draw-steel-elements/AGENTS.md` in the worktree, and the dse-verify skill `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, numbers).

Workers never call the tracker (Linear) — not to read history, not to post.

Worktree: `/home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys` (branch `sc485-initiative-default-keys` in every submodule). Plugin at `…/draw-steel-elements`. Verify `pwd`-free with `git -C <abs path> rev-parse --show-toplevel` before any write. The workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys/CHANGELOG.md` — never under `/home/scott/code/steelCompendium/workspace/`.

**Rebase FIRST, before writing code:**
- Plugin: `git -C …/draw-steel-elements fetch origin` then rebase branch onto `origin/develop` = **`d152ea4`** (SC-477). The branch has no commits yet, so this is a fast-forward from e8f6a14. If origin/develop is newer than d152ea4, stop and return NEEDS_CONTEXT with the new sha.
- Superproject: `git -C /home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys fetch origin` then rebase onto `origin/main` (currently `00e2f37`). Do not touch the submodule pointer in the superproject; only CHANGELOG.md.
- Run `npm ci` in the plugin after the rebase (package.json may have moved).

## 2. The task (rulings quoted verbatim from the ledger)

Ticket "Expected": "the SC-466 / SC-482 contract. A key absent from the source that still equals its default stays absent. Every authored key is still written."

Inherited SC-466 rule: "a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today."

Owner rulings (2026-10-23), verbatim:

- "DESIGN: adopt the report §2 design. Record absent keys per object (top, hero, group, creature, authored instance) BEFORE each fill in `parse` (`obj[key] === undefined` = absent); snapshot at end of `parse` AND again at end of `resolveRefs` (before `return model`); `serialize` = nested DTO walk with `omitUntouchedDefaults`, keeping SC-377 name-first. Do NOT use `stringifyOmittingUntouched`'s blank-body branch (initiative cannot parse a non-mapping)."
- "POOL UNIT (required for correctness, report §2, C22/C23): for each minion creature of a squad group, if ANY of {the pool on its live home (creature field first, else group, as `minionPoolOf`), `minion_stamina_pool_max`, `captain_bonus_active`, `captain_bonus_n`} would be written, write ALL of them. A key whose value is `undefined` counts as untouched. Helper change must be ADDITIVE (an `isUntouchedDefault(owner, key)` export or an optional `keep` set) — every SC-466/SC-482 test passes unchanged."
- "isHero: OMIT when absent (unchanged from the 2026-10-22 ruling; report §4 confirms nothing reads it from YAML). An authored `isHero` is still written."
- "instances: an absent `instances` list is written WHOLE once it changes (SC-482 FU1); dropped again when it returns to the parse snapshot (C24)."
- "D1 statblock-merged fields (`name`, `max_stamina`, `image`, `with_captain` resolved from a `statblock:` ref): (a) OMIT, per the ticket's Expected (\"A key absent from the source that still equals its default stays absent\")."
- "Plugin-built \"Create tracker block\" output (encounter builder): unchanged (inherited rule). Its `isHero: false` emission: DROP — plugin-built output is out of scope."
- "Pre-existing condition normalisation (`grabbed` -> `{key: grabbed}`) and quote stripping: DROP — unchanged by this ticket (same as SC-482)."
- "initiative-serialize.test.ts oracle: re-base per report §9 — keep parse deep-equals legacy `parseEncounterData`; replace byte equality with (1) fully-authored `serialize(parse(L)) === L` for `L = legacyWriterBytes(src)` and (2) minimal untouched `parseYaml(serialize(parse(src)))` deep-equals `parseYaml(src)` (modulo the pre-existing condition normalisation). SC-195 / M-1 captain tests become pool-unit pins after a pool write."
- "EVIDENCE: jest ~20 cases per report §10 (incl. pool unit C22/C23, M04 snapshot timing, C14 undefined-trio, M03 plugin-built) with mutants proved red (drop resolveRefs re-snapshot; drop pool unit; record generated instances per key). New e2e spec `e2e/specs/initiative/default-keys.e2e.ts` (INIT-DEF-E01..E04, exact `toEqual` on the note block) + fixture `e2e/vaults/shipped/Initiative/full.md`. No lifecycle scenario (no G-S31). Full lifecycle run mandatory — watch G-S8/G-S15 anti-vacuity on `tall.md`; if one goes vacuous, STOP and report (NEEDS_CONTEXT), do not edit the scenario."

Scope fences:
- Files you change: `src/elements/initiative/model.ts`, `src/elements/initiative/resolveRefs.ts`, an ADDITIVE export in `src/elements/shared/undeclaredDefaults.ts` (+ its unit test), the 3 test files the report §9 names, new jest test(s), the new e2e spec + fixture (+ e2e manifest/census only if the coverage gate requires it), the initiative model's header comment (the "BYTE-COMPAT boundary" text), and the plugin's `.repo-docs/architecture.md` initiative row if it states the old contract. Plus a CHANGELOG `## Unreleased` bullet in the worktree superproject (user-facing, plain words: e.g. "The initiative tracker no longer adds keys you never wrote (isHero, empty conditions, malice, per-creature stamina, instances) when you click in it; statblock-only combatants keep following their statblock.").
- Do NOT touch `src/framework/`, `src/authoring/FormModal.ts`, `src/elements/encounter/`, `visual-harness/obsidian-lifecycle.mjs`, or any other element.
- Red-first: commit failing tests before the fix. Commit after every coherent step (nothing uncommitted through a gate).
- Commit messages: no AI attribution or co-author trailers (Scott's global rule). Prefix `SC-485`.

Report two kinds of extras: `Drive-by fixes:` (made — obviously correct, local to a touched file, cannot move a baseline) and `Follow-ups:` (left alone).

## 3. Gates (dse-verify battery, in order; numbers at d152ea4)

Baselines at d152ea4 (dispatcher, 2026-10-22): tsc (incl. `tsc -p e2e`) + lint (incl. `e2e/`) clean · jest **5769 passed / 1 skipped / 238 of 239 suites** · lifecycle **32/32** · e2e **`OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`** · shots **592**, 0 FAIL · freeze **`freeze OK (280/280 …)`** · parity **0 GAPs / 0 undeclared / 24 DECLARED**.

Expected after your change: jest = 5769 + your new tests (the 9 re-based tests stay in the count) / 1 skipped, suites 238 + new files; lifecycle 32/32; e2e (104 + your new INIT-DEF tests) ok, 0 failed, 0 known-bug, coverage Y/Y (69 or more if you add manifest rows); shots 592; freeze 280/280 (no rebaseline — this is a data-path change; any FREEZE VIOLATED is a stop-and-report); parity 0/0/24. On a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — compare after shots, or note it.

Run order: tsc, lint, jest, lifecycle, e2e, shots, freeze, parity (last). Set your own lifecycle port: `DSE_LIFECYCLE_PORT=9347`.

## 4. Command rules (each of these has cost real hours)

- Devbox: Node/npm are not on PATH. Run every gate as `devbox run -c /home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys/draw-steel-elements -- bash <script file>`, where the script `cd`s to that absolute path, runs ONE gate with output redirected to a log, and writes `rc=$?` to a per-gate rc file. Never `cd X && devbox run …`. `devbox run -- bash -c '…; echo rc=$? > f'` always records 0 — exit codes only from inside a script file. Read each gate's summary line from its log.
- One blocking foreground Bash call per gate (lifecycle, e2e, shots each separate, to stay under the 10-minute tool timeout; pass `timeout: 600000`). No `run_in_background`, no Monitor, no `&`. A job you start does not wake you; if you ever must background, poll its own rc file, never wait for a notice.
- Write scripts and scratch with the Write tool, never a heredoc, in YOUR private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r1-impl-<random 6 chars>/`, uniquely named files (prefix gates `sc485-i-`). The scratchpad is shared by every agent.
- `git -C <absolute path>` for every git command; never `cd X; git …`.
- No glob `rm` (`rm -f dir/*.x`, `rm -rf /tmp/dse-*`). Delete only exact paths you created and recorded. Never touch `/home/scott/code/steelCompendium/workspace/.superpowers/` beyond writing your report file.
- Never `pkill`/`killall` by pattern. Kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions; a stale file from another branch will match. Read the process's own output or a per-run unique path.
- Redirect long output to files; the 600s stream watchdog kills silent agents.
- The main checkout (`/home/scott/code/steelCompendium/workspace`) is shared state: edit nothing there except your report. Its `draw-steel-elements` dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault — expected, not yours, do not flag it.
- Never create a tag or release on draw-steel-elements. Never push.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/sc485-r1-impl-report.md`, opening with a ≤10-line executive summary (verdict, head shas, gate numbers). Then: commits (sha + subject), design as built (where it deviates from the report §2 and why), tests added/updated with counts, mutant-red proofs (mutant, test that went red, then restored), each gate's summary line quoted with its log path and rc, e2e run id, Drive-by fixes, Follow-ups. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, plugin head sha + base, superproject head sha + base, measured gate numbers — no prose, plus the absolute path of every evidence artifact (report, gate logs, rc files, e2e `.out` run dir). Before your final message, `ls -la` every path you list and quote it.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your final text; I will resume you. If you ever do send a message anyway, its first word must be `SC-485:`.
