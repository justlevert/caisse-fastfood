'use client';

interface InvoiceActionsProps {
  onRetake: () => void;
  onValidate: () => void;
  isLoading: boolean;
}

export default function InvoiceActions({
  onRetake,
  onValidate,
  isLoading,
}: InvoiceActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={onRetake}
        disabled={isLoading}
        className="py-2.5 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-bold text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <span>🔄</span>
        <span>Reprendre</span>
      </button>

      <button
        type="button"
        onClick={onValidate}
        disabled={isLoading}
        className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Envoi...</span>
          </>
        ) : (
          <>
            <span>✓</span>
            <span>Valider</span>
          </>
        )}
      </button>
    </div>
  );
}
