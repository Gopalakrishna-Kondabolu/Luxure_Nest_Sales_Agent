"use client";

import { useEffect, useState } from "react";
import { Users, Phone, DollarSign, Tag, Calendar, RefreshCw } from "lucide-react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Failed to load leads:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "QUALIFIED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "QUALIFYING":
        return "bg-sky-500/20 text-sky-400 border-sky-500/30";
      case "CONVERTED":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "HUMAN_REVIEW":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Qualified Leads & CRM</h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time qualified lead records captured by Luxure Nest WhatsApp AI agent
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl glass-panel p-6">
        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12 text-xs text-gray-500">No leads recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Service Interest</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Lead Status</th>
                  <th className="py-3 px-4">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {(lead.name || "Lead")[0]}
                      </div>
                      {lead.name || "Anonymous Lead"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 font-mono text-gray-300">
                        <Phone className="h-3 w-3 text-sky-400" />
                        {lead.phone || "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-gray-300">
                        <Tag className="h-3 w-3 text-indigo-400" />
                        {lead.service || "VIP Private Consultation"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {lead.budget || "Unspecified"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
