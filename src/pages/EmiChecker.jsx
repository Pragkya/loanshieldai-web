import { useState } from "react";
import { useApp } from "../context/AppContext";
import { assessLoan, calcEmi, isFinanceComplete, num, rupee } from "../utils/finance";
import { askAI } from "../utils/ai";
import { addHistory, useHistory } from "../utils/history";
import Verdict from "../components/Verdict";
import Markdown from "../components/Markdown";

export default function EmiChecker() {
  const { t, user, finance, openFinance, langInfo, senior } = useApp();
  const [form, setForm] = useState({ amount: "", rate: "", months: "" });
  const [res, setRes] = useState(null);
  const [explain, setExplain] = useState("");
  const [busy, setBusy] = useState(false);
  const history = useHistory(user?.uid, "emiChecks");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = num(form.amount) && num(form.months);

  const check = (e) => {
    e.preventDefault();
    if (!isFinanceComplete(finance)) { openFinance(); return; }
    const loan = calcEmi(form.amount, form.rate, form.months);
    const a = assessLoan(finance, loan.emi);
    setRes({ ...loan, ...a });
    setExplain("");
    addHistory(user?.uid, "emiChecks", {
      amount: num(form.amount), rate: num(form.rate), months: num(form.months),
      emi: Math.round(loan.emi), verdict: a.verdict,
    });
  };

  const askExplain = async () => {
    setBusy(true);
    try {
      const q = `Explain this loan check to me simply and tell me what I can do.
Loan: ${rupee(form.amount)} at ${num(form.rate)}% for ${num(form.months)} months.
EMI ${rupee(res.emi)}, total repayment ${rupee(res.total)}, total interest ${rupee(res.interest)}.
After all EMIs and the Survival Floor, ${rupee(res.leftover)} is left each month (safety buffer needed: ${rupee(res.buffer)}).
Debt-to-income with this loan: ${Math.round(res.dti * 100)}%. Verdict: ${res.verdict.toUpperCase()}.
If not safe, suggest a safer amount or tenure with numbers.`;
      setExplain(await askAI({ question: q, fin: finance, langName: langInfo.ai, senior }));
    } catch {
      setExplain(t("errorAI"));
    }
    setBusy(false);
  };

  // Share of income bar
  const bar = res && res.income > 0 ? [
    { k: "floor", v: res.floor, label: t("survivalFloorLabel") },
    { k: "debt", v: res.debt, label: t("existingEmi") },
    { k: "new", v: res.emi, label: t("monthlyEmi") },
    { k: "left", v: Math.max(res.leftover, 0), label: t("leftover") },
  ] : [];
  const barTotal = Math.max(res?.income || 0, bar.reduce((s, x) => s + x.v, 0));

  return (
    <div className="stack">
      <h1>{t("emiTitle")}</h1>

      <form className="card form-row" onSubmit={check}>
        <label className="field">
          <span>{t("loanAmount")}</span>
          <div className="money"><i>₹</i><input type="number" inputMode="numeric" min="0" value={form.amount} onChange={set("amount")} required /></div>
        </label>
        <label className="field">
          <span>{t("interestRate")}</span>
          <input type="number" inputMode="decimal" min="0" step="0.01" value={form.rate} onChange={set("rate")} required />
        </label>
        <label className="field">
          <span>{t("tenure")}</span>
          <input type="number" inputMode="numeric" min="1" value={form.months} onChange={set("months")} required />
        </label>
        <button className="btn primary" disabled={!valid}>{t("check")}</button>
      </form>

      {res && (
        <section className="card result">
          <Verdict verdict={res.verdict} big />

          <div className="stats">
            <div><small>{t("monthlyEmi")}</small><strong>{rupee(res.emi)}</strong></div>
            <div><small>{t("totalRepay")}</small><strong>{rupee(res.total)}</strong></div>
            <div><small>{t("totalInterest")}</small><strong>{rupee(res.interest)}</strong></div>
            <div><small>{t("leftover")}</small><strong className={res.leftover < 0 ? "neg" : ""}>{rupee(res.leftover)}</strong></div>
          </div>

          <div className="split-bar" aria-label="Where your income goes">
            {bar.map((x) => x.v > 0 && (
              <span key={x.k} className={"seg " + x.k} style={{ flexGrow: x.v / barTotal }} title={`${x.label}: ${rupee(x.v)}`} />
            ))}
          </div>
          <ul className="legend">
            {bar.map((x) => <li key={x.k}><i className={"dot " + x.k} />{x.label}: {rupee(x.v)}</li>)}
          </ul>
          {res.leftover < 0 && <p className="error">{t("unsafeMsg")} ({rupee(-res.leftover)} short)</p>}

          {!explain && (
            <button className="btn secondary" onClick={askExplain} disabled={busy}>
              {busy ? t("thinking") : "✨ " + t("explainAI")}
            </button>
          )}
          {explain && <div className="ai-box"><Markdown text={explain} /></div>}
        </section>
      )}

      <section className="card">
        <h3>{t("history")}</h3>
        {history.length === 0 ? <p className="muted">{t("noHistory")}</p> : (
          <ul className="history">
            {history.map((h) => (
              <li key={h.id}>
                <span>{rupee(h.amount)} · {h.rate}% · {h.months}m → <b>{rupee(h.emi)}</b>/m</span>
                <span className={"pill " + h.verdict}>{t(h.verdict)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
