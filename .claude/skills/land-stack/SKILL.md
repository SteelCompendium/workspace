---
name: land-stack
description: Use when landing a finished worktree's cross-repo work to origin/main — running `just wt-finish`/`just wt-rm`, an unstaged submodule pointer bump, untracked scratch (`.superpowers/`, stray generated files) tripping the superproject's dirty check, a stale worktree pin about to revert submodules main has since moved on, or verifying a submodule push is a fast-forward before merging
---

# Land Stack

## Overview

Landing = publishing a worktree's finished, reviewed work: pushing each touched submodule
to its tracked branch, merging the superproject env branch into `main`, and pushing `main`.
`just wt-finish` does the mechanics, but it hard-aborts on the slightest dirt and gives no
useful signal on failure — the discipline lives around the command, not in it. This
procedure is battle-tested against three real 2026-08-02 landings (steel-body/plan-22,
steel-fonts/SC-105, steel-face/SC-105b — ledgers in
`docs/superpowers/dse-overhaul/build-ledgers/`).

**REQUIRED BACKGROUND:** `docs/git-workflow.md` and `docs/worktrees-and-submodules.md` own
the *policy* (remotes, the two-commit rule, deploy vs. land). This skill owns the *landing
procedure* — read it before running `wt-finish` or `wt-rm`.

## Two hard rules — no exceptions

**1. Never edit the shared main checkout.** It is concurrent-session global state; a Write
there can clobber another agent's WIP or get silently discarded by the next `deploy*`/`sync`.
Before any Write during development, check `pwd` — it must be under `../worktrees/<name>/`.
This has leaked twice in one week (self-caught both times, per the steel-fonts ledger) —
"it's just a docs tweak" and "I'll revert it after" are not exceptions. Verify cwd, every
time, before every Write.

**2. Never tag or release anything while landing.** Landing source ≠ releasing. Scott's
standing order: no tags, no GitHub releases, not even RC/pre-release tags, on any submodule —
that action is his alone (full context: `docs/handoffs/HANDOFF.md` banner). `wt-finish`
pushes branches only; if a task description asks for more than that, stop and ask.

## The procedure

Run every step from the **main checkout** (`cd /home/scott/code/steelCompendium/workspace`),
never from inside the worktree.

### 1. Pre-flight — verify before touching anything

```bash
name=<env-name>; sub=<submodule>; tracked=main   # tracked = develop for draw-steel-elements (SC-163), v3 for data-sdk-npm/data-gen
wt="../worktrees/$name"

# Fetch fresh state everywhere first.
git fetch origin
git -C "$sub" fetch origin
git -C "$wt/$sub" fetch origin

# 0) ⚠️ WHICH BRANCH WILL wt-finish PUSH TO? It reads the tracked branch from the
#    WORKTREE's superproject .gitmodules — NOT the main checkout's. A worktree cut before
#    a tracked-branch change (SC-163 moved dse main→develop on 2026-08-16) still says the
#    OLD branch and wt-finish will push there. This pushed a 7.0 branch onto dse `main`
#    (released-only, pinned at 6.0.1) on 2026-08-16 — recovered, but it fired the old
#    docs workflow, which wiped the mike gh-pages layout. CHECK EVERY TIME:
git -C "$wt" config -f "$wt/.gitmodules" "submodule.$sub.branch"   # must equal $tracked
#    If it doesn't: git -C "$wt" checkout origin/main -- .gitmodules && commit it (superproject-only).

# a) Is the submodule push a fast-forward? (local branch must contain origin's tip)
git -C "$wt/$sub" merge-base --is-ancestor "origin/$tracked" "$name" \
  && echo "FF-safe" || echo "DIVERGED — reconcile before pushing"

# b) Gitlink scope: which submodules does the superproject branch actually move,
#    vs. origin/main? A long-lived worktree's pins go stale as main advances —
#    wt-finish would REVERT any submodule main moved that this branch didn't touch.
git -C "$wt" diff origin/main...$name --stat -- steel-etl v2 steelCompendium.github.io \
  compendium draw-steel-elements statblock-adapter-gl-pages data-sdk-npm data-gen
# Expect ONLY the submodule(s) this branch deliberately advanced. Anything else
# (a submodule at its OLD pin while origin/main has a newer one) = stale worktree;
# land scoped (push only what you own) or rebase the env first.

# c) Predict superproject merge conflicts: intersect files the branch touched with
#    files main touched since the branch's fork point.
fork="$(git -C "$wt" merge-base origin/main $name)"
comm -12 \
  <(git -C "$wt" diff origin/main...$name --name-only | sort) \
  <(git -C "$wt" diff "$fork"...origin/main --name-only | sort)
# Empty = clean merge, no output expected from wt-finish's merge step.
# Non-empty = expect a conflict in those files — read both sides before landing
# (usually a single-hunk CHANGELOG reconcile: keep both additions).
```

**CHANGELOG conflicts are the routine case, not a surprise.** Nearly every dse landing
conflicts in `CHANGELOG.md` because each branch appends under the same header. The
standard resolution is **keep both sides' bullets** (strip the conflict markers, retain
every addition, keep the header once) — never pick a side. Verify the merged file reads
sanely before committing the resolution.

### 2. Cleanliness — `wt-finish` hard-aborts if EITHER tree has any porcelain output

Two recurring trips, both silent until `wt-finish` refuses to run:

**(a) The submodule pointer bump must be COMMITTED in the worktree superproject.**
During development it is deliberately left unstaged (the bump is the last thing that
happens); flip it right before landing:

