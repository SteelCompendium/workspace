# SC-164 — mike-versioned docs: dedicated sites for main (released) and develop (dev-banner)

Worktree: `/home/scott/code/steelCompendium/worktrees/sc164-mike/draw-steel-elements`
Branch: `sc164-mike`, cut from develop's tip `efdced2`.

## Status: DONE — real migration live and verified. Branch commits NOT landed (pointer unstaged, per instructions).

## Commits on `sc164-mike`

1. `0c0f7cd` — `ci(docs): adopt mike for versioned gh-pages deploys (SC-164)`
   `mkdocs.yml` (+`theme.custom_dir: overrides`, +`extra.version.provider: mike`),
   `overrides/main.html` (Material's `outdated`-block override — the dev banner),
   `.github/workflows/ci.yml` (rewired triggers/deploy commands), `CHANGELOG.md`
   (`[INTERNAL]` entry under 7.0.0 unreleased).
2. `9bb24c3` — `chore(docs): gitignore mike's local mkdocs build output (SC-164)` — a
   small gap noticed while running real deploys locally: `mike deploy` builds into
   `./site` (mkdocs' default `site_dir`), which was untracked-but-unignored.

Diff scope: `mkdocs.yml`, `overrides/main.html` (new), `.github/workflows/ci.yml`,
`CHANGELOG.md`, `.gitignore`. No `src/`/`test/` touched.

## What changed, mechanically

- **mkdocs.yml**: `theme.custom_dir: overrides` (to load the banner override) +
  `extra.version.provider: mike` (turns on Material's header version selector, reading
  gh-pages' mike-managed `versions.json`).
- **overrides/main.html**: extends `base.html`, overrides the `outdated` block — Material's
  own built-in "you're not viewing the latest version" mechanism (its bundled JS decides
  visibility by comparing the deployed version against the `latest` alias; nothing here
  does that comparison by hand). Text: *"You're viewing the **development version** of
  these docs — it documents unreleased features that may still change. For the current
  release, see **the latest docs**."* With exactly two versions (`latest`/dev), "not
  latest" and "is dev" are the same condition.
- **ci.yml**: `on.push.branches` gained `develop`. `main` push → derives `<version>` from
  `manifest.json` at that sha (`python3 -c "import json; print(json.load(open('manifest.json'))['version'])"`)
  and runs `mike deploy --push --update-aliases --alias-type=redirect "$VERSION" latest`.
  `develop` push → `mike deploy --push dev`. Both preceded by `pip install mike` and a
  `git config user.name/user.email` step (mike commits directly via `git commit`, unlike
  the old `ghp-import`-based `mkdocs gh-deploy`, which apparently never needed one on this
  repo's runners). Removed `mkdocs gh-deploy --force` entirely.

## Deviation from the ticket's literal example command: `--alias-type=redirect`

The ticket's example (`mike deploy --push <version> latest --update-aliases`) doesn't
specify `--alias-type`, which defaults to `symlink` (a real git-committed filesystem
symlink `latest -> <version>`). Before touching anything, I researched this and found:
mike's own README documents `--alias-type=redirect`/`copy` as the fallback "if [symlinks
cause] issues," explicitly called out for GitHub Enterprise Server (no native symlink
support); classic gh-pages-branch GitHub Pages hosting also has a documented history of
not resolving symlinked blobs. Given the "prove before touching real gh-pages" mandate is
specifically about catching this class of surprise, I made a deliberate, documented choice
to pass `--alias-type=redirect` for the `latest` alias — mike then writes a real per-URL
HTML redirect page under `latest/` instead of a filesystem symlink, verified structurally
in the local proof (`git ls-tree` showed `latest/` as mode `040000` real directories/
`100644` blobs, not a `120000` symlink entry) and confirmed live (see below). No behavior
difference for readers; zero host-serving risk. Flagging this explicitly since it's a
judgment call beyond the ticket's literal wording — happy to revert to symlink if Scott
prefers, but I'd recommend keeping redirect.

## Local proof (before touching real gh-pages)

Built a scratch bare repo (`git init --bare`) as a fake `origin`, and two clones pointed at
it instead of the real GitHub remote:
- `dev-repo` — clone of the `sc164-mike` worktree, on branch `sc164-mike` (develop's tip +
  this ticket's config) → `mike deploy --push dev`.
- `latest-repo` — clone checked out to `main` (`0645aca`, real 5.1.1/"6.0.1" content),
  with `mkdocs.yml`/`overrides/` copied in from the worktree (overlay, not committed to
  `main`) → `mike deploy --push --update-aliases --alias-type=redirect 5.1.1 latest`, then
  `mike set-default --push latest`.

Verified structurally (`git ls-tree`) that both versions coexist on one `gh-pages` branch
with a correct `versions.json`, that `latest/` holds real redirect pages (not symlinks),
and that root `index.html` redirects to `latest/` (via the alias, not a hardcoded version
— confirmed by then simulating a SECOND release (`5.1.2`) and re-checking: `5.1.1`
persisted as an undeleted old version, `latest/index.html`'s redirect target moved to
`../5.1.2/`, and nothing else was touched).

**Screenshots** (Playwright against `python3 -m http.server` serving the scratch clone),
included in the Linear comment:
- `root-redirect-to-latest.png` — root lands on the `5.1.1` content, header shows
  `5.1.1 ▾`, no banner.
- `dev-index-banner.png` — `/dev/` shows the yellow "development version" banner exactly
  as drafted, header shows `dev ▾`.
- `version-selector-open.png` — the header dropdown open, listing both `dev` and `5.1.1`.
- `deep-link-old-url-redirect.png` — see next section.

### Deep-link preservation (ticket: "verify; add explicit redirects if needed") — NEEDED

Checked this explicitly rather than assuming: the current real `gh-pages` (pre-migration)
has 14 flat top-level page directories (`Features/`, `canvas-character-sheet/`,
`characteristics-element/`, `common-element-fields/`, `compendium-downloader/`,
`counter/`, `featureblock/`, `horizontal-rule/`, `initiative-tracker/`,
`negotiation-tracker/`, `skills-element/`, `stamina-bar/`, `statblock/`,
`values-row-element/`), and `main:docs/*.md` has the exact same 14 slugs 1:1 — so the
migration renames every one of them to `latest/<same-slug>/`. mike's own deploy/set-default
commands never touch anything outside their own managed paths (their version subdir,
alias subdirs, `versions.json`, root `index.html`), so the OLD flat directories are simply
left behind, unredirected — a bare old URL would silently keep serving a frozen,
never-updated 6.0.1-era copy forever instead of 404ing OR redirecting, which is worse than
either (stale-but-200 is invisible until someone diffs it).

Fix: replaced each of the 14 old directories' `index.html` with a small redirect stub to
`../latest/<slug>/`, using mike's own alias-redirect template verbatim (same structure as
mike's own `latest/index.html`). This is a ONE-TIME extra commit on top of mike's own
commits (mike doesn't create these). Verified locally: full chain
`/canvas-character-sheet/` → `/latest/canvas-character-sheet/` → `/5.1.1/canvas-character-sheet/`
resolves end-to-end (Playwright's `page.url()` landed on the real content page after both
hops), and the 14 stubs survived the simulated `5.1.2` follow-up deploy untouched (mike
never writes outside its own paths — proven, not assumed).

Left `404.html`/`assets/`/`search/`/`sitemap.xml*` (top-level, pre-mike build artifacts)
alone — each version now carries its own copy under its own subdirectory, and these
aren't meaningfully deep-linked by anyone. Noted as a minor future cleanup, not fixed here
(no reader-facing effect either way).

## The one-time real migration

**Rollback point recorded before any write:** `origin/gh-pages` was at
`5d662f021aae4970c6c7ff1638b39b0f9c34074a` (fetched and confirmed unchanged immediately
before the first real push). To roll back completely: `git push --force origin
5d662f021aae4970c6c7ff1638b39b0f9c34074a:refs/heads/gh-pages` (destructive; only if
something is badly wrong).

Real `gh-pages` commit sequence after migration (all pushed to the real
`git@github.com:SteelCompendium/draw-steel-elements.git`):

| sha | what |
|---|---|
| `5d662f0` | (rollback point — pre-migration 6.0.1-era flat site, unchanged) |
| `e2afc2c` | `Deployed 0645aca to 6.0.1 with ProperDocs 1.6.7 and mike 2.2.0` |
| `e6383a6` | `Deployed 0c0f7cd to dev with ProperDocs 1.6.7 and mike 2.2.0` |
| `de0d1d4` | `Set default version to latest with mike 2.2.0` |
| `0b3752f` | `compat: redirect pre-mike deep links to /latest/ (SC-164)` (the 14 stubs) |

**`latest` = `6.0.1`, built from a checkout of `main`@`0645aca` with the new
`mkdocs.yml`/`overrides/` overlaid (copied in, not committed to `main` — `main` only
advances via the SC-163 release-FF process, never a direct edit).**

**Version-label discrepancy, flagged for Scott, not silently fixed:** `main`@`0645aca`
carries BOTH the `5.1.1` and `6.0.1` git tags (identical tree — `6.0.1` was evidently
applied to the same commit as a post-hoc relabel, per the CHANGELOG's own note: *"6.0.1 —
Identical to 5.1.1... exists to recover from `6.0.0-rc1`"*). `manifest.json` at that commit
still literally reads `"version": "5.1.1"`. I deployed the one-time migration as `6.0.1`
per the coordinator's explicit instruction (matching the actually-released/tagged/listed
version), but ci.yml's AUTOMATED mechanism derives `<version>` from `manifest.json`,
per the ticket — so if `main` were pushed again at this exact sha (it won't be; it only
advances at the next release), the automated deploy would label it `5.1.1`, not `6.0.1`.
This is a **pre-existing content inconsistency** (the manifest was never bumped to match
the retroactive tag), not something introduced by this ticket, and not something I felt
authorized to silently correct on `main` outside the release process. It resolves itself
naturally at the next real release cut, as long as that release properly bumps
`manifest.json`.

`dev` deployed from the `sc164-mike` worktree branch directly (content is develop's tip;
the branch only adds CI/docs-config files, not doc content changes).

**Root redirect**: `mike set-default --push latest` (mike's `set-default` "always uses a
redirect, no matter the setting of `alias_type`" — confirmed via its own docs — so this
part was never a symlink question in the first place).

**Deep-link compat stubs**: pushed separately (`0b3752f`, above) after confirming the
14-page inventory and the redirect chain against the local proof.

## Live-URL verification (after GH Pages actually rebuilt — see note below)

Site: `https://steelcompendium.io/draw-steel-elements/` (`build_type: legacy`, `source:
gh-pages branch /`, confirmed via `gh api repos/.../pages`).

| URL | Result |
|---|---|
| `/` | 200, body is a JS/meta-refresh redirect to `latest/` |
| `/latest/` | 200, page shows `6.0.1` in the header version selector, no dev banner |
| `/dev/` | 200, page shows the yellow "development version... see the latest docs" banner |
| `/versions.json` | `[{"version":"dev",...},{"version":"6.0.1","aliases":["latest"]}]` |
| `/canvas-character-sheet/` (+ all other 13 old slugs, spot-checked `statblock`,
  `initiative-tracker`, `compendium-downloader`, `Features`) | 200, body is a redirect to
  `../latest/<slug>/` |

**GitHub Pages build-propagation gotcha, worth recording:** GitHub Pages (`build_type:
legacy`) queues an actual build job per push rather than serving the pushed commit
instantly. My first live check (right after the compat-redirect push) showed the OLD
frozen `canvas-character-sheet` content still being served — `gh api
repos/.../pages/builds/latest` confirmed the live build was still pinned to the
PREVIOUS commit (`de0d1d4`, one push behind). Triggered a rebuild explicitly
(`gh api -X POST repos/.../pages/builds`), polled until `status: built` at the correct
commit (`0b3752f`), then re-verified — all green. **Don't trust an immediate post-push
check on GH Pages' legacy build type; poll the builds API (or just wait ~30-90s) before
treating a live-URL check as authoritative.**

## The main-workflow-window analysis (ticket's explicit ask)

**Confirmed mechanism**: for a `push` event, GitHub Actions executes the workflow YAML as
it exists in the tree of the commit that was pushed — not a cached copy, not the
default-branch's copy, not the previous commit's copy. (Verified against GitHub's own
"Events that trigger workflows" docs: push-triggered runs use the workflow file "not
merged into the default branch," i.e. whatever is actually in that pushed commit's tree.)

**Consequence for the SC-11 release-FF flow**: the release FF is
`git push origin <release-sha>:refs/heads/main`, where `<release-sha>` is a commit taken
from `develop`'s history. Once this SC-164 branch lands to `develop` (before the next
release cut — expected, since it's queued for the orchestrator to land now), every future
release-sha on `develop` carries the NEW mike-based `ci.yml`. So the push that performs the
release FF is itself a push of a commit whose tree already has the new `ci.yml` — GitHub
Actions runs THAT version, automatically, with no extra manual step. **This confirms the
ticket's "no new manual steps" claim.**

**Residual exposure window — real, not fully closed by CI alone:** between now (branch not
yet landed) and the next release cut, `main`'s currently-committed `ci.yml` is still the
OLD one (`mkdocs gh-deploy --force`, still literally present at `main`@`0645aca` right
now). SC-163's process says `main` only ever advances at a release, via Scott's own
action — so under normal process, nothing should push to `main` in that window and this
is a non-issue. But I checked: **`main` has NO branch protection**
(`gh api repos/.../branches/main/protection` → `404 Branch not protected`) — so nothing at
the GitHub level actually prevents a stray direct push to `main` during this window, and if
one happened, the OLD `ci.yml` would run and `mkdocs gh-deploy --force` would fully
overwrite `gh-pages`, destroying the `dev`/`latest`/compat-stub structure just deployed
(that's exactly the failure mode this migration exists to prevent going forward).
**Recommendation for Scott** (not implemented — a governance decision, out of this
ticket's scope): add branch protection to `main` restricting direct pushes, as
defense-in-depth alongside the "main only moves at a release" convention. This is
orthogonal to SC-164's own correctness — it's a pre-existing gap SC-163 already created,
surfaced here because this ticket's blast radius (a stray old-`ci.yml` run) is now much
worse (full gh-pages wipe of two versions) than before (full gh-pages wipe of one).

## Battery

- **tsc**: clean, exit 0.
- **jest**: `1 skipped, 165 passed, 165 of 166 total` suites / `1 skipped, 2702 passed,
  2703 total` tests, 3 snapshots — unchanged test surface (this is docs/CI infra only;
  numbers simply reflect develop's tip, not anything this ticket touched).
- **docs-shots pipeline**: confirmed no interaction — `npm run docs-shots` writes into
  `docs/Media` (source content consumed BY the mkdocs build), never touches `gh-pages` or
  any deploy mechanism. Orthogonal by construction.

## Other observations (not action items)

- **Upstream rename mid-flight**: `pip install mkdocs-material` (unpinned, matching the
  existing ci.yml convention) currently resolves `mkdocs-material==9.7.7`, which pulls in
  a new dependency, `properdocs` (apparently MkDocs' own successor/rebrand per a
  deprecation notice `mkdocs build` now prints about "MkDocs 2.0"). `mike` 2.2.0 already
  handles this transparently (it probes `importlib.metadata.version('properdocs')` and
  invokes whichever binary is actually installed) — deploys built and ran correctly either
  way, confirmed live. Flagging only because it was a surprising thing to hit mid-task;
  no action needed, nothing in this ticket pins an old `mkdocs` version.
- **Workspace doc staleness** (not fixed — out of this ticket's `draw-steel-elements/`-only
  scope): `docs/git-workflow.md` in the WORKSPACE repo states *"the docs-deploy `ci.yml`
  deliberately stays main-only"* — no longer true after this lands (it now also triggers on
  `develop`). Flagging for whoever lands this to fix in the same pass, since it's a
  workspace-level file I wasn't scoped to touch.
