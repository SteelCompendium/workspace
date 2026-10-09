# SC-385 — Revenant purchased traits bug — decisions ledger

Ticket: https://linear.app/tski-home/issue/SC-385 (Compendium · Bug · High)
Owner session: d29f38dc-23ac-45a9-b95b-de34cd6ff5ff (Fable ticket-owner, invoked directly by Scott — no dispatcher)
Worktree: /home/scott/code/steelCompendium/worktrees/sc385-revenant-traits (branch `sc385-revenant-traits` in every submodule)
Repo touched: steel-etl (tracked branch `main`; origin/main at dispatch = 88aec3bcf8c5907fafa622835683ced0c0ccd5e7)

## Scott's rulings (verbatim, dated)

**2026-10-08 — ticket description (Scott):**
> The Revenant's purchased traits are all under the heading of their Tough But Withered signature trait https://steelcompendium.io/v2/Browse/ancestry/revenant/#revenant-traits The table for Negotiation Starting Attitudes interrupts the first sentence of the Uncovering Motivations section (pg 287 of the PDF)

## Owner diagnosis (2026-10-08)

Both are source-markdown defects in `steel-etl/input/heroes/Draw Steel Heroes.md`:

1. Line 3080 `##### Purchased Revenant Traits` is H5; every other ancestry uses H4
   (`#### Purchased <Ancestry> Traits`, e.g. Devil line 1669) with the individual purchased
   traits at H5. At H5 it nests under the H4 `#### Signature Trait: Tough But Withered`.
   Fix: change to `####`. No `@type` annotation on that heading → no SCC code impact.
2. Lines ~22475–22493: the `###### Negotiation Starting Attitudes Table` + table sit inside
   `### Uncovering Motivations`, splitting its first paragraph ("…In response, the" /
   "[NPC] can willingly hint…"). The paragraph at 22473 under `#### Starting Stats` is the
   one that references the table. Fix: move the table heading + table to the end of
   `#### Starting Stats` (before `### Uncovering Motivations`) and rejoin the split sentence.

## Round log

- R1 (implementer, Sonnet): source fix + gates + rendered-output evidence → `sc385-r1-report.md`
- R1 DONE 2026-10-08: steel-etl `0c74f4f` (+4/-6, one file). build/test/validate --scc-stable/gen --all/site/mkdocs all pass; registry unchanged. Owner eyeballed both after-shots: correct. Report + shots in this dir (`sc385-r1-*`).
- R2 (fresh implementer identity, scoped review of the delta + CHANGELOG bullet in the worktree superproject) → `sc385-r2-report.md`
- R2 DONE 2026-10-08: APPROVE, no findings. Gates re-run independently, all pass; registry unchanged. CHANGELOG commit `fd15eb9` in worktree superproject. Info: worktree superproject is based on 9123a1b; origin/main moved to a65a429 (SC-378 landing) — rebase at landing.
- Land-ready comment posted (2 after-shots inline); ticket → In Progress + Needs Review. Awaiting Scott's "land it". Landing = `land-stack` from main checkout (Scott or dispatcher), not the owner.

**2026-10-08 — Scott (ticket comment, 02:23Z):**
> land it, approved

→ Landing via `land-stack` from the main checkout (owner lands here: Scott invoked the owner directly, no dispatcher in this session).
- LANDED 2026-10-08: steel-etl 88aec3b..0c74f4f → origin/main; superproject merge `1ea53ea` pushed (CHANGELOG conflict with SC-378 resolved keeping both bullets). Vault stash popped; dse dirt restored. Ticket → Done.
