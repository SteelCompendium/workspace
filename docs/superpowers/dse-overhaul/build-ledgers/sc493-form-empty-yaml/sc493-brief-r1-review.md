# SC-493 r1 — independent review: emptied raw-YAML box in the block edit form

## 1. Context

- Read first: the ledger `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/decisions.md` and the implementer's report `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/sc493-r1-impl-report.md` (summary first). Background: `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc482-wrapper-default-keys/sc482-r2-rereview-report.md` (MEDIUM-1, the empty-body probe that found this).
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc493-form-empty-yaml` (branch `sc493-form-empty-yaml`). Plugin: `.../draw-steel-elements`. Review head: dse `1175a3b` on `c98bd82`; superproject `c7086e5` (on origin/main e4f81d3). Do not commit to the branch; leave `git status --short` empty at the end (plugin and superproject). For mutants, edit, run, then `git -C <plugin> checkout -- <file>`.
- Workers never call the tracker (Linear).
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — ignore it.

## 2. Task

Review the branch delta (`git -C <plugin> log --oneline c98bd82..HEAD`, `git diff c98bd82`) against ledger D1–D5 (quoted):

> - D1 (2026-10-23). Fix shape: the raw-YAML editor checks and previews the SAME data the pipeline will hand the element after Save. Today `FormModal.revalidate()` (src/authoring/FormModal.ts:314) and `renderPreview()` (:366) feed `parseYaml(this.rawText) ?? {}` to `def.parse`, while the pipeline (src/framework/pipeline.ts:363) feeds `parseYaml(source)` with no `?? {}`. So an empty box passes the form's check as `{}` but renders as null. Fix: drop the `{}` substitution so the form's check and preview see what the pipeline sees (ideally one shared helper, so they cannot drift again). Consequence: for counter / negotiation / party / encounter an emptied box shows the element's own error and Save is disabled; for montage / project (which accept an empty body) Save of an empty box stays allowed and writes an empty body, which renders.
>   Rejected alternative: writing `{}` on Save for an empty box. It writes a byte the user never typed (against the SC-483 rule "write no byte the user never typed") and turns a deliberate clear into a default block silently.
>   Status: owner call, not a Scott ask (authoring controls are experimental; the ticket's own "Expected" lists this option first). Reported to Scott as FYI in the land-ready comment.
> - D2. Scope: src/authoring/FormModal.ts (and a shared helper if one is extracted) + tests. Off limits: src/framework/host/, element parse/serialize code. SC-494 (stamina bar Save drops `collapsed:`) is a separate ticket and waits — do not touch it.
> - D3. Tests: red commit first; jest through the real pipeline + host (the SC-482 r2 re-review probe pattern: ReadingModeBlockHost). Lifecycle scenario only if jest cannot reach the real path; if one is added it is G-S37.
> - D4. CHANGELOG bullet under `## Unreleased` in the worktree superproject.
> - D5 (owner, 2026-10-23). The counter/negotiation messages are JavaScript internals and say nothing a user can act on. Fold before review: in FormModal (generic, no element code — D2 stands), when the box reads as no data (null/undefined after readBlockBody) and def.parse throws, show `This block can't be empty. Add at least one setting, or press Cancel.` instead of the element's message. Any other parse error keeps the element's own message. Save stays disabled. Tests: the four elements show that text for empty / whitespace-only / comment-only; a non-empty invalid box still shows the element's message.

