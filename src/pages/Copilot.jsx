// AI chat. Conversation is saved to Firestore so it is still there next time.
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useApp } from "../context/AppContext";
import { askAI } from "../utils/ai";
import ChatBox from "../components/ChatBox";

export default function Copilot() {
  const { t, user, finance, langInfo, senior } = useApp();
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const chatRef = user ? doc(db, "users", user.uid, "chats", "copilot") : null;

  useEffect(() => {
    if (!chatRef) return;
    getDoc(chatRef).then((s) => s.exists() && setMessages(s.data().messages || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const persist = (list) => chatRef && setDoc(chatRef, { messages: list.slice(-60), updatedAt: serverTimestamp() });

  const send = async (q) => {
    const next = [...messages, { role: "user", text: q }];
    setMessages(next);
    setBusy(true);
    let reply;
    try {
      reply = await askAI({ question: q, history: messages, fin: finance, langName: langInfo.ai, senior });
    } catch {
      reply = t("errorAI");
    }
    const done = [...next, { role: "model", text: reply }];
    setMessages(done);
    persist(done);
    setBusy(false);
  };

  const clear = () => { setMessages([]); persist([]); };

  return (
    <div className="stack chat-page">
      <div className="row-between">
        <h1>{t("copilotTitle")}</h1>
        {messages.length > 0 && <button className="btn ghost small" onClick={clear}>{t("clearChat")}</button>}
      </div>
      <ChatBox messages={messages} onSend={send} busy={busy} quickPrompts={[t("q1"), t("q2"), t("q3"), t("q4")]} />
    </div>
  );
}
