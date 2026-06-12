/* App — routing + theme state for the Steel Compendium UI kit */
function App() {
  const [tab, setTab] = React.useState("Browse");
  const [view, setView] = React.useState({ name: "landing" }); // landing | category(catId) | content
  const [dark, setDark] = React.useState(true);
  const [search, setSearch] = React.useState(false);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-md-color-scheme", dark ? "slate" : "default");
  }, [dark]);

  const goCategory = (catId) => {
    // kit & class have item lists -> show index; others jump to the sample content page
    if (catId === "kit" || catId === "class") setView({ name: "category", catId });
    else setView({ name: "content" });
  };
  const goItem = (name) => setView({ name: "content" });
  const goCrumb = (catId) => setView(catId ? { name: "category", catId } : { name: "landing" });

  const onTab = (t) => { setTab(t); setView({ name: "landing" }); };

  let activeSidebar = null;
  if (view.name === "category") activeSidebar = view.catId;

  const onSidebar = (cat) => {
    if (!cat) setView({ name: "landing" });
    else if (cat === "kit" || cat === "class") setView({ name: "category", catId: cat });
    else setView({ name: "content" });
  };

  const showRail = view.name === "content";

  const renderContent = () => {
    if (tab !== "Browse") {
      return (
        <div className="content">
          <h1>{tab}</h1>
          <hr className="sc-rule" />
          <p className="lead">This tab is part of the live Steel Compendium. In this UI kit, the
            <b> Browse</b> tab is the fully interactive recreation — try it to explore categories,
            open a kit, and see the signature ability card.</p>
        </div>
      );
    }
    if (view.name === "landing") return <window.BrowseLanding onCategory={goCategory} />;
    if (view.name === "category") return <window.CategoryIndex catId={view.catId} onItem={goItem} />;
    return <window.ContentPage onCrumb={goCrumb} />;
  };

  return (
    <div className="app">
      <window.NavBar tab={tab} onTab={onTab} dark={dark}
        onToggleTheme={() => setDark(d => !d)} onSearch={() => setSearch(true)} />
      <div className={"layout" + (showRail ? "" : " no-rail")}>
        <window.Sidebar active={activeSidebar} onPick={onSidebar} />
        {renderContent()}
        {showRail && <window.Toc items={window.SC_DATA.page.toc} title={window.SC_DATA.page.title} />}
      </div>
      {search && (
        <window.SearchModal onClose={() => setSearch(false)}
          onPick={() => { setSearch(false); setTab("Browse"); setView({ name: "content" }); }} />
      )}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
