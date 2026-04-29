import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CartItem } from '@/types/database.types';

interface OrderData {
  total: number;
  mode: 'sur_place' | 'a_emporter';
  paiement: 'especes' | 'carte';
  buzzer: number | null;
  cart: CartItem[];
}

interface OrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

export function useOptimisticOrder() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const submitOrder = async (orderData: OrderData): Promise<OrderResult> => {
    setIsSubmitting(true);
    setLastError(null);

    try {
      // Étape 1 : Créer la commande
      const { data: orderRecord, error: orderError } = await supabase
        .from('orders')
        .insert({
          total: orderData.total,
          mode: orderData.mode,
          paiement: orderData.paiement,
          buzzer: orderData.buzzer,
          statut: 'en_cours',
        })
        .select()
        .single();

      if (orderError || !orderRecord) {
        throw new Error(orderError?.message || 'Erreur création commande');
      }

      // Étape 2 : Créer les items de la commande
      const orderItems = orderData.cart.map((item) => {
        const itemPrice = item.customization
          ? item.customization.taille.prix +
            item.customization.extras.reduce((sum, e) => sum + e.prix, 0) +
            (item.customization.gratin?.prix || 0)
          : item.product.prix;

        return {
          order_id: orderRecord.id,
          product_id: item.product.id,
          quantite: item.quantite,
          prix_unitaire: itemPrice,
          customization: item.customization
            ? {
                taille: item.customization.taille.nom,
                viandes: item.customization.viandes.map((v) => v.nom),
                sauces: item.customization.sauces.map((s) => s.nom),
                extras: item.customization.extras.map((e) => e.nom),
                retraits: item.customization.retraits.map((r) => r.nom),
                gratin: item.customization.gratin?.nom || null,
              }
            : null,
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error(itemsError.message || 'Erreur ajout produits');
      }

      setIsSubmitting(false);
      return {
        success: true,
        orderId: orderRecord.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setLastError(errorMessage);
      setIsSubmitting(false);
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    submitOrder,
    isSubmitting,
    lastError,
  };
}
