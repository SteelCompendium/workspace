# SC-466 r1 implementer brief — stop ds-stamina-bar writes from adding default keys

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/decisions.md` (the ledger — current-state, authoritative). Quote rulings from it; do not reinterpret.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements`, branch `sc466-stamina-bar-defaults`. Verify `pwd`/branch before any write. NEVER write under `/home/scott/code/steelCompendium/workspace/` (the shared main checkout) except your report file in the ledger dir. The workspace-level CHANGELOG lives in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/CHANGELOG.md`.
- Before starting: `git -C <plugin repo> fetch origin` and confirm `origin/develop` is `0ce76dd` (the branch is cut there). If develop has moved, rebase onto it and say so in the report.
- Read `draw-steel-elements/AGENTS.md`, `.claude/skills/dse-verify/SKILL.md` (in the main checkout: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — read-only), and `draw-steel-elements/e2e/README.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post. The ledger is your context.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it.
- Scope: the ds-stamina-bar (and legacy `ds-stamina` alias) serialization path only. Do NOT touch `src/framework/host/` (SC-457 in flight there). SC-432 (Spend Recovery relabel, parked) is unrelated — do not touch its surfaces.

## 2. The task

Ticket spec (verbatim from the ledger):

> **Repro:** a legacy `ds-stamina` / `ds-stamina-bar` block containing only stamina fields. Apply any change from the stamina modal (a plain Damage is enough). The written block now also contains `collapsible`, `collapse_default`, `height` and `style` with their default values.
>
> **Expected:** a write changes only the fields the action touched; defaults the user never wrote stay implicit.

Owner decisions (verbatim from the ledger):

> - Verdict on the ticket's question = LEAK, not intended normalisation. Root cause: `src/elements/stamina-bar/model.ts` serialize() is `stringifyYaml(model).trim()` over the StaminaBar instance, and StaminaBar.parse fills defaults into own properties (collapsible/collapse_default via ComponentWrapper, `height` 1, `style` "default", current/temp 0). The D1 "BYTE-COMPAT boundary" deliberately reproduced the legacy writer's bytes — including this leak. This ticket supersedes byte-compat ONLY for keys absent from the source.
> - Rule for the fix: a key that was ABSENT from the parsed source AND whose value at write time still equals the default the parser filled in is omitted. Every key present in the source is written (even if equal to the default). A key absent in the source whose value changed is written. Key ORDER for written keys is unchanged (class order) — a fully-authored block serializes byte-identically to today.
> - Blocks the plugin constructs itself (not parsed from a source: fromHero/fromCreature, insert-block paths) keep today's output unless the implementer finds they flow into user files with the same defect — report, don't change.

