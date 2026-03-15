"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { validateGSTIN, getStateFromGSTIN, getPANFromGSTIN } from "@/lib/gstin";

interface FormState {
  name: string;
  gstin: string;
  tradeName: string;
  email: string;
  whatsapp: string;
  address: string;
  notes: string;
}

interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", gstin: "", tradeName: "",
    email: "", whatsapp: "", address: "", notes: "",
  });

  const gstinValidation = form.gstin.length > 0 ? validateGSTIN(form.gstin) : null;
  const gstinValid = gstinValidation?.valid ?? false;
  const detectedState = gstinValid ? getStateFromGSTIN(form.gstin) : null;
  const detectedPAN   = gstinValid ? getPANFromGSTIN(form.gstin) : null;

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gstinValid) {
      toast.error(gstinValidation?.error ?? "Invalid GSTIN");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: FormState | ApiError = await res.json();
      if (!res.ok) {
        throw new Error((data as ApiError).error ?? "Failed to create client");
      }
      toast.success(`${form.name} added successfully`);
      router.push("/dashboard/clients");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700 -ml-2">
          <Link href="/dashboard/clients">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Clients
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-xl font-semibold text-slate-900">Add New Client</h1>
        <p className="text-sm text-slate-500 mt-0.5">Fill in the client details to start managing their GST filings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Details */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Business Details</CardTitle>
            <CardDescription className="text-xs text-slate-400">Required information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-slate-700">Legal Business Name <span className="text-red-500">*</span></Label>
              <Input
                id="name" value={form.name} onChange={set("name")}
                placeholder="Acme Traders Pvt Ltd"
                className="border-slate-200"
                required
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1.5">
              <Label htmlFor="gstin" className="text-sm text-slate-700">GSTIN <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  id="gstin"
                  value={form.gstin}
                  onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                  placeholder="27AAPFU0939F1ZV"
                  maxLength={15}
                  className={`border-slate-200 font-mono pr-9 ${
                    form.gstin.length > 0
                      ? gstinValid
                        ? "border-green-400 focus-visible:ring-green-300"
                        : "border-red-400 focus-visible:ring-red-300"
                      : ""
                  }`}
                  required
                />
                {form.gstin.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {gstinValid
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />
                    }
                  </div>
                )}
              </div>

              {/* GSTIN feedback */}
              {form.gstin.length > 0 && !gstinValid && (
                <p className="text-xs text-red-500">{gstinValidation?.error}</p>
              )}
              {gstinValid && (
                <div className="flex items-center gap-3 text-xs text-slate-500 bg-green-50 border border-green-100 rounded-md px-3 py-2">
                  <span>📍 <strong>{detectedState}</strong></span>
                  <span>·</span>
                  <span>PAN: <strong className="font-mono">{detectedPAN}</strong></span>
                </div>
              )}
            </div>

            {/* Trade Name */}
            <div className="space-y-1.5">
              <Label htmlFor="tradeName" className="text-sm text-slate-700">Trade Name <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input
                id="tradeName" value={form.tradeName} onChange={set("tradeName")}
                placeholder="If different from legal name"
                className="border-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-700">Contact Details</CardTitle>
            <CardDescription className="text-xs text-slate-400">Optional but recommended for notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-slate-700">Email</Label>
                <Input
                  id="email" type="email" value={form.email} onChange={set("email")}
                  placeholder="owner@business.com"
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsapp" className="text-sm text-slate-700">WhatsApp Number</Label>
                <Input
                  id="whatsapp" type="tel" value={form.whatsapp} onChange={set("whatsapp")}
                  placeholder="+91 98765 43210"
                  className="border-slate-200"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm text-slate-700">Business Address</Label>
              <Textarea
                id="address" value={form.address} onChange={set("address")}
                placeholder="Registered business address"
                className="border-slate-200 resize-none"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="border-slate-200 shadow-none">
          <CardContent className="pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm text-slate-700">Internal Notes <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea
                id="notes" value={form.notes} onChange={set("notes")}
                placeholder="Any notes about this client visible only to you"
                className="border-slate-200 resize-none"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || !gstinValid}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Client
          </Button>
          <Button type="button" variant="ghost" asChild className="text-slate-500">
            <Link href="/dashboard/clients">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}