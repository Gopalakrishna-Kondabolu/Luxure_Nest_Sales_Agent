"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  User,
  Bot,
  UserCheck,
  Send,
  Sparkles,
  Phone,
  RefreshCw,
  Wrench
} from "lucide-react";

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await fetch("/api/dashboard/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.conversations && data.conversations.length > 0 && !selectedConv) {
        setSelectedConv(data.conversations[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMsgs(true);
      const res = await fetch(`/api/dashboard/conversations/${convId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv]);

  const handleToggleMode = async (newStatus: "active" | "human_takeover") => {
    if (!selectedConv) return;
    try {
      const res = await fetch(`/api/dashboard/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_mode", status: newStatus }),
      });
      if (res.ok) {
        setSelectedConv({ ...selectedConv, status: newStatus });
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to toggle conversation mode:", err);
    }
  };

  const handleSendOperatorMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/dashboard/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_human_message",
          text: replyText,
          customer_id: selectedConv.customer_id,
          whatsapp_id: selectedConv.customers?.whatsapp_id || selectedConv.whatsapp_id,
        }),
      });

      if (res.ok) {
        setReplyText("");
        setSelectedConv({ ...selectedConv, status: "human_takeover" });
        await fetchMessages(selectedConv.id);
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send operator message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Live Conversations</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitor AI interactions, inspect message context, and take over as human concierge operator
          </p>
        </div>
        <button
          onClick={fetchConversations}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs text-gray-300 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        {/* Conversations List Panel */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-4 flex flex-col space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">Conversations</h2>
          {loadingConvs ? (
            <div className="text-center py-10 text-xs text-gray-500">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500">No active conversations found</div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;
                const isHumanTakeover = c.status === "human_takeover";
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedConv(c)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? "bg-sky-500/10 border-sky-500/40 shadow-sm"
                        : "glass-card border-transparent hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                          {(c.customers?.name || "Client")[0]}
                        </div>
                        <span className="text-xs font-bold text-white">{c.customers?.name || "Client"}</span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          isHumanTakeover
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {isHumanTakeover ? "HUMAN TAKEOVER" : "AI ACTIVE"}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 truncate mt-1">
                      {c.last_message?.content || "No message content"}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.customers?.whatsapp_id || c.whatsapp_id}
                      </span>
                      <span>{c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Chat Detail Panel */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-6 flex flex-col justify-between space-y-4">
          {selectedConv ? (
            <>
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                    {(selectedConv.customers?.name || "Client")[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedConv.customers?.name || "Valued Client"}</h3>
                    <p className="text-xs text-gray-400">WhatsApp ID: {selectedConv.customers?.whatsapp_id || selectedConv.whatsapp_id}</p>
                  </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex items-center gap-2">
                  {selectedConv.status === "human_takeover" ? (
                    <button
                      onClick={() => handleToggleMode("active")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold hover:bg-emerald-500/30 transition-all"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Resume AI Assistant
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleMode("human_takeover")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold hover:bg-red-500/30 transition-all"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Take Over Conversation
                    </button>
                  )}
                </div>
              </div>

              {/* Message Timeline */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[420px]">
                {loadingMsgs ? (
                  <div className="text-center py-10 text-xs text-gray-500">Loading timeline...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-500">No messages in this chat</div>
                ) : (
                  messages.map((m) => {
                    const isCustomer = m.sender_type === "customer";
                    const isHumanAgent = m.sender_type === "human_agent";
                    const toolCalls = m.metadata?.tool_calls || [];

                    return (
                      <div key={m.id} className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">
                            {isCustomer ? "Client" : isHumanAgent ? "Human Operator" : "AI Sales Agent"}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl p-4 text-xs space-y-2 ${
                            isCustomer
                              ? "bg-gray-800/90 text-gray-100 rounded-tl-none border border-gray-700/50"
                              : isHumanAgent
                              ? "bg-indigo-600/30 text-indigo-100 rounded-tr-none border border-indigo-500/40"
                              : "bg-sky-600/30 text-sky-100 rounded-tr-none border border-sky-500/40"
                          }`}
                        >
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>

                          {/* Tool Execution Badges */}
                          {toolCalls.length > 0 && (
                            <div className="pt-2 border-t border-white/10 space-y-1">
                              {toolCalls.map((tc: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/20 px-2 py-1 rounded border border-amber-500/30 font-mono">
                                  <Wrench className="h-3 w-3" />
                                  <span>Executed: {tc.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Operator Reply Dispatch Box */}
              <form onSubmit={handleSendOperatorMessage} className="pt-3 border-t border-gray-800 flex gap-3">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    selectedConv.status === "human_takeover"
                      ? "Type manual response to send via WhatsApp..."
                      : "Sending a reply will automatically trigger Human Takeover mode..."
                  }
                  className="flex-1 rounded-xl bg-gray-900/80 border border-gray-700 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 transition-all disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-20 text-xs text-gray-500">Select a conversation to view chat timeline</div>
          )}
        </div>
      </div>
    </div>
  );
}
