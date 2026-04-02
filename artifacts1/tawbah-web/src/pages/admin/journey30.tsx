import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Journey30Record { id: number; sessionId: string; dayNumber: number; completed: boolean; completedAt: string | null; date: string | null }
interface Journey30Stat { dayNumber: number; total: number; completed: number; rate: number }

export default function Journey30Page() {
  const [records, setRecords] = useState<Journey30Record[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Journey30Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sessionFilter, setSessionFilter] = useState("");
  const [deleteSession, setDeleteSession] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset };
    if (sessionFilter) params.sessionId = sessionFilter;
    const [res, s] = await Promise.all([adminApi.getJourney30(params), adminApi.getJourney30Stats()]);
    setRecords(res.records as Journey30Record[]);
    setTotal(res.total);
    setStats(s as Journey30Stat[]);
    setLoading(false);
  }, [offset, sessionFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteSession() {
    if (!deleteSession) return;
    await adminApi.deleteJourney30BySession(deleteSession);
    setDeleteConfirm(false);
    setDeleteSession("");
    load();
  }

  async function toggleRecord(r: Journey30Record) {
    await adminApi.updateJourney30(r.id, { completed: !r.completed });
    load();
  }

  const chartData = stats.map((s) => ({ name: `اليوم ${s.dayNumber}`, rate: s.rate, completed: s.completed }));

  return (
    <AdminLayout title="رحلة 30 يوم">
      <div className="space-y-4">
        {/* Chart */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-3">معدل إكمال كل يوم (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={8}>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} formatter={(v) => [`${v}%`, "الإكمال"]} />
              <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={i < 10 ? "#10b981" : i < 20 ? "#6366f1" : "#f59e0b"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={sessionFilter}
            onChange={(e) => { setSessionFilter(e.target.value); setOffset(0); }}
            placeholder="فلترة بـ sessionId..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 flex-1 min-w-48 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2 items-center">
            <input
              value={deleteSession}
              onChange={(e) => setDeleteSession(e.target.value)}
              placeholder="sessionId للحذف..."
              className="bg-gray-800 border border-red-900/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-48 focus:outline-none"
            />
            <button
              disabled={!deleteSession}
              onClick={() => setDeleteConfirm(true)}
              className="bg-red-900 hover:bg-red-800 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm px-3 py-2 rounded-lg"
            >
              مسح تقدم مستخدم
            </button>
          </div>
          <span className="text-sm text-gray-400">{total} سجل</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-right py-3 px-4">المعرّف</th>
                  <th className="text-right py-3 px-4">اليوم</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                  : records.map((r) => (
                    <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-4 font-mono text-xs text-gray-400">{r.sessionId.slice(0, 14)}...</td>
                      <td className="py-2 px-4 text-white font-medium">اليوم {r.dayNumber}</td>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleRecord(r)} className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${r.completed ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                          {r.completed ? "مكتمل ✓" : "غير مكتمل"}
                        </button>
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-400">{r.date || r.completedAt?.slice(0, 10) || "—"}</td>
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-2 text-sm">مسح كل تقدم المستخدم في رحلة 30 يوم؟</p>
            <p className="font-mono text-xs text-gray-400 mb-4 break-all">{deleteSession}</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteSession} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">تأكيد</button>
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
