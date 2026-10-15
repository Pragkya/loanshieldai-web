// Income stress test: 10% to 70% income drop.
// Not in the main menu yet — open it at /stress-test, or add it to `links` in Layout.jsx.
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { assessLoan, calcEmi, isFinanceComplete, num, rupee } from "../utils/finance";
import Verdict from "../components/Verdict";

const DROPS = [10, 20, 30, 40, 50, 60, 70];

export default function StressTest() {
  const { t, finance, openFinance } = useApp();
  const [newLoan, setNewLoan] = useState({ amount: "", rate: "", months: "" });

  if (!isFinanceComplete(finance)) {
    return (
      <div className="stack">
        <h1>{t("stressTitle")}</h1>
        <button className="card cta" onClick={openFinance}><span className="cta-icon">✎</span><strong>{t("finLocked")}</strong></button>
      </div>
    );
  }

  const extraEmi = calcEmi(newLoan.amount, newLoan.rate, newLoan.months).emi;
  const income = num(finance.income);
  const rows = [0, ...DROPS].map((d) => ({ d, ...assessLoan(finance, extraEmi, income * (1 - d / 100)) }));
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.leftover)), 1);
  const set = (k) => (e) => setNewLoan((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="stack">
      <h1>{t("stressTitle")}</h1>
      <p className="muted">{t("stressIntro")}</p>

      <details className="card">
        <summary><strong>+ {t("loanAmount")}</strong></summary>
        <div className="form-row">
          <label className="field"><span>{t("loanAmount")}</span><input type="number" min="0" value={newLoan.amount} onChange={set("amount")} /></label>
          <label className="field"><span>{t("interestRate")}</span><input type="number" min="0" step="0.01" value={newLoan.rate} onChange={set("rate")} /></label>
          <label className="field"><span>{t("tenure")}</span><input type="number" min="1" value={newLoan.months} onChange={set("months")} /></label>
        </div>
        {extraEmi > 0 && <p className="muted small">{t("monthlyEmi")}: {rupee(extraEmi)}</p>}
      </details>

      <section className="card">
        <ul className="stress">
          {rows.map((r) => (
            <li key={r.d}>
              <span className="drop-pct">{r.d === 0 ? "Now" : `−${r.d}%`}</span>
              <span className="stress-bar">
                <span className={"fill " + r.verdict + (r.leftover < 0 ? " negative" : "")} style={{ width: `${(Math.abs(r.leftover) / maxAbs) * 100}%` }} />
              </span>
              <span className="stress-num">{rupee(r.leftover)}</span>
              <Verdict verdict={r.verdict} />
            </li>
          ))}
        </ul>
        <p className="muted small">{t("leftover")} · {t("newIncome")} = {t("income")} − {t("incomeDrop")}</p>
      </section>
    </div>
  );
}
