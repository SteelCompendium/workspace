# SC-304 — Gravitic Well typo correction — decisions ledger

Effort: `sc304-gravitic-well` · worktree `/home/scott/code/steelCompendium/worktrees/sc304-gravitic-well`
Owner: Fable ticket-owner, session 084e7329-c868-4e4f-b1d1-0a2bcf74104b

## Rulings (verbatim, dated)

- **2026-09-06 (ticket description, Scott):** "The Talent ability "Gravitic Well" has incorrect wording in the "Target" field. It should read "Each enemy and object in the area" (Heroes p197)"

## Owner notes

- Source of truth: `steel-etl/input/heroes/Draw Steel Heroes.md` line 15961 currently reads `**🎯 Each creature and object in the area**` inside the Gravitic Well (9 Clarity) ability table. Only the Target cell changes.
- Pipeline: `go run ./cmd/steel-etl gen --config pipeline.yaml --all` from `steel-etl/`, then `site --config v2/site.yaml`; generated output is never hand-edited.
- steel-etl tracked branch: `main` @ 093da29 at worktree creation. Superproject @ db68bf1.

## Rounds

- **2026-09-06 impl round (orchestration:implementer):** steel-etl `15f931b` (rebased on `c84b2e7`, SC-201 head), superproject `9769fd8`. One-line source change + CHANGELOG bullet. Gates: build clean, `go test -race` 8/8 pkgs ok, `gen --all` + `site` ok (3086 codes unchanged), `validate --scc-stable` passed. Owner eyeballed the diff: exactly the Target cell. Report: `sc304-impl-report.md`. **Land-ready.** Landing + deploy are Scott's call.
