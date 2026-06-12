/* Canvas composition */
const BG = { background: "#1a1e21" };
function RedesignApp() {
  return (
    <window.DesignCanvas>
      <window.DCSection id="start" title="Start here" subtitle="The approach, and how to read this canvas">
        <window.DCArtboard id="brief" label="Design brief" width={720} height={940} style={BG}><window.Brief /></window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="landing" title="Browse landing — 3 directions" subtitle="The category hub. Same steel DNA, three temperaments — mix & match.">
        <window.DCArtboard id="l-forged"   label="A · Forged Plate" width={1040} height={884} style={BG}><window.LandingForged /></window.DCArtboard>
        <window.DCArtboard id="l-heroic"   label="B · Heroic Editorial" width={1040} height={1184} style={BG}><window.LandingHeroic /></window.DCArtboard>
        <window.DCArtboard id="l-tactical" label="C · Tactical Grid" width={1040} height={668} style={BG}><window.LandingTactical /></window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="kits" title="Kit index — rich cards (your priority)" subtitle="Stat-at-a-glance, not a name list. Each shows type, bonuses & its signature ability.">
        <window.DCArtboard id="k-forged"   label="A · Forged Plate" width={1040} height={1012} style={BG}><window.KitsForged /></window.DCArtboard>
        <window.DCArtboard id="k-heroic"   label="B · Heroic Editorial" width={1040} height={1098} style={BG}><window.KitsHeroic /></window.DCArtboard>
        <window.DCArtboard id="k-tactical" label="C · Tactical Grid" width={1040} height={736} style={BG}><window.KitsTactical /></window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="hierarchy" title="Content hierarchy — 8 levels & nesting" subtitle="Siblings vs. children, and trait→ability parentage, made unmistakable. Power roll untouched.">
        <window.DCArtboard id="hx" label="8-level system + nesting rails" width={900} height={1880} style={BG}><window.Hierarchy /></window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="mobile" title="Mobile" subtitle="The card patterns reflow to a single column.">
        <window.DCArtboard id="m1" label="Kits + Browse · 390px" width={390} height={1040} style={BG}><window.Mobile /></window.DCArtboard>
      </window.DCSection>

      <window.DCSection id="fantasy" title="High-fantasy steel (NEW)" subtitle="Forged Plate A layout, warmed with polished-steel filigree, heraldic crests & small-caps serif labels. Originals above are untouched.">
        <window.DCArtboard id="f-kit" label="Ornament & palette" width={760} height={1000} style={BG}><window.OrnamentKit /></window.DCArtboard>
        <window.DCArtboard id="f-landing" label="Landing · Illuminated" width={1040} height={1010} style={BG}><window.LandingIlluminated /></window.DCArtboard>
        <window.DCArtboard id="f-kits" label="Kit index · Codex Entries" width={1040} height={1044} style={BG}><window.KitsCodex /></window.DCArtboard>
      </window.DCSection>
    </window.DesignCanvas>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<RedesignApp />);
