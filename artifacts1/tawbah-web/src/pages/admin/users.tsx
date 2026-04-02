import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/admin-api";
import { Search, Trash2, Edit, Download, X, ChevronLeft, ChevronRight, User } from "lucide-react";

interface UserProgress {
  id: number; sessionId: string; sinCategory: string; covenantSigned: boolean;
  currentPhase: number; streakDays: number; day40Progress: number;
  firstDayTasksCompleted: boolean; lastActiveDate: string | null; createdAt: string;
}

interface UserDetail {
  user: UserProgress;
  habits: unknown[]; dhikr: unknown[]; journal: unknown[];
  hadiGroups: unknown[]; journey: unknown[]; memory: unknown | null;
}

const SIN_LABELS: Record<string, string> = {
  zina: "الزنا", porn: "الإباحية", riba: "الربا", gossip: "الغيبة",
  drugs: "المخدرات", alcohol: "الكحول", other: "أخرى",
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProgress[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [covenant, setCovenant] = useState("");
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [editUser, setEditUser] = useState<UserProgress | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: LIMIT, offset };
    if (search) params.search = search;
    if (covenant) params.covenant = covenant;
    const res = await adminApi.getUsers(params);
    setUsers(res.users as UserProgress[]);
    setTotal(res.total);
    setLoading(false);
  }, [offset, search, covenant]);

  useEffect(() => { load(); }, [load]);

  async function loadDetail(sessionId: string) {
    const d = await adminApi.getUserDetail(sessionId);
    setDetail(d as unknown as UserDetail);
  }

  async function handleSaveEdit() {
    if (!editUser) return;
    setSaving(true);
    await adminApi.updateUser(editUser.sessionId, {
      streakDays: editUser.streakDays,
      currentPhase: editUser.currentPhase,
      sinCategory: editUser.sinCategory,
      covenantSigned: editUser.covenantSigned,
      day40Progress: editUser.day40Progress,
    });
    setSaving(false);
    setEditUser(null);
    load();
  }

  async function handleDelete(sessionId: string) {
    await adminApi.deleteUser(sessionId);
    setDeleteConfirm(null);
    setDetail(null);
    load();
  }

  return (
    <AdminLayout title="إدارة المستخدمين">
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
              placeholder="ابحث بـ sessionId..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 pr-9 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={covenant} onChange={(e) => { setCovenant(e.target.value); setOffset(0); }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">الكل</option>
            <option value="signed">وقّعوا العهد</option>
            <option value="unsigned">لم يوقعوا</option>
          </select>
          <button onClick={() => adminApi.exportUsers()} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors">
            <Download className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>
          <span className="text-sm text-gray-400">{total} مستخدم</span>
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs">
                  <th className="text-right py-3 px-4">المعرّف</th>
                  <th className="text-right py-3 px-4">الذنب</th>
                  <th className="text-right py-3 px-4">العهد</th>
                  <th className="text-right py-3 px-4">الأيام</th>
                  <th className="text-right py-3 px-4">المرحلة</th>
                  <th className="text-right py-3 px-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">جارٍ التحميل...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-500">لا توجد نتائج</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-gray-300">{u.sessionId.slice(0, 16)}...</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">
                        {SIN_LABELS[u.sinCategory] || u.sinCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.covenantSigned
                        ? <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">وقّع</span>
                        : <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">لم يوقّع</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-300">{u.streakDays}</td>
                    <td className="py-3 px-4 text-gray-300">{u.currentPhase}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => loadDetail(u.sessionId)} className="text-blue-400 hover:text-blue-300"><User className="w-4 h-4" /></button>
                        <button onClick={() => setEditUser({ ...u })} className="text-amber-400 hover:text-amber-300"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(u.sessionId)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" /> السابق
            </button>
            <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} من {total}</span>
            <button
              disabled={offset + LIMIT >= total}
              onClick={() => setOffset(offset + LIMIT)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-40"
            >
              التالي <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detail && (
        <Modal title="تفاصيل المستخدم" onClose={() => setDetail(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["المعرّف", detail.user.sessionId],
                ["الذنب", SIN_LABELS[detail.user.sinCategory] || detail.user.sinCategory],
                ["العهد", detail.user.covenantSigned ? "وقّع ✓" : "لم يوقّع"],
                ["المرحلة", String(detail.user.currentPhase)],
                ["الأيام المتتالية", String(detail.user.streakDays)],
                ["تقدم 40 يوم", String(detail.user.day40Progress)],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-500 mb-1">{k}</p>
                  <p className="text-white font-mono break-all">{v}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-gray-500">العادات</p>
                <p className="text-2xl font-bold text-white">{(detail.habits as unknown[]).length}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-gray-500">اليوميات</p>
                <p className="text-2xl font-bold text-white">{(detail.journal as unknown[]).length}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-gray-500">مجموعات هادي</p>
                <p className="text-2xl font-bold text-white">{(detail.hadiGroups as unknown[]).length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDetail(null); setEditUser({ ...detail.user }); }}
                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white text-sm py-2 rounded-lg">تعديل</button>
              <button onClick={() => setDeleteConfirm(detail.user.sessionId)}
                className="flex-1 bg-red-900 hover:bg-red-800 text-white text-sm py-2 rounded-lg">حذف الحساب</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && (
        <Modal title="تعديل المستخدم" onClose={() => setEditUser(null)}>
          <div className="space-y-3">
            {[
              { label: "الأيام المتتالية", field: "streakDays", type: "number" },
              { label: "المرحلة الحالية", field: "currentPhase", type: "number" },
              { label: "تقدم 40 يوم", field: "day40Progress", type: "number" },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                <input
                  type={type}
                  value={(editUser as unknown as Record<string, unknown>)[field] as number}
                  onChange={(e) => setEditUser({ ...editUser, [field]: Number(e.target.value) })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">فئة الذنب</label>
              <select
                value={editUser.sinCategory}
                onChange={(e) => setEditUser({ ...editUser, sinCategory: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white"
              >
                {Object.entries(SIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="cov" checked={editUser.covenantSigned}
                onChange={(e) => setEditUser({ ...editUser, covenantSigned: e.target.checked })}
                className="w-4 h-4" />
              <label htmlFor="cov" className="text-sm text-gray-300">وقّع العهد</label>
            </div>
            <button onClick={handleSaveEdit} disabled={saving}
              className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-700 text-white text-sm py-2.5 rounded-lg mt-2">
              {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="تأكيد الحذف" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-300 text-sm mb-4">سيتم حذف المستخدم وجميع بياناته نهائياً. هل أنت متأكد؟</p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm py-2.5 rounded-lg">تأكيد الحذف</button>
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm py-2.5 rounded-lg">إلغاء</button>
          </div>
        </Modal>
      )}
    </AdminLayout>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
