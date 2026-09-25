// International student figures confirmed against the official program page:
// https://www.en.kku.ac.th/web/en/beng-dme/ (Mekong Sub-region & Other Regions rates,
// enrollment fee, health insurance, accommodation, and living cost ranges).
// Thai student rate is carried over from the Studio 4 Final Report (pages 38-39) —
// the official page only publishes international rates.

export const MEKONG_COUNTRIES = ["Cambodia", "China (Yunnan/Guangxi)", "Laos", "Myanmar", "Vietnam"];

export const STUDENT_TYPES = [
  { id: "thai", label: "Thai Students", semesterFee: 45000, hasLivingCost: false },
  { id: "mekong", label: "Mekong Region", semesterFee: 50000, hasLivingCost: true },
  { id: "international", label: "International", semesterFee: 65000, hasLivingCost: true },
];

// Midpoints of official ranges: Accommodation ฿3,000–6,000/mo, Living Costs
// ฿6,000–10,000/mo, Health Insurance ฿5,000–10,000/yr.
export const FEE_BREAKDOWN = {
  thai: {
    "Per Semester": [
      { item: "Tuition Fee", type: "Mandatory", amount: 45000 },
      { item: "Summer Training", type: "One-time", amount: 2500, excludedFromTotal: true },
    ],
    "Full 4 Years": [
      { item: "Tuition Fee (8 semesters)", type: "Mandatory", amount: 360000 },
      { item: "Summer Training", type: "One-time", amount: 2500 },
    ],
  },
  mekong: {
    "Per Semester": [
      { item: "Tuition Fee", type: "Mandatory", amount: 50000 },
      { item: "Summer Training", type: "One-time", amount: 2500, excludedFromTotal: true },
      { item: "Health Insurance (~฿5,000–10,000/yr)", type: "Optional", amount: 3750 },
      { item: "Accommodation (~฿3,000–6,000/mo x4)", type: "Optional", amount: 18000 },
      { item: "Living Costs (~฿6,000–10,000/mo x4)", type: "Optional", amount: 32000 },
    ],
    "Full 4 Years": [
      { item: "Tuition Fee (8 semesters)", type: "Mandatory", amount: 400000 },
      { item: "Summer Training", type: "One-time", amount: 2500 },
      { item: "Health Insurance (4 years)", type: "Optional", amount: 30000 },
      { item: "Accommodation (~40 months)", type: "Optional", amount: 180000 },
      { item: "Living Costs (~40 months)", type: "Optional", amount: 320000 },
    ],
  },
  international: {
    "Per Semester": [
      { item: "Tuition Fee", type: "Mandatory", amount: 65000 },
      { item: "Summer Training", type: "One-time", amount: 2500, excludedFromTotal: true },
      { item: "Enrollment Fee (new students)", type: "One-time", amount: 10000, excludedFromTotal: true },
      { item: "Health Insurance (~฿5,000–10,000/yr)", type: "Optional", amount: 3750 },
      { item: "Accommodation (~฿3,000–6,000/mo x4)", type: "Optional", amount: 18000 },
      { item: "Living Costs (~฿6,000–10,000/mo x4)", type: "Optional", amount: 32000 },
    ],
    "Full 4 Years": [
      { item: "Tuition Fee (8 semesters)", type: "Mandatory", amount: 520000 },
      { item: "Summer Training", type: "One-time", amount: 2500 },
      { item: "Enrollment Fee", type: "One-time", amount: 10000 },
      { item: "Health Insurance (4 years)", type: "Optional", amount: 30000 },
      { item: "Accommodation (~40 months)", type: "Optional", amount: 180000 },
      { item: "Living Costs (~40 months)", type: "Optional", amount: 320000 },
    ],
  },
};

/**
 * Sum a set of fee rows.
 *
 * One-off charges (enrollment fee, summer training) are displayed in the
 * per-semester view but left out of its total — they are not owed every term.
 */
export function grandTotal(rows, period) {
  return (rows || [])
    .filter((r) => !(period === "Per Semester" && r.excludedFromTotal))
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
}

export function formatBaht(amount) {
  return "฿" + amount.toLocaleString("en-US");
}
