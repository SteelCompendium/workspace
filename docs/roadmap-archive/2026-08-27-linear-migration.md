# ROADMAP → Linear migration (2026-08-27)

Live items migrated to Linear 2026-08-27; completed items remain in the dated archive files;
a `#N` reference resolves here or in those archives.

`ROADMAP.md` was deleted in this migration (workspace commit 2026-08-27). Every item whose
governing (topmost) `**Status:**` line was **not** terminal (done/DONE/shipped) was migrated to
a Backlog ticket on the "Steel Compendium" Linear team, one ticket per item, title = the
heading text without the number, description = a `(was ROADMAP #N — migrated from the
workspace repo 2026-08-27)` provenance line followed by the item's full body verbatim
(including any `#N` cross-references to other items, left unedited — they still resolve via
this table or `docs/roadmap-archive/*.md`).

11 items migrated (of 15 live-numbered entries in the file at deletion time; the remaining 4
were terminal — `done`/`shipped` — and are covered by the existing dated archives, most
recently [`2026-06-18-completed.md`](2026-06-18-completed.md)).

## Migrated

| #N | Title | SC-key |
|---|---|---|
| 1 | v2 site load/navigation performance (page weight + search index) | [SC-206](https://linear.app/tski-home/issue/SC-206) |
| 2 | Link the Abilities / subclass-Ability columns of advancement tables | [SC-207](https://linear.app/tski-home/issue/SC-207) |
| 3 | In-page anchor links on class/chapter/ancestry pages | [SC-208](https://linear.app/tski-home/issue/SC-208) |
| 4 | Deeper modeling of downtime projects (gods/saints half shipped) | [SC-209](https://linear.app/tski-home/issue/SC-209) |
| 10 | Architecture-redesign carry-over phases (i18n, homebrew spec, consumer migration) | [SC-210](https://linear.app/tski-home/issue/SC-210) |
| 14 | Populate reserved `religion.*` types (domains, orders, pantheons) | [SC-211](https://linear.app/tski-home/issue/SC-211) |
| 15 | Monsters/Summoner per-ability coding for statblocks & featureblocks | [SC-212](https://linear.app/tski-home/issue/SC-212) |
| 17 | Extract a shared steel-design token/CSS package for site + plugin | [SC-213](https://linear.app/tski-home/issue/SC-213) |
| 18 | Section-scope annotation: end an entity's structured/rendered scope without moving content | [SC-214](https://linear.app/tski-home/issue/SC-214) |
| 19 | Steel UI refinement pass — density, padding & alignment polish (SC-121, gates 7.0.0) | [SC-215](https://linear.app/tski-home/issue/SC-215) |
| 20 | Annotate the 28 unannotated granted abilities as `@type: ability` | [SC-216](https://linear.app/tski-home/issue/SC-216) |

## Ambiguous

None. Every live item in `ROADMAP.md` carried (or, for #19/#20, clearly implied by an
unqualified `**Origin:**` line with no terminal marker) an unambiguous non-terminal status.
Items #7, #9, #12, and #16 were terminal (`done`/`shipped`) and were left out of this
migration — they remain resolvable via the dated archive files.
