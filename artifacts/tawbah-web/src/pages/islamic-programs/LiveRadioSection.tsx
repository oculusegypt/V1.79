import { motion } from "framer-motion";
import { Radio, ChevronLeft } from "lucide-react";
import type { RadioStation } from "./types";
import { LIVE_QURAN_RADIOS } from "./data";

const CARD_W = 118;
const CARD_H = 86;
const GAP = 10;
const FEATURED_W = 148;
const FEATURED_H = CARD_H * 2 + GAP;

export function LiveRadioSection({
  isDark,
  activeId,
  playing,
  onToggle,
}: {
  isDark: boolean;
  activeId: string | null;
  playing: boolean;
  onToggle: (station: RadioStation) => void;
}) {
  const featuredRadio = LIVE_QURAN_RADIOS[0];
  const restRadios = LIVE_QURAN_RADIOS.slice(1);

  return (
    <div className="mb-7">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Radio size={16} className="text-primary" />
        <h3 className="font-bold text-[15px]">إذاعات القرآن الكريم بث مباشر</h3>
        <span className="text-[11px] text-muted-foreground mr-auto">{LIVE_QURAN_RADIOS.length} إذاعة</span>
        <ChevronLeft size={14} className="text-muted-foreground" />
      </div>

      <div className="flex overflow-x-auto pb-2 scrollbar-hide" style={{ gap: GAP, direction: "rtl" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="shrink-0"
        >
          <button
            onClick={() => onToggle(featuredRadio)}
            className="relative rounded-2xl overflow-hidden flex flex-col justify-end shrink-0 active:scale-95 transition-transform"
            style={{
              width: FEATURED_W,
              height: FEATURED_H,
              background: featuredRadio.logo 
                ? `linear-gradient(160deg, ${featuredRadio.color || '#065f46'}cc, ${featuredRadio.colorTo || '#047857'}cc), url(${featuredRadio.logo})`
                : `linear-gradient(160deg, ${featuredRadio.color || '#065f46'}, ${featuredRadio.colorTo || '#047857'})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div className="absolute top-[-25px] right-[-25px] w-[100px] h-[100px] rounded-full opacity-15 bg-white" />
            <div className="absolute bottom-[-20px] left-[-20px] w-[80px] h-[80px] rounded-full opacity-10 bg-white" />
            {activeId === featuredRadio.id && playing && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.9)", color: "#fff" }}>
                يُشغَّل الآن
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-[70px]" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }} />
            <div className="relative z-10 p-3 text-right">
              <p className="text-white font-bold text-[13px] leading-tight">{featuredRadio.name}</p>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full w-fit" style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}>
                <Radio size={9} fill="white" />
                <span>البطاقة الكبرى</span>
              </div>
            </div>
          </button>
        </motion.div>

        <div
          className="grid shrink-0"
          style={{
            gridTemplateRows: `repeat(2, ${CARD_H}px)`,
            gridAutoFlow: "column",
            gridAutoColumns: `${CARD_W}px`,
            gap: GAP,
          }}
        >
          {restRadios.map((s, i) => {
            const isActive = activeId === s.id;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
              >
                <button
                  onClick={() => onToggle(s)}
                  className="relative rounded-xl overflow-hidden flex flex-col justify-end active:scale-95 transition-transform"
                  style={{
                    width: CARD_W,
                    height: CARD_H,
                    background: s.logo
                      ? `linear-gradient(135deg, ${s.color || '#1e3a5f'}dd, ${s.colorTo || '#1e40af'}dd), url(${s.logo})`
                      : isActive 
                        ? `linear-gradient(135deg, ${s.color || '#1e40af'}, ${s.colorTo || '#3b82f6'})`
                        : `linear-gradient(135deg, ${s.color || '#1e3a5f'}, ${s.colorTo || '#1e40af'})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute top-[-12px] right-[-12px] w-[50px] h-[50px] rounded-full opacity-15 bg-white" />
                  {isActive && playing && (
                    <div className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(59,130,246,0.9)", color: "#fff" }}>
                      تشغيل
                    </div>
                  )}
                  <div className="relative z-10 p-2.5 text-right">
                    <p className="text-white font-bold text-[11px] leading-tight line-clamp-2">{s.name}</p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
