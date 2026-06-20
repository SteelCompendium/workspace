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
# data/ is NOT a repo; it is regenerable scratch the pipeline fills (ARCHITECTURE.md).
# Initialize the workspace: idempotent submodule init + data/ scratch dir.
bootstrap:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    echo >&2 "[INFO] Initializing submodules..."
    git -C "$root" submodule update --init --recursive
    mkdir -p "$root/data"
    echo >&2 "[INFO] Workspace ready (submodules initialized, data/ scratch present)."

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

    # 1. Run the steel-etl pipeline once (shared by API + site)
    cd "$root/steel-etl"
    echo >&2 "[INFO] Running steel-etl gen..."
    go run ./cmd/steel-etl gen --config pipeline.yaml --all
    etl_sha="$(git rev-parse --short HEAD)"
    etl_date="$(date +%Y-%m-%d)"

    # 2. Deploy SCC API to the org site repo
    cd "$root/steelCompendium.github.io"
    echo >&2 "[INFO] Committing API update..."
    git add docs/api/
    git commit -m "chore: update SCC resolution API" || echo >&2 "[INFO] No API changes to commit"
    git push

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

    # 5. Commit and push v2 site
    cd "$root/v2"
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/* mkdocs.yml
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push

    # 7. Commit and push the regenerated data repos (raw `gen --all` output).
    # These are independent published repos (not submodules); step 1's gen wrote
    # them and nothing since touches them, so their working trees are final here.
    # Defensive: skip any data/ dir that isn't a clone (data-beastheart /
    # data-summoner / data-rules-clean are local-only output dirs, no .git) or
    # has no changes to commit.
    for repo in data-bestiary data-rules data-unified; do
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

# Run the steel-etl pipeline and deploy the SCC API to the org site repo.
deploy-api:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"
    cd "$root/steel-etl"
    echo >&2 "[INFO] Running steel-etl gen..."
    go run ./cmd/steel-etl gen --config pipeline.yaml --all
    cd "$root/steelCompendium.github.io"
    echo >&2 "[INFO] Committing API update..."
    git add docs/api/
    git commit -m "chore: update SCC resolution API" || echo >&2 "[INFO] No API changes to commit"
    git push

# Run the steel-etl pipeline and deploy the v2 compendium site.
deploy-v2:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"

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

    # 4. Commit and push
    cd "$root/v2"
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/* mkdocs.yml
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push
