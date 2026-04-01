import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, Eye, X, Save } from "lucide-react";

interface ZakiyMemory { id: number; sessionId: string; memoryJson: string; updatedAt: string }

export default function ZakiyPage() {
  const [memories, setMemories] = useState<ZakiyMemory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMemory, setViewMemory] = useState<ZakiyMemory | null>(null);
  const [editJson, setEditJson] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await adminApi.getZakiyMemory();
    setMemories(res.memories as ZakiyMemory[]);
    setTotal(res.total);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openView(m: ZakiyMemory) {
    setViewMemory(m);
    try { setEditJson(JSON.stringify(JSON.parse(m.memoryJson), null, 2)); }
    catch { setEditJson(m.memoryJson); }
    setEditError("");
  }

  async function handleSave() {
    if (!viewMemory) return;
    try {
      JSON.parse(editJson);
    } catch {
      setEditError("JSON غير صحيح");
      return;
    }
    setSaving(true);
    await adminApi.updateZakiyMemory(viewMemory.sessionId, JSON.parse(editJson));
    setSaving(false);
    setViewMemory(null);
    load();
  }

  async function handleDelete(sessionId: string) {
    await adminApi.deleteZakiyMemory(sessionId);
    setDeleteConfirm(null);
    setViewMemory(null);
    load();
  }

  function renderMemoryPreview(jsonStr: string) {
    try {
      const data = JSON.parse(jsonStr);
      return (
        <div className="space-y-2 text-xs">
          {data.traits && <div><span className="text-gray-500">السمات:</span> <span className="text-blue-400">{data.traits?.join(", ") || "—"}</span></div>}
          {data.promises && <div><span className="text-gray-500">الوعود:</span> <span className="text-emerald-400">{Array.isArray(data.promises) ? data.promises.length : 0} وعد</span></div>}
          {data.slips && <div><span className="text-gray-500">الانتكاسات:</span> <span className="text-red-400">{Array.isArray(data.slips) ? data.slips.length : 0} انتكاسة</span></div>}
        </div>
      );
    } catch { return <span className="text-gray-500 text-xs">بيانات تالفة</span>; }
  }

  return (
    <AdminLayout title="ذاكرة زكي">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{total} مستخدم لديهم ذاكرة</span>
        </div>

        {loading ? <p className="text-gray-500 text-center py-12">جارٍ التحميل...</p> : (
          <div className="grid md:grid-cols-2 gap-3">
            {memories.map((m) => (
              <div key={m.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-gray-300">{m.sessionId.slice(0, 24)}...</p>
                    <p className="text-xs text-gray-500 mt-0.5">آخر تحديث: {new Date(m.updatedAt).toLocaleDateString("ar")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openView(m)} className="text-blue-400 hover:text-blue-300"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteConfirm(m.sessionId)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {renderMemoryPreview(m.memoryJson)}
              </div>
            ))}
            {memories.length === 0 && <p className="text-gray-500 text-sm col-span-2 text-center py-8">لا توجد ذاكرة مسجّلة</p>}
          </div>
        )}
      </div>

      {/* View + Edit Modal */}
      {viewMemory && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <p className="font-semibold text-white">ذاكرة المستخدم</p>
                <p className="text-xs font-mono text-gray-400">{viewMemory.sessionId}</p>
              </div>
              <button onClick={() => setViewMemory(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <p className="text-xs text-gray-500 mb-2">تعديل JSON مباشرة:</p>
              <textarea
                value={editJson}
                onChange={(e) => { setEditJson(e.target.value); setEditError(""); }}
                className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs text-green-400 font-mono focus:outline-none focus:border-emerald-500 resize-none"
                dir="ltr"
              />
              {editError && <p className="text-red-400 text-xs mt-1">{editError}</p>}
            </div>
            <div className="flex gap-3 p-4 border-t border-gray-800">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 flex-1 bg-emerald-700 hover:bg-emerald-600 text-white text-sm py-2.5 rounded-lg justify-center">
                <Save className="w-4 h-4" /> {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setDeleteConfirm(viewMemory.sessionId)} className="flex-1 bg-red-900 hover:bg-red-800 text-white text-sm py-2.5 rounded-lg">
                مسح الذاكرة
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-4 text-sm">مسح ذاكرة المستخدم نهائياً؟</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2 rounded-lg">تأكيد المسح</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 text-white text-sm py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
