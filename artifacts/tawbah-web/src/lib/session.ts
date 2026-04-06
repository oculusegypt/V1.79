let _userId: string | null = null;

const GUEST_SESSION_KEY = "tawbah_guest_session_id";

export function setSessionUserId(id: string | null) {
  _userId = id;
}

export function getSessionId(): string {
  if (_userId) return `user_${_userId}`;
  return "guest";
}

export function clearGuestSessionId() {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY);
  } catch {
    // ignore
  }
}
