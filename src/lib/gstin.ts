// GSTIN format: 2-digit state code + 10-char PAN + 1-digit entity + Z + checksum
// Example: 27AAPFU0939F1ZV

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",   "02": "Himachal Pradesh",  "03": "Punjab",
  "04": "Chandigarh",        "05": "Uttarakhand",       "06": "Haryana",
  "07": "Delhi",             "08": "Rajasthan",         "09": "Uttar Pradesh",
  "10": "Bihar",             "11": "Sikkim",            "12": "Arunachal Pradesh",
  "13": "Nagaland",          "14": "Manipur",           "15": "Mizoram",
  "16": "Tripura",           "17": "Meghalaya",         "18": "Assam",
  "19": "West Bengal",       "20": "Jharkhand",         "21": "Odisha",
  "22": "Chhattisgarh",      "23": "Madhya Pradesh",    "24": "Gujarat",
  "25": "Daman & Diu",       "26": "Dadra & Nagar Haveli", "27": "Maharashtra",
  "28": "Andhra Pradesh",    "29": "Karnataka",         "30": "Goa",
  "31": "Lakshadweep",       "32": "Kerala",            "33": "Tamil Nadu",
  "34": "Puducherry",        "35": "Andaman & Nicobar", "36": "Telangana",
  "37": "Andhra Pradesh (New)", "38": "Ladakh",         "97": "Other Territory",
  "99": "Centre Jurisdiction",
};

export function validateGSTIN(gstin: string): { valid: boolean; error?: string } {
  const upper = gstin.toUpperCase().trim();
  if (!upper) return { valid: false, error: "GSTIN is required" };
  if (upper.length !== 15) return { valid: false, error: "GSTIN must be exactly 15 characters" };
  if (!GSTIN_REGEX.test(upper)) return { valid: false, error: "Invalid GSTIN format" };
  if (!STATE_CODES[upper.slice(0, 2)]) return { valid: false, error: "Invalid state code" };
  return { valid: true };
}

export function getStateFromGSTIN(gstin: string): string {
  return STATE_CODES[gstin.slice(0, 2)] ?? "Unknown";
}

export function getPANFromGSTIN(gstin: string): string {
  return gstin.slice(2, 12);
}

export function formatGSTIN(gstin: string): string {
  return gstin.toUpperCase().trim();
}