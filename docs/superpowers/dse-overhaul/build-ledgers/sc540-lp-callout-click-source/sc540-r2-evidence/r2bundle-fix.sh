#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc540-r2-review-r1
bash $S/r2mkbundle.sh fixprobe 992375b6 src/framework/pipeline.ts "	root.addEventListener('click', markInEditorWidget, { capture: true });" "	root.addEventListener('click', markInEditorWidget, { capture: true });
	root.addEventListener('click', (event) => {
		if (!root.classList.contains('interactive-child')) return;
		let n = event.target as Node | null;
		if (!n || root.contains(n)) return;
		while (n.parentNode) n = n.parentNode;
		if (n.nodeType === 1) (n as HTMLElement).classList.add('interactive-child');
	});"
