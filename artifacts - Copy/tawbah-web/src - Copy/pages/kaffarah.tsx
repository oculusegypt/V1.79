import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, AlertTriangle, Info, Plus, X, Scale, ChevronLeft, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAppUserProgress } from "@/hooks/use-app-data";
import { getSessionId } from "@/lib/session";
import { getSelectedSins, type Sin } from "@/lib/sins-data";

type SinCategory = "khilwat" | "mali" | "huquq_nas" | "taqsir_faraid" | "other";
type TabType = "main" | "specific";

interface KaffarahStep {
  key: string;
  title: string;
  desc: string;
  obligatory: boolean;
  order?: string[];
  choiceGroup?: string;
  choiceLabel?: string;
}

interface KaffarahInfo {
  title: string;
  intro: string;
  warning?: string;
  steps: KaffarahStep[];
}

interface SpecificKaffarah {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  steps: KaffarahStep[];
}

const KAFFARAH_DATA: Record<SinCategory, KaffarahInfo> = {
  khilwat: {
    title: "كفارة ذنوب الخلوات والنظر",
    intro: "لا كفارة مالية محددة لهذا النوع، لكن التوبة النصوح تستلزم خطوات عملية وروحية.",
    steps: [
      { key: "khilwat_tawba", title: "التوبة الصادقة", desc: "الندم القلبي الحقيقي والعزم على عدم العودة - وهي شرط قبول أي كفارة.", obligatory: true },
      { key: "khilwat_block", title: "سد الذرائع", desc: "حذف كل ما يُعين على الذنب من تطبيقات وروابط ومتابعات. لا توبة بدون هذه الخطوة.", obligatory: true },
      { key: "khilwat_ghusl", title: "الاغتسال من الجنابة", desc: "إن كان الذنب يستوجب الغسل فليُبادر به فوراً.", obligatory: true },
      { key: "khilwat_salat", title: "صلاة ركعتين للتوبة", desc: "صلِّ ركعتين بنية التوبة، واسجد وابكِ بين يدي الله.", obligatory: true },
      { key: "khilwat_naseeha", title: "مراجعة الاختلاط وتصحيحه", desc: "راجع علاقاتك بالجنس الآخر وأصلح ما يمكن إصلاحه من مواقف غير شرعية.", obligatory: true },
      { key: "khilwat_nikah", title: "التفكير الجاد في الزواج", desc: "إن كانت الشهوة سبب الذنب فالزواج هو الحل الشرعي، استشر أهلك.", obligatory: false },
      { key: "khilwat_sadaqa", title: "الصدقة", desc: "تصدّق بما تيسّر، فالصدقة تطفئ الخطيئة كما يطفئ الماء النار.", obligatory: false },
      { key: "khilwat_sawm", title: "الصيام التطوعي", desc: "صم أياماً تطوعاً، فالصوم يكسر الشهوات ويقوي الإرادة.", obligatory: false },
      { key: "khilwat_quran", title: "ختم أو قراءة القرآن", desc: "أكثر من قراءة القرآن فهو شفاء وتطهير للقلب.", obligatory: false },
    ],
  },
  mali: {
    title: "كفارة الذنب المالي",
    intro: "الكفارة المالية تستلزم رد الحقوق إلى أصحابها، فلا تُقبل التوبة من المظالم المالية إلا بردّها.",
    warning: "تنبيه مهم: لا تُكفَّر الذنوب المالية بالصلاة أو الصيام وحدهما، بل لا بد من رد المال أو التحلل من صاحبه.",
    steps: [
      { key: "mali_tawba", title: "التوبة الصادقة مع الندم", desc: "اندم من أعماق قلبك وعقد العزم الصادق على عدم العودة.", obligatory: true },
      { key: "mali_rad", title: "رد المال إلى صاحبه", desc: "أعد الحقوق المالية كاملة لأصحابها. هذا الركن الأساسي ولا تسقط التوبة بدونه.", obligatory: true },
      { key: "mali_tahallul", title: "طلب التحلل إن تعذّر الرد", desc: "إن تعذّر الرد (مات صاحبه أو جُهل) فتصدّق بالقدر المماثل بنية أن يصل الأجر إليه.", obligatory: true },
      { key: "mali_halal", title: "التزام مصادر الرزق الحلال", desc: "راجع مصادر دخلك كلها واستبعد كل شبهة.", obligatory: true },
      { key: "mali_dawim", title: "التوقف الفوري عن الكسب الحرام", desc: "لا تستمر في مصدر دخل حرام ولو لساعة واحدة بعد التوبة.", obligatory: true },
      { key: "mali_zakat_check", title: "مراجعة الزكاة المتراكمة", desc: "تأكد من إخراج كل الزكوات المتراكمة عن الأموال التي ملكتها.", obligatory: false },
      { key: "mali_sadaqa", title: "الصدقة الزائدة", desc: "تصدّق بما يزيد على المبلغ الأصلي طُهرةً لمالك وقلبك.", obligatory: false },
      { key: "mali_kafara_yamin", title: "كفارة اليمين إن كان ثمة حلف", desc: "إن حلفت يميناً على أمر مالي وحنثت: أطعم عشرة مساكين أو اكسُهم أو صم ثلاثة أيام.", obligatory: false },
    ],
  },
  huquq_nas: {
    title: "كفارة حقوق العباد",
    intro: "حقوق العباد لا تسقط بالتوبة وحدها، بل لا بد من ردّها إلى أصحابها أو استحلالهم.",
    warning: "حذار! قال النبي ﷺ: «من كانت له مظلمة لأخيه من عرضه أو شيء فليتحلله منه اليوم قبل أن لا يكون دينار ولا درهم».",
    steps: [
      { key: "huquq_tawba", title: "التوبة الصادقة", desc: "ابك على ما فرّط في حق إخوانك واعزم عزماً قاطعاً.", obligatory: true },
      { key: "huquq_rad_mal", title: "رد الأموال والحقوق المادية", desc: "أعد كل مال أخذته بغير حق أو بظلم أو غش.", obligatory: true },
      { key: "huquq_ithar", title: "الاعتذار وطلب العفو", desc: "تواصل مع من آذيتهم واعتذر بصدق وتواضع واطلب عفوهم.", obligatory: true },
      { key: "huquq_ghiba", title: "إصلاح ما تكلمت به من غيبة أو نميمة", desc: "إن كنت اغتبت شخصاً فأثنِ عليه في المجالس ذاتها التي ذكرته فيها بسوء.", obligatory: true },
      { key: "huquq_kaff", title: "الكف عن أذى الناس نهائياً", desc: "اعزم عزماً قاطعاً ألا تعود لأذى أحد بأي نوع من الأذى.", obligatory: true },
      { key: "huquq_dua", title: "الدعاء لمن ظلمته", desc: "ادع لمن آذيتهم بالخير في ظهر الغيب، فهذا من أعظم أسباب رد المظالم.", obligatory: false },
      { key: "huquq_ihsan", title: "الإحسان إلى من أسأت إليه", desc: "إن أمكنك اصنع معروفاً لمن آذيته دون أن تُعلمه بالسبب.", obligatory: false },
      { key: "huquq_sadaqa", title: "الصدقة بنية رد الأذى", desc: "تصدّق بنية رفع الحيف عن من أسأت إليهم وإن لم تتمكن من إيصالهم.", obligatory: false },
    ],
  },
  taqsir_faraid: {
    title: "كفارة التقصير في الفرائض",
    intro: "لكل فريضة قضاء وكفارة، والأصل في تارك الفريضة العمد أن يتوب ويقضي.",
    steps: [
      { key: "faraid_tawba", title: "التوبة الصادقة فوراً", desc: "لا تؤخر التوبة لحظة، فالتأخير ذنب على ذنب.", obligatory: true },
      { key: "faraid_salat_qada", title: "قضاء الصلوات الفائتة", desc: "ابدأ فوراً بقضاء الصلوات التي تركتها بترتيب. العلماء يختلفون لكن القضاء أحوط وأبرأ للذمة.", obligatory: true },
      { key: "faraid_sawm_qada", title: "قضاء الصيام الفائت", desc: "اقضِ ما أفطرته من رمضان بغير عذر قبل رمضان القادم.", obligatory: true },
      { key: "faraid_zakat", title: "إخراج الزكاة المتراكمة", desc: "احسب ما فاتك من زكوات وأخرجها كاملة وإن كانت كثيرة.", obligatory: true },
      { key: "faraid_kafara_ramadan", title: "كفارة الإفطار العمد في رمضان", desc: "الترتيب: عتق رقبة، أو صيام شهرين متتابعين، أو إطعام ستين مسكيناً.", obligatory: true, order: ["عتق رقبة", "صيام شهرين متتابعين", "إطعام 60 مسكيناً"] },
      { key: "faraid_muwazaba", title: "المواظبة على الصلوات الخمس في وقتها", desc: "اجعل المواظبة على الصلوات أولويتك الأولى من الآن.", obligatory: true },
      { key: "faraid_nafl", title: "التطوع والنوافل لجبر الفرائض", desc: "أكثر من النوافل، فقد ورد أن النوافل تجبر نقص الفرائض يوم القيامة.", obligatory: false },
      { key: "faraid_ilm", title: "تعلّم أحكام الفرائض", desc: "تعلّم شروط الصلاة والصيام والزكاة لتؤديها على الوجه الصحيح.", obligatory: false },
    ],
  },
  other: {
    title: "كفارة الذنوب الأخرى",
    intro: "الذنوب الواقعة بينك وبين الله لها طريق واحد: التوبة النصوح الصادقة مع الإكثار من الأعمال الصالحة.",
    steps: [
      { key: "other_tawba", title: "أركان التوبة النصوح الثلاثة", desc: "الإقلاع عن الذنب فوراً، الندم القلبي الحقيقي، العزم الصادق على عدم العودة.", obligatory: true },
      { key: "other_salat", title: "صلاة التوبة", desc: "صلِّ ركعتين بخشوع ودموع، وناجِ الله بما في قلبك.", obligatory: true },
      { key: "other_istighfar", title: "الاستغفار الكثير", desc: "قل: «أستغفر الله وأتوب إليه» مئة مرة يومياً على الأقل.", obligatory: true },
      { key: "other_hasanat", title: "اتباع السيئة بالحسنة", desc: "قال تعالى: «إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ» - أكثر من الأعمال الصالحة.", obligatory: false },
      { key: "other_sadaqa", title: "الصدقة", desc: "تصدّق بما تيسّر، فالصدقة تطفئ الخطيئة كما يطفئ الماء النار.", obligatory: false },
      { key: "other_kafara_yamin", title: "كفارة اليمين إن كان ثمة يمين", desc: "أطعم عشرة مساكين أو اكسُهم، فإن لم تستطع فصم ثلاثة أيام.", obligatory: false },
    ],
  },
};

