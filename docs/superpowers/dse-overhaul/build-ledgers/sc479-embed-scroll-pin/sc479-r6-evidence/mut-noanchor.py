import sys
p = sys.argv[1]; s = open(p).read()
old = "held.host ? `${pinRule(held.id, held.px)}\\n${anchorRule(held.id)}` : pinRule(held.id, held.px)"
assert s.count(old) == 1
open(p, 'w').write(s.replace(old, "pinRule(held.id, held.px)", 1))
