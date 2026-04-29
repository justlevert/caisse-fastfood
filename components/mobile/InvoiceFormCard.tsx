'use client';

import { InvoiceFormData, OCRConfidence } from '@/types/invoice.types';

interface InvoiceFormCardProps {
  formData: InvoiceFormData;
  onChange: (data: InvoiceFormData) => void;
  confidence?: OCRConfidence;
}

export default function InvoiceFormCard({ formData, onChange, confidence }: InvoiceFormCardProps) {
  const getFieldBorderClass = (score: number): string => {
    if (score < 0.3) return 'border-2 border-red-400 bg-red-50';
    if (score < 0.6) return 'border-2 border-orange-400 bg-orange-50';
    if (score >= 0.6) return 'border-2 border-green-400 bg-green-50';
    return 'border border-gray-300 bg-gray-50';
  };

  const getFieldIcon = (score: number): string => {
    if (score < 0.3) return '⚠️';
    if (score < 0.6) return '⚡';
    return '';
  };
  const handleChange = (field: keyof InvoiceFormData, value: string | number) => {
    const updated = { ...formData, [field]: value };
    
    // Calcul automatique de la TVA (20%)
    if (field === 'montantTTC') {
      const ttc = typeof value === 'string' ? parseFloat(value) : value;
      updated.tva = ttc ? parseFloat((ttc * 0.2).toFixed(2)) : 0;
      updated.montantValide = ttc ? parseFloat((ttc - updated.tva).toFixed(2)) : 0;
    }
    
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span className="text-blue-600">📝</span>
        <span>Informations de la facture</span>
      </h3>
      <div className="space-y-3">
        {/* Fournisseur */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Fournisseur {confidence && getFieldIcon(confidence.fournisseur)}
          </label>
          <input
            type="text"
            value={formData.fournisseur}
            onChange={(e) => handleChange('fournisseur', e.target.value)}
            className={`w-full px-3 py-2.5 text-sm rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${confidence ? getFieldBorderClass(confidence.fournisseur) : 'border border-gray-300 bg-gray-50'}`}
            placeholder="Nom du fournisseur"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Date {confidence && getFieldIcon(confidence.date)}
          </label>
          <div className="relative">
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${confidence ? getFieldBorderClass(confidence.date) : 'border border-gray-300 bg-gray-50'}`}
            />
            <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none text-sm">
              📅
            </span>
          </div>
        </div>

        {/* Montant validé */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Montant HT
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.montantValide || ''}
              readOnly
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-medium"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none text-sm font-semibold">
              €
            </span>
          </div>
        </div>

        {/* Montant TTC */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Montant TTC {confidence && getFieldIcon(confidence.montant)}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.montantTTC || ''}
              onChange={(e) => handleChange('montantTTC', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2.5 text-sm rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-medium ${confidence ? getFieldBorderClass(confidence.montant) : 'border border-gray-300 bg-gray-50'}`}
              placeholder="0.00"
            />
            <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none text-sm font-semibold">
              €
            </span>
          </div>
        </div>

        {/* TVA */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            TVA (20%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.tva || ''}
              readOnly
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-medium"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-2.5 text-gray-400 pointer-events-none text-sm font-semibold">
              €
            </span>
          </div>
        </div>

        {/* Numéro de facture */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            N° Facture {confidence && getFieldIcon(confidence.numero)}
          </label>
          <input
            type="text"
            value={formData.numeroFacture}
            onChange={(e) => handleChange('numeroFacture', e.target.value)}
            className={`w-full px-3 py-2.5 text-sm rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${confidence ? getFieldBorderClass(confidence.numero) : 'border border-gray-300 bg-gray-50'}`}
            placeholder="2022-5678"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
            Catégorie
          </label>
          <select
            value={formData.categorie}
            onChange={(e) => handleChange('categorie', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none bg-gray-50 appearance-none transition-all"
          >
            <option value="">Sélectionner...</option>
            <option value="Fournitures">Fournitures</option>
            <option value="Services">Services</option>
            <option value="Alimentation">Alimentation</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>
    </div>
  );
}
