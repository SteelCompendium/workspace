# SC-488 r0 — design survey (reviewer, read + probe, NO source edits)

You are a design/survey worker for ticket SC-488. Your final text goes to the ticket-owner, not a human: raw facts, no prose padding. **Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

## 1. Context loading

- Ledger: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-decisions.md` — read it first (spec quoted verbatim there; overlapping tickets listed as OUT OF SCOPE).
- Prior art: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc483-form-save-defaults/sc483-decisions.md` (the SC-483 Save-strip rule this ticket must stay compatible with).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc488-form-real-default` — plugin at `.../draw-steel-elements`, branch `sc488-form-real-default`, at dse `develop` `424f47b`. Run `git -C /home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements fetch origin` and confirm `origin/develop` is still `424f47b`; report if it moved (do not rebase — you edit nothing).
- Read `/home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements/AGENTS.md` if present.

## 2. The task — survey, then recommend

You make **no source edits and no commits**. Scratch tests/probes go in your private scratch folder (below), never in the worktree's `src/` or `test/` — if you must place a probe test inside the worktree to run it under jest, delete it (by exact path) before you finish and confirm `git -C <plugin> status --porcelain` is empty.

Answer, with file:line:

1. **How the form builds a select today.** `src/authoring/FormModal.ts` `select` case: where the `enum[0]` fallback is, where the value is seeded into the working data, how validation and the live preview consume it, and the SC-483 strip-at-Save logic (absent + untouched select is dropped; a REQUIRED select is never stripped). Where do the field definitions come from (JSON schema per element? a widget map?).
2. **Every built-in select field, not just the three in the ticket.** For each element the form can open, list every select (enum) field: its `enum` list, `enum[0]`, whether the schema already has a `default`, and the value the element actually uses when the key is absent (read its parser/model; cite file:line). Classify each: (a) enum[0] already equals the effective default — no bug; (b) a different static default (like skills `style` -> `ledger`); (c) derived from other fields (like roll `mode` from the expression); (d) no value at all (like roll `difficulty`).
3. **Design options** for "an absent select shows the value the block will actually use, and the preview matches the saved result". At minimum weigh:
   - A. schema `default` keyword on each field, used as the display fallback (covers class b; what about c and d?);
   - B. an explicit leading option that represents "absent" (e.g. labelled "Automatic (from the roll)" / "None" / "Default (ledger)"), which maps to the key being absent in working data, preview and Save;
   - C. a per-element hook that computes the effective value from the current data (covers c — but the derived value changes when the user edits the expression; what does the dropdown show then?);
   - any combination or better option you find.
   For each: what the dropdown shows on open for each class, what validation sees, what the preview renders, what Save writes (untouched, changed, changed back), how it interacts with the SC-483 strip rule and the required-select guard, whether Obsidian's `DropdownComponent` handles it (empty-string option value etc.), and test surface (jest in `test/`, e2e manifest/coverage implications if a new control id appears).
4. **Recommendation**: one design, with the exact behaviour per class, and the list of files it would touch. Flag anything that is a genuine taste call for Scott (e.g. option label wording) vs. something the ticket's Expected already decides.

Keep the survey bounded: this is one file plus element schemas/parsers. Do not run the full battery. Targeted jest (e.g. `test/**/formModal*.test.ts`) is fine to confirm current behaviour.

## 3. Commands and footguns (project-specific — obey all)

- Devbox: Node is not on PATH. Use `devbox run -c /home/scott/code/steelCompendium/worktrees/sc488-form-real-default/draw-steel-elements -- <cmd>`; for anything needing a cwd, write a small script file into your scratch folder and run `devbox run -c <plugin abs path> -- bash <script abs path>` (script does its own `cd`). **Never a compound `cd X && …` in a Bash call.** Exit codes: record them from inside the script file (devbox's sh wrapper eats `$?` in `bash -c '…; echo $?'`).
- Every git command as `git -C <absolute path> …`, never `cd X; git …`.
- Scratch: the session scratchpad `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad` is shared by every agent. Make a private subfolder `sc488-r0-survey-<6 random chars>/` and put every script/log inside it with unique names. Create files with the Write tool, not heredocs.
- No glob `rm` ever; delete only exact paths you created. Never touch `.superpowers/` outside `.superpowers/sdd/sc488-form-real-default/`.
- Never `pkill`/`killall` by pattern; kill only a PID whose `readlink /proc/<pid>/cwd` is inside your worktree.
- Run every command as one blocking foreground call; no `run_in_background`, no Monitor. Redirect long output to a file in your scratch folder and read the summary.
- The main checkout's dse dirt (`demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, not foreign changes; ignore it. You work in the worktree anyway.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc488-form-real-default/sc488-r0-survey-report.md`. It must open with a **≤10-line executive summary** (the recommendation, the count of affected selects per class, any taste call). If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Final text to the ticket-owner: verdict/recommendation in ≤10 lines, the report path, and the path of any other artifact you produced. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the dispatcher, not me. If you need input mid-task, end your turn with `STATUS: NEEDS_CONTEXT` and the question; I will resume you. If you ever send a message anyway, its first word must be `SC-488:`.

Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions. The 600s stream watchdog kills silent agents: redirect long-running output to a file.
