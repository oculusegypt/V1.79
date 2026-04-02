let _userId: string | null = null;

export function setSessionUserId(id: string | null) {
  _userId = id;
}

export function getSessionId(): string {
  if (_userId) return `user_${_userId}`;
  return "guest";
}
