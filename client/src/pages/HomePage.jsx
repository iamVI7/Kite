import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import kiteLogo from "/Kite_Logo.png";

/* ─── Inline SVG icons ─── */
function IconShield() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// ← Removed IconServerOff, removed "Zero data stored" entry
const trustItems = [
  { Icon: IconShield, label: "WebRTC encrypted"  },
  { Icon: IconZap,    label: "No file size limit" },
  { Icon: IconGlobe,  label: "Any device"         },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", { method: "POST" });
      const { roomId } = await res.json();
      navigate(`/session/${roomId}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    const code = joinInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`/api/rooms/${code}`);
      if (!res.ok) { setJoinError("Session not found."); return; }
      navigate(`/join/${code}`);
    } catch {
      setJoinError("Could not connect. Try again.");
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-white">

      {/* ── Navbar ── */}
      <nav className="w-full px-6 sm:px-10 pt-6 pb-4">
        <div className="max-w-2xl mx-auto flex items-center">
          {/* ← shifted left with -ml-2, tightened gap from gap-2.5 to gap-1.5 */}
          <div className="flex items-center gap-1.5 -ml-2">
            <img src={kiteLogo} alt="Kite" className="h-10 w-10 object-contain" />
            <span className="font-semibold text-[19px] tracking-tight text-slate-900">Kite</span>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-2xl flex flex-col items-center text-center"
        >

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
            bg-violet-50 border border-violet-100 text-xs text-violet-600 font-medium mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            End-to-end · No servers · No signup
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] sm:text-5xl lg:text-[3.4rem] font-bold text-slate-900
            leading-[1.06] tracking-[-0.03em] mb-4">
            Transfer anything,<br />
            <span className="text-violet-500">instantly.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-400 text-base sm:text-[17px] leading-relaxed mb-9 max-w-sm font-light">
            Move files directly between devices.<br />
            Works on desktop and mobile browsers.
          </p>

          {/* ── CTA Buttons ── */}
          <motion.div
            layout
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center"
          >
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full
                  bg-slate-900 text-white text-sm font-medium shadow-sm
                  hover:bg-slate-700 active:scale-95 transition-all duration-150
                  disabled:opacity-50 w-full sm:w-auto"
              >
                {creating ? <><Spinner /> Creating…</> : "Create Session"}
              </button>

              <button
                onClick={() => { setShowJoin(v => !v); setJoinError(""); setJoinInput(""); }}
                className={`inline-flex items-center justify-center px-7 py-3 rounded-full
                  text-sm font-medium border active:scale-95 transition-colors duration-150
                  w-full sm:w-auto
                  ${showJoin
                    ? "bg-violet-50 border-violet-200 text-violet-700"
                    : "bg-white border-slate-200 text-slate-700"
                  }`}
              >
                {showJoin ? "Cancel" : "Join with Code"}
              </button>
            </div>

            {/* Join form */}
            <AnimatePresence initial={false}>
              {showJoin && (
                <motion.div
                  key="join-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                  className="w-full flex flex-col items-center"
                >
                  <form onSubmit={handleJoin} className="pt-5 w-full flex flex-col items-center">
                    <div className="inline-flex gap-2 items-center bg-slate-50 border border-slate-200
                      rounded-full p-1.5 shadow-[0_2px_12px_rgba(124,111,245,0.10)]">
                      <input
                        autoFocus
                        value={joinInput}
                        onChange={(e) => { setJoinInput(e.target.value.toUpperCase()); setJoinError(""); }}
                        placeholder="A1B2C3D4"
                        maxLength={8}
                        className="px-4 py-1.5 rounded-full text-sm font-mono bg-white border border-slate-200
                          focus:outline-none focus:ring-2 focus:ring-violet-400
                          w-32 text-center tracking-[0.2em] text-slate-900 transition-shadow duration-150"
                      />
                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.96 }}
                        className="px-5 py-1.5 rounded-full bg-slate-900 text-white text-sm font-medium
                          hover:bg-slate-700 transition-colors whitespace-nowrap"
                      >
                        Join →
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {joinError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-2 text-xs text-red-500"
                        >
                          {joinError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Works on desktop — removed "No installation required" */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mt-6 flex flex-col items-center gap-1"
          >
            
          </motion.div>

          {/* ── Trust Strip — mobile responsive, wraps to 2 cols on small screens ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-10 w-full"
          >
            {/* Desktop: single row with dividers */}
            <div className="hidden sm:flex items-center justify-center">
              {trustItems.map(({ Icon, label }, i) => (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2.5 px-5">
                    <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-50 border border-violet-100
                      flex items-center justify-center text-violet-500">
                      <Icon />
                    </span>
                    <span className="text-[11.5px] text-slate-500 font-medium leading-tight whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                  {i < trustItems.length - 1 && (
                    <div className="h-5 w-px bg-slate-200 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile: 3-column grid, no dividers */}
            <div className="sm:hidden grid grid-cols-3 gap-3 px-2">
              {trustItems.map(({ Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100
                    flex items-center justify-center text-violet-500">
                    <Icon />
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full">
        <div
          className="h-px w-full bg-slate-200"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
          }}
        />
        <p className="text-center text-xs text-slate-300 py-5">
          Files never touch our servers
        </p>
      </footer>

    </div>
  );
}

/* ─── Spinner ─── */
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}