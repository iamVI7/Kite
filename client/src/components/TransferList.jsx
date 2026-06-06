import { motion, AnimatePresence } from "framer-motion";
import { formatBytes, formatSpeed, formatEta } from "../utils/format";

export default function TransferList({ transfers, onCancel }) {
  return (
    <div className="rounded-3xl border border-ink-100 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-ink-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Transfers</span>
        <span className="text-xs text-ink-300">
          {transfers.filter(t => t.status === "done").length}/{transfers.length} done
        </span>
      </div>
      <ul>
        <AnimatePresence initial={false}>
          {transfers.map((t) => <TransferRow key={t.id} transfer={t} onCancel={onCancel} />)}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function fileColor(type = "") {
  if (type.startsWith("image/")) return { bg: "bg-pink-50", stroke: "#ec4899" };
  if (type.startsWith("video/")) return { bg: "bg-purple-50", stroke: "#9333ea" };
  if (type.startsWith("audio/")) return { bg: "bg-blue-50", stroke: "#3b82f6" };
  if (type.includes("pdf"))      return { bg: "bg-red-50",   stroke: "#ef4444" };
  if (type.includes("zip") || type.includes("archive")) return { bg: "bg-amber-50", stroke: "#f59e0b" };
  return { bg: "bg-ink-50", stroke: "#86869a" };
}

function TransferRow({ transfer: t, onCancel }) {
  const incoming = t.direction === "incoming";
  const done = t.status === "done";
  const cancelled = t.status === "cancelled";
  const active = t.status === "sending" || t.status === "receiving";
  const { bg, stroke } = fileColor(t.fileType);

  return (
    <motion.li
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`border-b border-ink-100 last:border-0 ${cancelled ? "opacity-40" : ""}`}
    >
      <div className="px-5 py-3.5 flex items-center gap-3">
        {/* File icon */}
        <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
              stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 2v6h6" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-ink-800 truncate leading-tight">{t.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-ink-400">{formatBytes(t.size)}</span>
            {active && t.speed > 0 && (
              <>
                <span className="text-ink-200 text-xs">·</span>
                <span className="text-xs text-ink-400">{formatSpeed(t.speed)}</span>
                <span className="text-ink-200 text-xs">·</span>
                <span className="text-xs text-ink-400">{formatEta(t.eta)}</span>
              </>
            )}
            {done && (
              <>
                <span className="text-ink-200 text-xs">·</span>
                <span className="text-xs text-emerald-500 font-medium">Done</span>
                {t.duration != null && (
                  <>
                    <span className="text-ink-200 text-xs">·</span>
                    <span className="text-xs text-ink-400">{fmtDuration(t.duration)}</span>
                  </>
                )}
              </>
            )}
            {cancelled && <><span className="text-ink-200 text-xs">·</span><span className="text-xs text-ink-400">Cancelled</span></>}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {done && incoming && t.blob && (
            <a
              href={URL.createObjectURL(t.blob)}
              download={t.name}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full
                bg-violet-50 border border-violet-100 text-xs text-violet-600 font-medium
                hover:bg-violet-100 transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 7.5V1M2.5 5l3 3 3-3M1 10h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Save
            </a>
          )}
          {done && !incoming && (
            <span className="text-xs text-emerald-500 font-medium">Sent ✓</span>
          )}
          {active && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink-300 tabular-nums">{t.progress}%</span>
              {onCancel && (
                <button
                  onClick={() => onCancel(t.id)}
                  className="w-6 h-6 rounded-full flex items-center justify-center
                    text-ink-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {active && (
        <div className="h-[2px] bg-ink-100 mx-5 mb-3 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${incoming ? "bg-violet-400" : "bg-amber-400"}`}
            animate={{ width: `${t.progress}%` }}
            transition={{ duration: 0.15 }}
          />
        </div>
      )}
    </motion.li>
  );
}

function fmtDuration(secs) {
  if (secs < 1) return `${Math.round(secs * 1000)}ms`;
  if (secs < 60) return `${secs.toFixed(1)}s`;
  return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`;
}