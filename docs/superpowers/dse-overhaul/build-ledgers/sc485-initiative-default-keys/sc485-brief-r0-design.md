# SC-485 r0 — design survey: initiative tracker writes default keys the user never wrote

Role: orchestration:reviewer (Opus), design/survey round. READ-ONLY for the product: you change no tracked file. You may add a TEMPORARY jest probe file to measure behaviour; delete it before you finish and keep a copy in your private scratch folder.

## 1. Context loading (read first)

- Ledger (current-state, authoritative): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/decisions.md`. It quotes the ticket and every inherited rule verbatim. Workers never call the tracker (Linear) — not to read history, not to post.
- Prior effort this generalises (read the exec summaries, dive only where needed):
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc482-wrapper-default-keys-ledger.md`
  - `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc482-wrapper-default-keys/sc482-r0-survey-report.md` (§2 initiative row, §4 "Where it does not fit" — initiative; its probe method is reusable: copy at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-aee9b5ca57305ad17/zzSc482Probe.test.ts.txt` if it still exists)
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys` (branch `sc485-initiative-default-keys` in every submodule). The plugin is `.../draw-steel-elements`, at `e8f6a14` = origin/develop. Verify with `git -C <abs path> log --oneline -1` before starting; if HEAD is not e8f6a14, stop and return NEEDS_CONTEXT.
- `npm ci` may be needed in the worktree's `draw-steel-elements` before jest runs (node_modules is ignored, so this leaves the tree clean).
- Read `draw-steel-elements/AGENTS.md` (in the worktree) before touching anything.

## 2. The task

Design how `ds-initiative` should meet the ticket's "Expected" contract, quoted from the ticket:

> **Expected:** the SC-466 / SC-482 contract. A key absent from the source that still equals its default stays absent. Every authored key is still written.

and the inherited SC-466 owner rule (verbatim from the ledger):

> "a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today."

Answer each of these, MEASURED where the question is about behaviour (jsdom jest probe through the real `ElementPipeline.run` + a real DOM write, as the SC-482 survey did; cite file:line for code claims):

1. **Inventory of filled defaults.** Every key `src/elements/initiative/model.ts` parse fills when absent — top level, per hero, per group, per creature, per instance — and every key `resolveRefs.ts` fills from statblocks after parse. For each: the default value, whether it is derived (e.g. `current_stamina` = `max_stamina`), and whether parse mutates the incoming `data` in place.
2. **Where to record.** Can SC-482's `src/elements/shared/undeclaredDefaults.ts` be used per nested object (heroes, groups, creatures, instances), or does it need an extension? Where must the snapshot be taken so a statblock-resolved `max_stamina` / `current_stamina` is NOT written into a source that only names a statblock code? Propose an API with minimal change to the helper; every SC-482 / SC-466 test must keep passing unchanged.
3. **Object identity across writers.** Do the initiative view's writers (`view.ts` persist sites, `views/MinionStaminaPoolModal.ts`, reorder/drag, add/remove combatant, squad toggles, round/turn reset) mutate the parsed nested objects in place, or replace them (spread copies, rebuilt arrays, re-sorting)? A per-object record keyed on identity is lost when an object is replaced. List each writer and what happens to identity.
4. **`isHero`.** Is it ever read from the source (legacy shapes, docs, examples), or only derived from being under `heroes:` vs a group? What does omitting it when unauthored break (the reader, other consumers like the encounter "Create tracker block" path, the sidebar, statblock adapters)? Recommendation.
5. **`instances`.** How they are generated from `amount`, what writes them, and what the whole-value rule (SC-482 FU1: a changed absent object/array key is written whole) means here — e.g. damaging one goblin of two. Is a partially authored `instances:` list a real shape? Does `MinionStaminaPoolModal` / squads (`is_squad`) interact?
6. **Top-level `malice`** and any other top-level defaults (round, current turn etc.).
7. **Plugin-built entries.** Combatants added mid-fight and blocks created by the encounter "Create tracker block" path: per the inherited rule they keep today's output. Confirm the design leaves them whole, and whether that is coherent (e.g. a plugin-added hero next to a user-authored one).
8. **Fully-authored control.** Measure today's write for a fully-authored block (every key present). Confirm only the touched lines change today, and which keys (e.g. `isHero`) are written even then.
9. **Tests pinning bytes.** Which test files would need updating: `test/unit/model/initiative-serialize.test.ts` (legacy `parseEncounterData` byte oracle — what should it become?), dom tests, e2e specs under `e2e/specs/initiative/`, lifecycle scenarios in `visual-harness/obsidian-lifecycle.mjs`, fixtures. Estimate the count.
10. **Evidence plan.** Initiative HAS an e2e surface (`e2e/specs/initiative/`, `e2e/manifest/`). Propose the e2e test(s) that would prove the fix in real Obsidian (asserting the note file). Say whether a lifecycle scenario is warranted (if so it is G-S31) or not, and why.
11. **Decisions only Scott can make.** Anything product-shaped where the contract does not decide it (e.g. if omitting `isHero` or `instances` changes visible behaviour). Phrase each as a plain either/or with the visible consequence of each option. If none, say "none".
12. **Size.** Files to change, tests to add/update, risk areas.

Bounds: this is a bounded design round, not an implementation. Do not write the fix. Keep the probe to what the questions need (aim for ~15–25 probe cases). Do not touch `src/elements/shared/undeclaredDefaults.ts` or any SC-482 file beyond reading.

## 3. Gates

None to pass (read-only). If you run jest, record the command and its summary line. Baselines at e8f6a14 for reference: jest 5743 passed / 1 skipped / 238 of 239 suites (on a fresh worktree jest reads one fewer passed and 2 skipped until `npm run shots` has cached `visual-harness/dist/obsidian-app.css` — that is expected, not a fault). You do not need lifecycle/e2e/shots/parity.

Leave `git -C <worktree>/draw-steel-elements status --porcelain` empty when you finish (delete your probe file; `node_modules` is ignored).

## 4. Command rules (each of these has cost real hours)

- Devbox: Node/npm are not on PATH. Run `devbox run -c /home/scott/code/steelCompendium/worktrees/sc485-initiative-default-keys/draw-steel-elements -- bash <script file>` where the script `cd`s to that absolute path and runs the command. Never `cd X && devbox run …` (a compound `cd` can hang on a permission prompt nobody answers). `devbox run -- bash -c '…; echo rc=$? > f'` always records 0; record exit codes from inside a script file.
- Write scripts and scratch files with the Write tool, never a heredoc. Put them in YOUR private folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc485-r0-design-<your agent id or a random 6-char suffix>/`, with unique file names. The scratchpad is shared by every agent in the session.
- `git -C <absolute path>` for every git command; never `cd X; git …`.
- No glob `rm` (`rm -f dir/*.x`). Delete only exact paths you created.
- Never `pkill`/`killall` by pattern. Kill only a PID whose cwd (`readlink /proc/<pid>/cwd`) is inside your worktree.
- Run each command as one blocking foreground call; no `run_in_background`, no Monitor. Redirect long output to a file in your private folder and read the summary line — the 600s stream watchdog kills silent agents.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches; a stale file from another branch will match.
- The main checkout (`/home/scott/code/steelCompendium/workspace`) is shared state: never edit anything there except your report file in the ledger dir. Its `draw-steel-elements` has expected dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md` = Scott's live vault) — not yours, do not flag or touch it.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc485-initiative-default-keys/sc485-r0-design-report.md`. It must open with a ≤10-line executive summary: the recommended design in 3–4 lines, the Scott decisions (or "none"), size. Then sections matching questions 1–12. If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — verdict, the sha you surveyed, measured numbers, the decisions list — no prose, plus the absolute path of every artifact you produced (report, probe copy, probe output, jest logs).

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not to me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever do send a message anyway, its first word must be `SC-485:`.
