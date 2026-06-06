// Persists session info across tab switches and app minimizes.
// Uses sessionStorage — survives background/foreground but clears on tab close.

const KEY = "kite_session";

export function saveSession({ roomId, role, expiresAt }) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ roomId, role, expiresAt }));
  } catch {}
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Don't restore if session has already expired
    if (data.expiresAt && Date.now() > data.expiresAt) {
      clearSession();
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearSession() {
  try { sessionStorage.removeItem(KEY); } catch {}
}