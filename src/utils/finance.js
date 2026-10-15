// Pure money maths. No React here, so it is easy to test.

export const rupee = (n) => {
  const v = Math.round(Number(n) || 0);
  return (v < 0 ? "−₹" : "₹") + Math.abs(v).toLocaleString("en-IN");
};

export const num = (v) => {
  const n = parseFloat(String(v ?? "").replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** EMI = P·r·(1+r)^n / ((1+r)^n − 1), r = monthly rate */
export function calcEmi(principal, annualRate, months) {
  const P = num(principal);
  const n = Math.round(num(months));
  const r = num(annualRate) / 12 / 100;
  if (!P || !n) return { emi: 0, total: 0, interest: 0 };
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const total = emi * n;
  return { emi, total, interest: total - P };
}

export const SURVIVAL_FIELDS = ["rent", "food", "utilities", "education", "medical", "transport", "otherEssentials"];

export function survivalFloor(fin = {}) {
  return SURVIVAL_FIELDS.reduce((s, k) => s + num(fin[k]), 0);
}

export function monthlyDebt(fin = {}) {
  return num(fin.existingEmi) + num(fin.creditCardPayment) + num(fin.informalPayment);
}

const IRREGULAR = ["selfEmployed", "dailyWage", "gig", "farmer"];

/** Safety buffer that must stay free after all payments (share of income). */
export function bufferShare(fin = {}) {
  let b = 0.1 + 0.03 * Math.min(num(fin.dependants), 5);
  if (IRREGULAR.includes(fin.employmentType)) b += 0.05;
  return Math.min(b, 0.3);
}

/**
 * Compare a new EMI against the person's life.
 * Returns verdict: "safe" | "caution" | "unsafe" plus the numbers behind it.
 */
export function assessLoan(fin, newEmi, incomeOverride) {
  const income = incomeOverride ?? num(fin.income);
  const floor = survivalFloor(fin);
  const debt = monthlyDebt(fin);
  const allDebt = debt + num(newEmi);
  const leftover = income - floor - allDebt;
  const dti = income ? allDebt / income : 1;
  const buffer = income * bufferShare(fin);

  let verdict = "unsafe";
  if (income > 0 && leftover >= buffer && dti <= 0.4) verdict = "safe";
  else if (income > 0 && leftover >= 0 && dti <= 0.55) verdict = "caution";

  return { income, floor, debt, allDebt, leftover, dti, buffer, verdict };
}

export function isFinanceComplete(fin) {
  return Boolean(fin && num(fin.income) > 0 && fin.employmentType && survivalFloor(fin) > 0);
}
