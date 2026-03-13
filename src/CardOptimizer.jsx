import { useState, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCY_VALUES = {
  UR:       { cashback: 0.01,  travel: 0.015 },
  MR:       { cashback: 0.006, travel: 0.01  },
  CAPONE:   { cashback: 0.01,  travel: 0.01  },
  TYP:      { cashback: 0.01,  travel: 0.01  },
  CASHBACK: { cashback: 0.01,  travel: 0.01  },
};

const CARDS = [
  { id: "chase_sapphire_reserve",       name: "Chase Sapphire Reserve",              shortName: "Sapphire Reserve",    issuer: "Chase",          currency: "UR",       status: "supported", multipliers: { dining:3,   groceries:1,   gas:1,   travel:4,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "chase_sapphire_preferred",     name: "Chase Sapphire Preferred",            shortName: "Sapphire Preferred",  issuer: "Chase",          currency: "UR",       status: "supported", multipliers: { dining:3,   groceries:3,   gas:1,   travel:2,  transit:1, streaming:3, online:1,   drugstores:1,   other:1   } },
  { id: "citi_strata_elite",            name: "Citi Strata Elite",                   shortName: "Strata Elite",        issuer: "Citi",           currency: "TYP",      status: "supported", multipliers: { dining:3,   groceries:3,   gas:3,   travel:3,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "amex_platinum",                name: "Amex Platinum",                       shortName: "Platinum",            issuer: "Amex",           currency: "MR",       status: "supported", multipliers: { dining:1,   groceries:1,   gas:1,   travel:5,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "amex_gold",                    name: "Amex Gold",                           shortName: "Gold",                issuer: "Amex",           currency: "MR",       status: "supported", multipliers: { dining:4,   groceries:4,   gas:1,   travel:3,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "amex_blue_cash_preferred",     name: "Amex Blue Cash Preferred",            shortName: "Blue Cash Pref.",     issuer: "Amex",           currency: "CASHBACK", status: "supported", multipliers: { dining:1,   groceries:6,   gas:3,   travel:1,  transit:1, streaming:6, online:1,   drugstores:1,   other:1   } },
  { id: "amex_blue_cash_everyday",      name: "Amex Blue Cash Everyday",             shortName: "Blue Cash Ev.",       issuer: "Amex",           currency: "CASHBACK", status: "supported", multipliers: { dining:1,   groceries:3,   gas:3,   travel:1,  transit:1, streaming:1, online:3,   drugstores:1,   other:1   } },
  { id: "capital_one_venture_x",        name: "Capital One Venture X",               shortName: "Venture X",           issuer: "Capital One",    currency: "CAPONE",   status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:5,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "capital_one_venture",          name: "Capital One Venture",                 shortName: "Venture",             issuer: "Capital One",    currency: "CAPONE",   status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:5,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "citi_double_cash",             name: "Citi Double Cash",                    shortName: "Double Cash",         issuer: "Citi",           currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "wells_fargo_active_cash",      name: "Wells Fargo Active Cash",             shortName: "Active Cash",         issuer: "Wells Fargo",    currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "wells_fargo_autograph_journey",name: "Wells Fargo Autograph Journey",       shortName: "Autograph J.",        issuer: "Wells Fargo",    currency: "CASHBACK", status: "supported", multipliers: { dining:3,   groceries:1,   gas:3,   travel:3,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "bofa_premium_rewards",         name: "Bank of America Premium Rewards",     shortName: "BoA Premium",         issuer: "Bank of America",currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1.5, gas:1.5, travel:2,  transit:1.5,streaming:1.5,online:1.5, drugstores:1.5, other:1.5 } },
  { id: "bofa_premium_rewards_elite",   name: "Bank of America Premium Rewards Elite",shortName: "BoA Premium Elite",  issuer: "Bank of America",currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1.5, gas:1.5, travel:2,  transit:1.5,streaming:1.5,online:1.5, drugstores:1.5, other:1.5 } },
  { id: "usbank_altitude_connect",      name: "U.S. Bank Altitude Connect",          shortName: "Altitude Connect",    issuer: "U.S. Bank",      currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1,   gas:4,   travel:4,  transit:2, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "fidelity_rewards_2",           name: "Fidelity Rewards Visa",               shortName: "Fidelity 2%",         issuer: "Fidelity",       currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "sofi_credit_card",             name: "SoFi Credit Card",                    shortName: "SoFi 2%",             issuer: "SoFi",           currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "apple_card",                   name: "Apple Card",                          shortName: "Apple Card",          issuer: "Apple/GS",       currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2, streaming:2, online:2,   drugstores:2,   other:2   } },
  { id: "citi_custom_cash",             name: "Citi Custom Cash",                    shortName: "Custom Cash",         issuer: "Citi",           currency: "CASHBACK", status: "draft",     multipliers: { dining:5,   groceries:5,   gas:5,   travel:5,  transit:5, streaming:5, online:5,   drugstores:5,   other:1   } },
  { id: "discover_it",                  name: "Discover it Cash Back",               shortName: "Discover it",         issuer: "Discover",       currency: "CASHBACK", status: "draft",     multipliers: { dining:1,   groceries:1,   gas:1,   travel:1,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
  { id: "usbank_cash_plus",             name: "U.S. Bank Cash+ Visa",                shortName: "U.S. Bank Cash+",     issuer: "U.S. Bank",      currency: "CASHBACK", status: "draft",     multipliers: { dining:1,   groceries:1,   gas:1,   travel:1,  transit:1, streaming:1, online:1,   drugstores:1,   other:1   } },
];

const SUPPORTED_CARDS = CARDS.filter(c => c.status === "supported");

const CATEGORIES = [
  { key: "dining",     label: "Dining",          icon: "🍽️" },
  { key: "groceries",  label: "Groceries",       icon: "🛒" },
  { key: "gas",        label: "Gas",             icon: "⛽" },
  { key: "travel",     label: "Travel",          icon: "✈️" },
  { key: "transit",    label: "Transit",         icon: "🚇" },
  { key: "streaming",  label: "Streaming",       icon: "📺" },
  { key: "online",     label: "Online",          icon: "🛍️" },
  { key: "drugstores", label: "Drugstores",      icon: "💊" },
  { key: "other",      label: "Everything Else", icon: "💳" },
];

// ─── Issuer palette ────────────────────────────────────────────────────────────

const ISSUER_PALETTE = {
  "Chase":           ["#111827", "#1d3461"],
  "Amex":            ["#064e3b", "#0f766e"],
  "Citi":            ["#0b1d3a", "#1d4ed8"],
  "Capital One":     ["#1a0a0a", "#7f1d1d"],
  "Bank of America": ["#3b0a0a", "#7f1d1d"],
  "Wells Fargo":     ["#78350f", "#d97706"],
  "U.S. Bank":       ["#1e1b4b", "#4338ca"],
  "Fidelity":        ["#14532d", "#166534"],
  "SoFi":            ["#0c4a6e", "#0369a1"],
  "Apple/GS":        ["#1c1c1e", "#3a3a3c"],
  "Discover":        ["#7c2d12", "#c2410c"],
};

// ─── Card Badge ────────────────────────────────────────────────────────────────

function CardBadge({ card, width = 76, height = 48, isSelected = false }) {
  const [from, to] = ISSUER_PALETTE[card.issuer] || ["#1f2937", "#374151"];
  const isDraft = card.status === "draft";

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 7,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "6px 8px",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        border: isDraft
          ? "1px dashed rgba(240,237,232,0.2)"
          : isSelected
            ? "1px solid rgba(240,237,232,0.3)"
            : "1px solid rgba(240,237,232,0.1)",
        opacity: isDraft ? 0.65 : 1,
        boxSizing: "border-box",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: Math.max(7, width * 0.095),
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "rgba(240,237,232,0.55)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {card.issuer}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 4 }}>
        <div
          className="serif"
          style={{
            fontSize: Math.max(9, width * 0.135),
            lineHeight: 1.1,
            color: "rgba(240,237,232,0.92)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {card.shortName}
        </div>
        {isDraft && (
          <div className="mono" style={{ fontSize: 7, color: "rgba(240,237,232,0.4)", flexShrink: 0 }}>
            SOON
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Multiplier line ───────────────────────────────────────────────────────────

function MultiplierLine({ card }) {
  const highlights = CATEGORIES
    .map(cat => ({ cat, mult: card.multipliers[cat.key] }))
    .filter(x => x.mult > 1)
    .sort((a, b) => b.mult - a.mult);

  if (!highlights.length) return (
    <span style={{ color: "rgba(240,237,232,0.22)", fontSize: "0.66rem", fontFamily: "'DM Mono',monospace" }}>
      1× on everything
    </span>
  );

  return (
    <span style={{ fontSize: "0.66rem", fontFamily: "'DM Mono',monospace", lineHeight: 1.65 }}>
      {highlights.map((h, i) => (
        <span key={h.cat.key}>
          {i > 0 && <span style={{ color: "rgba(240,237,232,0.15)" }}> · </span>}
          <span style={{
            color: h.mult >= 5 ? "#f5c842" : h.mult >= 4 ? "#e8a835" : h.mult >= 3 ? "rgba(240,237,232,0.75)" : "rgba(240,237,232,0.45)",
            fontWeight: h.mult >= 3 ? 500 : 400,
          }}>
            {h.mult}×
          </span>
          <span style={{ color: "rgba(240,237,232,0.26)" }}> {h.cat.label.toLowerCase()}</span>
        </span>
      ))}
    </span>
  );
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeBreadth(card, mode) {
  return CATEGORIES.reduce((acc, cat) => {
    const mult = card.multipliers[cat.key] ?? card.multipliers.other;
    const cv = CURRENCY_VALUES[card.currency][mode];
    return acc + mult * cv;
  }, 0);
}

function getBestCard(cards, category, mode) {
  const eligible = cards.filter(c => c.status !== "draft");
  if (!eligible.length) return null;

  const scored = eligible.map(card => {
    const mult = card.multipliers[category] ?? card.multipliers.other;
    const cv = CURRENCY_VALUES[card.currency][mode];
    const value = mult * cv;
    return { card, mult, value, pct: value * 100, breadth: computeBreadth(card, mode) };
  });

  scored.sort((a, b) =>
    Math.abs(a.value - b.value) > 0.00001 ? b.value - a.value : b.breadth - a.breadth
  );

  return scored[0];
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedIds, setSelectedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_wallet_v1") || "[]"); }
    catch { return []; }
  });
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("cp_mode_v1") || "cashback"; }
    catch { return "cashback"; }
  });
  const [view, setView] = useState(() => {
    try {
      const ids = JSON.parse(localStorage.getItem("cp_wallet_v1") || "[]");
      const validCount = CARDS.filter(c => ids.includes(c.id) && c.status !== "draft").length;
      return validCount > 0 ? "results" : "pick";
    } catch { return "pick"; }
  });
  const [search, setSearch] = useState("");
  const [issuerFilter, setIssuerFilter] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("cp_wallet_v1", JSON.stringify(selectedIds)); } catch {}
  }, [selectedIds]);

  useEffect(() => {
    try { localStorage.setItem("cp_mode_v1", mode); } catch {}
  }, [mode]);

  const toggle = (id) => {
    const card = CARDS.find(c => c.id === id);
    if (card?.status === "draft" && !selectedIds.includes(id)) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedCards = CARDS.filter(c => selectedIds.includes(c.id));

  const ISSUERS = [...new Set(CARDS.filter(c => c.status === "supported").map(c => c.issuer))];

  const filtered = CARDS.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
    const matchesIssuer = !issuerFilter || c.issuer === issuerFilter;
    return matchesSearch && matchesIssuer;
  });

  const sortedFiltered = [
    ...filtered.filter(c => selectedIds.includes(c.id)),
    ...filtered.filter(c => !selectedIds.includes(c.id) && c.status !== "draft"),
    ...filtered.filter(c => !selectedIds.includes(c.id) && c.status === "draft"),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#f0ede8", fontFamily: "Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f1117; }
        .mono { font-family: 'DM Mono','Courier New',monospace; }
        .serif { font-family: 'DM Serif Display',Georgia,serif; }
        .card-row { transition: background 0.12s, transform 0.12s; cursor: pointer; }
        .card-row:hover { background: rgba(255,255,255,0.07) !important; transform: translateX(2px); }
        .card-row.draft-row { cursor: default; }
        .card-row.draft-row:hover { transform: none; background: rgba(255,255,255,0.02) !important; }
        .pill-btn { transition: all 0.12s; cursor: pointer; border: none; }
        .pill-btn:hover { opacity: 0.82; }
        .result-row { transition: background 0.12s; }
        .result-row:hover { background: rgba(255,255,255,0.05) !important; }
        @keyframes slideIn { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:translateY(0); } }
        .slide-in { animation: slideIn 0.25s ease both; }
        .tab-btn { transition: color 0.12s; cursor: pointer; border: none; background: transparent; }
        input[type=text] { outline: none; }
        input::placeholder { color: rgba(240,237,232,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 20px", position: "sticky", top: 0, zIndex: 10, background: "rgba(15,17,23,0.97)", backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <span className="serif" style={{ fontSize: "1.18rem" }}>CardPicker</span>
          <div style={{ display: "flex", gap: 0, background: "rgba(255,255,255,0.07)", borderRadius: 7, padding: 3 }}>
            {["cashback", "travel"].map(m => (
              <button
                key={m}
                className="mono pill-btn"
                onClick={() => setMode(m)}
                style={{
                  padding: "5px 13px",
                  borderRadius: 5,
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  background: mode === m ? "#f0ede8" : "transparent",
                  color: mode === m ? "#0f1117" : "rgba(240,237,232,0.4)",
                }}
              >
                {m === "cashback" ? "Cash Back" : "Travel"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex" }}>
          {[
            { id: "pick",    label: selectedCards.length ? `My Cards (${selectedCards.length})` : "My Cards" },
            { id: "results", label: "Best Card Per Category" },
          ].map(tab => (
            <button
              key={tab.id}
              className="mono tab-btn"
              onClick={() => setView(tab.id)}
              style={{
                padding: "11px 17px",
                color: view === tab.id ? "#f0ede8" : "rgba(240,237,232,0.32)",
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
                borderBottom: view === tab.id ? "2px solid #f0ede8" : "2px solid transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 20px 52px" }}>

        {/* ═══ PICK VIEW ═══ */}
        {view === "pick" && (
          <div className="slide-in">
            <p className="mono" style={{ color: "rgba(240,237,232,0.26)", fontSize: "0.67rem", marginBottom: 14, letterSpacing: "0.04em" }}>
              CHECK EVERY CARD YOU CARRY — WE'LL BUILD YOUR CHEAT SHEET
            </p>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(240,237,232,0.2)", pointerEvents: "none", fontSize: "1rem" }}>⌕</span>
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); if (e.target.value) setIssuerFilter(null); }}
                placeholder="Search by card or issuer..."
                className="mono"
                style={{ width: "100%", padding: "9px 12px 9px 30px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, color: "#f0ede8", fontSize: "0.8rem" }}
              />
            </div>


            {/* Issuer filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <button
                className="mono pill-btn"
                onClick={() => setIssuerFilter(null)}
                style={{
                  padding: "4px 11px",
                  borderRadius: 20,
                  fontSize: "0.66rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  border: `1px solid ${!issuerFilter ? "rgba(240,237,232,0.6)" : "rgba(255,255,255,0.12)"}`,
                  background: !issuerFilter ? "rgba(240,237,232,0.12)" : "transparent",
                  color: !issuerFilter ? "#f0ede8" : "rgba(240,237,232,0.4)",
                }}
              >
                All
              </button>
              {ISSUERS.map(issuer => {
                const active = issuerFilter === issuer;
                return (
                  <button
                    key={issuer}
                    className="mono pill-btn"
                    onClick={() => setIssuerFilter(active ? null : issuer)}
                    style={{
                      padding: "4px 11px",
                      borderRadius: 20,
                      fontSize: "0.66rem",
                      fontWeight: 500,
                      letterSpacing: "0.04em",
                      border: `1px solid ${active ? "rgba(240,237,232,0.6)" : "rgba(255,255,255,0.12)"}`,
                      background: active ? "rgba(240,237,232,0.12)" : "transparent",
                      color: active ? "#f0ede8" : "rgba(240,237,232,0.4)",
                    }}
                  >
                    {issuer}
                  </button>
                );
              })}
            </div>

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedFiltered.map(card => {
                const on = selectedIds.includes(card.id);
                const isDraft = card.status === "draft";
                return (
                  <div
                    key={card.id}
                    className={`card-row${isDraft && !on ? " draft-row" : ""}`}
                    onClick={() => toggle(card.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: "11px 13px",
                      borderRadius: 9,
                      background: on ? "rgba(240,237,232,0.07)" : "rgba(255,255,255,0.025)",
                      border: `1px solid ${on ? "rgba(240,237,232,0.18)" : "rgba(255,255,255,0.05)"}`,
                      opacity: isDraft && !on ? 0.6 : 1,
                    }}
                  >
                    {/* Badge */}
                    <CardBadge card={card} width={76} height={48} isSelected={on} />

                    {/* Name + multipliers */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                        <span className="serif" style={{ fontSize: "0.87rem", color: on ? "#f0ede8" : "rgba(240,237,232,0.75)", lineHeight: 1.2 }}>
                          {card.name}
                        </span>
                        <span className="mono" style={{ fontSize: "0.58rem", color: "rgba(240,237,232,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                          {card.currency}
                        </span>
                        {isDraft && (
                          <span className="mono" style={{ fontSize: "0.57rem", color: "rgba(240,237,232,0.3)", border: "1px dashed rgba(240,237,232,0.18)", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                            coming soon
                          </span>
                        )}
                      </div>
                      <MultiplierLine card={card} />
                    </div>

                    {/* Checkbox */}
                    {!isDraft && (
                      <div style={{
                        flexShrink: 0, width: 21, height: 21, borderRadius: 5,
                        border: `2px solid ${on ? "#f0ede8" : "rgba(240,237,232,0.18)"}`,
                        background: on ? "#f0ede8" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.12s",
                      }}>
                        {on && <span style={{ color: "#0f1117", fontSize: "0.76rem", fontWeight: 700, lineHeight: 1, marginTop: "1px" }}>✓</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <button
                className="mono pill-btn"
                onClick={() => setView("results")}
                style={{ marginTop: 18, width: "100%", padding: "13px", background: "#f0ede8", color: "#0f1117", borderRadius: 8, fontWeight: 600, fontSize: "0.76rem", letterSpacing: "0.07em", textTransform: "uppercase" }}
              >
                See My Cheat Sheet →
              </button>
            )}
          </div>
        )}

        {/* ═══ RESULTS VIEW ═══ */}
        {view === "results" && (
          <div className="slide-in">
            {selectedCards.filter(c => c.status !== "draft").length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p className="serif" style={{ fontSize: "1.15rem", marginBottom: 8, color: "rgba(240,237,232,0.5)" }}>No cards selected</p>
                <p className="mono" style={{ fontSize: "0.7rem", color: "rgba(240,237,232,0.22)", marginBottom: 18 }}>
                  Go to "My Cards" and check the cards you carry
                </p>
                <button className="mono pill-btn" onClick={() => setView("pick")} style={{ padding: "10px 22px", background: "#f0ede8", color: "#0f1117", borderRadius: 6, fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Pick My Cards
                </button>
              </div>
            ) : (
              <>
                {/* Category rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {CATEGORIES.map((cat, i) => {
                    const best = getBestCard(selectedCards, cat.key, mode);
                    if (!best) return null;

                    const allScored = selectedCards
                      .filter(c => c.status !== "draft")
                      .map(card => {
                        const mult = card.multipliers[cat.key] ?? card.multipliers.other;
                        const cv = CURRENCY_VALUES[card.currency][mode];
                        return { card, pct: mult * cv * 100 };
                      })
                      .sort((a, b) => b.pct - a.pct);
                    const runner = allScored[1];

                    return (
                      <div
                        key={cat.key}
                        className="result-row"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 13,
                          padding: "12px 13px",
                          borderRadius: 9,
                          background: "rgba(255,255,255,0.026)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          animation: `slideIn 0.27s ease ${i * 0.03}s both`,
                        }}
                      >
                        {/* Badge */}
                        <CardBadge card={best.card} width={76} height={48} isSelected />

                        {/* Category + card name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mono" style={{ fontSize: "0.61rem", color: "rgba(240,237,232,0.27)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>
                            {cat.icon} {cat.label}
                          </div>
                          <div className="serif" style={{ fontSize: "0.86rem", color: "#f0ede8", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {best.card.name}
                          </div>
                          <div className="mono" style={{ fontSize: "0.63rem", color: "rgba(240,237,232,0.3)" }}>
                            {best.mult}× {best.card.currency}
                            <span style={{ color: "rgba(240,237,232,0.18)", margin: "0 3px" }}>·</span>
                            <span style={{ color: "rgba(240,237,232,0.45)" }}>
                              {(CURRENCY_VALUES[best.card.currency][mode] * 100).toFixed(1)}¢/pt
                            </span>
                            {runner && Math.abs(runner.pct - best.pct) > 0.001 && (
                              <span style={{ color: "rgba(240,237,232,0.17)", marginLeft: 6 }}>
                                vs {runner.pct.toFixed(1)}% {runner.card.shortName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Return % */}
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 500, color: "#f0ede8", letterSpacing: "-0.03em", lineHeight: 1 }}>
                            {best.pct.toFixed(1)}%
                          </div>
                          <div className="mono" style={{ fontSize: "0.57rem", color: "rgba(240,237,232,0.2)", marginTop: 3 }}>
                            {mode === "cashback" ? "cash back" : "travel val."}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Wallet summary */}
                <div style={{ marginTop: 22, padding: "15px", borderRadius: 9, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="mono" style={{ fontSize: "0.59rem", color: "rgba(240,237,232,0.2)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 12 }}>
                    Your Wallet
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {selectedCards.map(card => (
                      <div key={card.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        <CardBadge card={card} width={62} height={40} />
                        <div style={{ minWidth: 0 }}>
                          <div className="serif" style={{ fontSize: "0.8rem", color: "rgba(240,237,232,0.68)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {card.name}
                          </div>
                          <MultiplierLine card={card} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mono" style={{ marginTop: 14, fontSize: "0.57rem", color: "rgba(240,237,232,0.13)", textAlign: "center" }}>
                  Ties broken by card versatility (total weighted value). Multipliers simplified.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
