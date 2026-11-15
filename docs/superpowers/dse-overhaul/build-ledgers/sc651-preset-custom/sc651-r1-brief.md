# SC-651 r1 — implementer brief: Preset dropdown snaps back on a "Custom" pick

You are the r1 implementer for Linear ticket SC-651. Your final text goes to the ticket-owner,
not a human. **You never call the tracker** (Linear) — not to read history, not to post.

## 1. Context loading

Read first, in this order:
1. `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/decisions.md` — the ledger. It is the spec. Rulings there are binding.
2. `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — the gate battery. It is ~370 KB: read lines 1-250 (battery, devbox, jest, lifecycle and e2e notes incl. "Settings e2e (SC-440)" at ~line 206) and the "Current expected numbers" section (grep `^## Current expected numbers`, read only the CURRENT paragraph). Do not read the whole file.
3. `/home/scott/code/steelCompendium/workspace/draw-steel-elements/AGENTS.md` if present (read it from your worktree's copy instead: `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/AGENTS.md`).

Worktree: `/home/scott/code/steelCompendium/worktrees/sc651-preset-custom`. Plugin dir:
`/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements`, branch
`sc651-preset-custom`, at dse `develop` `cefa9ca8` (verify: `git -C <plugin dir> rev-parse --short HEAD`
and `git -C <plugin dir> fetch origin develop` then `rev-parse --short FETCH_HEAD`; if develop has
moved past `cefa9ca8`, rebase onto it and say so). Superproject branch `sc651-preset-custom` at
workspace `origin/main` `c63ec316`.

**The main checkout `/home/scott/code/steelCompendium/workspace` is shared global state — never write
there** except your report file in the ledger dir. Its dse dirt (`demo-vault/Welcome.md`, untracked
`compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault: expected, not yours, ignore it.
The workspace-level files you edit (CHANGELOG.md) live in YOUR worktree's superproject at
`/home/scott/code/steelCompendium/worktrees/sc651-preset-custom/CHANGELOG.md` — never under
`/home/scott/code/steelCompendium/workspace/`.

## 2. The task

Bug (ticket text, verbatim):

> **Repro:** Settings → Draw Steel Elements, with the preset at Steel card. Pick Custom in the Preset dropdown. It reads Custom. Open another settings page and come back: it reads Steel card.
>
> **Expected:** the dropdown always shows what reopening the page would show. Either picking Custom is refused and the dropdown snaps back, or it means something and is saved.

Owner ruling (from the ledger, verbatim):

> **Refuse and snap back.** … The fix: when the pick is `custom`, put the dropdown back to `deriveSbPreset(prefs)` and write nothing. When the derived state already is `custom`, the pick is a no-op that still reads Custom.
> Do NOT disable the `<option>`: a keyboard End / ArrowDown on a closed native select skips disabled options, so End would land on "Index card" and APPLY that preset (a write the user did not ask for). The option stays enabled; the change handler refuses it.
> scope is the Preset dropdown only (`renderPresetControl`). No change to `pipeline.ts`, `main.ts` sync paths, or the settings change path (SC-644 / SC-646 / SC-653 are other owners').

Where: `src/views/SettingsTab.ts`, `renderPresetControl` (~line 434-454): `if (value === 'custom') return;`.

Deliverables:
1. The fix in `renderPresetControl`. Keep the design comment accurate (it already says Custom is a label the user cannot select into; add that a pick of it snaps back).
2. jsdom tests (find the existing preset tests: `grep -rn "sb-preset\|deriveSbPreset\|renderPresetControl\|'custom'" test/dom/views/`; the settings suites are `test/dom/views/settings-matrix.test.ts`, `settings-integrity.test.ts`, helper `_settingsHarness.ts`, and `settings-tab*.test.ts`). Pin: (a) preset Steel card, change event with `custom` → the select reads `steel`, no pref was written (no `prefs.set` / `saveData` call, prefs unchanged); (b) a member twiddled so the derived preset is `custom`, then a `custom` change event → still reads `custom`, nothing written; (c) control: picking `index` still applies the bundle. Prove (a) is red against the unfixed code (revert the fix locally, run the test, restore; report the red message).
3. e2e: `e2e/specs/settings/dropdowns.e2e.ts:147`, the `knownBug('SC-651', '[SET-D16] …', fn, { failsWith: /afterPick/ })` becomes a plain test with the same id and title (no bracketed ticket id in the title — the runner reads titles for scenario ids). Check how other flipped markers were turned into plain tests in that file / sibling specs and follow that form. Run it alone first (`--only=SET-D16`) to see it green.
4. CHANGELOG: one bullet under `## Unreleased` in the worktree superproject's `CHANGELOG.md`, plain words, user-facing ("In the plugin settings, picking Custom in the statblock Preset dropdown no longer leaves it reading Custom when nothing changed: it goes back to the preset your options match."). Match the neighbouring bullets' form. Commit it in the superproject on branch `sc651-preset-custom`. **Do NOT make a submodule pointer-bump commit** in the superproject — the owner sequences that last.

Commit in the plugin on branch `sc651-preset-custom` after each coherent step (fix + jsdom; e2e flip). Message prefix `SC-651:`. No co-author / AI attribution lines in commit messages. **Never push anything to origin**, not even the feature branch.

## 3. Gates (dse-verify battery) and expected numbers

Fresh worktree: run `npm ci` once first (through `devbox run -c <plugin dir> -- bash <script file>`, output to a log).

Baseline at `cefa9ca8`: jest **13390 passed / 1 skipped** with the shots cache, **13389 / 2** fresh (you have no shots cache, so expect 13389 + your new tests / 2 skipped) · lifecycle **64/64** · e2e **`611/622 ok, 0 failed, 11 known-bug, coverage: 417/417 pairs`** · shots 592, freeze 280/280, parity 0/0/24.

Expected after your change: tsc (also `tsc -p e2e` if the battery says so) and lint clean · jest 13389 + N new / 2 skipped, 0 failed · lifecycle **64/64** · e2e **`612/622 ok, 0 failed, 10 known-bug, coverage: 417/417 pairs`** (the marker becomes a plain passing test: ok +1, known-bug −1, no new pair). If your numbers differ, explain each difference.

Shots / freeze / parity: build `styles.css` and compare its sha256 to a clean `cefa9ca8` build (`git -C <plugin dir> stash` is NOT allowed; build the base from a `git archive cefa9ca8` export in your private scratch dir with `node_modules` symlinked). If byte-identical and your `src/` diff is confined to the Preset change handler, report "styles.css identical, shots/freeze/parity carry" and skip them. If not identical, run shots, freeze, parity per the skill and report.

Lifecycle runs in SEVEN parts with `--only=` (EQUALS sign; with a space the runner runs the whole suite — check the log's first lines). Ids comma-separated:
1. `G-S7a,G-S7b,G-S6a,G-S6b,G-S6u,G-S28,G-S5n,G-S1,G-S2,G-S3,G-S4,G-S5,G-S6c,G-S6d,G-S6e,G-S6f,G-S6g,G-S6h,G-S6i,G-S8,G-S9a` (21)
2. `G-S9b,G-S9d,G-S9e,G-S9f,G-S9c,G-S10,G-S11,G-S12,G-S13,G-S15,G-S14,G-S18,G-S32,G-S36,G-S33,G-S40` (16)
3. `G-S45,G-S44,G-S42,G-S50,G-S53,G-S54,G-S52,G-S63,G-S64` (9)
4. `G-S57,G-S62,G-S61,G-S56` (4)
5. `G-S59,G-S49,G-S73,G-S77,G-S83,G-S87,G-S91` (7)
6. `G-S92,G-S96,G-S97,G-S99` (4)
7. `G-S108,G-S112,G-S115` (3)

Run one part per Bash call, output redirected to a unique log in your private scratch dir; the Bash tool backgrounds any call over 180 s — then poll with `timeout 175 tail --pid=<your node pid> -f /dev/null` in a FOREGROUND call (pick the pid whose `readlink /proc/<pid>/cwd` is your worktree's plugin dir), then read the log. Never wait on a background-completion notice. Run e2e (~6-8 min) the same way.

Known flakes (re-run before believing): G-S91 FAIL is real unless it says the host was too slow after two re-runs · G-S115 (g) suspected flake (SC-633): re-run part 7 once · INIT-W10 e2e under heavy load (SC-654) · SET-X03 / SET-X04 e2e (SC-657): a re-run passes · if G-S97 fails, check `demo-vault/.obsidian/appearance.json` in YOUR worktree is clean (`git -C <plugin dir> status`) and restore it before blaming the change (SC-622) · a jest "Exceeded timeout" is a real hang until proven otherwise.

## 4. Footguns (every one has cost real time)

- Devbox: `devbox run -c <abs plugin dir> -- bash <abs script file>`. Never `cd X && …` in a compound command; never trust an echoed `$?` inside `bash -c`; never pipe a gate into `tail`. Record exit codes inside a script file. Write scripts with the Write tool.
- `git -C <absolute path>` for every git command.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc651-r1-impl/` with uniquely named scripts and logs inside it. Never generic names (`gate.sh`).
- **Never `rm`, `rm -f`, `rm -rf` or `rmdir` anything in /tmp or the scratchpad, and no `rm` with a shell-variable path anywhere** — it hangs on a permission prompt nobody answers. Leave throwaway files in place; overwrite with `>`; use fresh unique filenames. (The dse-verify `rm -f main.js styles.css` before jest: use literal absolute paths, `rm -f /home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/main.js /home/scott/code/steelCompendium/worktrees/sc651-preset-custom/draw-steel-elements/styles.css`.)
- Never `pkill`/`killall` by pattern; kill only a PID you verified is yours via `/proc/<pid>/cwd`.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- No background gates, no Monitor: each gate is a foreground call (or a foreground poll on the pid as above).
- `grep` is ugrep with `-I`: use `command grep -a` on `e2e/run.mjs`.
- You cannot `SendMessage` me — a depth-2 agent cannot reach its parent, and `to: 'main'` goes to the dispatcher. If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-651:`.

## 5. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc651-preset-custom/sc651-r1-impl-report.md`.
It must open with a ≤10-line executive summary (verdict, dse sha(s), superproject CHANGELOG sha, measured gate numbers). Body: diff summary with file:line, the red-proof message for the new jsdom test, per-part lifecycle lines, the e2e done line, styles.css shas, any re-runs and why, and two lists: `Drive-by fixes:` (made) and `Follow-ups:` (left alone). If the report-file write is blocked by your harness, return the report inline.

## 6. Return contract

Final text: raw facts, no prose — verdict, plugin sha(s), superproject sha, measured numbers, and the
absolute path of every artifact you produced (report, logs).
