# SC-157 round 2 — rebase + re-verify report

## Summary

- Verdict: **LAND-READY**.
- Rebased `sc157-with-captain` from `091d0bc` onto tracked `steel-etl` `origin/main`
  `c7d6940` — clean, no conflicts. New head: `d6bb008`.
- Gates (build/vet/test, full suite): all pass, exit=0. 8 `ok` packages, 0 `FAIL`, 1 `[no test files]` (cmd/steel-etl).
- Re-proved `TestCaptainedMinion_EndToEnd` non-vacuous on the rebased tree: FAIL with
  `statblockMeta4`'s `with_captain` branch disabled, PASS restored. Submodule tree clean
  afterward (only the rebased commit; temp edit reverted via `git checkout --`).
- Test reads real per-minion bonus text through both DOM sites — not vacuous, not
  label-only. See §4 below.
- No production code, no other test, no doc/CHANGELOG changes.

## 1. Rebase

```
cd /home/scott/code/steelCompendium/worktrees/sc157-with-captain/steel-etl
git fetch origin        # origin/main -> c7d6940
git rebase c7d6940
```

Result: `Successfully rebased and updated refs/heads/sc157-with-captain.` — no conflict.

- Base sha: `c7d6940` (`docs(sc-264): re-review fixes — the beastheart stale-skill note is history, not a deferral`)
- Rebased head sha: `d6bb008` (short) — commit message unchanged:
  `test(site): SC-157 — lock in captained-minion With Captain end-to-end`
- No commits added beyond the original one; message and diff untouched (a fast, clean
  rebase — the branch's single `+70` line test file did not overlap anything the 5
  intervening `main` commits touched).

## 2. Gates

```
devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc157-with-captain/steel-etl && go build ./... && go vet ./... && go test ./...'
```

Full log: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-gates.txt`

Result: exit=0. Package lines:

```
?   github.com/SteelCompendium/steel-etl/cmd/steel-etl       [no test files]
ok  github.com/SteelCompendium/steel-etl/internal/cli        0.009s
ok  github.com/SteelCompendium/steel-etl/internal/content    0.404s
ok  github.com/SteelCompendium/steel-etl/internal/context    0.005s
ok  github.com/SteelCompendium/steel-etl/internal/output     1.301s
ok  github.com/SteelCompendium/steel-etl/internal/parser     0.391s
ok  github.com/SteelCompendium/steel-etl/internal/pipeline   0.764s
ok  github.com/SteelCompendium/steel-etl/internal/scc        0.008s
ok  github.com/SteelCompendium/steel-etl/internal/site       0.129s
```

8 `ok`, 0 `FAIL`, 1 `[no test files]` (expected — `cmd/steel-etl` is main-only).

## 3. Non-vacuous re-proof (rebased tree)

Temporarily disabled the `with_captain` frontmatter branch in `statblockMeta4`
(`internal/site/statblock_page.go`, line 183) by appending `&& false` to its condition:

```go
if v := strings.TrimSpace(parseFrontmatterField(fm, "with_captain")); false && v != "" {
```

- RED: `go test ./internal/site/ -run TestCaptainedMinion_EndToEnd -v` → `--- FAIL:
  TestCaptainedMinion_EndToEnd`, both assertions fail (grid cell and sticky row2 both
  absent from rendered HTML). Evidence:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-test-red.txt`
- Reverted with `git checkout -- internal/site/statblock_page.go` (the only file
  touched by this temporary edit).
- GREEN: same test command → `--- PASS: TestCaptainedMinion_EndToEnd`, `ok`. Evidence:
  `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-test-green.txt`
- `git status --short` in the submodule after revert: **empty** (clean; only the
  rebased commit `d6bb008` present on the branch).

## 4. Test-content read

`TestCaptainedMinion_EndToEnd` (internal/site/statblock_page_test.go:552-579) asserts on
the rendered HTML string in both places: the full card's `.sb__meta` grid
(`<span class="sb__field-l">With Captain</span><span class="sb__field-v">+1 damage bonus
to strikes</span>`, line 571) and the sticky mini-header's row2 bar (`<span
class="sm"><b>With Captain</b>+1 damage bonus to strikes</span>`, line 576). Both
assertions check the label *and* a real per-minion bonus value string ("+1 damage bonus
to strikes", sourced from a raw book-source stat grid via `content.ParseStatblockFields`
at line 553-556) — not merely the "With Captain" label with an empty/placeholder value —
so the test is not vacuous with respect to the value it locks in.

## Follow-ups

None identified this round (out of scope per brief; task was rebase/re-verify only).

## Files produced

- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/sc157-r2-rebase-report.md` (this file)
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-gates.txt`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-test-red.txt`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc157/evidence/sc157-r2-test-green.txt`
