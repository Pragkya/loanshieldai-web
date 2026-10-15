// Shared app state: who is signed in, their profile, language and senior mode.
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { translate, LANGUAGES } from "../i18n";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [finModalOpen, setFinModalOpen] = useState(false);

  // Language & senior mode are kept locally too, so the login page also uses them
  const [localLang, setLocalLang] = useState(() => {
    try { return localStorage.getItem("ls-lang") || "en"; } catch { return "en"; }
  });

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) { setProfile(null); setProfileLoaded(user === null); return; }
    setProfileLoaded(false);
    return onSnapshot(doc(db, "users", user.uid), (snap) => {
      setProfile(snap.exists() ? snap.data() : null);
      setProfileLoaded(true);
    });
  }, [user]);

  const lang = profile?.language || localLang;
  const senior = Boolean(profile?.seniorMode);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.classList.toggle("senior", senior);
  }, [lang, senior]);

  const saveProfile = async (data) => {
    if (!user) return;
    await setDoc(doc(db, "users", user.uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  };

  const setLanguage = (code) => {
    setLocalLang(code);
    try { localStorage.setItem("ls-lang", code); } catch {}
    if (user) saveProfile({ language: code });
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      profileLoaded,
      finance: profile?.finance || null,
      lang,
      langInfo: LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0],
      senior,
      t: translate(lang),
      signIn: () => signInWithPopup(auth, googleProvider),
      signOut: () => signOut(auth),
      saveProfile,
      setLanguage,
      finModalOpen,
      openFinance: () => setFinModalOpen(true),
      closeFinance: () => setFinModalOpen(false),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, profile, profileLoaded, lang, senior, finModalOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => useContext(AppContext);
