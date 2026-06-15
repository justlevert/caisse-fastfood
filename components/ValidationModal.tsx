'use client';

import React, { useState, useMemo } from 'react';
import { CartItem } from '@/types/database.types';
import { useOptimisticOrder } from '@/lib/hooks/useOptimisticOrder';
import { useCurrency } from '@/lib/utils/currency';
import { supabase } from '@/lib/supabase';

interface ValidationModalProps {
  mode: 'sur_place' | 'a_emporter';
  total: number;
  cart: CartItem[];
  onClose: () => void;
  onConfirm: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

const ValidationModal = React.memo(({
  mode,
  total,
  cart,
  onClose,
  onConfirm,
  onShowToast,
}: ValidationModalProps) => {
  const { submitOrder } = useOptimisticOrder();
  const { symbol: currencySymbol } = useCurrency();
  const [buzzer, setBuzzer] = useState<number | null>(null);
  const [paiement, setPaiement] = useState<'especes' | 'carte' | null>(null);
  const [montantRecu, setMontantRecu] = useState<string>('');
  const [remarque, setRemarque] = useState<string>('');

  const renduMonnaie = useMemo(() => {
    return montantRecu ? parseFloat(montantRecu) - total : 0;
  }, [montantRecu, total]);

  // Impression best-effort du ticket cuisine (avec la remarque)
  const printCuisineTicket = async (numeroCommande: string) => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'imprimantes_config')
        .single();
      if (!data?.value) return;

      const printers = JSON.parse(data.value);
      const cuisine = printers?.cuisine;
      if (!cuisine || cuisine.statut !== 'active' || !cuisine.ip) return;

      const produits = cart.map((item) => {
        const c = item.customization;
        const options: string[] = [];
        const supplements: string[] = [];
        const ingredients_retires: string[] = [];
        if (c) {
          if (c.taille) options.push(`Taille: ${c.taille.nom}`);
          if (c.viandes?.length) options.push(`Viandes: ${c.viandes.map((v) => v.nom).join(', ')}`);
          if (c.sauces?.length) options.push(`Sauces: ${c.sauces.map((s) => s.nom).join(', ')}`);
          if (c.gratin) options.push(`Gratin: ${c.gratin.nom}`);
          c.extras?.forEach((e) => supplements.push(e.nom));
          c.retraits?.forEach((r) => ingredients_retires.push(r.nom));
        }
        const itemPrice = c
          ? c.taille.prix + c.extras.reduce((sum, e) => sum + e.prix, 0) + (c.gratin?.prix || 0)
          : item.product.prix;
        return {
          nom: item.product.nom,
          quantite: item.quantite,
          prix: itemPrice * item.quantite,
          options,
          supplements,
          ingredients_retires,
        };
      });

      const commande = {
        numero_commande: numeroCommande,
        date: new Date(),
        caissier: '',
        mode_consommation: mode,
        buzzer: buzzer ?? undefined,
        remarque: remarque.trim() || undefined,
        produits,
        sous_total: total,
        tva: 0,
        total,
        paiement: paiement || '',
      };

      await fetch('/api/printer/print-commande', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: cuisine.ip, port: cuisine.port, type: 'cuisine', commande }),
      });
    } catch (e) {
      console.error('Impression ticket cuisine échouée:', e);
    }
  };

  const handleValidate = async () => {
    if (!paiement) {
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    if (paiement === 'especes' && (!montantRecu || parseFloat(montantRecu) < total)) {
      alert('Montant reçu insuffisant');
      return;
    }

    // Fermer immédiatement la modale (optimistic UI)
    onConfirm();

    // Enregistrer en arrière-plan
    const result = await submitOrder({
      total,
      mode,
      paiement,
      buzzer,
      cart,
    });

    // Afficher toast de confirmation/erreur
    if (result.success) {
      onShowToast('✅ Commande enregistrée avec succès !', 'success');
      // Impression du ticket cuisine (avec remarque) si imprimante configurée
      printCuisineTicket(result.orderId ? `#${result.orderId.slice(0, 8)}` : '#----');
    } else {
      onShowToast(`❌ Erreur : ${result.error}`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 max-w-2xl w-full max-h-[96vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Validation de la commande</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl flex-shrink-0 ml-2"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Résumé */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Mode : <span className="font-semibold">{mode === 'sur_place' ? 'Sur Place' : 'À Emporter'}</span></p>
            <p className="text-xl sm:text-2xl font-bold text-primary-500">Total : {total.toFixed(2)} {currencySymbol}</p>
          </div>

          {/* Buzzer */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Numéro de buzzer (optionnel)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 sm:gap-2">
              {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setBuzzer(num)}
                  className={`py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                    buzzer === num
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Remarque cuisine */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Remarque pour la cuisine (optionnel)
            </label>
            <textarea
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="Ex: Sans oignon, bien cuit, allergie arachides..."
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{remarque.length}/200</p>
          </div>

          {/* Mode de paiement */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
              Mode de paiement *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <button
                onClick={() => setPaiement('carte')}
                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all ${
                  paiement === 'carte'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                }`}
              >
                💳 Carte
              </button>
              <button
                onClick={() => setPaiement('especes')}
                className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg transition-all ${
                  paiement === 'especes'
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-200 hover:border-blue-400'
                }`}
              >
                💵 Espèces
              </button>
            </div>
          </div>

          {/* Calcul rendu monnaie */}
          {paiement === 'especes' && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Montant reçu
              </label>
              <input
                type="number"
                step="0.01"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:border-primary-500 focus:outline-none"
              />
              {montantRecu && (
                <div className="mt-2 sm:mt-3 p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl border-2 border-green-200">
                  <p className="text-xs sm:text-sm text-gray-600">Rendu monnaie</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {renduMonnaie.toFixed(2)} {currencySymbol}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2 sm:gap-4 pt-2 sm:pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 sm:py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={handleValidate}
              className="flex-1 py-3 sm:py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ValidationModal.displayName = 'ValidationModal';

export default ValidationModal;
