import React, { useState, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CURRENCY_VALUES = {
  UR:       { cashback: 0.01,  travel: 0.015 },
  MR:       { cashback: 0.006, travel: 0.01  },
  CAPONE:   { cashback: 0.01,  travel: 0.01  },
  TYP:      { cashback: 0.01,  travel: 0.01  },
  CASHBACK: { cashback: 0.01,  travel: 0.01  },
};

const CARDS = [
  { id: "chase_sapphire_reserve",        name: "Chase Sapphire Reserve",               shortName: "Sapphire Reserve",   issuer: "Chase",           currency: "UR",       status: "supported", multipliers: { dining:3,   groceries:1,   gas:1,   travel:4,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "chase_sapphire_preferred",      name: "Chase Sapphire Preferred",             shortName: "Sapphire Pref.",     issuer: "Chase",           currency: "UR",       status: "supported", multipliers: { dining:3,   groceries:3,   gas:1,   travel:2,  transit:1,   streaming:3,   online:1,   drugstores:1,   other:1   } },
  { id: "citi_strata_elite",             name: "Citi Strata Elite",                    shortName: "Strata Elite",       issuer: "Citi",            currency: "TYP",      status: "supported", multipliers: { dining:3,   groceries:3,   gas:3,   travel:3,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "amex_platinum",                 name: "Amex Platinum",                        shortName: "Platinum",           issuer: "Amex",            currency: "MR",       status: "supported", multipliers: { dining:1,   groceries:1,   gas:1,   travel:5,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "amex_gold",                     name: "Amex Gold",                            shortName: "Gold",               issuer: "Amex",            currency: "MR",       status: "supported", multipliers: { dining:4,   groceries:4,   gas:1,   travel:3,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "amex_blue_cash_preferred",      name: "Amex Blue Cash Preferred",             shortName: "Blue Cash Pref.",    issuer: "Amex",            currency: "CASHBACK", status: "supported", multipliers: { dining:1,   groceries:6,   gas:3,   travel:1,  transit:1,   streaming:6,   online:1,   drugstores:1,   other:1   } },
  { id: "amex_blue_cash_everyday",       name: "Amex Blue Cash Everyday",              shortName: "Blue Cash Ev.",      issuer: "Amex",            currency: "CASHBACK", status: "supported", multipliers: { dining:1,   groceries:3,   gas:3,   travel:1,  transit:1,   streaming:1,   online:3,   drugstores:1,   other:1   } },
  { id: "capital_one_venture_x",         name: "Capital One Venture X",                shortName: "Venture X",          issuer: "Capital One",     currency: "CAPONE",   status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:5,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "capital_one_venture",           name: "Capital One Venture",                  shortName: "Venture",            issuer: "Capital One",     currency: "CAPONE",   status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:5,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "citi_double_cash",              name: "Citi Double Cash",                     shortName: "Double Cash",        issuer: "Citi",            currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "wells_fargo_active_cash",       name: "Wells Fargo Active Cash",              shortName: "Active Cash",        issuer: "Wells Fargo",     currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "wells_fargo_autograph_journey", name: "Wells Fargo Autograph Journey",        shortName: "Autograph J.",       issuer: "Wells Fargo",     currency: "CASHBACK", status: "supported", multipliers: { dining:3,   groceries:1,   gas:3,   travel:3,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "bofa_premium_rewards",          name: "Bank of America Premium Rewards",      shortName: "BoA Premium",        issuer: "Bank of America", currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1.5, gas:1.5, travel:2,  transit:1.5, streaming:1.5, online:1.5, drugstores:1.5, other:1.5 } },
  { id: "bofa_premium_rewards_elite",    name: "Bank of America Premium Rewards Elite",shortName: "BoA Premium Elite",  issuer: "Bank of America", currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1.5, gas:1.5, travel:2,  transit:1.5, streaming:1.5, online:1.5, drugstores:1.5, other:1.5 } },
  { id: "usbank_altitude_connect",       name: "U.S. Bank Altitude Connect",           shortName: "Altitude Connect",   issuer: "U.S. Bank",       currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:1,   gas:4,   travel:4,  transit:2,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "fidelity_rewards_2",            name: "Fidelity Rewards Visa",                shortName: "Fidelity 2%",        issuer: "Fidelity",        currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "sofi_credit_card",              name: "SoFi Credit Card",                     shortName: "SoFi 2%",            issuer: "SoFi",            currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "apple_card",                    name: "Apple Card",                           shortName: "Apple Card",         issuer: "Apple/GS",        currency: "CASHBACK", status: "supported", multipliers: { dining:2,   groceries:2,   gas:2,   travel:2,  transit:2,   streaming:2,   online:2,   drugstores:2,   other:2   } },
  { id: "citi_custom_cash",              name: "Citi Custom Cash",                     shortName: "Custom Cash",        issuer: "Citi",            currency: "CASHBACK", status: "draft",     multipliers: { dining:5,   groceries:5,   gas:5,   travel:5,  transit:5,   streaming:5,   online:5,   drugstores:5,   other:1   } },
  { id: "discover_it",                   name: "Discover it Cash Back",                shortName: "Discover it",        issuer: "Discover",        currency: "CASHBACK", status: "draft",     multipliers: { dining:1,   groceries:1,   gas:1,   travel:1,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
  { id: "usbank_cash_plus",              name: "U.S. Bank Cash+ Visa",                 shortName: "U.S. Bank Cash+",    issuer: "U.S. Bank",       currency: "CASHBACK", status: "draft",     multipliers: { dining:1,   groceries:1,   gas:1,   travel:1,  transit:1,   streaming:1,   online:1,   drugstores:1,   other:1   } },
];

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

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg:             "#f7f7f7",
  surface:        "#e2e2e2",
  surfaceAlt:     "#d4d4d4",
  border:         "rgba(0,0,0,0.10)",
  borderHover:    "rgba(0,0,0,0.20)",
  text:           "#1a1a1a",
  textMid:        "#555555",
  textDim:        "#888888",
  accent:         "#1a1a1a",
  accentText:     "#ffffff",
  selectedBg:     "#e8f5e9",
  selectedBorder: "#66bb6a",
  topbar:         "rgba(247,247,247,0.97)",
};

// ─── Card Badge ────────────────────────────────────────────────────────────────

function CardBadge({ card, width = 76, height = 48, isSelected = false }) {
  const [from, to] = ISSUER_PALETTE[card.issuer] || ["#1f2937", "#374151"];
  const isDraft = card.status === "draft";
  const imgSrc = `/${card.id}.png`;
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <div style={{
        width, height, borderRadius: 7, flexShrink: 0, overflow: "hidden",
        border: isDraft ? `1px dashed ${T.border}` : `1px solid ${isSelected ? T.selectedBorder : T.border}`,
        opacity: isDraft ? 0.6 : 1, boxSizing: "border-box", position: "relative",
        boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.07)",
      }}>
        <img src={imgSrc} onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} alt={card.name} />
        {isDraft && (
          <div style={{ position: "absolute", bottom: 4, right: 5 }}>
            <span style={{ fontSize: 7, color: "rgba(240,237,232,0.7)", fontFamily: "monospace" }}>SOON</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      width, height, borderRadius: 7, flexShrink: 0, display: "flex", flexDirection: "column",
      justifyContent: "space-between", padding: "6px 8px",
      background: `linear-gradient(135deg, ${from}, ${to})`,
      border: isDraft ? "1px dashed rgba(240,237,232,0.2)" : `1px solid ${isSelected ? "rgba(240,237,232,0.35)" : "rgba(240,237,232,0.12)"}`,
      opacity: isDraft ? 0.6 : 1, boxSizing: "border-box",
      boxShadow: isSelected ? "0 2px 8px rgba(0,0,0,0.18)" : "0 1px 3px rgba(0,0,0,0.1)",
    }}>
      <div style={{ fontSize: Math.max(7, width * 0.095), letterSpacing: "0.05em", textTransform: "uppercase", color: "rgba(240,237,232,0.55)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "monospace" }}>
        {card.issuer}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 4 }}>
        <div style={{ fontSize: Math.max(9, width * 0.135), lineHeight: 1.1, color: "rgba(240,237,232,0.92)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "Georgia,serif" }}>
          {card.shortName}
        </div>
        {isDraft && <div style={{ fontSize: 7, color: "rgba(240,237,232,0.4)", flexShrink: 0, fontFamily: "monospace" }}>SOON</div>}
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
    <span style={{ color: T.textDim, fontSize: "0.66rem", fontFamily: "monospace" }}>1× on everything</span>
  );

  return (
    <span style={{ fontSize: "0.66rem", fontFamily: "monospace", lineHeight: 1.65 }}>
      {highlights.map((h, i) => (
        <span key={h.cat.key}>
          {i > 0 && <span style={{ color: T.textDim }}> · </span>}
          <span style={{
            color: h.mult >= 5 ? "#b45309" : h.mult >= 4 ? "#c2690a" : h.mult >= 3 ? T.text : T.textMid,
            fontWeight: h.mult >= 3 ? 600 : 400,
          }}>{h.mult}×</span>
          <span style={{ color: T.textMid }}> {h.cat.label.toLowerCase()}</span>
        </span>
      ))}
    </span>
  );
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeBreadth(card, mode) {
  return CATEGORIES.reduce((acc, cat) => {
    const mult = card.multipliers[cat.key] ?? card.multipliers.other;
    return acc + mult * CURRENCY_VALUES[card.currency][mode];
  }, 0);
}

function getBestCard(cards, category, mode) {
  const eligible = cards.filter(c => c.status !== "draft");
  if (!eligible.length) return null;
  const scored = eligible.map(card => {
    const mult = card.multipliers[category] ?? card.multipliers.other;
    const cv = CURRENCY_VALUES[card.currency][mode];
    return { card, mult, value: mult * cv, pct: mult * cv * 100, breadth: computeBreadth(card, mode) };
  });
  scored.sort((a, b) => Math.abs(a.value - b.value) > 0.00001 ? b.value - a.value : b.breadth - a.breadth);
  return scored[0];
}

// ─── Wallet ownership: "me" | "spouse" | "both" ────────────────────────────────

function ownerCards(ownership, who) {
  return CARDS.filter(c => {
    const o = ownership[c.id];
    return o === who || o === "both";
  });
}

// ─── Owner toggle button ───────────────────────────────────────────────────────

function OwnerToggle({ cardId, ownership, setOwnership }) {
  const current = ownership[cardId] || null;
  const cycle = { null: "me", me: "spouse", spouse: "both", both: null };
  const next = cycle[current];
  const labels = { me: "ME", spouse: "SPOUSE", both: "BOTH", null: null };

  return (
    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
      {["me", "spouse", "both"].map(who => {
        const active = current === who || current === "both" && who !== "both" ? (who === "me" || who === "spouse") && current === "both" ? true : current === who : false;
        // Simpler: highlight if this owner is included
        const lit = current === who || (current === "both" && (who === "me" || who === "spouse"));
        return (
          <button
            key={who}
            onClick={e => { e.stopPropagation(); setOwnership(prev => ({ ...prev, [cardId]: next })); }}
            style={{
              padding: "3px 8px", borderRadius: 4, border: `1px solid ${lit ? T.accent : T.border}`,
              background: lit ? T.accent : "transparent", color: lit ? T.accentText : T.textDim,
              fontSize: "0.58rem", fontFamily: "monospace", letterSpacing: "0.04em",
              cursor: "pointer", fontWeight: 600, transition: "all 0.1s",
            }}
          >
            {who === "me" ? "ME" : who === "spouse" ? "SP" : "BOTH"}
          </button>
        );
      })}
    </div>
  );
}

// ─── Results column ────────────────────────────────────────────────────────────

function ResultsColumn({ cards, label, mode, color }) {
  if (cards.filter(c => c.status !== "draft").length === 0) return null;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        textAlign: "center", marginBottom: 12, padding: "6px 12px", borderRadius: 6,
        background: color, color: T.accentText, fontSize: "0.65rem", fontFamily: "monospace",
        letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600,
      }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {CATEGORIES.map((cat, i) => {
          const best = getBestCard(cards, cat.key, mode);
          if (!best) return null;
          const allScored = cards.filter(c => c.status !== "draft").map(card => {
            const mult = card.multipliers[cat.key] ?? card.multipliers.other;
            return { card, pct: mult * CURRENCY_VALUES[card.currency][mode] * 100 };
          }).sort((a, b) => b.pct - a.pct);
          const runner = allScored[1];

          return (
            <div key={cat.key} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
              borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`,
              animation: `slideIn 0.27s ease ${i * 0.03}s both`,
            }}>
              <CardBadge card={best.card} width={58} height={37} isSelected />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.58rem", color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2, fontFamily: "monospace" }}>
                  {cat.icon} {cat.label}
                </div>
                <div style={{ fontSize: "0.78rem", color: T.text, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: "Georgia,serif" }}>
                  {best.card.shortName}
                </div>
                <div style={{ fontSize: "0.58rem", color: T.textDim, fontFamily: "monospace" }}>
                  {best.mult}× · {(CURRENCY_VALUES[best.card.currency][mode] * 100).toFixed(1)}¢/pt
                  {runner && Math.abs(runner.pct - best.pct) > 0.001 && (
                    <span style={{ color: T.textDim, opacity: 0.6 }}> vs {runner.pct.toFixed(1)}%</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: T.text, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                  {best.pct.toFixed(1)}%
                </div>
                <div style={{ fontSize: "0.53rem", color: T.textDim, fontFamily: "monospace" }}>
                  {mode === "cashback" ? "cash" : "travel"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [ownership, setOwnership] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_ownership_v2") || "{}"); }
    catch { return {}; }
  });
  const [names, setNames] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_names_v1") || '{"me":"Wallet 1","spouse":"Wallet 2"}'); }
    catch { return { me: "Wallet 1", spouse: "Wallet 2" }; }
  });
  const [editingName, setEditingName] = useState(null);
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("cp_mode_v1") || "cashback"; }
    catch { return "cashback"; }
  });
  const [view, setView] = useState(() => {
    try {
      const o = JSON.parse(localStorage.getItem("cp_ownership_v2") || "{}");
      return Object.keys(o).length > 0 ? "results" : "pick";
    } catch { return "pick"; }
  });
  const [search, setSearch] = useState("");
  const [issuerFilter, setIssuerFilter] = useState(null);

  useEffect(() => {
    try { localStorage.setItem("cp_ownership_v2", JSON.stringify(ownership)); } catch {}
  }, [ownership]);
  useEffect(() => {
    try { localStorage.setItem("cp_mode_v1", mode); } catch {}
  }, [mode]);
  useEffect(() => {
    try { localStorage.setItem("cp_names_v1", JSON.stringify(names)); } catch {}
  }, [names]);

  const ISSUERS = [...new Set(CARDS.filter(c => c.status === "supported").map(c => c.issuer))];

  const filtered = CARDS.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
    const matchesIssuer = !issuerFilter || c.issuer === issuerFilter;
    return matchesSearch && matchesIssuer;
  });

  const assigned = id => !!ownership[id];

  const sortedFiltered = [
    ...filtered.filter(c => assigned(c.id)),
    ...filtered.filter(c => !assigned(c.id) && c.status !== "draft"),
    ...filtered.filter(c => !assigned(c.id) && c.status === "draft"),
  ];

  const meCards = ownerCards(ownership, "me");
  const spouseCards = ownerCards(ownership, "spouse");
  const totalAssigned = Object.keys(ownership).length;

  const isSingleWallet = meCards.length > 0 && spouseCards.length === 0;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "Georgia,serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; }
        .mono { font-family: 'DM Mono','Courier New',monospace; }
        .serif { font-family: 'DM Serif Display',Georgia,serif; }
        .card-row { transition: background 0.12s, box-shadow 0.12s; cursor: pointer; }
        .card-row:hover { background: ${T.surfaceAlt} !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06) !important; }
        .card-row.draft-row { cursor: default; }
        .card-row.draft-row:hover { background: ${T.surface} !important; box-shadow: none !important; }
        .pill-btn { transition: all 0.12s; cursor: pointer; border: none; }
        .pill-btn:hover { opacity: 0.82; }
        @keyframes slideIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .slide-in { animation: slideIn 0.22s ease both; }
        .tab-btn { transition: color 0.12s; cursor: pointer; border: none; background: transparent; }
        input[type=text] { outline: none; }
        input::placeholder { color: ${T.textDim}; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${T.surfaceAlt}; border-radius: 2px; }
        .name-input { border: none; background: transparent; font-family: 'DM Mono',monospace; font-size: 0.75rem; font-weight: 600; color: ${T.text}; width: 100px; border-bottom: 1px solid ${T.border}; outline: none; padding: 0 2px; }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 20px", position: "sticky", top: 0, zIndex: 10, background: T.topbar, backdropFilter: "blur(10px)", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <span className="serif" style={{ fontSize: "1.18rem", color: T.text }}>CardPicker</span>
          <div style={{ display: "flex", gap: 0, background: T.surfaceAlt, borderRadius: 7, padding: 3, border: `1px solid ${T.border}` }}>
            {["cashback", "travel"].map(m => (
              <button key={m} className="mono pill-btn" onClick={() => setMode(m)} style={{
                padding: "5px 13px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 500,
                letterSpacing: "0.05em", textTransform: "uppercase",
                background: mode === m ? T.accent : "transparent",
                color: mode === m ? T.accentText : T.textMid,
              }}>
                {m === "cashback" ? "Cash Back" : "Travel"}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex" }}>
          {[
            { id: "pick",    label: totalAssigned ? `My Cards (${totalAssigned})` : "My Cards" },
            { id: "results", label: "Best Card Per Category" },
          ].map(tab => (
            <button key={tab.id} className="mono tab-btn" onClick={() => setView(tab.id)} style={{
              padding: "10px 17px", color: view === tab.id ? T.text : T.textDim,
              fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase",
              borderBottom: view === tab.id ? `2px solid ${T.accent}` : "2px solid transparent",
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 20px 52px" }}>

        {/* ═══ PICK VIEW ═══ */}
        {view === "pick" && (
          <div className="slide-in">
            {/* Wallet name labels */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16, padding: "10px 14px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
              <span className="mono" style={{ fontSize: "0.63rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0 }}>Wallets:</span>
              {["me", "spouse"].map(who => (
                <div key={who} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: T.accentText, fontFamily: "monospace", fontWeight: 700 }}>{who === "me" ? "ME" : "SP"}</span>
                  </div>
                  {editingName === who ? (
                    <input
                      className="name-input"
                      autoFocus
                      value={names[who]}
                      onChange={e => setNames(prev => ({ ...prev, [who]: e.target.value }))}
                      onBlur={() => setEditingName(null)}
                      onKeyDown={e => e.key === "Enter" && setEditingName(null)}
                    />
                  ) : (
                    <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 600, color: T.text, cursor: "pointer", borderBottom: `1px dashed ${T.border}` }}
                      onClick={() => setEditingName(who)}>{names[who]}</span>
                  )}
                  <span style={{ fontSize: "0.6rem", color: T.textDim, cursor: "pointer" }} onClick={() => setEditingName(who)}>✎</span>
                </div>
              ))}
              <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim, marginLeft: "auto" }}>Click a name to rename</span>
            </div>

            <p className="mono" style={{ color: T.textDim, fontSize: "0.67rem", marginBottom: 14, letterSpacing: "0.04em" }}>
              ASSIGN EACH CARD TO ME, SPOUSE, OR BOTH — WE'LL BUILD YOUR CHEAT SHEET
            </p>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: T.textDim, pointerEvents: "none", fontSize: "1rem" }}>⌕</span>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setIssuerFilter(null); }}
                placeholder="Search by card or issuer..." className="mono"
                style={{ width: "100%", padding: "9px 12px 9px 30px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: "0.8rem" }} />
            </div>

            {/* Issuer filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {[null, ...ISSUERS].map(issuer => {
                const active = issuerFilter === issuer;
                return (
                  <button key={issuer || "all"} className="mono pill-btn" onClick={() => setIssuerFilter(active ? null : issuer)} style={{
                    padding: "4px 11px", borderRadius: 20, fontSize: "0.66rem", fontWeight: 500, letterSpacing: "0.04em",
                    border: `1px solid ${active ? T.accent : T.border}`,
                    background: active ? T.accent : "transparent",
                    color: active ? T.accentText : T.textMid,
                  }}>{issuer || "All"}</button>
                );
              })}
            </div>

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedFiltered.map(card => {
                const own = ownership[card.id] || null;
                const isAssigned = !!own;
                const isDraft = card.status === "draft";

                const setOwn = (val) => {
                  setOwnership(prev => {
                    const updated = { ...prev };
                    if (!val) delete updated[card.id];
                    else updated[card.id] = val;
                    return updated;
                  });
                };

                // Clicking the row toggles: unassigned → me → unassigned (simple toggle)
                // Dropdown handles me / spouse / both / none precisely
                const handleRowClick = () => {
                  if (isDraft) return;
                  setOwn(own ? null : "me");
                };

                return (
                  <div key={card.id} className={`card-row${isDraft ? " draft-row" : ""}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 13, padding: "11px 13px", borderRadius: 9,
                      background: isAssigned ? T.selectedBg : T.surface,
                      border: `1px solid ${isAssigned ? T.selectedBorder : T.border}`,
                      opacity: isDraft ? 0.55 : 1,
                    }}
                    onClick={handleRowClick}
                  >
                    <CardBadge card={card} width={76} height={48} isSelected={isAssigned} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                        <span className="serif" style={{ fontSize: "0.87rem", color: isAssigned ? T.text : T.textMid, lineHeight: 1.2 }}>{card.name}</span>
                        <span className="mono" style={{ fontSize: "0.58rem", color: T.textDim, border: `1px solid ${T.border}`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>{card.currency}</span>
                        {isDraft && <span className="mono" style={{ fontSize: "0.57rem", color: T.textDim, border: `1px dashed ${T.border}`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>coming soon</span>}
                      </div>
                      <MultiplierLine card={card} />
                    </div>

                    {/* Ownership dropdown */}
                    {!isDraft && (
                      <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <select
                          value={own || ""}
                          onChange={e => setOwn(e.target.value || null)}
                          className="mono"
                          style={{
                            padding: "5px 8px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 600,
                            border: `1px solid ${isAssigned ? T.selectedBorder : T.border}`,
                            background: isAssigned ? T.accent : T.surface,
                            color: isAssigned ? T.accentText : T.textDim,
                            cursor: "pointer", outline: "none", appearance: "auto",
                            minWidth: 90,
                          }}
                        >
                          <option value="">— none —</option>
                          <option value="me">{names.me}</option>
                          <option value="spouse">{names.spouse}</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalAssigned > 0 && (
              <button className="mono pill-btn" onClick={() => setView("results")} style={{
                marginTop: 18, width: "100%", padding: "13px", background: T.accent, color: T.accentText,
                borderRadius: 8, fontWeight: 600, fontSize: "0.76rem", letterSpacing: "0.07em", textTransform: "uppercase",
              }}>
                See Cheat Sheet →
              </button>
            )}
          </div>
        )}

        {/* ═══ RESULTS VIEW ═══ */}
        {view === "results" && (
          <div className="slide-in">
            {totalAssigned === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p className="serif" style={{ fontSize: "1.15rem", marginBottom: 8, color: T.textMid }}>No cards assigned</p>
                <p className="mono" style={{ fontSize: "0.7rem", color: T.textDim, marginBottom: 18 }}>Go to "My Cards" and assign cards to each wallet</p>
                <button className="mono pill-btn" onClick={() => setView("pick")} style={{ padding: "10px 22px", background: T.accent, color: T.accentText, borderRadius: 6, fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Assign Cards
                </button>
              </div>
            ) : isSingleWallet ? (
              /* Single wallet — full width */
              <div>
                <div style={{ textAlign: "center", marginBottom: 14, padding: "6px 12px", borderRadius: 6, background: T.accent, color: T.accentText, fontSize: "0.65rem", fontFamily: "monospace", letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600, display: "inline-block" }}>
                  {names.me}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {CATEGORIES.map((cat, i) => {
                    const best = getBestCard(meCards, cat.key, mode);
                    if (!best) return null;
                    const allScored = meCards.filter(c => c.status !== "draft").map(card => {
                      const mult = card.multipliers[cat.key] ?? card.multipliers.other;
                      return { card, pct: mult * CURRENCY_VALUES[card.currency][mode] * 100 };
                    }).sort((a, b) => b.pct - a.pct);
                    const runner = allScored[1];
                    return (
                      <div key={cat.key} style={{
                        display: "flex", alignItems: "center", gap: 13, padding: "12px 13px", borderRadius: 9,
                        background: T.surface, border: `1px solid ${T.border}`,
                        animation: `slideIn 0.27s ease ${i * 0.03}s both`,
                      }}>
                        <CardBadge card={best.card} width={76} height={48} isSelected />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="mono" style={{ fontSize: "0.61rem", color: T.textDim, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{cat.icon} {cat.label}</div>
                          <div className="serif" style={{ fontSize: "0.86rem", color: T.text, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{best.card.name}</div>
                          <div className="mono" style={{ fontSize: "0.63rem", color: T.textMid }}>
                            {best.mult}× {best.card.currency}
                            <span style={{ color: T.border, margin: "0 3px" }}>·</span>
                            <span style={{ color: T.textMid }}>{(CURRENCY_VALUES[best.card.currency][mode] * 100).toFixed(1)}¢/pt</span>
                            {runner && Math.abs(runner.pct - best.pct) > 0.001 && (
                              <span style={{ color: T.textDim, marginLeft: 6 }}>vs {runner.pct.toFixed(1)}% {runner.card.shortName}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 500, color: T.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{best.pct.toFixed(1)}%</div>
                          <div className="mono" style={{ fontSize: "0.57rem", color: T.textDim, marginTop: 3 }}>{mode === "cashback" ? "cash back" : "travel val."}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Dual wallet — side by side */
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <ResultsColumn cards={meCards} label={names.me} mode={mode} color={T.accent} />
                <ResultsColumn cards={spouseCards} label={names.spouse} mode={mode} color="#4b5563" />
              </div>
            )}

            <p className="mono" style={{ marginTop: 14, fontSize: "0.57rem", color: T.textDim, textAlign: "center" }}>
              Ties broken by card versatility · Multipliers simplified
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
