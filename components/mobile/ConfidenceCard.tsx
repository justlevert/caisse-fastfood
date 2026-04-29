'use client';

import { OCRConfidence } from '@/types/invoice.types';

interface ConfidenceCardProps {
  scores: OCRConfidence;
}

export default function ConfidenceCard({ scores }: ConfidenceCardProps) {
  const getIcon = (score: number) => {
    if (score >= 0.7) return '✓';
    if (score >= 0.4) return '⚠️';
    return '✗';
  };

  const getColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-orange-500';
    return 'text-red-500';
  };

  const getBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-green-50';
    if (score >= 0.4) return 'bg-orange-50';
    return 'bg-red-50';
  };

  const fields = [
    { label: 'Fournisseur', score: scores.fournisseur },
    { label: 'Date', score: scores.date },
    { label: 'Montant', score: scores.montant },
    { label: 'TVA', score: scores.tva },
    { label: 'N° facture', score: scores.numero },
    { label: 'Adresse', score: scores.adresse },
  ];

  // Score moyen global
  const avgScore = fields.reduce((sum, f) => sum + f.score, 0) / fields.length;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <span className="text-blue-600">🎯</span>
          <span>Confiance IA</span>
        </h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getBgColor(avgScore)} ${getColor(avgScore)}`}>
          {Math.round(avgScore * 100)}%
        </span>
      </div>
      
      <div className="space-y-1.5">
        {fields.map((field, index) => (
          <div
            key={field.label}
            className={`flex items-center justify-between py-1.5 ${
              index < fields.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-xs ${getColor(field.score)}`}>
                {getIcon(field.score)}
              </span>
              <span className="text-xs font-medium text-gray-700">
                {field.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    field.score >= 0.7 ? 'bg-green-500' :
                    field.score >= 0.4 ? 'bg-orange-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.round(field.score * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold w-7 text-right ${getColor(field.score)}`}>
                {Math.round(field.score * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
