// Decides which screen to show: loading → login → setup → the app.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext";
import Layout from "./components/Layout";
import FinanceModal from "./components/FinanceModal";
import Login from "./pages/Login";
import Setup from "./pages/Setup";
import Home from "./pages/Home";
import EmiChecker from "./pages/EmiChecker";
import Copilot from "./pages/Copilot";
import Documents from "./pages/Documents";
import Invest from "./pages/Invest";
import Profile from "./pages/Profile";
import StressTest from "./pages/StressTest";

function Loading() {
  return <div className="loading"><img src="/shield.svg" alt="Loading" width="64" height="64" /></div>;
}

export default function App() {
  const { user, profile, profileLoaded } = useApp();

  if (user === undefined || (user && !profileLoaded)) return <Loading />;
  if (!user) return <Login />;
  if (!profile?.setupDone) return (<><Setup /><FinanceModal /></>);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="emi" element={<EmiChecker />} />
          <Route path="copilot" element={<Copilot />} />
          <Route path="documents" element={<Documents />} />
          <Route path="invest" element={<Invest />} />
          <Route path="profile" element={<Profile />} />
          <Route path="stress-test" element={<StressTest />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
