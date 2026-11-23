# Proposed dse-verify SKILL.md change (SC-434) — not applied

1. In the e2e gate bullet list (after "No retries, ever" bullet, about line 131), add:

   - **CI (SC-434).** The `e2e` job in `.github/workflows/plugin-ci.yml` runs the full `npm run e2e -- --shards=4`
     on every push to main/develop and every PR (`ubuntu-24.04`, 4 vCPU). It is a second, independent run of this
     gate, not a replacement for running it before you land. On failure read the `e2e-out` artifact
     (`<run>/<test-id>/screenshot.png`, DOM, note diff); the artifact is named `e2e-out-<run attempt>` and is
     uploaded on failure or cancel. Cache key `dse-e2e-obsidian-<os>-<arch>-<PINNED>-launcher-<obsidian-launcher version>`,
     `PINNED` read from `e2e/run.mjs`; the cache is saved only when complete. Lifecycle is not on CI (SC-449).

2. In row 4b's "Expects" cell nothing changes. In "Current expected numbers", when a landing updates CURRENT, the
   CI job's expected summary line is the same `OBSIDIAN-E2E done: ...` line; no separate CI numbers to keep.

3. Footgun to add near the cache bullet: changing the `PINNED` constant in `e2e/run.mjs` (or the
   `obsidian-launcher` version in `package-lock.json`) busts the CI cache by itself (the workflow reads both);
   do not copy either version number into the workflow.
