// Pop-up form for the money picture. Chat stays locked until this is filled.
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { SURVIVAL_FIELDS, survivalFloor, isFinanceComplete, rupee } from "../utils/finance";

const EMPLOYMENT = ["salaried", "selfEmployed", "dailyWage", "gig", "farmer", "retired"];
const DEBT_FIELDS = ["existingEmi", "creditCardDue", "creditCardPayment", "informalDebt", "informalPayment"];

function MoneyInput({ id, label, value, onChange, required }) {
  return (
    <label className="field">
      <span>{label}{required && <b className="req"> *</b>}</span>
      <div className="money">
        <i>₹</i>
        <input id={id} inputMode="numeric" type="number" min="0" value={value ?? ""} onChange={(e) => onChange(id, e.target.value)} />
      </div>
    </label>
  );
}

export default function FinanceModal() {
  const { t, finance, finModalOpen, closeFinance, saveProfile } = useApp();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (finModalOpen) setForm(finance || { dependants: 0 }); }, [finModalOpen, finance]);

  useEffect(() => {
    if (!finModalOpen) return;
    const onKey = (e) => e.key === "Escape" && closeFinance();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finModalOpen, closeFinance]);

  if (!finModalOpen) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const ok = isFinanceComplete(form);

  const submit = async (e) => {
    e.preventDefault();
    if (!ok) return;
    setSaving(true);
    await saveProfile({ finance: form });
    setSaving(false);
    closeFinance();
  };

  return (
    <div className="modal-backdrop" onClick={closeFinance}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="fin-title">
        <header className="modal-head">
          <h2 id="fin-title">{t("finTitle")}</h2>
          <button type="button" className="icon-btn" onClick={closeFinance} aria-label={t("cancel")}>✕</button>
        </header>
        <p className="muted">{t("finIntro")}</p>

        <div className="grid2">
          <MoneyInput id="income" label={t("income")} value={form.income} onChange={set} required />
          <label className="field">
            <span>{t("dependants")}</span>
            <input type="number" min="0" max="15" inputMode="numeric" value={form.dependants ?? ""} onChange={(e) => set("dependants", e.target.value)} />
          </label>
        </div>

        <fieldset className="chips">
          <legend>{t("employmentType")}<b className="req"> *</b></legend>
          {EMPLOYMENT.map((k) => (
            <label key={k} className={"chip" + (form.employmentType === k ? " on" : "")}>
              <input type="radio" name="emp" value={k} checked={form.employmentType === k} onChange={() => set("employmentType", k)} />
              {t("emp_" + k)}
            </label>
          ))}
        </fieldset>

        <div className="grid2">
          {DEBT_FIELDS.map((k) => <MoneyInput key={k} id={k} label={t(k)} value={form[k]} onChange={set} />)}
        </div>

        <section className="floor-box">
          <div className="floor-head">
            <div>
              <h3>{t("survivalTitle")}<b className="req"> *</b></h3>
              <p className="muted small">{t("survivalHint")}</p>
            </div>
            <strong className="floor-total">{rupee(survivalFloor(form))}</strong>
          </div>
          <div className="grid2">
            {SURVIVAL_FIELDS.map((k) => <MoneyInput key={k} id={k} label={t(k)} value={form[k]} onChange={set} />)}
          </div>
        </section>

        <footer className="modal-foot">
          <button type="button" className="btn ghost" onClick={closeFinance}>{t("cancel")}</button>
          <button className="btn primary" disabled={!ok || saving}>{saving ? "…" : t("save")}</button>
        </footer>
      </form>
    </div>
  );
}
