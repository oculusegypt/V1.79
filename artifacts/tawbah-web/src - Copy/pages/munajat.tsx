import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Volume2, VolumeX, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";

// ─── Verses ──────────────────────────────────────────────────────────────────

const MUNAJAT_VERSES = [
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "الرعد: ٢٨" },
  { text: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ", ref: "البقرة: ١٨٦" },
  { text: "فَاذْكُرُونِي أَذْكُرْكُمْ", ref: "البقرة: ١٥٢" },
  { text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", ref: "الحديد: ٤" },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ref: "البقرة: ١٥٣" },
  { text: "وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ", ref: "الأعراف: ١٥٦" },
];

const DHIKR_OPTIONS = [
  { text: "سُبْحَانَ اللَّه",   sub: "Subhanallah",    color: "#34d399", glow: "rgba(52,211,153,0.3)" },
  { text: "الْحَمْدُ لِلَّه",  sub: "Alhamdulillah",  color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { text: "اللَّهُ أَكْبَر",    sub: "Allahu Akbar",   color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
  { text: "أَسْتَغْفِرُ اللَّه",sub: "Astaghfirullah", color: "#f472b6", glow: "rgba(244,114,182,0.3)" },
];

// ─── 5 Nature Scenes ──────────────────────────────────────────────────────────

interface NatureScene {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  accent: string;
  particles: "stars" | "rain" | "leaves" | "sand" | "fireflies";
  glows: { color: string; x: number; y: number; w: number; h: number }[];
}

const NATURE_SCENES: NatureScene[] = [
  {
    id: "night-sky",
    name: "سماء الليل",
    emoji: "🌌",
    bg: "linear-gradient(160deg, #04020f 0%, #0c0a1e 40%, #0d0520 100%)",
    accent: "#a78bfa",
    particles: "stars",
    glows: [
      { color: "rgba(139,92,246,0.08)", x: 20, y: 30, w: 50, h: 40 },
      { color: "rgba(59,130,246,0.06)", x: 80, y: 70, w: 40, h: 30 },
    ],
  },
  {
    id: "forest-dawn",
    name: "غابة الفجر",
    emoji: "🌿",
    bg: "linear-gradient(160deg, #020d04 0%, #031a07 40%, #062b0e 100%)",
    accent: "#34d399",
    particles: "fireflies",
    glows: [
      { color: "rgba(52,211,153,0.08)", x: 50, y: 60, w: 80, h: 60 },
      { color: "rgba(251,191,36,0.06)", x: 50, y: 0, w: 60, h: 30 },
    ],
  },
  {
    id: "peaceful-shore",
    name: "شاطئ هادئ",
    emoji: "🌊",
    bg: "linear-gradient(160deg, #020810 0%, #031424 40%, #041c34 100%)",
    accent: "#38bdf8",
    particles: "stars",
    glows: [
      { color: "rgba(56,189,248,0.09)", x: 50, y: 80, w: 100, h: 40 },
      { color: "rgba(14,165,233,0.06)", x: 20, y: 20, w: 50, h: 40 },
    ],
  },
  {
    id: "desert-night",
    name: "صحراء الليل",
    emoji: "🏜️",
    bg: "linear-gradient(160deg, #0d0800 0%, #1a1000 40%, #261800 100%)",
    accent: "#fbbf24",
    particles: "sand",
    glows: [
      { color: "rgba(251,191,36,0.07)", x: 50, y: 20, w: 60, h: 40 },
      { color: "rgba(245,158,11,0.05)", x: 80, y: 70, w: 50, h: 40 },
    ],
  },
  {
    id: "rainy-mountains",
    name: "جبال المطر",
    emoji: "⛰️",
    bg: "linear-gradient(160deg, #040810 0%, #060f1c 40%, #071525 100%)",
    accent: "#93c5fd",
    particles: "rain",
    glows: [
      { color: "rgba(147,197,253,0.07)", x: 50, y: 30, w: 70, h: 50 },
      { color: "rgba(100,116,139,0.06)", x: 20, y: 70, w: 50, h: 40 },
    ],
  },
];

const STARS_DATA = Array.from({ length: 50 }).map((_, i) => ({
  x: (i * 29 + 7) % 100,
  y: (i * 19 + 5) % 100,
  size: i % 4 === 0 ? 2.5 : i % 3 === 0 ? 1.8 : 1.1,
  dur: 2.5 + (i % 6),
  delay: (i * 0.22) % 3.5,
  color: i % 5 === 0 ? "#c4b5fd" : i % 7 === 0 ? "#93c5fd" : "#ffffff",
}));

const FIREFLIES_DATA = Array.from({ length: 18 }).map((_, i) => ({
  x: (i * 37 + 11) % 100,
  y: 30 + ((i * 23 + 7) % 60),
  size: 1.5 + (i % 3) * 0.8,
  dur: 3 + (i % 5),
  delay: (i * 0.4) % 4,
  color: i % 3 === 0 ? "#34d399" : i % 3 === 1 ? "#fbbf24" : "#a3e635",
}));

// ─── Shooting Stars ───────────────────────────────────────────────────────────

interface ShootingStar {
  id: number; x: number; y: number; length: number; angle: number; speed: number; brightness: number;
}

function useShootingStars() {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const spawn = () => {
      const id = Date.now() + Math.random();
      const star: ShootingStar = {
        id, x: 15 + Math.random() * 70, y: 2 + Math.random() * 40,
        length: 60 + Math.random() * 120, angle: 25 + Math.random() * 20,
        speed: 0.9 + Math.random() * 0.8, brightness: 0.6 + Math.random() * 0.4,
      };
      setStars(prev => [...prev, star]);
      setTimeout(() => setStars(prev => prev.filter(s => s.id !== id)), (star.speed + 0.5) * 1000);
      timeoutRef.current = setTimeout(spawn, 2500 + Math.random() * 4500);
    };
    timeoutRef.current = setTimeout(spawn, 800 + Math.random() * 2000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);
  return stars;
}

function ShootingStarEl({ star }: { star: ShootingStar }) {
  const rad = (star.angle * Math.PI) / 180;
  const dist = Math.max(window.innerWidth, 800) * 1.2;
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${star.x}%`, top: `${star.y}%`, width: star.length, height: 1.5,
        borderRadius: 4,
        background: `linear-gradient(to left, rgba(255,255,255,${star.brightness}), rgba(200,200,255,0.4), transparent)`,
        rotate: star.angle, transformOrigin: "right center", filter: "blur(0.6px)", zIndex: 5,
      }}
      initial={{ x: -star.length, y: 0, opacity: 0, scaleX: 0.3 }}
      animate={{ x: Math.cos(rad) * dist, y: Math.sin(rad) * dist, opacity: [0, star.brightness, star.brightness * 0.8, 0], scaleX: [0.3, 1, 1, 1] }}
      transition={{ duration: star.speed, ease: "easeIn", times: [0, 0.06, 0.85, 1] }}
    />
  );
}

// ─── Rain Particles ───────────────────────────────────────────────────────────

function RainParticles() {
  const drops = Array.from({ length: 28 }).map((_, i) => ({
    x: (i * 37) % 100, delay: (i * 0.18) % 2, dur: 0.7 + (i % 5) * 0.12,
  }));
  return (
    <>
      {drops.map((d, i) => (
        <motion.div
          key={i}
          className="absolute w-[1px] rounded-full pointer-events-none"
          style={{
            left: `${d.x}%`, top: 0,
            background: "linear-gradient(180deg, transparent, rgba(147,197,253,0.45), transparent)",
            height: 18,
          }}
          animate={{ y: ["0vh", "105vh"] }}
          transition={{ duration: d.dur, repeat: Infinity, delay: d.delay, ease: "linear" }}
        />
      ))}
    </>
  );
}

// ─── Firefly Particles ────────────────────────────────────────────────────────

function FireflyParticles() {
  return (
    <>
      {FIREFLIES_DATA.map((f, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${f.x}%`, top: `${f.y}%`, width: f.size, height: f.size, background: f.color }}
          animate={{
            opacity: [0.05, 0.8, 0.05],
            x: [0, (i % 2 === 0 ? 10 : -10), 0],
            y: [0, (i % 3 === 0 ? -8 : 6), 0],
          }}
          transition={{ duration: f.dur, repeat: Infinity, delay: f.delay }}
        />
      ))}
    </>
  );
}

