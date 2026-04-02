import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, ChevronLeft, ChevronRight } from "lucide-react";

interface CommunityDua { id: number; sessionId: string; content: string; amenCount: number; createdAt: string }
interface SecretDua { id: number; fromSessionId: string; toSessionId: string | null; content: string; isRead: boolean; createdAt: string }

export default function DuasPage() {
  const [tab, setTab] = useState<"community" | "secret">("community");
  const [communityDuas, setCommunityDuas] = useState<CommunityDua[]>([]);
  const [communityTotal, setCommunityTotal] = useState(0);
  const [amenTotal, setAmenTotal] = useState(0);
  const [secretDuas, setSecretDuas] = useState<SecretDua[]>([]);
  const [secretTotal, setSecretTotal] = useState(0);
  const [secretUnread, setSecretUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; type: "community" | "secret" } | null>(null);
  const LIMIT = 30;

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "community") {
      const res = await adminApi.getCommunityDuas({ limit: LIMIT, offset });
      setCommunityDuas(res.duas as CommunityDua[]);
      setCommunityTotal(res.total);
      setAmenTotal(res.amenTotal);
    } else {
      const res = await adminApi.getSecretDuas({ limit: LIMIT, offset });
      setSecretDuas(res.duas as SecretDua[]);
      setSecretTotal(res.total);
      setSecretUnread(res.unread);
    }
    setLoading(false);
  }, [tab, offset]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "community") await adminApi.deleteCommunityDua(deleteConfirm.id);
    else await adminApi.deleteSecretDua(deleteConfirm.id);
    setDeleteConfirm(null);
    load();
  }

  return (
    <AdminLayout title="إدارة الأدعية">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">أدعية المجتمع</p>
            <p className="text-2xl font-bold text-amber-400">{communityTotal}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">إجمالي الأمينات</p>
            <p className="text-2xl font-bold text-emerald-400">{amenTotal.toLocaleString("ar")}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">الدعاء السري</p>
            <p className="text-2xl font-bold text-blue-400">{secretTotal}</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 text-center">
            <p className="text-xs text-gray-400 mb-1">غير مقروء</p>
            <p className="text-2xl font-bold text-red-400">{secretUnread}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800 w-fit">
          {(["community", "secret"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setOffset(0); }}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${tab === t ? "bg-emerald-700 text-white" : "text-gray-400 hover:text-white"}`}>
              {t === "community" ? "قل آمين" : "الدعاء السري"}
            </button>
          ))}
        </div>

        {tab === "community" && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="text-right py-3 px-4">المعرّف</th>
                    <th className="text-right py-3 px-4">الدعاء</th>
                    <th className="text-right py-3 px-4">آمين</th>
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={5} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                    : communityDuas.map((d) => (
                      <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 px-4 font-mono text-xs text-gray-400">{d.sessionId.slice(0, 14)}...</td>
                        <td className="py-2 px-4 text-xs text-gray-300 max-w-56 truncate">{d.content}</td>
                        <td className="py-2 px-4 text-amber-400 font-bold">{d.amenCount.toLocaleString()}</td>
                        <td className="py-2 px-4 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("ar")}</td>
                        <td className="py-2 px-4">
                          <button onClick={() => setDeleteConfirm({ id: d.id, type: "community" })} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
              <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, communityTotal)} من {communityTotal}</span>
              <button disabled={offset + LIMIT >= communityTotal} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {tab === "secret" && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="text-right py-3 px-4">المُرسِل</th>
                    <th className="text-right py-3 px-4">المُستقبِل</th>
                    <th className="text-right py-3 px-4">الدعاء</th>
                    <th className="text-right py-3 px-4">مقروء</th>
                    <th className="text-right py-3 px-4">التاريخ</th>
                    <th className="text-right py-3 px-4">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                    : secretDuas.map((d) => (
                      <tr key={d.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 px-4 font-mono text-xs text-gray-400">{d.fromSessionId.slice(0, 12)}...</td>
                        <td className="py-2 px-4 font-mono text-xs text-gray-400">{d.toSessionId ? d.toSessionId.slice(0, 12) + "..." : "—"}</td>
                        <td className="py-2 px-4 text-xs text-gray-300 max-w-40 truncate">{d.content}</td>
                        <td className="py-2 px-4">
                          {d.isRead
                            ? <span className="text-xs text-emerald-400">مقروء ✓</span>
                            : <span className="text-xs text-red-400">غير مقروء</span>}
                        </td>
                        <td className="py-2 px-4 text-xs text-gray-400">{new Date(d.createdAt).toLocaleDateString("ar")}</td>
                        <td className="py-2 px-4">
                          <button onClick={() => setDeleteConfirm({ id: d.id, type: "secret" })} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - LIMIT))} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight className="w-4 h-4" /> السابق</button>
              <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, secretTotal)} من {secretTotal}</span>
              <button disabled={offset + LIMIT >= secretTotal} onClick={() => setOffset(offset + LIMIT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40">التالي <ChevronLeft className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-4 text-sm">حذف هذا الدعاء نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">حذف</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
