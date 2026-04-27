import React, { useState, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

// Higher = more flexible/transferable (used as tiebreaker)
const CURRENCY_FLEXIBILITY = {
  UR:       4,  // Chase — transfer to Hyatt, United, etc.
  MR:       4,  // Amex — transfer to Delta, Marriott, etc.
  CAPONE:   3,  // Capital One — transfer to Air Canada, Turkish, etc.
  TYP:      3,  // Citi — transfer to Turkish, Avianca, etc.
  CASHBACK: 1,  // Fixed cash, no transfer upside
};

const CURRENCY_VALUES = {
  UR:       { cashback: 0.01,  travel: 0.015 },
  MR:       { cashback: 0.006, travel: 0.01  },
  CAPONE:   { cashback: 0.01,  travel: 0.01  },
  TYP:      { cashback: 0.01,  travel: 0.01  },
  CASHBACK: { cashback: 0.01,  travel: 0.01  },
};

// Light mode categories — shown always
const CATEGORIES_LIGHT = [
  { key: "dining",      label: "Dining",           icon: "🍽️" },
  { key: "groceries",   label: "Groceries",        icon: "🛒" },
  { key: "gas",         label: "Gas",              icon: "⛽" },
  { key: "travel",      label: "Travel",           icon: "✈️" },
  { key: "transit",     label: "Transit",          icon: "🚇" },
  { key: "drugstores",  label: "Drugstores",       icon: "💊" },
  { key: "amazon",      label: "Amazon",           icon: "📦" },
  { key: "other",       label: "Everything Else",  icon: "💳" },
];

// Advanced-only categories — shown in advanced mode
const CATEGORIES_ADVANCED = [
  { key: "streaming",       label: "Streaming",            icon: "📺" },
  { key: "online",          label: "Online Retail",        icon: "🛍️" },
  { key: "homeimprove",     label: "Home Improvement",     icon: "🔨" },


  { key: "lyft",            label: "Lyft",                 icon: "🚗" },
  { key: "uber",            label: "Uber",                 icon: "🚕" },
  { key: "peloton",         label: "Peloton",              icon: "🚴" },
  { key: "entertainment",   label: "Entertainment",        icon: "🎟️" },
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


// ─── Profile Code encode/decode ───────────────────────────────────────────────
// Format: names are base64'd, ownership is compact card index + owner char
// e.g. "W1:Alice,W2:Bob|0m,3b,5s" (card index:owner m=me s=spouse b=both)

function encodeProfile(ownership, names, mode, cards) {
  const cardIds = (cards || []).map(c => c.id);
  const ownerChar = { me: "m", spouse: "s", both: "b" };
  const entries = Object.entries(ownership)
    .map(([id, own]) => {
      const idx = cardIds.indexOf(id);
      return idx >= 0 ? `${idx}${ownerChar[own]}` : null;
    })
    .filter(Boolean)
    .join(",");
  const n1 = btoa(encodeURIComponent(names.me)).replace(/=/g, "");
  const n2 = btoa(encodeURIComponent(names.spouse)).replace(/=/g, "");
  const m = mode === "travel" ? "t" : "c";
  return `${n1}.${n2}.${m}.${entries}`;
}

function decodeProfile(code, cardsList) {
  try {
    const raw = code.trim();
    const stripped = raw.includes("_") ? raw.slice(raw.indexOf("_") + 1) : raw;
    const parts = stripped.split(".");
    if (parts.length < 4) return null;
    const [n1, n2, m, ...rest] = parts;
    const entries = rest.join("."); // in case names had dots somehow
    const names = {
      me: decodeURIComponent(atob(n1 + "==".slice(0, (4 - n1.length % 4) % 4))),
      spouse: decodeURIComponent(atob(n2 + "==".slice(0, (4 - n2.length % 4) % 4))),
    };
    const mode = m === "t" ? "travel" : "cashback";
    const cardIds = (cardsList || []).map(c => c.id);
    const charOwner = { m: "me", s: "spouse", b: "both" };
    const ownership = {};
    if (entries) {
      entries.split(",").forEach(entry => {
        const idx = parseInt(entry.slice(0, -1));
        const own = charOwner[entry.slice(-1)];
        if (!isNaN(idx) && own && cardIds[idx]) ownership[cardIds[idx]] = own;
      });
    }
    return { ownership, names, mode };
  } catch {
    return null;
  }
}

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

function MultiplierLine({ card, advancedMode }) {
  const cats = advancedMode ? [...CATEGORIES_LIGHT, ...CATEGORIES_ADVANCED] : CATEGORIES_LIGHT;
  const _t = new Date(); const allMults = cats.map(cat => effectiveMult(card, cat.key, _t));
  const allSame = allMults.every(m => m === allMults[0]);

  // If all categories earn the same rate, just say "Nx on everything"
  if (allSame) {
    const m = allMults[0];
    return (
      <span style={{ fontSize: "0.66rem", fontFamily: "monospace" }}>
        <span style={{ color: m >= 2 ? T.textMid : T.textDim, fontWeight: m >= 2 ? 500 : 400 }}>{m}×</span>
        <span style={{ color: T.textDim }}> on everything</span>
      </span>
    );
  }

  // Show categories that beat the "other" floor
  const floor = card.multipliers.other ?? 1;
  // Include whole_foods and wholesale_clubs as virtual display categories if they differ
  const extraCats = [];
  if ((card.multipliers.whole_foods ?? 1) !== (card.multipliers.groceries ?? 1) &&
      (card.multipliers.whole_foods ?? 1) > floor) {
    extraCats.push({ key: "whole_foods", label: "Whole Foods", icon: "🥦" });
  }
  if ((card.multipliers.wholesale_clubs ?? 1) !== (card.multipliers.groceries ?? 1) &&
      (card.multipliers.wholesale_clubs ?? 1) > floor) {
    extraCats.push({ key: "wholesale_clubs", label: "Wholesale Clubs", icon: "🏪" });
  }
  const highlights = [...cats, ...extraCats]
    .map(cat => ({
      cat,
      mult: (cat.key === "whole_foods" || cat.key === "wholesale_clubs" || cat.key === "groceries_big_box")
        ? (card.multipliers[cat.key] ?? 1)
        : effectiveMult(card, cat.key)
    }))
    .filter(x => x.mult > floor || (floor > 1 && x.cat.key === "other"))
    .sort((a, b) => b.mult - a.mult);

  // If nothing beats the floor, just show the flat rate
  const bonusHighlights = highlights.filter(h => h.cat.key !== "other");

  return (
    <span style={{ fontSize: "0.66rem", fontFamily: "monospace", lineHeight: 1.65 }}>
      {bonusHighlights.map((h, i) => (
        <span key={h.cat.key}>
          {i > 0 && <span style={{ color: T.textDim }}> · </span>}
          <span style={{
            color: h.mult >= 5 ? "#b45309" : h.mult >= 4 ? "#c2690a" : h.mult >= 3 ? T.text : T.textMid,
            fontWeight: h.mult >= 3 ? 600 : 400,
          }}>{h.mult}×</span>
          <span style={{ color: T.textMid }}> {h.cat.label.toLowerCase()}</span>
        </span>
      ))}
      {floor > 1 && (
        <span>
          {bonusHighlights.length > 0 && <span style={{ color: T.textDim }}> · </span>}
          <span style={{ color: T.textDim }}>{floor}× everything else</span>
        </span>
      )}
      {floor === 1 && bonusHighlights.length === 0 && (
        <span style={{ color: T.textDim }}>1× on everything</span>
      )}
    </span>
  );
}

// ─── Scoring helpers ─────────────────────────────────────────────────────────
// Compute today once at render time — passed into helpers to avoid repeated new Date() calls
// Note: module-level TODAY is fine for a session; components pass their own if needed



function effectiveStatus(card, today) {
  if (card.status !== "supported") return card.status;
  if (!card.rotatingPeriod) return "supported";
  const start = new Date(card.rotatingPeriod.start);
  const end = new Date(card.rotatingPeriod.end);
  end.setHours(23, 59, 59); // include last day
  return today >= start && today <= end ? "supported" : "draft";
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function effectiveMult(card, catKey, today) {
  // Special keys that live directly in multipliers but not in CATEGORIES
  if (catKey === "whole_foods" || catKey === "groceries_big_box" || catKey === "wholesale_clubs" ||
      catKey === "target" || catKey === "walmart" ||
      catKey.startsWith("usb_")) {
    return card.multipliers[catKey] ?? card.multipliers.other ?? 1;
  }
  let catMult = card.multipliers[catKey] ?? 1;
  const otherMult = card.multipliers.other ?? 1;

  // Check timedBonuses — if expired, fall back to base multiplier for that category
  if (card.timedBonuses) {
    card.timedBonuses.forEach(tb => {
      if (tb.categories.includes(catKey)) {
        const end = new Date(tb.end);
        end.setHours(23, 59, 59);
        if (today > end) {
          // Timed bonus expired — use base (1x) for that category
          catMult = 1;
        }
      }
    });
  }

  return catKey === "other" ? otherMult : Math.max(catMult, otherMult);
}

// Get active timed bonus notes for a card (not expired)
function activeTimedNotes(card, today) {
  if (!card.timedBonuses) return [];
  return card.timedBonuses.filter(tb => {
    const end = new Date(tb.end);
    end.setHours(23, 59, 59);
    return today <= end;
  }).map(tb => tb.note);
}

const ALL_CATEGORIES = [...CATEGORIES_LIGHT, ...CATEGORIES_ADVANCED];

function computeBreadth(card, mode) {
  return ALL_CATEGORIES.reduce((acc, cat) => {
    return acc + effectiveMult(card, cat.key, new Date()) * CURRENCY_VALUES[card.currency][mode];
  }, 0);
}

// Returns true if a card's bonus for a category is permanent (not rotating/timed)
function isPermanentBonus(card, catKey, today) {
  if (!card.rotatingCategories || !card.rotatingCategories.includes(catKey)) {
    // Check timedBonuses too
    if (card.timedBonuses) {
      return !card.timedBonuses.some(tb => {
        if (!tb.categories.includes(catKey)) return false;
        const end = new Date(tb.end);
        end.setHours(23, 59, 59);
        return today <= end; // still active = timed = not permanent
      });
    }
    return true;
  }
  return false; // rotating category = not permanent
}

function getBestCard(cards, category, mode, pointsPref) {
  const _today = new Date();
  const eligible = cards.filter(c => effectiveStatus(c, _today) !== "draft");
  if (!eligible.length) return null;
  const scored = eligible.map(card => {
    const mult = effectiveMult(card, category, _today);
    const cv = CURRENCY_VALUES[card.currency][mode];
    return { card, mult, value: mult * cv, pct: mult * cv * 100, breadth: computeBreadth(card, mode) };
  });
  const PREF_THRESHOLD = 0.005; // 0.5% — within this margin, prefer chosen currency
  scored.sort((a, b) => {
    const diff = Math.abs(a.value - b.value);
    if (diff > 0.00001) return b.value - a.value; // clear winner by score

    // Tied — apply tiebreakers in order:

    // 1. Permanent bonus beats rotating/timed bonus
    const aPermament = isPermanentBonus(a.card, category) ? 1 : 0;
    const bPermanent = isPermanentBonus(b.card, category) ? 1 : 0;
    if (aPermament !== bPermanent) return bPermanent - aPermament;

    // 2. Amazon category: prefer Amazon Prime card
    if (category === "amazon" || category === "whole_foods") {
      const aAmazon = a.card.id === "chase_prime" ? 1 : 0;
      const bAmazon = b.card.id === "chase_prime" ? 1 : 0;
      if (aAmazon !== bAmazon) return bAmazon - aAmazon;
    }

    // 3. Points preference (soft tiebreaker)
    if (pointsPref && pointsPref !== "none") {
      const aMatch = a.card.currency === pointsPref ? 1 : 0;
      const bMatch = b.card.currency === pointsPref ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
    }

    // 4. Transferable points beat fixed cash back (same floor value, more upside)
    const aFlex = CURRENCY_FLEXIBILITY[a.card.currency] || 1;
    const bFlex = CURRENCY_FLEXIBILITY[b.card.currency] || 1;
    if (aFlex !== bFlex) return bFlex - aFlex;

    // 5. Breadth (most versatile card)
    return b.breadth - a.breadth;
  });
  return scored[0];
}

// ─── Wallet ownership: "me" | "spouse" | "both" ────────────────────────────────

function ownerCards(ownership, who, cards) {
  return cards.filter(c => {
    const o = ownership[c.id];
    return (o === who || o === "both");
  });
}

// ─── Results column ────────────────────────────────────────────────────────────

// Build card-first results: for each card, which categories does it win?
// US Bank Cash+ specific category labels (mapped to existing keys or custom)
const USB_5X_CATS = [
  { key: "streaming",       label: "TV, Internet & Streaming" },
  { key: "homeimprove",     label: "Home Utilities" },
  { key: "entertainment",   label: "Movie Theaters" },
  { key: "usb_cellphone",   label: "Cell Phone Providers" },
  { key: "usb_electronics", label: "Electronics Stores" },
  { key: "usb_department",  label: "Department Stores" },
  { key: "dining",          label: "Fast Food / Dining" },
  { key: "usb_furniture",   label: "Furniture Stores" },
  { key: "travel",          label: "Ground Transportation" },
  { key: "usb_gym",         label: "Gyms & Fitness" },
  { key: "usb_clothing",    label: "Clothing Stores" },
  { key: "usb_sporting",    label: "Sporting Goods" },
];
const USB_2X_CATS = [
  { key: "gas",       label: "Gas & EV Charging" },
  { key: "groceries", label: "Grocery Stores" },
  { key: "dining",    label: "Restaurants" },
];

// Sub-categories that show inline under their parent category
const GROCERY_SUBS = [
  { key: "whole_foods",       label: "Whole Foods",                   icon: "🥦", parent: "groceries" },
  { key: "groceries_big_box", label: "Target / Walmart",              icon: "🏬", parent: "groceries" },
  { key: "target",            label: "Target",                        icon: "🎯", parent: "groceries", parentSub: "groceries_big_box" },
  { key: "walmart",           label: "Walmart",                       icon: "🛒", parent: "groceries", parentSub: "groceries_big_box" },
  { key: "wholesale_clubs",   label: "Wholesale Clubs (Costco etc.)", icon: "🏪", parent: "groceries" },
];
const TRAVEL_SUBS = [
  { key: "travel_portal",   label: "Via Portal",                    icon: "🌐", parent: "travel" },
];
const ALL_SUBS = [...GROCERY_SUBS, ...TRAVEL_SUBS];

function buildCardResults(cards, mode, pointsPref, categories) {
  const _today = new Date();
  const eligible = cards.filter(c => effectiveStatus(c, _today) !== "draft");
  if (!eligible.length) return [];

  // For each category, find the winning card
  const catWinners = {};
  categories.forEach(cat => {
    const best = getBestCard(eligible, cat.key, mode, pointsPref);
    if (best) {
      if (!catWinners[best.card.id]) catWinners[best.card.id] = [];
      const displayMult = effectiveMult(best.card, cat.key, _today);
      const cv = CURRENCY_VALUES[best.card.currency][mode];
      catWinners[best.card.id].push({ cat, best: { ...best, mult: displayMult, pct: displayMult * cv * 100 }, subs: [] });
    }
  });

  // Cache parent results to avoid redundant getBestCard calls
  const parentResultCache = {};
  categories.forEach(cat => {
    parentResultCache[cat.key] = getBestCard(eligible, cat.key, mode, pointsPref);
  });

  // For each sub-category, find winner and attach to parent winner if different
  ALL_SUBS.forEach(sub => {
    const parentCat = categories.find(c => c.key === sub.parent);
    if (!parentCat) return;
    const subBest = getBestCard(eligible, sub.key, mode, pointsPref);
    if (!subBest) return;
    const parentBest = parentResultCache[sub.parent];
    const parentCardId = parentBest?.card.id;
    if (parentCardId && catWinners[parentCardId]) {
      const parentWin = catWinners[parentCardId].find(w => w.cat.key === sub.parent);
      if (parentWin) {
        const subMult = effectiveMult(subBest.card, sub.key, _today);
        const subCv = CURRENCY_VALUES[subBest.card.currency][mode];
        // Only add sub if it differs from parent winner OR is a different card
        const isSameCard = subBest.card.id === parentCardId;
        const isSameMult = Math.abs(subMult * subCv - parentWin.best.mult * CURRENCY_VALUES[parentWin.best.card.currency][mode]) < 0.0001;
        if (!isSameCard || !isSameMult) {
          parentWin.subs.push({
            sub,
            card: subBest.card,
            mult: subMult,
            pct: subMult * subCv * 100,
            sameAsParent: isSameCard,
          });
        }
      }
    }
  });

  // Build one entry per winning card
  const results = eligible
    .filter(card => catWinners[card.id])
    .map(card => {
      const wins = catWinners[card.id].slice().sort((a, b) => {
        if (a.cat.key === "other") return 1;
        if (b.cat.key === "other") return -1;
        if (b.best.mult !== a.best.mult) return b.best.mult - a.best.mult;
        return a.cat.label.localeCompare(b.cat.label);
      });
      return { card, wins };
    });

  // Sort: cards that win "other" (even alongside other categories) go last
  results.sort((a, b) => {
    const aHasOther = a.wins.some(w => w.cat.key === "other");
    const bHasOther = b.wins.some(w => w.cat.key === "other");
    if (aHasOther && !bHasOther) return 1;
    if (!aHasOther && bHasOther) return -1;
    return 0;
  });

  return results;
}

// ─── Shared SubRow component ─────────────────────────────────────────────────
function SubRow({ sub, card, mult, pct, sameAsParent, compact = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: compact ? "3px 12px 3px 20px" : "3px 14px 3px 24px",
      background: "rgba(0,0,0,0.03)", borderTop: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: compact ? 5 : 6 }}>
        <span style={{ fontSize: compact ? "0.65rem" : "0.7rem" }}>{sub.icon}</span>
        <span className="mono" style={{ fontSize: compact ? "0.58rem" : "0.6rem", color: T.textDim }}>{sub.label}</span>
        {!sameAsParent && (
          <span className="mono" style={{ fontSize: compact ? "0.55rem" : "0.58rem", color: "#1565c0" }}>
            → {card.shortName}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: compact ? 3 : 4 }}>
        {mult && <span className="mono" style={{ fontSize: compact ? "0.58rem" : "0.6rem", color: T.textDim }}>{mult}×</span>}
        <span className="mono" style={{
          fontSize: compact ? "0.7rem" : "0.82rem", fontWeight: 600,
          color: sameAsParent ? T.textMid : "#1565c0"
        }}>{pct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function ResultsColumn({ cards, label, mode, color, pointsPref, showMultipliers, categories }) {
  const _rt = new Date(); if (cards.filter(c => effectiveStatus(c, _rt) !== "draft").length === 0) return null;
  const cardResults = buildCardResults(cards, mode, pointsPref, categories);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        textAlign: "center", marginBottom: 12, padding: "6px 12px", borderRadius: 6,
        background: color, color: T.accentText, fontSize: "0.65rem", fontFamily: "monospace",
        letterSpacing: "0.07em", textTransform: "uppercase", fontWeight: 600,
      }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {cardResults.map(({ card, wins }, i) => (
          <div key={card.id} style={{
            borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`,
            overflow: "hidden", animation: `slideIn 0.27s ease ${i * 0.05}s both`,
          }}>
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: `1px solid ${T.border}` }}>
              <CardBadge card={card} width={62} height={39} isSelected />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="serif" style={{ fontSize: "0.85rem", color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.name}</div>
                <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{card.currency}</div>
              </div>
            </div>
            {/* Winning categories */}
            <div style={{ padding: "6px 0" }}>
              {showMultipliers ? wins.map(({ cat, best, subs }) => (
                <div key={cat.key}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: "0.75rem" }}>{cat.icon}</span>
                      <span className="mono" style={{ fontSize: "0.65rem", color: T.textMid }}>{cat.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="mono" style={{ fontSize: "0.62rem", color: T.textDim }}>{best.mult}×</span>
                      <span className="mono" style={{ fontSize: "0.78rem", fontWeight: 600, color: T.text }}>{best.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  {subs && subs.map(s => (
                    <SubRow key={s.sub.key} sub={s.sub} card={s.card} mult={s.mult} pct={s.pct} sameAsParent={s.sameAsParent} compact />
                  ))}
                </div>
              )) : (
                <div>
                  <div style={{ padding: "5px 12px" }}>
                    <span className="mono" style={{ fontSize: "0.65rem", color: T.textMid }}>
                      {wins.map(w => w.cat.key === "other" ? "everything else" : w.cat.label).join(", ")}
                    </span>
                  </div>
                  {wins.flatMap(w => (w.subs || []).filter(s => !s.sameAsParent)).map(s => (
                    <SubRow key={s.sub.key} sub={s.sub} card={s.card} pct={s.pct} sameAsParent={false} compact />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    fetch("/cards.json")
      .then(r => { if (!r.ok) throw new Error("fetch failed"); return r.json(); })
      .then(data => {
        if (Array.isArray(data)) {
          setCards(data);
        }
        setCardsLoading(false);
      })
      .catch(e => { console.error("cards.json load failed:", e); setCardsLoading(false); });
  }, []);

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
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showMultipliers, setShowMultipliers] = useState(false);

  // Active categories based on mode
  const CATEGORIES = advancedMode
    ? [...CATEGORIES_LIGHT, ...CATEGORIES_ADVANCED]
    : CATEGORIES_LIGHT;
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [yearOneCards, setYearOneCards] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_year_one_v1") || "[]"); }
    catch { return []; }
  });

  // Load profile from URL ?profile= param when cards are available
  useEffect(() => {
    if (!cards.length) return;
    const params = new URLSearchParams(window.location.search);
    const urlProfile = params.get("profile");
    if (urlProfile) {
      const result = decodeProfile(urlProfile, cards);
      if (result) {
        setOwnership(result.ownership);
        setNames(result.names);
        setMode(result.mode);
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [cards]);

  useEffect(() => {
    try { localStorage.setItem("cp_year_one_v1", JSON.stringify(yearOneCards)); } catch {}
  }, [yearOneCards]);

  const [cardConfig, setCardConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_card_config_v1") || "{}"); }
    catch { return {}; }
  });

  useEffect(() => {
    try { localStorage.setItem("cp_card_config_v1", JSON.stringify(cardConfig)); } catch {}
  }, [cardConfig]);

  // Build effective CARDS with configurable multipliers applied
  const effectiveCards = CARDS.map(card => {
    if (!card.configurable) return card;
    const newMults = { ...card.multipliers };

    if (card.configurable === "triple") {
      const cfg = cardConfig[card.id] || {};
      const picks5x = cfg.picks5x || [];
      const picks2x = cfg.picks2x || [];
      const fullyConfigured = picks5x.length === 2 && picks2x.length === 1;
      if (!fullyConfigured) return card;
      picks5x.forEach(k => { newMults[k] = card.configurableRate || 5; });
      picks2x.forEach(k => {
        // Only set 2x if not already higher from 5x pick
        if ((newMults[k] || 1) < (card.configurableRate2 || 2)) {
          newMults[k] = card.configurableRate2 || 2;
        }
      });
      return { ...card, multipliers: newMults };
    }

    const chosen = cardConfig[card.id] || [];
    const maxPicks = card.configurable === "double" ? 2 : 1;
    const fullyConfigured = chosen.length === maxPicks;
    if (!fullyConfigured) return card;
    const isYear1 = yearOneCards.includes(card.id) && card.configurableRateYear1;
    const rate = isYear1 ? card.configurableRateYear1 : (card.configurableRate || 5);
    chosen.forEach(catKey => { newMults[catKey] = rate; });
    return { ...card, multipliers: newMults };
  });

  const [pointsPref, setPointsPref] = useState(() => {
    try { return localStorage.getItem("cp_points_pref_v1") || "none"; } catch { return "none"; }
  });

  useEffect(() => {
    try { localStorage.setItem("cp_points_pref_v1", pointsPref); } catch {}
  }, [pointsPref]);

  const [view, setView] = useState("pick");
  const [search, setSearch] = useState("");
  const [issuerFilter, setIssuerFilter] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState(null);
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp_hidden_v1") || "[]"); }
    catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("cp_hidden_v1", JSON.stringify(hidden)); } catch {}
  }, [hidden]);

  const toggleHidden = (id) => {
    setHidden(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // also remove from ownership if hiding
    setOwnership(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }; // null | "both" | "me" | "spouse" | "none"
  const [showShare, setShowShare] = useState(false);
  const [loadCode, setLoadCode] = useState("");
  const [loadError, setLoadError] = useState("");
  const [copyDone, setCopyDone] = useState(false);
  const [profileLabel, setProfileLabel] = useState(() => {
    try { return localStorage.getItem("cp_label_v1") || ""; } catch { return ""; }
  });

  useEffect(() => {
    try { localStorage.setItem("cp_label_v1", profileLabel); } catch {}
  }, [profileLabel]);

  const rawCode = encodeProfile(ownership, names, mode, cards);
  const profileCode = profileLabel.trim() ? `${profileLabel.trim().replace(/\s+/g, "_")}_${rawCode}` : rawCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(profileCode).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const handleLoadCode = () => {
    const result = decodeProfile(loadCode, cards);
    if (!result) {
      setLoadError("Invalid code — please check and try again.");
      return;
    }
    setOwnership(result.ownership);
    setNames(result.names);
    setMode(result.mode);
    setLoadCode("");
    setLoadError("");
    setShowShare(false);
    setView(Object.keys(result.ownership).length > 0 ? "results" : "pick");
  };

  useEffect(() => {
    try { localStorage.setItem("cp_ownership_v2", JSON.stringify(ownership)); } catch {}
  }, [ownership]);
  useEffect(() => {
    try { localStorage.setItem("cp_mode_v1", mode); } catch {}
  }, [mode]);
  useEffect(() => {
    try { localStorage.setItem("cp_names_v1", JSON.stringify(names)); } catch {}
  }, [names]);

  const ISSUERS = [...new Set(effectiveCards.filter(c => c.status === "supported").map(c => c.issuer))];

  const filtered = effectiveCards.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
    const matchesIssuer = !issuerFilter || c.issuer === issuerFilter;
    return matchesSearch && matchesIssuer;
  });

  const assigned = id => !!ownership[id];

  const ownerFiltered = ownerFilter === null ? filtered : filtered.filter(c => {
    const own = ownership[c.id] || null;
    if (ownerFilter === "none") return !own;
    return own === ownerFilter;
  });

  // Separate hidden from visible — preserve original card order
  const visibleFiltered = ownerFiltered.filter(c => !hidden.includes(c.id));
  const hiddenFiltered  = filtered.filter(c => hidden.includes(c.id));
  const sortedFiltered  = visibleFiltered; // keep original catalog order

  const meCards = ownerCards(ownership, "me", effectiveCards);
  const spouseCards = ownerCards(ownership, "spouse", effectiveCards);
  const totalAssigned = Object.keys(ownership).length;

  const isSingleWallet = meCards.length > 0 && spouseCards.length === 0;

  if (cardsLoading || cards.length === 0) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
      <span className="mono" style={{ color: "#888", fontSize: "0.8rem", letterSpacing: "0.08em" }}>{cardsLoading ? "LOADING..." : "Failed to load cards. Please refresh."}</span>
    </div>
  );

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
          <span className="serif" style={{ fontSize: "1.18rem", color: T.text }}>CardOptimizer</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="mono pill-btn" onClick={() => setShowShare(s => !s)} style={{
              padding: "6px 12px", borderRadius: 6, fontSize: "0.66rem", fontWeight: 500,
              letterSpacing: "0.05em", border: `1px solid ${T.border}`,
              background: showShare ? T.accent : T.surface,
              color: showShare ? T.accentText : T.textMid,
              height: 32,
            }}>💾 Save / Load</button>
            <select value={pointsPref} onChange={e => setPointsPref(e.target.value)} className="mono" style={{
              padding: "0 8px", height: 32, borderRadius: 6,
              border: `1px solid ${pointsPref !== "none" ? T.selectedBorder : T.border}`,
              background: pointsPref !== "none" ? T.selectedBg : T.surface,
              color: T.text, fontSize: "0.66rem", cursor: "pointer", outline: "none",
            }}>
              <option value="none">Points: Any</option>
              <option value="UR">Points: UR (Chase)</option>
              <option value="MR">Points: MR (Amex)</option>
              <option value="CAPONE">Points: Capital One</option>
              <option value="TYP">Points: TYP (Citi)</option>
              <option value="CASHBACK">Points: Cash Back</option>
            </select>
            <div style={{ display: "flex", gap: 0, background: T.surfaceAlt, borderRadius: 7, padding: 3, border: `1px solid ${T.border}`, height: 32, alignItems: "center" }}>
              {["cashback", "travel"].map(m => (
                <button key={m} className="mono pill-btn" onClick={() => setMode(m)} style={{
                  padding: "4px 13px", borderRadius: 5, fontSize: "0.68rem", fontWeight: 500,
                  letterSpacing: "0.05em", textTransform: "uppercase",
                  background: mode === m ? T.accent : "transparent",
                  color: mode === m ? T.accentText : T.textMid,
                  height: 26,
                }}>
                  {m === "cashback" ? "Cash Back" : "Travel"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 0, background: T.surfaceAlt, borderRadius: 7, padding: 3, border: `1px solid ${advancedMode ? T.selectedBorder : T.border}`, height: 32, alignItems: "center" }}>
              {[false, true].map(adv => (
                <button key={String(adv)} className="mono pill-btn" onClick={() => setAdvancedMode(adv)} style={{
                  padding: "4px 11px", borderRadius: 5, fontSize: "0.64rem", fontWeight: 500,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  background: advancedMode === adv ? T.accent : "transparent",
                  color: advancedMode === adv ? T.accentText : T.textMid,
                  height: 26,
                }}>
                  {adv ? "Advanced" : "Simple"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Save/Load panel */}
        {showShare && (
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "12px 0 14px" }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 10 }}>
                  <p className="mono" style={{ fontSize: "0.63rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>Label (optional)</p>
                  <input
                    value={profileLabel}
                    onChange={e => setProfileLabel(e.target.value)}
                    placeholder="e.g. Smith"
                    className="mono"
                    style={{ padding: "7px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: "0.72rem", width: 180 }}
                  />
                  <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim, marginLeft: 8 }}>Prepended to your code so you can identify it later</span>
                </div>
                <p className="mono" style={{ fontSize: "0.63rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Your profile code</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input readOnly value={profileCode} className="mono"
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.text, fontSize: "0.68rem", fontFamily: "monospace" }}
                    onFocus={e => e.target.select()}
                  />
                  <button className="mono pill-btn" onClick={handleCopyCode} style={{
                    padding: "8px 14px", borderRadius: 6, background: copyDone ? "#66bb6a" : T.accent,
                    color: T.accentText, fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.04em", flexShrink: 0,
                    border: "none",
                  }}>{copyDone ? "✓ Copied!" : "Copy"}</button>
                  <button className="mono pill-btn" onClick={() => {
                    const url = `${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(rawCode)}`;
                    navigator.clipboard.writeText(url).then(() => {
                      setCopyDone(true);
                      setTimeout(() => setCopyDone(false), 2000);
                    });
                  }} style={{
                    padding: "8px 14px", borderRadius: 6, background: T.surface,
                    color: T.textMid, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.04em", flexShrink: 0,
                    border: `1px solid ${T.border}`,
                  }}>🔗 Share link</button>
                </div>
                <p className="mono" style={{ fontSize: "0.6rem", color: T.textDim, marginTop: 6 }}>Save this code. Paste it on any device to restore your wallet.</p>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <p className="mono" style={{ fontSize: "0.63rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Load a profile code</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    value={loadCode}
                    onChange={e => { setLoadCode(e.target.value); setLoadError(""); }}
                    placeholder="Paste your code here..."
                    className="mono"
                    style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: `1px solid ${loadError ? "#ef4444" : T.border}`, background: T.bg, color: T.text, fontSize: "0.68rem" }}
                    onKeyDown={e => e.key === "Enter" && handleLoadCode()}
                  />
                  <button className="mono pill-btn" onClick={handleLoadCode} style={{
                    padding: "8px 14px", borderRadius: 6, background: T.accent, color: T.accentText,
                    fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.04em", flexShrink: 0, border: "none",
                  }}>Load</button>
                </div>
                {loadError && <p className="mono" style={{ fontSize: "0.6rem", color: "#ef4444", marginTop: 5 }}>{loadError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex" }}>
          {[
            { id: "pick",      label: totalAssigned ? `My Cards (${totalAssigned})` : "My Cards" },
            { id: "results",   label: "Best Card Per Category" },
            { id: "cardtouse", label: "Card to Use" },
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

            {/* Owner filter dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim, letterSpacing: "0.04em" }}>SHOW:</span>
              <select value={ownerFilter ?? ""} onChange={e => setOwnerFilter(e.target.value || null)} className="mono" style={{
                padding: "5px 8px", borderRadius: 6, border: `1px solid ${ownerFilter ? T.selectedBorder : T.border}`,
                background: ownerFilter ? T.selectedBg : T.surface,
                color: T.text, fontSize: "0.68rem", cursor: "pointer", outline: "none",
              }}>
                <option value="">All cards</option>
                <option value="both">Both wallets</option>
                <option value="me">{names.me}</option>
                <option value="spouse">{names.spouse}</option>
                <option value="none">Unassigned</option>
              </select>
              {ownerFilter && (
                <button className="mono pill-btn" onClick={() => setOwnerFilter(null)} style={{
                  padding: "4px 8px", borderRadius: 5, fontSize: "0.62rem",
                  border: `1px solid ${T.border}`, background: "transparent", color: T.textDim,
                }}>✕ clear</button>
              )}
            </div>

            {/* Issuer filter pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
              <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim, letterSpacing: "0.04em", marginRight: 2 }}>ISSUER:</span>
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
              {issuerFilter && (
                <button className="mono pill-btn" onClick={() => setIssuerFilter(null)} style={{
                  padding: "4px 9px", borderRadius: 20, fontSize: "0.64rem",
                  border: `1px solid ${T.border}`, background: "transparent", color: T.textDim,
                }}>✕ clear</button>
              )}
            </div>

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sortedFiltered.map(card => {
                const own = ownership[card.id] || null;
                const isAssigned = !!own;
                const isDraft = effectiveStatus(card) === "draft";
                const isExpired = card.rotatingPeriod && effectiveStatus(card) === "draft" && card.status === "supported";

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
                        {isDraft && !card.rotatingPeriod && <span className="mono" style={{ fontSize: "0.57rem", color: T.textDim, border: `1px dashed ${T.border}`, borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>coming soon</span>}
                        {card.configurable && isAssigned && (() => {
                          if (card.configurable === "triple") {
                            const cfg = cardConfig[card.id] || {};
                            const picks5x = (cfg.picks5x || []).length;
                            const picks2x = (cfg.picks2x || []).length;
                            const done = picks5x === 2 && picks2x === 1;
                            return !done && (
                              <span className="mono" style={{ fontSize: "0.57rem", color: "#e67e22", border: "1px solid #e67e22", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>configure</span>
                            );
                          }
                          const chosen = cardConfig[card.id] || [];
                          const maxPicks = card.configurable === "double" ? 2 : 1;
                          const fullyConfigured = chosen.length === maxPicks;
                          return !fullyConfigured && (
                            <span className="mono" style={{ fontSize: "0.57rem", color: "#e67e22", border: "1px solid #e67e22", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                              {chosen.length === 0 ? "configure" : `pick ${maxPicks - chosen.length} more`}
                            </span>
                          );
                        })()}
                        {card.configurable && isAssigned && (() => {
                          if (card.configurable === "triple") {
                            const cfg = cardConfig[card.id] || {};
                            const picks5x = cfg.picks5x || [];
                            const picks2x = cfg.picks2x || [];
                            if (picks5x.length !== 2 || picks2x.length !== 1) return null;
                            const label5x = picks5x.map(k => USB_5X_CATS.find(c=>c.key===k)?.label || k).join(", ");
                            const label2x = USB_2X_CATS.find(c=>c.key===picks2x[0])?.label || picks2x[0];
                            return (
                              <span className="mono" style={{ fontSize: "0.57rem", color: "#2e7d32", border: "1px solid #66bb6a", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                                5× {label5x} · 2× {label2x}
                              </span>
                            );
                          }
                          const chosen = cardConfig[card.id] || [];
                          const maxPicks = card.configurable === "double" ? 2 : 1;
                          if (chosen.length !== maxPicks) return null;
                          const isYear1 = yearOneCards.includes(card.id) && card.configurableRateYear1;
                          const rate = isYear1 ? card.configurableRateYear1 : (card.configurableRate || 5);
                          const allCats = [...CATEGORIES_LIGHT, ...CATEGORIES_ADVANCED];
                          return (
                            <span className="mono" style={{ fontSize: "0.57rem", color: "#2e7d32", border: "1px solid #66bb6a", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>
                              {rate}× {chosen.map(k => allCats.find(c=>c.key===k)?.label).join(", ")}
                              {isYear1 && " (Y1)"}
                            </span>
                          );
                        })()}
                        {isExpired && <span className="mono" style={{ fontSize: "0.57rem", color: "#ef4444", border: "1px dashed #ef4444", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>period ended</span>}
                        {card.rotatingNote && !isExpired && !isDraft && <span className="mono" style={{ fontSize: "0.57rem", color: "#2e7d32", border: "1px solid #66bb6a", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>{card.rotatingNote}</span>}
                        {activeTimedNotes(card, new Date()).map((note, i) => (
                          <span key={i} className="mono" style={{ fontSize: "0.57rem", color: "#1565c0", border: "1px solid #90caf9", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>{note}</span>
                        ))}
                        {card._caveats?.groceries && (
                          <span className="mono" style={{ fontSize: "0.57rem", color: "#e67e22", border: "1px solid #f0a500", borderRadius: 3, padding: "1px 5px", flexShrink: 0 }}>⚠ excl. Target/Walmart/wholesale</span>
                        )}
                      </div>
                      <MultiplierLine card={card} advancedMode={advancedMode} />
                      {/* Configurable category picker */}
                      {card.configurable && isAssigned && (() => {
                        // Triple configurable (US Bank Cash+)
                        if (card.configurable === "triple") {
                          const cfg = cardConfig[card.id] || {};
                          const picks5x = cfg.picks5x || [];
                          const picks2x = cfg.picks2x || [];
                          const fullyConfigured = picks5x.length === 2 && picks2x.length === 1;
                          const set5x = (key) => setCardConfig(prev => {
                            const cur = ((prev[card.id] || {}).picks5x) || [];
                            const next = cur.includes(key) ? cur.filter(k => k !== key) : cur.length < 2 ? [...cur, key] : cur;
                            return { ...prev, [card.id]: { ...(prev[card.id] || {}), picks5x: next } };
                          });
                          const set2x = (key) => setCardConfig(prev => {
                            const cur = ((prev[card.id] || {}).picks2x) || [];
                            const next = cur.includes(key) ? [] : [key];
                            return { ...prev, [card.id]: { ...(prev[card.id] || {}), picks2x: next } };
                          });
                          return (
                            <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
                              {!fullyConfigured && (
                                <div className="mono" style={{ fontSize: "0.6rem", color: "#e67e22", marginBottom: 6, fontWeight: 600 }}>
                                  ⚠ Choose 2 categories at 5% and 1 at 2% to include in optimizer
                                </div>
                              )}
                              <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, marginBottom: 4 }}>5% categories (pick 2):</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                                {USB_5X_CATS.map(cat => {
                                  const isChosen = picks5x.includes(cat.key);
                                  const isDisabled = !isChosen && picks5x.length >= 2;
                                  return (
                                    <button key={cat.key + "_5x"} className="mono pill-btn"
                                      onClick={() => set5x(cat.key)} disabled={isDisabled}
                                      style={{
                                        padding: "2px 7px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 500,
                                        border: `1px solid ${isChosen ? T.selectedBorder : T.border}`,
                                        background: isChosen ? T.selectedBg : "transparent",
                                        color: isChosen ? "#2e7d32" : isDisabled ? T.textDim : T.textMid,
                                        opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? "not-allowed" : "pointer",
                                      }}>{cat.label}</button>
                                  );
                                })}
                              </div>
                              <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, marginBottom: 4 }}>2% category (pick 1):</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {USB_2X_CATS.map(cat => {
                                  const isChosen = picks2x.includes(cat.key);
                                  return (
                                    <button key={cat.key + "_2x"} className="mono pill-btn"
                                      onClick={() => set2x(cat.key)}
                                      style={{
                                        padding: "2px 7px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 500,
                                        border: `1px solid ${isChosen ? "#f0a500" : T.border}`,
                                        background: isChosen ? "#fff8e1" : "transparent",
                                        color: isChosen ? "#b45309" : T.textMid,
                                        cursor: "pointer",
                                      }}>{cat.label}</button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // Single / double configurable
                        const chosen = cardConfig[card.id] || [];
                        const maxPicks = card.configurable === "double" ? 2 : 1;
                        const needsConfig = chosen.length === 0;
                        return (
                          <div style={{ marginTop: 6 }} onClick={e => e.stopPropagation()}>
                            {(() => {
                              const isPartial = chosen.length > 0 && chosen.length < maxPicks;
                              const isEmpty = chosen.length === 0;
                              return (isEmpty || isPartial) && (
                                <div className="mono" style={{ fontSize: "0.6rem", color: "#e67e22", marginBottom: 4, fontWeight: 600 }}>
                                  {maxPicks === 1
                                    ? "⚠ Pick a category to include in optimizer"
                                    : isEmpty
                                      ? "⚠ Pick 2 categories to include in optimizer"
                                      : "⚠ Pick 1 more category to include in optimizer"}
                                </div>
                              );
                            })()}
                            {card.configurableRateYear1 && (
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
                                onClick={e => e.stopPropagation()}>
                                <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>Year 1 bonus active?</span>
                                <button
                                  onClick={() => setYearOneCards(prev =>
                                    prev.includes(card.id) ? prev.filter(id => id !== card.id) : [...prev, card.id]
                                  )}
                                  className="mono pill-btn"
                                  style={{
                                    padding: "2px 10px", borderRadius: 4, fontSize: "0.6rem", fontWeight: 600,
                                    border: `1px solid ${yearOneCards.includes(card.id) ? T.selectedBorder : T.border}`,
                                    background: yearOneCards.includes(card.id) ? T.selectedBg : "transparent",
                                    color: yearOneCards.includes(card.id) ? "#2e7d32" : T.textDim,
                                  }}>
                                  {yearOneCards.includes(card.id) ? `✓ Yes — ${card.configurableRateYear1}×` : `No — ${card.configurableRate}×`}
                                </button>
                              </div>
                            )}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {[...CATEGORIES_LIGHT, ...CATEGORIES_ADVANCED,
                                { key: "wholesale_clubs", label: "Wholesale Clubs", icon: "🏪" },
                                { key: "target",          label: "Target",          icon: "🎯" },
                                { key: "walmart",         label: "Walmart",         icon: "🛒" },
                              ].filter(c => c.key !== "other" && c.key !== "groceries_big_box").map(cat => {
                                const isChosen = chosen.includes(cat.key);
                                const isDisabled = !isChosen && chosen.length >= maxPicks;
                                return (
                                  <button key={cat.key} className="mono pill-btn"
                                    onClick={() => {
                                      setCardConfig(prev => {
                                        const cur = prev[card.id] || [];
                                        const next = isChosen
                                          ? cur.filter(k => k !== cat.key)
                                          : cur.length < maxPicks ? [...cur, cat.key] : cur;
                                        return { ...prev, [card.id]: next };
                                      });
                                    }}
                                    disabled={isDisabled}
                                    style={{
                                      padding: "2px 7px", borderRadius: 4, fontSize: "0.58rem", fontWeight: 500,
                                      border: `1px solid ${isChosen ? T.selectedBorder : T.border}`,
                                      background: isChosen ? T.selectedBg : "transparent",
                                      color: isChosen ? "#2e7d32" : isDisabled ? T.textDim : T.textMid,
                                      opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? "not-allowed" : "pointer",
                                    }}>
                                    {cat.icon} {cat.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Ownership dropdown + hide toggle */}
                    {!isDraft && (
                      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }} onClick={e => e.stopPropagation()}>
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
                        <button
                          title="Hide this card"
                          onClick={() => toggleHidden(card.id)}
                          className="pill-btn"
                          style={{
                            width: 28, height: 28, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
                            border: `1px solid ${T.border}`, background: T.surface,
                            color: T.textDim, fontSize: "0.85rem", cursor: "pointer", flexShrink: 0,
                          }}
                        >🙈</button>
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

            {/* Hidden cards section */}
            {hiddenFiltered.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span className="mono" style={{ fontSize: "0.6rem", color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Hidden Cards ({hiddenFiltered.length})
                  </span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, opacity: 0.6 }}>
                  {hiddenFiltered.map(card => (
                    <div key={card.id} style={{
                      display: "flex", alignItems: "center", gap: 13, padding: "9px 13px", borderRadius: 9,
                      background: T.surface, border: `1px solid ${T.border}`,
                    }}>
                      <CardBadge card={card} width={60} height={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className="serif" style={{ fontSize: "0.82rem", color: T.textMid }}>{card.name}</span>
                      </div>
                      <button className="mono pill-btn" onClick={() => toggleHidden(card.id)} style={{
                        padding: "4px 10px", borderRadius: 5, fontSize: "0.62rem", fontWeight: 600,
                        border: `1px solid ${T.border}`, background: "transparent", color: T.textMid,
                        flexShrink: 0,
                      }}>↩ Restore</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS VIEW ═══ */}
        {view === "results" && (
          <div className="slide-in">
            {/* Multiplier toggle */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button className="mono pill-btn" onClick={() => setShowMultipliers(s => !s)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: "0.65rem", fontWeight: 500,
                border: `1px solid ${showMultipliers ? T.selectedBorder : T.border}`,
                background: showMultipliers ? T.selectedBg : T.surface,
                color: showMultipliers ? "#2e7d32" : T.textMid,
              }}>{showMultipliers ? "✓ Showing multipliers" : "Show multipliers"}</button>
            </div>

            {totalAssigned === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p className="serif" style={{ fontSize: "1.15rem", marginBottom: 8, color: T.textMid }}>No cards assigned</p>
                <p className="mono" style={{ fontSize: "0.7rem", color: T.textDim, marginBottom: 18 }}>Go to "My Cards" and assign cards to each wallet</p>
                <button className="mono pill-btn" onClick={() => setView("pick")} style={{ padding: "10px 22px", background: T.accent, color: T.accentText, borderRadius: 6, fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Assign Cards
                </button>
              </div>
            ) : isSingleWallet ? (
              /* Single wallet — full width, card-first */
              <div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {buildCardResults(meCards, mode, pointsPref, CATEGORIES).map(({ card, wins }, i) => (
                    <div key={card.id} style={{
                      borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`,
                      overflow: "hidden", animation: `slideIn 0.27s ease ${i * 0.05}s both`,
                    }}>
                      {/* Card header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: `1px solid ${T.border}` }}>
                        <CardBadge card={card} width={76} height={48} isSelected />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="serif" style={{ fontSize: "0.92rem", color: T.text }}>{card.name}</div>
                          <div className="mono" style={{ fontSize: "0.62rem", color: T.textDim, marginTop: 2 }}>{card.currency} · {(CURRENCY_VALUES[card.currency][mode] * 100).toFixed(1)}¢/pt</div>
                        </div>
                      </div>
                      {/* Winning categories */}
                      <div style={{ padding: "4px 0" }}>
                        {showMultipliers ? wins.map(({ cat, best, subs }) => (
                          <div key={cat.key}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "0.85rem" }}>{cat.icon}</span>
                                <span className="mono" style={{ fontSize: "0.68rem", color: T.textMid }}>{cat.label}</span>
                                {cat.key === "groceries" && card._caveats?.groceries && (
                                  <span className="mono" style={{ fontSize: "0.55rem", color: "#e67e22" }}>⚠ excl. Target/Walmart</span>
                                )}
                              </div>
                              <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                                <span className="mono" style={{ fontSize: "0.65rem", color: T.textDim }}>{best.mult}×</span>
                                <span className="mono" style={{ fontSize: "0.9rem", fontWeight: 600, color: T.text }}>{best.pct.toFixed(1)}%</span>
                              </div>
                            </div>
                            {subs && subs.map(s => (
                              <SubRow key={s.sub.key} sub={s.sub} card={s.card} mult={s.mult} pct={s.pct} sameAsParent={s.sameAsParent} />
                            ))}
                          </div>
                        )) : (
                          <div>
                            <div style={{ padding: "6px 14px" }}>
                              <span className="mono" style={{ fontSize: "0.68rem", color: T.textMid }}>
                                {wins.map(w => w.cat.key === "other" ? "everything else" : w.cat.label).join(", ")}
                              </span>
                            </div>
                            {wins.flatMap(w => (w.subs || []).filter(s => !s.sameAsParent)).map(s => (
                              <SubRow key={s.sub.key} sub={s.sub} card={s.card} pct={s.pct} sameAsParent={false} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Dual wallet — side by side */
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <ResultsColumn cards={meCards} label={names.me} mode={mode} color={T.accent} pointsPref={pointsPref} showMultipliers={showMultipliers} categories={CATEGORIES} />
                <ResultsColumn cards={spouseCards} label={names.spouse} mode={mode} color="#4b5563" pointsPref={pointsPref} showMultipliers={showMultipliers} categories={CATEGORIES} />
              </div>
            )}

            <p className="mono" style={{ marginTop: 14, fontSize: "0.57rem", color: T.textDim, textAlign: "center" }}>
              Ties broken by card versatility · Multipliers simplified
            </p>
          </div>
        )}

        {/* ═══ CARD TO USE VIEW ═══ */}
        {view === "cardtouse" && (
          <div className="slide-in">
            {totalAssigned === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p className="serif" style={{ fontSize: "1.15rem", marginBottom: 8, color: T.textMid }}>No cards assigned yet</p>
                <p className="mono" style={{ fontSize: "0.7rem", color: T.textDim, marginBottom: 18 }}>Go to My Cards and assign cards to each wallet first</p>
                <button className="mono pill-btn" onClick={() => setView("pick")} style={{ padding: "10px 22px", background: T.accent, color: T.accentText, borderRadius: 6, fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.05em", textTransform: "uppercase", border: "none" }}>
                  Assign Cards
                </button>
              </div>
            ) : (
              <div>
                {/* Category picker */}
                <p className="mono" style={{ fontSize: "0.65rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 12 }}>
                  Where are you shopping?
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat.key} className="mono pill-btn"
                      onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                      style={{
                        padding: "10px 16px", borderRadius: 8, fontSize: "0.72rem", fontWeight: 500,
                        border: `1px solid ${selectedCategory === cat.key ? T.selectedBorder : T.border}`,
                        background: selectedCategory === cat.key ? T.selectedBg : T.surface,
                        color: selectedCategory === cat.key ? "#2e7d32" : T.textMid,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                      <span style={{ fontSize: "1rem" }}>{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Result */}
                {selectedCategory && (() => {
                  const cat = CATEGORIES.find(c => c.key === selectedCategory);
                  const wallets = [
                    { label: names.me,     cards: meCards,     color: T.accent },
                    { label: names.spouse, cards: spouseCards, color: "#4b5563" },
                  ].filter(w => w.cards.filter(c => effectiveStatus(c) !== "draft").length > 0);

                  return (
                    <div style={{ display: "flex", flexDirection: wallets.length > 1 ? "row" : "column", gap: 12 }}>
                      {wallets.map(wallet => {
                        const best = getBestCard(wallet.cards, selectedCategory, mode, pointsPref);
                        if (!best) return null;
                        const portalNote = selectedCategory === "travel" && best.card.multipliers.travel_portal > best.card.multipliers.travel;
                        // Sub-results for groceries
                        const bigBoxBest = selectedCategory === "groceries"
                          ? getBestCard(wallet.cards, "groceries_big_box", mode, pointsPref)
                          : null;
                        const bigBoxDiffers = bigBoxBest && bigBoxBest.card.id !== best.card.id;
                        const wholeFoodsBest = selectedCategory === "groceries"
                          ? getBestCard(wallet.cards, "whole_foods", mode, pointsPref)
                          : null;
                        const wholeFoodsDiffers = wholeFoodsBest && wholeFoodsBest.card.id !== best.card.id;
                        const wholesaleBest = selectedCategory === "groceries"
                          ? getBestCard(wallet.cards, "wholesale_clubs", mode, pointsPref)
                          : null;
                        const wholesaleDiffers = wholesaleBest && wholesaleBest.card.id !== best.card.id;
                        // Sub-result for travel portal
                        const portalBest = selectedCategory === "travel"
                          ? getBestCard(wallet.cards, "travel_portal", mode, pointsPref)
                          : null;
                        const portalDiffers = portalBest && portalBest.card.id !== best.card.id;
                        // Sub-results for Target and Walmart under groceries
                        const targetBest = selectedCategory === "groceries"
                          ? getBestCard(wallet.cards, "target", mode, pointsPref)
                          : null;
                        const walmartBest = selectedCategory === "groceries"
                          ? getBestCard(wallet.cards, "walmart", mode, pointsPref)
                          : null;
                        const targetDiffers = targetBest && targetBest.card.id !== (bigBoxBest?.card.id || best.card.id);
                        const walmartDiffers = walmartBest && walmartBest.card.id !== (bigBoxBest?.card.id || best.card.id);
                        return (
                          <div key={wallet.label} style={{ flex: 1, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
                            {/* Wallet label */}
                            <div style={{ background: wallet.color, color: T.accentText, padding: "8px 16px", fontFamily: "monospace", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                              {wallet.label}
                            </div>
                            {/* Primary card */}
                            <div style={{ padding: "20px 16px", background: T.surface, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
                              {selectedCategory === "groceries" && <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>Supermarkets</div>}
                              {selectedCategory === "travel" && <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim, letterSpacing: "0.05em", textTransform: "uppercase" }}>Direct with airline / hotel</div>}
                              <CardBadge card={best.card} width={160} height={101} isSelected />
                              <div>
                                <div className="serif" style={{ fontSize: "1.1rem", color: T.text, marginBottom: 4 }}>{best.card.name}</div>
                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6 }}>
                                  <span className="mono" style={{ fontSize: "1.8rem", fontWeight: 700, color: T.text, letterSpacing: "-0.03em" }}>{best.pct.toFixed(1)}%</span>
                                  <span className="mono" style={{ fontSize: "0.7rem", color: T.textDim }}>{mode === "cashback" ? "cash back" : "travel val."}</span>
                                </div>
                                <div className="mono" style={{ fontSize: "0.65rem", color: T.textDim, marginTop: 4 }}>
                                  {best.mult}× {best.card.currency} · {(CURRENCY_VALUES[best.card.currency][mode] * 100).toFixed(1)}¢/pt
                                </div>

                              </div>
                            </div>
                            {/* Big box sub-result for groceries */}
                            {selectedCategory === "groceries" && bigBoxBest && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={bigBoxBest.card} width={72} height={45} isSelected={bigBoxDiffers} />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Target / Walmart / Wholesale</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{bigBoxBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{bigBoxBest.mult}× · {bigBoxBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Whole Foods sub-result for groceries */}
                            {selectedCategory === "groceries" && wholeFoodsBest && wholeFoodsDiffers && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={wholeFoodsBest.card} width={72} height={45} isSelected />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Whole Foods</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{wholeFoodsBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{wholeFoodsBest.mult}× · {wholeFoodsBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Target sub-result */}
                            {selectedCategory === "groceries" && targetBest && targetDiffers && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={targetBest.card} width={72} height={45} isSelected />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>🎯 Target</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{targetBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{targetBest.mult}× · {targetBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Walmart sub-result */}
                            {selectedCategory === "groceries" && walmartBest && walmartDiffers && walmartBest.card.id !== targetBest?.card.id && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={walmartBest.card} width={72} height={45} isSelected />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>🛒 Walmart</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{walmartBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{walmartBest.mult}× · {walmartBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Wholesale clubs sub-result for groceries */}
                            {selectedCategory === "groceries" && wholesaleBest && wholesaleDiffers && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={wholesaleBest.card} width={72} height={45} isSelected />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>🏪 Wholesale Clubs (Costco, Sam's, BJ's)</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{wholesaleBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{wholesaleBest.mult}× · {wholesaleBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                            {/* Portal sub-result for travel */}
                            {selectedCategory === "travel" && portalBest && (
                              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", background: T.bg, display: "flex", alignItems: "center", gap: 12 }}>
                                <CardBadge card={portalBest.card} width={72} height={45} isSelected={portalDiffers} />
                                <div style={{ flex: 1 }}>
                                  <div className="mono" style={{ fontSize: "0.58rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Via Portal (Chase / Amex / Cap One)</div>
                                  <div className="serif" style={{ fontSize: "0.82rem", color: T.text }}>{portalBest.card.name}</div>
                                  <div className="mono" style={{ fontSize: "0.6rem", color: T.textDim }}>{portalBest.mult}× · {portalBest.pct.toFixed(1)}%</div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
