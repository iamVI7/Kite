import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { useWebRTC } from "../hooks/useWebRTC";
import { useDrop } from "../hooks/useDrop";
import TransferList from "../components/TransferList";
import DropZone from "../components/DropZone";
import ConnectionBadge from "../components/ConnectionBadge";
import SessionTimer from "../components/SessionTimer";
import TextShare from "../components/TextShare";
import BackButton from "../components/BackButton";
import TabView from "../components/TabView";
import { loadSession } from "../utils/session";

export default function JoinPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { initSignaling, sendFiles, sendText, cancelFile, disconnect } = useWebRTC();
  const connectionStatus = useStore((s) => s.connectionStatus);
  const transfers = useStore((s) => s.transfers);
  const reset = useStore((s) => s.reset);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadSession();
    if (saved && saved.roomId === roomId) {
      console.log("[session] restoring from sessionStorage");
    }
    initSignaling(roomId);
  }, [roomId]);

  useEffect(() => {
    return () => { if (initialized.current) { disconnect(); reset(); } };
  }, []);

  const canSend = connectionStatus === "connected";
  const { isDragging, onDragOver, onDragLeave, onDrop, onInputChange } = useDrop((files) => {
    if (canSend) sendFiles(files);
  });

  function handleLeave() { disconnect(); reset(); navigate("/"); }

  function copyRoomId() {
    navigator.clipboard.writeText(roomId);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  }

  const isConnecting = connectionStatus === "idle" || connectionStatus === "connecting";
  const isEnded = connectionStatus === "peer-left" || connectionStatus === "disconnected";

  return (
    <div
      className="min-h-dvh flex flex-col bg-white"
      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
    >
      {/* ── Header ── */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-ink-100 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <BackButton onClick={handleLeave} label="Leave" />
          <div className="flex items-center gap-2">
            <SessionTimer />
            <motion.button
              onClick={copyRoomId}
              animate={copiedRoom
                ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }
                : { backgroundColor: "#f6f6f7", borderColor: "#e9e9ec", color: "#64647a" }
              }
              transition={{ duration: 0.2 }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono tracking-widest"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={copiedRoom ? "ok" : "id"}
                  initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }}
                  transition={{ duration: 0.15 }}>
                  {copiedRoom ? "✓ Copied" : roomId}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <ConnectionBadge status={connectionStatus} />
          </div>
        </div>
      </header>

      {/* ── Connecting / error states ── */}
      <AnimatePresence mode="wait">
        {(isConnecting || isEnded || connectionStatus === "reconnecting") && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm">
              {isConnecting && (
                <div className="rounded-3xl border border-ink-100 bg-white shadow-sm p-10 flex flex-col items-center gap-5 text-center">
                  <div className="relative flex items-center justify-center w-16 h-16">
                    <span className="absolute w-16 h-16 rounded-full border-2 border-violet-100 animate-ping opacity-30"/>
                    <span className="absolute w-11 h-11 rounded-full border-2 border-violet-200 animate-ping opacity-50" style={{ animationDelay: "0.2s" }}/>
                    <div className="w-8 h-8 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center z-10">
                      <svg className="animate-spin w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-ink-800">Connecting…</p>
                    <p className="text-sm text-ink-400 mt-1">Establishing a direct peer connection</p>
                  </div>
                </div>
              )}

              {connectionStatus === "reconnecting" && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100">
                  <svg className="animate-spin w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm text-orange-700 font-medium">Connection lost — reconnecting…</p>
                </div>
              )}

              {connectionStatus === "peer-left" && (
                <EndCard
                  iconBg="bg-ink-50 border-ink-200"
                  icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 14l3-3-3-3M15 11H7M8 4H4a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="#86869a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  title="Host ended the session"
                  desc="The other device disconnected"
                  onAction={handleLeave} actionLabel="Go home"
                />
              )}

              {connectionStatus === "disconnected" && (
                <EndCard
                  iconBg="bg-red-50 border-red-100"
                  icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                  title="Disconnected"
                  desc="Could not reconnect after retries"
                  onAction={handleLeave} actionLabel="Go home"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Connected — tab UI on mobile, stacked on desktop ── */}
      {connectionStatus === "connected" && (
        <>
          {/* Mobile: full-height tab view */}
          <div className="flex-1 flex flex-col overflow-hidden lg:hidden">
            <TabView
              onSend={sendText}
              onSendFiles={sendFiles}
              disabled={!canSend}
              onInputChange={onInputChange}
            />
          </div>

          {/* Desktop: original stacked layout */}
          <main className="hidden lg:block flex-1 max-w-2xl mx-auto w-full px-6 py-8">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"/>
                <p className="text-sm text-emerald-700 font-medium">Connected — send files or text in either direction</p>
              </div>
              <DropZone disabled={!canSend} isDragging={isDragging} onInputChange={onInputChange}/>
              {transfers.length > 0 && <TransferList transfers={transfers} onCancel={cancelFile}/>}
              <TextShare onSend={sendText} disabled={!canSend}/>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

function EndCard({ iconBg, icon, title, desc, onAction, actionLabel }) {
  return (
    <div className="rounded-3xl border border-ink-100 bg-white shadow-sm p-10 flex flex-col items-center gap-4 text-center">
      <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        <p className="text-xs text-ink-400 mt-1">{desc}</p>
      </div>
      <button onClick={onAction}
        className="px-6 py-2 rounded-full border border-ink-200 bg-white text-sm text-ink-600 font-medium hover:bg-ink-50 transition-colors">
        {actionLabel}
      </button>
    </div>
  );
}