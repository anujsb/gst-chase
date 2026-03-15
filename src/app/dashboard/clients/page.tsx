import { db, clients } from "@/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, ChevronRight, Building2 } from "lucide-react";
import { getStateFromGSTIN } from "@/lib/gstin";

const TEMP_CA_ID = "00000000-0000-0000-0000-000000000001";

export default async function ClientsPage() {
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.caId, TEMP_CA_ID))
    .orderBy(clients.createdAt);

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{allClients.length} client{allClients.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/clients/new">
            <Plus className="w-4 h-4 mr-1.5" /> Add Client
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      {allClients.length === 0 && (
        <Card className="border-dashed border-slate-300 shadow-none">
          <CardContent className="py-16 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">No clients yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first client to start managing GST filings</p>
            </div>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 mt-1">
              <Link href="/dashboard/clients/new">
                <Plus className="w-4 h-4 mr-1.5" /> Add First Client
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Clients list */}
      {allClients.length > 0 && (
        <div className="space-y-2">
          {allClients.map((client) => (
            <Link key={client.id} href={`/dashboard/clients/${client.id}`}>
              <Card className="border-slate-200 shadow-none hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{client.name}</p>
                      {client.tradeName && (
                        <span className="text-xs text-slate-400 truncate hidden sm:block">({client.tradeName})</span>
                      )}
                      {!client.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs font-mono text-slate-500">{client.gstin}</span>
                      <span className="text-xs text-slate-400 hidden sm:block">·</span>
                      <span className="text-xs text-slate-400 hidden sm:block">{getStateFromGSTIN(client.gstin)}</span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="hidden md:block text-right shrink-0">
                    {client.email && <p className="text-xs text-slate-500">{client.email}</p>}
                    {client.whatsapp && <p className="text-xs text-slate-400 mt-0.5">{client.whatsapp}</p>}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}