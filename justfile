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

# Clone SteelCompendium repos needed for development.
# Local-only output dirs (data/data-unified, data/data-rules-clean) are created
# by the pipeline, not cloned.
clone-all:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"

    # Top-level repos: dir -> GitHub repo name
    declare -A top_repos=(
        [steel-etl]=steel-etl
        [data-gen]=data-gen
        [data-sdk-npm]=data-sdk-npm
        [draw-steel-elements]=draw-steel-elements
        [steelCompendium.github.io]=SteelCompendium
        [v2]=v2
    )

    for dir in "${!top_repos[@]}"; do
        repo="${top_repos[$dir]}"
        target="$root/$dir"
        if [ -d "$target/.git" ]; then
            echo "Already exists: $dir"
        else
            echo "Cloning $repo -> $dir"
            git clone "{{org}}/${repo}.git" "$target"
        fi
    done

    # Consolidated data repos (pipeline output targets)
    data_repos=(
        data-bestiary
        data-rules
        data-unified
    )

    mkdir -p "$root/data"
    for repo in "${data_repos[@]}"; do
        target="$root/data/$repo"
        if [ -d "$target/.git" ]; then
            echo "Already exists: data/$repo"
        else
            echo "Cloning $repo -> data/$repo"
            git clone "{{org}}/${repo}.git" "$target"
        fi
    done

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

    # 3. Embed version info in mkdocs.yml
    cd "$root/v2"
    data_version="steel-etl <a href=\"https://github.com/SteelCompendium/steel-etl/commit/${etl_sha}\">${etl_sha}</a> (${etl_date})"
    sed -i "s|DATA_VERSION|${data_version}|g" mkdocs.yml

    # 4. Build MkDocs docs directory from steel-etl output
    echo >&2 "[INFO] Running steel-etl site..."
    cd "$root/steel-etl"
    go run ./cmd/steel-etl site --config "$root/v2/site.yaml"

    # 5. Transform index pages into grid layouts
    cd "$root/v2"
    if [ -d "docs/Browse" ] && [ -f "scripts/transform_indexes.py" ]; then
        echo >&2 "[INFO] Transforming index pages..."
        python3 scripts/transform_indexes.py docs/Browse
    fi

    # 6. Commit and push v2 site
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/*
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push

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

    # 2. Embed version info in mkdocs.yml
    cd "$root/v2"
    data_version="steel-etl <a href=\"https://github.com/SteelCompendium/steel-etl/commit/${etl_sha}\">${etl_sha}</a> (${etl_date})"
    sed -i "s|DATA_VERSION|${data_version}|g" mkdocs.yml

    # 3. Build MkDocs docs directory from steel-etl output
    echo >&2 "[INFO] Running steel-etl site..."
    cd "$root/steel-etl"
    go run ./cmd/steel-etl site --config "$root/v2/site.yaml"

    # 4. Transform index pages into grid layouts
    cd "$root/v2"
    if [ -d "docs/Browse" ] && [ -f "scripts/transform_indexes.py" ]; then
        echo >&2 "[INFO] Transforming index pages..."
        python3 scripts/transform_indexes.py docs/Browse
    fi

    # 5. Commit and push
    echo >&2 "[INFO] Committing v2 site update..."
    git add docs/*
    git commit -m "chore: update v2 site content (steel-etl $etl_sha)" || echo >&2 "[INFO] No v2 changes to commit"
    git push
