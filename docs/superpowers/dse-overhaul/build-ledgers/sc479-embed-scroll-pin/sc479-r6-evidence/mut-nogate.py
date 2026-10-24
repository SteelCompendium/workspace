import sys
p = sys.argv[1]
s = open(p).read()
# control "embed stop with no geometry gate" (= e6b02ca behaviour): the gate always says yes
old = "function embedStopWanted(scroller: HTMLElement): boolean {\n"
assert s.count(old) == 1
open(p, 'w').write(s.replace(old, old + "\treturn true;\n", 1))
