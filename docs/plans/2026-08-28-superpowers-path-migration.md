# Superpowers path migration — runbook

**Date:** 2026-08-28 · **Status:** prepared, WAITING on running agents to drain
**Decision (Scott, 2026-08-28):** move everything so no directory path contains
`superpowers`; he is inclined to disable the superpowers plugin (Fable doesn't need it —
the orchestration plugin's ticket-owner skill carries the distilled SDD practices, and
superpowers' own session hook tells dispatched subagents to stand down).

This file lives at the migration's own target location (`docs/plans/`) — it is the first
resident of the new layout.

## Do-not-run-until gate

- [ ] **SC-264 (doc-prune shakedown) has landed and its worktrees are removed.** Its
      owner/workers are actively writing `.superpowers/sdd/` ledgers and editing `docs/`;
      renaming under them breaks ledger paths and guarantees landing conflicts.
- [ ] No other owner session is active (`just wt-status` clean of orchestration worktrees).
- [ ] Scott has confirmed the plugin disable (Lane C step 3) — or explicitly deferred it.

## Target layout

| Old | New |
|---|---|
| `.superpowers/sdd/<effort>/` (gitignored scratch) | `.orchestration/<effort>/` |
| `.superpowers/sdd/freeze-baseline.sha256[…-bak]` (machine-local) | `.orchestration/freeze-baseline.sha256[…-bak]` |
| workspace `docs/superpowers/{specs,plans,prompts,dse-overhaul}/` | `docs/{specs,plans,prompts,dse-overhaul}/` |
| workspace `docs/superpowers/site/` | deleted (empty dirs only) |
| `steel-etl/docs/superpowers/{plans,specs}/` | `steel-etl/docs/{plans,specs}/` |
| `draw-steel-elements/docs/superpowers/sc169-element-menu-panel-spec.md` | `draw-steel-elements/docs/specs/sc169-element-menu-panel-spec.md` |

**Untouched, deliberately:**

- The **word** "superpowers" in game/book content (`compendium/docs/Rules/…` — e.g.
  "mind-control superpowers" in Negotiation). Every sed below is anchored on the path forms
  `docs/superpowers` / `.superpowers`, never the bare word.
- **Skill-name strings** (`superpowers:writing-plans`, `superpowers:subagent-driven-development`)
  in archived plan headers and old ledgers — historical record of how those plans were run,
  not paths.

## Lane A — workspace repo (main checkout, one bookkeeping commit)

```bash
cd /home/scott/code/steelCompendium/workspace
git status --porcelain   # must be clean apart from this work

# 1. Moves
git mv docs/superpowers/specs docs/specs
# docs/plans already exists (this runbook) — move contents:
git mv docs/superpowers/plans/* docs/plans/
git mv docs/superpowers/prompts docs/prompts
git mv docs/superpowers/dse-overhaul docs/dse-overhaul
rmdir docs/superpowers/plans docs/superpowers/site/build-ledgers docs/superpowers/site docs/superpowers

# 2. Path rewrites — tracked workspace md files ONLY (no submodules), most-specific first
files=$(grep -rl -e 'docs/superpowers' -e '\.superpowers' \
  --include='*.md' CLAUDE.md docs .claude reference templates 2>/dev/null \
  | grep -v 'docs/plans/2026-08-28-superpowers-path-migration.md')
# ^ this runbook deliberately contains the old paths — never sed it
for f in $files; do
  sed -i \
    -e 's|docs/superpowers/dse-overhaul|docs/dse-overhaul|g' \
    -e 's|docs/superpowers/specs|docs/specs|g' \
    -e 's|docs/superpowers/plans|docs/plans|g' \
    -e 's|docs/superpowers/prompts|docs/prompts|g' \
    -e 's|\.superpowers/sdd/|.orchestration/|g' \
    "$f"
done
```

3. **Hand edits** (sed can't word these):
   - `CLAUDE.md` routing row "Write a per-effort plan/spec" → "the sub-repo's
     `docs/specs/` + `docs/plans/` if confined to one repo; the workspace `docs/specs/` +
     `docs/plans/` if it spans repos…". Also its layout bullet for `docs/`.
   - `docs/index.md` — the `superpowers/` bullet → separate `specs/`, `plans/`, `prompts/`,
     `dse-overhaul/` bullets.
   - `.gitignore` — replace `.superpowers/` entry with `.orchestration/` (drop the old line
     once both machines have deleted the dir; keep both during transition).
   - `.claude/orchestrate/PROJECT.md` §6 table + §8.6 — verify the seds produced
     `.orchestration/<effort>/` and `.orchestration/freeze-baseline.sha256`; fix the
     "`.superpowers/` is gitignored" prose to name `.orchestration/`.
   - `docs/working-preferences.md` — retitle the "`.superpowers/sdd/` is shared global
     state" section to `.orchestration/` (keep the learned-2026-07-31 provenance).
   - Any leftover bare `docs/superpowers/` (there should be none — the four subdirs cover
     everything): resolve by hand.

4. **Verify:** the only remaining matches are the deliberate exclusions above —

```bash
grep -rn -e 'docs/superpowers' -e '\.superpowers' --include='*.md' \
  CLAUDE.md docs .claude reference templates .gitignore \
  | grep -v 'docs/plans/2026-08-28-superpowers-path-migration.md'
# expect: nothing (or only the transitional .gitignore line)
```

5. Commit (`docs: drop superpowers from paths — docs/{specs,plans,prompts,dse-overhaul}, scratch → .orchestration/`) and push.

## Lane B — submodules (isolated worktree, two-commit rule)

```bash
just wt-new mv-superpowers
cd ../worktrees/mv-superpowers

# steel-etl (43 files under docs/superpowers, 35 files with path refs)
cd steel-etl
git mv docs/superpowers/plans docs/plans
git mv docs/superpowers/specs docs/specs
rmdir docs/superpowers 2>/dev/null || true
grep -rl -e 'docs/superpowers' -e '\.superpowers' --include='*.md' CLAUDE.md docs | \
  xargs sed -i -e 's|docs/superpowers/|docs/|g' -e 's|\.superpowers/sdd/|.orchestration/|g'
git add -A && git commit -m 'docs: drop superpowers from doc paths'
cd ..

# draw-steel-elements (branch: develop) — one spec + its .superpowers refs
cd draw-steel-elements
mkdir -p docs/specs
git mv docs/superpowers/sc169-element-menu-panel-spec.md docs/specs/
rmdir docs/superpowers
sed -i 's|\.superpowers/sdd/|.orchestration/|g' docs/specs/sc169-element-menu-panel-spec.md
git add -A && git commit -m 'docs: drop superpowers from doc paths'
cd ..

# v2 — one path ref in .repo-docs/index.md ("workspace docs/superpowers/plans/…")
cd v2
sed -i 's|docs/superpowers/|docs/|g' .repo-docs/index.md
git add -A && git commit -m 'docs: update workspace doc paths (superpowers rename)'
cd ..

just wt-finish mv-superpowers   # from the workspace main checkout
```

`compendium` needs nothing (its matches are game text). No gates needed — doc-only diffs;
sanity-check steel-etl with `devbox run -- bash -c 'cd steel-etl && go build ./...'` if
paranoid (no Go code reads these paths).

## Lane C — machine-local, ON EACH MACHINE

1. Move the scratch root (preserve anything still wanted from live effort dirs first —
   SC-264's ledger should already be copied to `docs/dse-overhaul/build-ledgers/` at
   landing):

```bash
cd /home/scott/code/steelCompendium/workspace
mkdir -p .orchestration
mv .superpowers/sdd/freeze-baseline.sha256* .orchestration/ 2>/dev/null
rm -rf .superpowers
```

2. Verify the freeze gate still passes (`dse-verify` reads the baseline at its new
   `.orchestration/` path after Lane A).
3. **Disable the superpowers plugin** (Scott's action; check the exact name with
   `claude plugin list` first): `claude plugin uninstall superpowers@claude-plugins-official`.
   This also removes its SessionStart hook and the brainstorm/plan/SDD skills; interactive
   Fable sessions run bare from then on.

## Lane D — orchestration plugin (any time after Lane A lands)

`~/code/orchestration-plugin/README.md` links the design spec at
`docs/superpowers/specs/…` — update to `docs/specs/…`, bump to 0.1.4,
`claude plugin marketplace update tski && claude plugin update orchestration@tski`.

## Doc-sync afterward

- `docs/working-preferences.md`: dated note that superpowers is disabled and why (owners
  never used it; interactive sessions drop brainstorm→spec→plan ceremony or run it manually).
- `CLAUDE.md` layout + routing rows: covered in Lane A step 3.
- `docs/followups-archive/` + `roadmap-archive/`: frozen content, but path strings are
  updated by the Lane A sed so their links still resolve — this is link repair, not
  content change.
