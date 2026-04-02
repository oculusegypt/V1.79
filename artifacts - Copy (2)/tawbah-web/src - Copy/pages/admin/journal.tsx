import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface JournalEntry { id: number; sessionId: string; content: string; mood: string; date: string; createdAt: string }
interface MoodStat { mood: string; count: number }

const MOOD_COLORS: Record<string, string> = {
  happy: "#10b981", sad: "#6366f1", angry: "#ef4444",
  anxious: "#f59e0b", neutral: "#9ca3af", grateful: "#f97316",
  hopeful: "#06b6d4", regretful: "#8b5cf6",
};
const MOOD_LABELS: Record<string, string> = {
  happy: "سعيد", sad: "حزين", angry: "غاضب",
  anxious: "قلق", neutral: "محايد", grateful: "ممتنّ",
  hopeful: "متفائل", regretful: "نادم",
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [moodStats, setMoodStats] = useState<MoodStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterMood, setFilterMood] = useState("");
  const [viewEntry, setViewEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset };
    if (filterMood) params.mood = filterMood;
    const [res, ms] = await Promise.all([adminApi.getJournal(params), adminApi.getJournalMoodsStats()]);
    setEntries(res.entries as JournalEntry[]);
    setTotal(res.total);
    setMoodStats(ms as MoodStat[]);
    setLoading(false);
  }, [offset, filterMood]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    await adminApi.deleteJournalEntry(id);
    setDeleteConfirm(null);
    load();
  }

  return (
    <AdminLayout title="إدارة اليوميات">
      <div className="space-y-4">
        {/* Mood Chart */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-3">توزيع المزاج</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={moodStats.map(m => ({ name: MOOD_LABELS[m.mood] || m.mood, value: m.count }))}
                  dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {moodStats.map((m, i) => <Cell key={i} fill={MOOD_COLORS[m.mood] || "#9ca3af"} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                <Legend formatter={(v) => <span style={{ color: "#d1d5db", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-3">إحصائيات المزاج</h3>
            <div className="space-y-2">
              {moodStats.map((m) => (
                <div key={m.mood} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: MOOD_COLORS[m.mood] || "#9ca3af" }} />
                  <span className="text-xs text-gray-300 flex-1">{MOOD_LABELS[m.mood] || m.mood}</span>
                  <span className="text-xs text-white font-medium">{m.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <select value={filterMood} onChange={(e) => { setFilterMood(e.target.value); setOffset(0); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">كل المشاعر</option>
            {Object.entries(MOOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <span className="text-sm text-gray-400">{total} مقطع</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-right py-3 px-4">المعرّف</th>
                  <th className="text-right py-3 px-4">مقتطف</th>
                  <th className="text-right py-3 px-4">المزاج</th>
                  <th className="text-right py-3 px-4">التاريخ</th>
                  <th className="text-right py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                  : entries.map((e) => (
                    <tr key={e.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-4 font-mono text-xs text-gray-400">{e.sessionId.slice(0, 14)}...</td>
                      <td className="py-2 px-4 text-xs text-gray-300 max-w-48 truncate">{e.content}</td>
                      <td className="py-2 px-4">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (MOOD_COLORS[e.mood] || "#9ca3af") + "30", color: MOOD_COLORS[e.mood] || "#9ca3af" }}>
                          {MOOD_LABELS[e.mood] || e.mood}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-400">{e.date}</td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2">
                          <button onClick={() => setViewEntry(e)} className="text-blue-400 hover:text-blue-300"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteConfirm(e.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
            <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
            <button disabled={offset + LIMIT >= total} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {viewEntry && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setViewEntry(null)}>
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (MOOD_COLORS[viewEntry.mood] || "#9ca3af") + "30", color: MOOD_COLORS[viewEntry.mood] || "#9ca3af" }}>{MOOD_LABELS[viewEntry.mood] || viewEntry.mood}</span>
                <span className="text-xs text-gray-500">{viewEntry.date}</span>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4">
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-4 text-sm">حذف هذا المقطع نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">حذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
