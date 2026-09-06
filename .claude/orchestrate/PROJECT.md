# Steel Compendium — orchestration project adapter

The file `orchestration:orchestrate` (dispatcher) and `orchestration:ticket-owner` (Fable
owner) both read at session start. **Project facts and pointers only** — the universal
doctrine (roles, tiering, ledger discipline, review pipeline, stall-watching, comment style,
posting script) lives in those two skills and is not repeated here.

Main checkout: `/home/scott/code/steelCompendium/workspace`. Read the workspace `CLAUDE.md`
(rule 1: worktree isolation; the doc-routing table) before anything else.

---

## 1. Tracker

- **Linear**, team **Steel Compendium** — issue keys `SC-*`.
- **`.claude/skills/linear-flow/SKILL.md`** owns exactly two things here:
  **screenshot/attachment conventions** (Scott reviews visual work from images on the ticket
  — inline in comments, next to the text that explains them) and the **thin-ticket rule**.
- **Status and label semantics are the plugin's** — `orchestration:ticket-owner` §8 is
  authoritative (Todo / In Progress + `Needs Review` / Awaiting / Backlog / terminal). Where
  `linear-flow`'s copy of that table drifts, the plugin wins.
- Posting still goes through the plugin's `linear-post.py` with the mandatory
  `--model/--role/--session` flags — never a raw MCP comment call. `linear-flow`'s older
  upload instructions are superseded by the script; its screenshot *conventions* are not.

## 2. Worktrees

**Creation is the TICKET-OWNER's job.** The dispatcher assigns only the worktree *name*
(ticket slug, e.g. `sc198-scroll`) and serializes landings; it never creates or finishes a
worktree for an owner.

```bash
cd /home/scott/code/steelCompendium/workspace
just wt-new <name>          # → /home/scott/code/steelCompendium/worktrees/<name>
```

`wt-new` creates a superproject worktree at `../worktrees/<name>`, initialises every
submodule against the main checkout's object store, puts **every submodule on a branch named
`<name>`** (never detached), and makes a scratch `data/`.

**Concurrent `wt-new` by several owners is safe and needs no serialization** — it only adds
a worktree and aborts if the path already exists. Only *landings* serialize.

- **The main checkout is shared global state — implementation NEVER happens there**
  (workspace `CLAUDE.md` rule 1). `just deploy*` / `just sync` reset submodules to
  `origin/<tracked>` and silently discard uncommitted work sitting there. Every worker brief
  must give the worktree path and say to verify `pwd` before any write.
- **Worktree submodule clones have independent refs — `git fetch` inside the clone**, not in
  the main checkout. A rebase brief must carry the sha the owner wants, not "latest".
- **Teardown:** `just wt-rm <name>` (refuses on any dirt, then `rm -rf`s the tree). The
  ledger dir is gitignored — copy out anything worth keeping first (§6).
- `just wt-finish <name>` is a **landing** mechanic and belongs to the dispatcher via
  `land-stack` (§5). Owners report land-ready and stop.
- Mechanics and footguns of submodules-in-worktrees: **`docs/worktrees-and-submodules.md`**.

## 3. Tracked branches at landing

Every branch rebases onto its repo's tracked branch before landing:

| Repo | Tracked branch |
|---|---|
| `draw-steel-elements` | **`develop`** — SC-163 two-branch model: `develop` = mainline, `main` = released content only |
| `data-sdk-npm`, `data-gen` | **`v3`** (`main` is the deprecated v2 line) |
| `steel-etl`, `v2`, `compendium`, `statblock-adapter-gl-pages`, `steelCompendium.github.io`, the workspace superproject | **`main`** |

Policy owner: **`docs/git-workflow.md`** (remotes — one `origin` per repo, no fork remote;
the two-commit rule: commit inside the submodule, then commit the superproject pointer bump).

## 4. Gates

- **`draw-steel-elements` → the `dse-verify` skill** (`.claude/skills/dse-verify/SKILL.md`).
  It owns the whole battery in order (tsc, lint, jest, shots, freeze check, parity last,
  optional obsidian-shots), the devbox command shapes, the freeze/parity rules, and the
  **current expected numbers**. Briefs must point at it *and* state the numbers current at
  dispatch — read them out of the skill at dispatch time; they move (baseline line counts,
  declared-deferral set).
- **Everything else** gates through the sub-repo's own `CLAUDE.md` / `just` recipes. The dev
  environment is devbox everywhere — see footgun §8.1 before running anything.

## 5. Landing