const SPECIFIC_KAFFARAHS: SpecificKaffarah[] = [
  {
    id: "yamin",
    title: "كفارة اليمين",
    subtitle: "حنث في يمين أو قسم",
    icon: "🤝",
    color: "bg-blue-500/10 border-blue-400/30 text-blue-600",
    steps: [
      { key: "yamin_confirm", title: "تأكيد الحنث في اليمين", desc: "تأكد أنك حلفت على شيء ثم فعلت خلافه، فإن كنت مكرهاً أو ناسياً فلا كفارة.", obligatory: true },
      { key: "yamin_itam", title: "إطعام عشرة مساكين", desc: "أطعم عشرة مساكين من أوسط ما تطعم أهلك، لكل مسكين وجبة كاملة (نصف صاع تقريباً).", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الأول" },
      { key: "yamin_kiswa", title: "كسوة عشرة مساكين", desc: "البديل: اكسُ عشرة مساكين، كل واحد ما يصلي فيه كالثوب أو العباءة.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثاني" },
      { key: "yamin_itq", title: "تحرير رقبة", desc: "البديل الثالث لمن يستطيع (نادر في زماننا).", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثالث" },
      { key: "yamin_sawm", title: "صيام ثلاثة أيام", desc: "إن لم تستطع الإطعام ولا الكسوة: صم ثلاثة أيام متتالية أو متفرقة.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الرابع — عند العجز" },
    ],
  },
  {
    id: "dhihar",
    title: "كفارة الظهار",
    subtitle: "قال لزوجته: أنتِ كظهر أمي",
    icon: "🏠",
    color: "bg-purple-500/10 border-purple-400/30 text-purple-600",
    steps: [
      { key: "dhihar_tawba", title: "التوبة الفورية وعدم الإعادة", desc: "الظهار من المنكر والزور، فتب إلى الله فوراً.", obligatory: true },
      { key: "dhihar_itq", title: "تحرير رقبة قبل المسيس", desc: "الكفارة الأولى: تحرير رقبة مؤمنة قبل إتيان الزوجة.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الأول" },
      { key: "dhihar_sawm", title: "صيام شهرين متتابعين", desc: "إن لم يجد الرقبة: صيام شهرين متتابعين قبل المسيس. لا يجوز الفطر إلا لعذر شرعي.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثاني" },
      { key: "dhihar_itam", title: "إطعام ستين مسكيناً", desc: "إن لم يستطع الصيام لمرض مزمن: إطعام ستين مسكيناً.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثالث" },
    ],
  },
  {
    id: "iftar_ramadan",
    title: "كفارة الإفطار العمد في رمضان",
    subtitle: "أكل أو شرب عمداً في نهار رمضان",
    icon: "🌙",
    color: "bg-emerald-500/10 border-emerald-400/30 text-emerald-600",
    steps: [
      { key: "iftar_tawba", title: "التوبة الفورية والإمساك", desc: "أمسك فوراً حتى غروب الشمس ولو كانت الكفارة لم تُنجز بعد.", obligatory: true },
      { key: "iftar_qada", title: "قضاء اليوم", desc: "اقضِ اليوم الذي أفطرت فيه بعد رمضان.", obligatory: true },
      { key: "iftar_itq", title: "تحرير رقبة", desc: "الكفارة الأولى بالترتيب: عتق رقبة مؤمنة.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الأول" },
      { key: "iftar_sawm2", title: "صيام شهرين متتابعين", desc: "إن عجز عن الرقبة: صيام شهرين متتابعين بلا انقطاع.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثاني" },
      { key: "iftar_itam60", title: "إطعام ستين مسكيناً", desc: "إن عجز عن الصيام لمرض مزمن: إطعام ستين مسكيناً.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثالث" },
    ],
  },
  {
    id: "qatl",
    title: "كفارة القتل الخطأ",
    subtitle: "قتل نفساً بغير قصد",
    icon: "⚖️",
    color: "bg-red-500/10 border-red-400/30 text-red-600",
    steps: [
      { key: "qatl_tawba", title: "التوبة الصادقة والحزن", desc: "ابكِ على من قتلته وادعُ له بالرحمة والمغفرة كثيراً.", obligatory: true },
      { key: "qatl_diya", title: "الدية لأهل الضحية", desc: "دية القتل الخطأ تُؤدى إلى أهل المقتول من مال القاتل أو عاقلته.", obligatory: true },
      { key: "qatl_itq", title: "تحرير رقبة مؤمنة", desc: "الكفارة الأولى: عتق رقبة مؤمنة.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الأول" },
      { key: "qatl_sawm2", title: "صيام شهرين متتابعين", desc: "إن عجز عن الرقبة: صيام شهرين متتابعين.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثاني" },
      { key: "qatl_dua", title: "الدعاء المستمر للمقتول", desc: "أكثر من الدعاء للمقتول بالرحمة والمغفرة ما دمت حياً.", obligatory: false },
    ],
  },
  {
    id: "haj_itha",
    title: "كفارة الأذى في الإحرام",
    subtitle: "حلق الشعر أو لبس المخيط أو نحوه",
    icon: "🕋",
    color: "bg-amber-500/10 border-amber-400/30 text-amber-600",
    steps: [
      { key: "haj_tawba", title: "التوبة والاستغفار", desc: "استغفر الله على ما حصل، سواء كان عمداً أو خطأً.", obligatory: true },
      { key: "haj_sawm3", title: "صيام ثلاثة أيام", desc: "الخيار الأول: صيام ثلاثة أيام.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الأول" },
      { key: "haj_itam6", title: "إطعام ستة مساكين", desc: "الخيار الثاني: إطعام ستة مساكين (لكل مسكين نصف صاع).", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثاني" },
      { key: "haj_shaah", title: "ذبح شاة", desc: "الخيار الثالث: نسك (ذبح شاة) وتوزيع لحمها على الفقراء.", obligatory: true, choiceGroup: "choice", choiceLabel: "الخيار الثالث" },
    ],
  },
  {
    id: "ghadr",
    title: "كفارة نقض العهد والغدر",
    subtitle: "نقض عهداً أو وعداً قطعه",
    icon: "📜",
    color: "bg-orange-500/10 border-orange-400/30 text-orange-600",
    steps: [
      { key: "ghadr_tawba", title: "التوبة الصادقة", desc: "الوفاء بالعهد واجب، والغدر من صفات المنافق، فتب إلى الله.", obligatory: true },
      { key: "ghadr_wafa", title: "الوفاء بالعهد إن أمكن", desc: "إن كان بإمكانك الوفاء بما وعدت به فأوفِ به الآن.", obligatory: true },
      { key: "ghadr_ithar", title: "الاعتذار الصادق", desc: "اعتذر لمن أعطيته العهد بصدق وتواضع.", obligatory: true },
      { key: "ghadr_kafara_yamin", title: "كفارة اليمين إن حلفت", desc: "إن كان العهد مصحوباً بيمين بالله فأخرج كفارة يمين.", obligatory: false },
      { key: "ghadr_sadaqa", title: "الصدقة", desc: "تصدّق طلباً لمغفرة الله على ما فرّط.", obligatory: false },
    ],
  },
];

function getUniqueChoiceGroups(steps: KaffarahStep[]): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const s of steps) {
    if (s.choiceGroup && !seen.has(s.choiceGroup)) {
      seen.add(s.choiceGroup);
      groups.push(s.choiceGroup);
    }
  }
  return groups;
}

function computeProgress(
  steps: KaffarahStep[],
  completedSteps: Record<string, boolean>,
  selectedChoices: Record<string, string>,
  compositePrefix: string
) {
  const choiceGroups = getUniqueChoiceGroups(steps);
  const nonChoiceObl = steps.filter(s => s.obligatory && !s.choiceGroup);
  const doneNonChoice = nonChoiceObl.filter(s => completedSteps[`${compositePrefix}${s.key}`]).length;
  let doneGroups = 0;
  for (const g of choiceGroups) {
    const groupKey = `${compositePrefix}${g}`;
    const chosen = selectedChoices[groupKey];
    if (chosen && completedSteps[`${compositePrefix}${chosen}`]) doneGroups++;
  }
  const total = nonChoiceObl.length + choiceGroups.length;
  const done = doneNonChoice + doneGroups;
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

function StepItem({
  step, done, expanded, onToggle, onExpand, colorClass
}: {
  step: KaffarahStep;
  done: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  colorClass: string;
}) {
  return (
    <div className={`bg-card rounded-xl border transition-all ${done ? `${colorClass} bg-opacity-5` : "border-border"}`}>
      <div className="flex items-center gap-3 p-4">
        <button onClick={onToggle} className="shrink-0 w-7 h-7 flex items-center justify-center">
          {done
            ? <CheckCircle2 size={26} className="text-primary" />
            : <Circle size={26} className="text-muted-foreground/40" />
          }
        </button>
        <div className="flex-1 text-right">
          <p className={`font-bold text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
          {step.order && (
            <p className="text-[10px] text-muted-foreground mt-0.5 bg-muted/50 px-1.5 py-0.5 rounded inline-block">
              {step.order[0]}
            </p>
          )}
        </div>
        <button onClick={onExpand} className="shrink-0 text-muted-foreground p-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
            <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChoiceGroupBlock({
  steps,
  groupKey,
  selectedKey,
  onSelect,
  completedSteps,
  compositeKeyOf,
  onToggle,
  expandedStep,
  onExpand,
  colorClass,
}: {
  steps: KaffarahStep[];
  groupKey: string;
  selectedKey: string | undefined;
  onSelect: (groupKey: string, stepKey: string) => void;
  completedSteps: Record<string, boolean>;
  compositeKeyOf: (stepKey: string) => string;
  onToggle: (compositeKey: string) => void;
  expandedStep: string | null;
  onExpand: (compositeKey: string) => void;
  colorClass: string;
}) {
  const [showOptions, setShowOptions] = useState(false);

  if (!selectedKey || showOptions) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <Shuffle size={15} className="text-amber-600 shrink-0" />
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">
            اختر خياراً واحداً فقط — نفّذ ما تستطيع
          </p>
          {selectedKey && (
            <button
              onClick={() => setShowOptions(false)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              إلغاء
            </button>
          )}
        </div>
        <div className="px-3 pb-3 flex flex-col gap-2">
          {steps.map((step) => (
            <button
              key={step.key}
              onClick={() => { onSelect(groupKey, step.key); setShowOptions(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:shadow-sm active:scale-[0.98] ${
                selectedKey === step.key
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border hover:border-primary/30"
              }`}
            >
              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selectedKey === step.key ? "border-primary bg-primary" : "border-muted-foreground/30"
              }`}>
                {selectedKey === step.key && <div className="w-3 h-3 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{step.title}</p>
                {step.choiceLabel && (
                  <p className="text-[10px] text-muted-foreground">{step.choiceLabel}</p>
                )}
              </div>
              <ChevronLeft size={15} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const chosen = steps.find(s => s.key === selectedKey)!;
  const ck = compositeKeyOf(chosen.key);
  const isDone = !!completedSteps[ck];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setShowOptions(true)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          <Shuffle size={11} />
          تغيير الخيار
        </button>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[10px] text-muted-foreground font-medium">
            {chosen.choiceLabel || "الخيار المختار"}
          </span>
        </div>
      </div>
      <StepItem
        step={chosen}
        done={isDone}
        expanded={expandedStep === ck}
        onToggle={() => onToggle(ck)}
        onExpand={() => onExpand(ck)}
        colorClass={colorClass}
      />
    </div>
  );
}

export default function Kaffarah() {
  const { data: progress } = useAppUserProgress();
  const sinCategory = (progress?.sinCategory || "other") as SinCategory;
  const kaffarah = KAFFARAH_DATA[sinCategory];

  const [activeTab, setActiveTab] = useState<TabType>("main");
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpecific, setSelectedSpecific] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [sinsDerivedKaffarahs, setSinsDerivedKaffarahs] = useState<Set<string>>(new Set());
  const [sinsDerivedSins, setSinsDerivedSins] = useState<Sin[]>([]);

  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/kaffarah?sessionId=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: { stepKey: string; completed: boolean }[]) => {
        const map: Record<string, boolean> = {};
        data.forEach((s) => { map[s.stepKey] = s.completed; });
        setCompletedSteps(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const saved = localStorage.getItem("selected_kaffarahs");
    if (saved) setSelectedSpecific(JSON.parse(saved));

    const savedChoices = localStorage.getItem("kaffarah_choice_selections");
    if (savedChoices) setSelectedChoices(JSON.parse(savedChoices));

    const selectedSins = getSelectedSins();
    const kaffarahSins = selectedSins.filter(s => s.kaffarahId);
    if (kaffarahSins.length > 0) {
      setSinsDerivedKaffarahs(new Set(kaffarahSins.map(s => s.kaffarahId!)));
      setSinsDerivedSins(kaffarahSins);
      setActiveTab("specific");
    }
  }, []);

  const toggleStep = async (stepKey: string) => {
    const sessionId = getSessionId();
    const newVal = !completedSteps[stepKey];
    setCompletedSteps((prev) => ({ ...prev, [stepKey]: newVal }));
    await fetch("/api/kaffarah/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, stepKey, completed: newVal }),
    });
  };

  const selectChoice = (groupKey: string, stepKey: string) => {
    const updated = { ...selectedChoices, [groupKey]: stepKey };
    setSelectedChoices(updated);
    localStorage.setItem("kaffarah_choice_selections", JSON.stringify(updated));
  };

  const addSpecific = (id: string) => {
    const updated = [...selectedSpecific, id];
    setSelectedSpecific(updated);
    localStorage.setItem("selected_kaffarahs", JSON.stringify(updated));
    setShowSelector(false);
  };

  const removeSpecific = (id: string) => {
    const updated = selectedSpecific.filter((s) => s !== id);
    setSelectedSpecific(updated);
    localStorage.setItem("selected_kaffarahs", JSON.stringify(updated));
  };

  const obligatorySteps = kaffarah.steps.filter((s) => s.obligatory);
  const recommendedSteps = kaffarah.steps.filter((s) => !s.obligatory);
  const completedObl = obligatorySteps.filter((s) => completedSteps[s.key]).length;
  const progressPct = obligatorySteps.length > 0 ? Math.round((completedObl / obligatorySteps.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-8">
      <PageHeader title="الكفارات الشرعية" subtitle="تتبّع خطوات الكفارة حتى تبرأ الذمة" icon={<Scale size={16} />} />

      <div className="px-5 mb-4">
        <div className="flex gap-2 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("main")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "main" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground"}`}
          >
            كفارة ذنبك الأساسية
          </button>
          <button
            onClick={() => setActiveTab("specific")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "specific" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground"}`}
          >
            كفارات نوعية أخرى
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "main" ? (
          <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 flex flex-col gap-3">
            <div className="mb-2">
              <h2 className="font-bold text-sm mb-1">{kaffarah.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{kaffarah.intro}</p>

              {kaffarah.warning && (
                <div className="mt-2 flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive leading-relaxed">{kaffarah.warning}</p>
                </div>
              )}

              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold">الواجبات المكتملة</span>
                  <span className="text-xs font-bold text-primary">{completedObl}/{obligatorySteps.length}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }} className="h-full bg-primary rounded-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <h3 className="text-xs font-bold text-foreground">الواجبات (لا تسقط)</h3>
            </div>

            {obligatorySteps.map((step, i) => (
              <motion.div key={step.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <StepItem
                  step={step}
                  done={!!completedSteps[step.key]}
                  expanded={expandedStep === step.key}
                  onToggle={() => toggleStep(step.key)}
                  onExpand={() => setExpandedStep(expandedStep === step.key ? null : step.key)}
                  colorClass="border-primary/30"
                />
              </motion.div>
            ))}

            {recommendedSteps.length > 0 && (
              <>
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <h3 className="text-xs font-bold text-foreground">المستحبات (تزيد الأجر)</h3>
                </div>
                {recommendedSteps.map((step, i) => (
                  <motion.div key={step.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (obligatorySteps.length + i) * 0.06 }}>
                    <StepItem
                      step={step}
                      done={!!completedSteps[step.key]}
                      expanded={expandedStep === step.key}
                      onToggle={() => toggleStep(step.key)}
                      onExpand={() => setExpandedStep(expandedStep === step.key ? null : step.key)}
                      colorClass="border-secondary/30"
                    />
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div key="specific" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 flex flex-col gap-4">

            {sinsDerivedSins.length > 0 && (
              <div className="bg-gradient-to-l from-red-500/10 to-orange-500/5 border border-red-400/30 rounded-xl px-4 py-3 flex items-start gap-3">
                <Scale size={15} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">كفارات مشتقة من ذنوبك المختارة</p>
                  <div className="flex flex-wrap gap-1">
                    {sinsDerivedSins.map(s => (
                      <span key={s.id} className="text-[10px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-400/20 px-1.5 py-0.5 rounded-full font-bold">
                        {s.icon} {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                إن كان عليك كفارة نوعية محددة (كحنث في يمين، أو إفطار رمضان، أو غيرها) فأضفها هنا وتتبع خطواتها.
              </p>
            </div>

            {selectedSpecific.length > 0 && (
              <div className="flex flex-col gap-4">
                {selectedSpecific.map((id) => {
                  const kaf = SPECIFIC_KAFFARAHS.find((k) => k.id === id);
                  if (!kaf) return null;

                  const compositePrefix = `${id}_`;
                  const compositeKeyOf = (stepKey: string) => `${compositePrefix}${stepKey}`;
                  const { total, done: doneObl, pct } = computeProgress(
                    kaf.steps, completedSteps, selectedChoices, compositePrefix
                  );

                  const choiceGroups = getUniqueChoiceGroups(kaf.steps);
                  const nonChoiceSteps = kaf.steps.filter(s => !s.choiceGroup);

                  return (
                    <div key={id} className={`bg-card rounded-xl border overflow-hidden ${sinsDerivedKaffarahs.has(id) ? "border-red-400/40 ring-1 ring-red-400/20" : "border-border"}`}>
                      <div className={`flex items-center justify-between p-4 border-b border-border ${kaf.color} bg-opacity-30`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{kaf.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">{kaf.title}</p>
                              {sinsDerivedKaffarahs.has(id) && (
                                <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">من ذنوبك</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">{kaf.subtitle}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">{doneObl}/{total}</span>
                          <button onClick={() => removeSpecific(id)} className="p-1 text-muted-foreground/50 hover:text-destructive transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="px-4 pt-1 pb-0">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden my-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-primary rounded-full" />
                        </div>
                      </div>
                      <div className="px-4 pb-4 flex flex-col gap-2">
                        {nonChoiceSteps.map((step) => {
                          const ck = compositeKeyOf(step.key);
                          if (!step.obligatory) {
                            return null;
                          }
                          return (
                            <StepItem
                              key={ck}
                              step={step}
                              done={!!completedSteps[ck]}
                              expanded={expandedStep === ck}
                              onToggle={() => toggleStep(ck)}
                              onExpand={() => setExpandedStep(expandedStep === ck ? null : ck)}
                              colorClass="border-primary/30"
                            />
                          );
                        })}

                        {choiceGroups.map((group) => {
                          const groupKey = `${compositePrefix}${group}`;
                          const groupSteps = kaf.steps.filter(s => s.choiceGroup === group);
                          return (
                            <ChoiceGroupBlock
                              key={groupKey}
                              steps={groupSteps}
                              groupKey={groupKey}
                              selectedKey={selectedChoices[groupKey]}
                              onSelect={selectChoice}
                              completedSteps={completedSteps}
                              compositeKeyOf={compositeKeyOf}
                              onToggle={toggleStep}
                              expandedStep={expandedStep}
                              onExpand={(ck) => setExpandedStep(expandedStep === ck ? null : ck)}
                              colorClass="border-primary/30"
                            />
                          );
                        })}

                        {nonChoiceSteps.filter(s => !s.obligatory).length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mt-2 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              <span className="text-[10px] font-bold text-muted-foreground">مستحبات</span>
                            </div>
                            {nonChoiceSteps.filter(s => !s.obligatory).map((step) => {
                              const ck = compositeKeyOf(step.key);
                              return (
                                <StepItem
                                  key={ck}
                                  step={step}
                                  done={!!completedSteps[ck]}
                                  expanded={expandedStep === ck}
                                  onToggle={() => toggleStep(ck)}
                                  onExpand={() => setExpandedStep(expandedStep === ck ? null : ck)}
                                  colorClass="border-secondary/30"
                                />
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {showSelector ? (
              <div className="bg-card rounded-xl border border-primary/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-sm">اختر نوع الكفارة</p>
                  <button onClick={() => setShowSelector(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {SPECIFIC_KAFFARAHS.filter(k => !selectedSpecific.includes(k.id)).map((kaf) => (
                    <button
                      key={kaf.id}
                      onClick={() => addSpecific(kaf.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-right transition-all hover:shadow-sm active:scale-[0.98] ${kaf.color}`}
                    >
                      <span className="text-2xl shrink-0">{kaf.icon}</span>
                      <div>
                        <p className="font-bold text-sm">{kaf.title}</p>
                        <p className="text-[11px] text-muted-foreground">{kaf.subtitle}</p>
                      </div>
                    </button>
                  ))}
                  {SPECIFIC_KAFFARAHS.filter(k => !selectedSpecific.includes(k.id)).length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-3">أضفت جميع أنواع الكفارات المتاحة</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSelector(true)}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all"
              >
                <Plus size={18} />
                <span className="font-bold text-sm">إضافة كفارة نوعية</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
