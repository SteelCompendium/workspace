# SC-595 r2 — implementation round (implementer)

You are the r2 implementer for SC-595. Your final text goes to the ticket-owner, not a human. This brief is self-contained and replacement-ready.

## 1. Context loading

- Ledger (the spec; read ALL of it, especially "Owner rulings" O1-O7): `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/decisions.md`
- The diagnosis you are implementing: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-r1-diagnosis-report.md` — read §1-§6 in full (it is the design: §4 A, the tests list at the end of §4, the modal table in §5, the G-S83 authoring footguns in §6). Its real-Obsidian probe scenario is a working CDP mouse driver you should reuse for G-S83: `sc595-r1-probe-scenario.mjs.txt`, `sc595-r1-run-probe.sh.txt`, `sc595-r1-make-probe.py.txt` in the same dir (scratch copies under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r1-reviewer-diag/`).
- Skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` — "The battery, in order", "Lifecycle and e2e notes", "THE exit-code footgun", "Block edit form Save and embeds (SC-556)" (esp. the SC-584 "Authoring footguns"), "Current expected numbers" CURRENT block.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes`. dse is `draw-steel-elements/` on branch `sc595-hover-form-click-closes` at `eaa8742a`. First: `git -C /home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/draw-steel-elements fetch origin` and check `origin/develop`; if it moved past `eaa8742a`, `git -C … rebase origin/develop` before any change and report the new base. Verify `pwd`/paths before every write: never write under `/home/scott/code/steelCompendium/workspace/` except your report and logs in the ledger dir.
- **Workers never call the tracker** (Linear) — not to read history, not to post.

## 2. The task

Implement **design A, steps 1-3** of the r1 report, per owner ruling O4 (quoted verbatim from the ledger):

> **Design A adopted** (r1 report §4 A, steps 1-3): keep the hover preview alive while a DSE modal opened from it is open — the modal stops its own `click` events at its document in the bubble phase (`stopPropagation`, NEVER `preventDefault`), only when the opener's element sits inside `.hover-popover`; after the opening event, the modal re-pushes its keymap scope (`app.keymap.popScope(scope); app.keymap.pushScope(scope)`) so Esc works. Implemented once in `DseModal` / `managedModal.ts` so it covers every DSE modal opened from a preview (r1 §5 table).

and O5: Esc in a form opened from a preview must close the form (folded in, step 3).

