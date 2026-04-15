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

# Clone all SteelCompendium repos. data-* repos (except data-sdk-npm) go into data/.
clone-all:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"

    # Top-level repos: name -> repo (repo defaults to name if omitted)
    declare -A top_repos=(
        [compendium]=compendium
        [data-gen]=data-gen
        [data-sdk-npm]=data-sdk-npm
        [draw-steel-elements]=draw-steel-elements
        [statblock-adapter-gl-pages]=statblock-adapter-gl-pages
        [steelCompendium.github.io]=SteelCompendium
        [v2]=v2
    )

    # data-* repos that go into data/ (directory name = repo name)
    data_repos=(
        data-adventures-md
        data-bestiary-json
        data-bestiary-md
        data-bestiary-md-dse
        data-bestiary-yaml
        data-md
        data-md-dse
        data-md-dse-linked
        data-md-linked
        data-rules-json
        data-rules-md
        data-rules-md-dse
        data-rules-md-dse-linked
        data-rules-md-linked
        data-rules-yaml
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

switch_repos_to branch:
    #!/usr/bin/env bash
    set -euo pipefail
    root="{{justfile_directory()}}"

    # Check both legacy top-level data-* dirs and new data/ subdirectory
    find "$root" -maxdepth 1 -type d -name "data-*" \
         "$root/data" -maxdepth 1 -type d -name "data-*" \
         2>/dev/null | while read -r data_repo_dpath; do
        # Skip the sdk and data-gen
        basename="$(basename "$data_repo_dpath")"
        if [ "$basename" == "data-sdk-npm" ] || [ "$basename" == "data-gen" ]; then
            echo >&2 "Skipping: $data_repo_dpath"
            continue
        fi
        if [ ! -d "$data_repo_dpath/.git" ]; then
            echo >&2 "Directory is not a git repo: $data_repo_dpath"
            exit 1
        fi
        echo >&2 "Switching git repo to '{{branch}}' branch: $data_repo_dpath"
        git -C "$data_repo_dpath" checkout "{{branch}}"
    done
