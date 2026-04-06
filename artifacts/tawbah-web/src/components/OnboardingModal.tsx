import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useLocation } from "wouter";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "مرحباً بك في رحلة التوبة",
    description: "مساعدك الروحي الذكي سيكون معك في كل خطوة",
    icon: "🤲",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "zakiy",
    title: "تعرف على الزكي",
    description: "تحدث مع مساعدك الروحي في أي وقت. سيفهم حالتك ويوجهك للطريقة الصحيحة",
    icon: "🧑‍💻",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "habits",
    title: "بناء العادات",
    description: "اختر العادات الروحية التي تناسبك وتتبعها يومياً",
    icon: "📿",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "emergency",
    title: "لحظات القوة",
    description: "عندما تشعر بالضعف، اضغط زر SOS وسيكون هناك من يساعدك",
    icon: "🆘",
    color: "from-red-500 to-rose-600",
  },
];

const ONBOARDING_KEY = "tawbah_onboarding_complete";

interface OnboardingModalProps {
  onComplete?: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed) {
      setIsVisible(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-sm bg-background rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Progress bar */}
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="p-8 flex flex-col items-center text-center">
            {/* Icon */}
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center text-5xl mb-6 shadow-lg`}
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              key={`title-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-xl font-bold text-foreground mb-3"
            >
              {step.title}
            </motion.h2>

            {/* Description */}
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Step indicator */}
            <div className="flex gap-2 mt-8">
              {ONBOARDING_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              لاحقاً
            </button>
            
            <div className="flex-1" />
            
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="السابق"
              >
                <ChevronRight size={20} />
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>
                  <Check size={18} />
                  ابدأ الآن
                </>
              ) : (
                <>
                  التالي
                  <ChevronLeft size={18} />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}

export function isOnboardingComplete(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}
