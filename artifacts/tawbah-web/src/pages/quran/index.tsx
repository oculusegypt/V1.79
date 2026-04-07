import { Link } from "wouter";
import { StandardHeader } from "@/components/header/StandardHeader";
import { useSettings } from "@/context/SettingsContext";
import QuranRead from "./read";
import QuranListen from "./listen";
import QuranMemorize from "./memorize";
import QuranTafsir from "./tafsir";
import QuranMiracles from "./miracles";
import QuranTajweed from "./tajweed";
import QuranAI from "./ai";
import QuranCards from "./cards";
import QuranChallenges from "./challenges";
import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Headphones, Brain, Sparkles, MessageSquare, Eye, BookMarked, Mic, Lightbulb, Grid3X3 } from "lucide-react";

const sections = [
  {
    id: 'browse',
    title: 'تصفح القرآن',
    description: 'استعرض السور والآيات',
    icon: BookOpen,
    component: QuranRead,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'listen',
    title: 'الاستماع',
    description: 'الاستماع للقرآن الكريم',
    icon: Headphones,
    component: QuranListen,
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'memorize',
    title: 'الحفظ',
    description: 'حفظ ومراجعة القرآن',
    icon: Brain,
    component: QuranMemorize,
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'challenges',
    title: 'التحديات',
    description: 'تحديات قرآنية ممتعة',
    icon: Sparkles,
    component: QuranChallenges,
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'tafsir',
    title: 'التفسير',
    description: 'تفسير الآيات والسور',
    icon: MessageSquare,
    component: QuranTafsir,
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'miracles',
    title: 'الإعجاز العلمي',
    description: 'الإعجاز العلمي في القرآن',
    icon: Eye,
    component: QuranMiracles,
    color: 'from-indigo-500 to-purple-600'
  },
  {
    id: 'tajweed',
    title: 'تجويد',
    description: 'أحكام التجويد والقراءة',
    icon: Mic,
    component: QuranTajweed,
    color: 'from-rose-500 to-pink-600'
  },
  {
    id: 'ai',
    title: 'مساعد القرآن',
    description: 'أسئلة وأجوبة عن القرآن',
    icon: Lightbulb,
    component: QuranAI,
    color: 'from-amber-500 to-yellow-600'
  },
  {
    id: 'cards',
    title: 'بطاقات القرآن',
    description: 'بطاقات تعليمية قرآنية',
    component: QuranCards,
    color: 'from-violet-500 to-purple-600'
  }
];

export default function QuranIndex() {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const { theme } = useSettings();
  const isDark = theme === "dark";

  const bgClass = isDark 
    ? "bg-gradient-to-br from-slate-900 to-slate-800" 
    : "bg-gradient-to-br from-slate-100 to-gray-200";

  if (selectedSection) {
    const section = sections.find(s => s.id === selectedSection);
    if (section) {
      const Component = section.component as unknown as React.ComponentType<{ onBack?: () => void }>;
      return (
        <div className={`min-h-screen ${bgClass}`}>
          <Component onBack={() => setSelectedSection(null)} />
        </div>
      );
    }
  }

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <StandardHeader
        title="القرآن الكريم"
        subtitle="تطبيق شامل للقرآن الكريم وعلومه"
      />
      
      <div className="px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            if (!Icon) return null;
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedSection(section.id)}
                className={`relative overflow-hidden rounded-2xl p-4 text-right transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg bg-gradient-to-br ${section.color} ${isDark ? "" : "saturate-75 brightness-110"}`}
                style={{
                  boxShadow: isDark 
                    ? '0 4px 20px rgba(0,0,0,0.3)'
                    : '0 4px 15px rgba(0,0,0,0.1)',
                }}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <Icon size={24} className="text-white drop-shadow-lg" />
                    <div className="w-2 h-2 bg-white/30 rounded-full" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{section.title}</h3>
                  <p className="text-white/90 text-sm line-clamp-2">{section.description}</p>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-8 -mb-8" />
              </motion.button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 rounded-2xl p-6 shadow-lg"
          style={{ 
            background: isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: isDark ? '#fff' : '#111827' }}>نظرة سريعة</h3>
            <Grid3X3 size={20} style={{ color: isDark ? '#9ca3af' : '#6b7280' }} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: isDark ? '#34d399' : '#059669' }}>114</div>
              <div className="text-sm" style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>سورة</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: isDark ? '#60a5fa' : '#2563eb' }}>6236</div>
              <div className="text-sm" style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>آية</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: isDark ? '#a78bfa' : '#7c3aed' }}>30</div>
              <div className="text-sm" style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>جزء</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
