import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";

export default function TextShare({ onSend, disabled }) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const messages = useStore((s) => s.messages);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text || disabled) return;
    onSend(text);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  async function pasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) { setInput(text); textareaRef.current?.focus(); }
    } catch {}
  }

  async function copyText(id, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }

  function isUrl(str) {
    try { new URL(str); return true; } catch { return false; }
  }

  return (
    <div className="rounded-3xl border border-ink-100 bg-white shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 2h11M1 6.5h7.5M1 11h5" stroke="#a8a8b5" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Text & Links</span>
        </div>
        {messages.length > 0 && (
          <span className="text-xs text-ink-300">{messages.length}</span>
        )}
      </div>

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="max-h-52 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[82%] flex flex-col gap-1">
                  <div className={`group relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                    ${msg.direction === "outgoing"
                      ? "bg-ink-900 text-white rounded-br-sm"
                      : "bg-ink-50 text-ink-800 border border-ink-100 rounded-bl-sm"
                    }`}
                  >
                    {isUrl(msg.text.trim()) ? (
                      <a
                        href={msg.text.trim()} target="_blank" rel="noopener noreferrer"
                        className={`underline underline-offset-2 break-all
                          ${msg.direction === "outgoing" ? "text-violet-300" : "text-violet-500"}`}
                      >
                        {msg.text.trim()}
                      </a>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}

                    {/* Copy on hover */}
                    <button
                      onClick={() => copyText(msg.id, msg.text)}
                      className={`absolute -top-2 ${msg.direction === "outgoing" ? "-left-2" : "-right-2"}
                        opacity-0 group-hover:opacity-100 transition-opacity
                        w-6 h-6 rounded-full shadow-sm border flex items-center justify-center
                        ${msg.direction === "outgoing"
                          ? "bg-ink-700 border-ink-600 text-ink-300"
                          : "bg-white border-ink-200 text-ink-400"}`}
                    >
                      {copiedId === msg.id ? (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path d="M1.5 4.5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <rect x="2.5" y="0.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.1" />
                          <path d="M0.5 3.5v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className={`text-[10px] text-ink-300 px-1 ${msg.direction === "outgoing" ? "text-right" : ""}`}>
                    {msg.direction === "outgoing" ? "You" : "Peer"} · {fmtTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex items-center gap-3 px-5 py-5 text-ink-300">
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" className="flex-shrink-0 opacity-40">
            <rect x="2" y="4" width="26" height="18" rx="3" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 11h14M8 15h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M18 22l4 4v-4h2a2 2 0 002-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-xs font-medium text-ink-400">No messages yet</p>
            <p className="text-xs text-ink-300 mt-0.5">Send a message, link, or paste from clipboard</p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-ink-100 p-3.5">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={2}
            placeholder={disabled ? "Connect a device first…" : "Message or link…"}
            className="flex-1 px-3.5 py-2.5 rounded-2xl border border-ink-100 bg-ink-50
              text-sm text-ink-800 placeholder:text-ink-300
              focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent focus:bg-white
              resize-none disabled:opacity-40 disabled:cursor-not-allowed
              leading-relaxed transition-all"
          />
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            {/* Paste */}
            <button
              onClick={pasteClipboard} disabled={disabled} title="Paste from clipboard"
              className="w-9 h-9 rounded-full border border-ink-200 bg-white flex items-center justify-center
                text-ink-400 hover:text-ink-700 hover:bg-ink-50 transition-colors disabled:opacity-40"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="3" y="0.5" width="7" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 2.5h9a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1v-8a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" />
                <path d="M3.5 7h6M3.5 9.5h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </button>
            {/* Send */}
            <button
              onClick={handleSend} disabled={disabled || !input.trim()} title="Send (Ctrl+Enter)"
              className="w-9 h-9 rounded-full bg-ink-900 flex items-center justify-center text-white
                hover:bg-ink-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M12 6.5L1 1l2 5.5L1 12l11-5.5z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
        {!disabled && (
          <p className="text-[10px] text-ink-300 mt-2 text-right">Ctrl+Enter to send</p>
        )}
      </div>
    </div>
  );
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}