// ─── Sand Particles ───────────────────────────────────────────────────────────

function SandParticles() {
  const grains = Array.from({ length: 20 }).map((_, i) => ({
    x: (i * 41) % 100, y: 50 + ((i * 17) % 45),
    size: 1 + (i % 3), delay: (i * 0.3) % 3,
  }));
  return (
    <>
      {grains.map((g, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ left: `${g.x}%`, top: `${g.y}%`, width: g.size, height: g.size, background: "rgba(251,191,36,0.25)" }}
          animate={{ x: [0, 15, 0], opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 4 + g.delay, repeat: Infinity, delay: g.delay, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// ─── Procedural Sound Engine ──────────────────────────────────────────────────

type SoundId =
  | "none" | "rain" | "wind" | "river" | "ocean"
  | "birds" | "nightingale" | "night"
  | "karawan" | "forest-dawn" | "seashore" | "pine-forest"
  | "thunder-rain" | "mountain-stream" | "desert-night" | "rainforest";

interface SoundDef { id: SoundId; label: string; emoji: string; group: "nature" | "birds" | "forest" | "earth"; }

const SOUND_LIST: SoundDef[] = [
  { id: "none",            label: "صامت",          emoji: "🔇", group: "nature"  },
  { id: "rain",            label: "مطر",           emoji: "🌧️", group: "nature"  },
  { id: "wind",            label: "نسيم",          emoji: "🍃", group: "nature"  },
  { id: "river",           label: "نهر",           emoji: "💧", group: "nature"  },
  { id: "ocean",           label: "أمواج",         emoji: "🌊", group: "nature"  },
  { id: "birds",           label: "طيور",          emoji: "🐦", group: "birds"   },
  { id: "nightingale",     label: "بلبل",          emoji: "🎵", group: "birds"   },
  { id: "night",           label: "ليل ساكن",     emoji: "🌙", group: "birds"   },
  { id: "karawan",         label: "كروان",         emoji: "🦅", group: "forest"  },
  { id: "forest-dawn",     label: "غابة الفجر",   emoji: "🌿", group: "forest"  },
  { id: "seashore",        label: "شاطئ",          emoji: "🏖️", group: "forest"  },
  { id: "pine-forest",     label: "صنوبر",         emoji: "🌲", group: "forest"  },
  { id: "thunder-rain",    label: "رعد ومطر",      emoji: "⛈️", group: "earth"   },
  { id: "mountain-stream", label: "نهر جبلي",      emoji: "⛰️", group: "earth"   },
  { id: "desert-night",    label: "صحراء الليل",  emoji: "🏜️", group: "earth"   },
  { id: "rainforest",      label: "غابة استوائية", emoji: "🌴", group: "earth"   },
];

function mkNoise(ctx: AudioContext): AudioBuffer {
  const sz = ctx.sampleRate * 4;
  const buf = ctx.createBuffer(1, sz, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
  for (let i=0;i<sz;i++) {
    const w = Math.random()*2-1;
    b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759;
    b2=0.96900*b2+w*0.1538520; b3=0.86650*b3+w*0.3104856;
    b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;
    d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*0.11;
  }
  return buf;
}

class ProceduralEngine {
  private ctx: AudioContext | null = null;
  private mg: GainNode | null = null;
  private cleanups: Array<() => void> = [];
  private vol = 0.5;

  private boot(): { ctx: AudioContext; mg: GainNode } {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.mg = this.ctx.createGain();
      this.mg.gain.value = this.vol;
      this.mg.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return { ctx: this.ctx, mg: this.mg! };
  }

  setVol(v: number) {
    this.vol = v;
    if (this.mg && this.ctx) this.mg.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08);
  }

  private noise(ctx: AudioContext, mg: GainNode, cfg: {
    filterType?: BiquadFilterType; freq?: number; Q?: number;
    gain?: number; lfoFreq?: number; lfoDepth?: number;
  }): () => void {
    const buf = mkNoise(ctx);
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = cfg.filterType ?? "lowpass";
    f.frequency.value = cfg.freq ?? 400; f.Q.value = cfg.Q ?? 0.5;
    const g = ctx.createGain(); g.gain.value = cfg.gain ?? 0.3;
    src.connect(f); f.connect(g); g.connect(mg);
    const stoppers: Array<() => void> = [];
    if (cfg.lfoFreq) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = cfg.lfoFreq;
      const lg = ctx.createGain(); lg.gain.value = cfg.lfoDepth ?? 100;
      lfo.connect(lg); lg.connect(f.frequency); lfo.start();
      stoppers.push(() => { try { lfo.stop(); } catch {} });
    }
    src.start();
    return () => { try { src.stop(); } catch {} stoppers.forEach(fn => fn()); g.disconnect(); };
  }

  private birds(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const chirp = (t: number, freq: number, dur: number, vol: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 1.6, t + dur * 0.4);
      o.frequency.exponentialRampToValueAtTime(freq * 0.85, t + dur);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + dur + 0.02);
    };
    const schedule = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const d = Math.random() * 1.5;
        const f = 700 + Math.random() * 1400;
        const reps = 2 + Math.floor(Math.random() * 5);
        for (let j = 0; j < reps; j++) chirp(now + d + j * (0.08 + Math.random() * 0.06), f + j * 40, 0.07 + Math.random() * 0.06, 0.055);
      }
      setTimeout(schedule, 1800 + Math.random() * 3500);
    };
    schedule();
    return () => { alive = false; };
  }

  private nightingale(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const SEQS = [
      [1100, 1300, 1000, 1200, 900, 1100],
      [1300, 1100, 1500, 1200, 1400],
      [900, 1100, 1300, 1000, 1200, 800],
    ];
    const sing = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const seq = SEQS[Math.floor(Math.random() * SEQS.length)]!;
      let t = now + Math.random() * 0.5;
      seq.forEach((freq) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const vib = ctx.createOscillator(); const vg = ctx.createGain();
        vib.frequency.value = 5 + Math.random() * 3; vg.gain.value = freq * 0.025;
        vib.connect(vg); vg.connect(o.frequency);
        o.type = "sine"; o.frequency.value = freq;
        const dur = 0.09 + Math.random() * 0.06;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.065, t + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(mg); o.start(t); vib.start(t);
        o.stop(t + dur + 0.02); vib.stop(t + dur + 0.02);
        t += dur + 0.04 + Math.random() * 0.04;
      });
      setTimeout(sing, 2000 + Math.random() * 4000);
    };
    sing();
    return () => { alive = false; };
  }

  private night(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    const cricket = (t: number, baseFreq: number) => {
      const reps = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < reps; i++) {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "square"; o.frequency.value = baseFreq + Math.random() * 200;
        const on = t + i * 0.04;
        g.gain.setValueAtTime(0, on); g.gain.linearRampToValueAtTime(0.018, on + 0.005);
        g.gain.linearRampToValueAtTime(0, on + 0.035);
        o.connect(g); g.connect(mg); o.start(on); o.stop(on + 0.04);
      }
    };
    const schedule = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const n = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < n; i++) cricket(now + Math.random() * 1.5, 3500 + Math.random() * 1000);
      setTimeout(schedule, 800 + Math.random() * 1200);
    };
    schedule();
    return () => { alive = false; };
  }

  // ── صوت الكروان ─ طائر الكروان المصري ذو الصوت الحزين المميز ──────────────
  private karawan(ctx: AudioContext, mg: GainNode): () => void {
    let alive = true;
    // الكروان يغني بمقاطع نزولية حزينة ومميزة
    const PHRASES = [
      [900, 820, 780, 720, 680, 640, 600],
      [1000, 900, 850, 780, 720, 660],
      [850, 800, 750, 700, 650, 600, 560],
    ];
    const sing = () => {
      if (!alive) return;
      const now = ctx.currentTime;
      const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)]!;
      let t = now + 0.5 + Math.random() * 1;
      phrase.forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        // الكروان يستخدم صوتاً مزيجاً بين sine و triangle
        o.type = i % 2 === 0 ? "sine" : "triangle";
        o.frequency.setValueAtTime(freq, t);
        // تذبذب طفيف يعطي الطابع الحيواني
        const vib = ctx.createOscillator(); const vg = ctx.createGain();
        vib.frequency.value = 4 + Math.random() * 2; vg.gain.value = freq * 0.018;
        vib.connect(vg); vg.connect(o.frequency);
        const dur = 0.18 + Math.random() * 0.12;
        const vol = i === 0 ? 0.07 : 0.055 - i * 0.004;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(mg); o.start(t); vib.start(t);
        o.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
        t += dur + 0.08 + Math.random() * 0.06;
      });
      // الكروان يكرر صوته بعد توقف
      setTimeout(sing, 5000 + Math.random() * 6000);
    };
    sing();
    return () => { alive = false; };
  }

  // ── غابة الفجر ─ طيور مبكرة مع هواء الفجر الهادئ ───────────────────────
  private forestDawn(ctx: AudioContext, mg: GainNode): () => void {
    // نسيم خفيف في الغابة
    const breeze = this.noise(ctx, mg, { filterType: "bandpass", freq: 280, Q: 0.6, gain: 0.10, lfoFreq: 0.08, lfoDepth: 80 });
    let alive = true;
    // طيور الفجر المتعددة في نفس الوقت
    const dawnBird = (baseFreq: number, vol: number) => {
      const chirp = (t: number) => {
        if (!alive) return;
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(baseFreq + Math.random() * 200, t);
        o.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, t + 0.08);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g); g.connect(mg); o.start(t); o.stop(t + 0.22);
        const reps = 2 + Math.floor(Math.random() * 4);
        for (let j = 1; j <= reps; j++) {
          const t2 = t + j * (0.1 + Math.random() * 0.08);
          const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
          o2.type = "sine"; o2.frequency.value = baseFreq + Math.random() * 150;
          g2.gain.setValueAtTime(0, t2); g2.gain.linearRampToValueAtTime(vol * 0.8, t2 + 0.01);
          g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.14);
          o2.connect(g2); g2.connect(mg); o2.start(t2); o2.stop(t2 + 0.18);
        }
        setTimeout(() => chirp(ctx.currentTime), 3000 + Math.random() * 5000);
      };
      setTimeout(() => chirp(ctx.currentTime), Math.random() * 2000);
    };
    dawnBird(800, 0.05); dawnBird(1100, 0.04); dawnBird(1400, 0.035);
    return () => { alive = false; breeze(); };
  }

  // ── شاطئ هادئ ─ أمواج مع نوارس بعيدة ────────────────────────────────────
  private seashore(ctx: AudioContext, mg: GainNode): () => void {
    // أمواج البحر
    const waves = this.noise(ctx, mg, { filterType: "lowpass", freq: 450, Q: 0.4, gain: 0.25, lfoFreq: 0.12, lfoDepth: 200 });
    let alive = true;
    // صوت النوارس البعيدة
    const seagull = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(600 + Math.random() * 200, t);
      o.frequency.exponentialRampToValueAtTime(900 + Math.random() * 200, t + 0.15);
      o.frequency.exponentialRampToValueAtTime(500, t + 0.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + 0.55);
      setTimeout(seagull, 6000 + Math.random() * 10000);
    };
    setTimeout(seagull, 2000);
    return () => { alive = false; waves(); };
  }

  // ── صنوبر ─ نسيم عبر أشجار الصنوبر ──────────────────────────────────────
  private pineForest(ctx: AudioContext, mg: GainNode): () => void {
    const wind1 = this.noise(ctx, mg, { filterType: "bandpass", freq: 350, Q: 0.8, gain: 0.15, lfoFreq: 0.06, lfoDepth: 120 });
    const wind2 = this.noise(ctx, mg, { filterType: "highpass", freq: 2000, Q: 0.3, gain: 0.04, lfoFreq: 0.11, lfoDepth: 500 });
    return () => { wind1(); wind2(); };
  }

  // ── رعد ومطر ─ عاصفة ماطرة مع رعد بعيد ──────────────────────────────────
  private thunderRain(ctx: AudioContext, mg: GainNode): () => void {
    const rain = this.noise(ctx, mg, { filterType: "lowpass", freq: 500, Q: 0.3, gain: 0.28 });
    let alive = true;
    const thunder = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      // هدير الرعد البعيد عبر نبضات noise
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 40 + Math.random() * 20;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 80;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.1);
      g.gain.linearRampToValueAtTime(0.06, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(f); f.connect(g); g.connect(mg); o.start(t); o.stop(t + 2);
      setTimeout(thunder, 8000 + Math.random() * 15000);
    };
    setTimeout(thunder, 3000);
    return () => { alive = false; rain(); };
  }

  // ── نهر جبلي ─ مياه جارية بسرعة مع ضفادع ────────────────────────────────
  private mountainStream(ctx: AudioContext, mg: GainNode): () => void {
    const fast = this.noise(ctx, mg, { filterType: "bandpass", freq: 800, Q: 1.5, gain: 0.22 });
    const deep = this.noise(ctx, mg, { filterType: "lowpass", freq: 300, gain: 0.12 });
    let alive = true;
    // صوت الضفادع
    const frog = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 200 + Math.random() * 100;
      const reps = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < reps; i++) {
        const ti = t + i * 0.12;
        g.gain.setValueAtTime(0, ti); g.gain.linearRampToValueAtTime(0.03, ti + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.1);
      }
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + reps * 0.12 + 0.15);
      setTimeout(frog, 4000 + Math.random() * 7000);
    };
    setTimeout(frog, 2000);
    return () => { alive = false; fast(); deep(); };
  }

  // ── صحراء الليل ─ سكون مع هواء خفيف ────────────────────────────────────
  private desertNight(ctx: AudioContext, mg: GainNode): () => void {
    // هواء الليل الخفيف جداً
    const wind = this.noise(ctx, mg, { filterType: "bandpass", freq: 200, Q: 0.4, gain: 0.06, lfoFreq: 0.04, lfoDepth: 60 });
    let alive = true;
    // نداء بومة صحراوية نادر
    const owl = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 180;
      o.frequency.linearRampToValueAtTime(160, t + 0.4);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.08);
      g.gain.setValueAtTime(0.045, t + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(mg); o.start(t); o.stop(t + 0.55);
      setTimeout(owl, 12000 + Math.random() * 18000);
    };
    setTimeout(owl, 4000);
    return () => { alive = false; wind(); };
  }

  // ── غابة استوائية ─ حياة متنوعة وأصوات كثيفة ────────────────────────────
  private rainforest(ctx: AudioContext, mg: GainNode): () => void {
    // مطر خفيف بين الأشجار
    const rain = this.noise(ctx, mg, { filterType: "lowpass", freq: 600, Q: 0.5, gain: 0.12 });
    // أصوات الحشرات المستمرة
    const insects = this.noise(ctx, mg, { filterType: "bandpass", freq: 4000, Q: 2, gain: 0.06 });
    let alive = true;
    // طيور استوائية متنوعة
    const tropicalBird = (baseFreq: number) => {
      const sing = () => {
        if (!alive) return;
        const t = ctx.currentTime;
        const freqs = [baseFreq, baseFreq * 1.2, baseFreq * 0.9, baseFreq * 1.4];
        let ts = t;
        freqs.forEach(f => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = "sine"; o.frequency.value = f;
          const dur = 0.08 + Math.random() * 0.05;
          g.gain.setValueAtTime(0, ts); g.gain.linearRampToValueAtTime(0.04, ts + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, ts + dur);
          o.connect(g); g.connect(mg); o.start(ts); o.stop(ts + dur + 0.02);
          ts += dur + 0.03 + Math.random() * 0.03;
        });
        setTimeout(sing, 2500 + Math.random() * 4000);
      };
      setTimeout(sing, Math.random() * 1500);
    };
    tropicalBird(900); tropicalBird(1300); tropicalBird(1700);
    return () => { alive = false; rain(); insects(); };
  }

  play(id: SoundId) {
    this.stop();
    if (id === "none") return;
    const { ctx, mg } = this.boot();
    let cleanup: (() => void) | null = null;
    switch (id) {
      case "rain":            cleanup = this.noise(ctx, mg, { filterType: "lowpass",  freq: 420, Q: 0.4, gain: 0.32 }); break;
      case "wind":            cleanup = this.noise(ctx, mg, { filterType: "bandpass", freq: 310, Q: 0.9, gain: 0.26, lfoFreq: 0.09, lfoDepth: 130 }); break;
      case "river": {
        const a = this.noise(ctx, mg, { filterType: "bandpass", freq: 600, Q: 1.2, gain: 0.18 });
        const b = this.noise(ctx, mg, { filterType: "lowpass",  freq: 900, gain: 0.12 });
        cleanup = () => { a(); b(); }; break;
      }
      case "ocean":           cleanup = this.noise(ctx, mg, { filterType: "lowpass",  freq: 500, Q: 0.5, gain: 0.28, lfoFreq: 0.11, lfoDepth: 250 }); break;
      case "birds":           cleanup = this.birds(ctx, mg); break;
      case "nightingale":     cleanup = this.nightingale(ctx, mg); break;
      case "night":           cleanup = this.night(ctx, mg); break;
      case "karawan":         cleanup = this.karawan(ctx, mg); break;
      case "forest-dawn":     cleanup = this.forestDawn(ctx, mg); break;
      case "seashore":        cleanup = this.seashore(ctx, mg); break;
      case "pine-forest":     cleanup = this.pineForest(ctx, mg); break;
      case "thunder-rain":    cleanup = this.thunderRain(ctx, mg); break;
      case "mountain-stream": cleanup = this.mountainStream(ctx, mg); break;
      case "desert-night":    cleanup = this.desertNight(ctx, mg); break;
      case "rainforest":      cleanup = this.rainforest(ctx, mg); break;
    }
    if (cleanup) this.cleanups = [cleanup];
  }

  stop() {
    this.cleanups.forEach(fn => { try { fn(); } catch {} });
    this.cleanups = [];
  }
}

