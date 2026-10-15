// Page frame: side rail on desktop, bottom tab bar on mobile.
import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import FinanceModal from "./FinanceModal";

const I = {
  home: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z",
  emi: "M5 3h14v18H5Zm3 4h8M8 11h2m4 0h2m-8 4h2m4 0h2",
  copilot: "M4 5h16v11H9l-5 4Z",
  docs: "M6 3h8l4 4v14H6Zm8 0v4h4M9 12h6m-6 4h6",
  invest: "M4 19h16M6 15l4-4 3 3 5-6m0 0h-4m4 0v4",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
};

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ small }) {
  return (
    <span className={"logo" + (small ? " small" : "")}>
      <img src="/shield.svg" alt="" width={small ? 28 : 40} height={small ? 28 : 40} />
      <span>Loan<b>Shield</b></span>
    </span>
  );
}

export default function Layout() {
  const { t } = useApp();
  const links = [
    ["/", "navHome", I.home],
    ["/emi", "navEmi", I.emi],
    ["/copilot", "navCopilot", I.copilot],
    ["/documents", "navDocs", I.docs],
    ["/invest", "navInvest", I.invest],
    ["/profile", "navProfile", I.profile],
  ];
  return (
    <div className="shell">
      <nav className="rail" aria-label="Main">
        <div className="rail-logo"><Logo small /></div>
        {links.map(([to, key, d]) => (
          <NavLink key={to} to={to} end={to === "/"} className="nav-item">
            <Icon d={d} />
            <span>{t(key)}</span>
          </NavLink>
        ))}
      </nav>
      <main className="page">
        <Outlet />
      </main>
      <FinanceModal />
    </div>
  );
}
