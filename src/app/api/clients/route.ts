import { NextRequest, NextResponse } from "next/server";
import { db, clients } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { validateGSTIN, formatGSTIN, getStateFromGSTIN } from "@/lib/gstin";

const createClientSchema = z.object({
  name:         z.string().min(2, "Name must be at least 2 characters"),
  gstin:        z.string().length(15, "GSTIN must be 15 characters"),
  tradeName:    z.string().optional(),
  email:        z.string().email("Invalid email").optional().or(z.literal("")),
  whatsapp:     z.string().optional(),
  address:      z.string().optional(),
  notes:        z.string().optional(),
});

// Hardcoded caId for now — will come from session when auth is added
const TEMP_CA_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const allClients = await db
      .select()
      .from(clients)
      .where(eq(clients.caId, TEMP_CA_ID))
      .orderBy(clients.createdAt);

    return NextResponse.json(allClients);
  } catch {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, gstin, tradeName, email, whatsapp, address, notes } = parsed.data;
    const formattedGSTIN = formatGSTIN(gstin);

    const gstinCheck = validateGSTIN(formattedGSTIN);
    if (!gstinCheck.valid) {
      return NextResponse.json({ error: gstinCheck.error }, { status: 400 });
    }

    // Check duplicate GSTIN under same CA
    const existing = await db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.gstin, formattedGSTIN))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: "A client with this GSTIN already exists" }, { status: 409 });
    }

    const stateCode = formattedGSTIN.slice(0, 2);

    const [client] = await db.insert(clients).values({
      caId:      TEMP_CA_ID,
      name,
      gstin:     formattedGSTIN,
      tradeName: tradeName ?? null,
      email:     email || null,
      whatsapp:  whatsapp ?? null,
      address:   address ?? null,
      stateCode,
      notes:     notes ?? null,
    }).returning();

    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}