import crypto from "node:crypto";

/**
 * @param {string} input
 * @returns {string}
 */
export function generateId(input) {
  return crypto.createHash("shake256", { outputLength: 8 }).update(input).digest("hex");
}

const replacements = {
  週日: "Sun",
  週一: "Mon",
  週二: "Tue",
  週三: "Wed",
  週四: "Thu",
  週五: "Fri",
  週六: "Sat",
  一月: "Jan",
  二月: "Feb",
  三月: "Mar",
  四月: "Apr",
  五月: "May",
  六月: "Jun",
  七月: "Jul",
  八月: "Aug",
  九月: "Sep",
  十月: "Oct",
  十一月: "Nov",
  十二月: "Dec",
};

/**
 * @param {string} dt
 * @returns {Date|null}
 */
export function normalizeDatetime(dt) {
  let normalized = dt;
  for (const [key, value] of Object.entries(replacements)) {
    normalized = normalized.replace(key, value);
  }
  const date = new Date(normalized);
  return isNaN(date.valueOf()) ? null : date;
}
