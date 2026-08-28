# Orchestration v2 — Fable ticket-owners, thin dispatcher, portable plugin

**Date:** 2026-08-27 · **Status:** approved-in-chat, pending Scott's spec review
**Supersedes:** the single-Opus-orchestrator model in `.claude/skills/orchestrate/` and the
"Token economics" / "orchestrator workflow" sections of `docs/working-preferences.md`
(2026-08-10 and 2026-08-22 entries).

## 1. Problem

A week of running the 2026-08-22 model (Opus orchestrator, right-sized workers) fixed the
token problem (weekly usage 67%, Fable 70% at end of week) but surfaced two failures, both
confined to the orchestrator role:

- **Trust:** the Opus orchestrator misses things and self-corrects visibly
  ("I think this… oh I was wrong" — SC-198, where Scott ultimately spun up a Fable agent
  just to review the ticket and clarify).
- **Communication:** its Linear comments are verbose and written in abstract vocabulary
  that is hard to parse. Known Opus 5 behavior without a good prompt-level fix.

Both failures are exactly the two duties the current design assigns to the orchestrator:
judgment and Scott-facing communication. Its other duties (dispatch, stall-watching,
landing mechanics) drew no complaints.

## 2. Goals and non-goals

**Goals**

1. Fable holds judgment and writes every Scott-facing word; nothing else runs on Fable.
2. Linear stays Scott's sole interaction surface (screenshots, comments, Needs Review).
3. Token economics of the 08-22 model are preserved: implementation bulk stays on
   Sonnet/Opus/Haiku with explicit `model` on every dispatch.
4. The workflow is **portable**: packaged as a personal plugin installable on any machine
   and usable in other projects (Scott runs a near-identical flow at work — Jira
   officially, Linear on the side), with project specifics in a thin per-repo adapter.
5. Agent-posted Linear comments carry traceability metadata (model, role, ticket,
   session-id, worktree@sha) so drift is diagnosable.
6. `FOLLOWUPS.md` / `ROADMAP.md` are retired; Linear tickets replace both.

**Non-goals**

