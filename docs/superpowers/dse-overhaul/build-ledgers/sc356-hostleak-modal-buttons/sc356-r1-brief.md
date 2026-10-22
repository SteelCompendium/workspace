# SC-356 round 1 — implementer brief

## 1. Context loading
- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-decisions.md` (the ledger — current-state rulings).
- Read: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery, command shapes, CURRENT numbers; its "Button host-leak sweep" bullet and the SC-338 notes).
- Read `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/draw-steel-elements/AGENTS.md` if present.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons`. DSE repo: `.../draw-steel-elements`, branch `sc356-hostleak-modal-buttons`, currently at `ba20072` = `origin/develop`. Run `git -C <abs dse path> fetch origin` and confirm `origin/develop` is still `ba20072`; if it moved, rebase onto it and say so.
- Verify `pwd`/paths before every write. NEVER edit under `/home/scott/code/steelCompendium/workspace/` — the shared main checkout. Workspace-level files (e.g. the dse-verify SKILL.md) live in YOUR worktree's superproject at `/home/scott/code/steelCompendium/worktrees/sc356-hostleak-modal-buttons/.claude/skills/dse-verify/SKILL.md`.
- Use `git -C <absolute path>` for every git command, never `cd X; git …`.
- You never call the tracker (Linear) — not to read, not to post.

## 2. The task
Ticket scope, verbatim from the ledger:
> This ticket is to make the gallery sweep cover modal-only buttons as well, either by mounting them in the gallery or by adding a modal pass, and to add `aria-pressed` to the grouping key.

> Related gap found in the SC-338 review: the chips still take their height (30px), background and unpressed text color from Obsidian rather than from plugin tokens. A modal-aware sweep would surface that too.

Owner rulings (ledger): approach is a MODAL PASS inside the Playwright harness. The harness already opens plugin modals in `visual-harness/shoot.mjs` (`assertPressedToggleParity`, ~line 3088+, drives `.dse-modal` ConditionsModal duration/effect chips and the montage LogActionModal result chips) — reuse that mechanism rather than inventing a new one.

Concretely:
1. **`tagButtons()` (~shoot.mjs:1975)**: add `aria-pressed` to the grouping key (e.g. `|aria-pressed:true` / `:false` when the attribute is present) so pressed and unpressed chips are separate kinds.
2. **Modal pass for `assertBtnHostLeak` (~shoot.mjs:2213)**: open every plugin modal the harness can open (enumerate them — at minimum ConditionsModal and montage LogActionModal; survey `src/` for every `Modal` subclass that renders buttons and report which ones the harness can and cannot open, and why) and run the same with-vs-without-host-copy computed-style comparison, at the same 3 states (rest / hover / focus-visible) × dark/light, over every button kind inside `.dse-modal`. Keep the same exemption accounting and print the modal pass's own count line (kinds / comparisons / exemptions) so its coverage is visible, either as a separate line or clearly broken out. A modal that cannot be opened must FAIL loudly ("the check would be blind"), not silently skip.
3. **Prove the pass is live**: before fixing anything, run it and record what leaks it reports (expect `.dse-optchip` height / background / unpressed color). Then also prove it would catch a regression after your fixes: inject a temporary leak (e.g. remove one pinned property) and show the FAIL line, then restore. Record both in the report.
4. **Fix the leaks it surfaces**, per the ruling: "Leaks the new pass surfaces get FIXED in this ticket, with the constraint 'zero pixel change in real Obsidian': the plugin pins each leaked property to the value Obsidian currently gives it, from plugin tokens. Freeze must stay 276/276 with no rebaseline. Any leak whose fix would visibly change a control comes back to the owner (STATUS: NEEDS_CONTEXT) — that is a Scott decision." Use existing tokens where one already carries the right value; follow the repo's token conventions (and `token-coverage.test.ts` / D3-token-map if you add a token). Add a jsdom/unit pin if the repo pattern for such fixes has one (look at how SC-205 / SC-338 pinned theirs).
5. **Scope fence**: SC-422 (parked, unlanded) also edits `visual-harness/shoot.mjs` (text-scale gates over chrome surfaces). Keep your shoot.mjs edits scoped to the host-leak sweep and `tagButtons` — no refactors of shared helpers beyond what the modal pass needs. Do not touch the gallery/chrome composition.
6. **Docs**: update the "Button host-leak sweep" bullet in YOUR worktree's `.claude/skills/dse-verify/SKILL.md` with the new expected lines (gallery kind count may move because of the aria-pressed key — explain any change) — do NOT edit the CURRENT block (the dispatcher writes it at landing). Commit the superproject doc edit in the worktree superproject (not the pointer bump — landing does that).
7. Commit in the dse submodule after every coherent step. Report any drive-by fixes / follow-ups separately (see return contract).

