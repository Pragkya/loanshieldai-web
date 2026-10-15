// Read text out of a PDF in the browser, then look for known hidden-charge clauses.
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export async function extractPdfText(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n\n";
  }
  return { text: text.replace(/[ \t]+/g, " ").trim(), pages: pdf.numPages };
}

// Each rule: a name, why it matters, and words to look for.
const RULES = [
  { name: "Processing / login fee", why: "Cut from your loan before you get the money.", re: /processing\s*(fee|charge)|login\s*fee|administrative\s*(fee|charge)/i },
  { name: "Prepayment / foreclosure charge", why: "Penalty for closing the loan early.", re: /pre-?payment|fore-?clos|part[\s-]?payment|pre-?closure/i },
  { name: "Late payment / penal charge", why: "Extra money if an EMI is late.", re: /late\s*payment|penal\s*(interest|charge)|overdue\s*(interest|charge)|default\s*interest/i },
  { name: "Bounce / dishonour charge", why: "Charged when auto-debit or cheque fails.", re: /bounce|dishono(u)?r|nach\s*return|ecs\s*return|mandate\s*rejection/i },
  { name: "Bundled insurance", why: "Insurance premium added to your loan — often optional.", re: /insurance\s*(premium|cover|charge)|credit\s*(life|shield)|loan\s*protect/i },
  { name: "Documentation / stamp charges", why: "Paperwork costs added to the loan.", re: /documentation\s*(fee|charge)|stamp\s*duty|legal\s*(fee|charge)|valuation\s*(fee|charge)/i },
  { name: "Floating / changeable rate", why: "Your interest rate (and EMI) can go up later.", re: /floating\s*rate|variable\s*rate|rate\s*(may|shall)\s*(be\s*)?(revised|reset|changed)|repricing|reset/i },
  { name: "Annual / maintenance fee", why: "Yearly charge on top of interest.", re: /annual\s*(fee|charge)|maintenance\s*(fee|charge)|renewal\s*(fee|charge)/i },
  { name: "Collateral / guarantor", why: "Your asset or a relative can be pursued if you can't pay.", re: /guarantor|collateral|hypothecat|pledge|mortgage/i },
  { name: "Recovery / collection terms", why: "How the lender can recover money — read carefully.", re: /recovery\s*agent|collection\s*agent|recovery\s*(charge|cost)|repossess/i },
  { name: "Cross-default / set-off", why: "Lender may take money from your other accounts.", re: /cross[\s-]?default|right\s*of\s*set[\s-]?off|lien\s*on/i },
  { name: "Unilateral change of terms", why: "Lender can change rules without asking you.", re: /sole\s*discretion|without\s*(prior\s*)?notice|at\s*its\s*discretion/i },
];

/** Returns rules that matched, each with the real sentence from the document as proof. */
export function findHiddenClauses(text) {
  const sentences = text.split(/(?<=[.;:])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 15);
  const found = [];
  for (const rule of RULES) {
    const hits = sentences.filter((s) => rule.re.test(s)).slice(0, 2);
    if (hits.length) found.push({ ...rule, quotes: hits.map((h) => (h.length > 260 ? h.slice(0, 260) + "…" : h)) });
  }
  return found;
}
