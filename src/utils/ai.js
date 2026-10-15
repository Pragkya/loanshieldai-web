// Talking to Groq (model: openai/gpt-oss-120b). Every request carries the person's money picture.
import { survivalFloor, monthlyDebt, rupee, num } from "./finance";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

export function financeSummary(fin) {
  if (!fin) return "Financial profile: not provided.";
  return [
    `Monthly take-home income: ${rupee(fin.income)}`,
    `Work type: ${fin.employmentType || "unknown"}`,
    `Dependants: ${num(fin.dependants)}`,
    `Existing EMIs per month: ${rupee(fin.existingEmi)}`,
    `Credit card outstanding: ${rupee(fin.creditCardDue)} (paying ${rupee(fin.creditCardPayment)}/month)`,
    `Informal debt (moneylender/friends/chit): ${rupee(fin.informalDebt)} (paying ${rupee(fin.informalPayment)}/month)`,
    `Survival Floor (essential monthly spending): ${rupee(survivalFloor(fin))}`,
    `Total monthly debt payments: ${rupee(monthlyDebt(fin))}`,
  ].join("\n");
}

function systemText({ fin, langName, senior, extra }) {
  return `You are LoanShield AI, a careful, kind money-safety guide for borrowers in India.
Rules:
- Reply ONLY in ${langName}. Use simple everyday words; explain any jargon (EMI, APR, foreclosure) in one short line.
- Use Indian rupees (₹) and Indian number style (lakh, crore).
- Protect the family's Survival Floor first. Never encourage borrowing to pay for wants, or borrowing from one lender to pay another without a clear plan.
- Be honest about risk. Mention RBI rules or official sources only when you are sure; say "check with your bank" when unsure.
- You are not a licensed adviser. For investments, stay conservative and say so.
- Keep replies short: at most 8 short lines or bullets${senior ? ", with very short sentences (the reader is a senior citizen)" : ""}.
- Do not use tables. Use plain text, short bullets and **bold** only.

The person's money picture:
${financeSummary(fin)}
${extra ? "\n" + extra : ""}`;
}

/**
 * Ask the AI.
 * history = [{ role: "user" | "model", text }]   ("model" is our app's word for the AI's reply)
 */
export async function askAI({ question, history = [], fin, langName = "English", senior = false, extra = "" }) {
  if (!GROQ_KEY) throw new Error("VITE_GROQ_API_KEY is missing in the .env file");

  const messages = [
    { role: "system", content: systemText({ fin, langName, senior, extra }) },
    // Groq uses "assistant" for the AI's earlier replies
    ...history.slice(-12).map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.text })),
    { role: "user", content: question },
  ];

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.4,
      max_completion_tokens: 2048,
      reasoning_effort: "low", // faster answers; use "medium" for deeper document reviews
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Groq error:", res.status, err);
    throw new Error(err?.error?.message || `Groq request failed (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
