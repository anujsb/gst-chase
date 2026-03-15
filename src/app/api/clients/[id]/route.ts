import { NextRequest, NextResponse } from "next/server";
import { db, clients, filingPeriods } from "@/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { validateGSTIN, formatGSTIN } from "@/lib/gstin";

const TEMP_CA_ID = "00000000-0000-0000-0000-000000000001";

const updateClientSchema = z.object({
  name:      z.string().min(2).optional(),
  tradeName: z.string().optional(),
  email:     z.string().email().optional().or(z.literal("")),
  whatsapp:  z.string().optional(),
  address:   z.string().optional(),
  notes:     z.string().optional(),
  isActive:  z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.caId, TEMP_CA_ID)))
      .limit(1);

    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const periods = await db
      .select()
      .from(filingPeriods)
      .where(eq(filingPeriods.clientId, id))
      .orderBy(filingPeriods.period);

    return NextResponse.json({ ...client, filingPeriods: periods });
  } catch {
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateClientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(clients)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.caId, TEMP_CA_ID)))
      .returning();

    if (!updated) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.caId, TEMP_CA_ID)))
      .returning({ id: clients.id });

    if (!deleted) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}