let _userId: string | null = null;

export function setSessionUserId(id: string | null) {
  _userId = id;
}

export function getSessionId(): string {
  try {
    const forced = localStorage.getItem("tawbah_session_id");
    if (forced) return forced;
  } catch {}

  try {
    const stored = localStorage.getItem("tawbah_user");
    if (stored) {
      const u = JSON.parse(stored) as { id?: string | number };
      const id = u?.id != null ? String(u.id) : null;
      if (id) return `user_${id}`;
    }
  } catch {}

  if (_userId) return `user_${_userId}`;
  return "guest";
}
