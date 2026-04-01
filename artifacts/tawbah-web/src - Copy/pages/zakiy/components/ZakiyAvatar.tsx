import { motion } from "framer-motion";

export function ZakiyAvatar({ pulse = false }: { pulse?: boolean }) {
  return (
    <div className="relative flex-shrink-0 mb-0.5">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(5,150,105,0.25) 0%, transparent 70%)",
          transform: "scale(1.5)",
        }}
        animate={pulse ? { opacity: [0.4, 0.9, 0.4], scale: [1.4, 1.7, 1.4] } : { opacity: 0.6 }}
        transition={pulse ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : {}}
      />

      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #065f46 0%, #047857 40%, #0d9488 100%)",
          boxShadow: pulse
            ? "0 0 0 2px rgba(255,255,255,0.9), 0 4px 16px rgba(5,150,105,0.5)"
            : "0 0 0 2px rgba(255,255,255,0.9), 0 3px 12px rgba(5,150,105,0.35)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3Ccircle cx='13' cy='13' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <span
          className="relative z-10 text-white font-bold select-none leading-none"
          style={{
            fontFamily: "'Amiri Quran', 'Scheherazade New', serif",
            fontSize: "20px",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            marginTop: "1px",
          }}
        >
          ز
        </span>
      </div>

      {!pulse && (
        <div
          className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full border-[2px] border-white"
          style={{ background: "#22c55e" }}
        />
      )}

      {pulse && (
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: "rgba(5,150,105,0.6)" }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
