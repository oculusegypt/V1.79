import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Users, BookOpen, Repeat2, MessageCircle, Trophy, Heart, TrendingUp, Globe } from "lucide-react";

interface Overview {
  users: { total: number; covenantSigned: number };
  dhikr: { istighfar: number; tasbih: number; sayyid: number; total: number };
  journal: { total: number };
  duas: { community: number; amenTotal: number; secret: number };
  challenges: { total: number };
  hadiGroups: { total: number };
  topCountries: { countryCode: string; events: number }[];
  recentUsers: { sessionId: string; sinCategory: string; covenantSigned: boolean; streakDays: number; createdAt: string }[];
  habitStats: { habitKey: string; habitNameAr?: string; total: number; completed: number; rate: number }[];
  dhikrRooms: { roomType: string; totalCount: number }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString("ar") : value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOverview().then((d) => { setData(d as unknown as Overview); setLoading(false); });
  }, []);

  if (loading) return <AdminLayout title="نظرة عامة"><div className="text-gray-400 text-center py-20">جارٍ التحميل...</div></AdminLayout>;
  if (!data) return null;

  const dhikrChartData = [
    { name: "استغفار", value: data.dhikr.istighfar, color: "#10b981" },
    { name: "تسبيح", value: data.dhikr.tasbih, color: "#6366f1" },
    { name: "سيد الاستغفار", value: data.dhikr.sayyid, color: "#f59e0b" },
  ];

  return (
    <AdminLayout title="نظرة عامة">
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="إجمالي المستخدمين" value={data.users.total} sub={`${data.users.covenantSigned} وقّعوا العهد`} color="bg-emerald-700" />
          <StatCard icon={Repeat2} label="إجمالي الذكر" value={data.dhikr.total} sub="استغفار + تسبيح + سيد" color="bg-indigo-700" />
          <StatCard icon={MessageCircle} label="أدعية المجتمع" value={data.duas.community} sub={`${data.duas.amenTotal.toLocaleString()} آمين`} color="bg-amber-700" />
          <StatCard icon={BookOpen} label="مقاطع اليوميات" value={data.journal.total} color="bg-blue-700" />
          <StatCard icon={Trophy} label="التحديات" value={data.challenges.total} color="bg-purple-700" />
          <StatCard icon={Heart} label="الدعاء السري" value={data.duas.secret} color="bg-rose-700" />
          <StatCard icon={TrendingUp} label="مجموعات هادي" value={data.hadiGroups.total} color="bg-teal-700" />
          <StatCard icon={Globe} label="أحداث الخريطة" value={data.topCountries.reduce((a, c) => a + c.events, 0)} color="bg-orange-700" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Dhikr Chart */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">توزيع الذكر</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dhikrChartData} barSize={40}>
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "#fff" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {dhikrChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Countries */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">أعلى الدول نشاطاً</h3>
            {data.topCountries.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-2">
                {data.topCountries.slice(0, 8).map((c) => (
                  <div key={c.countryCode} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-8 text-center font-mono">{c.countryCode}</span>
                    <div className="flex-1 bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (c.events / data.topCountries[0].events) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-white w-8 text-left">{c.events}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Recent Users */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">آخر المستخدمين</h3>
            <div className="space-y-2">
              {data.recentUsers.map((u) => (
                <div key={u.sessionId} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-xs text-gray-300 font-mono">{u.sessionId.slice(0, 20)}...</p>
                    <p className="text-xs text-gray-500">{u.sinCategory}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.covenantSigned && (
                      <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">وقّع</span>
                    )}
                    <span className="text-xs text-gray-500">{u.streakDays} يوم</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Habit Stats */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">إحصائيات العادات</h3>
            <div className="space-y-2">
              {data.habitStats.slice(0, 8).map((h) => (
                <div key={h.habitKey} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-300">{h.habitNameAr || h.habitKey}</span>
                    <span className="text-gray-500">{h.rate}%</span>
                  </div>
                  <div className="bg-gray-800 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${h.rate}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dhikr Rooms */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <h3 className="text-sm font-semibold text-white mb-4">غرف الذكر المجتمعية</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.dhikrRooms.map((r) => (
              <div key={r.roomType} className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{r.roomType}</p>
                <p className="text-xl font-bold text-emerald-400">{r.totalCount.toLocaleString("ar")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
