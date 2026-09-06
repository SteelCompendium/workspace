**Ask: OK to land? Landing `v2` to `main` auto-deploys the live site, so this is also the deploy decision.**

Every card family now carries the plate instead of the floating strip: statblock, featureblock, ability, trait, and kit. Two Read-chapter bugs are fixed with it: the "add to encounter" chip no longer appears on the first embedded statblock of a chapter, and embedded cards no longer show a copy-link that copied the chapter's URL. Trait pages also lose a duplicate title that has been there since before this work.

Independent review verdict: >>> REVIEW VERDICT + one-line summary of findings and fixes.

## What you're approving

1. Land the `sc297-menu-panels-site` branch (`v2` @ >>> SHA, plus the DESIGN.md / CHANGELOG entries in the workspace). Landing pushes `v2` `main`, which deploys the site.
2. Nothing else is queued behind this. SC-298 (kit cards have no MD/PNG export because kit pages lack the export island — pre-existing, a `steel-etl` gap) is filed separately and not part of this.

Approve = the dispatcher lands it and the site updates. Hold = say what to change; it stays on the branch.

## The three new families

Featureblock (Ogre Malice), dark, hovered — plate above the malice head band:
{{IMG:sc297-r2-featureblock-dark-hover.png}}

Trait, dark, hovered:
{{IMG:sc297-r2-trait-dark-hover.png}}

Kit, light, hovered — pin only; MD/PNG will appear once SC-298 adds the kit export island:
{{IMG:sc297-r2-kit-light-hover.png}}

Phone width, featureblock, dark — plate always visible, nothing covered:
{{IMG:sc297-r2-featureblock-dark-phone.png}}

## The two Read-chapter fixes and the trait title

Read chapter (Retainers, 21 embedded statblocks), dark — no stray encounter chip, no stray copy-link on any embedded card:
{{IMG:sc297-r2-read-chapter-dark-no-stray.png}}

Trait leaf page, dark — one title, where before the page heading repeated above the card:
{{IMG:sc297-r2b-trait-dark-title.png}}

## For the record

- Branch `sc297-menu-panels-site`: `v2` @ >>> SHA (three commits over `f9347707dd`: prototype, rollout, trait fix); worktree superproject @ >>> SUPER SHA.
- Gates: v2 unit 78/78; original e2e 6/8 with the two failures (`featureblock-fixture`, `settings-panel`) pre-existing and identical against the live site; new `tests/e2e/chrome-panel.e2e.cjs` 135/135 (plate geometry measured on every family, both schemes, desktop + phone + print).
- Review: >>> REVIEW report path, findings count by severity, what was fixed.
- Docs updated on the branch: `DESIGN.md` (Card header system now names the plate as the home for page actions), `CHANGELOG.md` `## Unreleased`, `v2/CLAUDE.md`, `v2/.repo-docs/conventions.md`, `v2/.repo-docs/troubleshooting.md`.
