/* High-fantasy steel boards (.fx-*) */

function Filigree() {
  return (<>
    <i className="fx-cnr tl"></i><i className="fx-cnr tr"></i>
    <i className="fx-cnr bl"></i><i className="fx-cnr br"></i>
  </>);
}
function Crest({ name, size }) {
  return (
    <div className={"fx-crest" + (size === "sm" ? " sm" : "")}>
      <span><window.Icon name={name} size={size === "sm" ? 18 : 24} /></span>
    </div>
  );
}
function FxRule() { return (<div className="fx-rule"><i></i><s></s><b></b><s></s><i></i></div>); }

/* ── Ornament & palette building blocks ── */
function OrnamentKit() {
  const sw = (c, l, d) => (
    <div style={{textAlign:"center"}}>
      <div style={{width:64,height:40,borderRadius:6,background:c,border:"1px solid rgba(255,255,255,.08)",boxShadow:"var(--rd-bevel-top)"}}></div>
      <div style={{fontFamily:"var(--font-mono)",fontSize:9,color:"var(--fg-lighter)",marginTop:5}}>{l}<br/>{d}</div>
    </div>
  );
  return (
    <div className="fx-page" style={{padding:"32px 36px"}}>
      <div className="fx-kicker">the fantasy layer</div>
      <h2 style={{fontFamily:"var(--font-display)",textTransform:"uppercase",fontSize:30,color:"var(--sc-steel-lighter)",margin:"6px 0 4px",lineHeight:1}}>Steel, etched &amp; <span className="fx-illuminated">ennobled</span></h2>
      <p style={{fontSize:13.5,color:"var(--fg-light)",maxWidth:"54ch",lineHeight:1.6}}>Same clean steel — we just trade cyan accents &amp; brushed metal for polished-steel filigree, heraldic crests, small-caps serif labels and engraved initials.</p>

      <FxRule />

      <div style={{display:"flex",gap:14,margin:"6px 0 18px",flexWrap:"wrap"}}>
        {sw("#a9b0b5","steel","#a9b0b5")}
        {sw("var(--fx-metal-grad)","polished","gradient")}
        {sw("#686f74","steel-deep","#686f74")}
        {sw("#1a1e21","steel-bg","#1a1e21")}
        {sw("#d9dee1","highlight","#d9dee1")}
        {sw("#4db8c7","teal (kept for","semantic dots)")}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div>
          <div className="fx-label">heraldic crests</div>
          <div style={{display:"flex",gap:12,marginTop:10}}>
            <Crest name="shield" /><Crest name="package" /><Crest name="sparkles" /><Crest name="crown" />
          </div>
        </div>
        <div>
          <div className="fx-label">filigree frame</div>
          <div className="fx-frame" style={{marginTop:10,height:64,borderRadius:8,border:"1px solid rgba(255,255,255,.06)",background:"linear-gradient(160deg,#232a2e,#181c1f)",display:"grid",placeItems:"center"}}>
            <Filigree />
            <span style={{fontFamily:"var(--font-subhead)",fontVariant:"small-caps",letterSpacing:".1em",color:"var(--fx-metal)",fontSize:14}}>corner ornament</span>
          </div>
        </div>
      </div>

      <div style={{marginTop:18}}>
        <div className="fx-label">engraved drop cap &amp; small-caps body</div>
        <p className="fx-dropcap" style={{fontSize:14.5,color:"var(--fg-light)",lineHeight:1.65,marginTop:8}}>Power flows through the faithful, and the steel remembers every oath sworn upon it. An engraved initial opens a section the old way — without a single pixel of sourced art.</p>
      </div>
    </div>
  );
}

