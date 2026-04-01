import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <div className="text-center flex flex-col items-center">
        <AlertCircle size={48} className="text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-muted-foreground mb-6">
          عذراً، الصفحة التي تبحث عنها غير متوفرة.
        </p>
        <Link 
          href="/" 
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all"
        >
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
