# FOLLOWUPS → Linear migration (2026-08-27)

Live items migrated to Linear 2026-08-27; completed items remain in the dated archive files;
a `#N` reference resolves here or in those archives.

`FOLLOWUPS.md` was deleted in this migration (workspace commit 2026-08-27). Every item whose
governing (topmost) `**Status:**` line was **not** terminal (done/DONE/shipped) was migrated to
a Backlog ticket on the "Steel Compendium" Linear team, one ticket per item, title = the
heading text without the number, description = a `(was FOLLOWUPS #N — migrated from the
workspace repo 2026-08-27)` provenance line followed by the item's full body verbatim
(including any `#N` cross-references to other items, left unedited — they still resolve via
this table or `docs/followups-archive/*.md`).

47 items migrated (of 72 live-numbered entries in the file at deletion time; the remaining 25
were terminal — `done`/`DONE`/`shipped` — and are covered by the existing dated archives, most
recently [`2026-06-18-completed.md`](2026-06-18-completed.md)).

## Migrated

| #N | Title | SC-key |
|---|---|---|
| 2 | Settings panel: card-style toggle still triggers a full page reload | [SC-217](https://linear.app/tski-home/issue/SC-217) |
| 3 | Settings panel: re-enable "Color theme" and "Ability card style" once fully supported | [SC-218](https://linear.app/tski-home/issue/SC-218) |
| 5 | Link the bestiary pages into the SCC cross-reference sweep | [SC-219](https://linear.app/tski-home/issue/SC-219) |
| 19 | Stale summoner statblock codes in `summoner-linking-reference.md` | [SC-220](https://linear.app/tski-home/issue/SC-220) |
| 20 | Strip the genuinely-dead per-card head CSS selectors superseded by `.sc-head` | [SC-221](https://linear.app/tski-home/issue/SC-221) |
| 21 | Verify the summoner-fixture `left-deck` provenance renders on live pages | [SC-222](https://linear.app/tski-home/issue/SC-222) |
| 23 | Statblock sticky mini-header too bulky at phone widths | [SC-223](https://linear.app/tski-home/issue/SC-223) |
| 30 | Facet-mode (any/all) toggle a11y polish: fixed aria-label | [SC-224](https://linear.app/tski-home/issue/SC-224) |
| 39 | Parity gate cannot see the statblock/featureblock block margin — the site's lives on the `*-wrap` node, outside every pair | [SC-225](https://linear.app/tski-home/issue/SC-225) |
| 40 | Parity `section-head`/`pr-head` pairs compare the site's text-less flex wrapper against the plugin's title/header content node | [SC-226](https://linear.app/tski-home/issue/SC-226) |
| 41 | Parity pair for featureblock advancement bands + stale "PLUGIN-ONLY" CSS comment | [SC-227](https://linear.app/tski-home/issue/SC-227) |
| 42 | Typography sliders show a double value label ("100%" ours + "1.00" Obsidian's) | [SC-228](https://linear.app/tski-home/issue/SC-228) |
| 43 | Print-anchor shape guard doesn't scan the SC-112 scale consumer rules | [SC-229](https://linear.app/tski-home/issue/SC-229) |
| 44 | Text-size scale doesn't reach modal content while card zoom does | [SC-230](https://linear.app/tski-home/issue/SC-230) |
| 46 | Keywords chip is one chip for all keywords, not one chip per keyword like the site | [SC-231](https://linear.app/tski-home/issue/SC-231) |
| 47 | Steel card-head NAME is 83% of the site's — the crest only *looks* oversized | [SC-232](https://linear.app/tski-home/issue/SC-232) |
| 48 | Hero sheet still overflows a 300px sidebar leaf after the container-query fix | [SC-233](https://linear.app/tski-home/issue/SC-233) |
| 50 | Stamina-edit modal's "Dying" zone label is near-invisible, and no "Winded" zone renders at all | [SC-234](https://linear.app/tski-home/issue/SC-234) |
| 51 | Steel section-title type scale is a size below the site's — 16px/.07em against 18px/.1em | [SC-235](https://linear.app/tski-home/issue/SC-235) |
| 53 | `src/elements/feature/example.yaml` is a semantically false villain action — cannot be fixed in place | [SC-236](https://linear.app/tski-home/issue/SC-236) |
| 55 | featureblock/standalone head-detail parity nits (SC-101 residuals) | [SC-237](https://linear.app/tski-home/issue/SC-237) |
| 57 | In PRINT, the ◆ divider paints nothing | [SC-238](https://linear.app/tski-home/issue/SC-238) |
| 58 | DSE: five drifted copies of the SCC-prefix predicate — export one | [SC-239](https://linear.app/tski-home/issue/SC-239) |
| 59 | DSE initiative: SCC-ref failure UX — bogus filename hint + portrait warn noise | [SC-240](https://linear.app/tski-home/issue/SC-240) |
| 60 | DSE: MinionStaminaPoolModal carries the RC-3 negative-input inversion, unfixed | [SC-241](https://linear.app/tski-home/issue/SC-241) |
| 62 | Statblock cards silently drop non-icon blockquotes (the "Traits with an Essence Cost" sidebar) | [SC-242](https://linear.app/tski-home/issue/SC-242) |
| 63 | Compendium Sync / Check-for-updates buttons have no busy state | [SC-243](https://linear.app/tski-home/issue/SC-243) |
| 64 | Disposition sweep: deferrals whose "it would move the frozen legacy bytes" blocker evaporated (SC-144, 2026-08-11) | [SC-244](https://linear.app/tski-home/issue/SC-244) |
| 65 | Sidebar pin of the SECOND same-code ds-scc block silently binds the first | [SC-245](https://linear.app/tski-home/issue/SC-245) |
| 66 | `--dse-*` tokens are silently dead outside `[data-dse-element]`/`.dse-modal` roots — no gate catches chrome styled with them | [SC-246](https://linear.app/tski-home/issue/SC-246) |
| 67 | `SB_PRESETS.steel` must mirror the descriptor defaults — enforced by one test, not by structure | [SC-247](https://linear.app/tski-home/issue/SC-247) |
| 68 | Sidebar "Open in sidebar" debounce-starvation window can emit a second tracker fence (SC-153 review, 2026-08-16) | [SC-248](https://linear.app/tski-home/issue/SC-248) |
| 69 | Copy-pasting a generated tracker block duplicates its `_dse_from` identity (SC-153 review, 2026-08-16) | [SC-249](https://linear.app/tski-home/issue/SC-249) |
| 70 | Malice column clips at the print right edge — pre-existing, both trees (SC-154 review, 2026-08-16) | [SC-250](https://linear.app/tski-home/issue/SC-250) |
| 71 | Malice quick-add input widths are pinned to their placeholder strings (SC-154 fix, 2026-08-16) | [SC-251](https://linear.app/tski-home/issue/SC-251) |
| 72 | CM6 scc-link click resolver has no syntax awareness — links inside inline code / fences navigate (SC-135 review, 2026-08-16) | [SC-252](https://linear.app/tski-home/issue/SC-252) |
| 74 | PDF export shows the "Read-only" badge overlapping the statblock role banner (SC-170 review, 2026-08-17) | [SC-253](https://linear.app/tski-home/issue/SC-253) |
| 75 | `assertPrintTwinParity` returns silently when it compared nothing (SC-170 re-review N-1, 2026-08-18) | [SC-254](https://linear.app/tski-home/issue/SC-254) |
| 76 | `ds-skills` still carries its own disclosure header alongside the element menu (SC-169 rollout, 2026-08-18) | [SC-255](https://linear.app/tski-home/issue/SC-255) |
| 77 | A built `main.js` at the plugin root shadows `main.ts` for jest — 67 phantom failures (SC-169 fix round, 2026-08-18) | [SC-256](https://linear.app/tski-home/issue/SC-256) |
| 78 | Non-Latin custom-condition names slug to empty — silent no-op (SC-186 re-review, 2026-08-22) | [SC-257](https://linear.app/tski-home/issue/SC-257) |
| 79 | The visual harness models NO Obsidian host CSS — an entire defect class is invisible to every gate (SC-189, 2026-08-25) | [SC-258](https://linear.app/tski-home/issue/SC-258) |
| 80 | Chrome panel renders ~30px in a real vault vs 24px in the harness — every in-repo picture of it is 6px short (SC-189, 2026-08-25) | [SC-259](https://linear.app/tski-home/issue/SC-259) |
| 81 | `ReadingModeBlockHost.replaceSource` writes the file even when the body is unchanged (SC-198 investigation, 2026-08-25) | [SC-260](https://linear.app/tski-home/issue/SC-260) |
| 82 | `rule/downtime/crafting-project` + `research-project` duplicate 20 full project bodies already published as leaf pages (SC-201, 2026-08-25) | [SC-261](https://linear.app/tski-home/issue/SC-261) |
| 83 | Weapon-enhancement table headings: missing "…Table" suffix and an "Enchantment" typo in the book source (SC-201, 2026-08-25) | [SC-262](https://linear.app/tski-home/issue/SC-262) |
| 84 | `ds-encounter` writes to disk on mount, with no user interaction (SC-198 LP probe, 2026-08-26) | [SC-263](https://linear.app/tski-home/issue/SC-263) |

## Ambiguous (migrated per the "cheaper than lost" rule)

- **#23** — the governing `**Status:**` line reads "done (pending Scott's taste check on
  deploy)". The word "done" is present, but the parenthetical means the fix has not been
  confirmed to ship, and the body still names a concrete punted task (a hover-`title` markup
  change deferred to "the next statblock Go touch"). Migrated to SC-223 rather than treated as
  terminal; the migration note is repeated on the ticket itself.

Two items had non-standard but unambiguous Status lines and were migrated on a literal reading
of the liveness rule (not flagged as ambiguous, but worth a note for the next reader):

- **#2** — Status is "dormant" (not one of done/DONE/shipped), so it migrates; dormant just
  means the underlying UI control is currently hidden, not that the item is resolved.
- **#5** — Status reads "direction 1 … done … — direction 2 still open"; only the still-open
  half (links *into* monster pages) is unresolved, but the full item body was migrated verbatim
  per the brief (no partial-item splitting).
