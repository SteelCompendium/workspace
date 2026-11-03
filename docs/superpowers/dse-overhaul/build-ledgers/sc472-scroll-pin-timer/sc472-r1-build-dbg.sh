#!/bin/bash
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc472-r1-a5d5f8c00377afd62
F=src/framework/host/previewScrollPin.ts
bash "$S/variant.sh" proto-dbg "$S/proto/tree" $F \
 '			if (this.pins.get(scroller) === held && this.redrawDone(scroller, held)) this.release(scroller);' \
 '			const ok = this.pins.get(scroller) === held && this.redrawDone(scroller, held); (window as any).__p472dbg?.push("check", ok, held.started, Array.from(scroller.querySelectorAll(ROOT)).map((r) => r.childElementCount), Array.from(held.sizers0.values()), parseFloat(scroller.querySelector<HTMLElement>(":scope > .markdown-preview-sizer")?.style.minHeight ?? "NaN"), scroller.scrollTop + scroller.clientHeight); if (ok) this.release(scroller);' \
 '					if (!held.started) held.started = this.redrawStarted(held, records);' \
 '					if (!held.started) { held.started = this.redrawStarted(held, records); if (held.started) (window as any).__p472dbg?.push("started"); }'
