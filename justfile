##################################################
# Imports and Modules
##################################################

##################################################
# Constants and env vars
##################################################

org := "git@github.com:SteelCompendium"

##################################################
# Public Recipes
##################################################

default:
	just --list

# On a fresh machine, prefer cloning with submodules directly:
#   git clone --recurse-submodules git@github.com:SteelCompendium/workspace.git
# Authored repos are submodules; the single published data repo is data-unified
# (the consolidated pipeline output target); the rest of data/ is regenerable scratch.
# Initialize the workspace: submodule init + clone data-unified + data/ scratch (idempotent).
bootstrap:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    echo >&2 "[INFO] Initializing submodules..."
    git -C "$root" submodule update --init --recursive
    mkdir -p "$root/data"
    # Clone the single consolidated published data repo (deploy commits+pushes it).
    if [ ! -e "$root/data/data-unified" ]; then
        echo >&2 "[INFO] Cloning data-unified..."
        git clone "{{org}}/data-unified.git" "$root/data/data-unified"
    elif [ ! -d "$root/data/data-unified/.git" ]; then
        echo >&2 "[WARN] data/data-unified exists but isn't a clone (gen output?); deploy won't push it."
        echo >&2 "[WARN] Remove it and re-run 'just bootstrap' to clone the published repo."
    fi
    echo >&2 "[INFO] Workspace ready (submodules initialized, data-unified cloned, data/ scratch present)."

