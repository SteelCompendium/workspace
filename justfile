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
        data-rules
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
