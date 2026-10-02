"use client";

import { useState } from "react";
import { Bot, Send, User, Wrench, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";

export default function SimulatorPage() {
  const [phone, setPhone] = useState("+15550199");
  const [name, setName] = useState("Alexander Wright");
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "ai",
      text: "Welcome to Luxure Nest Private Concierge! How may we assist your property goals or appointment request today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [lastTrace, setLastTrace] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userText = inputMessage;
    setInputMessage("");

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: userText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch("/api/simulator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name,
          message: userText,
        }),
      });

      const data = await res.json();
      setLastTrace(data);

      if (data.agent_output?.responseText) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.agent_output.responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            toolCalls: data.agent_output.toolCallsExecuted || [],
          },
        ]);
      }
    } catch (err) {
      console.error("Simulator error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setInputMessage(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Interactive WhatsApp Simulator</h1>
        <p className="text-sm text-gray-400 mt-1">
          Test the entire WhatsApp AI Sales Agent pipeline locally without needing live WhatsApp or Meta API credentials
        </p>
      </div>

      {/* Quick Test Prompts */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-400 self-center mr-2">Quick Test Scenarios:</span>
        <button
          onClick={() => handleQuickPrompt("What services do you offer and how much does it cost?")}
          className="px-3 py-1 rounded-lg glass-card text-xs text-sky-300 hover:border-sky-500/50 transition-all"
        >
          Service & Pricing Query
        </button>
        <button
          onClick={() => handleQuickPrompt("Do you have availability for a VIP consultation tomorrow?")}
          className="px-3 py-1 rounded-lg glass-card text-xs text-indigo-300 hover:border-indigo-500/50 transition-all"
        >
          Check Availability
        </button>
        <button
          onClick={() => handleQuickPrompt("I want to book a VIP Private Consultation for tomorrow at 2 PM.")}
          className="px-3 py-1 rounded-lg glass-card text-xs text-amber-300 hover:border-amber-500/50 transition-all"
        >
          Create Booking (PENDING)
        </button>
        <button
          onClick={() => handleQuickPrompt("I need to speak to a real human person.")}
          className="px-3 py-1 rounded-lg glass-card text-xs text-red-300 hover:border-red-500/50 transition-all"
        >
          Human Handoff Request
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulator Phone Screen Container */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-5 flex flex-col justify-between h-[600px] border border-gray-700/80 shadow-2xl">
          {/* WhatsApp Header Mock */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Luxure Nest WhatsApp Concierge</h3>
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Official Business Account • Online
                </p>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">{phone}</span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-3 py-4 px-1 max-h-[460px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs space-y-2 ${
                    m.sender === "user"
                      ? "bg-sky-600/90 text-white rounded-tr-none shadow-md"
                      : "bg-gray-800/90 text-gray-100 rounded-tl-none border border-gray-700/60"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  <div className="text-[9px] opacity-70 text-right">{m.timestamp}</div>

                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1">
                      {m.toolCalls.map((tc: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] text-amber-300 bg-amber-500/20 px-2 py-1 rounded font-mono border border-amber-500/30">
                          <Wrench className="h-3 w-3" />
                          <span>Tool Executed: {tc.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 p-2.5 rounded-xl w-fit">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Luxure Nest AI Agent processing grounded response...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-gray-800 flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type customer message to test..."
              className="flex-1 rounded-xl bg-gray-900/90 border border-gray-700 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 transition-all disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </div>

        {/* Real-time Agent Execution Trace Panel */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-sky-400" />
              Agent Execution & Tool Audit Trace
            </h2>
            <p className="text-xs text-gray-400">Under-the-hood inspection of context loading & tool execution</p>
          </div>

          {lastTrace ? (
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[460px] text-xs font-mono bg-gray-950/80 p-4 rounded-xl border border-gray-800">
              <div>
                <span className="text-sky-400 font-bold">CUSTOMER ID:</span> {lastTrace.customer?.id}
              </div>
              <div>
                <span className="text-sky-400 font-bold">CONVERSATION ID:</span> {lastTrace.conversation_id}
              </div>
              <div>
                <span className="text-amber-400 font-bold">TOOL EXECUTIONS ({lastTrace.agent_output?.toolCallsExecuted?.length || 0}):</span>
                <pre className="mt-1 text-[10px] text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify(lastTrace.agent_output?.toolCallsExecuted || [], null, 2)}
                </pre>
              </div>
              <div>
                <span className="text-emerald-400 font-bold">HUMAN HANDOFF TRIGGERED:</span> {String(lastTrace.agent_output?.humanHandoffTriggered)}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-xs text-gray-500 space-y-2">
              <Bot className="h-8 w-8 text-gray-600" />
              <p>Send a message in the simulator to inspect real-time agent execution traces and tool outputs here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
