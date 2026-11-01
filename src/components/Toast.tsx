import { useState, useEffect } from 'react';
import { Star, CheckCircle } from 'lucide-react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

let nextId = 0;
let listeners: Array<() => void> = [];
let toasts: Toast[] = [];

function emit() {
  listeners.forEach(fn => fn());
}

export function showToast(message: string, type: 'success' | 'info' = 'info') {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  }, 3000);
}

export default function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const sync = () => setItems([...toasts]);
    listeners.push(sync);
    return () => {
      listeners = listeners.filter(fn => fn !== sync);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="toast-container">
      {items.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Star className="w-4 h-4" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
