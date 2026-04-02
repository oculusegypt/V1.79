import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

interface HadiGroup { id: number; sessionId: string; title: string; totalItems: number; completedItems: number; createdAt: string }
interface HadiItem { id: number; groupId: number; title: string; completed: boolean; orderIdx: number }

export default function HadiTasksPage() {
  const [groups, setGroups] = useState<HadiGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [groupItems, setGroupItems] = useState<Record<number, HadiItem[]>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.getHadiTasks({ limit: 100 });
    setGroups(res.groups as HadiGroup[]);
    setTotal(res.total);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleGroup(groupId: number) {
    if (expandedGroup === groupId) { setExpandedGroup(null); return; }
    setExpandedGroup(groupId);
    if (!groupItems[groupId]) {
      const items = await adminApi.getHadiTaskItems(groupId);
      setGroupItems((prev) => ({ ...prev, [groupId]: items as HadiItem[] }));
    }
  }

  async function toggleItem(item: HadiItem) {
    await adminApi.updateHadiTaskItem(item.id, { completed: !item.completed });
    const updated = await adminApi.getHadiTaskItems(item.groupId);
    setGroupItems((prev) => ({ ...prev, [item.groupId]: updated as HadiItem[] }));
  }

  async function handleDelete(groupId: number) {
    await adminApi.deleteHadiTaskGroup(groupId);
    setDeleteConfirm(null);
    load();
  }

  return (
    <AdminLayout title="مهام هادي">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{total} مجموعة</span>
        </div>

        {loading ? <p className="text-gray-500 text-center py-12">جارٍ التحميل...</p> : (
          <div className="space-y-3">
            {groups.length === 0 && <p className="text-gray-500 text-center py-8">لا توجد مجموعات مهام</p>}
            {groups.map((g) => (
              <div key={g.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-800/30 transition-colors"
                  onClick={() => toggleGroup(g.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{g.title}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{g.sessionId.slice(0, 20)}...</p>
                  </div>
                  <div className="flex items-center gap-3 mr-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">{g.completedItems}/{g.totalItems}</p>
                      <div className="w-16 bg-gray-700 rounded-full h-1.5 mt-1">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${g.totalItems > 0 ? (g.completedItems / g.totalItems) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(g.id); }} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                    {expandedGroup === g.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {expandedGroup === g.id && (
                  <div className="border-t border-gray-800 p-3 space-y-1.5">
                    {(groupItems[g.id] || []).length === 0
                      ? <p className="text-xs text-gray-500 py-2 text-center">لا توجد مهام</p>
                      : (groupItems[g.id] || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50">
                          <input type="checkbox" checked={item.completed}
                            onChange={() => toggleItem(item)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer" />
                          <span className={`text-sm flex-1 ${item.completed ? "line-through text-gray-500" : "text-gray-300"}`}>{item.title}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white mb-4 text-sm">حذف هذه المجموعة وجميع مهامها نهائياً؟</p>
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
