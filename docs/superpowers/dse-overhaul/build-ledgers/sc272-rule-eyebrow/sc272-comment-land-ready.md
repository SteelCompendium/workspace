Rule cards now use the singular group name, as you asked. A rule about treasure reads TREASURE above its title, and the same goes for Monster and Negotiation. The branch is ready to land and nothing is waiting on you.

The site still shows the plural on those three groups until SC-369 ships. SC-369 is the steel-etl ticket for the site's rule tile.

---

Mechanics:

- The plugin no longer copies the site's landing-page name table. It title-cases the group from the note's `scc:` code, e.g. `rule.negotiation` → Negotiation.
- Unchanged from the last round: a note with no code still shows RULE, only `rule.<group>` codes are accepted, and a label that repeats the card title is still hidden (SC-120).

Head `draw-steel-elements` `36635e9` (the two commits after `9b51c10` are a CHANGELOG bullet and a test comment; tsc and lint re-run clean). Gates at `9b51c10` on branch `sc272-rule-eyebrow` (rebased onto `origin/develop` `1adfe29`): tsc and lint clean; obsidian-lifecycle 19/19 ok; jest 4099 passed / 1 skipped / 0 failed; shots 524, 0 FAIL; freeze 260/260 (no screenshot bytes moved); parity 0 gaps / 0 undeclared / 16 declared.
