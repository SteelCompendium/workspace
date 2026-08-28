# Orchestration v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-Opus-orchestrator workflow with Fable ticket-owners + a thin dispatcher, packaged as a portable personal plugin, with traceable Linear comments and FOLLOWUPS/ROADMAP retired into Linear.

**Architecture:** A new git repo `~/code/orchestration-plugin` holds a Claude Code plugin (two skills + the posting script); the workspace keeps only a thin project adapter (`.claude/orchestrate/PROJECT.md`) and updated docs. FOLLOWUPS.md/ROADMAP.md are migrated to Linear Backlog tickets with permanent provenance records in the archive dirs.

**Tech Stack:** Claude Code plugin system (`claude plugin validate` / `marketplace add`), Python 3 stdlib (script + unittest), Linear GraphQL (existing script) + Linear MCP (`save_issue` for migration).

**Spec:** `docs/superpowers/specs/2026-08-27-orchestration-v2-design.md` — read it first; every task below argues from it.

## Global Constraints

- **No AI attribution anywhere:** commit messages and docs never carry `Co-Authored-By: Claude`, "Generated with Claude Code", or similar (Scott's global rule).
- **Workspace edits happen in the main checkout** (`/home/scott/code/steelCompendium/workspace`) — this whole plan touches only workspace-level docs/skills (orchestration bookkeeping, explicitly allowed), never submodule code. Do NOT touch the `draw-steel-elements` submodule (it is dirty with someone else's work).
- **The plugin repo lives at `~/code/orchestration-plugin`** and is its own git repo — never nested inside the workspace.
- Plugin name is `orchestration`; its skills surface as `orchestration:orchestrate` and `orchestration:ticket-owner`. Version starts at `0.1.0`.
- Traceability footer format (spec §5, exact): `— {model} · {role} · {issue} · session {session}` with ` · wt {worktree}` appended only when `--worktree` is given.
- When writing SKILL.md files, load and follow `superpowers:writing-skills`.
- The v1 source material is `.claude/skills/orchestrate/SKILL.md` (referenced below by its rule numbers). It stays in place, unmodified, until Task 7 stubs it — quote from it freely; **rulings quoted from it must stay verbatim**.
- Python has no third-party deps: stdlib only, tests via `unittest`.
- Before any workspace commit: `git fetch origin` and rebase if `origin/main` moved (parallel agents are active in this workspace).

---

### Task 1: Plugin repo scaffold + GitHub remote

**Files:**
- Create: `~/code/orchestration-plugin/.claude-plugin/plugin.json`
- Create: `~/code/orchestration-plugin/.claude-plugin/marketplace.json`
- Create: `~/code/orchestration-plugin/README.md`

**Interfaces:**
- Produces: a validating plugin repo that Tasks 2–4 add content to; marketplace name `tski` and plugin name `orchestration` (Tasks 7–8 reference both).

- [ ] **Step 1: Create the repo**

```bash
mkdir -p ~/code/orchestration-plugin/.claude-plugin ~/code/orchestration-plugin/skills ~/code/orchestration-plugin/scripts
cd ~/code/orchestration-plugin && git init -b main
```

- [ ] **Step 2: Write the manifests**

`.claude-plugin/plugin.json`:

```json
{
  "name": "orchestration",
  "description": "Ticket-driven multi-agent orchestration: a thin dispatcher routes work to per-ticket Fable owners who delegate to right-sized workers. Tracker: Linear (v1).",
  "version": "0.1.0",
  "author": { "name": "Scott Tomaszewski" }
}
```

`.claude-plugin/marketplace.json`:

```json
{
  "name": "tski",
  "owner": { "name": "Scott Tomaszewski" },
  "plugins": [
    {
      "name": "orchestration",
      "source": "./",
      "description": "Ticket-driven multi-agent orchestration (dispatcher + Fable ticket-owners)."
    }
  ]
}
```

`README.md` — three short sections: what the plugin is (one paragraph pointing at the spec path in the steel-compendium workspace), install (`claude plugin marketplace add <this repo>` then `claude plugin install orchestration@tski`), and per-project setup (each project needs `.claude/orchestrate/PROJECT.md` — see the `orchestrate` skill for its required contents).

- [ ] **Step 3: Validate**

Run: `claude plugin validate ~/code/orchestration-plugin`
Expected: PASS for both the plugin and marketplace manifests. If the validator names missing/renamed fields, fix the JSON to what it asks and re-run — the validator is the schema authority.

- [ ] **Step 4: Commit and create the private GitHub repo**

```bash
cd ~/code/orchestration-plugin
git add -A && git commit -m "scaffold: orchestration plugin manifests"
gh repo create orchestration-plugin --private --source . --push
```

Expected: repo created under Scott's GitHub account, `main` pushed.

---

### Task 2: `linear-post.py` — move, footer, tests

**Files:**
- Create: `~/code/orchestration-plugin/scripts/linear-post.py` (from `workspace/scripts/linear-post.py`)
- Test: `~/code/orchestration-plugin/scripts/test_linear_post.py`

**Interfaces:**
- Consumes: the existing script at `/home/scott/code/steelCompendium/workspace/scripts/linear-post.py` (copy, then modify; the workspace copy is removed in Task 7).
- Produces: CLI contract used by both skills: `linear-post.py ISSUE-KEY COMMENT-FILE --model M --role R --session S [--worktree W] [--state NAME] [--dry-run] [IMG ...]`; function `append_footer(body, model, role, issue, session, worktree)` (worktree may be `None`).

- [ ] **Step 1: Copy the script**

```bash
cp /home/scott/code/steelCompendium/workspace/scripts/linear-post.py ~/code/orchestration-plugin/scripts/linear-post.py
```

- [ ] **Step 2: Write the failing tests**

`scripts/test_linear_post.py`:

```python
import importlib.util
import os
import sys
import unittest

spec = importlib.util.spec_from_file_location(
    "linear_post", os.path.join(os.path.dirname(__file__), "linear-post.py"))
lp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lp)


class FooterTests(unittest.TestCase):
    def test_footer_appended_with_worktree(self):
        out = lp.append_footer("Body text.", "fable", "ticket-owner",
                               "SC-203", "ab53a208", "sc203-scroll @ cfea821")
        self.assertTrue(out.startswith("Body text."))
        self.assertTrue(out.rstrip().endswith(
            "— fable · ticket-owner · SC-203 · session ab53a208 · wt sc203-scroll @ cfea821"))
        # exactly one blank line between body and footer
        self.assertIn("Body text.\n\n—", out)

    def test_footer_without_worktree(self):
        out = lp.append_footer("Body.", "sonnet", "dispatcher", "SC-1", "deadbeef", None)
        self.assertTrue(out.rstrip().endswith("— sonnet · dispatcher · SC-1 · session deadbeef"))
        self.assertNotIn("wt", out.splitlines()[-1])


class ArgTests(unittest.TestCase):
    def test_missing_metadata_flags_exit(self):
        with self.assertRaises(SystemExit):
            lp.parse_args(["SC-1", "c.md"])

    def test_full_args_parse(self):
        a = lp.parse_args(["SC-1", "c.md", "--model", "fable", "--role", "ticket-owner",
                           "--session", "ab53a208", "--worktree", "wt @ sha",
                           "--state", "Awaiting", "--dry-run", "a.png", "b.png"])
        self.assertEqual(a.issue_key, "SC-1")
        self.assertEqual(a.comment_file, "c.md")
        self.assertEqual(a.images, ["a.png", "b.png"])
        self.assertEqual(a.state, "Awaiting")
        self.assertTrue(a.dry_run)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd ~/code/orchestration-plugin/scripts && python3 -m unittest test_linear_post -v`
Expected: FAIL — `append_footer` / `parse_args` not defined.

- [ ] **Step 4: Implement**

In `scripts/linear-post.py`: replace the hand-rolled arg loop in `main()` (the `args = sys.argv[1:] … while i < len(rest)` block) with these two functions plus wiring, and update the module docstring's Usage section to the new contract:

```python
import argparse


def parse_args(argv):
    p = argparse.ArgumentParser(
        description="Post a comment (with image uploads) to a Linear issue in one call.")
    p.add_argument("issue_key")
    p.add_argument("comment_file")
    p.add_argument("images", nargs="*", default=[])
    p.add_argument("--model", required=True, help="model that authored the comment (e.g. fable)")
    p.add_argument("--role", required=True, help="ticket-owner | dispatcher | <other>")
    p.add_argument("--session", required=True, help="session id (scratchpad-dir UUID)")
    p.add_argument("--worktree", default=None, help="worktree name @ sha, if any")
    p.add_argument("--state", default=None, help="move issue to this workflow state after posting")
    p.add_argument("--dry-run", action="store_true",
                   help="print the final body (footer included) and exit; no network")
    return p.parse_args(argv)


def append_footer(body, model, role, issue, session, worktree):
    footer = f"— {model} · {role} · {issue} · session {session}"
    if worktree:
        footer += f" · wt {worktree}"
    return body.rstrip("\n") + "\n\n" + footer + "\n"
```

In `main()`: `args = parse_args(sys.argv[1:])`; keep the existing existence checks and body read; then `body = append_footer(body, args.model, args.role, args.issue_key, args.session, args.worktree)`. Immediately after the footer is appended, add the dry-run exit **before** any network call:

```python
    if args.dry_run:
        print(body)
        return
```

Everything downstream (issue lookup, uploads, placeholder resolution, commentCreate, `--state`) is unchanged except it reads `args.issue_key` / `args.state` / `args.images`. Note the placeholder-resolution and image-append logic must run on the footered body exactly as it ran before — appending unreferenced images after the footer is acceptable (footer need not be the literal last line when trailing images exist; the tests above only pin the no-images case).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd ~/code/orchestration-plugin/scripts && python3 -m unittest test_linear_post -v`
Expected: 4 tests PASS.

- [ ] **Step 6: Live smoke test (dry-run only)**

```bash
cd ~/code/orchestration-plugin
printf 'Smoke test body.\n' > /tmp/claude-smoke.md
python3 scripts/linear-post.py SC-1 /tmp/claude-smoke.md --model fable --role ticket-owner --session testsess --dry-run
```

Expected: prints `Smoke test body.`, blank line, `— fable · ticket-owner · SC-1 · session testsess`. No network access.

- [ ] **Step 7: Commit**

```bash
cd ~/code/orchestration-plugin
git add scripts && git commit -m "feat: linear-post with required traceability footer + dry-run + tests"
```

---

### Task 3: Plugin skill — `orchestrate` (the dispatcher)

**Files:**
- Create: `~/code/orchestration-plugin/skills/orchestrate/SKILL.md`

**Interfaces:**
- Consumes: v1 rules 1, 2, 4, 7 from `workspace/.claude/skills/orchestrate/SKILL.md`; spec §3.1.
- Produces: the dispatcher role definition; names the adapter path `.claude/orchestrate/PROJECT.md` and the `ticket-owner` skill (Task 4) — use those exact names.

- [ ] **Step 1: Write the skill**

Frontmatter description: "Use when running a multi-ticket session as a dispatcher — spawn a Fable ticket-owner per active ticket, route Scott's 'comments added' wakeups, watch for stalls, and serialize landings. The dispatcher judges nothing and writes nothing a human reads."

Body sections, with source material for each (transplant the operational text; rulings verbatim):

1. **Role & model.** The dispatcher runs on Sonnet, produces no human-facing prose, reads no ticket comment bodies, reviews no work. It exists to keep 1–5 concurrent Fable ticket-owners running. Spec §3.1 is the contract — restate its five duties and its exclusion list.
2. **Session start.** Read the project adapter at `.claude/orchestrate/PROJECT.md` (REQUIRED — if absent, stop and tell the user to create one; list what it must define: tracker + team key, worktree recipes, gate skills, landing skill, ledger/scratch location, project footguns). Then read the docs the adapter names.
3. **Spawning ticket-owners.** One background Agent per active ticket: `subagent_type: "general-purpose"`, `model: "fable"`, never fork. The brief: ticket key, adapter path, the instruction to load the `orchestration:ticket-owner` skill, the effort's ledger dir, and worktree name. Ticket-owners are self-briefing from there (they read their own ticket).
4. **Routing wakeups.** On "comments added" (bulk or single): query the tracker for In Progress issues with comment activity newer than each owner's last wake (track last-wake times in the dispatcher's own notes), then `SendMessage` each affected owner: "SC-N has new comments; fetch newest-first." Never fetch comment bodies yourself.
5. **Stall-watching.** Transplant v1 rule 4's parked-on-a-background-job doctrine wholesale — the `ps aux` → `kill -0` background-watcher loop, the "3 occurrences in one day (2026-08-23)" evidence, and the SendMessage wake instruction. Also transplant the continuity ladder (SendMessage resume first; on "No transcript found", fresh spawn briefed from files) and the spawn-cap doctrine (200/session, survives compaction, author-independence planning, drain before restart).
6. **Landing serialization.** One landing at a time, executed by the dispatcher via the landing skill the adapter names, from the main checkout. After each landing, message still-running owners whose branches went stale (v1 rule 2's closing sentence, verbatim mechanics). The landing *procedure* itself is wholly the adapter's/landing-skill's — this skill only owns the serialization and stale-notification loop.
7. **Bookkeeping.** The dispatcher edits nothing except orchestration bookkeeping (v1 rule 1, generalized: handoff file, ledger snapshots — paths from the adapter). Maintain the handoff file at wave boundaries and before compaction.
8. **Posting (rare).** If the dispatcher ever posts to the tracker (it normally never does), it uses `${CLAUDE_PLUGIN_ROOT}/scripts/linear-post.py` with `--role dispatcher` — the footer flags are mandatory; the script refuses without them. Session id = the UUID segment of the session scratchpad directory path.

- [ ] **Step 2: Validate**

Run: `claude plugin validate ~/code/orchestration-plugin`
Expected: PASS, skill `orchestrate` listed.

- [ ] **Step 3: Commit**

```bash
cd ~/code/orchestration-plugin && git add skills/orchestrate && git commit -m "feat: orchestrate skill (dispatcher role)"
```

---

### Task 4: Plugin skill — `ticket-owner`

**Files:**
- Create: `~/code/orchestration-plugin/skills/ticket-owner/SKILL.md`

**Interfaces:**
- Consumes: v1 rules 3, 3b, 5, 6 + the universal footgun lines; spec §3.2, §5, §6.
- Produces: the Fable per-ticket role; consumed by dispatcher briefs (Task 3 step 1 §3).

- [ ] **Step 1: Write the skill**

Frontmatter description: "Use when you are the Fable owner of one tracker ticket — you hold judgment and all Scott-facing communication, maintain the decisions ledger, dispatch right-sized workers for implementation and review, and post every comment yourself with the traceability footer."

Body sections and their sources:

1. **Role & boundaries.** You own exactly one ticket end-to-end. You implement nothing yourself; workers in isolated worktrees do all code changes (v1 rule 1's principle at ticket scope). You are the only agent on this ticket that touches the tracker. Read the project adapter (`.claude/orchestrate/PROJECT.md`) and everything it names before acting.
2. **Ledger discipline.** Transplant v1 rule 3b's decisions-ledger paragraph verbatim (the gate ritual, verbatim+dated rulings, strike-through supersession, the SC-182 resurrection example, ledger-not-thread as the workers' context source).
3. **Fetch discipline.** Transplant v1 rule 3b's fetch bullet (newest-first, small `limit`, expand backward only on ambiguity, never re-pull a full thread).
4. **Dispatching workers.** Transplant v1 rule 3's dispatch shape: background Agent per effort-round, **`model` explicit on EVERY dispatch** — an omitted `model` inherits YOURS, which is Fable, the exact costly bug this rule exists to prevent (keep v1's ~1.6M-token evidence sentence verbatim); fork only when full context is genuinely required. Tiers verbatim from v1: Opus = design/judgment/review/open-ended; Sonnet = well-specified implementation, scoped re-reviews, evidence rounds against a written spec; Haiku = mechanical chores. Brief structure from v1 rule 3: self-contained, replacement-ready, context-loading section (ledger + prior reports + worktree/branch + fetch-and-rebase-first), rulings verbatim, gates with expected numbers, report path, raw-facts return contract ("your final text goes to the ticket-owner, not a human"). Workers NEVER touch the tracker. Include the universal brief footguns: "return inline if the report-file write is blocked"; "never key wait-loops on scratch filenames/contents — read the process's own output or a per-run unique path".
5. **The review pipeline.** Transplant v1 rule 5 minus the freeze-delta flow (project-specific → adapter): implementer → independent Opus reviewer (execute and probe, not just read) → fix rounds with findings verbatim → scoped re-review of the delta → land-ready. Keep the caught-bug evidence list and "not optional for release-bound code" verbatim. Author-independence: a worker never reviews its own work. **Deferred findings** (LOW/INFO the fix round won't address): file a Backlog ticket in the tracker linking this ticket, at the moment of the deferral ruling, and cite it as out-of-scope in the fix-round brief.
6. **Evidence & communication.** Transplant v1 rule 6 (personally eyeball the deciding evidence before Scott sees it; name colors in prose — Scott is colorblind and blue-vs-purple must never carry meaning alone; keep the Needs Review filter honest). Then the **comment-style contract** (spec §6): first line = the decision/result in plain words with its visible consequence; concrete nouns, no abstract vocabulary; mechanics/hashes/procedure below the ask; every ask self-contained in its final comment even if that duplicates earlier images.
7. **Posting.** All posts via `${CLAUDE_PLUGIN_ROOT}/scripts/linear-post.py` — one call uploads images, resolves `{{IMG:...}}` placeholders, posts, optionally flips state; the footer flags (`--model fable --role ticket-owner --session <scratchpad-dir UUID> [--worktree <name @ sha>]`) are mandatory. Labels are NOT handled by the script: use the tracker MCP `save_issue`, remembering labels REPLACE the full set and that state/label saves occasionally no-op silently — verify the response, retry once (v1 footgun, verbatim).
8. **Status semantics.** Todo = not started; In Progress + `Needs Review` label = needs Scott (both, always together); Awaiting = an agent is actively working or blocked on something external; Backlog = someday. Never park on Awaiting for internal blockage. (From `docs/working-preferences.md`, universal across Scott's projects.)

- [ ] **Step 2: Validate**

Run: `claude plugin validate ~/code/orchestration-plugin`
Expected: PASS, both skills listed.

- [ ] **Step 3: Commit**

```bash
cd ~/code/orchestration-plugin && git add skills/ticket-owner && git commit -m "feat: ticket-owner skill (Fable per-ticket role)"
```

---

### Task 5: Steel-compendium project adapter

**Files:**
- Create: `workspace/.claude/orchestrate/PROJECT.md`

**Interfaces:**
- Consumes: the project-specific residue of v1 rules 1, 2, 5 + the footgun index; spec §4's sorting rule ("a rule goes in the plugin iff it would be true in the work repo too").
- Produces: the adapter both plugin skills load at session start.

- [ ] **Step 1: Write the adapter**

Sections (all content transplanted from v1's skill and the workspace docs it points at — this file is pointers + project facts, not re-explained doctrine):

1. **Tracker:** Linear, team **Steel Compendium** (`SC-*`). Screenshot/attachment mechanics: `.claude/skills/linear-flow/`.
2. **Worktrees:** `just wt-new <name>` / `just wt-finish <name>` from the main checkout (`/home/scott/code/steelCompendium/workspace`); worktrees at `../worktrees/<name>`. The main checkout is shared global state — implementation NEVER happens there (workspace `CLAUDE.md` rule 1). Worktree submodule clones have independent refs — fetch in the clone.
3. **Tracked branches at landing:** `develop` for draw-steel-elements, `v3` for data-sdk-npm/data-gen, `main` elsewhere (policy: `docs/git-workflow.md`).
4. **Gates:** `dse-verify` skill for any draw-steel-elements change (expected numbers live there).
5. **Landing:** `land-stack` skill, main checkout only, dispatcher-serialized.
6. **Ledgers/scratch:** `.superpowers/sdd/<effort>/`, effort-prefixed filenames (shared global state — never bare `progress.md`). Handoff file: `docs/handoffs/HANDOFF.md`. Preserved ledgers: `docs/superpowers/dse-overhaul/build-ledgers/`.
7. **Freeze-delta flow:** transplant v1 rule 5's freeze paragraph verbatim (agents never touch the shared baseline; `rebaseline.txt` + crops; Scott's explicit sanction before the dispatcher applies lines at landing; dated backup + dated record in `dse-verify`).
8. **Project footguns** (transplant each from v1's footgun index, verbatim where dated evidence matters): devbox exit-code traps + `bash -c` wrapping; `npm ci` after obsidian-version rebases; workspace-level file paths in briefs must point into the worktree superproject, never `workspace/`; worktree superproject pin staleness (`DSE_TOKEN_MAP_PATH` diagnosis); `git checkout -- .` in `v2` destroys hand-authored JS/CSS — safe form `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`; freeze baseline is machine-local, regenerate per `dse-verify` on a new machine.
9. **Scott's standing rules pointer:** `docs/working-preferences.md` is required reading (colorblind evidence rules, deploy is Scott's, ⛔ never tag/release draw-steel-elements).

- [ ] **Step 2: Verify completeness against the sorting rule**

Re-read v1 `.claude/skills/orchestrate/SKILL.md` top to bottom; every rule/footgun in it must now be traceable to exactly one of: Task 3 skill, Task 4 skill, this adapter, or "deleted because FOLLOWUPS/ROADMAP retired" (the FOLLOWUPS stale-base hazard, next-id race, and orchestrator-writes-FOLLOWUPS rules). List the disposition in the commit message body.

- [ ] **Step 3: Commit (workspace)**

```bash
cd /home/scott/code/steelCompendium/workspace
git add .claude/orchestrate/PROJECT.md
git commit -m "feat(orchestrate): steel-compendium project adapter for the orchestration plugin"
```

---

### Task 6: Install and verify the plugin on this machine

**Files:**
- Modify: user-level plugin config (via CLI only — no hand-edited files)

**Interfaces:**
- Consumes: Tasks 1–4 complete and pushed.
- Produces: `orchestration:orchestrate` / `orchestration:ticket-owner` available to sessions; install commands for the other laptop recorded in the plugin README (Task 1).

- [ ] **Step 1: Add the marketplace and install**

```bash
claude plugin marketplace add ~/code/orchestration-plugin
claude plugin install orchestration@tski
claude plugin list
```

Expected: `orchestration` listed as installed. (Local-path marketplace is fine for this machine; the other laptop uses the GitHub repo URL — confirm the README says so.)

- [ ] **Step 2: Verify the script ships and runs from the installed location**

```bash
claude plugin details orchestration
```

Expected: both skills in the component inventory. Then run the Task 2 dry-run smoke command against the *installed* copy (path from the details output or the plugin cache dir) to confirm the script is executable in place.

- [ ] **Step 3: Push the plugin repo**

```bash
cd ~/code/orchestration-plugin && git push
```

---

### Task 7: Retire FOLLOWUPS.md / ROADMAP.md into Linear

**Files:**
- Create: `workspace/docs/followups-archive/2026-08-27-linear-migration.md`
- Create: `workspace/docs/roadmap-archive/2026-08-27-linear-migration.md`
- Delete: `workspace/FOLLOWUPS.md`, `workspace/ROADMAP.md`

**Interfaces:**
- Consumes: Linear MCP `save_issue` (team "Steel Compendium", state "Backlog"); the live items in both files.
- Produces: one Backlog ticket per live item; permanent `#N → SC-key` resolution via the migration-record files (the `(was #N)` promise survives file deletion).

- [ ] **Step 1: Inventory the live items**

Read all of `FOLLOWUPS.md` (1,643 lines) and `ROADMAP.md`. An item is **live** iff its governing `**Status:**` line is not terminal (done/DONE/shipped). Restated/narrowed items (e.g. FOLLOWUPS #39, #40) are live — their remaining scope migrates. Expect roughly 26 live FOLLOWUPS items and 8–10 live ROADMAP items; count precisely and record the number. Ambiguous statuses: migrate (a spurious Backlog ticket is cheaper than a lost item) and flag in the record file.

- [ ] **Step 2: Create the tickets**

For each live item, one `save_issue`: team "Steel Compendium", state "Backlog", title = the item's heading text without the number, description = provenance line `(was FOLLOWUPS #N — migrated from the workspace repo 2026-08-27)` (or ROADMAP) followed by the item's full body **verbatim** — including its Status/Identified/What/Why/Context/Effort fields and any inline code blocks. Do not rewrite, summarize, or fix `#N` cross-references in the text (they resolve via the record files). Verify each response returned an identifier; retry once on silent failure (known Linear no-op behavior).

- [ ] **Step 3: Write the migration records**

Each record file: a header ("Live items migrated to Linear 2026-08-27; completed items remain in the dated archive files; a `#N` reference resolves here or in those archives.") and a table: `#N | title | SC-key`. Include every migrated item; list any items judged ambiguous with one line of reasoning.

- [ ] **Step 4: Delete the files and commit**

```bash
cd /home/scott/code/steelCompendium/workspace
git rm FOLLOWUPS.md ROADMAP.md
git add docs/followups-archive/2026-08-27-linear-migration.md docs/roadmap-archive/2026-08-27-linear-migration.md
git commit -m "chore: retire FOLLOWUPS/ROADMAP into Linear Backlog tickets (migration records in archives)"
```

- [ ] **Step 5: Verify**

`mcp__linear__list_issues` filtered to team "Steel Compendium" + state Backlog, confirm the new ticket count matches the record files' row count. Run `grep -rn 'FOLLOWUPS.md\|ROADMAP.md' --include='*.md' .` at the workspace root (excluding archives and `docs/superpowers/`) and note every hit for Task 8 — those references must be updated there.

---

### Task 8: Workspace doc updates + v1 skill stub

**Files:**
- Modify: `workspace/CLAUDE.md`
- Modify: `workspace/docs/working-preferences.md`
- Modify: `workspace/.claude/skills/linear-flow/SKILL.md`
- Modify: `workspace/.claude/skills/orchestrate/SKILL.md` (reduce to stub)
- Delete: `workspace/scripts/linear-post.py`

**Interfaces:**
- Consumes: Tasks 5–7 complete (adapter exists, plugin installed, files migrated).
- Produces: a router CLAUDE.md consistent with v2; no dangling references to FOLLOWUPS/ROADMAP or the old orchestrator model.

- [ ] **Step 1: CLAUDE.md**

- Layout section: remove the `FOLLOWUPS.md`/`ROADMAP.md` bullets; add `.claude/orchestrate/PROJECT.md` (one line: project adapter for the orchestration plugin).
- Routing table: replace the FOLLOWUPS row with "Hit a small in-scope tangent (deferred bug/gap) → file a Linear **Backlog** ticket linking the parent ticket" and the ROADMAP row with "Plan a new feature or larger effort → a Linear **Backlog** ticket (or Linear project for multi-ticket efforts)".
- Delete the "`FOLLOWUPS.md` / `ROADMAP.md` numbers are permanent IDs" structural rule and the "`FOLLOWUPS.md`/`ROADMAP.md` exist only at the workspace root" sentence; in their place one line: historical `#N` references resolve via `docs/{followups,roadmap}-archive/` (see the 2026-08-27 migration records).
- Any other FOLLOWUPS/ROADMAP mentions found by Task 7 step 5's grep: update to the Linear convention (archived/dated docs stay untouched).

- [ ] **Step 2: working-preferences.md**

Replace the two orchestrator sections ("The orchestrator workflow (2026-08-10)" and "Token economics (2026-08-22)") with one section "The orchestration workflow (v2, 2026-08-27)": Scott's flow (reviews In Progress tickets in Linear, comments, tells the dispatcher "comments added" in bulk or singly; 1–5 tickets concurrent); the roles one line each (Sonnet dispatcher — mechanics only; Fable ticket-owner per ticket — judgment + all Scott-facing comments; right-sized workers); pointer to the `orchestration` plugin + `.claude/orchestrate/PROJECT.md`; a superseded-note that the 08-10/08-22 model (Opus orchestrator, agents-never-touch-Linear) is replaced and why (Opus missed things and wrote abstract, verbose comments — SC-198), spec path for depth. Keep every other section untouched.

- [ ] **Step 3: linear-flow skill**

In its posting-mechanics section: the script now lives in the `orchestration` plugin (`${CLAUDE_PLUGIN_ROOT}/scripts/linear-post.py`); the traceability footer flags are required; the comment-style contract lives in `orchestration:ticket-owner` — reference both, duplicate neither. Keep all screenshot/attachment/status content as-is.

- [ ] **Step 4: Stub the v1 orchestrate skill and remove the old script**

Replace `.claude/skills/orchestrate/SKILL.md` body with a stub: frontmatter description "DEPRECATED (2026-08-27) — superseded by the `orchestration` plugin (dispatcher + Fable ticket-owners). Install it, then use `orchestration:orchestrate`."; body = the two install commands (GitHub URL + `claude plugin install orchestration@tski`), the adapter path, and the spec path. Delete this stub only after the plugin is confirmed installed on both machines (leave that as a line in the stub itself). Then `git rm scripts/linear-post.py`.

- [ ] **Step 5: Verify and commit**

Run: `grep -rn 'FOLLOWUPS\|ROADMAP' CLAUDE.md docs/working-preferences.md .claude/skills/` — expected: only archive pointers and the migration-record references. Then:

```bash
cd /home/scott/code/steelCompendium/workspace
git add CLAUDE.md docs/working-preferences.md .claude/skills/linear-flow .claude/skills/orchestrate
git rm scripts/linear-post.py
git commit -m "docs: orchestration v2 — plugin pointers, FOLLOWUPS/ROADMAP retirement, v1 skill stub"
git push origin main
```

(Push only after confirming `git fetch origin` shows no divergence; rebase first if it does.)

---

### Task 9: Shakedown handle

**Files:** none (Linear only)

- [ ] **Step 1: File the shakedown ticket**

One `save_issue`: team "Steel Compendium", state "Backlog", title "Workspace documentation prune (orchestration-v2 shakedown)", description: prune ARCHITECTURE.md, docs/git-workflow.md, scc docs, and sub-repo CLAUDE.mds for bloat per the router rules; run it as the first effort under the v2 workflow (Fable ticket-owner + dispatcher) to validate the pipeline end to end; watch Fable burn rate against the spec §9 fallback. Reference the spec path.