```bash
git -C "$wt" add "$sub"
git -C "$wt" commit -m "chore: bump $sub to $(git -C "$wt/$sub" rev-parse --short HEAD) (<what changed>)"
```

**(b) Untracked scratch inside a submodule makes the SUPERPROJECT read dirty.** By
default `git status` flags a submodule with untracked content, even though nothing is
staged — `.superpowers/` review artifacts or a stray generated file (e.g.
`compendium-manifest.json`) left inside `$wt/$sub` will abort the finish. Relocate before
landing: move anything worth keeping to the **main checkout's** `.superpowers/`, delete the
rest.

```bash
git -C "$wt/$sub" status --porcelain   # untracked ("??") lines are the culprit
```

**(c) Scott's LIVE vault state sits in the main checkout's dse submodule — stash-wrap
it, never discard it.** The main checkout's `draw-steel-elements/demo-vault/` is Scott's
actual working Obsidian vault: expect a modified `demo-vault/Welcome.md` and an untracked
`compendium-manifest.json` (or similar) at any time. `wt-finish` hard-aborts on them.
The standardized wrap (used on every landing since 2026-08-11):

```bash
git -C draw-steel-elements stash push -u -m "scott-vault-state-during-<name>-landing"
devbox run -- just wt-finish "$name"     # …verify post-conditions…
git -C draw-steel-elements stash pop     # ALWAYS pop — his state must come back
```

Verify the pop restored the same files (`git -C draw-steel-elements status --porcelain`).
If `wt-finish` fails mid-run, still pop before diagnosing — his state must never be left
stranded in the stash.

### 3. Run `wt-finish` alone — never chained

```bash
devbox run -- just wt-finish "$name"
```

**Never** `wt-finish && wt-rm` in one command. Devbox does not reliably propagate the
recipe's exit code, so a chained `wt-rm` can delete the env even though landing FAILED —
worktree submodules are independent clones, so unpushed commits are then **permanently
lost** (this caused real commit loss on 2026-07-18). Judge success by the recipe's own
output (`"Landed and pushed."`) and by post-conditions below — never by `$?`.

### 4. Verify by post-conditions

```bash
git -C "$sub" log --oneline "origin/$tracked" -1     # expected sha
git log --oneline origin/main -1                     # the merge commit
git status -sb                                        # main checkout level with origin
```

If any of these don't match what you expect, the landing is not done — do not proceed to
`wt-rm`.

### 5. Preserve ledgers, then `wt-rm`

`wt-rm` is `rm -rf` on the worktree directory. Anything gitignored and worth keeping —
SDD build ledgers, design docs — must be copied out **first**, to the repo-tracked,
multi-machine location:

```bash
cp "$wt/.superpowers/sdd/"*ledger*.md docs/superpowers/dse-overhaul/build-ledgers/<name>-ledger.md
git add docs/superpowers/dse-overhaul/build-ledgers/
git commit -m "docs: preserve <name> ledger (landed)"
```

Only then:

```bash
devbox run -- just wt-rm "$name"
```

### 6. Post-landing bookkeeping

- **Linear:** move the issue(s) to Done via the `linear-flow` skill — attach before/after
  screenshots first if the change was visual.
- **Docs:** update `docs/handoffs/HANDOFF.md` / `FOLLOWUPS.md` per the workspace CLAUDE.md
  routing table if anything is still open or was learned.
- **Push:** the ledger-preservation and any bookkeeping commits above still need
  `git push origin main`.

## Quick reference

| Step | Command | Fails/aborts on |
|---|---|---|
| FF check | `merge-base --is-ancestor origin/<tracked> <branch>` | non-zero = diverged, don't push |
| Scope check | `git diff origin/main...<branch> --stat -- <submodule paths>` | any submodule beyond what you advanced |
| Conflict predict | `comm -12` of two name-only diffs | non-empty = expect a merge conflict there |
| Pointer bump | `git add <sub> && git commit` | left unstaged → `wt-finish` aborts |
| Scratch | relocate/delete before finishing | untracked files in a submodule → superproject reads dirty |
| Land | `devbox run -- just wt-finish <name>` **alone** | never chain with `wt-rm` |
| Verify | `log origin/<tracked> -1`, `log origin/main -1`, `status -sb` | judge by these, never by `$?` |
| Teardown | copy ledgers out, then `devbox run -- just wt-rm <name>` | `wt-rm` is `rm -rf` — nothing gitignored survives it |

## Common mistakes

| Excuse / mistake | Reality |
|---|---|
| "It's just a docs tweak, editing main directly is faster" | Main is shared; any Write there risks another session's concurrent WIP. Worktree only. |
| "wt-finish printed no error, chaining wt-rm is fine" | Devbox swallows exit codes. Verify post-conditions before `wt-rm`, every time. |
| "The pointer bump can stay unstaged, wt-finish will sort it out" | It won't — it hard-aborts on any porcelain output, staged or not. |
| "Those are just review notes, they don't count as dirty" | Untracked files inside a submodule mark it dirty in the superproject's `git status` by default. Relocate or delete first. |
| "The worktree's submodule pins are old but wt-finish only pushes what changed" | Not true if the pin itself is stale — a superproject merge can silently revert a submodule main has moved on. Run the gitlink scope check first. |
| "I'll tag/release once this lands, saves a round trip" | Landing source is never releasing. That's Scott's action alone — no tags, no RC tags, ever, during a landing task. |
