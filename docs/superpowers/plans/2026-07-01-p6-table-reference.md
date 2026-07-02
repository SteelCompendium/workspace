# P6 — Table Reference (GM-Screen Page) Implementation Plan

> **Status: EXECUTED — shipped & live 2026-07-02.** All tasks completed and verified on production; kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One curated, print-perfect "Table Reference" page — turn structure, power roll, conditions one-liners, common maneuvers, movement — every entry linking to its canonical Browse page. The single most-consulted artifacts at a game table, on one screen.

**Architecture:** A hand-authored page in `v2/static_content/docs/` (static pages survive regeneration and get normal markdown-link rewriting), registered as a top-level nav entry (its own tab) in the hand-maintained root `docs/.nav.yml`. Content summaries below were verified against `reference/draw-steel-overview.md` and the generated rule glossary; every claim links to the authoritative page.

**Tech Stack:** Markdown (Material grid cards + tables), awesome-nav, print.css.

## Global Constraints

- Isolated worktree: `just wt-new p6-reference` / `just wt-finish p6-reference`.
- `static_content/docs/` is the home for hand-authored pages (survives `steel-etl site` regen; copied last). The root `docs/.nav.yml` is hand-maintained (steel-etl writes only per-section nav files — verified `writeNavYaml` scope in `internal/site/build.go:73-93`) — but **verify after a site regen that it is untouched** (Task 3).
- Markdown links use relative `.md` paths (`Browse/condition/grabbed.md`) — mkdocs rewrites them; do NOT hand-write `/v2/...` URLs.
- Rules text must be **summaries + links**, not full rules reproductions — the canonical text lives on the linked pages (and full reproductions would double-index in search; the page sets a mild `search: boost`).
- No commit-attribution trailers.

---

### Task 1: Author the page

**Files:**
- Create: `v2/static_content/docs/table-reference.md`

- [ ] **Step 1: Create the page**

```markdown
---
search:
  boost: 3
name: Table Reference
---

# Table Reference

The rules you reach for mid-encounter — each entry links to the full rule.
Use ++p++ / print for a one-page GM screen.

## Your Turn

On your turn you get **one [main action](Browse/rule/combat/turn.md), one
[maneuver](Browse/feature/common/maneuvers/index.md), and one
[move action](Browse/movement/index.md)** — in any order. You can trade your
main action down for an extra maneuver or move.
[Triggered actions](Browse/rule/combat/triggered-action.md) happen off-turn
(one per round); free triggered actions and
[free maneuvers](Browse/rule/combat/free-maneuver.md) don't spend your normal allotment.

## The Power Roll

**2d10 + characteristic** → three [tiers](Browse/rule/dice/tier-outcome.md):

| Roll | Tier |
|---|---|
| ≤ 11 | Tier 1 (weakest) |
| 12–16 | Tier 2 |
| 17 + | Tier 3 (strongest) |

- An [edge](Browse/rule/dice/edge.md) adds +2; a [bane](Browse/rule/dice/bane.md) −2.
- A **double edge / double bane** moves the result one tier up/down instead.
- A [natural 19–20](Browse/rule/dice/natural-19-20.md) is a critical: tier 3 and
  you can take an extra main action.
- Tests use the same roll — see [test difficulty](Browse/rule/test/test-difficulty.md).

## Conditions

| Condition | In one line |
|---|---|
| [Bleeding](Browse/condition/bleeding.md) | Can't regain Stamina. |
| [Dazed](Browse/condition/dazed.md) | Only one of main action / maneuver / move on your turn. |
| [Frightened](Browse/condition/frightened.md) | Bane vs the source; source has edge vs you; can't move closer to it. |
| [Grabbed](Browse/condition/grabbed.md) | Speed 0; can't be force-moved except by the grabber. |
| [Prone](Browse/condition/prone.md) | Strikes vs you have edge; your strikes take a bane; crawl to move. |
| [Restrained](Browse/condition/restrained.md) | Speed 0, can't stand or be force-moved; attackers have edge. |
| [Slowed](Browse/condition/slowed.md) | Speed 2, can't shift. |
| [Taunted](Browse/condition/taunted.md) | Bane on strikes that don't include the taunter. |
| [Weakened](Browse/condition/weakened.md) | Bane on power rolls. |

*(One-liners are paraphrases — click through for the exact rule text.)*

## Common Maneuvers

[All common maneuvers →](Browse/feature/common/maneuvers/index.md)

[Aid Attack](Browse/feature/common/maneuvers/aid-attack.md) ·
[Catch Breath](Browse/feature/common/maneuvers/catch-breath.md) ·
[Escape Grab](Browse/feature/common/maneuvers/escape-grab.md) ·
[Grab](Browse/feature/common/maneuvers/grab.md) ·
[Hide](Browse/feature/common/maneuvers/hide.md) ·
[Knockback](Browse/feature/common/maneuvers/knockback.md) ·
[Search](Browse/feature/common/maneuvers/search.md) ·
[Stand Up](Browse/feature/common/maneuvers/stand-up.md)

## Movement

[Forced movement](Browse/movement/forced-movement.md) (push / pull / slide — slams
deal damage) · [difficult terrain](Browse/movement/difficult-terrain.md) (2 squares
per square) · [climb / swim](Browse/movement/climb-or-swim.md) ·
[fly](Browse/movement/fly.md) · [jump](Browse/movement/jump.md) ·
[fall](Browse/movement/falling.md) · [shift](Browse/movement/shift.md)

## Stamina, Dying & Recovery

- [Winded](Browse/rule/health/winded.md): at or below half Stamina.
- [Dying](Browse/rule/health/dying.md): Stamina ≤ 0 — you keep acting, but you're
  bleeding and can die at the negative of your winded value.
- Spend a [Recovery](Browse/rule/health/recoveries.md) to heal (Catch Breath
  maneuver); a [respite](Browse/rule/resource/respite.md) restores everything.

## Combat Modifiers

[Flanking](Browse/rule/combat/flanking.md) (you + ally adjacent on opposite
sides → edge on melee strikes) · [cover](Browse/rule/combat/cover.md) ·
[concealment](Browse/rule/combat/concealment.md) ·
[high ground](Browse/movement/high-ground.md) ·
[opportunity attacks](Browse/rule/combat/opportunity-attack.md) ·
[surprised](Browse/rule/combat/surprised.md)

## Director Quick Numbers

- **Hero encounter strength**: 4 + 2 × level ([encounter building](Read/bestiary/monster-basics.md)).
- [Encounter Value (EV)](Browse/rule/monster/encounter-value.md): a creature's
  budget cost; minions are bought [4 at a time](Browse/rule/organization/minion.md).
- [Hero tokens](Browse/rule/resource/hero-token.md) ·
  [Victories](Browse/rule/resource/victories.md) (2 avg Victories ≈ +1 hero of ES).
```

