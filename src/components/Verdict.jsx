import { useApp } from "../context/AppContext";

const ICON = { safe: "✓", caution: "!", unsafe: "✕" };

export default function Verdict({ verdict, big }) {
  const { t } = useApp();
  return (
    <div className={`verdict ${verdict}` + (big ? " big" : "")} role="status">
      <span className="v-icon" aria-hidden="true">{ICON[verdict]}</span>
      <div>
        <strong>{t(verdict)}</strong>
        {big && <p>{t(verdict + "Msg")}</p>}
      </div>
    </div>
  );
}
