/**
 * Utilitaires pour la gestion des devises
 */

import { supabase } from '@/lib/supabase';

let cachedCurrency: 'EUR' | 'CHF' | null = null;

/**
 * Récupère la devise configurée depuis Supabase
 */
export async function getCurrency(): Promise<'EUR' | 'CHF'> {
  // Retourner le cache si disponible
  if (cachedCurrency) {
    return cachedCurrency;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'devise')
      .single();

    if (error || !data) {
      console.warn('Devise non configurée, utilisation de EUR par défaut');
      cachedCurrency = 'EUR';
      return 'EUR';
    }

    cachedCurrency = data.value as 'EUR' | 'CHF';
    return cachedCurrency;
  } catch (error) {
    console.error('Erreur récupération devise:', error);
    return 'EUR';
  }
}

/**
 * Obtient le symbole de la devise
 */
export function getCurrencySymbol(currency: 'EUR' | 'CHF'): string {
  return currency === 'EUR' ? '€' : 'CHF';
}

/**
 * Formate un prix avec la devise
 * @param price Prix à formater
 * @param currency Devise (EUR ou CHF)
 * @param showSymbol Afficher le symbole (par défaut: true)
 */
export function formatPrice(
  price: number,
  currency: 'EUR' | 'CHF' = 'EUR',
  showSymbol: boolean = true
): string {
  const formattedPrice = price.toFixed(2);
  
  if (!showSymbol) {
    return formattedPrice;
  }

  if (currency === 'EUR') {
    return `${formattedPrice} €`;
  } else {
    return `${formattedPrice} CHF`;
  }
}

/**
 * Invalide le cache de la devise
 * À appeler après modification de la devise dans les paramètres
 */
export function invalidateCurrencyCache(): void {
  cachedCurrency = null;
}

/**
 * Hook React pour utiliser la devise
 * Utiliser dans les composants clients
 */
export function useCurrency() {
  const [currency, setCurrency] = React.useState<'EUR' | 'CHF'>('EUR');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getCurrency().then((curr) => {
      setCurrency(curr);
      setLoading(false);
    });
  }, []);

  return { currency, loading, symbol: getCurrencySymbol(currency) };
}

// Import React pour le hook
import React from 'react';
