/**
 * Service de validation post-OCR
 * Vérifie la cohérence des données extraites et signale les anomalies
 */

import { OCRResult, OCRConfidence } from '@/types/invoice.types';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: Record<string, string>;
}

/**
 * Valide les résultats OCR et retourne les anomalies détectées
 */
export function validateOCRResult(result: OCRResult): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const suggestions: Record<string, string> = {};

  // 1. Vérifier les champs obligatoires
  if (!result.fournisseur || result.fournisseur.trim().length === 0) {
    errors.push('Fournisseur manquant');
  }

  if (!result.date) {
    errors.push('Date manquante');
  } else if (!isValidDate(result.date)) {
    errors.push('Format de date invalide');
    suggestions.date = 'Format attendu : YYYY-MM-DD ou DD/MM/YYYY';
  }

  if (!result.montantTTC || result.montantTTC <= 0) {
    errors.push('Montant TTC manquant ou invalide');
  }

  // 2. Vérifier la cohérence des montants
  if (result.montantTTC && result.montantHT && result.tva) {
    const calculatedTTC = result.montantHT + result.tva;
    const diff = Math.abs(calculatedTTC - result.montantTTC);
    
    if (diff > 0.02) {
      warnings.push(`Incohérence montants : HT (${result.montantHT.toFixed(2)}) + TVA (${result.tva.toFixed(2)}) ≠ TTC (${result.montantTTC.toFixed(2)})`);
      suggestions.montantTTC = `Valeur calculée : ${calculatedTTC.toFixed(2)} €`;
    }
  }

  // 3. Vérifier le taux de TVA
  if (result.montantHT && result.tva && result.montantHT > 0) {
    const calculatedRate = (result.tva / result.montantHT) * 100;
    const knownRates = [5.5, 10, 20]; // Taux TVA français courants
    
    const isKnownRate = knownRates.some(rate => Math.abs(calculatedRate - rate) < 0.5);
    
    if (!isKnownRate) {
      warnings.push(`Taux TVA inhabituel : ${calculatedRate.toFixed(2)}%`);
    }
  }

  // 4. Vérifier les scores de confiance
  const lowConfidenceFields: string[] = [];
  
  if (result.confidence.fournisseur < 0.5) lowConfidenceFields.push('fournisseur');
  if (result.confidence.date < 0.5) lowConfidenceFields.push('date');
  if (result.confidence.montant < 0.5) lowConfidenceFields.push('montant');
  if (result.confidence.tva < 0.5) lowConfidenceFields.push('TVA');
  
  if (lowConfidenceFields.length > 0) {
    warnings.push(`Champs peu fiables (< 50%) : ${lowConfidenceFields.join(', ')}`);
  }

  // 5. Vérifier la date (pas dans le futur, pas trop ancienne)
  if (result.date && isValidDate(result.date)) {
    const invoiceDate = parseDate(result.date);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    if (invoiceDate > now) {
      warnings.push('Date dans le futur');
    } else if (invoiceDate < oneYearAgo) {
      warnings.push('Facture de plus d\'un an');
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    suggestions,
  };
}

/**
 * Vérifie si une date est dans un format valide
 */
function isValidDate(dateStr: string): boolean {
  // Formats acceptés : YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
  const patterns = [
    /^\d{4}-\d{2}-\d{2}$/,           // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/,         // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/,           // DD-MM-YYYY
  ];

  if (!patterns.some(p => p.test(dateStr))) {
    return false;
  }

  const date = parseDate(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Parse une date depuis différents formats
 */
function parseDate(dateStr: string): Date {
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }

  // DD/MM/YYYY ou DD-MM-YYYY
  const parts = dateStr.split(/[/-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  return new Date(dateStr);
}

/**
 * Calcule un score de qualité global de l'extraction
 */
export function calculateQualityScore(result: OCRResult): number {
  const weights = {
    fournisseur: 0.25,
    date: 0.20,
    montant: 0.30,
    tva: 0.15,
    numero: 0.10,
  };

  let score = 0;
  score += result.confidence.fournisseur * weights.fournisseur;
  score += result.confidence.date * weights.date;
  score += result.confidence.montant * weights.montant;
  score += result.confidence.tva * weights.tva;
  score += result.confidence.numero * weights.numero;

  return Math.round(score * 100);
}

/**
 * Suggère des corrections automatiques si possible
 */
export function suggestCorrections(result: OCRResult): Partial<OCRResult> {
  const corrections: Partial<OCRResult> = {};

  // Correction automatique du montant TTC si HT + TVA disponibles
  if (result.montantHT && result.tva && (!result.montantTTC || result.montantTTC === 0)) {
    corrections.montantTTC = result.montantHT + result.tva;
  }

  // Calcul automatique du montant HT si TTC et TVA disponibles
  if (result.montantTTC && result.tva && (!result.montantHT || result.montantHT === 0)) {
    corrections.montantHT = result.montantTTC - result.tva;
  }

  // Normalisation de la date au format YYYY-MM-DD
  if (result.date && isValidDate(result.date)) {
    const date = parseDate(result.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    corrections.date = `${year}-${month}-${day}`;
  }

  return corrections;
}
