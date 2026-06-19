# Handoff — 2026-06-18 (Plan 6 part 1 shipped; starting part 2 = ROADMAP #15)

## Active efforts
- **ROADMAP #15 — Monsters/Summoner header-levels rework → per-ability coding** — IN FOCUS.
  The deferred *second half* of the retainer/featureblock effort. **No plan/spec doc yet** —
  it starts in brainstorming (see "You are here"). Canonical description:
  [`ROADMAP.md`](../../ROADMAP.md) → item #15. The "why it's blocked" + "the fix" are there.
- **Plan 6 part 1 (retainer rework, container scope)** — ✅ DONE & DEPLOYED this session.
  Retainers joined `monster.*`: `monster.retainer.statblock/<id>` (×21) +
  `monster.retainer.advancement-features/<id>` (×21) + `monster.retainer.role-advancement/<role>`
  (×9), members inline/uncoded; Plan 4 `retainer_page.go` retired. Registry +30 → 3,072. All
  repos pushed & live. Plan: [`docs/superpowers/plans/2026-06-18-retainer-rework-containers.md`];
  spec: [`docs/superpowers/specs/2026-06-18-retainer-rework-coded-entities-design.md`];
  log: [`docs/scc-log.md`](../scc-log.md) (2026-06-18 entry).

## You are here
Start **ROADMAP #15** in **brainstorming**, not code. It needs its own brainstorm → spec →
plan (writing-plans) before any implementation — it's an infrastructure change touching
`collectDeepHeadings` (`steel-etl/internal/parser/document.go`) + `ContextStack`
(`steel-etl/internal/context/stack.go`) + every Monsters/Summoner parser that assumes the flat
level-6 heading model.

**Goal:** give the *individual abilities* inside Monsters/Summoner statblocks & featureblocks
their own codes (`feature.ability.*` / `feature.trait.*` per the taxonomy) — retainer
base/advancement/role abilities, per-member coding for ALL featureblocks (fixtures, malice,
terrain — currently inline/uncoded), and companion-style on-page embedding of advancement cards.

**Read first (don't re-derive):** ROADMAP #15; spec §7 (why per-ability is blocked) + §8
(feature/ability/trait guardrail) in the Plan-6 spec above; the Plan-6 plan (what part 1
shipped); [`steel-etl/docs/statblocks.md`](../../steel-etl/docs/statblocks.md) (H7/H9 model,
code≠path, the "Retainers" section); `steel-etl/CLAUDE.md` → "Statblocks" + "Feature taxonomy";
[`docs/superpowers/specs/2026-06-07-feature-taxonomy-design.md`].

**Process & guardrails:** branch from latest `origin/main` (read
[`docs/git-workflow.md`](../git-workflow.md) first); Go via devbox —
`devbox run -- bash -c 'cd steel-etl && go ...'` from the workspace root. Brainstorm/spec must
grapple with: `--scc-stable` scrutiny + registry delta + link re-sweep (`validate`) since
per-ability coding re-mints many codes; re-composing the statblock card once abilities are real
child sections (generalize the companion `feature-group→sbIsland` adapter /
`embed_cards.go`); keeping the part-1 `monster.retainer.*` containers undisturbed. **Stop
before code and before deploy** — the user decides when to implement and ship.

**Not a prerequisite — don't chase it:** Monsters/Summoner statblocks already render as
build-time `.sb-wrap` cards (the client-side JSON island is retired; 0 pages use
`sc-statblock-mount`). So ROADMAP #7's "move statblocks to build-time HTML" premise is largely
stale (tracked in [`FOLLOWUPS.md`](../../FOLLOWUPS.md) #18); #15 does **not** need to wait on
it. The on-page embedding work is generalizing the existing build-time embed
(`embed_cards.go`, already used for fixtures/companions) to the re-composed Monsters statblock,
**not** a fresh island→HTML migration.

## Verified state (as of 2026-06-18 23:27 -0400)
Everything from part 1 is merged, pushed, and live. All seven repos are **0 ahead / 0 behind**
their `origin/main` and clean:
- workspace `main` @ `c5db5a2` (submodule pointer bump + Plan 6 docs)
- `steel-etl` `main` @ `6880948`
- `v2` @ `23a7c509`, `data-bestiary` @ `b3df9e8b`, `data-unified` @ `396b4f1b`,
  `data-rules` @ `ec3996e17` (unchanged), `steelCompendium.github.io` @ `1213ec96`
- Build/vet/test: green (run the commands below to confirm).
- Registry: 3,072 codes; retainer family = 21 statblock + 21 advancement-features + 9
  role-advancement; summoner retainers correctly untouched at `retainer.summoner.statblock/*`.

## Gotchas & lessons (cross-cutting — will trip up #15)
- **Blockquote-label footgun.** `ParseRichFeatures` → `splitBlockquoteBlocks`
  (`internal/content/featureparse.go` / `statblock_parse.go`) only ever reads `>`-prefixed
  lines. A level label must be `> **Level N …**` (inside the blockquote); a standalone bold
  line is **invisible** and the level silently never attaches. The Plan-6 plan's source script
  got this wrong; the spec was right. #15 will do a lot more source/heading surgery — design
  with this in mind and always regen-verify that levels/members actually attach.
- **`@domain: retainer` is in BOTH books.** Monsters retainers have no `@category`; **summoner**
  retainers carry `@category: summoner`. Both retainer parser branches in
  `internal/content/monster.go` (`StatblockParser` + `FeatureblockParser`) guard on
  `category != "summoner"` so summoner retainers stay `retainer.summoner.statblock`. #15 edits
  these same parsers — **don't undo the guard** (there's a regression test
  `TestStatblockParser_SummonerRetainerUnchanged`).
- **`just deploy` push-order footgun.** The recipe pushes **github.io FIRST** (step 2) under
  `set -euo pipefail`; if ANY output clone (`v2`, `data/*`, `steelCompendium.github.io`) is
  behind its origin, that first push is rejected and the whole recipe aborts before v2/data
  ever run. **Before deploying, sync every output clone to its `origin/main`**
  (`git -C <clone> fetch origin && git reset --hard origin/main` — they carry no local-only
  work). Then `just deploy` pushes cleanly.
- **Subagents hit the monthly account spend limit this session.** Implementer/reviewer
  subagents failed mid-run (one died after partial edits). Be ready to execute and self-verify
  directly rather than relying on dispatched agents.

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace
# all repos in sync & clean:
for r in . steel-etl v2 data/data-bestiary data/data-rules data/data-unified steelCompendium.github.io; do
  git -C "$r" fetch origin -q 2>/dev/null; b=$(git -C "$r" branch --show-current)
  printf "%-26s %s\n" "$r" "$(git -C "$r" rev-list --left-right --count HEAD...origin/$b 2>/dev/null)"
done
# build/vet/test (devbox; Go not on PATH):
devbox run -- bash -c 'cd steel-etl && go build ./... && go vet ./... && go test ./...'
# registry sanity (after a fresh gen --all):
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl gen --all --config pipeline.yaml' >/dev/null
grep -oE 'monster\.retainer\.(statblock|advancement-features|role-advancement)/' steel-etl/classification.json | sort | uniq -c   # 21 / 21 / 9
grep -oE 'retainer\.summoner\.statblock/' steel-etl/classification.json | wc -l                                                  # 4 (summoner, unchanged)
```
