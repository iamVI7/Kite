import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { formatBytes, formatSpeed, formatEta } from "../utils/format";

// ── Shared helpers ────────────────────────────────────────────────────────────
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(s) {
  if (s < 1) return `${Math.round(s * 1000)}ms`;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}
function isUrl(str) { try { new URL(str); return true; } catch { return false; } }
function fileColor(type = "") {
  if (type.startsWith("image/")) return { bg: "bg-blue-50",   c: "#3b82f6" };
  if (type.startsWith("video/")) return { bg: "bg-purple-50", c: "#9333ea" };
  if (type.startsWith("audio/")) return { bg: "bg-green-50",  c: "#22c55e" };
  if (type.includes("pdf"))      return { bg: "bg-red-50",    c: "#ef4444" };
  if (type.includes("zip"))      return { bg: "bg-amber-50",  c: "#f59e0b" };
  if (type.includes("ppt"))      return { bg: "bg-orange-50", c: "#f97316" };
  return                                { bg: "bg-ink-50",    c: "#86869a" };
}

// ── Connected strip ───────────────────────────────────────────────────────────
function ConnectedStrip() {
  return (
    <div className="mx-4 mt-3 mb-1 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-100">
      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-emerald-700 leading-tight">Connected</p>
        <p className="text-[10px] text-emerald-500 leading-tight">Both devices ready for sharing</p>
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "text",  label: "Text & Links", icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1.5 3h11M1.5 7h7.5M1.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: "files", label: "Files",        icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8 1.5H3.5a1 1 0 00-1 1v9a1 1 0 001 1h7a1 1 0 001-1V5.5L8 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 1.5V5.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

// ── Main export ───────────────────────────────────────────────────────────────
export default function TabView({ onSend, onSendFiles, disabled, onInputChange }) {
  const [tab, setTab] = useState("text");
  const fileInputRef = useRef();
  const messages = useStore((s) => s.messages);
  const transfers = useStore((s) => s.transfers);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ConnectedStrip />

      {/* Tab bar */}
      <div className="flex border-b border-ink-100 px-4 pt-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium mr-1 transition-colors
              ${tab === t.id ? "text-violet-600" : "text-ink-400 hover:text-ink-600"}`}>
            {t.icon}{t.label}
            {tab === t.id && (
              <motion.div layoutId="tab-line"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}/>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          {tab === "text" ? (
            <motion.div key="text" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col overflow-hidden">
              <TextPanel onSend={onSend} disabled={disabled} />
            </motion.div>
          ) : (
            <motion.div key="files" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }} transition={{ duration: 0.15 }}
              className="absolute inset-0 flex flex-col overflow-hidden">
              <FilesPanel onInputChange={onInputChange} fileInputRef={fileInputRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating bottom — Files tab */}
      {tab === "files" && (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <div className="h-24 bg-gradient-to-t from-white/95 via-white/70 to-transparent"/>
          <div className="bg-white px-4 pb-6 pointer-events-auto flex justify-center">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onInputChange} disabled={disabled}/>
            <button onClick={() => !disabled && fileInputRef.current?.click()} disabled={disabled}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full
                bg-violet-500 text-white text-sm font-semibold
                hover:bg-violet-600 active:scale-[0.98] transition-all
                disabled:opacity-40 shadow-xl shadow-violet-300/50">
              <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
                <path d="M9 12V3M6 6l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.5 13v.75A1.75 1.75 0 004.25 15.5h9.5A1.75 1.75 0 0015.5 13.75V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Upload Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Text Panel ────────────────────────────────────────────────────────────────
function TextPanel({ onSend, disabled }) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const messages = useStore((s) => s.messages);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  const prevLen = useRef(0);
  if (messages.length !== prevLen.current) {
    prevLen.current = messages.length;
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function send() {
    const t = input.trim();
    if (!t || disabled) return;
    onSend(t); setInput(""); textareaRef.current?.focus();
  }

  async function paste() {
    try { const t = await navigator.clipboard.readText(); if (t) { setInput(t); textareaRef.current?.focus(); } } catch {}
  }

  async function copy(id, text) {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch {}
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="3" width="16" height="11" rx="2" stroke="#c8c8d0" strokeWidth="1.5"/>
                <path d="M6 8h8M6 11h5" stroke="#c8c8d0" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13 14l3 3v-3" stroke="#c8c8d0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xs font-medium text-ink-400">No messages yet</p>
            <p className="text-xs text-ink-300">Send a message or paste a link</p>
          </div>
        ) : (
          <>
            <p className="text-[10px] text-ink-300 text-center font-medium py-1">Today</p>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div key={msg.id}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`flex flex-col gap-1 ${msg.direction === "outgoing" ? "items-end" : "items-start"}`}>
                  <p className="text-[10px] text-ink-300 px-1 font-medium">
                    {msg.direction === "outgoing" ? "You" : "Peer"}
                  </p>
                  <div className={`group relative max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words
                    ${msg.direction === "outgoing"
                      ? "bg-violet-500 text-white rounded-br-sm"
                      : "bg-ink-50 text-ink-800 border border-ink-100 rounded-bl-sm"}`}>
                    {isUrl(msg.text.trim())
                      ? <a href={msg.text.trim()} target="_blank" rel="noopener noreferrer"
                          className={`underline underline-offset-2 break-all font-medium
                            ${msg.direction === "outgoing" ? "text-violet-100" : "text-violet-500"}`}>
                          {msg.text.trim()}
                        </a>
                      : <span className="whitespace-pre-wrap">{msg.text}</span>
                    }
                    <button onClick={() => copy(msg.id, msg.text)}
                      className={`absolute -top-2 ${msg.direction === "outgoing" ? "-left-2" : "-right-2"}
                        opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full shadow border flex items-center justify-center
                        ${msg.direction === "outgoing" ? "bg-violet-600 border-violet-500 text-violet-200" : "bg-white border-ink-200 text-ink-400"}`}>
                      {copiedId === msg.id
                        ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><rect x="2.5" y="0.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M0.5 3.5v4a1 1 0 001 1h4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                      }
                    </button>
                  </div>
                  <div className={`flex items-center gap-1 px-1 ${msg.direction === "outgoing" ? "flex-row-reverse" : ""}`}>
                    <p className="text-[10px] text-ink-300">{fmtTime(msg.timestamp)}</p>
                    {msg.direction === "outgoing" && (
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 4l3 3 7-6" stroke="#a8a8b5" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={endRef}/>
          </>
        )}
      </div>

      {/* Floating unified pill input */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <div className="h-16 bg-gradient-to-t from-white/95 via-white/60 to-transparent"/>
        <div className="bg-white px-4 pb-6 pointer-events-auto">
          <div className="flex items-center bg-ink-50 rounded-full border border-ink-200 shadow-lg shadow-black/5 pl-4 pr-1.5 py-1.5 gap-1">
            <textarea ref={textareaRef} value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
              disabled={disabled} rows={1}
              placeholder={disabled ? "Connect first…" : "Message or link…"}
              className="flex-1 bg-transparent text-sm text-ink-800 placeholder:text-ink-300
                focus:outline-none resize-none disabled:opacity-40 leading-relaxed max-h-24 overflow-y-auto py-1"
              style={{ minHeight: "22px", maxWidth: "calc(100% - 80px)" }}
            />
            <button onClick={paste} disabled={disabled}
              className="w-8 h-8 flex items-center justify-center text-ink-300 hover:text-ink-500 transition-colors disabled:opacity-40 flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="4" y="1" width="9" height="3" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M3 3h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4.5 9h7M4.5 11.5h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
            <motion.button onClick={send} disabled={disabled || !input.trim()} whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white
                shadow-md shadow-violet-300/60 hover:bg-violet-600 transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M14.5 8L1.5 2l2.5 6-2.5 6 13-6z" fill="currentColor"/>
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Files Panel ───────────────────────────────────────────────────────────────
function FilesPanel({ onInputChange, fileInputRef }) {
  const transfers = useStore((s) => s.transfers);
  const { cancelTransfer } = useStore();

  if (transfers.length === 0) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-center px-8">
      <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#c8c8d0" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 2v6h6M8 13h6M8 17h4" stroke="#c8c8d0" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-xs font-medium text-ink-400">No files yet</p>
      <p className="text-xs text-ink-300">Tap Upload Files below to send</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      <p className="px-4 pt-4 pb-2 text-xs text-ink-400 font-semibold uppercase tracking-wider">All files</p>
      <ul className="px-4 flex flex-col gap-2 pb-2">
        <AnimatePresence initial={false}>
          {transfers.map((t) => {
            const { bg, c } = fileColor(t.fileType);
            const done = t.status === "done";
            const active = t.status === "sending" || t.status === "receiving";
            const cancelled = t.status === "cancelled";
            return (
              <motion.li key={t.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                className={`rounded-2xl border border-ink-100 bg-white p-3 ${cancelled ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 2v6h6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{t.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-ink-400">{formatBytes(t.size)}</span>
                      {active && t.speed > 0 && <><span className="text-ink-200 text-xs">·</span><span className="text-xs text-ink-400">{formatEta(t.eta)}</span></>}
                      {done && t.duration != null && <><span className="text-ink-200 text-xs">·</span><span className="text-xs text-ink-400">{fmtDuration(t.duration)}</span></>}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {done && t.direction === "incoming" && t.blob && (
                      <a href={URL.createObjectURL(t.blob)} download={t.name}
                        className="w-8 h-8 rounded-full bg-violet-50 border border-violet-100
                          flex items-center justify-center text-violet-500 hover:bg-violet-100 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 9.5V2M4 7l3 3 3-3M1.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    )}
                    {done && t.direction === "outgoing" && (
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M1.5 5.5l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {active && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-ink-400 tabular-nums">{t.progress}%</span>
                        <button onClick={() => cancelTransfer(t.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-ink-300 hover:text-red-400 hover:bg-red-50 transition-colors">
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    <span className="text-[10px] text-ink-300 tabular-nums">{fmtTime(Date.now())}</span>
                  </div>
                </div>
                {active && (
                  <div className="mt-2.5 h-1 rounded-full bg-ink-100 overflow-hidden">
                    <motion.div className={`h-full rounded-full ${t.direction === "incoming" ? "bg-violet-400" : "bg-amber-400"}`}
                      animate={{ width: `${t.progress}%` }} transition={{ duration: 0.15 }}/>
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}