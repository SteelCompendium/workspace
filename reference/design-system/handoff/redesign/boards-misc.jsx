/* Reasoning brief · 8-level hierarchy specimen · mobile board */

function Brief() {
  return (
    <div style={{padding:"34px 38px",boxSizing:"border-box",fontFamily:"var(--font-body)",color:"var(--fg)",background:"var(--bg)",minHeight:"100%"}}>
      <div className="rd-eyebrow" style={{marginBottom:12}}>Redesign brief · read me first</div>
      <h2 style={{fontFamily:"var(--font-display)",textTransform:"uppercase",fontSize:30,color:"var(--sc-steel-lighter)",margin:"0 0 14px",lineHeight:1}}>Making it beautiful<br/>without art</h2>
      <p style={{fontSize:14.5,lineHeight:1.65,color:"var(--fg-light)",maxWidth:"54ch"}}>
        The source art is off-limits, so every bit of richness here is <b style={{color:"var(--fg)"}}>pure CSS</b> — brushed-steel
        gradients, beveled & embossed edges, a faint noise grain, the ◆ motif, big Beaufort
        type, and clean line icons. It all stays light enough to live inside Material-for-MkDocs.
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:20}}>
        {[
          ["Three directions","Forged Plate (tactile & heavy) · Heroic Editorial (type-led & airy) · Tactical Grid (dense & tool-like). Mix and match — they share one steel language."],
          ["Rich cards","Index pages stop being name lists: each entry shows stats, type, and its signature ability at a glance."],
          ["Clear hierarchy","An 8-level header scale + nesting rails make siblings vs. children — and trait→ability parentage — unmistakable."],
          ["Power roll untouched","Kept exactly as today, with the Draw Steel tier glyphs."],
          ["Room to grow","Every card & page has a quiet hover toolbar for copy / save / export. Mobile-first grids."]
        ].map(([h,b]) => (
          <div key={h} style={{borderLeft:"3px solid var(--accent)",paddingLeft:14}}>
            <div style={{fontFamily:"var(--font-subhead)",fontSize:16,color:"var(--fg)"}}>{h}</div>
            <div style={{fontSize:13,color:"var(--fg-light)",lineHeight:1.5,marginTop:2}}>{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PowerRoll() {
  const G = window.RD.tierGlyph;
  const rows = [["low","5 + I damage; push 1"],["mid","8 + I damage; push 2"],["high","11 + I damage; push 3"]];
  return (
    <div>
      <div className="power-roll-header">Power Roll + Intuition</div>
      <div className="power-roll-tiers">
        {rows.map(([t,e]) => (
          <div className="power-roll-row" key={t}>
            <span className={"power-roll-badge " + t}>{G[t]}</span>
            <span className="power-roll-effect">{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hierarchy() {
  return (
    <div className="rd-page">
      <div className="hx">
        {/* full 8-level reference ladder */}
        <div style={{border:"1px solid var(--fg-lightest)",borderRadius:8,padding:"14px 16px",marginBottom:8}}>
          <div className="rd-eyebrow" style={{marginBottom:10}}>The 8-level ladder</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <div className="hx-l1" style={{fontSize:30}}>L1 · Class</div>
            <div className="hx-l2" style={{fontSize:22,margin:"6px 0 2px"}}>L2 · Major Section</div>
            <div className="hx-l3" style={{fontSize:19,margin:"4px 0 0"}}>L3 · Subsection</div>
            <div className="hx-l4" style={{fontSize:17,margin:"4px 0 0"}}>L4 · Feature Group</div>
            <div className="hx-l5" style={{margin:"2px 0 0"}}>L5 · Feature</div>
            <div className="hx-l6" style={{margin:"2px 0 0"}}>L6 · Sub-feature</div>
            <div className="hx-l7" style={{margin:"4px 0 0"}}>L7 · Ability Label</div>
            <div><span className="hx-l8">L8 · Run-in heading.</span> <span style={{fontSize:14,color:"var(--fg-light)"}}>Flows straight into body text on the same line.</span></div>
          </div>
        </div>

        <div className="hx-legend">
          <span><span className="hx-swatch" style={{background:"var(--fg-lightest)"}}></span> sibling (same rail)</span>
          <span><span className="hx-swatch" style={{background:"rgba(77,184,199,.45)"}}></span> child of the block above</span>
        </div>

        {/* realistic excerpt */}
        <div className="hx-l1">Conduit</div>
        <div className="hx-l2">Piety</div>
        <p>Your deity grants you a Heroic Resource called <b style={{color:"var(--fg)"}}>piety</b>, letting you heal and empower allies and unleash holy power upon your foes.</p>

        <div className="hx-l3">Piety in Combat</div>
        <p>At the start of an encounter you gain piety equal to your Victories. At the start of each of your turns, you gain 1d3 piety.</p>
        <div className="hx-l3">Piety Outside of Combat</div>
        <p>You can't gain piety outside combat, but you can use abilities that cost piety without spending it.</p>

        <div className="hx-l2">1st-Level Features</div>
        <div className="hx-l3">Deity and Domains</div>
        <p>Choose a god or saint your character reveres, then pick two domains from their portfolio.</p>

        {/* parent trait that OWNS child abilities — nesting made obvious */}
        <div className="hx-parent">
          <div className="hx-ptag"><window.Icon name="star" size={12} /> Domain Feature · Trait</div>
          <div className="hx-pname">Ray of Wrath</div>
          <p style={{margin:"6px 0 0"}}>While you have a domain, you gain the following triggered ability. <em>Its child abilities belong to this trait:</em></p>

          <div className="hx-children d1">
            <div className="hx-l7">Ability · child of Ray of Wrath</div>
            <div className="hx-ability">
              <div className="a-name">Wrathful Bolt</div>
              <div className="a-flavor">Divine light lances from your outstretched hand.</div>
              <table><tbody>
                <tr><td><b>Ranged, Magic</b></td><td><b>Main action</b></td></tr>
                <tr><td><b>📏 Ranged 10</b></td><td><b>🎯 One creature</b></td></tr>
              </tbody></table>
              <PowerRoll />
              <div className="a-effect"><b>Effect:</b> A target reduced to 0 Stamina is also knocked prone.</div>
            </div>

            <div className="hx-children d2" style={{marginTop:8}}>
              <div className="hx-l7" style={{color:"var(--fg-light)"}}>Enhancement · child of Wrathful Bolt</div>
              <p style={{margin:"2px 0"}}>Spend 2 piety: the bolt also deals 2 fire damage to each enemy adjacent to the target.</p>
            </div>
          </div>
        </div>

        <p style={{marginTop:18,fontFamily:"var(--font-mono)",fontSize:11.5,color:"var(--fg-lighter)"}}>↑ Indented teal rails + the corner tick show exactly where a child block begins and which parent owns it.</p>
      </div>
    </div>
  );
}

function Mobile() {
  const k = window.RD.kits[0];
  const cats = window.RD.categories;
  return (
    <div className="rd-page" style={{padding:"0 0 24px"}}>
      <div className="tg-bar" style={{padding:"12px 16px"}}>
        <div className="tg-search on" style={{padding:"8px 11px",fontSize:13}}><window.Icon name="search" size={16} /><span>Search…</span></div>
      </div>
      <div className="tg-meta" style={{padding:"12px 16px 4px"}}><h2 style={{fontSize:24}}>Kits</h2></div>
      <div style={{padding:"4px 16px",display:"flex",flexDirection:"column",gap:12}}>
        <window.KitCard k={k} />
        <window.KitCard k={window.RD.kits[2]} />
      </div>
      <div className="tg-meta" style={{padding:"18px 16px 4px"}}><h2 style={{fontSize:24}}>Browse</h2></div>
      <div style={{padding:"4px 16px",display:"flex",flexDirection:"column",gap:8}}>
        {cats.slice(0,4).map(c => (
          <div className="kc" key={c.id} style={{padding:"11px 13px"}}>
            <div className="kc-top">
              <div className="fa-stamp" style={{width:34,height:34}}><window.Icon name={c.icon} size={17} /></div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <span style={{fontFamily:"var(--font-subhead)",fontSize:17,color:"var(--fg)"}}>{c.title}</span>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--accent)"}}>{c.count}</span>
                </div>
              </div>
              <span className="he-go"><window.Icon name="chevron" size={16} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { Brief, Hierarchy, Mobile });
