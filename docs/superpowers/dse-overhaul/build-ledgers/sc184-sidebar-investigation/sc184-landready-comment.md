Approval received — the branch is rebased onto current `develop`, every gate is green again, and it is queued for the dispatcher to land. Nothing further is needed from you on this ticket until it lands (no deploy, no tag, no release — those stay yours).

What lands: the sidebar fix set you approved on 2026-08-29 (pin/unpin in the block's hover menu, panel headers with a clickable note link, the empty-state explainer, the dismiss button on the "panel unavailable" card, layout saved on every add/remove, the dead `collapsed` field removed, and the reframed docs with the pinned-note pattern). No code changed since your approval — only the rebase.

Mechanics, for the record:

- `draw-steel-elements` branch `sc184-sidebar-investigation`: `51ba4e8` → `69eb5f7`, rebased onto `origin/develop` `778a341` (SC-195). Same 10 commits. One conflict, in `CHANGELOG.md` only: SC-195's and SC-184's bullets landed on the same line under the same heading; both kept, SC-195's first, no wording changed.
- Gates on the rebased tree: tsc clean · lint clean · jest 3514 passed / 1 skipped / 190 suites (up from 3417 — SC-195's new tests) · shots 478 PNGs, 0 FAIL (up from 474 — SC-195's new fixtures) · freeze 210/210, 0 mismatches · parity 0 GAPs / 0 undeclared / 16 DECLARED · obsidian-shots 59/59. Zero frozen print bytes moved; no rebaseline.
- Superproject: one workspace CHANGELOG bullet (`4c2035c`). A merge probe against workspace `origin/main` shows the same kind of additive bullet overlap (SC-120's bullet on the same line under `## Unreleased`); the landing step resolves it by keeping both.
- Backlog residuals already filed and linked here: SC-281, SC-282, SC-283, SC-288, SC-289, SC-290.
