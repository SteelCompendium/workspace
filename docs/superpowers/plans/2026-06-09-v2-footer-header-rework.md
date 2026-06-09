# v2 Footer/Header Rework + Build Metadata — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the v2 site footer (static legal copyright + compact steel-etl/site build stamps + a bug-report link, dropping "Made with Material for MkDocs"), add a non-intrusive bug-report icon to the header, and inject the v2 build SHA at CI time to give every deployed build a traceable stamp.

**Architecture:** Move version data out of the monolithic `copyright:` string into `extra.*` fields in `v2/mkdocs.yml`. Two vendored Material partial overrides (`copyright.html`, `header.html`) render the new footer/header. Local `just` recipes stamp `extra.etl_sha/etl_date` via `yq`; the CI workflow stamps `extra.site_sha/site_date` from `$GITHUB_SHA` immediately before `mkdocs gh-deploy` (resolving the chicken-and-egg, since GitHub knows the commit being deployed).

**Tech Stack:** MkDocs + Material for MkDocs 9.7.6 (Jinja2 partials), `yq` (mikefarah/go-yq via devbox), `just`, GitHub Actions, `mkdocs` run via `devbox run -- …`.

**Spec:** `docs/superpowers/specs/2026-06-09-v2-footer-header-rework-design.md`

---

## Repo map

This plan spans **two git repos**:

- **`v2/`** (origin `SteelCompendium/v2`): `mkdocs.yml`, `overrides/partials/*`, `justfile`, `.github/workflows/ci.yml`.
- **workspace root** (the repo this plan lives in): `justfile`.

Commit in the repo that owns each file. Paths below are relative to the workspace root (`/home/vexa/code/steel_compendium/workspace`).

## File structure

- `v2/mkdocs.yml` — modify: static `copyright`, new `extra.*` version/link fields.
- `v2/overrides/partials/copyright.html` — **create**: footer (legal + build stamps + bug link, no "Made with").
- `v2/overrides/partials/header.html` — **create** (vendored from Material 9.7.6 + bug icon).
- `v2/justfile` — modify: `update` writes `extra.etl_*`; `clean_docs` loses its dead `sed`.
- `justfile` (workspace) — modify: `deploy` and `deploy-v2` write `extra.etl_*`.
- `v2/.github/workflows/ci.yml` — modify: add a "Stamp site build version" step before deploy.

---

### Task 1: Restructure `mkdocs.yml` — static copyright + `extra` fields

**Files:**
- Modify: `v2/mkdocs.yml:3` (copyright) and the `extra:` block (currently `v2/mkdocs.yml:92-96`).

- [ ] **Step 1: Replace the copyright line**

Current `v2/mkdocs.yml:3` (the SHA/date will differ — match by the leading text):

```yaml
copyright: 'The Draw Steel Compendium is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025 MCDM Productions, LLC.<br><small>steel-etl <a href="https://github.com/SteelCompendium/steel-etl/commit/244acd4">244acd4</a> (2026-06-09)</small>'
```

Replace with (legal text only — strip the `<br><small>…</small>` version HTML):

```yaml
copyright: 'The Draw Steel Compendium is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025 MCDM Productions, LLC.'
```

- [ ] **Step 2: Add the new `extra` fields**

Current `extra:` block:

```yaml
extra:
  homepage: https://steelcompendium.io/v2
  analytics:
    provider: google
    property: G-PMF9SHHXNY
```

Replace with (append the five new keys; keep `homepage`/`analytics` unchanged):

```yaml
extra:
  homepage: https://steelcompendium.io/v2
  analytics:
    provider: google
    property: G-PMF9SHHXNY
  # Bug-report Google Form (linked from footer + header bug icon).
  bug_report_url: 'https://docs.google.com/forms/d/e/1FAIpQLSc6m-pZ0NLt2EArE-Tcxr-XbAPMyhu40ANHJKtyRvvwBd2LSw/viewform?usp=sharing&ouid=105036387964900154878'
  # Build stamps shown in the footer. etl_* is written by the local `just`
  # recipes (steel-etl pipeline commit); site_* is written by CI from
  # $GITHUB_SHA right before gh-deploy. Committed empty; filled at build time.
  etl_sha: ""
  etl_date: ""
  site_sha: ""
  site_date: ""
```

