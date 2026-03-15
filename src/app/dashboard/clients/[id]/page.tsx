import { db, clients, filingPeriods } from "@/db";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Building2, Mail, Phone,
  MapPin, FileText, Calendar, ChevronRight,
} from "lucide-react";
import { getStateFromGSTIN, getPANFromGSTIN } from "@/lib/gstin";

const TEMP_CA_ID = "00000000-0000-0000-0000-000000000001";

const STATUS_CONFIG = {
  pending:     { label: "Pending",     class: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", class: "bg-blue-50 text-blue-700"   },
  reconciled:  { label: "Reconciled",  class: "bg-amber-50 text-amber-700" },
  filed:       { label: "Filed",       class: "bg-green-50 text-green-700" },
} as const;

function formatPeriod(period: string): string {
  // "032025" → "March 2025"
  const month = parseInt(period.slice(0, 2), 10) - 1;
  const year  = parseInt(period.slice(2), 10);
  return new Date(year, month).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.caId, TEMP_CA_ID)))
    .limit(1);

  if (!client) notFound();

  const periods = await db
    .select()
    .from(filingPeriods)
    .where(eq(filingPeriods.clientId, id))
    .orderBy(filingPeriods.period);

  const state = getStateFromGSTIN(client.gstin);
  const pan   = getPANFromGSTIN(client.gstin);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700 -ml-2">
        <Link href="/dashboard/clients">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Clients
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
              {!client.isActive && <Badge variant="secondary">Inactive</Badge>}
            </div>
            {client.tradeName && (
              <p className="text-sm text-slate-400 mt-0.5">{client.tradeName}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild className="border-slate-200 text-slate-600">
            <Link href={`/dashboard/clients/${id}/edit`}>Edit</Link>
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link href={`/dashboard/invoices?client=${id}`}>
              <FileText className="w-4 h-4 mr-1.5" /> Upload Invoices
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GST Info */}
        <Card className="border-slate-200 shadow-none md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">GST Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-400">GSTIN</p>
                <p className="text-sm font-mono font-medium text-slate-900 mt-0.5">{client.gstin}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">PAN</p>
                <p className="text-sm font-mono font-medium text-slate-900 mt-0.5">{pan}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">State</p>
                <p className="text-sm text-slate-900 mt-0.5">{state}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">State Code</p>
                <p className="text-sm font-mono text-slate-900 mt-0.5">{client.stateCode}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-600 truncate">{client.email}</p>
              </div>
            )}
            {client.whatsapp && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-600">{client.whatsapp}</p>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600">{client.address}</p>
              </div>
            )}
            {!client.email && !client.whatsapp && !client.address && (
              <p className="text-xs text-slate-400">No contact details</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filing Periods */}
      <Card className="border-slate-200 shadow-none">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-700">Filing History</CardTitle>
          <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 text-xs h-7">
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> New Period
          </Button>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-400">No filing periods yet</p>
              <p className="text-xs text-slate-300 mt-1">Filing periods will appear here once you start uploading invoices</p>
            </div>
          ) : (
            <div className="space-y-2">
              {periods.map((period) => {
                const status = STATUS_CONFIG[period.status];
                return (
                  <Link
                    key={period.id}
                    href={`/dashboard/reconcile?period=${period.id}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{formatPeriod(period.period)}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        GSTR-1: {period.gstr1Filed ? "Filed" : "Pending"} ·
                        GSTR-3B: {period.gstr3bFiled ? "Filed" : "Pending"}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.class}`}>
                      {status.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      {client.notes && (
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{client.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}