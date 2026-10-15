import { useApp } from "../context/AppContext";
import { LANGUAGES } from "../i18n";
import { isFinanceComplete, monthlyDebt, rupee, survivalFloor } from "../utils/finance";

export default function Profile() {
  const { t, user, profile, finance, lang, setLanguage, senior, saveProfile, openFinance, signOut } = useApp();
  const ready = isFinanceComplete(finance);

  return (
    <div className="stack">
      <h1>{t("navProfile")}</h1>

      <section className="card profile-head">
        {user?.photoURL ? <img src={user.photoURL} alt="" width="56" height="56" referrerPolicy="no-referrer" /> : <span className="avatar">{(profile?.name || "?")[0]}</span>}
        <div>
          <strong>{profile?.name}</strong>
          <p className="muted small">{user?.email}</p>
        </div>
      </section>

      <section className="card">
        <h3>{t("chooseLanguage")}</h3>
        <div className="lang-row">
          {LANGUAGES.map((l) => (
            <button key={l.code} className={"chip" + (lang === l.code ? " on" : "")} onClick={() => setLanguage(l.code)}>{l.label}</button>
          ))}
        </div>
        <label className="toggle">
          <input type="checkbox" checked={senior} onChange={(e) => saveProfile({ seniorMode: e.target.checked })} />
          <span className="track"><span className="thumb" /></span>
          <span><strong>{t("seniorMode")}</strong><small className="muted">{t("seniorModeHint")}</small></span>
        </label>
      </section>

      <section className="card">
        <div className="row-between">
          <h3>{t("finTitle")}</h3>
          <button className="btn secondary small" onClick={openFinance}>{t("finEdit")}</button>
        </div>
        {ready ? (
          <div className="stats">
            <div><small>{t("income")}</small><strong>{rupee(finance.income)}</strong></div>
            <div><small>{t("survivalFloorLabel")}</small><strong>{rupee(survivalFloor(finance))}</strong></div>
            <div><small>{t("existingEmi")}</small><strong>{rupee(monthlyDebt(finance))}</strong></div>
            <div><small>{t("dependants")}</small><strong>{finance.dependants || 0}</strong></div>
          </div>
        ) : <p className="muted">{t("finLocked")}</p>}
      </section>

      <button className="btn ghost" onClick={signOut}>{t("signOut")}</button>
    </div>
  );
}