- [ ] **Step 3: Verify YAML still parses**

Run: `cd v2 && devbox run -- mkdocs build -q 2>&1 | head -20`
Expected: build completes with no YAML/config error. (Footer still renders the default partial at this point — that's fine; the override comes in Task 2.) Ignore any pre-existing warnings.

- [ ] **Step 4: Commit (v2 repo)**

```bash
cd v2 && git add mkdocs.yml && git commit -m "refactor(v2): move footer version data into extra.* fields"
```

---

### Task 2: Footer partial override — `copyright.html`

**Files:**
- Create: `v2/overrides/partials/copyright.html`

- [ ] **Step 1: Create the override partial**

Write `v2/overrides/partials/copyright.html` with exactly:

```jinja
{#-
  Custom footer copyright partial — overrides mkdocs-material 9.7.6's bundled
  partials/copyright.html. Differences from upstream:
    * renders steel-etl + v2 site build stamps from config.extra.*
    * adds a "Report a bug" link (config.extra.bug_report_url)
    * drops the "Made with Material for MkDocs" notice
  Re-sync the .md-copyright / .md-copyright__highlight wrapper markup if Material
  changes it on upgrade.
-#}
<div class="md-copyright">
  {% if config.copyright %}
    <div class="md-copyright__highlight">
      {{ config.copyright }}
    </div>
  {% endif %}
  {% if config.extra.etl_sha or config.extra.site_sha %}
    <div class="md-copyright__build">
      <small>
        build:
        {%- if config.extra.etl_sha %}
          steel-etl
          <a href="https://github.com/SteelCompendium/steel-etl/commit/{{ config.extra.etl_sha }}">{{ config.extra.etl_sha }}</a>
        {%- endif %}
        {%- if config.extra.etl_sha and config.extra.site_sha %} &middot; {% endif %}
        {%- if config.extra.site_sha %}
          site
          <a href="https://github.com/SteelCompendium/v2/commit/{{ config.extra.site_sha }}">{{ config.extra.site_sha }}</a>
        {%- endif %}
        {%- if config.extra.site_date %} ({{ config.extra.site_date }}){% endif %}
      </small>
    </div>
  {% endif %}
  {% if config.extra.bug_report_url %}
    <div class="md-copyright__bug">
      <small>
        <a href="{{ config.extra.bug_report_url }}" target="_blank" rel="noopener">Report a bug</a>
      </small>
    </div>
  {% endif %}
</div>
```

Note: `custom_dir: overrides` is already configured (existing overrides like `main.html` work), so this file is picked up automatically. Empty-string `extra.*` values are falsy in Jinja2, so the build line/segments hide cleanly when unstamped.

- [ ] **Step 2: Build and confirm the override renders + "Made with" is gone**

Run:
```bash
cd v2 && devbox run -- mkdocs build -q && \
  grep -rl "Material for MkDocs" site/ | head; \
  echo "--- copyright block ---"; \
  grep -o 'md-copyright__highlight[^<]*<[^>]*>[^<]*' site/index.html | head -1
```
Expected: the first `grep` prints **nothing** (no "Material for MkDocs" anywhere in the built site). The legal text appears in the `md-copyright__highlight` div. (No `site_sha`/`etl_sha` yet, so no build line — expected.)

- [ ] **Step 3: Commit (v2 repo)**

```bash
cd v2 && git add overrides/partials/copyright.html && git commit -m "feat(v2): custom footer partial (build stamps + bug link, no generator notice)"
```

---

### Task 3: Header partial override — bug-report icon

**Files:**
- Create: `v2/overrides/partials/header.html`

- [ ] **Step 1: Create the vendored header with the bug icon**

Write `v2/overrides/partials/header.html` with exactly (this is Material 9.7.6's `header.html` with a header comment swap and one inserted block before the `{% if config.repo_url %}` source block):

```jinja
{#-
  Vendored from mkdocs-material 9.7.6 partials/header.html. The ONLY change vs
  upstream is the `config.extra.bug_report_url` block inserted before the repo
  source link (renders a bug-report icon button in the header). Re-sync the rest
  of this file with upstream if Material is upgraded.
-#}
{% set class = "md-header" %}
{% if "navigation.tabs.sticky" in features %}
  {% set class = class ~ " md-header--shadow md-header--lifted" %}
{% elif "navigation.tabs" not in features %}
  {% set class = class ~ " md-header--shadow" %}
{% endif %}
<header class="{{ class }}" data-md-component="header">
  <nav class="md-header__inner md-grid" aria-label="{{ lang.t('header') }}">
    <a href="{{ config.extra.homepage | d(nav.homepage.url, true) | url }}" title="{{ config.site_name | e }}" class="md-header__button md-logo" aria-label="{{ config.site_name }}" data-md-component="logo">
      {% include "partials/logo.html" %}
    </a>
    <label class="md-header__button md-icon" for="__drawer">
      {% set icon = config.theme.icon.menu or "material/menu" %}
      {% include ".icons/" ~ icon ~ ".svg" %}
    </label>
    <div class="md-header__title" data-md-component="header-title">
      <div class="md-header__ellipsis">
        <div class="md-header__topic">
          <span class="md-ellipsis">
            {{ config.site_name }}
          </span>
        </div>
        <div class="md-header__topic" data-md-component="header-topic">
          <span class="md-ellipsis">
            {% if page.meta and page.meta.title %}
              {{ page.meta.title }}
            {% else %}
              {{ page.title }}
            {% endif %}
          </span>
        </div>
      </div>
    </div>
    {% if config.theme.palette %}
      {% if not config.theme.palette is mapping %}
        {% include "partials/palette.html" %}
      {% endif %}
    {% endif %}
    {% if not config.theme.palette is mapping %}
      {% include "partials/javascripts/palette.html" %}
    {% endif %}
    {% if config.extra.alternate %}
      {% include "partials/alternate.html" %}
    {% endif %}
    {% if "material/search" in config.plugins %}
      {% set search = config.plugins["material/search"] | attr("config") %}
      {% if search.enabled %}
        <label class="md-header__button md-icon" for="__search">
          {% set icon = config.theme.icon.search or "material/magnify" %}
          {% include ".icons/" ~ icon ~ ".svg" %}
        </label>
        {% include "partials/search.html" %}
      {% endif %}
    {% endif %}
    {% if config.extra.bug_report_url %}
      <a class="md-header__button md-icon" href="{{ config.extra.bug_report_url }}" target="_blank" rel="noopener" title="Report a bug">
        {% include ".icons/material/bug-outline.svg" %}
      </a>
    {% endif %}
    {% if config.repo_url %}
      <div class="md-header__source">
        {% include "partials/source.html" %}
      </div>
    {% endif %}
  </nav>
  {% if "navigation.tabs.sticky" in features %}
    {% if "navigation.tabs" in features %}
      {% include "partials/tabs.html" %}
    {% endif %}
  {% endif %}
</header>
```

- [ ] **Step 2: Build and confirm the header bug link is present**

Run:
```bash
cd v2 && devbox run -- mkdocs build -q && \
  grep -o 'class="md-header__button md-icon"[^>]*viewform[^>]*' site/index.html | head -1
```
Expected: one match showing the `<a>` whose `href` contains `…/viewform…` (the form URL) with `title="Report a bug"`. (The bug SVG is inlined inside it.)

- [ ] **Step 3: Commit (v2 repo)**

```bash
cd v2 && git add overrides/partials/header.html && git commit -m "feat(v2): add non-intrusive bug-report icon to header"
```

---

### Task 4: Rewrite local version-stamp injection (both repos)

Replaces the brittle copyright-string `sed`/`yq` surgery with targeted `extra.etl_*` writes, and removes the dead `clean_docs` reset.

**Files:**
- Modify: `v2/justfile` (`update` recipe lines 23-25; `clean_docs` line 53-54)
- Modify: `justfile` (workspace) (`deploy` lines 90-98; `deploy-v2` lines 145-153)

- [ ] **Step 1: Update `v2/justfile` `update` recipe**

Replace these lines (currently `v2/justfile:23-25`):

```bash
    # 2. Embed version info in mkdocs.yml
    copyright="The Draw Steel Compendium is an independent product published under the DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC. DRAW STEEL © 2025 MCDM Productions, LLC.<br><small>steel-etl<a href=\"https://github.com/SteelCompendium/steel-etl/commit/${etl_sha}\">${etl_sha}</a> (${etl_date})</small>"
    VAL="$copyright" yq -i '.copyright = env(VAL)' mkdocs.yml
```

with:

```bash
    # 2. Stamp the steel-etl pipeline version into mkdocs.yml extra.* fields.
    # (The legal copyright text is now static; CI fills extra.site_* at deploy.)
    yq -i ".extra.etl_sha = \"${etl_sha}\" | .extra.etl_date = \"${etl_date}\"" mkdocs.yml
```

- [ ] **Step 2: Remove the dead `Data: DATA_VERSION` reset in `v2/justfile` `clean_docs`**

Delete these lines (currently `v2/justfile:53-54`):

```bash
    # Reset data version placeholder in mkdocs.yml for idempotent re-runs
    sed -i -E 's|Data: steel-etl <a[^<]*</a> \([0-9]{4}-[0-9]{2}-[0-9]{2}\)|Data: DATA_VERSION|g' mkdocs.yml
```

(Its pattern no longer matches anything; `extra.etl_*` is overwritten idempotently each run. Leave the rest of `clean_docs` — the `cd docs` / `find … -exec rm` block — untouched.)

- [ ] **Step 3: Update workspace `justfile` `deploy` recipe**

Replace these lines (currently `justfile:90-98`):

```bash
    # 3. Embed version info in mkdocs.yml
    cd "$root/v2"
    data_version="steel-etl <a href=\"https://github.com/SteelCompendium/steel-etl/commit/${etl_sha}\">${etl_sha}</a> (${etl_date})"
    # Idempotent: rewrite the existing version block in place (matching whatever
    # SHA/date is there now) rather than a one-shot DATA_VERSION token, which a
    # prior deploy consumed permanently. mkdocs.yml is committed below so CI's
    # `mkdocs gh-deploy` (which builds the committed tree, not this working copy)
    # actually sees the stamp.
    sed -i "s#steel-etl <a href=\"[^\"]*\">[^<]*</a> ([0-9-]*)#${data_version}#" mkdocs.yml
```

with:

```bash
    # 3. Stamp the steel-etl pipeline version into mkdocs.yml extra.* fields.
    # mkdocs.yml is committed below so CI's `mkdocs gh-deploy` (which builds the
    # committed tree, not this working copy) sees the etl stamp; CI fills
    # extra.site_* from $GITHUB_SHA just before deploy.
    cd "$root/v2"
    yq -i ".extra.etl_sha = \"${etl_sha}\" | .extra.etl_date = \"${etl_date}\"" mkdocs.yml
```

- [ ] **Step 4: Update workspace `justfile` `deploy-v2` recipe**

Replace these lines (currently `justfile:145-153`):

```bash
    # 2. Embed version info in mkdocs.yml
    cd "$root/v2"
    data_version="steel-etl <a href=\"https://github.com/SteelCompendium/steel-etl/commit/${etl_sha}\">${etl_sha}</a> (${etl_date})"
    # Idempotent: rewrite the existing version block in place (matching whatever
    # SHA/date is there now) rather than a one-shot DATA_VERSION token, which a
    # prior deploy consumed permanently. mkdocs.yml is committed below so CI's
    # `mkdocs gh-deploy` (which builds the committed tree, not this working copy)
    # actually sees the stamp.
    sed -i "s#steel-etl <a href=\"[^\"]*\">[^<]*</a> ([0-9-]*)#${data_version}#" mkdocs.yml
```

with:

```bash
    # 2. Stamp the steel-etl pipeline version into mkdocs.yml extra.* fields.
    # mkdocs.yml is committed below so CI's `mkdocs gh-deploy` (which builds the
    # committed tree, not this working copy) sees the etl stamp; CI fills
    # extra.site_* from $GITHUB_SHA just before deploy.
    cd "$root/v2"
    yq -i ".extra.etl_sha = \"${etl_sha}\" | .extra.etl_date = \"${etl_date}\"" mkdocs.yml
```

- [ ] **Step 5: Verify the `yq` stamp works and preserves the file**

Run (simulates what the recipes do, then checks the build line renders):
```bash
cd v2 && cp mkdocs.yml /tmp/mkdocs.yml.bak && \
  devbox run -- yq -i '.extra.etl_sha = "abc1234" | .extra.etl_date = "2026-06-09"' mkdocs.yml && \
  devbox run -- mkdocs build -q && \
  grep -o 'md-copyright__build.*steel-etl.*abc1234' site/index.html | head -1; \
  echo "--- comments preserved? ---"; grep -c "Bug-report Google Form" mkdocs.yml
```
Expected: the `grep` shows the build line containing `steel-etl … abc1234`; the comment count is `1` (yq preserved comments). Then restore: `cp /tmp/mkdocs.yml.bak mkdocs.yml && rm /tmp/mkdocs.yml.bak`.

- [ ] **Step 6: Commit (two repos)**

```bash
cd v2 && git add justfile && git commit -m "refactor(v2): stamp steel-etl version into extra.* via yq"
cd .. && git add justfile && git commit -m "refactor: deploy recipes stamp extra.etl_* instead of copyright string"
```

---

### Task 5: CI step — stamp the v2 site build SHA

**Files:**
- Modify: `v2/.github/workflows/ci.yml` (insert a step before the final `- run: mkdocs gh-deploy --force`, currently line 40)

- [ ] **Step 1: Add the stamping step**

In `v2/.github/workflows/ci.yml`, the last two lines are currently:

```yaml
      - run: pip install mkdocs-material mkdocs-roamlinks-plugin mkdocs-awesome-nav

      - run: mkdocs gh-deploy --force
```

Insert a new step between them so the file ends:

```yaml
      - run: pip install mkdocs-material mkdocs-roamlinks-plugin mkdocs-awesome-nav

      # Stamp the v2 build version into mkdocs.yml just before deploy. $GITHUB_SHA
      # is the commit being deployed (no chicken-and-egg). Targeted sed on the
      # placeholder lines avoids a YAML parser stripping mkdocs.yml's comments and
      # choking on its !!python/name: tags. Not committed back — gh-deploy only
      # force-pushes the built site to gh-pages.
      - name: Stamp site build version
        run: |
          sed -i -E "s|^(  site_sha:).*|\1 \"${GITHUB_SHA::7}\"|" mkdocs.yml
          sed -i -E "s|^(  site_date:).*|\1 \"$(date +%F)\"|" mkdocs.yml

      - run: mkdocs gh-deploy --force
```

- [ ] **Step 2: Verify the sed locally against the real file**

Run (proves the placeholder lines match and get rewritten, then restore):
```bash
cd v2 && cp mkdocs.yml /tmp/mkdocs.yml.bak && \
  GITHUB_SHA=deadbeefcafe sed -i -E "s|^(  site_sha:).*|\1 \"${GITHUB_SHA::7}\"|" mkdocs.yml && \
  sed -i -E "s|^(  site_date:).*|\1 \"$(date +%F)\"|" mkdocs.yml && \
  grep -E '^  site_(sha|date):' mkdocs.yml; \
  cp /tmp/mkdocs.yml.bak mkdocs.yml && rm /tmp/mkdocs.yml.bak
```
Expected: prints `  site_sha: "deadbee"` and `  site_date: "<today>"` — confirming both placeholders are matched and rewritten. File is then restored to empty placeholders.

- [ ] **Step 3: Commit (v2 repo)**

```bash
cd v2 && git add .github/workflows/ci.yml && git commit -m "ci(v2): stamp site build SHA into mkdocs.yml before gh-deploy"
```

---

### Task 6: Full integration verification (both stamps together)

**Files:** none modified (verification only; any temp stamps are reverted).

- [ ] **Step 1: Stamp both etl_* and site_* and build**

Run:
```bash
cd v2 && cp mkdocs.yml /tmp/mkdocs.yml.bak && \
  devbox run -- yq -i '.extra.etl_sha = "abc1234" | .extra.etl_date = "2026-06-09"' mkdocs.yml && \
  sed -i -E 's|^(  site_sha:).*|\1 "deadbee"|; s|^(  site_date:).*|\1 "2026-06-09"|' mkdocs.yml && \
  devbox run -- mkdocs build -q
```
Expected: clean build.

- [ ] **Step 2: Assert the full footer + header content**

Run:
```bash
cd v2 && echo "== build line ==" && \
  grep -oE 'build:.*abc1234.*deadbee.*\(2026-06-09\)' site/index.html | head -1; \
  echo "== etl link ==" && grep -o 'steel-etl/commit/abc1234' site/index.html | head -1; \
  echo "== site link ==" && grep -o 'SteelCompendium/v2/commit/deadbee' site/index.html | head -1; \
  echo "== bug footer link ==" && grep -o 'viewform[^"]*">Report a bug' site/index.html | head -1; \
  echo "== header bug icon ==" && grep -o 'title="Report a bug"' site/index.html | head -1; \
  echo "== NO generator (expect empty) ==" && grep -c "Material for MkDocs" site/index.html
```
Expected: build line matches `build: steel-etl … abc1234 · site deadbee (2026-06-09)`; both commit links present; footer "Report a bug" link present; header `title="Report a bug"` present; the final count is `0`.

- [ ] **Step 3: Restore empty placeholders**

Run: `cd v2 && cp /tmp/mkdocs.yml.bak mkdocs.yml && rm /tmp/mkdocs.yml.bak && git diff --quiet mkdocs.yml && echo "mkdocs.yml clean (placeholders empty)"`
Expected: prints the clean confirmation (the committed `mkdocs.yml` keeps empty `etl_*`/`site_*` placeholders; real values are injected at deploy/CI time).

- [ ] **Step 4: Visual smoke check (optional but recommended)**

Run: `devbox run local-deploy` (serves at `127.0.0.1:8123`), open the site, and confirm: footer reads cleanly (legal text, then a small build line, then "Report a bug"), the header shows an unobtrusive bug icon near search/GitHub that opens the form in a new tab, and "Made with Material for MkDocs" is gone. Stop the server when done.

- [ ] **Step 5: Update the workspace handoff/docs if needed**

No `ARCHITECTURE.md` change is required (the version-stamp mechanism was never documented there; justfile/CI comments cover it). If the spec/plan revealed anything to defer, add a `## N.` entry to `FOLLOWUPS.md`. Otherwise no doc change.

---

## Self-review

**Spec coverage:**
- Keep legal copyright → Task 1 Step 1. ✅
- Keep steel-etl stamp → Tasks 1/2/4 (etl_sha/date + build line). ✅
- Add v2 site stamp + fix chicken-and-egg → Tasks 1, 2, 5 (CI `$GITHUB_SHA`). ✅
- Bug link in footer → Task 2. ✅
- Bug icon in header → Task 3. ✅
- Remove "Made with" → Task 2 (omitted from partial; verified count 0). ✅
- Three injection sites updated → Task 4 (v2 `update`, workspace `deploy` + `deploy-v2`). ✅
- Dead `clean_docs` sed removed → Task 4 Step 2. ✅
- CI comment-safe sed (no YAML parser) → Task 5. ✅

**Placeholder scan:** No TBD/TODO; every step has exact code/commands and expected output. ✅

**Type/name consistency:** `extra.bug_report_url`, `extra.etl_sha`, `extra.etl_date`, `extra.site_sha`, `extra.site_date` used identically across mkdocs.yml (Task 1), both partials (Tasks 2/3), the justfiles (Task 4), and CI (Task 5). Commit-link bases (`SteelCompendium/steel-etl`, `SteelCompendium/v2`) consistent between the footer partial and the verification greps. ✅
