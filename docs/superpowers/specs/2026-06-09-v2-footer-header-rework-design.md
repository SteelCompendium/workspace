# v2 Footer/Header Rework + Build Metadata — Design

**Date:** 2026-06-09
**Repos touched:** `v2/` (templates, config, justfile, CI) and workspace `justfile`
**Deploy entrypoint:** `devbox run deploy` → `just deploy` (workspace justfile)

## Problem

The v2 site footer currently reads:

```
The Draw Steel Compendium is an independent product published under the DRAW STEEL
Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025
MCDM Productions, LLC.
steel-etl 244acd4 (2026-06-09)

Made with Material for MkDocs
```

Goals:

1. Keep the legal copyright text (required by the Creator License).
2. Keep the steel-etl version stamp.
3. Add a **v2 site** build stamp for debuggability — so bug reports can be tied to a
   specific deployed build. (The user's concern: at local build time the v2 commit
   doesn't exist yet — a chicken-and-egg problem.)
4. Add a **bug-report link** (Google Form) to the footer **and** a non-intrusive
   icon in the header.
5. Remove the "Made with Material for MkDocs" notice.

## Key findings (current state)

- The entire footer string (legal text **+** steel-etl version HTML) lives in a single
  `copyright:` field in `v2/mkdocs.yml`.
- The steel-etl version is injected into that string in **three** places via fragile
  string surgery:
  - `v2/justfile` `update` (yq replace of the whole copyright string).
  - workspace `justfile` `deploy` (`sed` rewrite of the `steel-etl <a …>…</a> (date)` substring).
  - workspace `justfile` `deploy-v2` (same `sed`).
- "Made with Material for MkDocs" comes from Material's bundled
  `partials/copyright.html`, **not** from site config.
- CI (`v2/.github/workflows/ci.yml`) runs only `mkdocs gh-deploy --force` on push to
  `main`; it builds the committed tree and injects nothing today.
- A `clean_docs` recipe in `v2/justfile` has a `Data: DATA_VERSION` reset `sed` whose
  pattern no longer matches the copyright string — a dead no-op.
- A `.github/ISSUE_TEMPLATE/bug_report.md` (GitHub Issues template) now exists in v2
  (added by another agent). It is **separate** from the Google Form; this design wires
  the visible links to the **Google Form** per the user's explicit instruction.

## The chicken-and-egg fix

The local build cannot know its own future commit SHA. But `mkdocs gh-deploy` runs
**in CI on GitHub**, where `${{ github.sha }}` (`$GITHUB_SHA`) is exactly the commit
being deployed. So the v2 build stamp is injected **at CI time, immediately before the
build** — no plugin, no chicken-and-egg. v2 commits link to `SteelCompendium/v2`
(the `origin` remote).

## Design

### 1. Decouple version data from the copyright string

`v2/mkdocs.yml`:

- `copyright:` becomes **static legal text only** (no version HTML, no `<small>`).
- New `extra:` fields hold version + link data:

```yaml
copyright: 'The Draw Steel Compendium is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025 MCDM Productions, LLC.'
extra:
  homepage: https://steelcompendium.io/v2
  analytics:
    provider: google
    property: G-PMF9SHHXNY
  bug_report_url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6m-pZ0NLt2EArE-Tcxr-XbAPMyhu40ANHJKtyRvvwBd2LSw/viewform?usp=sharing&ouid=105036387964900154878'
  etl_sha: ''     # written by `just update` / `just deploy*` (local)
  etl_date: ''
  site_sha: ''    # written by CI before gh-deploy
  site_date: ''
```

The four version fields are committed as empty placeholders; each producer fills its
own slot. This eliminates the brittle whole-string surgery.

### 2. Footer partial — `v2/overrides/partials/copyright.html` (new, ~20 lines)

Overrides Material's bundled `copyright.html`. Renders, in order:

1. `config.copyright` — the legal text (only when set), in `.md-copyright__highlight`
   (preserving Material's existing markup/classes).
2. A compact build line (the chosen format):

   ```
   build: steel-etl <etl_sha> · site <site_sha> (<site_date>)
   ```

   - Wrapped in `<small>`.
   - `etl_sha` links to `https://github.com/SteelCompendium/steel-etl/commit/<etl_sha>`.
   - `site_sha` links to `https://github.com/SteelCompendium/v2/commit/<site_sha>`.
   - The displayed date is the **site build date** (`site_date`).
   - **Graceful fallback:** each segment renders only if its SHA is non-empty, so a
     local `mkdocs serve` (no `site_sha`) shows just the steel-etl segment, and a
     totally unstamped build shows no build line at all.
3. A bug-report link: `Report a bug` → `config.extra.bug_report_url`
   (`target="_blank" rel="noopener"`), shown only when the URL is set.
4. The "Made with Material for MkDocs" block is **omitted** entirely.

### 3. Header bug icon — vendor `v2/overrides/partials/header.html` (69 lines)

Copy Material 9.7.6's `partials/header.html` and insert, immediately before the
`{% if config.repo_url %}` source block:

```jinja
{% if config.extra.bug_report_url %}
  <a class="md-header__button md-icon" href="{{ config.extra.bug_report_url }}"
     target="_blank" rel="noopener" title="Report a bug">
    {% include ".icons/material/bug-outline.svg" %}
  </a>
{% endif %}
```

Reuses Material's own `.md-header__button md-icon` classes (no custom CSS, no layout
flash). Carries a top-of-file "re-sync on Material upgrade" comment, matching the
convention already used in `v2/overrides/main.html`.

### 4. Build-metadata injection

**Local** (replace the copyright string surgery with `extra` writes via `yq`, which is
available in devbox):

- `v2/justfile` `update`: replace the `copyright=…` / `yq … .copyright` lines with:
  ```bash
  yq -i ".extra.etl_sha = \"$etl_sha\" | .extra.etl_date = \"$etl_date\"" mkdocs.yml
  ```
- workspace `justfile` `deploy` and `deploy-v2`: replace each
  `data_version=…` + `sed … mkdocs.yml` block with the same `yq` `extra.etl_sha`/
  `etl_date` write (the recipes already compute `etl_sha`/`etl_date`).
- `v2/justfile` `clean_docs`: delete the dead `Data: DATA_VERSION` reset `sed` line
  (no longer matches anything; the `extra` fields are overwritten idempotently each run).

**CI** (`v2/.github/workflows/ci.yml`): add a step **before** `mkdocs gh-deploy`,
using comment-safe `sed` on the placeholder lines (a generic YAML parser would choke on
`mkdocs.yml`'s `!!python/name:` tags and would strip comments):

```yaml
- name: Stamp site build version
  run: |
    sed -i -E "s|^(  site_sha:).*|\1 \"${GITHUB_SHA::7}\"|" mkdocs.yml
    sed -i -E "s|^(  site_date:).*|\1 \"$(date +%F)\"|" mkdocs.yml
```

(The two `extra` children sit at a 2-space indent; the anchored `^( …)` capture keeps
the replacement targeted. `gh-deploy` builds this modified working tree but does not
commit it back to `main`, so the placeholders stay empty in the repo — correct.)

### 5. Testing / verification

These are static templates + config; there is no unit-testable logic. Verification:

1. `devbox run -- mkdocs build` locally and grep the generated HTML for:
   - the legal copyright text present,
   - a header `<a … href="…viewform…">` with the bug icon SVG,
   - **no** occurrence of "Material for MkDocs".
2. Simulate the CI stamp locally with a fake SHA:
   ```bash
   sed -i -E "s|^(  site_sha:).*|\1 \"deadbee\"|; s|^(  site_date:).*|\1 \"2026-06-09\"|" mkdocs.yml
   ```
   plus a fake `etl_sha`, rebuild, and confirm the footer renders
   `build: steel-etl <sha> · site deadbee (2026-06-09)` with both links resolving.
   Revert the placeholders afterward.
3. Manual visual check (local `mkdocs serve` / `devbox run local-deploy`): footer layout
   reads cleanly, header bug icon is unobtrusive and opens the form in a new tab.

## Scope notes

- Items 1 & 4 necessarily touch **both** repos' justfiles (three injection sites) for
  correctness — not optional polish. If only one site were updated, the others' `sed`
  would silently no-op and the stamp would go stale.
- `ARCHITECTURE.md` does not document the copyright/version-stamp mechanism, so no
  architecture-doc update is required; the justfile comments are updated in place.

## Out of scope

- The GitHub Issues `bug_report.md` template (already added separately).
- Any restyling of the footer beyond layout of the new lines.
- Reconciling the Google Form vs. GitHub Issues as the canonical bug channel.
