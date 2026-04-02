import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          dir="rtl"
          className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 p-8 bg-background text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">حدث خطأ غير متوقع</h2>
            <p className="text-sm text-muted-foreground">
              نعتذر عن الإزعاج. يُرجى العودة للصفحة الرئيسية والمحاولة مرة أخرى.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold active:scale-95 transition-all"
          >
            العودة للرئيسية
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
