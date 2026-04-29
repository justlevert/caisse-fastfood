'use client';

interface InvoiceHeaderProps {
  onBack: () => void;
}

export default function InvoiceHeader({ onBack }: InvoiceHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
      <div className="px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/90 hover:text-white font-semibold text-sm transition-colors"
        >
          <span className="text-lg">←</span>
          <span>Retour</span>
        </button>
        <h1 className="text-lg font-bold">Vérification</h1>
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <span className="text-lg">📄</span>
        </div>
      </div>
    </div>
  );
}