## 3. Gates — full dse-verify battery, in order, in YOUR worktree
Expected at base (`ba20072`, CURRENT): tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **5260 passed / 1 skipped / 230 of 231 suites** (plus whatever you add; jest reads one fewer + 2 skipped until shots has cached obsidian-app.css) · lifecycle **27/27** · e2e **`OBSIDIAN-E2E done: 83/87 ok, 0 failed, 4 known-bug, coverage: 57/57 pairs`** · shots **572**, 0 FAIL (gallery button host-leak 112 kinds / 672 comparisons before your aria-pressed change; report the new number and why) · freeze **`freeze OK (276/276 …)`** — must stay exactly this · parity **0 GAPs / 0 undeclared / 24 DECLARED**.
Lifecycle and e2e are REQUIRED to land.

## 4. Footguns (all apply)
- Devbox: `devbox run -- bash -c 'cd <abs dse path> && <cmd>'`; devbox's sh eats `$?`/`$PIPESTATUS` and `| tail` eats failures — run gates via wrapper script FILES that capture the exit code, output redirected to files. Devbox resolves its project from the caller's cwd; use `devbox run -c <dir> -- …` to pick explicitly.
- `npm ci` if a rebase changed package.json's obsidian version.
- Stale superproject pin: if `token-coverage.test.ts` reports phantom reds, compare the D3-token-map copies and use `DSE_TOKEN_MAP_PATH` (dse-verify / adapter footgun 4) — not a code defect.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/` is SHARED by every agent. Make a private subfolder `sc356-r1-impl-<your agentId or a random suffix>/` and put uniquely named scripts and logs there only.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches, and a stale log from another branch will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Run gates in the FOREGROUND (timeout up to 600000ms; split into separate calls if needed). Do NOT background a gate and wait for a notification — it will never come.
- Never `pkill`/`killall` by pattern. Kill only by PID whose command line contains `worktrees/sc356-hostleak-modal-buttons/`.
- Never `rm -rf` a shared glob (`/tmp/dse-obsidian-lifecycle-*` etc.) or the shared `.superpowers/` dir; delete only paths you created and recorded.
- Never touch the shared freeze baseline `.superpowers/sdd/freeze-baseline.sha256`. If freeze moves, STOP and report (ship `sc356-rebaseline.txt` + before/after crops only if asked).
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not yours, don't touch it.
- Real-Obsidian camera (if you use it): private Xvfb + port (`DSE_CAMERA_DISPLAY`, `DSE_CAMERA_PORT`), never `:1`.
- Never create a tag or release on draw-steel-elements. Never push. Never run `just wt-finish` / `just deploy*`.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question in your report. If you ever do send a message anyway, its FIRST WORD must be `SC-356:`.

## 5. Report
Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/sc356-r1-impl-report.md`. If the write is blocked by your harness, return the report inline. It must OPEN with a ≤10-line executive summary.

## 6. Return contract
Your final text goes to the ticket-owner, not a human — raw facts, no prose: STATUS (DONE / NEEDS_CONTEXT / BLOCKED), dse branch head sha + commit list, superproject doc commit sha, every gate's measured line (verbatim), modal list (opened / not openable + why), leaks found pre-fix (kind|property|with-host vs without-host), the injected-regression FAIL line, `Drive-by fixes:` and `Follow-ups:` lists, and the absolute path of every evidence artifact (report, logs, crops).
