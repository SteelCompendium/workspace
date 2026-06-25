# Add "Always Round Down" to the General Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Heroes-book "Always Round Down" rule appear in the v2 site's General rule section (`Browse/rule/general/`) by classifying it as a `rule.general` term.

**Architecture:** The site's rule glossary is generated, not hand-authored. `RuleParser` (`steel-etl/internal/content/rule.go`) mints a `rule.<group>/<id>` SCC code for every Heroes-book heading carrying an `<!-- @type: rule | @group: <g> | @id: <id> -->` annotation comment. "Always Round Down" (`steel-etl/input/heroes/Draw Steel Heroes.md:818`) is the only sibling in The Basics chapter with **no** such annotation, so it is never classified and never reaches `Browse/rule/general/`. The fix is a single annotation line; the parser, schemas, and tests already support general-group rules unchanged. After the source edit, the pipeline regenerates the registry and the site's rule index pages automatically.

**Tech Stack:** Go (steel-etl ETL/site builder), annotated Markdown source, devbox toolchain, `just` workspace recipes (worktrees + deploy), MkDocs Material (v2 site output).

## Global Constraints

- **Edit in an isolated worktree, never the shared main checkout.** Use `just wt-new <name>` / `just wt-finish <name>` (workspace CLAUDE.md rule 1). The main checkout is reserved for `just sync` / `just deploy*`.
- **Never hand-edit generated output** (`data/data-unified/`, `v2/docs/Browse/`, `v2/docs/Read/`, `v2/docs/scc/`). Content changes go only in `steel-etl/input/heroes/Draw Steel Heroes.md`. The pipeline overwrites generated files on every build.
- **Toolchain is not on PATH** — prefix every Go/`steel-etl`/`mkdocs` command with `devbox run --` (e.g. `devbox run -- go run ./cmd/steel-etl …`).
- **SCC book segment is fixed.** Do **not** touch the `book:` / `printing:` frontmatter; the new code must mint under the existing `mcdm.heroes.v1` source segment.
- **Registry is unfrozen** (`steel-etl/pipeline.yaml` → `classification.freeze: false`), so adding one new leaf code is allowed and does not disturb existing codes.
- **Annotation format is exact** — match the sibling rules verbatim, single spaces around each `|`: `<!-- @type: rule | @group: general | @id: always-round-down -->`.
- **The new code is `mcdm.heroes.v1/rule.general/always-round-down`** — every verification step below greps for exactly this string.

---

### Task 1: Annotate "Always Round Down" as a general rule

This is the entire content change. The remaining tasks verify and ship it. Because there is no Go code or unit test to add (the parser already classifies general-group rules — see `steel-etl/internal/content/rule_test.go`), this task's "test" is the pipeline's own classifier: we first prove the code is **absent**, make the one-line edit, then prove the code is now **minted** and lands in the General rule section.

**Files:**
- Modify: `steel-etl/input/heroes/Draw Steel Heroes.md:818` (insert one annotation line directly above the `### Always Round Down` heading)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a new SCC registry code `mcdm.heroes.v1/rule.general/always-round-down`, and a generated rule page that the site builder routes into `Browse/rule/general/`. Later tasks rely on this exact code string.

- [ ] **Step 1: Create the isolated worktree**

Run from the workspace root (`/home/vexa/code/steel_compendium/workspace`):

```bash
just wt-new always-round-down
cd ../worktrees/always-round-down
```

Expected: a new worktree at `../worktrees/always-round-down` with every submodule on branch `always-round-down`. All subsequent steps run from inside this worktree.

- [ ] **Step 2: Establish the failing check — confirm the code does NOT exist yet**

Run from the worktree's `steel-etl/` directory:

```bash
cd steel-etl
devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml
devbox run -- go run ./cmd/steel-etl classify --config pipeline.yaml | grep -c 'rule.general/always-round-down'
```

Expected: the `grep -c` prints `0` (the code is not minted). This is the "red" state.

- [ ] **Step 3: Make the minimal edit — add the annotation line**

