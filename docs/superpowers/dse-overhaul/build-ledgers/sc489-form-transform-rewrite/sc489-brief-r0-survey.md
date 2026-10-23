# SC-489 r0 — design survey (reviewer, read + probe, NO source edits)

You are a design/survey worker for ticket SC-489. Your final text goes to the ticket-owner, not a human: raw facts, no prose padding. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-decisions.md` — read it first (spec quoted verbatim; overlapping tickets SC-493/SC-494 are OUT OF SCOPE; the owner's two suspected traps are listed).
- Prior art that just changed the same file: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc488-form-real-default-ledger.md` (section "Design" D1–D9 is the current select behaviour you must keep) and `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-r1-review-report.md` (INFO-3 = this bug).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite` — plugin at `.../draw-steel-elements`, branch `sc489-form-transform-rewrite`, at dse `develop` `0dff966`. Run `git -C /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/draw-steel-elements fetch origin` and confirm `origin/develop` is still `0dff966`; report if it moved (do not rebase — you edit nothing).
- Read `/home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/draw-steel-elements/AGENTS.md` if present.
- `node_modules` may be missing in the worktree; if jest needs it, run `npm ci` there (via devbox, below) — it is gitignored.

## 2. The task — survey, then recommend

The spec (verbatim from the ledger):

> **Expected:** Save writes only what the user changed. Validation may normalise a copy for checking, but it must not rewrite the values that get saved.

You make **no source edits and no commits**. Scratch tests/probes go in your private scratch folder (below); if you must place a probe test inside the worktree to run it under jest, delete it by exact path before you finish and confirm `git -C <plugin> status --porcelain` is empty.

Answer, with file:line:

1. **The mutation path.** Where exactly does `transform` mutate (`src/authoring/FormModal.ts` `revalidate()` -> the validation service -> ajv-keywords). Does anything else in FormModal hand `this.working` (or parts of it — arrays are shared by reference with `{...spread}` copies) to validation or to `parse()` in a way that mutates it? Does the real render pipeline (ElementPipeline / the block's normal render) also validate-with-transform BEFORE `parse()` — i.e. does a real `ds-skills` block with `style: Chips` and `Climb` render as chips + the climb skill because the pipeline lowercases first, or because the parser is case-insensitive itself?
2. **Census of every `transform` in every registered element's schema** (owner found: SkillsSchema.yaml `style`, `skills[]` items, custom skill `skill_group`; StaminaBarSchema.yaml `style` — confirm there are no others, incl. nested / `$ref` / allOf). For each: which form control renders it (select / text / YAML text for arrays/objects), and what that element's `parse()` (and `serialize()` where present — stamina-bar has one) does with an UN-normalised value (`Chips`, ` Climb `, `Sheet`). Cite file:line.
3. **Reproduce in jest at `0dff966`** the ticket's three examples (untouched skills `Climb`; skills `style: Chips` with only "Only show selected" toggled; stamina `style: Sheet` untouched) and report the exact Save text for each.
4. **Design options** for the Expected line. At minimum weigh:
   - A. validate a deep copy (`structuredClone`) so `working` is never mutated; Save writes `working`.
   - B. A + use the transformed copy for the things that must mirror the real render (live preview, SC-488 `Default (…)` labels), while Save writes the raw `working`.
   - C. any per-field / diff-based approach you find better (e.g. Save keeps the source text of untouched keys).
   For each, walk these cases and state what the dropdown/field SHOWS on open, what validation sees, what the preview renders, and what Save writes: (i) untouched skills `Climb`; (ii) `style: Chips` + toggle another field; (iii) `style: Chips` and the user picks `list`; (iv) `style: Chips` and the user picks `Default (…)` (SC-488 sentinel); (v) stamina `style: Sheet` untouched (serialize path!); (vi) stamina `style: Sheet` and the user changes max stamina; (vii) the user TYPES ` Climb ` into the skills field (does Save keep what they typed?); (viii) a required select (none built-in; SC-488 D6) with an un-normalised value. Specifically: how does the select show an option when the stored value is `Chips` but the options are lowercase (the owner's trap 1)? And does a serialize element (stamina-bar) keep `Sheet` at all (trap 2) — if not, what is the minimal fix that does not drift into SC-494 (`collapsed:` dropped on Save, OUT OF SCOPE)?
   - Also state whether the SC-488 `Default (…)` label derivation and the SC-488 LOW-1 source-order logic (`setKeyInSourceOrder`) are affected.
5. **Recommendation**: one design, with the behaviour per case above, the list of files it touches, and the jest test list. Say whether a lifecycle scenario (id G-S34) or an e2e change is warranted (FormModal has no `data-dse-control` today). Flag anything that is a genuine taste call for Scott (e.g. if a selected option ends up showing `chips` while Save keeps `Chips`) vs. something the ticket's Expected already decides.

Keep the survey bounded: FormModal.ts, the validation service, the two schemas, the skills and stamina-bar parsers/serializers, and the render pipeline's validation call. Do not run the full battery. Targeted jest (e.g. `test/**/formModal*.test.ts`) is fine.

## 3. Commands and footguns (project-specific — obey all)

- Devbox: Node is not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc489-form-transform-rewrite/draw-steel-elements -- <cmd>`; for anything needing a cwd, write a small script file into your scratch folder and run `devbox run -c <plugin abs path> -- bash <script abs path>` (the script does its own `cd`). **Never a compound `cd X && …` in a Bash call.** Record exit codes from inside the script file (devbox's sh wrapper eats `$?` in `bash -c '…; echo $?'`).
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Make a private subfolder `sc489-r0-survey-<6 random chars>/` and put every script/log inside it with unique names. Create files with the Write tool, not heredocs.
- No glob `rm` ever; delete only exact paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc489-form-transform-rewrite/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Run every command as one blocking foreground call; no `run_in_background`, no Monitor. Redirect long output to a file in your scratch folder and read the summary.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it. You work in the worktree anyway.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc489-form-transform-rewrite/sc489-r0-survey-report.md`. It must open with a **≤10-line executive summary** (the recommendation, the transform census count, the answer to both traps, any taste call). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: verdict/recommendation in ≤10 lines, the report path, and the path of any other artifact you produced. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-489:`.

Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions. The 600s stream watchdog kills silent agents: redirect long-running output to a file.
