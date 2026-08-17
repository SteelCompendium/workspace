# SC-164 CI fix — mike deploy could never push to gh-pages

**Branch:** `sc164-ci-fix` (dse), off `develop` @ `a2fc374`
**Commit:** `e7442f2df4a04bf2f3466fdbf06fb0d0762b1ff2` — `fix(ci): fetch gh-pages before mike deploy (SC-164)`
**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc164-ci-fix/draw-steel-elements`
**Superproject pointer:** left unstaged (`M draw-steel-elements`)
**Files changed:** `.github/workflows/ci.yml`, `CHANGELOG.md` — nothing else. No plugin
runtime code, no docs content, no `mkdocs.yml`/`overrides/` change.

## Confirmed root cause (from the real CI log)

`gh run view 31989340783 -R SteelCompendium/draw-steel-elements --log-failed`:

```
INFO    -  Documentation built in 0.78 seconds
error: failed to push branch gh-pages to origin:
  To https://github.com/SteelCompendium/draw-steel-elements
   ! [rejected]        gh-pages -> gh-pages (fetch first)
```

All three develop runs since SC-164 landed failed identically
(`31989340783`, `31988363926`, `31921405533`).

The same log shows exactly what `actions/checkout@v3` does on the runner —
this matters, because it determines which fix form works:

```
[command]/usr/bin/git init /home/runner/work/draw-steel-elements/draw-steel-elements
[command]/usr/bin/git remote add origin https://github.com/SteelCompendium/draw-steel-elements
[command]/usr/bin/git checkout --progress --force -B develop refs/remotes/origin/develop
  fetch-depth: 1
```

`git init` + `git remote add` + one shallow refspec → the runner has `origin/develop` and
nothing else. mike therefore has no `gh-pages` to build on, commits a **parentless**
gh-pages commit, and the push is a non-fast-forward on every single run.

## Fix

One new unconditional step in `.github/workflows/ci.yml`, placed after the git-identity
step and before both deploy steps (their `if:` gates are mutually exclusive, so one shared
step covers both):

```yaml
- name: Fetch gh-pages so mike can build on it (else every push is a non-fast-forward)
  run: git fetch --depth=1 origin +refs/heads/gh-pages:refs/remotes/origin/gh-pages || true
```

Everything else is untouched: both `if:` gates, `--alias-type=redirect`,
`--update-aliases`, the manifest.json version read, the git identity step, and every
existing comment. `mkdocs gh-deploy --force` is **not** reintroduced anywhere.

### Why targeted shallow fetch, not `fetch-depth: 0`

`fetch-depth: 0` pulls the complete history of *every* branch. gh-pages' history is the
entire built site re-committed once per deploy — by far the heaviest history in the repo,
and none of it is needed. The targeted fetch pulls exactly one commit's worth of tree.

### Why an explicit refspec, not mike's bare `git fetch origin gh-pages --depth=1`

This is a deviation from mike's documented one-liner, and it is evidence-driven. The bare
form writes only `FETCH_HEAD`; it lands `origin/gh-pages` **only** because git
opportunistically applies the default wildcard refspec that `git remote add` happens to
leave in place. In the local repro, under a restricted refspec (`git clone
--single-branch`), the bare form produced **no** `origin/gh-pages`, mike orphaned anyway,
and the push was rejected exactly as before — same bug, different git message
(`non-fast-forward` instead of `fetch first`). The explicit
`+refs/heads/gh-pages:refs/remotes/origin/gh-pages` cannot fail that way and is
self-documenting about what mike actually consumes (`origin/gh-pages`).

### Why `|| true`

If gh-pages does not exist on the remote at all, the fetch errors and that case genuinely
needs no base commit — mike creating the branch from scratch is correct. A real fetch
failure on an existing gh-pages still surfaces loudly, as the same push rejection as
before (`|| true` does **not** convert any failure into a force-push or a wipe; the deploy
still uses a plain non-forced push).

## Verification

`act` unavailable. Reproduced and fixed against a scratch bare remote — **the real
gh-pages branch was never written to.**

### Scratch setup

```
git init --bare origin.git
git fetch --depth=1 https://github.com/SteelCompendium/draw-steel-elements gh-pages
#  -> FETCH_HEAD gh-pages sha: 0b3752f0c5ab35205708add59990053d116b8cd3   (real mike tip)
git commit-tree <that tree> -m "gh-pages snapshot of 0b3752f (mike layout)"   # 99c9227
git push origin.git 99c9227:refs/heads/gh-pages
git push origin.git sc164-ci-fix:refs/heads/develop      # and the same tree as main
```

The scratch gh-pages tree is byte-identical to the live one: `.nojekyll 404.html 6.0.1
Features Media assets canvas-character-sheet characteristics-element
common-element-fields compendium-downloader counter dev featureblock horizontal-rule
index.html initiative-tracker latest negotiation-tracker search sitemap.xml
sitemap.xml.gz skills-element stamina-bar statblock values-row-element versions.json`

Tooling: throwaway venv, `mike 2.2.0`, `mkdocs 1.6.1`, Python 3.14 (CI runs 3.14.7).

### Checkout replication

Replicated `actions/checkout@v3` exactly as the CI log shows it, so the fetch-refspec
detail above is faithful:

```
git init . ; git remote add origin file://…/origin.git ; git config --local gc.auto 0
#   -> remote.origin.fetch = +refs/heads/*:refs/remotes/origin/*
git -c protocol.version=2 fetch --no-tags --prune --depth=1 origin +<sha>:refs/remotes/origin/develop
git checkout --force -B develop refs/remotes/origin/develop
#   -> refs present: refs/heads/develop, refs/remotes/origin/develop     (no gh-pages)
```

### 1. Control — reproduce the exact CI failure

`mike deploy --push dev` with no fetch step:

```
error: failed to push branch gh-pages to origin:
   ! [rejected]        gh-pages -> gh-pages (fetch first)
