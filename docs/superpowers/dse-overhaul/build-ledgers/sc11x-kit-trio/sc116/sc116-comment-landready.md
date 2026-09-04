Land-ready — and the review pass before landing caught a real regression in the same branch, now fixed: the "Other Summoners" chapter of the Summoner book was about to lose all five of its Summons grids and all 17 "Summoned by" lines.

## What the review found

The approved SC-116 change (kit tiles now say Martial / Magic / Psionic correctly; kit data gains a `kit_type` field) checked out clean: every one of the 25 kits' kinds was re-derived from the source book by a second agent and all 25 match. The only change to the data files is one new `kit_type` line per kit (300 files, all under `kit/`, nothing else touched). All 25 kit JSON files validate against the schema.

The problem was in the SC-115 commit on the same branch (the full ability card on the kit tile). To splice that card in early, it moved a page-indexing step ahead of the passes that add Summons grids and "Summoned by" back-links to summoner pages. The embed step then copied the older, pre-augment versions into the Read chapter. Measured: `Read/summoner/other-summoners.md` shrank from 217,633 to 159,169 bytes. Kit pages were fine; only that chapter lost content. The fix re-walks the index right before embedding. The page is byte-identical to before. The first version of the guard test turned out not to guard anything (it stayed green with the fix reverted); the scoped re-review caught that, and the test now runs the full site build and fails with the fix removed.

Three smaller hardening fixes also went in on SC-116's code: the kind match now ignores link URLs inside keywords (so a future "Antimagic" link target can't flip a kit to Magic), an empty `@kit-type:` annotation no longer suppresses the derivation, and the schema's description of `kit_type` now lists Martial / Magic / Psionic instead of the stale "Caster, Stormwight".

## Follow-ups filed

- SC-296 — the DSE plugin's `ds-kit` card still sniffs keywords for the kit kind; it should read the new `kit_type` field once the data deploys.
- SC-295 — `parseKeywords` mis-splits four keyword lines in the corpus (`'- Area'`, `'Magic; Light Weapon'`, `'or Heavy Weapon'`); unrelated to kits, found during the review sweep.

## Record

- Branch `sc11x-kit-trio` (shared with SC-119 and SC-115; one landing covers all three, order SC-116 → SC-119 → SC-115 because SC-119's commit builds on SC-116's).
- steel-etl: HEAD `093da29` — `2785608` (SC-116 kit_type) → `71002ce` (SC-119 dashes) → `83513bc` (SC-115 inline card) → `96406f7` (SC-115 re-walk fix) → `2704a1f` (SC-116 review fixes) → `762f58d` (schema description) → `81263e9` (CLAUDE.md note) → `093da29` (Build()-level guard test); rebased onto origin/main `d6bb008`
- v2: `f9347707dd` (SC-115 tile CSS; rebased onto origin/main `9782209ec5`)
- data-sdk-npm: `a4ce584` over `v3` `a4c2a3e` (schema description only)
- Gates: `go build` / `go vet` / `go test ./...` all ok. Browse kit index: 21 Martial / 3 Magic / 1 Psionic.
- Reviews: `.superpowers/sdd/sc116-kit-kind-frontmatter/sc116-review-r1.md`, `sc116-review-r2.md`.
- This is still a **data change** — the next deploy regenerates `data-unified` with the new field.
