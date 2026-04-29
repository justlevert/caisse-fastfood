'use client';

import { useState } from 'react';
import { InvoiceRecord } from '@/types/invoice.types';

interface InvoiceDetailProps {
  invoice: InvoiceRecord;
}

export default function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const [showImage, setShowImage] = useState(false);

  const dateFormatted = new Date(invoice.date_facture).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const createdAt = new Date(invoice.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getConfidenceColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getConfidenceBg = (score: number | undefined) => {
    if (!score) return 'bg-gray-100';
    if (score >= 0.7) return 'bg-green-50';
    if (score >= 0.4) return 'bg-orange-50';
    return 'bg-red-50';
  };

  return (
    <div className="space-y-4">
      {/* Header détail */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {invoice.fournisseur}
            </h2>
            {invoice.adresse && (
              <p className="text-sm text-gray-500 mt-1">{invoice.adresse}</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
              Saisie le {createdAt}
            </p>
          </div>
          {invoice.image_url && (
            <button
              onClick={() => setShowImage(true)}
              className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex-shrink-0"
            >
              🔍 Voir l&apos;image
            </button>
          )}
        </div>
      </div>

      {/* Montants */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-base font-bold text-gray-800 mb-4">Montants</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-xs text-blue-600 font-medium mb-1">Montant TTC</p>
            <p className="text-2xl font-bold text-blue-700">
              {invoice.montant_ttc.toFixed(2)} €
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 font-medium mb-1">Montant HT</p>
            <p className="text-2xl font-bold text-gray-700">
              {invoice.montant_valide ? `${invoice.montant_valide.toFixed(2)} €` : '-'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-xs text-gray-600 font-medium mb-1">TVA</p>
            <p className="text-2xl font-bold text-gray-700">
              {invoice.tva ? `${invoice.tva.toFixed(2)} €` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-base font-bold text-gray-800 mb-4">Informations</h3>
        <div className="space-y-3">
          <InfoRow label="Date facture" value={dateFormatted} />
          <InfoRow label="N° facture" value={invoice.numero_facture || '-'} />
          <InfoRow label="Cat&eacute;gorie" value={invoice.categorie || '-'} />
        </div>
      </div>

      {/* Confiance IA */}
      {(invoice.confidence_fournisseur || invoice.confidence_date) && (
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-base font-bold text-gray-800 mb-4">Confiance IA</h3>
          <div className="flex gap-3">
            {invoice.confidence_fournisseur !== undefined && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getConfidenceBg(invoice.confidence_fournisseur)} ${getConfidenceColor(invoice.confidence_fournisseur)}`}>
                Fournisseur : {Math.round(invoice.confidence_fournisseur * 100)}%
              </span>
            )}
            {invoice.confidence_date !== undefined && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getConfidenceBg(invoice.confidence_date)} ${getConfidenceColor(invoice.confidence_date)}`}>
                Date : {Math.round(invoice.confidence_date * 100)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Modal image */}
      {showImage && invoice.image_url && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-8"
          onClick={() => setShowImage(false)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setShowImage(false)}
              className="absolute -top-12 right-0 text-white text-lg font-bold bg-black bg-opacity-50 rounded-full px-4 py-2 hover:bg-opacity-70"
            >
              ✕ Fermer
            </button>
            <img
              src={invoice.image_url}
              alt="Facture"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}
