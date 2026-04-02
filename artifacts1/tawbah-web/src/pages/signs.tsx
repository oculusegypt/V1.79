import { motion } from "framer-motion";
import { Heart, Smile, Users, EyeOff, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const SIGNS = [
  {
    icon: Heart,
    title: "رقة القلب وانكساره",
    desc: "تشعر بندم حقيقي وحرقة في قلبك كلما تذكرت الذنب، وتستحي من نظر الله إليك."
  },
  {
    icon: Smile,
    title: "حلاوة الطاعة",
    desc: "تجد لذة وانشراحاً في الصلاة والقرآن لم تكن تجدها وقت المعصية."
  },
  {
    icon: EyeOff,
    title: "استقباح الذنب",
    desc: "تتغير نظرتك للمعصية، فتراها قبيحة ومقززة بعد أن كانت تبدو مغرية."
  },
  {
    icon: Users,
    title: "تغير الصحبة",
    desc: "تنفر من رفقاء السوء ومجالس الغفلة، وتميل لأهل الصلاح والخير."
  },
  {
    icon: ShieldCheck,
    title: "حفظ الجوارح",
    desc: "يصبح عندك حساسية عالية ورقابة ذاتية تمنعك من الاقتراب من حمى الله."
  }
];

export default function Signs() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <PageHeader title="تباشير القبول" subtitle="علامات قبول التوبة" icon={<Heart size={16} />} />
      <div className="p-6">

      <div className="flex-1 flex flex-col gap-4">
        {SIGNS.map((sign, i) => (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-card p-5 rounded-2xl border border-border shadow-sm flex gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <sign.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground mb-1">{sign.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{sign.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
      </div>
    </div>
  );
}
