import Tesseract from 'tesseract.js';
import { OCRResult } from '@/types/invoice.types';
import { parseInvoiceText } from '@/lib/services/ocrParser';
import { extractInvoiceWithAI, getOpenAIApiKey } from '@/lib/services/aiOcrService';
import { preprocessImage } from '@/lib/services/imagePreprocessing';
import { validateOCRResult, suggestCorrections, calculateQualityScore } from '@/lib/services/ocrValidator';

/**
 * Pipeline OCR intelligent pour l'extraction de factures
 * 
 * Étapes :
 * 1. Pré-traitement image (contraste, redimensionnement)
 * 2. Extraction OCR (GPT-4 Vision si clé API, sinon Tesseract.js)
 * 3. Validation et corrections automatiques
 * 4. Retour résultat avec score qualité
 */
export async function extractInvoiceData(file: File): Promise<OCRResult> {
  console.log('🔄 [OCR] Démarrage pipeline extraction...');

  // Étape 1 : Pré-traitement image
  let processedFile = file;
  try {
    console.log('🖼️ [OCR] Pré-traitement image...');
    const preprocessResult = await preprocessImage(file);
    processedFile = preprocessResult.processedFile;
    console.log(`✅ [OCR] Image optimisée : ${preprocessResult.width}x${preprocessResult.height}, ${Math.round(preprocessResult.processedSize / 1024)}KB`);
    console.log(`📊 [OCR] Traitements appliqués : ${preprocessResult.applied.join(', ')}`);
  } catch (error) {
    console.warn('⚠️ [OCR] Erreur pré-traitement, utilisation image originale:', error);
    processedFile = file;
  }

  // Étape 2 : Extraction OCR
  const apiKey = getOpenAIApiKey();
  let result: OCRResult;

  if (apiKey) {
    console.log('🤖 [OCR] Clé OpenAI détectée → utilisation GPT-4 Vision');
    try {
      result = await extractInvoiceWithAI(processedFile, apiKey);
      console.log('✅ [OCR] Extraction IA réussie');
    } catch (error) {
      console.warn('⚠️ [OCR] Erreur IA, fallback vers Tesseract:', error);
      result = await extractWithTesseract(processedFile);
    }
  } else {
    console.log('📝 [OCR] Pas de clé OpenAI → utilisation Tesseract.js');
    result = await extractWithTesseract(processedFile);
  }

  // Étape 3 : Validation et corrections
  const validation = validateOCRResult(result);
  const qualityScore = calculateQualityScore(result);

  console.log(`📊 [OCR] Score qualité global : ${qualityScore}%`);
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ [OCR] Avertissements :', validation.warnings);
  }
  
  if (validation.errors.length > 0) {
    console.error('❌ [OCR] Erreurs :', validation.errors);
  }

  // Appliquer corrections automatiques si disponibles
  const corrections = suggestCorrections(result);
  if (Object.keys(corrections).length > 0) {
    console.log('🔧 [OCR] Corrections automatiques appliquées :', corrections);
    result = { ...result, ...corrections };
  }

  return result;
}

/**
 * Extraction via Tesseract.js (fallback)
 */
async function extractWithTesseract(file: File): Promise<OCRResult> {
  try {
    console.log('🔄 [OCR] Démarrage reconnaissance Tesseract...');

    const result = await Tesseract.recognize(file, 'fra', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`🔄 [OCR] Progression: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const rawText = result.data.text;
    const globalConfidence = result.data.confidence / 100;

    console.log('✅ [OCR] Reconnaissance terminée');
    console.log(`📊 [OCR] Confiance globale Tesseract: ${Math.round(globalConfidence * 100)}%`);
    console.log(`📝 [OCR] Texte brut (${rawText.length} chars):`, rawText.substring(0, 200) + '...');

    const parsed = parseInvoiceText(rawText, globalConfidence);

    console.log('✅ [OCR] Parsing terminé:', {
      fournisseur: parsed.fournisseur,
      date: parsed.date,
      montantTTC: parsed.montantTTC,
      tva: parsed.tva,
      montantHT: parsed.montantHT,
      numero: parsed.numero,
      adresse: parsed.adresse,
      confidence: parsed.confidence,
    });

    return parsed;
  } catch (error) {
    console.error('❌ [OCR] Erreur Tesseract:', error);
    return {
      confidence: {
        fournisseur: 0,
        date: 0,
        montant: 0,
        tva: 0,
        numero: 0,
        adresse: 0,
      },
    };
  }
}