- **`land-stack` skill** (`.claude/skills/land-stack/SKILL.md`) — owns the landing
  procedure: `just wt-finish` / `just wt-rm`, unstaged submodule pointer bumps, untracked
  scratch tripping the dirty check, stale worktree pins, fast-forward verification.
- Run it **from the main checkout only**, **one effort at a time**, by the **dispatcher**.
- The main checkout must be clean when landing starts; `.superpowers/` scratch is gitignored
  but stray generated files are not.

## 6. Ledgers, scratch, handoff

| What | Where |
|---|---|
| Effort ledger + reports (incl. `decisions.md`) | `.superpowers/sdd/<effort>/` in the **main checkout** |
| Handoff file | `docs/handoffs/HANDOFF.md` (tracked; the `creating-handoffs` skill owns its format) |
| Ledgers preserved at landing | `docs/superpowers/dse-overhaul/build-ledgers/` (tracked) |

- `.superpowers/` is **gitignored and machine-local**, and `.superpowers/sdd/` is **shared
  global state across every concurrent effort** — worktrees isolate code, not this dir.
  **Prefix every ledger, brief, report and diff with the effort ID.** A bare `progress.md`
  or `task-3-report.md` gets silently overwritten by whichever agent finishes last; this has
  already destroyed real build history (`docs/working-preferences.md` →
  "`.superpowers/sdd/` is shared global state").
- Anything worth keeping gets copied to the tracked `build-ledgers/` dir at landing — before
  `just wt-rm`.
- **Workspace-level doc edits made *during* orchestration are dispatcher-permitted
  bookkeeping in the main checkout** — routing-table updates per the `CLAUDE.md` table, skill
  and docs fixes, and `CHANGELOG.md` promotion at deploy. That is the whole permitted set
  alongside the handoff file and ledger snapshots; code changes still only ever happen in
  worktrees, by workers.

## 7. Freeze-delta flow (division of labor)

Transplanted verbatim from the v1 orchestrate skill:

> Agents NEVER touch the shared baseline; a branch that moves frozen print bytes ships
> `.superpowers/sdd/<effort>/rebaseline.txt` (ready-to-apply hash lines) + before/after
> crops. The orchestrator puts the sanction ask on the ticket, and only after Scott's
> explicit sanction applies the lines at landing — dated backup + dated record in
> `dse-verify`'s SKILL.md, every time.

**Role mapping under v2** (the only change): the **ticket-owner** puts the sanction ask on
the ticket and eyeballs the crops first; the **dispatcher** applies the sanctioned lines at
landing, with the dated backup (`freeze-baseline.sha256.pre-<effort>-bak`) and the dated
record appended to `dse-verify`'s SKILL.md. `dse-verify` owns the four baseline operations
(widening, sanctioned rebaseline, retirement, capture-artifact correction) and their worked
examples — read it before touching a hash line.

## 8. Project footguns

Each cost real time once. Every one belongs in the briefs it applies to.

1. **Devbox exit codes.** Go/Node/Python/just are **not on the system PATH** — activate
   devbox first, and `devbox run --` runs from the devbox project root ignoring your shell's
   `cd`, so always wrap: `devbox run -- bash -c 'cd <repo> && <cmd>'`. Devbox's `sh` wrapper
   **eats `$?` / `$PIPESTATUS`**, and piping a gate (`| tail`) eats failures outright.
   Run gates via wrapper script *files* that capture the code, or bare commands with output
   redirected to files.
2. **`npm ci` after any rebase that changed `package.json`'s obsidian version** — stale
   `node_modules` produce phantom `tsc` errors.
3. **A brief that names a WORKSPACE-level file sends the agent to the shared main
   checkout.** Twice on SC-169 (2026-08-18) an agent wrote `DESIGN.md` / `CHANGELOG.md` into
   `workspace/` instead of `worktrees/<env>/`. Briefs must say explicitly: *"the
   workspace-level files live in YOUR worktree's superproject at
   `/home/scott/code/steelCompendium/worktrees/<env>/DESIGN.md` — never under
   `/home/scott/code/steelCompendium/workspace/`."*
4. **A worktree's SUPERPROJECT pin goes stale and fails doc-reading tests** (bit twice,
   2026-08-23: SC-183 and SC-188 rebase rounds). `git rebase origin/develop` updates the
   *submodule* branch but leaves the worktree's superproject checkout wherever it was cut, so
   workspace-level docs there are frozen in the past. `token-coverage.test.ts` reads
   `docs/superpowers/dse-overhaul/D3-token-map.md` by candidate-path search and finds the
   stale copy first — after SC-185 landed 12 new `--dse-fs-*` rows, every older worktree
   reported a phantom red. **Diagnose by comparing the two copies** (`grep -c` the new token
   in the worktree's copy vs the main checkout's) before believing the failure, and clear it
   with the test's own `DSE_TOKEN_MAP_PATH` override pointed at the main checkout. Not a code
   defect and never a reason to edit the branch.
