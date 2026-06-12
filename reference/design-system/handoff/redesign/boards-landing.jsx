/* Browse-landing artboards — three directions sharing window.RD data */
const RD_LOGO = "../assets/steel_compendium_glow_white.svg";

/* ── A · FORGED PLATE ───────────────────────────────────────── */
function LandingForged() {
  const cats = window.RD.categories;
  return (
    <div className="rd-page fa-wrap">
      <div className="rd-masthead fa-head">
        <img src={RD_LOGO} alt="" />
        <div>
          <div className="fa-kicker">Xentis' Draw Steel Compendium</div>
          <h1 className="fa-title">Browse the Rules</h1>
          <div className="fa-sub">Every class, ancestry, kit and ability — forged into one searchable armory.</div>
        </div>
      </div>
      <div className="fa-grid">
        {cats.slice(0, 6).map(c => (
          <div className="fa-plate" key={c.id}>
            <div className="fa-plate-h">
              <div className="fa-stamp"><window.Icon name={c.icon} size={24} /></div>
              <div className="fa-plate-name">{c.title}</div>
              <span className="fa-count"><span className="num">{c.count}</span></span>
            </div>
            <div className="fa-blurb">{c.blurb}</div>
            <div className="fa-links">
              {c.top.slice(0,4).map(t => <span className="fa-chip" key={t}>{t}</span>)}
              <span className="fa-enter">Enter <window.Icon name="arrow" size={14} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── B · HEROIC EDITORIAL ───────────────────────────────────── */
function LandingHeroic() {
  const cats = window.RD.categories;
  return (
    <div className="rd-page he-wrap">
      <div className="he-hero">
        <div className="rd-eyebrow">Xentis' Draw Steel Compendium</div>
        <h1 className="he-h1">Browse<br/>the <em>Rules</em></h1>
        <p className="he-lead">Look up any class, ancestry, kit, or ability. Built for fast reference at the table — search, or stride through the armory below.</p>
      </div>
      <div className="he-list">
        {cats.slice(0, 7).map((c, i) => (
          <div className="he-row" key={c.id}>
            <span className="he-num">{String(i+1).padStart(2,"0")}</span>
            <div>
              <div className="he-name">
                <span className="he-ic"><window.Icon name={c.icon} size={26} /></span>
                {c.title}<span className="he-count">{c.count}</span>
              </div>
              <div className="he-blurb">{c.blurb}</div>
            </div>
            <span className="he-go"><window.Icon name="chevron" size={22} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── C · TACTICAL GRID ──────────────────────────────────────── */
function LandingTactical() {
  const cats = window.RD.categories;
  return (
    <div className="rd-page">
      <div className="tg-bar">
        <div className="tg-search on"><window.Icon name="search" size={18} /><span>Search rules, abilities, kits…</span></div>
        <div className="tg-facets">
          <span className="tg-facet active">All</span>
          <span className="tg-facet">Heroes</span>
          <span className="tg-facet">Bestiary</span>
        </div>
      </div>
      <div className="tg-meta"><h2>Browse</h2><span className="c">10 categories · 900+ entries</span></div>
      <div className="tg-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
        {cats.map(c => (
          <div className="kc" key={c.id} style={{padding:"13px 15px",cursor:"pointer"}}>
            <div className="kc-top">
              <div className="fa-stamp" style={{width:38,height:38}}><window.Icon name={c.icon} size={19} /></div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                  <span style={{fontFamily:"var(--font-subhead)",fontSize:19,color:"var(--fg)"}}>{c.title}</span>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--accent)"}}>{c.count}</span>
                </div>
                <div style={{fontSize:11.5,color:"var(--fg-lighter)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"34ch"}}>{c.blurb}</div>
              </div>
              <span className="he-go"><window.Icon name="chevron" size={18} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { LandingForged, LandingHeroic, LandingTactical });
