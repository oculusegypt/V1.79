import { v4 as uuidv4 } from "uuid";

const SESSION_KEY = "tawbah_session_id";

export function getSessionId(): string {
  // First check if user is logged in (from AuthContext)
  const tawbahSession = localStorage.getItem("tawbah_session");
  const tawbahUserId = localStorage.getItem("tawbah_user_id");
  
  // If user is logged in, use user ID
  if (tawbahSession && tawbahSession.startsWith("user_")) {
    return tawbahSession.replace("user_", "");
  }
  
  // Also check tawbah_user_id directly
  if (tawbahUserId) {
    return tawbahUserId;
  }
  
  // Fall back to session ID
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