Requirements:
1. One mechanism in `src/framework/kit/managedModal.ts` (`DseModal` and/or `openManagedModal`), anchored by the opener's element; outside a hover preview NOTHING changes (no listener, no scope re-push). Plumb the anchor from every opener in r1 §5: `FormModal.ts` `openFormEditor` (pass `cx.host.containerEl` or equivalent), the `openManagedModal` callers (`elements/stamina-bar/view.ts`, `elements/hero/view.ts` both call sites, `elements/conditions/panel.ts`, `elements/montage/view.ts`, `views/StaminaEditModal.ts` → FreeHealConfirmModal), and `elements/initiative/view.ts` `openModal` (ConditionsModal, ResetEncounter, MinionStaminaPool). If any of those modals does not extend `DseModal`, say so and either route it through the same helper or report it as a follow-up — do not silently skip it.
2. The click guard lives on the modal's own document (`this.containerEl.doc`), bubble phase, stops propagation only for targets inside the modal's `containerEl`, is registered on the modal's lifecycle and gone after close. r1 did NOT probe the document placement separately from `.modal-container` placement — your G-S83 is the proof; if document placement fails in real Obsidian, use `.modal-container` and say why.
3. Check (grep `src/`) for any DSE `window`-level `click` listener that a click inside a preview-opened modal must still reach; list what you found in the report. Check that an Obsidian `Menu`, dropdown or suggest opened from inside one of these modals still opens and closes (r1: Menu also closes on mousedown).
4. Scope re-push (step 3): after the opening event has finished (`win.setTimeout(…, 0)` on the modal's window), only if still open. After close, the popover's scope must be on top again (Modal.close's own `popScope`).
5. Do NOT change any write path (pin, `pinnedTarget`, `lastWrite`, `keepFormOpenOn`). SC-552 / SC-556 / SC-584 behaviour must be byte-for-byte unchanged. G-S64 phases (zk)-(zn) and their `hp.hide = () => {}` stand-in stay as they are.
6. Out of scope (do not fix): SC-597 (a modal opened from a preview by keyboard closes ~300 ms later), SC-594, SC-596. If your G-S83 needs to avoid SC-597, open modals by a real mouse click.

### Tests
- **jest** (`test/dom`, jsdom): r1 §4 "Tests" items (a)-(e): window-bubble click spy not called for clicks in a preview-opened form (textarea and Save), a document-level bubble listener still called; an Obsidian-shaped `label.checkbox-container > input[type=checkbox]` still toggles and fires `change`; control outside a preview → spy called; guard gone after close; keymap: add a small scope stack to the jest `Modal`/`app.keymap` mock (`test/mocks/obsidian-core.ts`) if needed, simulate the popover's later `pushScope`, run timers → modal scope on top; after close the popover's. Cover at least one non-form modal (StaminaEditModal or ConditionsModal) through its real opener.
- **Mutants** (r1 §4 (f)): drop the guard → (a) red; use `preventDefault` → (b) red; drop the re-push → (e) red; drop the `.hover-popover` condition → (c) red. Run each, record red/green in `sc595-r2-mutants.log`, revert.
- **Lifecycle G-S83** (new scenario; id reserved for SC-595), placed in **part 5** after G-S77 and before G-S56 in SCENARIOS order (G-S56 stays LAST). Real CDP mouse (`Input.dispatchMouseEvent`), Reading view AND Live Preview, per r1 §4 "Lifecycle G-S83" and the §6 authoring footguns: hover the link, + then the pencil; a real press+release in the form's raw box → preview and form still open; `Input.insertText`, a real click on Save → the note holds the edit, no Notice, preview still shown; a real click outside → the preview closes; Esc on a new form → the form closes, preview stays; the stamina modal and the initiative ConditionsModal opened from a preview by a real click: a real click on the modal title leaves them open. **Red on base**: run G-S83 against `eaa8742a`'s src (stash or a scratch build — never by editing develop) and record that it fails, in `sc595-r2-red-on-base-G-S83.log`. Keep G-S83 lean (target ≤ 90 s alone): part 5 is ~272 s today.
- **Add NO phases to G-S64** (part 3 is at the ~480 s line).
- E2E: the e2e runner reads test titles for scenario ids — never put a bracketed ticket id in a test title. No new e2e spec is required; if you add one, follow the runner's manifest/coverage rules.

### Docs
- CHANGELOG: a bullet under `## Unreleased` in YOUR worktree's superproject: `/home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/CHANGELOG.md` — NEVER under `/home/scott/code/steelCompendium/workspace/`. User-facing wording: a click inside a block edit form (or the stamina / conditions / other DSE windows) opened from a hover preview no longer closes it and loses the edit; Esc closes such a form. Commit it on the superproject branch `sc595-hover-form-click-closes` in the worktree.
- dse-verify: do NOT edit SKILL.md. Write a proposal file `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-dse-verify-proposal.md` with the exact text changes: new CURRENT numbers (lifecycle 55/55, part 5 `G-S59 G-S49 G-S73 G-S77 G-S83` (5) with its wall time, jest count), the correction to SC-584 Authoring footgun (2) (the click no longer closes the form; `hp.hide = () => {}` remains in (zk)-(zn) only as a click-free stand-in), and any G-S83 authoring footguns.
- Inline comments where the logic is non-obvious (why stopPropagation and not preventDefault; why the scope re-push is deferred; why only inside `.hover-popover`).

Commit in coherent steps on the dse branch (commit after each step — nothing sits uncommitted through a gate). No tags, ever. Do not push.

## 3. Gates (dse-verify battery, in order) and expected numbers

Baseline at `eaa8742a`: tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **7177 non-skipped passed / 2 skipped** in a fresh worktree (two SC-568 load-timeout suites `initiative-default-keys`, `twin-reuse` may time out under load — green alone) · lifecycle **54/54** in FIVE `--only` parts: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16); `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4); `G-S59 G-S49 G-S73 G-S77` (4) → after your change part 5 is `G-S59 G-S49 G-S73 G-S77 G-S83` (5) and the total **55/55** · e2e **`OBSIDIAN-E2E done: 258/264 ok, 0 failed, 6 known-bug, coverage: 164/164 pairs`** (RECOV-R07 is a documented load flake: re-run alone if it is the only failure) · shots **592**, host-leak 163/978, modal host-leak 39 kinds / 234 comparisons, capture clip 147 · freeze **280/280** · parity **0 GAPs / 0 undeclared / 24 DECLARED**. If `styles.css` is byte-identical to a clean `eaa8742a` build (sha256 `5e5ff488…`), shots/freeze/parity carry and you may say so instead of running them — state the sha you measured. Expected new jest count = 7177 + your new tests.

## 4. Footguns (all apply)

- No compound `cd`: `git -C <abs>` for every git command; `devbox run -c /home/scott/code/steelCompendium/worktrees/sc595-hover-form-click-closes/draw-steel-elements -- <cmd>`. Record exit codes via a script FILE run through devbox, not `bash -c '…; echo rc=$?'` (always 0), and never pipe a gate into `tail`.
- `rm -f main.js styles.css` in the plugin root (literal paths) before `npx jest` if a stale build shadows sources (dse-verify "Stale main.js").
- Never `rm` with a variable target; never a glob `rm` under /tmp; delete only literal paths you created.
- One gate per Bash call, in the FOREGROUND; no background gates and no Monitor, except shots — and then poll its own log, never wait for a notification. Redirect long output to a file rather than streaming it (the 600 s stream watchdog kills silent agents); split lifecycle into the five `--only` parts, one call each.
- Never set `DSE_LIFECYCLE_PORT`. Give each lifecycle/e2e/shots run a private `DSE_CAMERA_TMP`.
- Kill scratch processes by literal PID only, and only a PID whose cwd (`readlink /proc/<pid>/cwd`) or command line is inside YOUR worktree. Never `pkill`/`killall` by pattern.
- Private scratch subfolder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc595-r2-impl-<your agentId>/`; uniquely named scripts/logs inside it.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches. Read the process's own output, or write to a per-run unique path.
- Never `rm -rf` anything under `.superpowers/` other than files you created.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, `compendium-manifest.json`, `demo-vault/*.md`) is Scott's live vault and expected; ignore it and never write there.
- Concurrent efforts SC-573 and SC-578 run lifecycle/e2e on this host: expect load; part 3 runs near 480 s.
- A worktree's superproject docs can be stale for doc-reading tests (PROJECT.md footgun 4): if `token-coverage.test.ts` goes red, compare with the main checkout's copy and use `DSE_TOKEN_MAP_PATH`.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question. If you ever message anyway, the first word must be `SC-595:`.

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc595-hover-form-click-closes/sc595-r2-impl-report.md`, OPENING with a ≤10-line executive summary (shas, gate numbers, red-on-base result, anything not done). Gate logs next to it with the `sc595-r2-gate-` prefix (`…-tsc.log`, `…-lint.log`, `…-jest.log`, `…-lifecycle-p1.log` … `-p5.log`, `…-e2e.log`, `…-styles-sha.log`), plus `sc595-r2-mutants.log`, `sc595-r2-red-on-base-G-S83.log`, and the proposal file above. Separate `Drive-by fixes:` (made) from `Follow-ups:` (left alone).

## 6. Return contract

Final text: raw facts, no prose — STATUS, dse branch head sha + superproject branch head sha, each gate's summary line, red-on-base result, mutant results, drive-bys/follow-ups, and the absolute path of every artifact you produced.