**Link verification is part of this step** — before writing, confirm each target exists (`ls v2/docs/Browse/rule/health/ v2/docs/Browse/feature/common/maneuvers/ v2/docs/Browse/movement/`) and fix any filename drift (e.g. `falling.md` vs `fall.md`, exact maneuver filenames). Do not ship a guessed link. Also verify the condition one-liners against each condition page's actual text and correct any paraphrase that's wrong — the table above is a draft from the reference overview, not gospel.

- [ ] **Step 2: Register in the root nav**

Edit `v2/docs/.nav.yml`:

```yaml
nav:
   - index.md
   - Browse
   - Read
   - Bestiary
   - table-reference.md
```

- [ ] **Step 3: Copy into docs and build**

```bash
cp v2/static_content/docs/table-reference.md v2/docs/table-reference.md
cd v2 && devbox run -- mkdocs build 2>&1 | grep -i "warning.*table-reference" ; devbox run -- python3 -m http.server 8124 --directory site &
```
Expected: no link warnings for the page (mkdocs logs broken md links — fix any). A "Table Reference" tab appears after Bestiary; every link resolves.

- [ ] **Step 4: Commit**

```bash
git -C v2 add static_content/docs/table-reference.md docs/table-reference.md docs/.nav.yml
git -C v2 commit -m "feat: Table Reference quick-rules page (new tab)"
```

---

### Task 2: Print polish

**Files:**
- Modify: `v2/docs/stylesheets/print.css` (append)

- [ ] **Step 1: Append a compact print rule scoped to the page**

The page body gets no unique class from mkdocs, so scope by :has() on the h1 id:

```css
/* ── Table Reference: tighten for a one/two-page GM screen ── */
@media print {
  .md-typeset:has(> h1#table-reference) { font-size: .62rem; }
  .md-typeset:has(> h1#table-reference) table { font-size: inherit; }
  .md-typeset:has(> h1#table-reference) h2 { margin: .6em 0 .2em; }
}
```

- [ ] **Step 2: Verify via print emulation**

In the browser devtools (or playwright `page.emulateMedia({media:"print"})` + `page.pdf()`), print-preview the page: chrome (nav/sidebars) already stripped by the existing print.css; content flows ≤ 2 pages.

- [ ] **Step 3: Commit**

```bash
git -C v2 add docs/stylesheets/print.css
git -C v2 commit -m "style: compact print layout for Table Reference"
```

---

### Task 3: Regen-safety check + land

- [ ] **Step 1: Prove the page survives a site regen**

```bash
devbox run -- bash -c 'cd steel-etl && go run ./cmd/steel-etl site --config ../v2/site.yaml'
test -f v2/docs/table-reference.md && echo SURVIVES
git -C v2 diff --stat docs/.nav.yml    # expect: no change (root nav is hand-maintained)
```
If `docs/.nav.yml` WAS rewritten by the regen, move the nav registration into whatever mechanism owns it (check `writeNavYaml` in `steel-etl/internal/site/build.go`) before landing — do not land a page that falls out of the nav on the next deploy.

- [ ] **Step 2: Land**

```bash
just wt-finish p6-reference
```

- [ ] **Step 3: Post-deploy**

Verify the tab on the live site; print it once for real. Consider linking the page from the home "How to Use This Site" grid as a fourth card (follow-up, needs `v2/docs/index.md` edit).
