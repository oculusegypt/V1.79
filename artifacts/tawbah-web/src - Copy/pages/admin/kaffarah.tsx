import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface KaffarahStep { id: number; sessionId: string; stepKey: string; completed: boolean; completedAt: string | null; createdAt: string }
interface KaffarahStat { stepKey: string; total: number; completed: number; rate: number }

export default function KaffarahPage() {
  const [steps, setSteps] = useState<KaffarahStep[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<KaffarahStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [filterCompleted, setFilterCompleted] = useState("");
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset };
    if (filterCompleted) params.completed = filterCompleted;
    const [res, s] = await Promise.all([adminApi.getKaffarah(params), adminApi.getKaffarahStats()]);
    setSteps(res.steps as KaffarahStep[]);
    setTotal(res.total);
    setStats(s as KaffarahStat[]);
    setLoading(false);
  }, [offset, filterCompleted]);

  useEffect(() => { load(); }, [load]);

  async function toggleCompleted(step: KaffarahStep) {
    await adminApi.updateKaffarah(step.id, { completed: !step.completed });
    load();
  }

  async function handleDelete(id: number) {
    await adminApi.deleteKaffarah(id);
    load();
  }

  return (
    <AdminLayout title="إدارة الكفارة">
      <div className="space-y-4">
        {/* Stats */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">نسبة إكمال كل خطوة</h3>
          {stats.length === 0 ? <p className="text-gray-500 text-sm">لا توجد بيانات</p> : (
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={s.stepKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{s.stepKey}</span>
                    <span className="text-gray-500">{s.completed}/{s.total} ({s.rate}%)</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${s.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <select value={filterCompleted} onChange={(e) => { setFilterCompleted(e.target.value); setOffset(0); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
            <option value="">الكل</option>
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
                  <th className="text-right py-3 px-4">الخطوة</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                  : steps.map((s) => (
                    <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-4 font-mono text-xs text-gray-400">{s.sessionId.slice(0, 14)}...</td>
                      <td className="py-2 px-4 text-xs text-gray-300">{s.stepKey}</td>
                      <td className="py-2 px-4">
                        <button onClick={() => toggleCompleted(s)} className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${s.completed ? "bg-emerald-900/50 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                          {s.completed ? "مكتمل ✓" : "غير مكتمل"}
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
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
    </AdminLayout>
  );
}
