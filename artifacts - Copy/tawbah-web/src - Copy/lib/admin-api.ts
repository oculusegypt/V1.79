const BASE = "/api/admin";

function getToken(): string {
  return localStorage.getItem("admin_token") || "";
}

export function setToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/admin";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const adminApi = {
  // Auth check
  checkAuth: () => request<{ ok: boolean }>("/stats/overview"),

  // Overview
  getOverview: () => request<Record<string, unknown>>("/stats/overview"),

  // Users
  getUsers: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ users: unknown[]; total: number }>(`/users?${qs}`);
  },
  getUserDetail: (sessionId: string) => request<Record<string, unknown>>(`/users/${encodeURIComponent(sessionId)}`),
  updateUser: (sessionId: string, data: Record<string, unknown>) =>
    request(`/users/${encodeURIComponent(sessionId)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (sessionId: string) =>
    request(`/users/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),
  exportUsers: () => {
    const a = document.createElement("a");
    a.href = `${BASE}/users/export?_token=${getToken()}`;
    a.download = "users.csv";
    a.click();
  },

  // Habits
  getHabits: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ habits: unknown[]; total: number }>(`/habits?${qs}`);
  },
  getHabitStats: () => request<unknown[]>("/habits/stats"),
  updateHabit: (id: number, data: Record<string, unknown>) =>
    request(`/habits/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHabit: (id: number) => request(`/habits/${id}`, { method: "DELETE" }),

  // Dhikr
  getDhikrPersonal: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ records: unknown[]; total: number; totals: unknown }>(`/dhikr/personal?${qs}`);
  },
  getDhikrRooms: () => request<unknown[]>("/dhikr/rooms"),
  updateDhikrRoom: (type: string, totalCount: number) =>
    request(`/dhikr/rooms/${encodeURIComponent(type)}`, { method: "PUT", body: JSON.stringify({ totalCount }) }),
  deleteDhikrPersonal: (id: number) => request(`/dhikr/personal/${id}`, { method: "DELETE" }),

  // Journal
  getJournal: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ entries: unknown[]; total: number }>(`/journal?${qs}`);
  },
  getJournalMoodsStats: () => request<unknown[]>("/journal/moods-stats"),
  getJournalEntry: (id: number) => request<unknown>(`/journal/${id}`),
  deleteJournalEntry: (id: number) => request(`/journal/${id}`, { method: "DELETE" }),

  // Kaffarah
  getKaffarah: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ steps: unknown[]; total: number }>(`/kaffarah?${qs}`);
  },
  getKaffarahStats: () => request<unknown[]>("/kaffarah/stats"),
  updateKaffarah: (id: number, data: Record<string, unknown>) =>
    request(`/kaffarah/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteKaffarah: (id: number) => request(`/kaffarah/${id}`, { method: "DELETE" }),

  // Zakiy Memory
  getZakiyMemory: () => request<{ memories: unknown[]; total: number }>("/zakiy-memory"),
  getZakiyMemoryBySession: (sessionId: string) =>
    request<unknown>(`/zakiy-memory/${encodeURIComponent(sessionId)}`),
  updateZakiyMemory: (sessionId: string, memoryJson: unknown) =>
    request(`/zakiy-memory/${encodeURIComponent(sessionId)}`, { method: "PUT", body: JSON.stringify({ memoryJson }) }),
  deleteZakiyMemory: (sessionId: string) =>
    request(`/zakiy-memory/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),

  // Hadi Tasks
  getHadiTasks: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ groups: unknown[]; total: number }>(`/hadi-tasks?${qs}`);
  },
  getHadiTaskItems: (groupId: number) => request<unknown[]>(`/hadi-tasks/${groupId}/items`),
  updateHadiTaskItem: (itemId: number, data: Record<string, unknown>) =>
    request(`/hadi-tasks/items/${itemId}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteHadiTaskGroup: (groupId: number) => request(`/hadi-tasks/${groupId}`, { method: "DELETE" }),

  // Journey 30
  getJourney30: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ records: unknown[]; total: number }>(`/journey30?${qs}`);
  },
  getJourney30Stats: () => request<unknown[]>("/journey30/stats"),
  updateJourney30: (id: number, data: Record<string, unknown>) =>
    request(`/journey30/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteJourney30BySession: (sessionId: string) =>
    request(`/journey30/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),

  // Duas
  getCommunityDuas: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ duas: unknown[]; total: number; amenTotal: number }>(`/community-duas?${qs}`);
  },
  deleteCommunityDua: (id: number) => request(`/community-duas/${id}`, { method: "DELETE" }),
  getSecretDuas: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ duas: unknown[]; total: number; unread: number }>(`/secret-duas?${qs}`);
  },
  deleteSecretDua: (id: number) => request(`/secret-duas/${id}`, { method: "DELETE" }),

  // Challenges & Global Stats
  getChallenges: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ challenges: unknown[]; total: number }>(`/challenges?${qs}`);
  },
  deleteChallenge: (slug: string) => request(`/challenges/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  getGlobalStats: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ records: unknown[]; total: number }>(`/global-stats?${qs}`);
  },
  getGlobalStatsMap: () => request<unknown[]>("/global-stats/map"),
  clearGlobalStats: () => request("/global-stats", { method: "DELETE" }),
};
