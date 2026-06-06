import { useSessionTimer } from "../hooks/useSessionTimer";

export default function SessionTimer() {
  const timer = useSessionTimer();
  if (!timer) return null;
  const { formatted, isWarning, isCritical } = timer;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors
      ${isCritical
        ? "text-red-600 bg-red-50 border-red-200"
        : isWarning
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-ink-400 bg-ink-50 border-ink-200"
      }`}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M5 2.5V5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {formatted}
    </span>
  );
}