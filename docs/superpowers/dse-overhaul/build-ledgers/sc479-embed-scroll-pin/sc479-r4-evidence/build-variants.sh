#!/usr/bin/env bash
# Builds temporary bundle variants into $S/bundles/<name>; restores the source after each. Never committed.
S=/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc479-r4-aa25
D=/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements
PIN=src/framework/host/previewScrollPin.ts
REG=src/framework/registerFrameworkElements.ts
cd "$D" || exit 9
mkdir -p "$S/bundles/head" "$S/bundles/base" "$S/bundles/ctl-noanchor" "$S/bundles/ctl-nohost" "$S/bundles/ctl-scroller"
grab() { cp "$D/main.js" "$D/styles.css" "$D/manifest.json" "$S/bundles/$1/"; }
restore() { git checkout HEAD -- "$PIN" "$REG"; }

# head
npm run build-no-check > "$S/build-head.log" 2>&1 || { echo "head build failed"; exit 1; }
grab head

# base = c558759 versions of the two source files
git show c558759:"$PIN" > "$PIN"
git show c558759:"$REG" > "$REG"
npm run build-no-check > "$S/build-base.log" 2>&1 || { restore; echo "base build failed"; exit 1; }
grab base
restore

# control: host pins without the anchoring rule (the ticket's literal fix)
python3 -I - <<'EOF'
p = '/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements/src/framework/host/previewScrollPin.ts'
s = open(p).read()
old = "held.host ? `${pinRule(held.id, held.px)}\\n${anchorRule(held.id)}` : pinRule(held.id, held.px)"
assert old in s
open(p, 'w').write(s.replace(old, "pinRule(held.id, held.px)", 1))
EOF
npm run build-no-check > "$S/build-ctl-noanchor.log" 2>&1 || { restore; echo "noanchor build failed"; exit 1; }
grab ctl-noanchor
restore

# control: host pin disabled (no modify host pins, writer pin takes the innermost scroller)
python3 -I - <<'EOF'
p = '/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements/src/framework/host/previewScrollPin.ts'
s = open(p).read()
a = "if (!own && !resolveLink) continue;"
b = "for (let up = inner.parentElement?.closest<HTMLElement>('.markdown-preview-view'); up; up = up.parentElement?.closest<HTMLElement>('.markdown-preview-view')) scroller = up;"
assert a in s and b in s
s = s.replace(a, "if (!own) continue;", 1).replace(b, "", 1)
open(p, 'w').write(s)
EOF
npm run build-no-check > "$S/build-ctl-nohost.log" 2>&1 || { restore; echo "nohost build failed"; exit 1; }
grab ctl-nohost
restore

# control: anchoring stop on the scroller (the 84ba65a rule)
python3 -I - <<'EOF2'
p = '/home/scott/code/steelCompendium/worktrees/sc479-embed-scroll-pin/draw-steel-elements/src/framework/host/previewScrollPin.ts'
s = open(p).read()
old = '] .internal-embed { overflow-anchor: none !important; }`'
assert s.count(old) == 1
open(p, 'w').write(s.replace(old, '] { overflow-anchor: none !important; }`', 1))
EOF2
npm run build-no-check > "$S/build-ctl-scroller.log" 2>&1 || { restore; echo "scroller build failed"; exit 1; }
grab ctl-scroller
restore

# leave a head build in the tree
npm run build-no-check > "$S/build-head2.log" 2>&1
git status --short > "$S/build-variants.status"
for v in head base ctl-noanchor ctl-nohost ctl-scroller; do echo "$v $(sha256sum < "$S/bundles/$v/main.js" | cut -c1-12) main.js; $(sha256sum < "$S/bundles/$v/styles.css" | cut -c1-12) styles.css"; done > "$S/bundles.sums"
echo done > "$S/build-variants.rc"
