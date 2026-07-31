# DSE Plugin — Remaining Task Backlog (historical seed doc)

> **⚠️ SUPERSEDED 2026-07-31 — do not use this as the source of truth.**
> This doc existed once, to seed the Linear "Steel Compendium" team with the DSE
> backlog. It did that job; **Linear is now the tracker.** Its "Current state"
> paragraph and per-item statuses had gone badly stale (they still described D2/D3 as
> unlanded on a `dse-framework` branch and everything as Todo), which is exactly the
> drift this header exists to stop.
>
> **Where to look instead:**
> - **Live task state** → Linear, team *Steel Compendium* (issue IDs mapped below).
> - **"You are here" router** → `docs/handoffs/HANDOFF.md`.
> - **Steel UI parity detail** → `2026-07-23-steel-ui-gap-inventory.md` (§A–§F).
> - **Per-phase plans** → `plans/`.
> - **Deferred items** → the workspace `FOLLOWUPS.md` / `ROADMAP.md`.
>
> The only content kept live below is the **D9 v1 deferral catalog** (item 10) and the
> **D2/D3 polish list** (item 11) — neither is duplicated anywhere else.

> **Version note (2026-07-27):** every "6.0.0" this doc ever said means **7.0.0**. The
> 6.0.0 number is retired after `6.0.0-rc1` was accidentally published as a regular
> release (auto-updated users; got the plugin delisted from the community store).
> `6.0.1` = a recovery re-release of 5.1.1. Details: `docs/handoffs/HANDOFF.md`
> (2026-07-27 addendum) and the plugin CHANGELOG.

Everything below is the `draw-steel-elements` **Obsidian plugin** (renders in Obsidian;
the v2 site is separate). Specs live alongside this file in
`docs/superpowers/dse-overhaul/`.

---

## Item → Linear map (status as of 2026-07-31)

| # | Item | Actual state | Linear |
|---|---|---|---|
| 1 | Land the D2 + D3 overhaul + cut the major | Landed to `main` **2026-07-20**. Release cut still pending (Scott: build not ready) | SC-11 |
| 2 | "High Fantasy Steel" visual overhaul | Plan 19 port **landed**; plans 20 + 21 **landed** after SC-10 closed; plan 22 **drafted, blocked** on the C1 direction call. Covers 5 of 32 element families | SC-10 (closed early) → **SC-97** |
| 3 | Visual feedback loop (let Claude see the render) | **Done** — F4 browser harness (`npm run shots`) + F5 Obsidian camera (`obsidian-shots`) | SC-9 |
| 4 | D4 — Preferences system | **Done** | SC-8 |
| 5 | D5 — Rolling & interactivity | **Done** | SC-7 |
| 6 | F2 — Data-unified SDK integration | **Done** (SDK pinned to npm 3.0.0) | SC-6 |
| 7 | D6 — Compendium-powered reference family | **Done** | SC-3 |
| 8 | D7 — Hero-facing suite | **Done** | SC-2 |
| 9 | D8 — GM subsystems | **Done** | SC-1 |
| 10 | D9 — Authoring & editing UX | **Shipped v1** (plan 15, 2026-07-12); deferrals below | SC-5 |
| 11 | D2/D3 deferred follow-ups (polish) | Open | SC-4 |

---

## 10. D9 — Authoring & editing UX — v1 deferral detail

*(Relocated from the plugin repo 2026-07-12. This catalog is not duplicated elsewhere.)*

D9 v1 shipped: 12 per-element Insert commands, the `/ds` scaffolder, key/enum autocomplete
inside `ds-*` fences, and the schema-driven form editor (pencil, gated by the default-OFF
`authoringControls` pref). Deferred out of v1:

- **Text importer** (§4) — pasted-text → `ds-*` block via the SDK's readers. Was gated on F2
  (**now landed**): the reader/writer classes the importer needs
  (`AutoDataReader`/`MarkdownStatblockReader`/`MarkdownFeatureReader`/
  `MarkdownFeatureblockReader`/`YamlWriter`) ship in the SDK, and F2's SDK 3.x bump delivered
  the `role`/`organization`/`keywords` field parity the importer was waiting on.
  `authoring.sdkModel` (statblock/feature/featureblock, declared on those three elements'
  definitions) is the routing hook the importer will read; it already ships, so building the
  importer is now **purely additive and unblocked**.
- **Inline squiggle linter** (§5.2) — CM6 `registerEditorExtension` diagnostics for schema
  errors inside a `ds-*` fence. Block-level → per-line → CST precision ladder (OD-3); verify
  `@codemirror/lint` is available on the host CM6 surface before building (not bundled today
  — only `@codemirror/language` is a dependency) (OD-4).
- **Form "save anyway" escape hatch** (OD-6) — v1 hard-fails Save while the working data is
  schema-invalid; a "save anyway" override for power users mid-refactor is cataloged, not
  built.
- **Rich array/object form editors** — v1 renders any array/object/`$ref` field as a raw-YAML
  textarea sub-control (`formModel.ts`'s `widgetFor` fallback); per-shape structured editors
  are future scope.
- **Configurable `/ds` trigger prefix** (OD-2) — the trigger is fixed at `/ds…`; making it a
  setting is deferred until a real collision with another plugin's suggester is reported.
- **Editor-side form-EDIT of an existing block** (OD-D9-12) — the form editor is reachable
  only from the reading-mode pencil; there is no editor/Live-Preview `BlockHost` to write
  through yet (`src/framework/host/LivePreviewBlockHost.ts` is still a deliberately
  unimplemented stub — every member throws). Revisit once an editor `BlockHost` exists.

## 11. D2/D3 deferred follow-ups (polish) — SC-4

**Status:** Open · **Type:** Chore · Low priority

Accumulated minor items flagged during the build (all non-blocking, safe-to-defer; full list
in the SDD ledger's "FOLLOWUPS" tags): kit `head:''`→`false` normalize; `aria-selected` on
role-less divs → real role; the cardHead-contract test's positional `.dse-head {` grep;
kit-index color-function scan symmetry; import-dead `CodeBlocks.ts` sweep + uncalled
`labeledIcon`; `void prefs.set` `.catch` (once D4 wires real `saveData`); decide whether
Legacy *prints* should be fully monochrome (currently tier/stamina colors show).

The provisional Steel taste-calls (stamina-temp blue-vs-purple, crit/VP gold, act-spine hues)
fold into the Steel UI parity effort — **SC-97**, not here.
