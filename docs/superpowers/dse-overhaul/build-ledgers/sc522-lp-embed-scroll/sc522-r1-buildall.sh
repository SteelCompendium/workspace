#!/usr/bin/env bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc522-r1-ab29016d2a82150ae
W=/home/scott/code/steelCompendium/worktrees/sc522-lp-embed-scroll/draw-steel-elements
(cd "$W" && npx tsc --noEmit) > "$S/tsc-proto.log" 2>&1; echo "tsc rc=$?"; head -20 "$S/tsc-proto.log"
bash "$S/build.sh" proto
bash "$S/variant.sh" ctl-nohold src/framework/host/livePreviewScrollHold.ts "		if (view.scrollDOM.scrollTop <= 0) return;
		for (const el of" "		if (view.scrollDOM.scrollTop <= 0 || view) return;
		for (const el of"
bash "$S/variant.sh" ctl-norelease src/framework/host/livePreviewScrollHold.ts "		if (!MO) return;
		let back = false;" "		if (!MO || embed) return;
		let back = false;"
bash "$S/variant.sh" ctl-noclick src/framework/pipeline.ts "		if (!root.classList.contains('interactive-child') && root.closest('.cm-content .internal-embed'))" "		if (root.isConnected && false && root.closest('.cm-content .internal-embed'))"
