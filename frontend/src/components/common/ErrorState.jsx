import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function ErrorState({
  title = 'Failed to load intelligence data',
  message = 'An unexpected error occurred while communicating with the Hospital Operations backend API.',
  onRetry,
}) {
  return (
    <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-6 my-6 text-center max-w-lg mx-auto shadow-xs">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-rose-900 mb-1">{title}</h3>
      <p className="text-xs text-rose-700 leading-relaxed mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
