import {
  pgTable, text, timestamp, uuid, numeric,
  boolean, jsonb, integer, pgEnum
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const filingStatusEnum = pgEnum("filing_status", [
  "pending", "in_progress", "reconciled", "filed"
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "matched",        // Green
  "minor_diff",     // Yellow
  "mismatch",       // Red
  "missing_in_2b",  // Red – invoice exists but not in GSTR-2B
  "missing_invoice" // Red – in GSTR-2B but no invoice uploaded
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "b2b", "b2ba", "cdnr", "cdnra", "impg", "impgsez"
]);

// ─── CA Users ─────────────────────────────────────────────────────────────────
export const caUsers = pgTable("ca_users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  name:         text("name").notNull(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firmName:     text("firm_name"),
  phone:        text("phone"),
  membershipNo: text("membership_no"), // ICAI membership number
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id:           uuid("id").primaryKey().defaultRandom(),
  caId:         uuid("ca_id").notNull().references(() => caUsers.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  gstin:        text("gstin").notNull(),              // 15-char GSTIN
  tradeName:    text("trade_name"),
  email:        text("email"),
  whatsapp:     text("whatsapp"),
  address:      text("address"),
  stateCode:    text("state_code"),                   // 2-digit state code from GSTIN
  isActive:     boolean("is_active").default(true),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

// ─── Filing Periods ───────────────────────────────────────────────────────────
// One record per client per month
export const filingPeriods = pgTable("filing_periods", {
  id:          uuid("id").primaryKey().defaultRandom(),
  clientId:    uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  caId:        uuid("ca_id").notNull().references(() => caUsers.id),
  period:      text("period").notNull(),   // "MMYYYY" e.g. "032025"
  status:      filingStatusEnum("status").default("pending").notNull(),
  gstr1Filed:  boolean("gstr1_filed").default(false),
  gstr3bFiled: boolean("gstr3b_filed").default(false),
  dueDate:     timestamp("due_date"),
  filedAt:     timestamp("filed_at"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

// ─── Purchase Invoices (uploaded by CA) ───────────────────────────────────────
export const invoices = pgTable("invoices", {
  id:              uuid("id").primaryKey().defaultRandom(),
  filingPeriodId:  uuid("filing_period_id").notNull().references(() => filingPeriods.id, { onDelete: "cascade" }),
  clientId:        uuid("client_id").notNull().references(() => clients.id),

  // Extracted by Gemini OCR
  invoiceNumber:   text("invoice_number"),
  invoiceDate:     text("invoice_date"),
  supplierGstin:   text("supplier_gstin"),
  supplierName:    text("supplier_name"),
  taxableAmount:   numeric("taxable_amount", { precision: 15, scale: 2 }),
  igst:            numeric("igst", { precision: 15, scale: 2 }).default("0"),
  cgst:            numeric("cgst", { precision: 15, scale: 2 }).default("0"),
  sgst:            numeric("sgst", { precision: 15, scale: 2 }).default("0"),
  cess:            numeric("cess", { precision: 15, scale: 2 }).default("0"),
  totalAmount:     numeric("total_amount", { precision: 15, scale: 2 }),
  placeOfSupply:   text("place_of_supply"),
  reverseCharge:   boolean("reverse_charge").default(false),
  invoiceType:     invoiceTypeEnum("invoice_type").default("b2b"),

  // File metadata
  fileName:        text("file_name"),
  fileUrl:         text("file_url"),
  fileType:        text("file_type"),   // "pdf" | "image" | "excel"
  rawOcrData:      jsonb("raw_ocr_data"),  // full Gemini response
  ocrConfidence:   numeric("ocr_confidence", { precision: 5, scale: 2 }),
  isManuallyEdited: boolean("is_manually_edited").default(false),

  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

// ─── GSTR-2B Records ──────────────────────────────────────────────────────────
export const gstr2bRecords = pgTable("gstr2b_records", {
  id:               uuid("id").primaryKey().defaultRandom(),
  filingPeriodId:   uuid("filing_period_id").notNull().references(() => filingPeriods.id, { onDelete: "cascade" }),
  clientId:         uuid("client_id").notNull().references(() => clients.id),

  // From GSTR-2B JSON/Excel
  supplierGstin:    text("supplier_gstin").notNull(),
  supplierName:     text("supplier_name"),
  invoiceNumber:    text("invoice_number").notNull(),
  invoiceDate:      text("invoice_date"),
  invoiceType:      invoiceTypeEnum("invoice_type").default("b2b"),
  taxableAmount:    numeric("taxable_amount", { precision: 15, scale: 2 }),
  igst:             numeric("igst", { precision: 15, scale: 2 }).default("0"),
  cgst:             numeric("cgst", { precision: 15, scale: 2 }).default("0"),
  sgst:             numeric("sgst", { precision: 15, scale: 2 }).default("0"),
  cess:             numeric("cess", { precision: 15, scale: 2 }).default("0"),
  placeOfSupply:    text("place_of_supply"),
  reverseCharge:    boolean("reverse_charge").default(false),
  itcAvailable:     boolean("itc_available").default(true),
  itcReason:        text("itc_reason"),  // reason if ITC not available

  // Source file
  sourceFile:       text("source_file"),
  rawData:          jsonb("raw_data"),

  createdAt:        timestamp("created_at").defaultNow().notNull(),
});

// ─── Reconciliation Results ───────────────────────────────────────────────────
export const reconciliationResults = pgTable("reconciliation_results", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  filingPeriodId:      uuid("filing_period_id").notNull().references(() => filingPeriods.id, { onDelete: "cascade" }),
  invoiceId:           uuid("invoice_id").references(() => invoices.id),
  gstr2bRecordId:      uuid("gstr2b_record_id").references(() => gstr2bRecords.id),

  status:              reconciliationStatusEnum("status").notNull(),
  differences:         jsonb("differences"),  // { field, invoiceValue, gstr2bValue }[]
  suggestions:         jsonb("suggestions"),  // string[]
  isResolved:          boolean("is_resolved").default(false),
  resolvedNote:        text("resolved_note"),

  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
});