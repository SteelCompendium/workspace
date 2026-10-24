import sys
p = sys.argv[1]; s = open(p).read()
a = "if (!own && !resolveLink) continue;"
b = "for (let up = inner.parentElement?.closest<HTMLElement>('.markdown-preview-view'); up; up = up.parentElement?.closest<HTMLElement>('.markdown-preview-view')) scroller = up;"
assert s.count(a) == 1 and s.count(b) == 1
open(p, 'w').write(s.replace(a, "if (!own) continue;", 1).replace(b, "", 1))
