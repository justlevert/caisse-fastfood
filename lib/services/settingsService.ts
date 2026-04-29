import { supabase } from '@/lib/supabase';

/**
 * Service pour gérer les paramètres globaux de l'application
 * Stockés dans Supabase pour synchronisation entre appareils
 */

export interface AppSettings {
  openai_api_key?: string;
  // Autres paramètres futurs peuvent être ajoutés ici
}

/**
 * Récupère les paramètres de l'application depuis Supabase
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .single();

    if (error) {
      // Si aucun enregistrement n'existe, retourner un objet vide
      if (error.code === 'PGRST116') {
        return {};
      }
      throw error;
    }

    return {
      openai_api_key: data?.openai_api_key || undefined,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return {};
  }
}

/**
 * Sauvegarde ou met à jour les paramètres dans Supabase
 */
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    // Vérifier si un enregistrement existe déjà
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .single();

    if (existing) {
      // Mise à jour
      const { error } = await supabase
        .from('app_settings')
        .update(settings)
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Création
      const { error } = await supabase
        .from('app_settings')
        .insert(settings);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
}

/**
 * Récupère la clé API OpenAI depuis Supabase
 */
export async function getOpenAIApiKey(): Promise<string | null> {
  const settings = await getSettings();
  return settings.openai_api_key || null;
}

/**
 * Sauvegarde la clé API OpenAI dans Supabase
 */
export async function saveOpenAIApiKey(apiKey: string): Promise<boolean> {
  return await saveSettings({ openai_api_key: apiKey });
}

/**
 * Supprime la clé API OpenAI de Supabase
 */
export async function removeOpenAIApiKey(): Promise<boolean> {
  return await saveSettings({ openai_api_key: undefined });
}
