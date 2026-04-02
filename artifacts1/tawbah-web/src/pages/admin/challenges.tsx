import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Challenge { id: number; slug: string; duration: number; pledge: string | null; startDate: string; encouragements: number; createdAt: string }
interface GlobalStat { id: number; eventType: string; countryCode: string | null; date: string; createdAt: string }
interface MapStat { countryCode: string; events: number }

const COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7"];

export default function ChallengesPage() {
  const [tab, setTab] = useState<"challenges" | "map">("challenges");
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesTotal, setChallengesTotal] = useState(0);
  const [stats, setStats] = useState<GlobalStat[]>([]);
  const [statsTotal, setStatsTotal] = useState(0);
  const [mapData, setMapData] = useState<MapStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [deleteChallenge, setDeleteChallenge] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "challenges") {
      const res = await adminApi.getChallenges({ limit: LIMIT, offset });
      setChallenges(res.challenges as Challenge[]);
      setChallengesTotal(res.total);
    } else {
      const [res, map] = await Promise.all([
        adminApi.getGlobalStats({ limit: LIMIT, offset }),
        adminApi.getGlobalStatsMap(),
      ]);
      setStats(res.records as GlobalStat[]);
      setStatsTotal(res.total);
      setMapData(map as MapStat[]);
    }
    setLoading(false);
  }, [tab, offset]);

  useEffect(() => { load(); }, [load]);

  async function handleDeleteChallenge() {
    if (!deleteChallenge) return;
    await adminApi.deleteChallenge(deleteChallenge);
    setDeleteChallenge(null);
    load();
  }

  async function handleClearStats() {
    await adminApi.clearGlobalStats();
    setClearConfirm(false);
    load();
  }

  return (
    <AdminLayout title="التحديات والخريطة">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit">
          {(["challenges", "map"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setOffset(0); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-emerald-700 text-white" : "text-gray-400 hover:text-white"}`}>
              {t === "challenges" ? "التحديات" : "إحصائيات الخريطة"}
            </button>
          ))}
        </div>

        {tab === "challenges" && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">{challengesTotal} تحدي</span>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs">
                      <th className="text-right py-3 px-4">الرابط</th>
                      <th className="text-right py-3 px-4">المدة</th>
                      <th className="text-right py-3 px-4">التعهد</th>
                      <th className="text-right py-3 px-4">التاريخ</th>
                      <th className="text-right py-3 px-4">التشجيعات</th>
                      <th className="text-right py-3 px-4">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                      : challenges.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-500">لا توجد تحديات</td></tr>
                        : challenges.map((c) => (
                          <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-2 px-4 font-mono text-xs text-blue-400">{c.slug}</td>
                            <td className="py-2 px-4 text-gray-300">{c.duration} يوم</td>
                            <td className="py-2 px-4 text-xs text-gray-400 max-w-40 truncate">{c.pledge || "—"}</td>
                            <td className="py-2 px-4 text-xs text-gray-400">{c.startDate}</td>
                            <td className="py-2 px-4 text-emerald-400 font-medium">{c.encouragements}</td>
                            <td className="py-2 px-4">
                              <button onClick={() => setDeleteChallenge(c.slug)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
                <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, challengesTotal)} من {challengesTotal}</span>
                <button disabled={offset + LIMIT >= challengesTotal} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}

        {tab === "map" && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">{statsTotal} حدث مسجّل</span>
              <button onClick={() => setClearConfirm(true)} className="flex items-center gap-2 bg-red-900/50 hover:bg-red-900 border border-red-800 text-red-400 text-xs px-3 py-2 rounded-lg transition-colors">
                <AlertTriangle className="w-4 h-4" /> مسح كل السجلات
              </button>
            </div>

            {mapData.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-3">أعلى 10 دول نشاطاً</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mapData.slice(0, 10).map((d) => ({ name: d.countryCode, events: d.events }))} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                    <Bar dataKey="events" radius={[6, 6, 0, 0]}>
                      {mapData.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs">
                      <th className="text-right py-3 px-4">نوع الحدث</th>
                      <th className="text-right py-3 px-4">الدولة</th>
                      <th className="text-right py-3 px-4">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? <tr><td colSpan={3} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                      : stats.length === 0 ? <tr><td colSpan={3} className="text-center py-12 text-gray-500">لا توجد سجلات</td></tr>
                        : stats.map((s) => (
                          <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-2 px-4 text-xs text-emerald-400">{s.eventType}</td>
                            <td className="py-2 px-4 text-xs text-gray-300">{s.countryCode || "—"}</td>
                            <td className="py-2 px-4 text-xs text-gray-400">{s.date}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
                <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, statsTotal)} من {statsTotal}</span>
                <button disabled={offset + LIMIT >= statsTotal} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}
      </div>

      {deleteChallenge && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-2 text-sm">حذف التحدي نهائياً؟</p>
            <p className="font-mono text-xs text-gray-400 mb-4">{deleteChallenge}</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteChallenge} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">حذف</button>
              <button onClick={() => setDeleteChallenge(null)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {clearConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-red-900 p-6 w-full max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-white font-semibold">تحذير!</p>
            </div>
            <p className="text-gray-300 text-sm mb-4">سيتم مسح جميع سجلات الخريطة ({statsTotal} سجل) نهائياً. هذا الإجراء لا يمكن التراجع عنه.</p>
            <div className="flex gap-3">
              <button onClick={handleClearStats} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">تأكيد المسح</button>
              <button onClick={() => setClearConfirm(false)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
