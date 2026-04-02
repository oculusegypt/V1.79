import { useState } from "react";
import { Link, useLocation } from "wouter";
import { clearToken } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CheckSquare, Repeat2, BookOpen,
  Heart, Brain, ListTodo, Map, MessageCircle, Lock,
  Trophy, Globe, LogOut, Menu, X, ChevronLeft
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/habits", label: "العادات والمهام", icon: CheckSquare },
  { href: "/admin/dhikr", label: "الذكر والغرف", icon: Repeat2 },
  { href: "/admin/journal", label: "اليوميات", icon: BookOpen },
  { href: "/admin/kaffarah", label: "الكفارة", icon: Heart },
  { href: "/admin/zakiy", label: "ذاكرة زكي", icon: Brain },
  { href: "/admin/hadi-tasks", label: "مهام هادي", icon: ListTodo },
  { href: "/admin/journey30", label: "رحلة 30 يوم", icon: Map },
  { href: "/admin/duas", label: "الأدعية", icon: MessageCircle },
  { href: "/admin/challenges", label: "التحديات والخريطة", icon: Trophy },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();

  function handleLogout() {
    clearToken();
    navigate("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex" dir="rtl">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-full w-64 bg-gray-900 border-l border-gray-800 z-30 flex flex-col transition-transform duration-300",
          "lg:translate-x-0 lg:static lg:flex",
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">لوحة التحكم</p>
                <p className="text-xs text-gray-400">دليل التوبة النصوح</p>
              </div>
            </div>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-0">
        {/* Top bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold text-white">{title}</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>العودة للتطبيق</span>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === href || location.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-emerald-700/30 text-emerald-400 font-medium border border-emerald-700/40"
          : "text-gray-400 hover:text-white hover:bg-gray-800"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