Standing constraint (SC-169 round 2, Scott's ruling 2): `collapsible:` / `collapse_default:` are model fields on this element and an AUTHORED collapse key must keep round-tripping (`collapseKeysOwnedByModel: true` in `src/elements/stamina-bar/definition.ts`; see `src/framework/chrome/collapsedKey.ts`).

Steps:

1. **Reproduce first** (TDD): a failing jest test through the real write path — parse a block with only `max_stamina` + `current_stamina`, apply a Damage the way the stamina modal does, serialize, assert the output has no `collapsible`/`collapse_default`/`height`/`style`/`temp_stamina` keys. Find how the modal's Apply builds the model it writes (does it mutate the parsed instance, clone it, or construct a new StaminaBar?). Presence information MUST survive whatever copy/clone path the modal, Catch Breath, the Recoveries strip, the popover and the undo toast use — trace every writer of this block and list them in the report.
2. **Fix** per the rule above. Where you record "which keys the source declared" is your call, but it must not itself serialize (verify against the real `stringifyYaml`/`yaml` package, not by assumption), must be per-instance (two blocks never share it), and must not change the output of a block that declares every key.
3. **Existing tests** that pin today's bytes (byte-compat suite, `test/dom/elements/stamina-bar.test.ts`, `staminaRecoveries.test.ts`, `chromeRound2.test.ts`, `chromeRerender.test.ts`, `pref-overrides.test.ts`, others you find): a fixture whose SOURCE omitted a default and whose expected output contains it is now wrong — update it and list every such change in the report (file:line, before/after). A fixture whose source declared every key must keep passing untouched. Do not weaken any assertion beyond that.
4. **Integrity tests** (jest), each a separate test:
   - fully-authored block (every key, including `collapsible: false`, `style: default`, `height: 1`) → byte-identical to today after a Damage;
   - authored `collapse_default: true` alone survives a write; collapse toggling in the chrome still works as before;
   - `temp_stamina` absent, Damage leaves it 0 → stays absent; a temp-stamina gain → written;
   - `current_stamina` absent → a Damage writes it;
   - `recoveries` / `recoveries_max` / `_dse_anchor` behaviour unchanged;
   - two stamina-bar blocks in one note — one minimal, one fully authored — each writes its own shape (no cross-talk);
   - legacy `ds-stamina` alias behaves the same as `ds-stamina-bar`;
   - content above and below the fence is untouched.
5. **e2e** (real Obsidian, asserts the NOTE FILE): add one test under the existing stamina-bar e2e surface — a minimal legacy block, a Damage applied from the stamina modal, the file afterwards contains exactly the original keys with the new `current_stamina`. Follow `e2e/README.md` for ids, control registration and the coverage gate. If adding it needs new coverage pairs, say so and give the new numbers.
6. **Comments:** update the "BYTE-COMPAT boundary" header comment in `src/elements/stamina-bar/model.ts` (and any StaminaBar.ts comments that claim the defaults always serialize) so they state the new contract and cite SC-466.
7. **CHANGELOG:** one user-facing bullet under `## Unreleased` in `/home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/CHANGELOG.md`, plain words (e.g. "Changing Stamina on an older Stamina Bar block no longer adds collapsible, collapse_default, height and style lines you never wrote."). Commit it on the superproject's worktree branch.
8. **Commit after every coherent step** (test, fix, fixtures, e2e, docs) inside the plugin repo with `git -C`. No co-author trailers or AI attribution in commit messages.

Drive-by fixes: only obviously-correct, local to a file you touched, cannot move a gate baseline — list them under `Drive-by fixes:`. Everything else (e.g. the same defect in other elements such as skills, which also carries `collapse_default`) goes under `Follow-ups:` untouched.

## 3. Gates — the full `dse-verify` battery, in order

Expected baseline at `0ce76dd` (dse-verify CURRENT block): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5408 passed / 1 skipped / 231 of 232 suites** (+ your new tests; on a fresh worktree jest reads one fewer passed / 2 skipped until `npm run shots` has run — compare after shots) · lifecycle **29/29** · e2e **`OBSIDIAN-E2E done: 88/92 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`** (+ your new test) · shots **572**, 0 FAIL · freeze **`freeze OK (276/276 …)`** — this is a data-path change, so expect NO PNG change; any freeze delta is a STOP-and-report, never a rebaseline · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Lifecycle and e2e are required to land.

Run rules (each cost real time before):
- One gate per Bash call. `devbox run -c /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc466-stamina-bar-defaults/draw-steel-elements && npm run <x> > <log> 2>&1; echo rc=$? > <rcfile>'` — never a compound `cd X && devbox run …` outside the quotes, never pipe a gate through `tail`.
- `rm -f main.js styles.css` in the plugin root before `npx jest` (stale-bundle footgun).
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r1-impl-<your agentId>/`. All scripts/logs go there with unique names. Create files with the Write tool, not heredocs. Never glob `rm`; delete only paths you created, by exact name.
- Set your own `DSE_LIFECYCLE_PORT` (e.g. 9293) for lifecycle; other sessions run it concurrently.
- Never `pkill`/`killall` by pattern; kill only a PID whose command line contains `worktrees/sc466-stamina-bar-defaults/`. Never `rm -rf /tmp/dse-obsidian-lifecycle-*` or any shared glob. Never `rm -rf` anything under `.superpowers/`.
- Never `--headed` / `DISPLAY=:1`.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND; never background a gate and wait for a notification (it never comes).
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or a per-run unique path.
- Use `git -C <absolute path>` for every git command.
- No tags, no releases, no pushes.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc466-stamina-bar-defaults/sc466-r1-impl-report.md`. It must open with a ≤10-line executive summary (verdict, final shas, gate numbers). Body: root cause with file:line; every writer of this block you traced and how presence survives it; every changed fixture (file:line, before/after); new test names/ids; the e2e numbers line and run id; Drive-by fixes; Follow-ups. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), plugin sha(s), superproject sha, measured gate numbers, plus the filesystem path of every evidence artifact (report, gate logs). No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report; I will resume you. If you ever do send a message anyway, its FIRST WORD must be `SC-466:`.
