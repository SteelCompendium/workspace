# Design system archive (Claude Design handoff)

The exported **Claude Design** (claude.ai/design) project that produced the v2 site's
**High-Fantasy Steel** redesign. Imported 2026-06-11 from the design-tool handoff
bundle; until then it lived only in the design tool (docs referenced
`redesign/statblocks/` as "session-local, not committed" — this is that material).

**Everything in here has been implemented.** The live repos are the source of truth —
`v2/docs/stylesheets/steel-*.css`, `v2/docs/javascripts/steel-*.js`,
`steel-etl/internal/site/` — and were further cleaned up in agent sessions after
handoff, so this archive's CSS/JS snapshots are **stale by design**. Read it for
*intent* (why things look the way they do), not for current code. The living summary
of the design language is the workspace [`DESIGN.md`](../../DESIGN.md).

## Contents (`handoff/`)

| Path | What it is |
|---|---|
| `README.md` | The design-system bible: brand, voice, visual foundations, iconography. The "ACTIVE HANDOFF — Statblocks" banner is stale (shipped 2026-06-11). |
| `SKILL.md` | Claude Design's agent-skill manifest for the system |
| `colors_and_type.css` | All design tokens — colors (dark+light), font stacks, type scale, radii, shadows |
| `styles.css` | Small shared prototype styles |
| `chats/chat1–7.md` | The seven design-session transcripts (2026-06-03 → 2026-06-10). **The motivations live here** — chat1 founds the system, chat3/4 ability/trait cards, chat6 ◆ rule + filigree quotes, chat7 statblocks. |
| `redesign/` | The approved design-canvas boards (landing, kits, hierarchy, fantasy direction) |
| `redesign/statblocks/` | **The statblock implementation spec** — DOM contract, `data-sb-*` preference contract, 3 presets, locked role colors. Shipped 2026-06-11; the deferred malice band + captain label are `FOLLOWUPS.md` #7. |
| `v2-handoff/` | Production conversion docs per component (ability cards, traits, landing/index cards, ◆ rule/quotes, feature indexes) + frozen CSS/JS/Go snapshots the preview pages load. **Snapshots are stale**; the docs are intent. |
| `preview/`, `ui_kits/` | Design-system preview cards and the interactive UI-kit recreation |
| `fonts/`, `assets/` | DrawSteelGlyphs (duplicate of `../DrawSteelGlyphs/`) and the logo set — kept so the prototypes' relative paths work |

## Pruned at import

Dropped from the raw bundle (4.9 MB → 1.1 MB): `uploads/` (pasted rulebook-page
screenshots — copyrighted scans, don't belong in a public repo), `scraps/` (design-tool
iteration screenshots), and Claude Design tool internals (`_ds_bundle.js`,
`_ds_manifest.json`, `_adherence.oxlintrc.json`, `.design-canvas.state.json`, the
bundle's top-level boilerplate README).