In `steel-etl/input/heroes/Draw Steel Heroes.md`, insert a single annotation comment line immediately above the `### Always Round Down` heading (currently at line 818). The two lines must end up reading exactly:

```markdown
<!-- @type: rule | @group: general | @id: always-round-down -->
### Always Round Down
```

Do not change the heading text or the rule body beneath it. Leave the preceding `### Game of Exceptions` section untouched (it is out of scope for this plan — see the note at the end).

- [ ] **Step 4: Verify the code is now minted (diff against the registry)**

Run from `steel-etl/`:

```bash
devbox run -- go run ./cmd/steel-etl classify --config pipeline.yaml --diff | grep 'always-round-down'
```

Expected: one line showing the new code added, e.g. `+ mcdm.heroes.v1/rule.general/always-round-down`. (`--diff` compares against the committed `classification.json` registry baseline.)

- [ ] **Step 5: Regenerate and confirm the code mints clean**

Run from `steel-etl/`:

```bash
devbox run -- go run ./cmd/steel-etl gen --config pipeline.yaml
devbox run -- go run ./cmd/steel-etl classify --config pipeline.yaml | grep -c 'rule.general/always-round-down'
```

Expected: the `grep -c` now prints `1`. This is the "green" state — the rule is classified.

- [ ] **Step 6: Confirm no unrelated SCC codes changed**

Run from `steel-etl/`:

```bash
devbox run -- go run ./cmd/steel-etl validate --config pipeline.yaml --scc-stable
```

Expected: validation passes reporting the **only** difference is the single new `always-round-down` code (one added code, zero changed/removed). If any existing code is reported changed or removed, STOP — the edit touched more than intended; revert and re-do Step 3.

- [ ] **Step 7: Run the steel-etl test suite (guard against regressions)**

Run from `steel-etl/`:

```bash
devbox run -- go test ./...
```

Expected: PASS. (No test was added — the change is content-only and `rule_test.go` already covers general-group classification. This step confirms the edit broke nothing.)

- [ ] **Step 8: Commit the source change inside the steel-etl submodule**

Run from `steel-etl/`:

```bash
git add "input/heroes/Draw Steel Heroes.md"
git commit -m "content(heroes): classify Always Round Down as a general rule"
```

Expected: one commit on the `always-round-down` branch in the `steel-etl` submodule. (`data/` and `classification.json` are gitignored build output — only the `.md` source is staged.)

---

### Task 2: Verify the rule surfaces in the General section, then land & deploy

**Files:**
- No source edits. Generated/built output only: `v2/docs/Browse/rule/general/` (built locally for verification; rebuilt + committed by the deploy recipe), plus the superproject pointer bump landed by `just wt-finish`.

**Interfaces:**
- Consumes: the `mcdm.heroes.v1/rule.general/always-round-down` code and `steel-etl` source commit from Task 1.
- Produces: the live `Browse/rule/general/` page including "Always Round Down", landed on `origin/main` and deployed.

- [ ] **Step 1: Build the v2 site locally and confirm the rule lands in the General section**

Run from the worktree root (`../worktrees/always-round-down`), after the Task 1 `gen` has produced output:

```bash
devbox run -- go run ./steel-etl/cmd/steel-etl site --config v2/site.yaml
grep -rl 'Always Round Down' v2/docs/Browse/rule/general/
```

