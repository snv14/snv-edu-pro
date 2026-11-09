import React from 'react';

interface Props { children: React.ReactNode }
interface State { hasError: boolean; message: string }

/** يمنع انهيار الواجهة بالكامل (شاشة بيضاء) عند خطأ غير متوقع في أي مكوّن */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div dir="rtl" role="alert" className="min-h-screen flex items-center justify-center p-6 bg-[#eef4f3]">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-right space-y-3">
          <h1 className="font-black text-lg text-gray-900">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            أعد تحميل الصفحة أو حاول المتابعة. قد تضيع التغييرات التي لم تُحفظ بعد، وإن تكرر الخطأ فأبلغ عن الرسالة أدناه.
          </p>
          <pre className="text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-auto max-h-32 text-left" dir="ltr">{this.state.message}</pre>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-teal-700 text-white text-sm font-bold cursor-pointer">إعادة التحميل</button>
            <button type="button" onClick={() => this.setState({ hasError: false, message: '' })} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 text-sm font-bold cursor-pointer">محاولة المتابعة</button>
          </div>
        </div>
      </div>
    );
  }
}
