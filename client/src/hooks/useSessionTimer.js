import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";

export function useSessionTimer() {
  const sessionExpiresAt = useStore((s) => s.sessionExpiresAt);
  const [remaining, setRemaining] = useState(null); // seconds

  useEffect(() => {
    if (!sessionExpiresAt) return;

    function tick() {
      const secs = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setRemaining(secs);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionExpiresAt]);

  if (remaining === null) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isWarning = remaining <= 300; // last 5 mins
  const isCritical = remaining <= 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return { remaining, formatted, isWarning, isCritical };
}