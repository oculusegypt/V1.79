import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VOICE_PROFILES } from "../constants";

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function VoiceSelectorSheet({ selectedId, onSelect, onClose }: Props) {
  const males = VOICE_PROFILES.filter((p) => p.gender === "male");
  const females = VOICE_PROFILES.filter((p) => p.gender === "female");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg,#f7f5ef 0%,#fefefe 100%)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        <div className="px-5 pt-2 pb-3 border-b border-stone-200/70 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-stone-800" style={{ fontFamily: "inherit" }}>
              اختر صوت زكي 🎙️
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">الصوت يُطبَّق على الردود القادمة</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-4 max-h-[70vh] overflow-y-auto">
          {[{ label: "رجالي", profiles: males }, { label: "نسائي", profiles: females }].map(({ label, profiles }) => (
            <div key={label}>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2 px-1">{label}</p>
              <div className="space-y-2">
                {profiles.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => { onSelect(profile.id); onClose(); }}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-right transition-all",
                        isSelected
                          ? "bg-emerald-50 border-2 border-emerald-400"
                          : "bg-white border-2 border-transparent hover:border-stone-200"
                      )}
                      style={{ boxShadow: isSelected ? "0 2px 12px rgba(5,150,105,0.15)" : "0 1px 4px rgba(0,0,0,0.06)" }}
                    >
                      <span className="text-2xl">{profile.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", isSelected ? "text-emerald-700" : "text-stone-800")}>
                            {profile.name}
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                            isSelected
                              ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                              : "bg-stone-100 text-stone-500 border-stone-200"
                          )}>
                            {profile.tag}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-stone-500 mt-0.5 leading-snug">{profile.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="h-4" />
        </div>
      </motion.div>
    </motion.div>
  );
}
