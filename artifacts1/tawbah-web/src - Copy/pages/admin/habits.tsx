import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Habit {
  id: number; sessionId: string; habitKey: string; habitNameAr: string;
  completed: boolean; date: string;
}
interface HabitStat { habitKey: string; habitNameAr?: string; total: number; completed: number; rate: number }

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<HabitStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterCompleted, setFilterCompleted] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset };
    if (filterCompleted) params.completed = filterCompleted;
    const [res, s] = await Promise.all([adminApi.getHabits(params), adminApi.getHabitStats()]);
    setHabits(res.habits as Habit[]);
    setTotal(res.total);
    setStats(s as HabitStat[]);
    setLoading(false);
  }, [offset, filterCompleted]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    await adminApi.deleteHabit(id);
    setDeleteConfirm(null);
    load();
  }

  const chartData = stats.map((s, i) => ({
    name: s.habitNameAr || s.habitKey,
    rate: s.rate,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <AdminLayout title="إدارة العادات">
      <div className="space-y-4">
        {/* Stats Chart */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">معدل إكمال كل عادة (%)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} formatter={(v) => [`${v}%`, "معدل الإكمال"]} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {chartData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.slice(0, 4).map((s) => (
            <div key={s.habitKey} className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
              <p className="text-xs text-gray-400 mb-1 truncate">{s.habitNameAr || s.habitKey}</p>
              <p className="text-xl font-bold text-white">{s.rate}%</p>
              <p className="text-xs text-gray-500">{s.completed}/{s.total}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <select
            value={filterCompleted}
            onChange={(e) => { setFilterCompleted(e.target.value); setOffset(0); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
          >
            <option value="">جميع الحالات</option>
            <option value="true">مكتمل</option>
            <option value="false">غير مكتمل</option>
          </select>
          <span className="text-sm text-gray-400">{total} سجل</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-right py-3 px-4">المعرّف</th>
                  <th className="text-right py-3 px-4">العادة</th>
                  <th className="text-right py-3 px-4">التاريخ</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">حذف</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                ) : habits.map((h) => (
                  <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 px-4 font-mono text-xs text-gray-400">{h.sessionId.slice(0, 14)}...</td>
                    <td className="py-2 px-4 text-gray-300 text-xs">{h.habitNameAr || h.habitKey}</td>
                    <td className="py-2 px-4 text-gray-400 text-xs">{h.date}</td>
                    <td className="py-2 px-4">
                      {h.completed
                        ? <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">مكتمل ✓</span>
                        : <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">غير مكتمل</span>}
                    </td>
                    <td className="py-2 px-4">
                      <button onClick={() => setDeleteConfirm(h.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
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

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-4 text-sm">حذف هذا السجل نهائياً؟</p>
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
