// Upload a loan PDF → read text → flag clauses with proof → AI review → chat about it.
import { useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { extractPdfText, findHiddenClauses } from "../utils/pdf";
import { askAI } from "../utils/ai";
import { isFinanceComplete } from "../utils/finance";
import { addHistory, useHistory } from "../utils/history";
import Markdown from "../components/Markdown";
import ChatBox from "../components/ChatBox";

const MAX_CHARS = 25000;

export default function Documents() {
  const { t, user, finance, openFinance, langInfo, senior } = useApp();
  const inputRef = useRef(null);
  const [docInfo, setDocInfo] = useState(null); // { name, pages, text, clauses }
  const [stage, setStage] = useState("idle"); // idle | reading | done | error
  const [review, setReview] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [chat, setChat] = useState([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [err, setErr] = useState("");
  const history = useHistory(user?.uid, "docChecks");

  const docContext = (d) =>
    `The person uploaded a loan document named "${d.name}". Answer using ONLY this document text plus their money picture. If something is not in the document, say so clearly. Quote the document's exact words when pointing to a clause.\n--- DOCUMENT TEXT START ---\n${d.text.slice(0, MAX_CHARS)}\n--- DOCUMENT TEXT END ---`;

  const runReview = async (d = docInfo) => {
    if (!isFinanceComplete(finance)) { openFinance(); return; }
    setReviewBusy(true);
    try {
      const flagged = d.clauses.map((c) => c.name).join(", ") || "none";
      const q = `Review this loan document for me. Our scanner flagged: ${flagged}.
Use these sections:
## Key terms (only numbers actually written in the document: amount, interest/APR, tenure, EMI, fees)
## Hidden or extra charges (for each, quote the exact words from the document; skip anything you cannot quote)
## Can I afford it? (compare with my income, current EMIs and Survival Floor; give Safe / Caution / Unsafe)
## What to do or ask the lender
Never invent numbers that are not in the document.`;
      setReview(await askAI({ question: q, fin: finance, langName: langInfo.ai, senior, extra: docContext(d) }));
    } catch {
      setReview(t("errorAI"));
    }
    setReviewBusy(false);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(""); setReview(""); setChat([]); setStage("reading");
    try {
      const { text, pages } = await extractPdfText(file);
      if (text.length < 80) { setStage("error"); setErr(t("scanned")); return; }
      const d = { name: file.name, pages, text, clauses: findHiddenClauses(text) };
      setDocInfo(d);
      setStage("done");
      addHistory(user?.uid, "docChecks", { name: d.name, pages, flagged: d.clauses.map((c) => c.name) });
      if (isFinanceComplete(finance)) runReview(d);
    } catch (ex) {
      setStage("error");
      setErr(ex?.message || "Could not read this PDF.");
    }
  };

  const ask = async (q) => {
    const next = [...chat, { role: "user", text: q }];
    setChat(next);
    setChatBusy(true);
    let reply;
    try {
      reply = await askAI({ question: q, history: chat, fin: finance, langName: langInfo.ai, senior, extra: docContext(docInfo) });
    } catch { reply = t("errorAI"); }
    setChat([...next, { role: "model", text: reply }]);
    setChatBusy(false);
  };

  return (
    <div className="stack">
      <h1>{t("docsTitle")}</h1>

      <button className="drop" onClick={() => inputRef.current?.click()} disabled={stage === "reading"}>
        <span className="drop-icon" aria-hidden="true">📄</span>
        <strong>{stage === "reading" ? t("reading") : t("uploadPdf")}</strong>
        <small className="muted">{t("uploadHint")}</small>
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" hidden onChange={onFile} />
      {err && <p className="error">{err}</p>}

      {stage === "done" && docInfo && (
        <>
          <p className="muted small">📎 {docInfo.name} · {docInfo.pages} {t("pages")}</p>

          <section className="card">
            <h3>⚠️ {t("hiddenFound")} ({docInfo.clauses.length})</h3>
            {docInfo.clauses.length === 0 ? <p className="muted">{t("hiddenNone")}</p> : (
              <div className="clauses">
                {docInfo.clauses.map((c) => (
                  <details key={c.name} className="clause">
                    <summary><strong>{c.name}</strong><small>{c.why}</small></summary>
                    {c.quotes.map((q, i) => <blockquote key={i}>“{q}”</blockquote>)}
                  </details>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <h3>✨ {t("aiReview")}</h3>
            {reviewBusy && <p className="muted">{t("thinking")}</p>}
            {review ? <div className="ai-box"><Markdown text={review} /></div> : !reviewBusy && (
              <button className="btn secondary" onClick={() => runReview()}>{t("aiReview")}</button>
            )}
          </section>

          <section className="card">
            <h3>💬 {t("askDoc")}</h3>
            <ChatBox compact messages={chat} onSend={ask} busy={chatBusy} placeholder={t("askDoc")} />
          </section>
        </>
      )}

      <section className="card">
        <h3>{t("history")}</h3>
        {history.length === 0 ? <p className="muted">{t("noHistory")}</p> : (
          <ul className="history">
            {history.map((h) => (
              <li key={h.id}><span>📄 {h.name}</span><span className="pill caution">{h.flagged?.length || 0}</span></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
