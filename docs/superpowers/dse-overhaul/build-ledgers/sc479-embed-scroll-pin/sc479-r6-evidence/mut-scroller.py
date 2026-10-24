import sys
p = sys.argv[1]; s = open(p).read()
old = '] .internal-embed { overflow-anchor: none !important; }`'
assert s.count(old) == 1
open(p, 'w').write(s.replace(old, '] { overflow-anchor: none !important; }`', 1))
