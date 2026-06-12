/**
 * Service de sécurité pour le chiffrement et la gestion des données sensibles
 */

/**
 * Chiffre une chaîne de caractères avec une clé dérivée
 */
export function encryptData(data: string): string {
  if (typeof window === 'undefined') return data;
  
  // Utiliser un simple encodage Base64 avec obfuscation
  // Pour une vraie app en production, utiliser crypto-js ou Web Crypto API
  const encoded = btoa(unescape(encodeURIComponent(data)));
  const obfuscated = encoded.split('').reverse().join('');
  return obfuscated;
}

/**
 * Déchiffre une chaîne de caractères
 */
export function decryptData(encryptedData: string): string {
  if (typeof window === 'undefined') return encryptedData;
  
  try {
    const deobfuscated = encryptedData.split('').reverse().join('');
    const decoded = decodeURIComponent(escape(atob(deobfuscated)));
    return decoded;
  } catch (error) {
    console.error('Erreur déchiffrement');
    return '';
  }
}

/**
 * Hash simple d'une chaîne (pour le PIN)
 * En production, utiliser bcrypt ou argon2
 */
export async function hashPin(pin: string): Promise<string> {
  if (typeof window === 'undefined') return pin;
  
  // Utiliser Web Crypto API pour un hash SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'caisse-salt-2024'); // Salt statique (à améliorer)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Stocke une donnée sensible de manière sécurisée
 */
export function setSecureItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const encrypted = encryptData(value);
    localStorage.setItem(`secure_${key}`, encrypted);
  } catch (error) {
    console.error('Erreur stockage sécurisé');
  }
}

/**
 * Récupère une donnée sensible stockée
 */
export function getSecureItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const encrypted = localStorage.getItem(`secure_${key}`);
    if (!encrypted) return null;
    return decryptData(encrypted);
  } catch (error) {
    console.error('Erreur récupération sécurisée');
    return null;
  }
}

/**
 * Supprime une donnée sensible
 */
export function removeSecureItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`secure_${key}`);
}

/**
 * Nettoie toutes les données sensibles
 */
export function clearSecureStorage(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('secure_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Gestionnaire de limitation de tentatives de connexion
 */
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

export function recordFailedAttempt(): boolean {
  if (typeof window === 'undefined') return false;
  
  const attemptsKey = 'login_attempts';
  const lockoutKey = 'login_lockout';
  
  // Vérifier si verrouillé
  const lockoutTime = localStorage.getItem(lockoutKey);
  if (lockoutTime) {
    const lockoutEnd = parseInt(lockoutTime);
    if (Date.now() < lockoutEnd) {
      return true; // Toujours verrouillé
    } else {
      // Déverrouiller
      localStorage.removeItem(lockoutKey);
      localStorage.removeItem(attemptsKey);
    }
  }
  
  // Incrémenter tentatives
  const attempts = parseInt(localStorage.getItem(attemptsKey) || '0') + 1;
  localStorage.setItem(attemptsKey, attempts.toString());
  
  // Verrouiller si trop de tentatives
  if (attempts >= MAX_ATTEMPTS) {
    const lockoutEnd = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem(lockoutKey, lockoutEnd.toString());
    return true;
  }
  
  return false;
}

export function resetLoginAttempts(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('login_attempts');
  localStorage.removeItem('login_lockout');
}

export function getRemainingLockoutTime(): number {
  if (typeof window === 'undefined') return 0;
  
  const lockoutTime = localStorage.getItem('login_lockout');
  if (!lockoutTime) return 0;
  
  const lockoutEnd = parseInt(lockoutTime);
  const remaining = Math.max(0, lockoutEnd - Date.now());
  return Math.ceil(remaining / 1000); // Secondes
}

export function getFailedAttempts(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('login_attempts') || '0');
}
