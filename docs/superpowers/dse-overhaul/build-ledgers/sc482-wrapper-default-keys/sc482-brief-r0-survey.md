# SC-482 r0 survey brief — which persisted blocks write default keys the user never wrote

READ-ONLY survey. You change no tracked file and make no commit. Bounded: answer the questions in section 2, nothing broader.

## 1. Context loading

- Read FIRST: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/decisions.md` (the ledger — authoritative).
- Then SC-466's fix (landed): `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc466-stamina-bar-defaults/sc466-r1-impl-report.md` (executive summary + root-cause + writers sections only) and the code it describes in `src/elements/stamina-bar/model.ts`.
- Worktree: `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys`. Plugin repo: `/home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements`, branch `sc482-wrapper-default-keys`, at `08206e3` (= origin/develop). `git -C <plugin repo> fetch origin` and confirm origin/develop is still `08206e3`; if not, say so (do not rebase — read-only).
- Read `draw-steel-elements/AGENTS.md`.
- **Workers never call the tracker** (Linear) — not to read history, not to post.
- The main checkout's dse dirt (modified `demo-vault/Welcome.md`, untracked `compendium-manifest.json` / `demo-vault/*.md`) is Scott's live vault — expected, ignore it.
- SC-483 (block edit form Save, `src/authoring/FormModal.ts`) is being fixed concurrently by another effort. Do NOT analyse FormModal's own default-seeding (that is SC-483); you may note in one line if a block's only write path IS FormModal.

## 2. Questions

1. **Inventory.** List every element (block type, incl. legacy aliases) that the plugin WRITES BACK into a user's note (any code path that serializes a parsed model and replaces the fence body: interactive controls, modals, toasts, collapse toggles, chrome, migrations). For each: the serialize function (file:line), the writer entry points (file:line), and whether it is built on `ComponentWrapper` / has `collapseKeysOwnedByModel`.
2. **Leak per element.** For each element in (1): feed a minimal source (only its content keys) through the real parse -> one representative write -> serialize path and record which keys appear that the source did not have, with their values. MEASURE this — do not infer from reading. Allowed mechanism: a temporary jest test file under `test/` in the worktree that you DELETE before returning (`git -C <plugin repo> status --short` must be empty at the end), or a node script under your private scratch dir. Paste the observed output per element (short).
3. **Fully-authored control.** For each leaking element, confirm a fully-authored block (every key, defaults spelled out) serializes byte-identically today — so the fix must keep that.
4. **Shared helper?** Can SC-466's per-instance "keys the source omitted" record (in `stamina-bar/model.ts`) move to one shared helper that every leaking element uses? Propose WHERE it lives (a file path), its API (signatures), and how each leaking element's parse/serialize would call it. Flag any element where it does not fit (e.g. serialize is not `stringifyYaml(model)`, the model is cloned/rebuilt between parse and write so a WeakMap keyed on the instance would lose presence, nested objects/arrays with their own defaults). Note any file in `src/framework/host/` you would need — say so; do not assume it is free.
5. **Size.** Rough count of elements to change, fixtures likely to need updating (test files that pin bytes for minimal sources), and whether an e2e test exists per leaking element's write surface (`e2e/manifest/*.ts`).

## 3. Rules

- No gates required (read-only). If you run jest for a probe: `rm -f main.js styles.css` in the plugin root first is NOT allowed (it would change the tree only if they are tracked — check `git status` after); prefer `npx jest <your probe file>` with the devbox shape below.
- Command shape: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc482-wrapper-default-keys/draw-steel-elements -- bash <script>` where `<script>` is a file you wrote with the Write tool in your private scratch dir and which itself `cd`s into the plugin repo. Never a compound `cd X && …` in the Bash call. One command per Bash call. Redirect output to a file in your scratch dir and read it.
- Private scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc482-r0-survey-<your agentId>/` — unique names inside it. Write files with the Write tool, not heredocs. Never glob `rm`; delete only paths you created, by exact name. Never `rm -rf` anything under `.superpowers/`.
- `git -C <absolute path>` for every git command. Never `pkill`/`killall`.
- Redirect long-running output to a file rather than streaming it — the 600s stream watchdog kills silent agents. Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.

## 4. Report

Write `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc482-wrapper-default-keys/sc482-r0-survey-report.md`. Open with a ≤10-line executive summary: which elements leak (and which keys), shared-helper verdict + proposed path, element/fixture counts. Body answers questions 1–5 in order with file:line. If the report-file write is blocked by your harness, return the report inline.

## 5. Return contract

Your final text goes to the ticket-owner, not a human: raw facts — STATUS (DONE / NEEDS_CONTEXT / BLOCKED), leaking elements + keys, helper verdict, `git status --short` result at the end (must be empty), plus the filesystem path of every artifact you produced. No prose.

You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` routes to the top-level dispatcher, not me. If you need input mid-task, end your turn with STATUS: NEEDS_CONTEXT and the question. If you ever do send a message anyway, its FIRST WORD must be `SC-482:`.
