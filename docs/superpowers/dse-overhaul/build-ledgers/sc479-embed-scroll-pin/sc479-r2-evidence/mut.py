import subprocess, sys, shutil, re
D = '/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements'
SRC = D + '/src/framework/host/previewScrollPin.ts'
REG = D + '/src/framework/registerFrameworkElements.ts'
OUT = '/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r2-1111/'

MUTS = [
    ('M01 no host pins at all (views of another note skipped)', SRC, "if (!own && !resolveLink) continue;", "if (!own) continue;"),
    ('M02 every other Reading view is pinned (embed test dropped)', SRC, ": !embedsBlockOf(scroller, path, view.file.path, resolveLink!)) continue;", ": false) continue;"),
    ('M03 subpath not stripped', SRC, ".split('#')[0];\n\t\tconst parent", None),  # placeholder replaced below
    ('M04 nested embeds not reached', SRC, "if (embed.querySelector('[data-dse-element]') && resolved(embed) === path) return true;", "if (embed.parentElement?.closest('.internal-embed')) continue;\n\t\tif (embed.querySelector('[data-dse-element]') && resolved(embed) === path) return true;"),
    ('M05 nested embed resolved from the host path', SRC, "(parent && resolved(parent)) || hostPath", "hostPath"),
    ('M06 writer pin takes the innermost scroller', SRC, "for (let up = inner.parentElement?.closest<HTMLElement>('.markdown-preview-view'); up; up = up.parentElement?.closest<HTMLElement>('.markdown-preview-view')) scroller = up;", ""),
    ('M07 writer pin through the embed is not a host pin', SRC, "this.pinScroller(scroller, scroller !== inner);", "this.pinScroller(scroller, false);"),
    ('M08 anchoring stop on every pin', SRC, "held.host ? `${pinRule", "true ? `${pinRule"),
    ('M09 anchoring stop never written', SRC, "held.host ? `${pinRule", "false ? `${pinRule"),
    ('M10 own pin upgraded to host keeps the sizer-only rule', SRC, "\t\t\t\texisting.style.textContent = ruleText(existing);\n", ""),
    ('M11 floor raise drops the anchoring stop', SRC, "held.px = px;\n\t\theld.style.textContent = ruleText(held);", "held.px = px;\n\t\theld.style.textContent = pinRule(held.id, held.px);"),
    ('M12 sizer rule child combinator -> descendant', SRC, '] > .markdown-preview-sizer { min-height', '] .markdown-preview-sizer { min-height'),
    ('M13 unresolved enclosing embed has no fallback', SRC, "(parent && resolved(parent)) || hostPath", "parent ? (resolved(parent) ?? '') : hostPath"),
    ('M14 non-DSE embed counts', SRC, "if (embed.querySelector('[data-dse-element]') && resolved(embed) === path) return true;", "if (resolved(embed) === path) return true;"),
    ('M15 resolver not passed by registerFrameworkElements', REG, "scrollPin.pinReadingViewsOf(plugin.app.workspace, file.path, resolveLink)", "scrollPin.pinReadingViewsOf(plugin.app.workspace, file.path)"),
    ('M16 release() leaves the style behind', SRC, "\t\tscroller.removeAttribute(PIN_ATTR);\n\t\theld.style.remove();", "\t\tscroller.removeAttribute(PIN_ATTR);"),
    ('M17 releaseAll() does nothing', SRC, "for (const scroller of [...this.pins.keys()]) this.release(scroller);", ""),
    ('M18 TTL does not release a re-pinned host', SRC, "existing.timer = win.setTimeout(() => this.release(scroller), PIN_TTL_MS);", "existing.timer = win.setTimeout(() => undefined, PIN_TTL_MS);"),
]

results = []
for name, path, old, new in MUTS:
    if name.startswith('M03'):
        old, new = ".split('#')[0];\n\t\tconst resolvedPath", ".split('#')[0];\n\t\tconst resolvedPath"
        txt = open(path).read()
        old = "const linkpath = (embed.getAttribute('src') ?? '').split('#')[0];"
        new = "const linkpath = (embed.getAttribute('src') ?? '');"
    orig = open(path).read()
    if old not in orig:
        results.append((name, 'MUTATION DID NOT APPLY'))
        continue
    open(path, 'w').write(orig.replace(old, new, 1))
    try:
        r = subprocess.run(['npx', 'jest', 'test/dom/framework/previewScrollPin.test.ts', '--silent'], cwd=D, capture_output=True, text=True)
        out = r.stdout + r.stderr
        failed = re.findall(r'^\s+[●✕]\s+(.*)$', out, re.M)
        m = re.search(r'Tests:\s+(.*)', out)
        results.append((name, ('KILLED' if r.returncode != 0 else 'SURVIVED') + ' | ' + (m.group(1) if m else '?')))
    finally:
        open(path, 'w').write(orig)
with open(OUT + 'mutations.txt', 'w') as f:
    for n, r in results:
        f.write(f'{n}: {r}\n')
print(open(OUT + 'mutations.txt').read())
