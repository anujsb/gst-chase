"use client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-sm text-slate-500">
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} Filing
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}