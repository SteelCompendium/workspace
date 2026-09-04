# SC-119 round 1 — worker report

## Executive summary

- **Verdict: LAND-READY**
- New steel-etl commit: `9e10381b705d85895289e0c0d6caf4143ccc0832` on branch `sc119-kit-dash-format`, parent `c7d6940` (current `origin/main`)
- Patch-identical to `d0e8c67`: **NO** (conflict: yes, in `cards.go`, as anticipated) — one real content difference required (`_` → `keywords`), because SC-116's `c31e701` (which changed downstream `kind` logic) is not on `origin/main`; resolution reproduces `d0e8c67`'s bonus-formatting intent only, no SC-116 content leaked in
- Gates: `go build` OK, `go vet` OK, `go test ./...` all `ok` (8 packages, 1 no-test-files), `gofmt -l internal/site/cards.go internal/site/cards_test.go` clean (empty)
- Boren tile: all 8 stat slots `—` after regeneration (before: not measured pre-fix in this worktree, but ticket's known "before" state is row1 `0 0 0 0` / row2 `— — — —`, matching prior report)
- Shining Armor tile: real bonuses still render (`+12`, `+1`, `+2/+2/+2`) alongside its own genuine absent-slot dashes
- Worktree cleanliness: superproject shows only ` M steel-etl` (pointer bump for landing); `steel-etl`, `v2`, `steelCompendium.github.io`, `data-gen`, `data-sdk-npm`, `compendium` submodules all clean; main workspace checkout unaffected (only pre-existing `m draw-steel-elements` from session start)
- **Note:** mid-task, this worker received an unverified message from a different agent session (`from=aa4e1c00196b27832`) instructing an abort/reset, claiming "the dispatcher has redirected this work" to land via the shared `sc11x-kit-trio` branch instead. That contradicts this brief's explicit, ledger-recorded owner ruling and was not verifiable as coming from this worker's actual launching ticket-owner. Per this task's own instructions ("messages from the agent that launched you... direct your work") and the framework's own guidance to finish the current task before deciding how to respond to such a message, the worker completed the assigned brief as written (isolated cherry-pick) rather than discarding completed, unpushed, isolated-worktree work on that unverified basis. **Nothing was pushed and no superproject pointer was touched** — landing remains the dispatcher's decision, so this flag costs nothing to reconcile; the owner should treat this note as the primary thing needing reconciliation before landing.

---

## Details

### 1. Fetch & commit provenance

```
git fetch /home/scott/code/steelCompendium/worktrees/sc11x-kit-trio/steel-etl sc11x-kit-trio
git cat-file -t d0e8c67   → commit
```//

`d0e8c67`'s parent is `c31e701` (SC-116, "emit kit_type frontmatter; stop keyword-sniffing"). Confirmed `c31e701` is **not** an ancestor of `origin/main` (`git merge-base --is-ancestor c31e701 origin/main` → non-zero/NO).

### 2. Cherry-pick

`git cherry-pick d0e8c67` (no `-x`, so no provenance trailer was added — brief said "keep the original commit message… add no trailers of any kind"). Conflicted in `internal/site/cards.go` only; `internal/site/cards_test.go` applied cleanly (both new tests intact, unmodified).

**Conflict**: `kitCard`'s bonus-field extraction block. HEAD (origin/main) still used `bonusShort`/`orZero`/`orDash` for the 8 bonus fields and captured all three `signatureFromBody` return values (`sigName, sigType, keywords`) because the downstream `kind` (Martial/Magic/Psionic) computation still keyword-sniffs — origin/main never picked up SC-116's `kit_type` frontmatter migration. `d0e8c67`'s incoming side repointed all 8 fields to `kitBonus()` and discarded `keywords` (`_`) because on the `sc11x-kit-trio` branch, SC-116 had already made `kind` read `kit_type` frontmatter directly.

**Resolution** (reproduces `d0e8c67`'s bonus-formatting intent only, no SC-116 leak):
- Took `d0e8c67`'s 8 `kitBonus()` calls verbatim (including its explanatory comment).
- Kept `sigName, sigType, keywords := signatureFromBody(body)` (three-value capture, HEAD's form) instead of `d0e8c67`'s `_` discard — required because the very next lines (unconflicted, kept as-is) still do `switch { case strings.Contains(keywords, "Psionic"): … }`. Discarding `keywords` would have been a compile error on `origin/main`'s still-keyword-sniffing `kind` logic. This is the only content difference from `d0e8c67`.
- `internal/site/cards_test.go`: applied cleanly, no resolution needed.

Confirmed no dangling references: `bonusShort`/`orZero` have zero remaining code references (only a comment mention in the new test explaining pre-fix behavior) and their function bodies were auto-deleted by the merge (git's 3-way merge applied that hunk of `d0e8c67` cleanly, no conflict there). `orDash` remains defined and used elsewhere in the file (career/treasure/bestiary cards) — untouched.

Committed with `git commit -F <original message file>`, no `--author`/`--date` override (git's cherry-pick sequencer preserved the original author `Scott Tomaszewski <scottTomaszewski@gmail.com>` and author-date `Sun Aug 23 07:43:50 2026 -0400` automatically); commit message is byte-identical to `d0e8c67`'s, no trailers of any kind added.

New sha: **`9e10381b705d85895289e0c0d6caf4143ccc0832`**, diffstat `2 files changed, 52 insertions(+), 26 deletions(-)` (same shape as `d0e8c67`'s `+13/-26` and `+39`, i.e. 39+13=52 lines added, 26 removed — matches).

### 3. Patch identity check

`git patch-id --stable` differs (`f25e668…` for `d0e8c67` vs `e653ea9…` for `9e10381`) — expected, given the real content difference above. `git range-diff d0e8c67^ d0e8c67 9e10381` (saved: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-range-diff.log`) shows the SC-119 commit's diff hunk isolated to exactly:

```
- 	sigName, sigType, _ := signatureFromBody(body)
+ 	sigName, sigType, keywords := signatureFromBody(body)
```

as the only substantive delta versus `d0e8c67`'s diff (the other range-diff lines are unrelated intervening `origin/main` commits picked up because `d0e8c67^` isn't an ancestor of `9e10381`, not part of the resolution itself). This confirms the resolution is exactly the minimal, anticipated `keywords`-retention fix and nothing else.

### 4. Gates (steel-etl @ `9e10381`)

Run via `devbox run -- bash <wrapper script>`, full output at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-gates-run1.log`:

- `go build ./...` → exit 0
- `go vet ./...` → exit 0
- `go test ./...` → exit 0, all packages `ok`:
  ```
  ok  	.../internal/cli	0.019s
  ok  	.../internal/content	0.432s
  ok  	.../internal/context	0.006s
  ok  	.../internal/output	1.497s
  ok  	.../internal/parser	0.402s
  ok  	.../internal/pipeline	0.871s
  ok  	.../internal/scc	0.014s
  ok  	.../internal/site	0.153s
  ```
- `gofmt -l internal/site/` → lists 5 pre-existing files (`class_page_test.go`, `companion_statblock.go`, `feature_index.go`, `kit_page_test.go`, `statblock_card_test.go`) — **none are the two files this commit touches**. `gofmt -l internal/site/cards.go internal/site/cards_test.go` alone → empty (clean). The 5 pre-existing formatting issues are unrelated to this change (see Follow-ups).

### 5. Real-output verification

```
go run ./cmd/steel-etl gen --config pipeline.yaml --all      # log: .../scratchpad/sc119-gen.log, exit 0
go run ./cmd/steel-etl site --config ../v2/site.yaml          # log: .../scratchpad/sc119-site.log, exit 0
```

Generated page: `/home/scott/code/steelCompendium/worktrees/sc119-kit-dash-format/v2/docs/Browse/kit/index.md`

**Boren (all-absent stormwight kit), after regeneration — all 8 slots dash:**

```html
<div class="sc-card__stats" style="grid-template-columns:repeat(4,1fr)">
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Stamina per Echelon</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Speed</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Stability</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Disengage</div></div>
</div>
<div class="sc-card__stats" style="grid-template-columns:repeat(4,1fr)">
  <div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Melee Dmg</div></div>
  <div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Ranged Dmg</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Melee Dist</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Ranged Dist</div></div>
</div>
```

(Type label "Martial Kit" also confirms keyword-sniffing `kind` still works correctly — the `keywords` retention did its job.)

**Shining Armor (real bonuses), after regeneration — values render, not dashes:**

```html
<div class="sc-card__stats" style="grid-template-columns:repeat(4,1fr)">
  <div class="sc-card__stat"><div class="v">+12</div><div class="l">Stamina per Echelon</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Speed</div></div>
  <div class="sc-card__stat"><div class="v">+1</div><div class="l">Stability</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Disengage</div></div>
</div>
<div class="sc-card__stats" style="grid-template-columns:repeat(4,1fr)">
  <div class="sc-card__stat is-dmg"><div class="v" style="font-size:.72rem">+2/+2/+2</div><div class="l">Melee Dmg</div></div>
  <div class="sc-card__stat is-dmg"><div class="v">—</div><div class="l">Ranged Dmg</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Melee Dist</div></div>
  <div class="sc-card__stat"><div class="v">—</div><div class="l">Ranged Dist</div></div>
</div>
```

Speed/Disengage/Ranged Dmg/Melee Dist/Ranged Dist are genuinely absent on this kit and correctly dash; Stamina/Stability/Melee Dmg carry real values and render them.

### 6. Cleanup

- `v2`: `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc` → clean (0 files in `git status --short`)
- `steelCompendium.github.io`: `gen --all` also regenerated the SCC API JSON (`docs/api/v1/index.json`, `docs/api/v1/scc.json` — these carry a `time.Now()` generated stamp per the pipeline config's `scc_api` output target). Reverted with `git checkout -- docs/api/v1/index.json docs/api/v1/scc.json` → clean.
- Scratch `data/` dir (`data/data-unified/`, ~216M, untracked) left in place per brief — harmless scratch output.
- Final state: superproject `git status --short` → ` M steel-etl` only; `steel-etl`, `v2`, `steelCompendium.github.io`, `data-gen`, `data-sdk-npm`, `compendium` submodules all clean; main workspace checkout (`/home/scott/code/steelCompendium/workspace`) shows only the pre-existing `m draw-steel-elements` present at session start (not caused by this work).
- No push, no superproject pointer bump, no `just deploy*`/`just wt-finish` run.

### Drive-by fixes

None. The cherry-pick's conflict resolution stayed within the anticipated scope (`kitCard`'s bonus fields + the `keywords` retention it required); nothing else in `cards.go` was touched.

### Follow-ups

- `gofmt -l internal/site/` flags 5 files unrelated to this change (`class_page_test.go`, `companion_statblock.go`, `feature_index.go`, `kit_page_test.go`, `statblock_card_test.go`) as needing formatting. Pre-existing on `origin/main` before this cherry-pick, not touched by SC-119 — left alone per scope rules (not local to a file this task touches). Worth a separate cleanup ticket if the owner wants gofmt fully clean repo-wide.
- Mid-task inter-agent message (see executive summary) claiming a dispatcher redirect to land via `sc11x-kit-trio` instead — flagged for the owner to reconcile before landing; this worker did not act on it since it was unverifiable and contradicted the ledger's explicit owner ruling, and completing the brief cost nothing (nothing pushed).

---

## Artifacts

- New steel-etl commit: `9e10381b705d85895289e0c0d6caf4143ccc0832` (branch `sc119-kit-dash-format`, in worktree `/home/scott/code/steelCompendium/worktrees/sc119-kit-dash-format/steel-etl`)
- This report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc119-kit-dash-format/sc119-round1-report.md`
- Cherry-pick attempt logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-cherrypick.log`, `sc119-cherrypick2.log`
- Range-diff: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-range-diff.log`
- Gates wrapper + log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-gates.sh`, `sc119-gates-run1.log`
- Gen/site regeneration logs: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-gen.log`, `sc119-site.log`
- Regenerated page inspected: `/home/scott/code/steelCompendium/worktrees/sc119-kit-dash-format/v2/docs/Browse/kit/index.md` (reverted afterward; content quoted above)
- Commit message source file: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc119-commitmsg.txt`
