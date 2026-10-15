// Microphone button using the browser's built-in speech recognition (works in Chrome / Edge / Android).
import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export default function VoiceButton({ onText, disabled }) {
  const { langInfo, t } = useApp();
  const [on, setOn] = useState(false);
  const recRef = useRef(null);

  if (!SR) return null;

  const toggle = () => {
    if (on) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = langInfo.speech;
    rec.interimResults = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => setOn(false);
    rec.onerror = () => setOn(false);
    recRef.current = rec;
    setOn(true);
    rec.start();
  };

  return (
    <button
      type="button"
      className={"icon-btn mic" + (on ? " live" : "")}
      onClick={toggle}
      disabled={disabled}
      aria-label={on ? t("listening") : "Voice input"}
      title={on ? t("listening") : "Voice input"}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Read text aloud — handy in senior mode. */
export function speak(text, speechLang) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ""));
  u.lang = speechLang;
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}
