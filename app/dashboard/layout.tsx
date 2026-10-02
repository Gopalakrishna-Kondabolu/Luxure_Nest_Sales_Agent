"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Calendar,
  UserCheck,
  Bot,
  LogOut,
  Sparkles
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { name: "Qualified Leads", href: "/dashboard/leads", icon: Users },
    { name: "Appointments & Bookings", href: "/dashboard/bookings", icon: Calendar },
    { name: "Human Escalations", href: "/dashboard/handoffs", icon: UserCheck },
    { name: "WhatsApp Simulator", href: "/dashboard/simulator", icon: Bot },
  ];

  const handleSignOut = () => {
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#0b0f17] text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900/60 border-r border-gray-800/80 flex flex-col justify-between p-4 glass-panel">
        <div className="space-y-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide">LUXURE NEST</h1>
              <p className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">AI Sales Agent Concierge</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-sky-600/30 to-indigo-600/30 text-sky-400 border border-sky-500/30 shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-sky-400" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin info & logout */}
        <div className="pt-4 border-t border-gray-800/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="truncate">
              <p className="text-xs font-semibold text-gray-200">Admin Operator</p>
              <p className="text-[10px] text-gray-500 truncate">admin@luxurenest.com</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0b0f17] p-8">
        {children}
      </main>
    </div>
  );
}