Expected: at least one path under `v2/docs/Browse/rule/general/` is printed (the General rule index and/or the rule's own page), confirming the rule routed into the **General** group — not some other `rule.<group>`. If nothing prints, STOP and recheck the `@group: general` value in Task 1, Step 3.

- [ ] **Step 2: Discard the locally-built generated output before landing**

The local `v2/docs/Browse/…` and `data/…` were rebuilt only to verify; they are generated and must not be committed by hand (the deploy recipe regenerates and commits them). Run from the worktree root:

```bash
git -C v2 checkout -- docs/ 2>/dev/null || true
git -C v2 status --short
```

Expected: `v2` working tree shows no staged generated content. (Only the `steel-etl` submodule carries the real change, committed in Task 1.)

- [ ] **Step 3: Land the change (push steel-etl + superproject pointer)**

Run from the worktree root:

```bash
just wt-finish always-round-down
```

Expected: `wt-finish` pushes the `steel-etl` content commit to `origin/main` and commits+pushes the superproject pointer bump. The `always-round-down` branch's content is now on `origin/main`.

- [ ] **Step 4: Sync the shared main checkout to the landed pointer**

Run from the main checkout (`/home/vexa/code/steel_compendium/workspace`):

```bash
git fetch origin && git rebase origin/main
just sync
git status
```

Expected: submodules move to their newly-pinned commits; `git status` is clean.

- [ ] **Step 5: Deploy the v2 site**

Run from the main checkout:

```bash
just deploy-v2
```

Expected: the recipe runs the full pipeline (`gen --all`) + `site` build and **itself commits+pushes** the regenerated `v2/docs/` and `data/`. Do not hand-commit any generated output.

- [ ] **Step 6: Confirm the deployed page**

After the deploy completes and the site publishes, verify the live page lists the rule:

```
https://steelcompendium.io/v2/Browse/rule/general/
```

Expected: "Always Round Down" now appears in the General rule listing, linking to its rule page. (Source: `https://steelcompendium.io/v2/Read/heroes/the-basics/#always-round-down`.)

---

### Task 3: Record the registry change in the SCC log

Adding a registry code is a workspace-level SCC change; the routing table in workspace `CLAUDE.md` requires a dated log entry. This is documentation only.

**Files:**
- Modify: `docs/scc-log.md` (append a dated entry)

**Interfaces:**
- Consumes: the code `mcdm.heroes.v1/rule.general/always-round-down` from Task 1.
- Produces: nothing downstream.

- [ ] **Step 1: Read the top of the SCC log to match its entry format**

Run from the workspace root:

```bash
git fetch origin && git rebase origin/main
```

Then read `docs/scc-log.md` and note the heading/date style of the most recent entry.

- [ ] **Step 2: Append the dated entry**

Add a new dated entry at the top of the log's entry list (matching the existing format), recording: on 2026-06-25, minted `mcdm.heroes.v1/rule.general/always-round-down` — classified the Heroes "Always Round Down" rule (The Basics chapter) by adding its `@type: rule | @group: general` annotation; previously unannotated, so it was absent from `Browse/rule/general/`. One added code, no existing codes changed (`validate --scc-stable` clean).

- [ ] **Step 3: Commit and push the log update**

Run from the workspace root (branch off `origin/main` first if the workspace forbids direct main commits — follow `docs/git-workflow.md`):

```bash
git add docs/scc-log.md
git commit -m "docs(scc): log Always Round Down general-rule code"
git push origin HEAD
```

Expected: the log entry is pushed. If a PR is required by the workflow, open one per `docs/git-workflow.md`.

---

## Out of scope (note for reviewer)

The sibling `### Game of Exceptions` heading (`Draw Steel Heroes.md:812`) is *also* unannotated and is arguably a general rule. This plan deliberately changes **only** "Always Round Down" per the request. If "Game of Exceptions" should also be added, capture it as a separate `FOLLOWUPS.md` item rather than expanding this plan.

## Self-Review

- **Spec coverage:** The request — surface "Always Round Down" in `Browse/rule/general/` — is implemented by Task 1 (annotation → classification) and verified end-to-end (Task 1 Step 5 mints the code; Task 2 Step 1 confirms it routes into the General group; Task 2 Step 6 confirms it live). Task 3 satisfies the workspace doc-sync requirement for registry changes.
- **Placeholder scan:** No TBD/TODO/"handle edge cases" placeholders. Every command is concrete; the one source edit shows the exact two resulting lines.
- **Type/identity consistency:** The code string `mcdm.heroes.v1/rule.general/always-round-down` and the annotation `<!-- @type: rule | @group: general | @id: always-round-down -->` are used identically across all tasks. The `@group: general` value matches every existing general-rule sibling (e.g. `creature`, `supernatural`, `npc`).
