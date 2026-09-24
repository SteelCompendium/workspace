The tracker's error for a compendium creature that isn't synced no longer asks whether you have duplicate files, and builder-made trackers no longer log a console warning for every creature without a portrait. Nothing on screen changes otherwise. Ready to land; no decision needed from you.

**What you'll notice**

When an encounter-builder tracker points at a creature your vault hasn't synced, the error card now says only:

```
Failed to resolve creature statblock reference at index 0 (scc.v1:mcdm.monsters.v1/monster.goblin.statblock/goblin-stinker):
    SCC reference (…) is not available in this vault. Sync the compendium (Settings → Draw Steel Elements → Sync compendium).
```

Before, it also added "Are there multiple instances of the 'scc.v1:…' file in your vault? If so, please specify the full path." That sent people looking for a file that doesn't exist. Hand-written file-path refs (`statblock: Goblin Stinker`) still get the old message word for word, because that hint does make sense for a file name.

**The portrait decision (I made it; override if you disagree)**

The ticket asked whether to ship portrait images in the compendium or to quiet the warning. The compendium has no creature art to ship, and since SC-162 a missing portrait already shows the shield glyph (heroes) or skull glyph (enemies). So "no image" is a normal state. The warning now fires only when a row names an `image:` that can't be found. A row with no `image:` is silent, and it looks exactly as it did before.

I did not warn when the default token image setting fails. Its shipped value, `Media/token_1.png`, is missing from most vaults, so warning on it would bring back the same per-creature noise.

**Not changed:** one bad ref still stops the whole tracker from rendering. That is your open question from SC-134 and is out of scope here.

---

Mechanics:
- draw-steel-elements branch `sc240-scc-ref-error`: `225b02e`, `3284b5d`, `f6fb208` (tip `f6fb208`), on `origin/develop` `46c0c4c`
- Files: `src/elements/initiative/resolveRefs.ts`, `src/elements/initiative/view.ts`, two test files plus one new one (`test/dom/elements/initiative-portrait-missing.test.ts`), and a `CHANGELOG.md` bullet
- Battery: tsc and lint clean; jest 3937 passed / 1 skipped / 202 of 203 suites (+7 new tests); shots 524 PNGs, 0 FAIL; freeze 260/260 (no pixels moved); parity 0 gaps / 0 undeclared / 16 declared
- An independent reviewer approved the change. It checked 10 legacy bare-path messages byte for byte, 8 SCC failure shapes and 8 portrait cases, and ran 8 sabotage probes. Its three low findings, plus the whitespace-only `image:` case, were fixed in a second commit. The re-review then caught that the whitespace check crashed on a non-text `image:` (for example an unquoted `image: [[Frodo.png]]`), which left the portrait slot empty. A third commit fixes that; the glyph shows as before. Both fix rounds were re-reviewed.
