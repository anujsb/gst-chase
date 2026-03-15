import { db, clients, filingPeriods } from "@/db";
import { count } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText, GitCompare, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [clientCount] = await db.select({ count: count() }).from(clients);
  const [periodCount] = await db.select({ count: count() }).from(filingPeriods);

  const stats = [
    { label: "Total Clients",          value: clientCount.count,  icon: Users,       color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Pending Filings",        value: periodCount.count,  icon: AlertCircle, color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Invoices Processed",     value: 0,                  icon: FileText,    color: "text-green-600",  bg: "bg-green-50"  },
    { label: "Reconciled This Month",  value: 0,                  icon: GitCompare,  color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} filing cycle
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/clients/new">+ Add Client</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-slate-200 shadow-none">
            <CardContent className="p-4">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-700 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: "/dashboard/clients/new", label: "Add New Client",  desc: "Onboard a client with GSTIN",    icon: Users      },
            { href: "/dashboard/invoices",    label: "Upload Invoices", desc: "Drop PDFs or photos for OCR",    icon: FileText   },
            { href: "/dashboard/gstr2b",      label: "Upload GSTR-2B",  desc: "JSON or Excel from the portal",  icon: GitCompare },
          ].map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="border-slate-200 shadow-none hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center shrink-0 transition-colors">
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {clientCount.count === 0 && (
        <Card className="border-dashed border-slate-300 shadow-none bg-white">
          <CardContent className="py-12 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">No clients yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your first client to start managing their GST filings</p>
            </div>
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 mt-1">
              <Link href="/dashboard/clients/new">Add First Client</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}