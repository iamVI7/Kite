import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../store/useStore";
import { useWebRTC } from "../hooks/useWebRTC";
import { useQRCode } from "../hooks/useQRCode";
import { useDrop } from "../hooks/useDrop";
import TransferList from "../components/TransferList";
import DropZone from "../components/DropZone";
import ConnectionBadge from "../components/ConnectionBadge";
import SessionTimer from "../components/SessionTimer";
import TextShare from "../components/TextShare";
import BackButton from "../components/BackButton";
import TabView from "../components/TabView";
import { saveSession, loadSession } from "../utils/session";

export default function SessionPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { initSignaling, sendFiles, sendText, cancelFile, disconnect } = useWebRTC();
  const connectionStatus = useStore((s) => s.connectionStatus);
  const transfers = useStore((s) => s.transfers);
  const reset = useStore((s) => s.reset);
  const [copied, setCopied] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const joinUrl = `${window.location.origin}/join/${roomId}`;
  const qrDataUrl = useQRCode(joinUrl);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadSession();
    initSignaling(roomId);
  }, [roomId]);

  useEffect(() => () => { if (initialized.current) { disconnect(); reset(); } }, []);

  const canSend = connectionStatus === "connected";
  const isWaiting = connectionStatus === "waiting" || connectionStatus === "connecting";
  const isConnected = connectionStatus === "connected";

  const { isDragging, onDragOver, onDragLeave, onDrop, onInputChange } = useDrop((files) => {
    if (canSend) sendFiles(files);
  });

  const copyLink = () => { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const copyRoom = () => { navigator.clipboard.writeText(roomId); setCopiedRoom(true); setTimeout(() => setCopiedRoom(false), 2000); };
  const handleBack = () => { disconnect(); reset(); navigate("/"); };

  return (
    <div className="min-h-dvh flex flex-col bg-white" onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>

      {/* Header */}
      <header className="px-4 sm:px-6 py-3.5 border-b border-ink-100 bg-white/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <BackButton onClick={handleBack} label="Back" />
          <div className="flex items-center gap-2">
            <SessionTimer />
            <motion.button onClick={copyRoom}
              animate={copiedRoom
                ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" }
                : { backgroundColor: "#f6f6f7", borderColor: "#e9e9ec", color: "#64647a" }}
              className="hidden sm:flex items-center px-3 py-1.5 rounded-full border text-xs font-mono tracking-widest">
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

      {/* ── Mobile: Connected ── */}
      {isConnected && (
        <div className="flex-1 flex flex-col overflow-hidden lg:hidden">
          <TabView onSend={sendText} onSendFiles={sendFiles} disabled={!canSend} onInputChange={onInputChange}/>
        </div>
      )}

      {/* ── Mobile: Waiting — QR card ── */}
      {isWaiting && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 lg:hidden">
          <div className="w-full rounded-3xl border border-ink-100 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col items-center gap-4 p-6 pb-5">
              <div className="text-center">
                <p className="text-sm font-semibold text-ink-800">Scan to connect</p>
                <p className="text-xs text-ink-400 mt-0.5">Point your second device's camera here</p>
              </div>
              <div className="p-2.5 rounded-2xl border border-ink-100 shadow-sm">
                {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-48 h-48 rounded-xl block"/> : <div className="w-48 h-48 rounded-xl bg-ink-50 animate-pulse"/>}
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"/>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"/>
                </span>
                <p className="text-xs text-ink-400">Waiting for peer…</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6"><div className="flex-1 h-px bg-ink-100"/><span className="text-[10px] text-ink-300 uppercase tracking-wider">or share link</span><div className="flex-1 h-px bg-ink-100"/></div>
            <div className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-ink-100 bg-ink-50">
                  <p className="text-xs font-mono text-ink-400 truncate">{joinUrl}</p>
                </div>
                <motion.button onClick={copyLink}
                  animate={copied ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" } : { backgroundColor: "#0d0d1a", borderColor: "#0d0d1a", color: "#ffffff" }}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border min-w-[64px] flex items-center justify-center">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={copied ? "ok" : "c"} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.15 }}>
                      {copied ? "✓" : "Copy"}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile: Other states (idle, reconnecting, ended) ── */}
      {!isConnected && !isWaiting && (
        <div className="flex-1 flex items-center justify-center p-6 lg:hidden">
          <MobileStatus status={connectionStatus} onAction={handleBack}/>
        </div>
      )}

      {/* ── Desktop: always full layout ── */}
      <main className="hidden lg:flex flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-[280px_1fr] gap-5 items-start w-full">
          {/* Left panel */}
          <aside className="sticky top-20 rounded-3xl border border-ink-100 bg-white shadow-sm overflow-hidden">
            <DesktopLeftPanel
              status={connectionStatus} qrDataUrl={qrDataUrl} joinUrl={joinUrl}
              roomId={roomId} copied={copied} copyLink={copyLink}
              copyRoom={copyRoom} onBack={handleBack}
            />
          </aside>
          {/* Right panel */}
          <div className="flex flex-col gap-4">
            <DropZone disabled={!canSend} isDragging={isDragging} onInputChange={onInputChange}/>
            {transfers.length > 0 && <TransferList transfers={transfers} onCancel={cancelFile}/>}
            <TextShare onSend={sendText} disabled={!canSend}/>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Desktop left panel ────────────────────────────────────────────────────────
function DesktopLeftPanel({ status, qrDataUrl, joinUrl, roomId, copied, copyLink, copyRoom, onBack }) {
  const isWaiting = status === "waiting" || status === "connecting";
  return (
    <>
      {status === "idle" && (
        <div className="flex flex-col items-center gap-3 py-14 px-6">
          <svg className="animate-spin w-5 h-5 text-ink-200" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <p className="text-xs text-ink-300">Connecting…</p>
        </div>
      )}
      {isWaiting && (
        <>
          <div className="flex flex-col items-center gap-4 p-6 pb-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-ink-800">Scan to connect</p>
              <p className="text-xs text-ink-400 mt-0.5">Point your second device's camera here</p>
            </div>
            <div className="p-2.5 rounded-2xl border border-ink-100 shadow-sm">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-44 h-44 rounded-xl block"/> : <div className="w-44 h-44 rounded-xl bg-ink-50 animate-pulse"/>}
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"/>
              </span>
              <p className="text-xs text-ink-400">Waiting for peer…</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6"><div className="flex-1 h-px bg-ink-100"/><span className="text-[10px] text-ink-300 uppercase tracking-wider">or share link</span><div className="flex-1 h-px bg-ink-100"/></div>
          <div className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-ink-100 bg-ink-50">
                <p className="text-xs font-mono text-ink-400 truncate">{joinUrl}</p>
              </div>
              <motion.button onClick={copyLink}
                animate={copied ? { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", color: "#16a34a" } : { backgroundColor: "#0d0d1a", borderColor: "#0d0d1a", color: "#ffffff" }}
                className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border min-w-[64px] flex items-center justify-center">
                {copied ? "✓" : "Copy"}
              </motion.button>
            </div>
          </div>
        </>
      )}
      {status === "reconnecting" && (
        <div className="flex flex-col items-center gap-3 py-14 px-6 text-center">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
            <svg className="animate-spin w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div><p className="text-sm font-semibold text-ink-800">Reconnecting</p><p className="text-xs text-ink-400 mt-0.5">Please wait…</p></div>
        </div>
      )}
      {status === "connected" && (
        <div className="flex flex-col items-center gap-4 py-10 px-6 text-center">
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5L20 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <div><p className="text-sm font-semibold text-ink-800">Connected</p><p className="text-xs text-ink-400 mt-0.5">Both devices ready</p></div>
          <div className="w-full mt-1 pt-4 border-t border-ink-100">
            <button onClick={copyRoom} className="group flex items-center justify-between w-full px-3 py-2 rounded-xl hover:bg-ink-50 transition-colors">
              <span className="text-[10px] text-ink-300 uppercase tracking-wider">Session</span>
              <span className="font-mono text-xs text-ink-400 group-hover:text-ink-600 transition-colors">{roomId}</span>
            </button>
          </div>
        </div>
      )}
      {(status === "peer-left" || status === "disconnected") && (
        <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${status === "peer-left" ? "bg-ink-50 border-ink-200" : "bg-red-50 border-red-100"}`}>
            {status === "peer-left"
              ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 14l3-3-3-3M15 11H7M8 4H4a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="#86869a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M13 5l-8 8" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/></svg>
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-800">{status === "peer-left" ? "Peer left" : "Disconnected"}</p>
            <p className="text-xs text-ink-400 mt-0.5">{status === "peer-left" ? "The other device closed the session" : "Could not reconnect after retries"}</p>
          </div>
          <button onClick={onBack} className="px-5 py-2 rounded-full border border-ink-200 bg-white text-xs text-ink-600 font-medium hover:bg-ink-50 transition-colors">
            Start over
          </button>
        </div>
      )}
    </>
  );
}

// ── Mobile status states ──────────────────────────────────────────────────────
function MobileStatus({ status, onAction }) {
  if (status === "idle") return (
    <div className="flex flex-col items-center gap-3">
      <svg className="animate-spin w-5 h-5 text-ink-200" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className="text-xs text-ink-300">Connecting to server…</p>
    </div>
  );
  if (status === "reconnecting") return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-orange-50 border border-orange-100 w-full max-w-sm">
      <svg className="animate-spin w-4 h-4 text-orange-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className="text-sm text-orange-700 font-medium">Reconnecting…</p>
    </div>
  );
  const isLeft = status === "peer-left";
  return (
    <div className="rounded-3xl border border-ink-100 bg-white shadow-sm p-10 flex flex-col items-center gap-4 text-center w-full max-w-sm">
      <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${isLeft ? "bg-ink-50 border-ink-200" : "bg-red-50 border-red-100"}`}>
        {isLeft
          ? <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M12 14l3-3-3-3M15 11H7M8 4H4a1 1 0 00-1 1v8a1 1 0 001 1h4" stroke="#86869a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          : <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round"/></svg>
        }
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-800">{isLeft ? "Peer left" : "Disconnected"}</p>
        <p className="text-xs text-ink-400 mt-1">{isLeft ? "The other device closed the session" : "Could not reconnect after retries"}</p>
      </div>
      <button onClick={onAction} className="px-6 py-2 rounded-full border border-ink-200 bg-white text-sm text-ink-600 font-medium hover:bg-ink-50 transition-colors">
        Start over
      </button>
    </div>
  );
}