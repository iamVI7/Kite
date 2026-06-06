const STATUS_CONFIG = {
  idle:         { label: "Idle",          color: "text-ink-400 bg-ink-50 border-ink-200",        dot: "bg-ink-300" },
  waiting:      { label: "Waiting",       color: "text-amber-600 bg-amber-50 border-amber-200",  dot: "bg-amber-400 animate-pulse" },
  connecting:   { label: "Connecting",    color: "text-blue-600 bg-blue-50 border-blue-200",     dot: "bg-blue-400 animate-pulse" },
  reconnecting: { label: "Reconnecting",  color: "text-orange-600 bg-orange-50 border-orange-200", dot: "bg-orange-400 animate-pulse" },
  connected:    { label: "Connected",     color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-400" },
  disconnected: { label: "Disconnected",  color: "text-red-600 bg-red-50 border-red-200",        dot: "bg-red-400" },
  "peer-left":  { label: "Peer left",     color: "text-ink-500 bg-ink-50 border-ink-200",        dot: "bg-ink-300" },
};

export default function ConnectionBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}