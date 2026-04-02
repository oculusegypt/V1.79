import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";

interface DhikrRecord { id: number; sessionId: string; date: string; istighfar: number; tasbih: number; sayyid: number }
interface DhikrRoom { id: number; roomType: string; totalCount: number; updatedAt: string }
interface Totals { istighfar: string; tasbih: string; sayyid: string }

export default function DhikrPage() {
  const [tab, setTab] = useState<"personal" | "rooms">("personal");
  const [records, setRecords] = useState<DhikrRecord[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [rooms, setRooms] = useState<DhikrRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [editRoom, setEditRoom] = useState<DhikrRoom | null>(null);
  const [newCount, setNewCount] = useState(0);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "personal") {
      const res = await adminApi.getDhikrPersonal({ limit: LIMIT, offset });
      setRecords(res.records as DhikrRecord[]);
      setTotalCount(res.total);
      setTotals(res.totals as Totals);
    } else {
      const r = await adminApi.getDhikrRooms();
      setRooms(r as DhikrRoom[]);
    }
    setLoading(false);
  }, [tab, offset]);

  useEffect(() => { load(); }, [load]);

  async function handleRoomUpdate() {
    if (!editRoom) return;
    await adminApi.updateDhikrRoom(editRoom.roomType, newCount);
    setEditRoom(null);
    load();
  }

  const totalDhikr = [Number(totals?.istighfar ?? 0), Number(totals?.tasbih ?? 0), Number(totals?.sayyid ?? 0)].reduce((a, b) => a + b, 0);

  return (
    <AdminLayout title="إدارة الذكر">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit">
          {(["personal", "rooms"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setOffset(0); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-emerald-700 text-white" : "text-gray-400 hover:text-white"}`}>
              {t === "personal" ? "الذكر الشخصي" : "الغرف المجتمعية"}
            </button>
          ))}
        </div>

        {tab === "personal" && (
          <>
            {/* Total stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "الإجمالي الكلي", value: totalDhikr, color: "text-emerald-400" },
                { label: "الاستغفار", value: Number(totals?.istighfar ?? 0), color: "text-blue-400" },
                { label: "التسبيح", value: Number(totals?.tasbih ?? 0), color: "text-purple-400" },
                { label: "سيد الاستغفار", value: Number(totals?.sayyid ?? 0), color: "text-amber-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString("ar")}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs">
                      <th className="text-right py-3 px-4">المعرّف</th>
                      <th className="text-right py-3 px-4">التاريخ</th>
                      <th className="text-right py-3 px-4">استغفار</th>
                      <th className="text-right py-3 px-4">تسبيح</th>
                      <th className="text-right py-3 px-4">سيد</th>
                      <th className="text-right py-3 px-4">المجموع</th>
                      <th className="text-right py-3 px-4">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                    ) : records.map((r) => (
                      <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 px-4 font-mono text-xs text-gray-400">{r.sessionId.slice(0, 14)}...</td>
                        <td className="py-2 px-4 text-xs text-gray-400">{r.date}</td>
                        <td className="py-2 px-4 text-blue-400 font-medium">{r.istighfar.toLocaleString()}</td>
                        <td className="py-2 px-4 text-purple-400 font-medium">{r.tasbih.toLocaleString()}</td>
                        <td className="py-2 px-4 text-amber-400 font-medium">{r.sayyid.toLocaleString()}</td>
                        <td className="py-2 px-4 text-white font-bold">{(r.istighfar + r.tasbih + r.sayyid).toLocaleString()}</td>
                        <td className="py-2 px-4">
                          <button onClick={async () => { await adminApi.deleteDhikrPersonal(r.id); load(); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
                <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
                <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, totalCount)} من {totalCount}</span>
                <button disabled={offset + LIMIT >= totalCount} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
              </div>
            </div>
          </>
        )}

        {tab === "rooms" && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? <p className="text-gray-500 text-sm">جارٍ التحميل...</p> :
              rooms.map((r) => (
                <div key={r.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white">{r.roomType}</h3>
                    <button onClick={() => { setEditRoom(r); setNewCount(r.totalCount); }} className="text-amber-400 hover:text-amber-300"><Edit className="w-4 h-4" /></button>
                  </div>
                  <p className="text-3xl font-bold text-emerald-400 mb-1">{r.totalCount.toLocaleString("ar")}</p>
                  <p className="text-xs text-gray-500">آخر تحديث: {new Date(r.updatedAt).toLocaleDateString("ar")}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {editRoom && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <h3 className="font-semibold text-white mb-4">تعديل غرفة: {editRoom.roomType}</h3>
            <input type="number" value={newCount} onChange={(e) => setNewCount(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white mb-4" />
            <div className="flex gap-3">
              <button onClick={handleRoomUpdate} className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm py-2 rounded-lg">حفظ</button>
              <button onClick={() => setEditRoom(null)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
