// Reusable chat: used by Copilot and by the document chat.
// Tapping the type bar opens the money-picture pop-up until it is filled.
import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { isFinanceComplete } from "../utils/finance";
import Markdown from "./Markdown";
import VoiceButton, { speak } from "./VoiceButton";

export default function ChatBox({ messages, onSend, busy, quickPrompts = [], placeholder, compact }) {
  const { t, finance, openFinance, langInfo } = useApp();
  const [text, setText] = useState("");
  const endRef = useRef(null);
  const locked = !isFinanceComplete(finance);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages, busy]);

  const send = (q) => {
    const value = (q ?? text).trim();
    if (!value || busy) return;
    if (locked) { openFinance(); return; }
    onSend(value);
    setText("");
  };

  return (
    <div className={"chat" + (compact ? " compact" : "")}>
      <div className="chat-log" aria-live="polite">
        {messages.length === 0 && quickPrompts.length > 0 && (
          <div className="quick">
            {quickPrompts.map((q) => (
              <button key={q} className="quick-chip" onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={"bubble " + (m.role === "user" ? "me" : "bot")}>
            {m.role === "user" ? <p>{m.text}</p> : <Markdown text={m.text} />}
            {m.role === "model" && (
              <button className="listen" onClick={() => speak(m.text, langInfo.speech)} aria-label={t("listen")}>🔊 {t("listen")}</button>
            )}
          </div>
        ))}
        {busy && <div className="bubble bot typing"><span /><span /><span /><em>{t("thinking")}</em></div>}
        <div ref={endRef} />
      </div>

      {locked && (
        <button className="lock-note" onClick={openFinance}>🔒 {t("finLocked")}</button>
      )}

      <form className="chat-bar" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <VoiceButton onText={(s) => (locked ? openFinance() : setText((p) => (p ? p + " " : "") + s))} disabled={busy} />
        <input
          value={text}
          readOnly={locked}
          onFocus={() => locked && openFinance()}
          onClick={() => locked && openFinance()}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder || t("typeHere")}
          aria-label={placeholder || t("typeHere")}
        />
        <button className="btn primary send" disabled={busy || (!locked && !text.trim())} aria-label={t("send")}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 11.5 21 3l-8.5 18-2-7.5Z" fill="currentColor" /></svg>
        </button>
      </form>
    </div>
  );
}
