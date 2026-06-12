/**
 * Utilitaires d'authentification
 */

import { getSecureItem } from '@/lib/services/securityService';

/**
 * Vérifie si l'utilisateur est connecté
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Vérifier d'abord le nouveau système sécurisé
  const securePin = getSecureItem('userPin');
  if (securePin) return true;
  
  // Fallback sur l'ancien système (pour compatibilité)
  const legacyPin = localStorage.getItem('userPin');
  if (legacyPin) {
    // Migrer vers le système sécurisé
    const { setSecureItem, removeSecureItem } = require('@/lib/services/securityService');
    setSecureItem('userPin', legacyPin);
    localStorage.removeItem('userPin');
    return true;
  }
  
  return false;
}

/**
 * Récupère le PIN de l'utilisateur connecté
 */
export function getUserPin(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Vérifier d'abord le nouveau système sécurisé
  const securePin = getSecureItem('userPin');
  if (securePin) return securePin;
  
  // Fallback sur l'ancien système
  const legacyPin = localStorage.getItem('userPin');
  if (legacyPin) {
    // Migrer vers le système sécurisé
    const { setSecureItem } = require('@/lib/services/securityService');
    setSecureItem('userPin', legacyPin);
    localStorage.removeItem('userPin');
    return legacyPin;
  }
  
  return null;
}

/**
 * Déconnecte l'utilisateur
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  
  const { clearSecureStorage } = require('@/lib/services/securityService');
  clearSecureStorage();
  
  // Nettoyer aussi l'ancien système
  localStorage.removeItem('userPin');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
}
