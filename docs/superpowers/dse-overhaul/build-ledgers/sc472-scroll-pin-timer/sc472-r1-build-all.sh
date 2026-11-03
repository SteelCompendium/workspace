#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
B=src/framework/host/redrawBackstop.ts
bash "$S/tsc-proto.sh" "$S/proto/tree" || exit 7
bash "$S/mkbundle.sh" proto "$S/proto/tree"
bash "$S/variant.sh" proto-f0 "$S/proto/tree" $B 'export const PIN_BACKSTOP_FRAMES = 30;' 'export const PIN_BACKSTOP_FRAMES = 0;' 'export const BACKSTOP_QUIET_FRAMES = 2;' 'export const BACKSTOP_QUIET_FRAMES = 0;'
bash "$S/variant.sh" proto-plain "$S/proto/tree" $B 'export const PIN_BACKSTOP_FRAMES = 30;' 'export const PIN_BACKSTOP_FRAMES = 0;' 'export const BACKSTOP_QUIET_FRAMES = 2;' 'export const BACKSTOP_QUIET_FRAMES = 0;' '!this.busy(this.quiet)) return this.done();' 'true) return this.done();' '		if (!this.busy(Infinity)) this.done();' '		this.done();'
