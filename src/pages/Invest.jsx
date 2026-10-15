// Conservative investment guidance by time horizon.
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { askAI } from "../utils/ai";
import { isFinanceComplete, monthlyDebt, num, rupee, survivalFloor } from "../utils/finance";
import Markdown from "../components/Markdown";

const HORIZONS = [
  {
    key: "shortTerm", risk: 1, icon: "🪙",
    options: [
      ["Savings account / sweep FD", "Instant access for emergencies."],
      ["Recurring Deposit (RD)", "Save a fixed amount every month."],
      ["Liquid / overnight mutual fund", "Low risk, withdraw in 1–2 days."],
    ],
  },
  {
    key: "mediumTerm", risk: 2, icon: "🌿",
    options: [
      ["Fixed Deposit ladder", "Split into FDs maturing every few months."],
      ["Post Office schemes (NSC, MIS, TD)", "Government-backed, fixed returns."],
      ["Short-duration debt / hybrid fund", "A little more return, a little more risk."],
    ],
  },
  {
    key: "longTerm", risk: 3, icon: "🌳",
    options: [
      ["PPF", "15-year, tax-free, government-backed."],
      ["NPS", "Retirement savings with tax benefit."],
      ["Index fund SIP", "Small monthly amount in a broad market index. Value goes up and down."],
    ],
  },
];

export default function Invest() {
  const { t, finance, openFinance, langInfo, senior } = useApp();
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = isFinanceComplete(finance);

  const irregular = ["selfEmployed", "dailyWage", "gig", "farmer"].includes(finance?.employmentType);
  const monthlyNeed = ready ? survivalFloor(finance) + monthlyDebt(finance) : 0;
  const efund = monthlyNeed * (irregular ? 9 : 6);
  const hasCostlyDebt = num(finance?.creditCardDue) > 0 || num(finance?.informalDebt) > 0;

  const steps = [
    `${t("emergencyFund")}: ${rupee(efund)} (${irregular ? 9 : 6} × ${rupee(monthlyNeed)})`,
    hasCostlyDebt && t("tipDebt"),
    num(finance?.dependants) > 0 && t("tipInsurance"),
    t("tipScam"),
  ].filter(Boolean);

  const getPlan = async () => {
    if (!ready) { openFinance(); return; }
    setBusy(true);
    try {
      const q = `Give me a simple, conservative savings and investment plan for short term (<1 year), medium term (1–5 years) and long term (5+ years).
Use my money picture. First check if I should build an emergency fund or clear costly debt before investing. Suggest how much per month for each horizon in ₹ — only from money left after my Survival Floor and EMIs.
Name only common Indian options (RD, FD, PPF, NPS, index funds, etc.), avoid specific product brands, and don't quote exact current interest rates. End with a one-line disclaimer.`;
      setPlan(await askAI({ question: q, fin: finance, langName: langInfo.ai, senior }));
    } catch { setPlan(t("errorAI")); }
    setBusy(false);
  };

  return (
    <div className="stack">
      <h1>{t("investTitle")}</h1>
      <p className="muted">{t("investIntro")}</p>

      {ready && (
        <section className="card first-steps">
          <h3>{t("firstSteps")}</h3>
          <ol>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
      )}

      <div className="horizons">
        {HORIZONS.map((h) => (
          <section key={h.key} className={"card horizon r" + h.risk}>
            <header>
              <span className="h-icon" aria-hidden="true">{h.icon}</span>
              <h3>{t(h.key)}</h3>
              <span className="risk" aria-label={`Risk ${h.risk} of 3`}>{"●".repeat(h.risk)}{"○".repeat(3 - h.risk)}</span>
            </header>
            <ul>
              {h.options.map(([n, d]) => <li key={n}><strong>{n}</strong><small>{d}</small></li>)}
            </ul>
          </section>
        ))}
      </div>

      <section className="card">
        {!plan && <button className="btn primary" onClick={getPlan} disabled={busy}>{busy ? t("thinking") : "✨ " + t("personalPlan")}</button>}
        {plan && <div className="ai-box"><Markdown text={plan} /></div>}
      </section>

      <p className="disclaimer">ⓘ {t("disclaimer")}</p>
    </div>
  );
}
