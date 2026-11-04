import { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ToastMessage } from '../types';

export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, 2800);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;
  return <div className="toast show" role="status"><CheckCircle2 size={15} />{toast.message}</div>;
}