const engine = new ProceduralEngine();

// ─── Sound Picker ─────────────────────────────────────────────────────────────

const GROUP_LABELS: Record<string, string> = {
  nature: "🌿 طبيعة",
  birds:  "🐦 طيور",
  forest: "🌲 غابة",
  earth:  "🌍 أرض",
};

function SoundPicker({ active, onSelect, vol, onVol }: {
  active: SoundId; onSelect: (id: SoundId) => void; vol: number; onVol: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const activeDef = SOUND_LIST.find(s => s.id === active)!;
  const groups = ["nature", "birds", "forest", "earth"] as const;

  return (
    <div className="mx-4 mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl transition-all"
        style={{
          background: active !== "none" ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${active !== "none" ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}
      >
        <div className="flex items-center gap-2">
          {active === "none"
            ? <VolumeX size={14} style={{ color: "rgba(255,255,255,0.45)" }} />
            : <Volume2 size={14} style={{ color: "#a78bfa" }} />}
          <span className="text-[11px] font-bold" style={{ color: active !== "none" ? "#c4b5fd" : "rgba(255,255,255,0.5)" }}>
            {active !== "none" ? `${activeDef.emoji} ${activeDef.label} — جارٍ التشغيل` : "الأصوات الطبيعية — اختر صوتاً"}
          </span>
          {active !== "none" && (
            <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa" }}
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }} />
          )}
        </div>
        {open ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
               : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)" }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 px-3 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>

              {/* none button */}
              <button
                onClick={() => { onSelect("none"); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl mb-2 transition-all"
                style={{
                  background: active === "none" ? "rgba(167,139,250,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active === "none" ? "rgba(167,139,250,0.5)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                <span style={{ fontSize: 16 }}>🔇</span>
                <span className="text-[11px] font-bold" style={{ color: active === "none" ? "#c4b5fd" : "rgba(255,255,255,0.45)" }}>صامت</span>
              </button>

              {groups.map(group => {
                const items = SOUND_LIST.filter(s => s.group === group && s.id !== "none");
                return (
                  <div key={group} className="mb-2">
                    <p className="text-[9px] font-bold mb-1.5 px-1" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {GROUP_LABELS[group]}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {items.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { onSelect(s.id); setOpen(false); }}
                          className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all"
                          style={{
                            background: active === s.id
                              ? "linear-gradient(135deg, rgba(167,139,250,0.35) 0%, rgba(139,92,246,0.2) 100%)"
                              : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active === s.id ? "rgba(167,139,250,0.6)" : "rgba(255,255,255,0.07)"}`,
                            boxShadow: active === s.id ? "0 0 12px rgba(167,139,250,0.3)" : "none",
                          }}
                        >
                          <span style={{ fontSize: 16 }}>{s.emoji}</span>
                          <span className="text-[8.5px] text-center leading-tight"
                            style={{ color: active === s.id ? "#c4b5fd" : "rgba(255,255,255,0.38)" }}>
                            {s.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {active !== "none" && (
                <div className="flex items-center gap-2 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <VolumeX size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                  <input
                    type="range" min={0} max={1} step={0.05} value={vol}
                    onChange={e => onVol(parseFloat(e.target.value))}
                    className="flex-1 h-1" style={{ accentColor: "#a78bfa" }}
                  />
                  <Volume2 size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Scene Switcher ───────────────────────────────────────────────────────────

function SceneSwitcher({ sceneIdx, onPrev, onNext }: { sceneIdx: number; onPrev: () => void; onNext: () => void }) {
  const scene = NATURE_SCENES[sceneIdx]!;
  return (
    <div className="flex items-center justify-between px-4 mb-2 relative z-10">
      <button
        onClick={onPrev}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
      </button>

      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-1.5">
          {NATURE_SCENES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === sceneIdx ? 16 : 5,
                height: 5,
                background: i === sceneIdx ? scene.accent : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <p className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
          {scene.emoji} {scene.name}
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <ChevronLeft size={14} style={{ color: "rgba(255,255,255,0.5)" }} />
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Munajat() {
  const [count, setCount] = useState(0);
  const [activeDhikr, setActiveDhikr] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  const [activeSound, setActiveSound] = useState<SoundId>("none");
  const [volume, setVolume] = useState(0.5);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [sceneIdx, setSceneIdx] = useState(() => {
    // اختيار المشهد تلقائياً حسب الوقت
    const h = new Date().getHours();
    if (h >= 20 || h < 4) return 0;   // ليلاً → سماء الليل
    if (h >= 4  && h < 11) return 1;  // صباحاً → غابة الفجر
    if (h >= 11 && h < 17) return 2;  // نهاراً → شاطئ هادئ
    if (h >= 17 && h < 20) return 3;  // مساءً → صحراء الليل
    return 0;
  });

  const dhikr = DHIKR_OPTIONS[activeDhikr]!;
  const verse = MUNAJAT_VERSES[verseIdx]!;
  const scene = NATURE_SCENES[sceneIdx]!;
  const shootingStars = useShootingStars();

  // Auto-rotate verses
  useEffect(() => {
    const t = setInterval(() => setVerseIdx(i => (i + 1) % MUNAJAT_VERSES.length), 8000);
    return () => clearInterval(t);
  }, []);

  // Auto-rotate scenes every 30 seconds when sound is playing
  useEffect(() => {
    if (activeSound === "none") return;
    const t = setInterval(() => setSceneIdx(i => (i + 1) % NATURE_SCENES.length), 30000);
    return () => clearInterval(t);
  }, [activeSound]);

  useEffect(() => { return () => { engine.stop(); }; }, []);

  const handleSoundSelect = (id: SoundId) => {
    engine.play(id);
    setActiveSound(id);
  };

  const handleVol = (v: number) => { setVolume(v); engine.setVol(v); };

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setCount(c => c + 1);
    if (navigator.vibrate) navigator.vibrate(10);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 800);
  }, []);

  const isNight = new Date().getHours() >= 20 || new Date().getHours() < 4;

  return (
    <div
      className="min-h-screen flex flex-col select-none overflow-hidden"
      style={{ background: scene.bg }}
    >
      {/* Scene background layer */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sceneIdx}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* Scene-specific particles */}
          {scene.particles === "stars" && (
            <>
              {STARS_DATA.map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, background: s.color }}
                  animate={{ opacity: [0.06, 0.5, 0.06] }}
                  transition={{ duration: s.dur, repeat: Infinity, delay: s.delay }}
                />
              ))}
              {/* Shooting stars only for night sky */}
              {sceneIdx === 0 && (
                <AnimatePresence>
                  {shootingStars.map(star => <ShootingStarEl key={star.id} star={star} />)}
                </AnimatePresence>
              )}
            </>
          )}
          {scene.particles === "fireflies" && <FireflyParticles />}
          {scene.particles === "rain" && <RainParticles />}
          {scene.particles === "sand" && <SandParticles />}

          {/* Scene glow orbs */}
          {scene.glows.map((gl, i) => (
            <div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${gl.x - gl.w / 2}%`, top: `${gl.y - gl.h / 2}%`,
                width: `${gl.w}%`, height: `${gl.h}%`,
                background: `radial-gradient(ellipse, ${gl.color} 0%, transparent 70%)`,
                filter: "blur(20px)",
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/">
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
            <ArrowRight size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>
        </Link>
        <div className="text-center">
          <h1 className="font-bold text-base" style={{ color: "rgba(255,255,255,0.9)" }}>وضع المناجاة 🌙</h1>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            {isNight ? "وقت المناجاة — الليل خيرٌ وبركة" : "تواصل مع الله في كل حين"}
          </p>
        </div>
        <div className="w-9 h-9" />
      </div>

      {/* Scene Switcher */}
      <SceneSwitcher
        sceneIdx={sceneIdx}
        onPrev={() => setSceneIdx(i => (i - 1 + NATURE_SCENES.length) % NATURE_SCENES.length)}
        onNext={() => setSceneIdx(i => (i + 1) % NATURE_SCENES.length)}
      />

      {/* Sound picker */}
      <div className="relative z-10">
        <SoundPicker active={activeSound} onSelect={handleSoundSelect} vol={volume} onVol={handleVol} />
      </div>

      {/* Verse */}
      <div className="relative z-10 px-5 mb-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={verseIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5 }}
            className="py-3 px-4 rounded-2xl text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="leading-loose mb-1"
              style={{ fontFamily: "'Amiri Quran', serif", fontSize: 15, color: "rgba(255,255,255,0.9)" }}>
              ﴿{verse.text}﴾
            </p>
            <p style={{ fontSize: 10, color: "rgba(200,180,255,0.45)" }}>{verse.ref}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main dhikr tap area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-4 px-4">

        {/* Tap circle */}
        <motion.button
          onClick={handleTap}
          className="relative overflow-hidden w-[158px] h-[158px] rounded-full flex flex-col items-center justify-center gap-2"
          style={{
            background: `radial-gradient(circle, ${dhikr.glow} 0%, rgba(0,0,0,0) 70%)`,
            border: `2px solid ${dhikr.color}44`,
            boxShadow: `0 0 40px ${dhikr.glow}, 0 0 80px ${dhikr.glow}40`,
          }}
          whileTap={{ scale: 0.92 }}
        >
          {ripples.map(r => (
            <motion.div
              key={r.id}
              className="absolute rounded-full pointer-events-none"
              style={{ left: r.x, top: r.y, x: "-50%", y: "-50%", background: `${dhikr.color}30` }}
              initial={{ width: 0, height: 0, opacity: 1 }}
              animate={{ width: 320, height: 320, opacity: 0 }}
              transition={{ duration: 0.75, ease: "easeOut" }}
            />
          ))}
          <motion.p
            key={count}
            initial={{ scale: 1.3, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="relative font-bold tabular-nums leading-none"
            style={{ fontSize: 38, color: dhikr.color }}
          >
            {count}
          </motion.p>
          <p className="relative text-[13px] font-bold leading-snug text-center px-4"
            style={{ color: "rgba(255,255,255,0.82)", fontFamily: "'Amiri Quran', serif" }}>
            {dhikr.text}
          </p>
          <p className="relative text-[10px]" style={{ color: `${dhikr.color}80` }}>{dhikr.sub}</p>
        </motion.button>

        {/* Milestones */}
        <div className="flex gap-3">
          {[33, 66, 99].map(n => (
            <div
              key={n}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
              style={{
                background: count >= n ? `${dhikr.color}25` : "rgba(255,255,255,0.05)",
                border: `1px solid ${count >= n ? dhikr.color + "55" : "rgba(255,255,255,0.09)"}`,
                color: count >= n ? dhikr.color : "rgba(255,255,255,0.2)",
                boxShadow: count >= n ? `0 0 10px ${dhikr.color}30` : "none",
              }}
            >
              {count >= n ? "✓" : n}
            </div>
          ))}
        </div>

        {count > 0 && (
          <button onClick={() => setCount(0)}
            className="text-[11px] px-4 py-1.5 rounded-full transition-all"
            style={{ color: "rgba(255,255,255,0.3)", border: "1px solid rgba(255,255,255,0.08)" }}>
            إعادة العدّ
          </button>
        )}

        {/* Dhikr switcher */}
        <div className="flex gap-2 flex-wrap justify-center w-full">
          {DHIKR_OPTIONS.map((d, i) => (
            <button
              key={i}
              onClick={() => { setActiveDhikr(i); setCount(0); }}
              className="px-3 py-2 rounded-[14px] text-[11px] font-bold transition-all"
              style={{
                background: activeDhikr === i ? `${d.color}22` : "rgba(255,255,255,0.05)",
                border: `1px solid ${activeDhikr === i ? d.color + "60" : "rgba(255,255,255,0.09)"}`,
                color: activeDhikr === i ? d.color : "rgba(255,255,255,0.4)",
              }}
            >
              {d.text}
            </button>
          ))}
        </div>
      </div>

      <div className="h-8 relative z-10" />
    </div>
  );
}
