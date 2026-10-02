"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Users,
  Calendar,
  AlertTriangle,
  Bot,
  Activity,
  CheckCircle2,
  XCircle,
  ArrowUpRight
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, healthRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/health"),
        ]);
        const statsData = await statsRes.json();
        const healthData = await healthRes.json();
        setStats(statsData);
        setHealth(healthData);
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time monitoring for Luxure Nest WhatsApp AI Sales Concierge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/simulator"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 transition-all"
          >
            <Bot className="h-4 w-4" />
            Launch WhatsApp Simulator
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Conversations</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loading ? "..." : stats?.total_conversations || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            <span className="text-emerald-400 font-semibold">{stats?.active_conversations || 0} Active</span> • {stats?.human_takeover_conversations || 0} Human Takeover
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Qualified Leads</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loading ? "..." : stats?.qualified_leads || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            Out of <span className="font-semibold text-white">{stats?.total_leads || 0}</span> total registered CRM leads
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Bookings & Appointments</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loading ? "..." : stats?.total_bookings || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            <span className="text-amber-400 font-semibold">{stats?.pending_bookings || 0} Pending</span> confirmation status
          </div>
        </div>

        <div className="rounded-2xl glass-panel p-5 space-y-3">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Human Escalations</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            {loading ? "..." : stats?.pending_handoffs || 0}
          </div>
          <div className="text-[11px] text-gray-400">
            Pending operator takeover requests
          </div>
        </div>
      </div>

      {/* System Health & Architecture Status */}
      <div className="rounded-2xl glass-panel p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">System Architecture & Integration Status</h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            OPERATIONAL
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">Groq AI Engine</span>
              {health?.groq_configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">DEV MOCK ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {health?.groq_configured ? "Groq LLM Connected" : "Local Dev Adapter running (No API key required for testing)"}
            </p>
          </div>

          <div className="rounded-xl glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">Meta WhatsApp Cloud API</span>
              {health?.whatsapp_configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">DEV MOCK ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {health?.whatsapp_configured ? "WhatsApp Webhook Active" : "Local Transport Simulator active for testing"}
            </p>
          </div>

          <div className="rounded-xl glass-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-300">Database & Persistence</span>
              {health?.supabase_configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded font-mono">DEV STORE ACTIVE</span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {health?.supabase_configured ? "Supabase PostgreSQL Connected" : "In-Memory Repository initialized with seed data"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/dashboard/conversations"
          className="group rounded-2xl glass-panel p-6 space-y-3 hover:border-sky-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  Live Conversations & Human Takeover
                </h3>
                <p className="text-xs text-gray-400">Inspect real-time chat history & reply as human agent</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-sky-400 transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/bookings"
          className="group rounded-2xl glass-panel p-6 space-y-3 hover:border-indigo-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                  Appointment Calendar & Bookings
                </h3>
                <p className="text-xs text-gray-400">Review pending client appointments & scheduled calls</p>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
