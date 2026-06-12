/* Screens — BrowseLanding, CategoryIndex, ContentPage */

function BrowseLanding({ onCategory }) {
  const D = window.SC_DATA;
  return (
    <div className="content">
      <h1>Browse Rules</h1>
      <p className="lead">Look up specific rules, abilities, and character options. Use <b>search</b> or pick a category below.</p>
      <div className="cards-grid">
        {D.categories.map(c => (
          <div className="cat-card" key={c.id} onClick={() => onCategory(c.id)}>
            <div className="ch"><h3>{c.title}</h3><span className="count-badge">{c.count}</span></div>
            <hr className="sc-rule" />
            <div className="desc">{c.items}</div>
            <div className="view">→ {c.link}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryIndex({ catId, onItem }) {
  const D = window.SC_DATA;
  const cat = D.categories.find(c => c.id === catId);
  const list = D.index[catId] || D.categories.map(c => c.title);
  const title = cat ? cat.title : "Browse";
  return (
    <div className="content">
      <div className="crumb"><span>Browse</span> / {title}</div>
      <h1>{title}</h1>
      <hr className="sc-rule" />
      <ul className="browse-index">
        {list.map(name => (
          <li key={name} onClick={() => onItem(name)}><a>{name}</a></li>
        ))}
      </ul>
    </div>
  );
}

function ContentPage({ onCrumb }) {
  const p = window.SC_DATA.page;
  const [copied, setCopied] = React.useState(false);
  const copy = () => { setCopied(true); setTimeout(() => setCopied(false), 1200); };
  return (
    <div className="content">
      <div className="crumb">
        <span onClick={() => onCrumb(null)}>Browse</span> / <span onClick={() => onCrumb("kit")}>{p.cat}</span> / {p.title}
      </div>
      <h1>{p.title}
        <span className="scc-pill" onClick={copy}>{copied ? "✓ Copied" : "🔗 Permalink"}</span>
      </h1>
      <hr className="sc-rule" />
      <p>{p.intro}</p>

      <h2>Equipment</h2>
      <p>{p.equipment}</p>

      <h2>Kit Bonuses</h2>
      {p.bonuses.map(([k, v]) => (
        <div className="bonus-row" key={k}><b>{k}:</b> {v}</div>
      ))}

      <h2>Signature Ability</h2>
      <window.AbilityCard ability={p.ability} />
    </div>
  );
}

Object.assign(window, { BrowseLanding, CategoryIndex, ContentPage });
