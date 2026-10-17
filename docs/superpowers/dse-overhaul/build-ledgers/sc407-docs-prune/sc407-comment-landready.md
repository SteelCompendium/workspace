The 7.0.0 docs, README and CHANGELOG now describe only what ships. Deferred features are gone from them: hero trackers, encounter/project/party, ds-roll, the sidebar, the edit pencil and form editor, and Print preview. The branch is ready to land.

**What changed for a reader**

- The docs site lost the pages and sections for deferred features, with no "coming soon" teasers. `Roll.md` is gone. `gm-trackers.md` now covers montage only, and `hero-suite.md` is reduced to a Stamina pointer.
- The sidebar sections, the pencil bullet, the Authoring settings page and the Print preview row are removed.
- `migrating-to-7.md` gets one short note. It says a block for an element not in this release shows a "not available in this release" card and the note text is untouched. Only beta users can hit this.
- The 7.0.0 CHANGELOG section lost the bullets for deferred features. Mixed bullets were re-worded to the part that ships. The header still reads "unreleased", because dating it is part of the release.
- Docs screenshots were regenerated with the `experimental` switch OFF, so they show the shipping product. 10 images of deferred surfaces were removed (40 images became 30). The settings index now shows 10 pages and no Authoring page.
- The switch itself is still undocumented for users. `AGENTS.md` and `.repo-docs` describe it for developers.

**One thing to glance at, no decision needed before landing:** the README's top image (`sample.png`) is now about 6000 px tall. The old image was stale: its third panel was a hero card, which is deferred. That panel is now a full Bandit Chief statblock. A shorter statblock would make a tidier README image. Say so if you want it.

**For 7.1.0:** every removed page, section, image and CHANGELOG bullet is listed with its path at `05a6ff3` in the release audit doc §11a, so the docs can be restored without digging.

---

Mechanics:
- dse branch `sc407-docs-prune` @ `a337460` (12 commits over `05a6ff3`). The workspace superproject is unchanged.
- Gates: tsc/lint clean; jest 4432 passed / 1 skipped / 219 of 220 suites (+3 new harness tests); lifecycle 25/25; shots 568, 0 FAIL; freeze 274/274; parity 0 gaps / 0 undeclared / 24 declared. docs-shots rc=0 (30 images). `mkdocs build --strict` showed 0 new warnings and 0 broken links or anchors.
- Review: an independent Opus review found 0 critical, high or medium issues. Its 6 low findings were fixed. Two scoped re-reviews of the fixes found 2 more small issues, both fixed. The final re-review on `a337460` returned LAND-READY with 0 findings.
- The docs camera now forces the switch OFF and restores `data.json` byte-for-byte. `obsidian-shots` and the gates still run with it ON. `docs-shots` refuses to capture a deferred element.