```

Byte-for-byte the CI error. Exit 1.

### 2. `develop → dev` with the shipped step — green

```
$ git fetch --depth=1 origin +refs/heads/gh-pages:refs/remotes/origin/gh-pages || true
 * [new branch]      gh-pages   -> origin/gh-pages
$ mike deploy --push dev
mike exit: 0        (no rejection / no error lines)

origin gh-pages: f2f254b Deployed a2fc374 to dev with ProperDocs 1.6.7 and mike 2.2.0
                 99c9227 gh-pages snapshot of 0b3752f (mike layout)     <- real parent, not orphan
versions.json:   [{"version":"dev",...},{"version":"6.0.1","aliases":["latest"]}]
tree:            all 26 top-level entries preserved (latest/, 6.0.1/, dev/, versions.json,
                 and all 14 legacy deep-link redirect dirs)
```

### 3. `main → latest` with the shipped step — green

Same fix, run through the workflow's *literal* main-branch commands:

```
VERSION from manifest.json = 7.0.0
mike deploy --push --update-aliases --alias-type=redirect 7.0.0 latest

versions.json: [{"dev"},{"7.0.0","aliases":["latest"]},{"6.0.1","aliases":[]}]
tree:          6.0.1 and dev both still present alongside the new 7.0.0
latest/:       100644 blob …  latest/404.html  (real redirect blobs, not a symlink entry)
```

Confirms: the alias moved, the older version was **not** clobbered, `dev` survived a `main`
deploy, and `--alias-type=redirect` still materialises real files.

### 4. Bare-form negative control

Under a restricted refspec, `git fetch origin gh-pages --depth=1` left no
`origin/gh-pages` (`refs/heads/develop`, `refs/remotes/origin/develop` only) and the deploy
was rejected `! [rejected] gh-pages -> gh-pages (non-fast-forward)`. This is the evidence
behind the explicit-refspec choice.

### 5. Idempotency

Re-running `mike deploy --push dev` on an unchanged docs tree prints
`warning: nothing changed in commit` and **exits 0** — a re-run or a no-docs-change push
will not red the build.

### 6. YAML lint

```
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
ci.yml parses OK
steps: checkout@v3 / setup-python@v4 / Cache site build / 4× pip install /
       Configure git identity for mike / Fetch gh-pages … /
       Deploy released docs (main → latest)      if: github.ref == 'refs/heads/main'
       Deploy development docs (develop → dev)   if: github.ref == 'refs/heads/develop'
```

Both gates verified present post-edit.

## `actions/checkout@v3` → `@v4`: NOT bumped

Left at `v3`, deliberately, because the stated motivation does not hold. The CI log's
warning is:

```
##[warning]Node.js 20 is deprecated. The following actions target Node.js 20 but are being
forced to run on Node.js 24: actions/cache@v4, actions/checkout@v3, actions/setup-python@v4.
```

`actions/checkout@v4` **also** targets Node 20, so `v3 → v4` would not remove a single line
of that warning — and the warning names three actions, not one. Clearing it means
`checkout@v5` + `setup-python@v5/v6` + a `cache` bump, i.e. a deliberate three-action
currency pass with its own (small but real) behaviour surface, not a mechanical one-liner
riding along on a CI bugfix. Nothing is currently broken by v3; the runner force-upgrades
the Node runtime for it. Recommend a separate follow-up for the action-version pass.

## Not run

Plugin battery (tsc/jest) skipped: the diff is `ci.yml` + `CHANGELOG.md`, zero source,
zero test, zero build-config files touched. The prior SC-164 pass already established the
battery is unaffected by this workflow.

## Concerns / flags for the orchestrator

1. **The develop landing IS the live test.** Landing this to `develop` triggers the fixed
   workflow on the landing commit itself. Expected outcome: green run, and `/dev/` on the
   live site refreshes off its current staleness (it has been stale since 9bb24c3). Worth
   watching `gh run list --branch develop --workflow ci` right after the push, and
   confirming `versions.json` still lists `6.0.1`+`latest` afterwards.
2. **`main` is still the hazard, unchanged by this ticket.** `main`'s tree (6.0.1) still
   carries the OLD `mkdocs gh-deploy --force` `ci.yml`. Any push to `main` before the
   7.0.0 release FF still wipes the mike layout — the footgun recorded in
   `docs/git-workflow.md` on 2026-08-16, which already fired once. This fix does not
   reduce that risk; only branch protection on `main` (or the release FF) does.
3. **`docs/git-workflow.md` line about `ci.yml` staying main-only** was already flagged as
   stale by the previous SC-164 pass and is still stale; out of this branch's scope
   (workspace file, and I was scoped to dse).
4. **`main`'s `manifest.json` still reads `5.1.1`** while its tag is `6.0.1` — the
   pre-existing SC-164 flag. The fixed workflow reads `manifest.json`, so the 7.0.0 release
   must bump it before the FF or `latest` deploys under the wrong number. My scratch run of
   the main path read `7.0.0` from develop's manifest, which is what a release FF from
   develop would carry — so this self-heals at 7.0.0 as previously predicted.
