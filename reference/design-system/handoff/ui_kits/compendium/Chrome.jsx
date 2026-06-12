/* Chrome — NavBar, Sidebar, TOC, SearchModal */

function NavBar({ tab, onTab, dark, onToggleTheme, onSearch }) {
  const D = window.SC_DATA;
  return (
    <header className="hdr">
      <div className="hdr-bar">
        <img className="hdr-logo" src="../../assets/steel_compendium_glow_white.svg" alt="" />
        <span className="hdr-title">Steel Compendium: Draw Steel Rules</span>
        <div className="hdr-spacer"></div>
        <button className="theme-toggle" onClick={onToggleTheme} title="Toggle light / dark">
          {dark ? "🌙" : "☀️"}
        </button>
        <div className="search-box" onClick={onSearch}>
          <span>🔍</span><span>Search</span>
        </div>
      </div>
      <nav className="hdr-tabs">
        {D.tabs.map(t => (
          <a key={t} className={tab === t ? "active" : ""} onClick={() => onTab(t)}>{t}</a>
        ))}
      </nav>
    </header>
  );
}

function Sidebar({ active, onPick }) {
  const D = window.SC_DATA;
  return (
    <aside className="sidebar">
      <div className="sidebar-h">Browse</div>
      <div className="root" style={{cursor:"pointer"}} onClick={() => onPick(null)}>Browse Rules</div>
      <ul>
        {D.sidebar.map(s => (
          <li key={s} className={active === s.toLowerCase() ? "active" : ""}
              onClick={() => onPick(s.toLowerCase())}>
            <span>{s}</span><span className="chev">›</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function Toc({ items, title }) {
  return (
    <aside className="toc">
      <div className="toc-h">Table of contents</div>
      <ul>
        <li className="active">{title}</li>
        {items.map(it => <li className="sub" key={it}>{it}</li>)}
      </ul>
    </aside>
  );
}

function SearchModal({ onClose, onPick }) {
  const D = window.SC_DATA;
  const [q, setQ] = React.useState("");
  const pool = React.useMemo(() => {
    const out = [];
    (D.index.class || []).forEach(n => out.push({ cat: "Class", name: n }));
    (D.index.kit || []).forEach(n => out.push({ cat: "Kit", name: n }));
    D.categories.forEach(c => out.push({ cat: "Category", name: c.title }));
    return out;
  }, []);
  const results = q.trim()
    ? pool.filter(r => r.name.toLowerCase().includes(q.toLowerCase())).slice(0, 8)
    : pool.slice(0, 6);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <input autoFocus placeholder="Search rules, abilities, kits…"
               value={q} onChange={e => setQ(e.target.value)} />
        <div className="modal-results">
          {results.length === 0 && <div className="modal-empty">No results for “{q}”.</div>}
          {results.map((r, i) => (
            <div className="modal-result" key={i} onClick={() => onPick(r)}>
              <span className="r-cat">{r.cat}</span>
              <span className="r-name">{r.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NavBar, Sidebar, Toc, SearchModal });
