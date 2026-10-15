import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { assessLoan, isFinanceComplete, rupee } from "../utils/finance";
import Verdict from "../components/Verdict";

export default function Home() {
  const { t, profile, finance, openFinance } = useApp();
  const ready = isFinanceComplete(finance);
  const now = ready ? assessLoan(finance, 0) : null;

  const tiles = [
    { to: "/emi", title: t("navEmi"), desc: t("homeEmiDesc"), cls: "tile-orange", icon: "₹" },
    { to: "/copilot", title: t("navCopilot"), desc: t("homeCopilotDesc"), cls: "tile-teal", icon: "💬" },
    { to: "/documents", title: t("navDocs"), desc: t("homeDocsDesc"), cls: "tile-deep", icon: "📄" },
    { to: "/invest", title: t("navInvest"), desc: t("homeInvestDesc"), cls: "tile-cream", icon: "🌱" },
  ];

  return (
    <div className="stack">
      <header className="hello">
        <p className="muted">{t("homeHello")},</p>
        <h1>{profile?.name || "Friend"} 👋</h1>
        <p>{t("homeIntro")}</p>
      </header>

      {ready ? (
        <section className="card health">
          <div>
            <p className="muted small">{t("leftover")}</p>
            <p className="big-num">{rupee(now.leftover)}</p>
            <p className="muted small">{t("survivalFloorLabel")}: {rupee(now.floor)} · EMI: {rupee(now.debt)}</p>
          </div>
          <Verdict verdict={now.verdict} />
        </section>
      ) : (
        <button className="card cta" onClick={openFinance}>
          <span className="cta-icon">✎</span>
          <span><strong>{t("finTitle")}</strong><br /><small>{t("finIntro")}</small></span>
        </button>
      )}

      <div className="tiles">
        {tiles.map((x) => (
          <Link key={x.to} to={x.to} className={"tile " + x.cls}>
            <span className="tile-icon" aria-hidden="true">{x.icon}</span>
            <strong>{x.title}</strong>
            <small>{x.desc}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
