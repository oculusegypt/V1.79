// ── Three Allahu Akbar (تكبيرات) ───────────────────────────────────────────────
// Plays the takbeer MP3 file. Falls back to speech synthesis or chimes
// if the audio file cannot be decoded.

let _active = false; // prevent overlapping playback
let _audio: HTMLAudioElement | null = null;

// ── Azkar Sabah audio (أذكار الصباح) ──────────────────────────────────────────
let _azkarSabahAudio: HTMLAudioElement | null = null;
let _azkarSabahActive = false;

export function preloadAzkarSabah(): void {
  try {
    if (!_azkarSabahAudio) {
      _azkarSabahAudio = new Audio("/sounds/azkar-sabah.mp3");
      _azkarSabahAudio.preload = "auto";
      _azkarSabahAudio.load();
    }
  } catch { /* ignore */ }
}

export function playAzkarSabah(): void {
  if (_azkarSabahActive) return;
  _azkarSabahActive = true;
  try {
    if (!_azkarSabahAudio) {
      _azkarSabahAudio = new Audio("/sounds/azkar-sabah.mp3");
      _azkarSabahAudio.preload = "auto";
    }
    _azkarSabahAudio.currentTime = 0;
    _azkarSabahAudio.volume = 1;
    _azkarSabahAudio.onended = () => { _azkarSabahActive = false; };
    _azkarSabahAudio.onerror = () => { _azkarSabahActive = false; };
    const p = _azkarSabahAudio.play();
    if (p) p.catch(() => { _azkarSabahActive = false; });
    setTimeout(() => { _azkarSabahActive = false; }, 120_000);
  } catch {
    _azkarSabahActive = false;
  }
}

export function stopAzkarSabah(): void {
  if (_azkarSabahAudio) {
    _azkarSabahAudio.pause();
    _azkarSabahAudio.currentTime = 0;
  }
  _azkarSabahActive = false;
}

// ── Azkar Masaa audio (أذكار المساء) ──────────────────────────────────────────
let _azkarMasaaAudio: HTMLAudioElement | null = null;
let _azkarMasaaActive = false;

export function preloadAzkarMasaa(): void {
  try {
    if (!_azkarMasaaAudio) {
      _azkarMasaaAudio = new Audio("/sounds/azkar-masaa.mp3");
      _azkarMasaaAudio.preload = "auto";
      _azkarMasaaAudio.load();
    }
  } catch { /* ignore */ }
}

export function playAzkarMasaa(): void {
  if (_azkarMasaaActive) return;
  _azkarMasaaActive = true;
  try {
    if (!_azkarMasaaAudio) {
      _azkarMasaaAudio = new Audio("/sounds/azkar-masaa.mp3");
      _azkarMasaaAudio.preload = "auto";
    }
    _azkarMasaaAudio.currentTime = 0;
    _azkarMasaaAudio.volume = 1;
    _azkarMasaaAudio.onended = () => { _azkarMasaaActive = false; };
    _azkarMasaaAudio.onerror = () => { _azkarMasaaActive = false; };
    const p = _azkarMasaaAudio.play();
    if (p) p.catch(() => { _azkarMasaaActive = false; });
    setTimeout(() => { _azkarMasaaActive = false; }, 120_000);
  } catch {
    _azkarMasaaActive = false;
  }
}

export function stopAzkarMasaa(): void {
  if (_azkarMasaaAudio) {
    _azkarMasaaAudio.pause();
    _azkarMasaaAudio.currentTime = 0;
  }
  _azkarMasaaActive = false;
}

// ── Dua Peak audio (for لحظة قمة الإجابة notifications) ───────────────────────
let _duaPeakAudio: HTMLAudioElement | null = null;
let _duaPeakActive = false;

export function preloadDuaPeak(): void {
  try {
    if (!_duaPeakAudio) {
      _duaPeakAudio = new Audio("/dua-peak.mp3");
      _duaPeakAudio.preload = "auto";
      _duaPeakAudio.load();
    }
  } catch { /* ignore */ }
}

export function playDuaPeak(): void {
  if (_duaPeakActive) return;
  _duaPeakActive = true;
  try {
    if (!_duaPeakAudio) {
      _duaPeakAudio = new Audio("/dua-peak.mp3");
      _duaPeakAudio.preload = "auto";
    }
    _duaPeakAudio.currentTime = 0;
    _duaPeakAudio.volume = 1;
    _duaPeakAudio.onended = () => { _duaPeakActive = false; };
    _duaPeakAudio.onerror = () => {
      _duaPeakActive = false;
      playTakbeer();
    };
    const p = _duaPeakAudio.play();
    if (p) p.catch(() => { _duaPeakActive = false; playTakbeer(); });
    setTimeout(() => { _duaPeakActive = false; }, 60_000);
  } catch {
    _duaPeakActive = false;
    playTakbeer();
  }
}