5. **`git checkout -- .` in `v2` DESTROYS hand-authored source** (SC-90, 2026-08-23 — it cost
   that agent its JS + CSS edits once). `v2/docs/` is mostly generated, but
   `docs/javascripts/` and `docs/stylesheets/` are **hand-authored and tracked** and live
   *inside* that tree, so the reflexive "clean the generated dirt" recipe reverts real work.
   Safe form, and the one briefs must specify:
   `git clean -fdq docs site && git checkout -- docs/Browse docs/Read docs/scc`
   plus the two files `gen --all` writes *outside* those subtrees — `v2/docs/pins.md` and
   `steelCompendium.github.io/docs/api/v1/{index,scc}.json` — which that form leaves dirty
   (found on SC-179, 2026-09-06): `git -C v2 checkout -- docs/pins.md` and
   `git -C steelCompendium.github.io checkout -- docs/api/v1/`.
   (restore only the genuinely generated subtrees; never blanket-checkout `docs/`).
6. **The freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`) is machine-local** —
   screenshot bytes are not portable across machines. On a new machine, regenerate it from a
   clean tracked-branch checkout before trusting any freeze gate; procedure and the current
   line count are in `dse-verify`.

**Provenance for two plugin-side footguns.** The plugin states these rules without ticket
keys (they generalise); the evidence is this project's, and lives here:

- **Parked-on-a-background-job** (`orchestration:orchestrate` §5, `ticket-owner` §4.1) — three
  occurrences in one day, **2026-08-23: SC-183, SC-189, and the SC-187 rebase round.**
- **Scratchpad stale wait-loop** (`ticket-owner` §4 brief footguns) — **SC-160 fix round,
  2026-08-17**: an agent keyed a wait-loop on a scratch log's contents, matched a stale log
  from a different branch, and read a false `FREEZE VIOLATED`.

## 9. Scott's standing rules

**`docs/working-preferences.md` is required reading** — it owns Scott's collaboration
conventions. The three that bite orchestration hardest:

- **Scott is colorblind** (2026-08-09). Never let hue be the only channel for a state, and
  **name the colors in prose** in every ask and evidence caption. Blue-vs-purple must never
  carry meaning alone.
- **Deploys are Scott's call.** Never run `just deploy*` unprompted; landing source to `main`
  is a separate decision from deploying. Prep his actions (npm publish, `gh release create`)
  down to a queued 5-minute copy-paste and hand them over.
- **⛔ NEVER create a tag or release on `draw-steel-elements`** (standing order,
  2026-07-31) — no tags, not even RC tags. This is scar tissue: `6.0.0-rc1` auto-updated
  ~120 real users and got the plugin delisted from the community store. Tagging is Scott's
  action alone; a beta ships via BRAT, not a tag.

## 10. New-machine bootstrap

Everything that matters is in the repo; a fresh machine needs:

1. `git clone --recurse-submodules git@github.com:SteelCompendium/workspace.git` (or
   `just bootstrap` after a plain clone), plus **devbox** installed.
2. Claude Code, logged in to the account with Fable + Opus/Sonnet access.
3. The **orchestration plugin** installed (it carries `orchestrate`, `ticket-owner`, and
   `linear-post.py`) and `LINEAR_API_KEY` available — env var, or the first line of
   `~/.config/linear/api_key`.
4. The **Linear MCP server** connected — it is user-level config, not in the repo; without it
   the gating loop is blind. Verify with a `list_issues` call.
5. Regenerate the machine-local freeze baseline from a verified-clean tracked-branch checkout
   (`npm run shots`, then hash the frozen set) — `dse-verify` has the procedure and the
   current line count to sanity-check against (§8.6).
6. Create a **Linear personal API key** and save it as the first line of
   `~/.config/linear/api_key` (mode 600), or export `LINEAR_API_KEY` — the posting script
   requires this; MCP auth does NOT cover the script (step 3 above restates the requirement,
   this step is what actually creates the key on a fresh machine).
7. Start dispatcher sessions on **Sonnet** (`/model sonnet`) at the **default effort** —
   the skill asserts the model but cannot set it. Don't lower the effort: landings are
   where a hurried dispatcher does damage, and on plugin **0.2.0+** the session's level no
   longer reaches the owners anyway (their agent definitions carry their own).
