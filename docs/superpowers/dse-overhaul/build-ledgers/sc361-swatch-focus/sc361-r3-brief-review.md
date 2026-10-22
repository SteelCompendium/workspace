# SC-361 r3 brief — independent adversarial review (orchestration:reviewer)

## 1. Context loading

- Ledger (current state, authoritative):
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/decisions.md`.
- The implementation brief you are reviewing against:
  `…/sc361-swatch-focus/sc361-r2-brief-impl.md`, and the implementer's report
  `…/sc361-swatch-focus/sc361-r2-impl-report.md` (read its executive summary; dive in only
  where you need to). r1 design report (Option B spec): `…/sc361-r1-design-report.md` §4, §7.
- `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (battery,
  command shapes, footguns).
- Branch under review: dse submodule
  `/home/scott/code/steelCompendium/worktrees/sc361-swatch-focus/draw-steel-elements`, branch
  `sc361-swatch-focus`, head **`0daae2f`**, base `95981f1` (`origin/develop`). Review
  `git -C <abs> diff 95981f1..0daae2f`. Do NOT commit to this branch; you review, you don't fix.
  If you need a mutable copy, make your own `git worktree add` into your private scratch folder
  and remove it (by its exact path) when done.
- **Workers never call the tracker** (Linear). Use `git -C <absolute path>` for every git command.
- Main-checkout dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json`,
  `demo-vault/*.md`) is Scott's live vault — expected; ignore.

## 2. The task

Scott's ruling, verbatim from the ledger:

> * option B looks good
> * Lucide check
> * showing the check on the pipette is ok

Ticket requirements, verbatim:

> * A focused unselected swatch must not look like a selected one.
> * A focused selected swatch must look different from an unfocused selected one.
> * The difference can't rely on color alone.
> * The swatches sit about 7px apart (`gap: 0.45em`), so a ring drawn farther out than the current selection ring will run into the neighboring swatch.

Execute and probe, don't just read:

1. **Re-run the full battery yourself at `0daae2f`** in the worktree (tsc, lint, jest,
   lifecycle, e2e, shots, freeze, parity — order and expectations in §3) and compare to the
   implementer's numbers.
2. **Visual probe** in real Chromium with real Tab focus (r1 capture script:
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r1-design-1792550042879830531/sc361-capture.cjs`,
   read-only — copy it) and, if a display is available, real Obsidian: all four states, pipette
   idle/focused/selected/selected+focused, dark + light, grayscale. Check every requirement
   above, the check's contrast against the lightest and darkest preset fills, and the
   selected-next-to-focused clearance. Check mouse click does NOT show the ring (focus-visible
   only) and that after a keyboard pick (SC-468 behaviour: focus stays on the picked option)
   the swatch shows ring + check.
3. **Host invariance / SC-356 coordination probe.** SC-356 (in flight, branch
   `sc356-hostleak-modal-buttons`, dse commits `f4deeff`, `c331f78`, `0c8fae4` on top of
   `bc4a0c5`, readable from this object store) adds a modal host-leak pass whose
   `HOSTLEAK_KNOWN_LEAKS` entry allowlists `.dse-swatch` (ticket SC-361). In a scratch
   `git worktree add` of `0daae2f`, cherry-pick those three commits, delete the SC-361
   allowlist entry, and run `npm run shots`: report the modal host-leak line. Expected: the
   swatch is clean (green with the entry deleted). Also report whether, with the entry KEPT,
   the pass fails with "no longer leaks — remove it" (it should, for every pinned property).
   Report precisely which properties still leak, if any.
4. **Code review:** the selected-marker logic for custom colours (case-insensitive preset
   compare, empty/undefined colour, a custom colour equal to a preset hex in different case,
   re-render after picking a preset then a custom then a preset again); ARIA validity (no
   `aria-pressed` on the `<label>`; how the custom selected state is announced); the shared kit
   ring rule still being the FIRST `:focus-visible` + `--dse-focus-ring` rule
   (`kit-index.test.ts focusRule()`); the extended shots pressed-toggle parity actually failing
   when the check is removed (mutate and re-run — prove the test is not vacuous); jest tests
   failing when the feature is reverted (mutation-test at least the CSS assertions and the
   custom-selected logic); scope (no edits outside swatch CSS / ConditionsModal colour row /
   their tests; nothing touching SC-422 text-scale, SC-326 montage board, SC-356 option chip
   rules); commit messages carry no AI attribution.
5. Mobile/`--input-height` or font-size extremes: does a pinned size or the check scale sanely
   at Obsidian's smallest and largest UI font size?

## 3. Gates — expected (dse develop @ `95981f1`) plus the implementer's stated deltas

tsc/lint clean · jest 5582 / 1 skipped / 234 of 235 (+ new tests) · lifecycle 31/31 · e2e
`95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` (+ any added) · shots 580 / 0 FAIL incl. `text scale OK (1626 …)` + `text scale once OK (104184 / 208 loads …)` ·
freeze `280/280` (must be unchanged) · parity 0 GAPs / 0 undeclared / 24 DECLARED.
Run each gate in the foreground, output redirected to a log in your scratch folder; record exit
codes from a script file run via `devbox run -c <dse abs path> -- bash <script>`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc361-swatch-focus/sc361-r3-review-report.md`,
opening with a **≤10-line executive summary** (verdict LAND / FIX, finding counts by severity,
gate numbers). Findings by severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) with file:line, a failure
scenario, and a prescribed fix. Evidence images to
`…/sc361-swatch-focus/evidence-r3/` (prefix `sc361-r3-`).

## 5. Footguns (adapter §8 — all apply)

- Private scratch folder: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r3-review-<unique>/`;
  every script/log in it uniquely named; create files with the Write tool (footgun 12, 13).
- `devbox run -c <abs path> -- …`; never `cd` inside a compound command; no glob `rm`
  (footguns 1, 13). Never `pkill`/`killall` by pattern — only a PID whose command line contains
  your own worktree path (footgun 9). Never `rm -rf /tmp/dse-*` or any shared glob (footgun 11)
  or `.superpowers/` (footgun 7).
- If the report-file write is blocked by your harness, return the report inline.
- Never key a wait-loop on a scratch filename or its contents — stale logs from other branches
  will match. Read the process's own output, or write to a per-run unique path.
- Redirect long-running output to a file (600s stream watchdog). Run gates in the foreground;
  never end your turn "waiting for a notification".
- You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with
  `STATUS: NEEDS_CONTEXT` and the question. Any message you do send starts with `SC-361:`.

## 6. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, findings by severity with
file:line, each gate's summary line and exit code, the SC-356 probe result, your scratch folder,
and the **absolute path of every evidence artifact and the report**.

## 7. Addendum (owner, at dispatch)

- Implementer deviations to judge: (1) swatch font pinned to `var(--dse-fs-control)` (all six
  swatches now 19.125px at the harness and track the control-text scale; `fontSizeContract.test.ts`
  rejected a literal fallback); (2) case-insensitive hex compare for preset "pressed" and the
  custom test; (3) no real-Obsidian crop (COND-E07 asserts ring + check in real Obsidian instead).
- Implementer follow-up to rule on in your findings: an unparseable YAML colour still counts as a
  custom selection (pipette shows the check on a muted fill). Is that a bug? Prescribe the fix if so.
- Implementer's host-invariance probe (not committed): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc361-r2-impl-1792606885888966588/sc361-r2-hostleak.cjs`
  (0 diffs; 92 with pins removed). Your SC-356 cherry-pick probe is the independent check.
- `origin/develop` has moved to `8d890f9` since; review at `0daae2f` on `95981f1` — the owner
  handles the final rebase. Do NOT rebase.
- The DISPLAY `:1` is Scott's; do not use it. Real-Obsidian checks run via the headless gates.
- Lifecycle may need a free CDP port (others in use: 9262, 9287, 9291, 9343, 9379, 9387 — see
  dse-verify for the override); exit 2 = environment, not code.