- Redesigning handoff/continuity. `HANDOFF.md` is a known weak link (Scott, 2026-08-27:
  "I dont love keeping HANDOFF.md - its just a weak link, but thats not really the point
  of this effort") — it survives unchanged; a future effort may replace it.
- Implementing the Jira adapter. v1 ships Linear only; the adapter boundary just has to
  not preclude Jira.
- The broad documentation prune. This effort prunes only the docs it already rewrites;
  the full sweep is a separate ticket (and a good shakedown cruise for the new workflow).

## 3. Architecture

Three tiers. The middle tier is new; the top tier is demoted; the bottom is unchanged.

### 3.1 Dispatcher (one per session · Sonnet)

The stable address Scott talks to. Duties, exhaustively:

- Spawn a **ticket-owner** per ticket Scott activates; replace dead ones (fresh spawn
  briefed from the effort's ledger — same continuity ladder as today).
- Route wakeups. On "I've added comments" (bulk or single), query In Progress tickets for
  comment activity newer than each owner's last wake and `SendMessage` the affected
  owners. The dispatcher **never reads comment bodies** — owners interpret their own
  threads.
- Arm stall-watchers when an owner or worker parks on a background job (the
  `kill -0` background-Bash pattern; unchanged from v1 rule 4).
- **Serialize landings**: run `land-stack` from the main checkout, one effort at a time;
  message owners whose branches went stale after each landing.
- Maintain `HANDOFF.md` at wave boundaries (unchanged, see non-goals).

Explicitly excluded: reading/writing Linear comment content, reviewing work, judging
evidence, writing anything Scott reads. The dispatcher produces no prose for humans.
Start on **Sonnet**; escalate to Opus only if landing mechanics prove fumble-prone.

### 3.2 Ticket-owner (one per ticket · Fable)

Owns SC-N end to end. Verified feasible 2026-08-27: a background agent has the Agent
tool, and a depth-2 spawn with an explicit `model` override works (probe child confirmed
it ran Sonnet).

- Reads its own ticket with v1's fetch discipline (newest-first, small `limit`, expand
  backward only on ambiguity) and maintains the effort's `decisions.md` ledger — rulings
  verbatim, dated, supersessions struck through.
- Dispatches its own workers with explicit `model` per v1 tiering: **Sonnet** for
  well-specified implementation and scoped re-reviews, **Opus** for adversarial review
  and open-ended design, **Haiku** for mechanical chores. Runs v1's review pipeline
  (implementer → independent Opus reviewer → fix rounds → scoped re-review) unchanged.
- Personally eyeballs the deciding evidence before anything reaches Scott.
- **Writes and posts every Linear comment itself** via the posting script (§5), under the
  comment-style contract (§6). Files Backlog tickets for deferred findings (§7).
- Fable spend is confined to this coordination/judgment loop; the implementation bulk
  below it stays cheap.

**Deep interaction:** when Scott wants a real conversation about an effort, he talks to
the Fable owner (SendMessage relay via the dispatcher, or a dedicated Fable session
reading the effort's ledger) — never to the dispatcher.

### 3.3 Workers (per task · Sonnet/Opus/Haiku)

Unchanged from v1: isolated worktrees, self-contained briefs assuming replacement,
context in files not conversation memory, raw-facts return contract, **never touch
Linear** (that rule now stops at the ticket-owner boundary instead of the orchestrator
boundary).

## 4. Portability: plugin + project adapter

The generic workflow leaves this repo and becomes a **personal plugin in its own private
git repo**, installed on both laptops via a plugin marketplace entry.

**Posture: scrappy.** Concretely, these stay hardcoded in v1 rather than abstracted:
Linear as the only tracker (the posting script and fetch discipline are Linear-shaped;
Jira slots in later as a parallel script + skill section, not a day-one interface);
Scott's status/label semantics (Todo / In Progress+Needs Review / Awaiting / Backlog)
written into the skill text; git-worktree-based isolation assumed. What is **not**
hardcoded is anything steel-compendium-specific — that moves to the adapter.

**Plugin contents:**

- `orchestrate` skill — the dispatcher role (§3.1) and universal rules: continuity
  ladder, stall-watching, landing serialization protocol (delegating the *procedure* to
  the project adapter), spawn-cap doctrine.
- `ticket-owner` skill — the Fable role (§3.2): ledger discipline, worker tiering and
  dispatch-shape rules, review pipeline, evidence discipline, comment-style contract,
  tracker fetch discipline.
- `linear-post.py` — moved from the workspace, extended per §5.

**Per-project adapter** — a short prose file the plugin skills read at startup
(`.claude/orchestrate/PROJECT.md` in each repo): tracker + team key, worktree recipes
(`just wt-new`/`wt-finish` here), gate skills (`dse-verify`), landing skill
(`land-stack`), ledger/scratch location, and project footguns. For steel-compendium the
adapter is assembled from the project-specific half of today's orchestrate skill
(freeze-baseline rules, v2 `git checkout` hazard, submodule-pin staleness, devbox exit-code
traps, workspace-path trap); repo skills `land-stack`, `dse-verify`, `linear-flow` stay
where they are and are referenced by name.

**Sorting rule** for migrating today's skill: a rule goes in the plugin iff it would be
true in the work repo too; otherwise it goes in the adapter. Every rule must land in
exactly one place — this migration is also the pruning pass for these files.

## 5. Traceability footer

Every agent-posted comment ends with one standardized line:

> `— fable · ticket-owner · SC-203 · session ab53a208 · wt sc203-scroll @ cfea821`

Fields: **model · role (ticket-owner/dispatcher) · ticket · session-id · worktree@sha**
(worktree field optional where no worktree applies). Enforcement is structural, not
behavioral: `linear-post.py` gains required `--model/--role/--session` flags (plus
optional `--worktree`) and **refuses to post without them**. A wrong-register comment is
then immediately attributable: which model wrote it, in which role, from which session's
transcript.

## 6. Comment-style contract

Written into the plugin's ticket-owner skill (model-independent, though Fable is the
primary author): first line states the decision or result in plain words with its visible
consequence; concrete nouns over abstract vocabulary; mechanics, hash lists, and
procedure below the ask, never in front of it; self-contained per
`working-preferences.md` (no scrolling to reconstruct the ask). This codifies the
existing SC-156 rule as a contract every posting agent is briefed on.

## 7. FOLLOWUPS/ROADMAP → Linear

- **Deferred findings** (review LOWs, in-scope tangents): the ticket-owner files a
  Backlog ticket linking the parent ticket, at the moment the deferral ruling lands —
  same timing rule as today's "FOLLOWUPS immediately", same fix-round out-of-scope
  citation (cite the ticket ID instead of `#N`).
- **Roadmap items**: Backlog tickets (Linear projects for multi-ticket efforts).
- **Migration**: one-time pass converting live FOLLOWUPS/ROADMAP items to Backlog
  tickets (title = item title, body = item text + `(was FOLLOWUPS #N)` provenance), then
  both files are deleted. `docs/followups-archive/` and `docs/roadmap-archive/` stay
  frozen; a `#N` reference resolves via archives or ticket provenance lines.
- **Deleted with them**: the stale-base merge hazard, the next-id race, the
  "orchestrator writes FOLLOWUPS entries for agents" workaround, and the CLAUDE.md
  structural rule about permanent IDs.

## 8. Repo doc changes in scope

- `CLAUDE.md`: remove FOLLOWUPS/ROADMAP from layout, routing table (rows → "file a
  Linear Backlog ticket"), and structural rules; update the orchestrator pointer to the
  plugin + adapter.
- `docs/working-preferences.md`: rewrite the 2026-08-10/08-22 orchestrator sections to
  describe v2 (marking what they supersede); everything else untouched.
- `.claude/skills/orchestrate/`: replaced by the adapter file + a pointer stub; the stub
  is deleted once the plugin is confirmed installed on both machines.
- `.claude/skills/linear-flow/`: keeps the steel-compendium-specific mechanics
  (screenshot/attachment conventions, status semantics) but its posting instructions
  point at the plugin's script; the footer and comment-style contract live in the plugin
  and are referenced, not duplicated.
- `CHANGELOG.md`: not applicable (workflow change, not user-facing product change).

## 9. Risks and validation

- **Fable burn rate** (the one real risk): week one, watch Fable usage vs the ~70%
  baseline. Fallback if hot: Opus ticket-owners with a Fable drafting pass over every
  Scott-facing comment — patches communication, not trust; documented here so it's a
  known retreat, not a redesign.
- **Depth-2 dispatch**: verified by probe (2026-08-27) but not yet exercised at scale;
  the first real ticket run validates SendMessage/stall-watching through two tiers.
- **Dispatcher on Sonnet**: landing mechanics are procedural but scarred; if fumbles
  appear, escalate the dispatcher to Opus — a one-line adapter change.
- **Plugin drift between laptops**: the plugin repo is the sync channel (git pull), which
  is the point — today syncing tweaks is "next to impossible".

## 10. Implementation outline

Detailed plan via the writing-plans skill after spec approval. Rough phases:

1. Scaffold the plugin repo + marketplace entry; install locally.
2. Write plugin skills (`orchestrate`, `ticket-owner`) by sorting v1 rules per §4; move
   and extend `linear-post.py` (§5).
3. Author the steel-compendium adapter (`.claude/orchestrate/PROJECT.md`).
4. Migrate FOLLOWUPS/ROADMAP to Linear; delete the files.
5. Repo doc updates (§8).
6. Shakedown: run the doc-prune ticket (§2 non-goals) under the new workflow.
