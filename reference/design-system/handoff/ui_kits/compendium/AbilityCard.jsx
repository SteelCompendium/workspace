/* AbilityCard — the signature Steel Compendium component */
function AbilityCard({ ability }) {
  const G = window.SC_DATA.tierGlyph;
  return (
    <div className={"ability t-" + ability.type}>
      <h4>{ability.name}</h4>
      <p className="flavor">{ability.flavor}</p>
      <table><tbody>
        <tr><td><b>{ability.keywords}</b></td><td><b>{ability.action}</b></td></tr>
        <tr><td><b>{ability.distance}</b></td><td><b>{ability.target}</b></td></tr>
      </tbody></table>
      <div className="pr-head">{ability.roll}</div>
      {ability.tiers.map(([tier, effect], i) => (
        <div className="pr-row" key={i}>
          <span className={"pr-badge " + tier}>{G[tier]}</span>
          <span className="pr-effect">{effect}</span>
        </div>
      ))}
      <p className="effect"><b>Effect:</b> {ability.effect}</p>
    </div>
  );
}
window.AbilityCard = AbilityCard;
