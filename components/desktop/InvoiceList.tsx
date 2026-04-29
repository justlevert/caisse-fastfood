'use client';

import { InvoiceRecord } from '@/types/invoice.types';

interface InvoiceListProps {
  invoices: InvoiceRecord[];
  selectedId: string | null;
  onSelect: (invoice: InvoiceRecord) => void;
  isLoading: boolean;
}

export default function InvoiceList({
  invoices,
  selectedId,
  onSelect,
  isLoading,
}: InvoiceListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500 mb-4"></div>
        <p className="text-gray-500">Chargement des factures...</p>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-5xl mb-4">📄</div>
        <p className="text-gray-500 text-lg">Aucune facture enregistr&eacute;e</p>
        <p className="text-gray-400 text-sm mt-2">
          Utilisez l&apos;interface mobile pour scanner vos premi&egrave;res factures
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">
          Factures ({invoices.length})
        </h2>
      </div>

      <div className="divide-y divide-gray-100 max-h-[calc(100vh-220px)] overflow-y-auto">
        {invoices.map((invoice) => {
          const isSelected = selectedId === invoice.id;
          const dateFormatted = new Date(invoice.date_facture).toLocaleDateString('fr-FR');

          return (
            <button
              key={invoice.id}
              onClick={() => onSelect(invoice)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${
                    isSelected ? 'text-blue-700' : 'text-gray-800'
                  }`}>
                    {invoice.fournisseur}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {dateFormatted}
                    </span>
                    {invoice.numero_facture && (
                      <span className="text-xs text-gray-400">
                        N°{invoice.numero_facture}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">
                    {invoice.montant_ttc.toFixed(2)} €
                  </p>
                  {invoice.categorie && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {invoice.categorie}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
