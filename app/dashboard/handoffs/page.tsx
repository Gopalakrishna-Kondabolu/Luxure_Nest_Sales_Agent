"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, UserCheck, MessageSquare, ArrowRight, RefreshCw } from "lucide-react";

export default function HandoffsPage() {
  const [handoffs, setHandoffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHandoffs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/handoffs");
      const data = await res.json();
      setHandoffs(data.handoffs || []);
    } catch (err) {
      console.error("Failed to load handoffs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoffs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Human Escalations & Handoff Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            Conversations flagged for human operator attention by the AI assistant
          </p>
        </div>
        <button
          onClick={fetchHandoffs}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl glass-panel p-6">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">Loading handoffs...</div>
        ) : handoffs.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500">No pending human handoffs found</div>
        ) : (
          <div className="space-y-4">
            {handoffs.map((h) => (
              <div key={h.id} className="p-4 rounded-xl glass-card border border-red-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      PENDING HANDOFF
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(h.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white">Reason for Escalation: {h.reason}</p>
                  <p className="text-[11px] text-gray-400">Customer ID: {h.customer_id} | Conversation ID: {h.conversation_id}</p>
                </div>

                <Link
                  href="/dashboard/conversations"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-sky-500 hover:to-indigo-500 transition-all self-start md:self-auto"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Open Chat Timeline
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