Execute and probe, do not only read:
1. Re-run the red test(s) against `c98bd82`'s FormModal (scratch `git worktree add` at an absolute path in your private scratch dir, or a temporary revert you restore) — they must fail there and pass at HEAD.
2. Mutants: put back `?? {}` in the check, in the preview, each separately; any other line the fix depends on. Each must turn a test red.
3. Probe the pipeline mirror: compare what the form's check feeds `def.parse` with what `src/framework/pipeline.ts` feeds it, for raw text: `''`, whitespace-only, `# comment` only, `prefs:` only, a `^block-id` line, `---`, a list body, a scalar body, invalid YAML. Table: form verdict (Save enabled/disabled + message) vs real render (ok / error card) after Save, for counter and montage at least. Any row where Save is enabled but the render is an error card is a finding.
4. Schema'd elements (e.g. ds-skills, stamina-bar) unaffected.
4b. The fix moved the pipeline's parse + rescue ladder out of `src/framework/pipeline.ts` into the new `src/framework/blockBody.ts` (`readBlockBody`). That is a change to the render path of EVERY block. Prove the extraction is behaviour-preserving: a differential check (temporary test, deleted after) of the old ladder at c98bd82 vs `readBlockBody` over a wide input set (every fixture/demo-vault block body you can collect, plus the probe list in item 3, plus collapse-key / `@ref` / raw-body rescue cases) — data, bodySource and any warnings identical. Also check no console warning now fires per keystroke in the form.
4c. D5's message: shown only when the box reads as no data and parse throws; a non-empty invalid box keeps the element's message; montage/project empty Save still allowed.
5. Real Obsidian: take two screenshots for Scott through the real plugin build (the lifecycle/e2e harness machinery, or `obsidian-shots` style tooling — see dse-verify): (a) the edit form on a `ds-counter` with the YAML box emptied, showing the error text and the Save button disabled; (b) the same on a `ds-montage`, Save enabled, and the note after Save rendering the montage (no error card). Name in the report what each image shows in words (no color-only descriptions — Scott is colorblind).
6. Run the full battery once at HEAD (dse-verify): expected tsc/lint clean · jest 5902 / 1 / 242 of 243 (as A measured) · lifecycle 34/34 (35/35 if G-S37 was added) · e2e `114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24. Known load flake: `test/dom/elements/initiative-default-keys.test.ts:459` (SC-506).

Findings by severity (BLOCKER/HIGH/MEDIUM/LOW/INFO) with file:line, a failure scenario, and a prescribed fix. Verdict LAND-READY or NOT.

## 3. Command rules (each has hung or broken a worker before)

- Absolute paths; `git -C <abs path>` for every git command; never `cd X && …` in a compound command.
- devbox: `devbox run -c <plugin abs path> -- <cmd>`. Record exit codes by running a script FILE through devbox (`devbox run -c <plugin> -- bash <script>`; script redirects to a log and writes `echo rc=$? > <rcfile>`). Read each gate's own summary line.
- One blocking gate per Bash call, foreground, `timeout` 600000. No `run_in_background`, no Monitor, no background jobs. Split lifecycle / e2e / shots into separate calls. Redirect long output to files.
- Private scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc493-r1-review-<your agent id>/`; unique names for every script/log/rc; write scratch files with the Write tool, not heredocs.
- No `rm` with a shell-variable or glob target, ever. Never `rm -rf` under `/tmp` by pattern or anything under `.superpowers/` except your own files.
- Never `pkill`/`killall` by pattern; kill only PIDs whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- Lifecycle: own port, e.g. `DSE_LIFECYCLE_PORT=9297`.
- Never key a wait on a scratch filename or its contents. Never tag, deploy, push, or `wt-finish`.

## 4. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc493-form-empty-yaml/sc493-r1-review-report.md`, opening with a ≤10-line executive summary. Screenshots into the ledger dir as `sc493-r1-shot-counter.png`, `sc493-r1-shot-montage.png` (and `sc493-r1-shot-montage-saved.png` if separate). If the report write is blocked, return it inline.

## 5. Return contract

Final text goes to the ticket-owner, not a human: raw facts — verdict, findings by severity with file:line, mutant results, the probe table, gate numbers, `git status --short` at end, and the filesystem path of every artifact (report, screenshots, logs). No prose.

You cannot `SendMessage` me; `to: 'main'` reaches the dispatcher. If you need input, end with STATUS: NEEDS_CONTEXT and the question. If you message anyway, first word `SC-493:`.
