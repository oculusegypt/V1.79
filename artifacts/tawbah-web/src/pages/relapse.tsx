import { useState } from "react";
import { Link } from "wouter";
import { useLocation } from "wouter";
import { RefreshCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { getSessionId } from "@/lib/session";
import { getApiBase, apiUrl } from "@/lib/api-base";
import { getAuthHeader } from "@/lib/auth-client";

export default function Relapse() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestartJourney = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sessionId = getSessionId();
      
      // Call API to reset journey and increment relapse count
      const res = await fetch(apiUrl("/api/journey30/relapse"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ sessionId }),
      });
      
      if (!res.ok) {
        // If API fails, still allow going to covenant
        console.error("Failed to reset journey:", await res.text());
      }
      
      // Navigate to covenant to start fresh
      setLocation("/covenant");
    } catch (err) {
      console.error("Error resetting journey:", err);
      // Still allow going to covenant even if there's an error
      setLocation("/covenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="ضعفت وعدت؟" subtitle="لا تيأس — التوبة باب مفتوح" icon={<RefreshCcw size={16} />} />
      <div className="flex-1 flex flex-col bg-background p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1"
      >
        <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6 text-accent">
          <RefreshCcw size={32} />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-foreground mb-4">ضعفت وعدت للذنب؟</h1>
        
        <div className="prose prose-sm dark:prose-invert prose-p:leading-loose text-muted-foreground">
          <p className="font-bold text-foreground text-lg">
            أولاً: لا تيأس، فهذا ما يريده الشيطان بالضبط!
          </p>
          <p>
            الشيطان لا يفرح بوقوعك في المعصية بقدر ما يفرح بيأسك من رحمة الله بعدها. الله يعلم ضعفك، ولذلك سمى نفسه "التواب" صيغة مبالغة لأنه يتوب عليك المرة بعد المرة.
          </p>
          
          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl my-6">
            <p className="font-display font-bold text-primary text-lg text-center m-0 leading-loose">
              "إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ وَيُحِبُّ الْمُتَطَهِّرِينَ"
            </p>
          </div>

          <h3 className="text-foreground font-bold text-lg mb-2">خطوات العمل الآن:</h3>
          <ol className="list-decimal list-inside space-y-3 font-medium">
            <li>قم فوراً وتوضأ، فالماء يطفئ نار المعصية.</li>
            <li>صلِّ ركعتين واجعل سجودك طويلاً واعترف بضعفك.</li>
            <li>تصدق ولو بمبلغ يسير (الصدقة تطفئ غضب الرب).</li>
            <li>جدد العهد! نعم، جُدد العهد ولا تخجل من ربك.</li>
          </ol>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}

        <div className="mt-10">
          <button 
            onClick={handleRestartJourney}
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري إعادة تفعيل الرحلة...</span>
              </>
            ) : (
              <>
                <RefreshCcw size={18} />
                <span>إعادة تفعيل الرحلة والبدء من جديد</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
      </div>
    </>
  );
}
