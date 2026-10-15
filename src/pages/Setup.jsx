// First-time setup: name, language, senior mode.
import { useState } from "react";
import { useApp } from "../context/AppContext";
import { LANGUAGES } from "../i18n";
import { Logo } from "../components/Layout";

export default function Setup() {
  const { t, user, lang, setLanguage, saveProfile, openFinance } = useApp();
  const [name, setName] = useState(user?.displayName || "");
  const [senior, setSenior] = useState(false);
  const [busy, setBusy] = useState(false);

  const done = async (e) => {
    e.preventDefault();
    setBusy(true);
    await saveProfile({ name: name.trim() || "Friend", language: lang, seniorMode: senior, setupDone: true });
    openFinance();
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={done}>
        <Logo />
        <h1 className="login-title">{t("setupTitle")}</h1>

        <label className="field">
          <span>{t("yourName")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>

        <fieldset className="chips">
          <legend>{t("chooseLanguage")}</legend>
          {LANGUAGES.map((l) => (
            <button type="button" key={l.code} className={"chip" + (lang === l.code ? " on" : "")} onClick={() => setLanguage(l.code)}>{l.label}</button>
          ))}
        </fieldset>

        <label className="toggle">
          <input type="checkbox" checked={senior} onChange={(e) => { setSenior(e.target.checked); document.documentElement.classList.toggle("senior", e.target.checked); }} />
          <span className="track"><span className="thumb" /></span>
          <span>
            <strong>{t("seniorMode")}</strong>
            <small className="muted">{t("seniorModeHint")}</small>
          </span>
        </label>

        <button className="btn primary wide" disabled={busy}>{t("continue")} →</button>
      </form>
    </div>
  );
}
