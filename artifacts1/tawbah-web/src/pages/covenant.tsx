import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, HandHeart } from "lucide-react";
import { useAppCreateCovenant } from "@/hooks/use-app-data";
import { recordEvent } from "@/components/live-stats";

function CovenantSeal() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 180, damping: 16 }}
      className="flex flex-col items-center mb-2"
    >
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          boxShadow: "0 8px 32px rgba(5,150,105,0.35), 0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <HandHeart size={34} className="text-white" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-2 flex items-center gap-1.5"
      >
        <div className="h-px w-10 bg-emerald-500/30 rounded" />
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">الميثاق مع الله</span>
        <div className="h-px w-10 bg-emerald-500/30 rounded" />
      </motion.div>
    </motion.div>
  );
}

export default function Covenant() {
  const [, setLocation] = useLocation();
  const createCovenant = useAppCreateCovenant();

  const handleSign = () => {
    createCovenant.mutate({ sinCategory: "other" }, {
      onSuccess: () => {
        recordEvent("covenant");
        setLocation("/day-one");
      },
    });
  };

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : setLocation("/");
  };

  return (
    <div className="flex-1 flex flex-col bg-background" dir="rtl">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        className="flex-1 flex flex-col"
      >
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40">
          <div className="flex items-center h-14 px-2 relative">
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-xl hover:bg-muted/70 active:scale-95 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
            >
              <ArrowRight size={20} />
            </button>
            <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none px-14">
              <div className="flex items-center gap-1.5">
                <HandHeart size={14} className="text-emerald-600 dark:text-emerald-400" />
                <h1 className="font-bold text-base text-foreground">الميثاق مع الله</h1>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">وقّع عهدك الصادق</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 pb-40 pt-4 overflow-y-auto flex flex-col gap-4">
          <CovenantSeal />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl overflow-hidden border border-emerald-400/30 shadow-md"
            style={{ background: "linear-gradient(160deg, rgba(5,150,105,0.08) 0%, rgba(4,120,87,0.04) 100%)" }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-emerald-400/20">
              <div className="h-px flex-1 bg-gradient-to-l from-emerald-400/40 to-transparent" />
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 tracking-widest">نص الميثاق</span>
              <div className="h-px flex-1 bg-gradient-to-r from-emerald-400/40 to-transparent" />
            </div>

            <div className="px-5 py-5 text-center">
              <p className="text-[14.5px] leading-[2.1] text-foreground font-medium" dir="rtl">
                «أُعاهدُ اللهَ تعالى على التوبةِ النصوح،
                <br />
                والإقلاعِ عن الذنوب فوراً،
                <br />
                والندمِ عليها من أعماق قلبي،
                <br />
                والعزمِ الصادق على عدم العودة إليها أبداً.»
              </p>
              <p className="text-[11px] text-muted-foreground mt-3 tracking-wide">بسم الله أبدأ رحلتي</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl px-4 py-4 text-center border border-amber-400/20"
            style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.04) 100%)" }}
          >
            <p className="text-[13px] leading-[2] text-foreground/80 font-medium" dir="rtl">
              ﴿قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا﴾
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-2 tracking-wide">سورة الزمر — الآية ٥٣</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 280, damping: 26, delay: 0.4 }}
          className="fixed inset-x-0 z-[55] px-4 max-w-md mx-auto"
          style={{ bottom: "108px" }}
        >
          <div
            className="p-2.5 rounded-2xl border border-border/60 shadow-2xl"
            style={{
              background: "color-mix(in srgb, var(--background) 88%, transparent)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
            }}
          >
            <motion.button
              onClick={handleSign}
              disabled={createCovenant.isPending}
              whileTap={{ scale: 0.97 }}
              className="w-full h-[50px] rounded-xl font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: "linear-gradient(to left, #059669, #047857)",
                color: "#fff",
              }}
              animate={createCovenant.isPending ? {} : {
                boxShadow: [
                  "0 4px 20px rgba(5,150,105,0.45)",
                  "0 6px 28px rgba(5,150,105,0.65)",
                  "0 4px 20px rgba(5,150,105,0.45)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              {createCovenant.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ توثيق الميثاق...</span>
                </>
              ) : (
                <>
                  <HandHeart size={18} className="text-white" />
                  <span>أُعاهِدُ الله الآن على التوبة النصوح</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
