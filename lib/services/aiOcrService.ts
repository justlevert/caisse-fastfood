import { OCRResult, OCRConfidence } from '@/types/invoice.types';

/**
 * Service OCR via OpenAI GPT-4 Vision
 * Envoie l'image à l'API route /api/ocr qui appelle OpenAI
 */

export async function extractInvoiceWithAI(file: File, apiKey: string): Promise<OCRResult> {
  try {
    console.log('🤖 [AI-OCR] Démarrage extraction via OpenAI GPT-4 Vision...');

    // Convertir le fichier en base64
    const base64 = await fileToBase64(file);
    console.log('📤 [AI-OCR] Image convertie, envoi à l\'API...');

    // Appeler l'API route
    const response = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        apiKey: apiKey,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('❌ [AI-OCR] Erreur API:', result.error);
      throw new Error(result.error || 'Erreur lors de l\'extraction IA');
    }

    const data = result.data;
    console.log('✅ [AI-OCR] Extraction réussie:', data);
    console.log('📊 [AI-OCR] Modèle:', result.model, '| Tokens:', result.usage?.total_tokens);

    // Mapper vers OCRResult
    const confidence: OCRConfidence = {
      fournisseur: data.confidence?.fournisseur ?? 0,
      date: data.confidence?.date ?? 0,
      montant: data.confidence?.montant ?? 0,
      tva: data.confidence?.tva ?? 0,
      numero: data.confidence?.numero ?? 0,
      adresse: data.confidence?.adresse ?? 0,
    };

    return {
      fournisseur: data.fournisseur || undefined,
      adresse: data.adresse || undefined,
      date: data.date || undefined,
      montantTTC: data.montantTTC || undefined,
      montantHT: data.montantHT || undefined,
      tva: data.tva || undefined,
      tauxTVA: data.tauxTVA || undefined,
      numero: data.numero || undefined,
      confidence,
      rawText: `[AI-OCR] Extraction via ${result.model}`,
    };
  } catch (error) {
    console.error('❌ [AI-OCR] Erreur:', error);
    throw error;
  }
}

/**
 * Vérifie si une clé API OpenAI est configurée
 * Essaie d'abord Supabase (synchronisé), puis localStorage (fallback)
 */
export async function getOpenAIApiKeyAsync(): Promise<string | null> {
  try {
    // Importer dynamiquement pour éviter les problèmes SSR
    const { getOpenAIApiKey: getFromSupabase } = await import('@/lib/services/settingsService');
    const key = await getFromSupabase();
    if (key) return key;
  } catch (error) {
    console.warn('Impossible de récupérer la clé depuis Supabase, fallback localStorage');
  }

  // Fallback sur localStorage sécurisé
  if (typeof window !== 'undefined') {
    const { getSecureItem } = await import('./securityService');
    return getSecureItem('openai_api_key');
  }
  
  return null;
}

/**
 * Version synchrone pour compatibilité (utilise uniquement localStorage chiffré)
 * @deprecated Utiliser getOpenAIApiKeyAsync() pour accès Supabase
 */
export function getOpenAIApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  // Fallback non sécurisé pour compatibilité - utiliser getOpenAIApiKeyAsync()
  return localStorage.getItem('openai_api_key') || null;
}

/**
 * Sauvegarde la clé API OpenAI dans Supabase ET localStorage
 */
export async function setOpenAIApiKey(key: string): Promise<boolean> {
  // Sauvegarder dans localStorage de manière sécurisée (chiffré)
  if (typeof window !== 'undefined') {
    const { setSecureItem } = await import('./securityService');
    setSecureItem('openai_api_key', key);
  }

  // Sauvegarder dans Supabase pour synchronisation
  try {
    const { saveOpenAIApiKey } = await import('@/lib/services/settingsService');
    return await saveOpenAIApiKey(key);
  } catch (error) {
    console.error('Erreur sauvegarde Supabase:', error);
    return false;
  }
}

/**
 * Supprime la clé API OpenAI de Supabase ET localStorage
 */
export async function removeOpenAIApiKey(): Promise<boolean> {
  // Supprimer de localStorage sécurisé
  if (typeof window !== 'undefined') {
    const { removeSecureItem } = await import('./securityService');
    removeSecureItem('openai_api_key');
  }

  // Supprimer de Supabase
  try {
    const { removeOpenAIApiKey: removeFromSupabase } = await import('@/lib/services/settingsService');
    return await removeFromSupabase();
  } catch (error) {
    console.error('Erreur suppression Supabase:', error);
    return false;
  }
}

/**
 * Teste si la clé API est valide
 */
export async function testOpenAIApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Utilitaire : fichier vers base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