/* ── Landing · Illuminated (Forged Plate A layout, fantasy style) ── */
function LandingIlluminated() {
  const cats = window.RD.categories;
  return (
    <div className="fx-page">
      <div className="fx-masthead" style={{padding:"30px 44px 26px",display:"flex",alignItems:"center",gap:20}}>
        <Crest name="scroll" />
        <div>
          <div className="fx-kicker">Xentis' Draw Steel Compendium</div>
          <h1 style={{fontFamily:"var(--font-display)",textTransform:"uppercase",fontSize:48,lineHeight:.9,color:"var(--sc-steel-lighter)",textShadow:"var(--rd-emboss)",margin:"2px 0 0"}}>Browse the <span className="fx-illuminated">Rules</span></h1>
          <div style={{color:"var(--fg-light)",fontSize:14,marginTop:6}}>Every class, ancestry, kit and ability — forged into one searchable armory.</div>
        </div>
      </div>
      <div style={{padding:"6px 44px 0"}}><FxRule /></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:"6px 44px 40px"}}>
        {cats.slice(0,6).map(c => (
          <div className="fx-cat fx-frame" key={c.id}>
            <Filigree />
            <div className="fx-cat-h">
              <Crest name={c.icon} size="sm" />
              <div className="fx-cat-name">{c.title}</div>
              <span className="fx-count" style={{marginLeft:"auto"}}>{c.count}</span>
            </div>
            <p className="fx-cat-blurb">{c.blurb}</p>
            <div className="fx-cat-foot">
              {(c.top.length ? c.top.slice(0,4) : ["Browse all"]).map(t => <span className="fx-chip" key={t}>{t}</span>)}
              <span className="fx-enter">Enter <window.Icon name="arrow" size={14} /></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Kit index · Codex Entries (Forged Plate layout, fantasy style) ── */
function FxKitCard({ k }) {
  return (
    <div className="fxk fx-frame">
      <Filigree />
      <div className="kc-ops"><span className="kc-op"><window.Icon name="link" size={14}/></span><span className="kc-op"><window.Icon name="bookmark" size={14}/></span></div>
      <div className="fxk-top">
        <Crest name={k.klass === "caster" ? "wand" : "shield"} size="sm" />
        <div>
          <div className="fxk-type">{k.type} Kit</div>
          <div className="fxk-name">{k.name}</div>
        </div>
      </div>
      <div className="fxk-equip">{k.armor} armor · {k.weapon} weapon</div>
      <div className="fxk-stats">
        <div className="fxk-stat"><div className="v">{k.stamina}</div><div className="l">Stamina</div></div>
        <div className="fxk-stat"><div className="v">{k.speed}</div><div className="l">Speed</div></div>
        <div className="fxk-stat"><div className="v">{k.stability}</div><div className="l">Stability</div></div>
        <div className="fxk-stat dmg"><div className="v">{k.melee.split("/")[0]}</div><div className="l">Damage</div></div>
      </div>
      <FxRule />
      <div className="fxk-sig">
        <span className={"kc-dot dot-" + k.sigType}></span>
        <span className="fxk-sig-label">Signature</span>
        <span className="fxk-sig-name">{k.sig}</span>
        <span className="fxk-kw">{k.keywords}</span>
      </div>
    </div>
  );
}
function KitsCodex() {
  const kits = window.RD.kits;
  return (
    <div className="fx-page">
      <div className="fx-masthead" style={{padding:"24px 40px 20px",display:"flex",alignItems:"center",gap:16}}>
        <Crest name="package" size="sm" />
        <div>
          <div className="fx-kicker">Browse · Kits</div>
          <h1 style={{fontFamily:"var(--font-display)",textTransform:"uppercase",fontSize:38,lineHeight:.9,color:"var(--sc-steel-lighter)",textShadow:"var(--rd-emboss)",margin:0}}>Kits</h1>
        </div>
        <div style={{marginLeft:"auto"}}><span className="fx-count">25</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:"20px 40px 36px"}}>
        {kits.map(k => <FxKitCard k={k} key={k.name} />)}
      </div>
    </div>
  );
}
Object.assign(window, { OrnamentKit, LandingIlluminated, KitsCodex });