export function stopDuaPeak(): void {
  if (_duaPeakAudio) {
    _duaPeakAudio.pause();
    _duaPeakAudio.currentTime = 0;
  }
  _duaPeakActive = false;
}

// ── Azan audio (for prayer-time notifications) ─────────────────────────────
let _azanAudio: HTMLAudioElement | null = null;
let _azanActive = false;

export function preloadAzan(): void {
  try {
    if (!_azanAudio) {
      _azanAudio = new Audio("/azan.m4a");
      _azanAudio.preload = "auto";
      _azanAudio.load();
    }
  } catch { /* ignore */ }
}

export function playAzan(): void {
  if (_azanActive) return;
  _azanActive = true;
  try {
    if (!_azanAudio) {
      _azanAudio = new Audio("/azan.m4a");
      _azanAudio.preload = "auto";
    }
    _azanAudio.currentTime = 0;
    _azanAudio.volume = 1;
    _azanAudio.onended = () => { _azanActive = false; };
    _azanAudio.onerror = () => {
      _azanActive = false;
      // Fallback to takbeer if azan file fails
      playTakbeer();
    };
    const p = _azanAudio.play();
    if (p) p.catch(() => { _azanActive = false; playTakbeer(); });
    // Safety reset after 3 minutes
    setTimeout(() => { _azanActive = false; }, 180_000);
  } catch {
    _azanActive = false;
    playTakbeer();
  }
}

export function stopAzan(): void {
  if (_azanAudio) {
    _azanAudio.pause();
    _azanAudio.currentTime = 0;
  }
  _azanActive = false;
}

function playChimes(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const chime = (startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(932, startTime);
      osc.frequency.exponentialRampToValueAtTime(659, startTime + 0.22);
      osc.frequency.exponentialRampToValueAtTime(466, startTime + 0.55);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.45, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.3);
      osc.start(startTime);
      osc.stop(startTime + 1.3);
    };

    const t = ctx.currentTime;
    chime(t);
    chime(t + 1.6);
    chime(t + 3.2);
    setTimeout(() => ctx.close().catch(() => {}), 6000);
  } catch {
    // Silent fail
  } finally {
    setTimeout(() => { _active = false; }, 6000);
  }
}

function playMp3(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Reuse existing audio element or create new
      if (!_audio) {
        _audio = new Audio("/takbeer.mp3");
        _audio.preload = "auto";
      }
      _audio.currentTime = 0;
      _audio.volume = 1;
      const onEnd = () => {
        _active = false;
        resolve();
      };
      const onError = () => {
        _active = false;
        reject(new Error("audio error"));
      };
      _audio.onended = onEnd;
      _audio.onerror = onError;
      const play = _audio.play();
      if (play) {
        play.then(resolve).catch(onError);
      }
      // Safety reset
      setTimeout(() => { _active = false; resolve(); }, 15_000);
    } catch (e) {
      reject(e);
    }
  });
}

export function playTakbeer(): void {
  if (_active) return;
  _active = true;

  playMp3().catch(() => {
    // Fallback 1: Speech synthesis
    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      const hasArabic = voices.some((v) => v.lang.startsWith("ar"));
      if (hasArabic || voices.length === 0) {
        window.speechSynthesis.cancel();
        const queue = ["الله أكبر", "الله أكبر", "الله أكبر"];
        let failed = false;
        const next = () => {
          if (failed) return;
          const text = queue.shift();
          if (!text) { _active = false; return; }
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "ar-SA"; u.rate = 0.78; u.pitch = 0.88; u.volume = 1;
          u.onend = () => setTimeout(next, 380);
          u.onerror = () => { failed = true; _active = false; playChimes(); };
          window.speechSynthesis.speak(u);
        };
        next();
        return;
      }
    }
    // Fallback 2: Chimes
    playChimes();
  });
}

/** Preload the MP3 so it's ready for instant playback */
export function preloadTakbeer(): void {
  try {
    if (!_audio) {
      _audio = new Audio("/takbeer.mp3");
      _audio.preload = "auto";
      // Trigger load without playing
      _audio.load();
    }
  } catch {
    // ignore
  }
}
