let _userId: string | null = null;

const GUEST_SESSION_KEY = "tawbah_guest_session_id";

function getOrCreateGuestSessionId(): string {
  try {
    const existing = localStorage.getItem(GUEST_SESSION_KEY);
    if (existing && existing.trim()) return existing;
    const id = `guest_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    localStorage.setItem(GUEST_SESSION_KEY, id);
    return id;
  } catch {
    return `guest_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  }
}

export function clearGuestSessionId() {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {}
}

export function setSessionUserId(id: string | null) {
  _userId = id;
}

export function getSessionId(): string {
  if (_userId) return `user_${_userId}`;
  return getOrCreateGuestSessionId();
}
