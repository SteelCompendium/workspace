/* Kit-index artboards — the priority "stat-at-a-glance" cards, 3 directions */

function KitOps() {
  return (
    <div className="kc-ops">
      <span className="kc-op" title="Copy permalink"><window.Icon name="link" size={14} /></span>
      <span className="kc-op" title="Save"><window.Icon name="bookmark" size={14} /></span>
      <span className="kc-op" title="Export"><window.Icon name="download" size={14} /></span>
    </div>
  );
}

/* Full rich card (Forged / Tactical share this; Heroic gets its own) */
function KitCard({ k, compact }) {
  return (
    <div className="kc" style={compact ? {padding:"13px 15px"} : null}>
      <KitOps />
      <div className="kc-top">
        <span className={"kc-type " + k.klass}>{k.type}</span>
        <span className="kc-icon"><window.Icon name={k.klass === "caster" ? "wand" : "sword"} size={18} /></span>
      </div>
      <div className="kc-name">{k.name}</div>
      <div className="kc-equip">{k.armor} armor · {k.weapon} weapon{k.real ? "" : ""}</div>
      <div className="kc-stats">
        <div className="kc-stat"><div className="v">{k.stamina}</div><div className="l">Stam</div></div>
        <div className="kc-stat"><div className="v">{k.speed}</div><div className="l">Speed</div></div>
        <div className="kc-stat"><div className="v">{k.stability}</div><div className="l">Stab</div></div>
        <div className="kc-stat dmg"><div className="v">{k.melee.split("/")[0]}</div><div className="l">Dmg</div></div>
      </div>
      <div className="kc-sig">
        <span className={"kc-dot dot-" + k.sigType}></span>
        <div>
          <div className="kc-sig-label">Signature</div>
          <div className="kc-sig-name">{k.sig}</div>
        </div>
        <span className="kc-kw">{k.keywords}</span>
      </div>
    </div>
  );
}

/* ── A · FORGED PLATE index ─────────────────────────────────── */
function KitsForged() {
  const kits = window.RD.kits;
  return (
    <div className="rd-page fa-wrap">
      <div className="rd-masthead fa-head" style={{padding:"26px 40px 22px"}}>
        <div className="fa-stamp" style={{width:48,height:48}}><window.Icon name="package" size={24} /></div>
        <div>
          <div className="fa-kicker">Browse · Kits</div>
          <h1 className="fa-title" style={{fontSize:42}}>Kits</h1>
        </div>
        <div style={{marginLeft:"auto",fontFamily:"var(--font-mono)",fontSize:13,color:"var(--fg-lighter)"}}>25 loadouts</div>
      </div>
      <div className="fa-grid" style={{padding:"18px 40px 0"}}>
        {kits.map(k => <KitCard k={k} key={k.name} />)}
      </div>
    </div>
  );
}

/* ── B · HEROIC EDITORIAL index ─────────────────────────────── */
function KitRowHeroic({ k, i }) {
  return (
    <div className="kc" style={{padding:"20px 24px"}}>
      <KitOps />
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <span style={{fontFamily:"var(--font-mono)",fontSize:13,color:"var(--fg-lighter)"}}>{String(i+1).padStart(2,"0")}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"baseline",gap:12}}>
            <span className={"kc-type " + k.klass}>{k.type}</span>
            <span style={{fontFamily:"var(--font-display)",textTransform:"uppercase",fontSize:30,color:"var(--fg)",textShadow:"var(--rd-emboss)"}}>{k.name}</span>
          </div>
          <div style={{display:"flex",gap:18,marginTop:8,fontFamily:"var(--font-mono)",fontSize:12.5,color:"var(--fg-light)",flexWrap:"wrap"}}>
            <span>STAM <b style={{color:"var(--sc-steel-lighter)"}}>{k.stamina}</b></span>
            <span>SPD <b style={{color:"var(--sc-steel-lighter)"}}>{k.speed}</b></span>
            <span>STAB <b style={{color:"var(--sc-steel-lighter)"}}>{k.stability}</b></span>
            <span>DMG <b style={{color:"var(--accent)"}}>{k.melee}</b></span>
            <span style={{color:"var(--fg-lighter)"}}>· {k.armor} armor / {k.weapon} weapon</span>
          </div>
        </div>
        <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:10}}>
          <span className={"kc-dot dot-" + k.sigType}></span>
          <div>
            <div className="kc-sig-label">Signature</div>
            <div style={{fontFamily:"var(--font-subhead)",fontSize:17,color:"var(--fg)"}}>{k.sig}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
function KitsHeroic() {
  const kits = window.RD.kits;
  return (
    <div className="rd-page he-wrap">
      <div className="he-hero" style={{padding:"34px 48px 22px"}}>
        <div className="rd-eyebrow">Browse · Kits</div>
        <h1 className="he-h1" style={{fontSize:60}}>Kits</h1>
        <p className="he-lead" style={{marginTop:14}}>Equipment loadouts that shape how your hero fights — pick a martial, caster, or hybrid kit.</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12,padding:"18px 48px 0"}}>
        {kits.map((k,i) => <KitRowHeroic k={k} i={i} key={k.name} />)}
      </div>
    </div>
  );
}

/* ── C · TACTICAL GRID index ────────────────────────────────── */
function KitsTactical() {
  const kits = window.RD.kits;
  return (
    <div className="rd-page">
      <div className="tg-bar">
        <div className="tg-search"><window.Icon name="search" size={18} /><span>Filter kits…</span></div>
        <div className="tg-facets">
          <span className="tg-facet active">All</span>
          <span className="tg-facet">Martial</span>
          <span className="tg-facet">Caster</span>
          <span className="tg-facet">Hybrid</span>
        </div>
      </div>
      <div className="tg-meta"><h2>Kits</h2><span className="c">6 of 25 shown</span></div>
      <div className="tg-grid" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
        {kits.map(k => <KitCard k={k} compact key={k.name} />)}
      </div>
    </div>
  );
}
Object.assign(window, { KitCard, KitsForged, KitsHeroic, KitsTactical });