# Runs `gen --all` ONCE (not once per sub-recipe): the API JSON carries a
# time.Now() "generated" stamp, so a second gen would re-stamp docs/api/*.json
# and leave the org repo dirty with an uncommitted timestamp-only diff. The
# standalone deploy-api / deploy-v2 recipes below each still self-gen.
#
# Run the steel-etl pipeline and deploy both the SCC API and v2 site.
deploy:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"

    # 0. Sync deploy-target submodules to their latest published state. deploy
    # pushes v2 + org-site, so their origin/main can be ahead of the workspace
    # pin; build on top of it (and attach to a branch so pushes aren't detached).
    git -C "$root/steelCompendium.github.io" fetch origin -q
    git -C "$root/steelCompendium.github.io" checkout -q -B main origin/main
    git -C "$root/v2" fetch origin -q
    git -C "$root/v2" checkout -q -B main origin/main
    # data-unified is a plain clone (not a submodule) that deploy pushes; reset it
    # to origin/main so gen writes on top of the latest published state (ff push).
    if [ -d "$root/data/data-unified/.git" ]; then
        git -C "$root/data/data-unified" fetch origin -q
        git -C "$root/data/data-unified" reset --hard origin/main -q
    fi

    # 1. Run the steel-etl pipeline once (shared by API + site)
    cd "$root/steel-etl"
    echo >&2 "[INFO] Running steel-etl gen..."
    go run ./cmd/steel-etl gen --config pipeline.yaml --all
    etl_sha="$(git rev-parse --short HEAD)"
    etl_date="$(date +%Y-%m-%d)"

    # 2. Deploy SCC API to the org site repo. (Submodule is detached at the
    # pinned commit, so push via explicit refspec onto its branch.)
    cd "$root/steelCompendium.github.io"
    echo >&2 "[INFO] Committing API update..."
    git add docs/api/
    git commit -m "chore: update SCC resolution API" || echo >&2 "[INFO] No API changes to commit"
    git push origin HEAD:main

    # 3. Stamp the steel-etl pipeline version into mkdocs.yml extra.* fields.
    # mkdocs.yml is committed below so CI's `mkdocs gh-deploy` (which builds the
    # committed tree, not this working copy) sees the etl stamp; CI fills
    # extra.site_* from $GITHUB_SHA just before deploy.
    cd "$root/v2"
    yq -i ".extra.etl_sha = \"${etl_sha}\" | .extra.etl_date = \"${etl_date}\"" mkdocs.yml

    # 4. Build MkDocs docs directory from steel-etl output
    echo >&2 "[INFO] Running steel-etl site..."
    cd "$root/steel-etl"
    go run ./cmd/steel-etl site --config "$root/v2/site.yaml"

    # 5. Commit and push v2 site (detached submodule → push via refspec)
    cd "$root/v2"
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/* mkdocs.yml
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push origin HEAD:main

    # 7. Commit and push the regenerated data repo (raw `gen --all` output).
    # The single consolidated `data-unified` repo is an independent published
    # repo (not a submodule); step 1's gen wrote it and nothing since touches it,
    # so its working tree is final here. Defensive: skip if it isn't a clone or
    # has no changes to commit.
    for repo in data-unified; do
        dir="$root/data/$repo"
        if [ ! -d "$dir/.git" ]; then
            echo >&2 "[INFO] $repo is not a git clone, skipping"
            continue
        fi
        echo >&2 "[INFO] Committing $repo..."
        git -C "$dir" add -A
        git -C "$dir" commit -m "chore: update generated data (steel-etl $etl_sha)" \
            || { echo >&2 "[INFO] No $repo changes to commit"; continue; }
        git -C "$dir" push
    done

    # 8. Bump submodule pointers in the workspace superproject. deploy pushed
    # new commits into the v2 and org-site submodules; record them so main pins
    # the published state. (steel-etl included in case it was bumped manually.)
    cd "$root"
    git add steel-etl v2 steelCompendium.github.io
    git commit -m "chore: bump submodule pointers (deploy ${etl_sha})" \
        || echo >&2 "[INFO] No submodule pointer changes to commit"
    git push

# Run the steel-etl pipeline and deploy the SCC API to the org site repo.
deploy-api:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    # Sync the org-site submodule to its latest published state (deploy pushes it).
    git -C "$root/steelCompendium.github.io" fetch origin -q
    git -C "$root/steelCompendium.github.io" checkout -q -B main origin/main
    cd "$root/steel-etl"
    echo >&2 "[INFO] Running steel-etl gen..."
    go run ./cmd/steel-etl gen --config pipeline.yaml --all
    etl_sha="$(git rev-parse --short HEAD)"
    cd "$root/steelCompendium.github.io"
    echo >&2 "[INFO] Committing API update..."
    git add docs/api/
    git commit -m "chore: update SCC resolution API" || echo >&2 "[INFO] No API changes to commit"
    git push origin HEAD:main
    # Bump the org-site submodule pointer in the workspace superproject.
    cd "$root"
    git add steelCompendium.github.io
    git commit -m "chore: bump org-site submodule pointer (deploy-api ${etl_sha})" \
        || echo >&2 "[INFO] No org-site pointer change to commit"
    git push

# Run the steel-etl pipeline and deploy the v2 compendium site.
deploy-v2:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    # Sync the v2 submodule to its latest published state (deploy pushes it).
    git -C "$root/v2" fetch origin -q
    git -C "$root/v2" checkout -q -B main origin/main

    # 1. Run steel-etl pipeline
    cd "$root/steel-etl"
    echo >&2 "[INFO] Running steel-etl gen..."
    go run ./cmd/steel-etl gen --config pipeline.yaml --all
    etl_sha="$(git rev-parse --short HEAD)"
    etl_date="$(date +%Y-%m-%d)"

    # 2. Stamp the steel-etl pipeline version into mkdocs.yml extra.* fields.
    # mkdocs.yml is committed below so CI's `mkdocs gh-deploy` (which builds the
    # committed tree, not this working copy) sees the etl stamp; CI fills
    # extra.site_* from $GITHUB_SHA just before deploy.
    cd "$root/v2"
    yq -i ".extra.etl_sha = \"${etl_sha}\" | .extra.etl_date = \"${etl_date}\"" mkdocs.yml

    # 3. Build MkDocs docs directory from steel-etl output
    echo >&2 "[INFO] Running steel-etl site..."
    cd "$root/steel-etl"
    go run ./cmd/steel-etl site --config "$root/v2/site.yaml"

    # 4. Commit and push (detached submodule → push via refspec)
    cd "$root/v2"
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/* mkdocs.yml
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push origin HEAD:main

    # 5. Bump the v2 submodule pointer in the workspace superproject.
    cd "$root"
    git add v2
    git commit -m "chore: bump v2 submodule pointer (deploy-v2 ${etl_sha})" \
        || echo >&2 "[INFO] No v2 pointer change to commit"
    git push

# Submodules are branched (not left detached) so commits are never lost.
# See docs/worktrees-and-submodules.md.
# Create an isolated env: workspace worktree at ../worktrees/<name>, all submodules on branch <name>, scratch data/.
wt-new name:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    name="{{name}}"
    wtroot="$(cd "$root/.." && pwd)/worktrees"
    wt="$wtroot/$name"
    if [ -e "$wt" ]; then echo >&2 "[ERR] Env already exists: $wt"; exit 1; fi
    mkdir -p "$wtroot"
    git -C "$root" worktree add -b "$name" "$wt"
    # Init submodules referencing the main checkout's object stores so we don't
    # re-download from origin (near-instant, offline-capable). git otherwise
    # clones each worktree's submodules fresh into .git/worktrees/<wt>/modules.
    git -C "$wt" config -f .gitmodules --get-regexp 'submodule\..*\.path' | awk '{print $2}' | while read -r sm; do
        ref="$root/.git/modules/$sm"
        if [ -d "$ref" ]; then
            git -C "$wt" submodule update --init --reference "$ref" -- "$sm"
        else
            git -C "$wt" submodule update --init -- "$sm"
        fi
    done
    # Branch every submodule (not detached) so commits are never lost.
    git -C "$wt" submodule foreach "git checkout -b '$name' 2>/dev/null || git checkout '$name'"
    mkdir -p "$wt/data"
    echo >&2 "[INFO] Environment ready: $wt (branch: $name)"

# Refuses if the superproject or any submodule has uncommitted changes.
# Tear down a wt-new env and delete its per-env branches.
wt-rm name:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    name="{{name}}"
    wt="$(cd "$root/.." && pwd)/worktrees/$name"
    if [ ! -d "$wt" ]; then echo >&2 "[ERR] No such env: $wt"; exit 1; fi
    if [ -n "$(git -C "$wt" status --porcelain)" ]; then
        echo >&2 "[ERR] Uncommitted changes in $name (superproject); commit or discard first."; exit 1
    fi
    if ! git -C "$wt" submodule foreach 'test -z "$(git status --porcelain)"' >/dev/null 2>&1; then
        echo >&2 "[ERR] Uncommitted changes in a submodule of $name; commit or discard first."; exit 1
    fi
    # `git worktree remove` refuses worktrees containing submodules, so remove
    # the tree directly then prune the admin entry. This also drops the per-env
    # submodule git dirs (and their <name> branches) under .git/worktrees/<name>.
    rm -rf "$wt"
    git -C "$root" worktree prune
    git -C "$root" branch -D "$name" 2>/dev/null || true
    echo >&2 "[INFO] Removed env: $name"

# Show what an env has that isn't yet on its tracked branches.
# Report an env's submodules ahead of tracked branches + pending pointer bumps.
wt-status name:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    name="{{name}}"
    wt="$(cd "$root/.." && pwd)/worktrees/$name"
    if [ ! -d "$wt" ]; then echo >&2 "[ERR] No such env: $wt"; exit 1; fi
    echo "== submodules ahead of their tracked branch =="
    git -C "$wt" submodule foreach '
        tracked="$(git -C "$toplevel" config -f .gitmodules submodule.$name.branch || echo main)"
        ahead="$(git rev-list --count origin/$tracked..HEAD 2>/dev/null || echo "?")"
        echo "  $name: $ahead commit(s) ahead of origin/$tracked"' || true
    echo "== superproject pending pointer bumps =="
    git -C "$wt" status --porcelain -- . | grep -E '^ M|^M ' || echo "  (none)"

# Submodules end in detached HEAD at the pinned commit -- normal for consuming a
# version; branch (via wt-new) only when editing.
# Sync this checkout to origin: pull superproject (if tracking) + update submodules.
sync:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    cd "$root"
    if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
        echo >&2 "[INFO] Pulling superproject..."
        git pull --ff-only
    else
        echo >&2 "[INFO] No upstream for current branch; skipping superproject pull."
    fi
    echo >&2 "[INFO] Updating submodules to pinned commits..."
    git submodule update --init --recursive
    echo >&2 "[INFO] In sync."

# Run from the main checkout. PUBLISHES: pushes submodule work to origin and
# pushes superproject main. Requires the env (and main checkout) to be clean.
# Land an env's cross-repo work: push each touched submodule's <name> branch to its tracked branch, then merge+push superproject main.
wt-finish name:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    name="{{name}}"
    wt="$(cd "$root/.." && pwd)/worktrees/$name"
    if [ ! -d "$wt" ]; then echo >&2 "[ERR] No such env: $wt"; exit 1; fi
    if [ -n "$(git -C "$wt" status --porcelain)" ]; then
        echo >&2 "[ERR] Commit or discard changes in $name (incl. superproject pointer bumps) first."; exit 1
    fi
    if [ -n "$(git -C "$root" status --porcelain)" ]; then
        echo >&2 "[ERR] Main checkout is dirty; commit/stash before landing."; exit 1
    fi
    # 1. Push each ahead submodule's <name> branch onto its tracked branch on origin.
    git -C "$wt" config -f .gitmodules --get-regexp 'submodule\..*\.path' | awk '{print $2}' | while read -r sm; do
        tracked="$(git -C "$wt" config -f .gitmodules "submodule.$sm.branch" || echo main)"
        ahead="$(git -C "$wt/$sm" rev-list --count "origin/$tracked..$name" 2>/dev/null || echo 0)"
        if [ "$ahead" -gt 0 ]; then
            echo >&2 "[INFO] Pushing $sm: $name -> origin/$tracked ($ahead commit(s))"
            git -C "$wt/$sm" push origin "$name:$tracked"
        fi
    done
    # 2. Land the superproject env branch on main and push. submodule update
    # fetches the just-pushed commits from origin for the new pins.
    echo >&2 "[INFO] Merging superproject $name -> main"
    git -C "$root" checkout main
    git -C "$root" merge --no-ff "$name" -m "merge $name into main"
    git -C "$root" submodule update --init --recursive
    git -C "$root" push origin main
    echo >&2 "[INFO] Landed and pushed. Remove the env with: just wt-rm $name"
