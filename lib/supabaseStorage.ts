import { supabase } from './supabase';

/**
 * Upload une image dans Supabase Storage
 * @param file - Fichier image à uploader
 * @param bucket - Nom du bucket (par défaut 'categories')
 * @param folder - Dossier dans le bucket (optionnel)
 * @returns URL publique de l'image uploadée
 */
export async function uploadImage(
  file: File,
  bucket: string = 'categories',
  folder?: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return {
        url: null,
        error: 'Type de fichier non supporté. Utilisez JPG, PNG ou WebP.'
      };
    }

    // Vérifier la taille (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return {
        url: null,
        error: 'Fichier trop volumineux. Taille maximale : 2MB.'
      };
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${extension}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload le fichier
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload:', error);
      return {
        url: null,
        error: `Erreur d'upload: ${error.message}`
      };
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      error: null
    };
  } catch (error: any) {
    console.error('Erreur upload image:', error);
    return {
      url: null,
      error: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Supprime une image de Supabase Storage
 * @param imageUrl - URL de l'image à supprimer
 * @param bucket - Nom du bucket
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = 'categories'
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = imageUrl.split(`/storage/v1/object/public/${bucket}/`);
    if (urlParts.length < 2) {
      return {
        success: false,
        error: 'URL invalide'
      };
    }

    const filePath = urlParts[1];

    // Supprimer le fichier
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Erreur suppression:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('Erreur suppression image:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue'
    };
  }
}

/**
 * Remplace une image existante par une nouvelle
 * @param oldImageUrl - URL de l'ancienne image
 * @param newFile - Nouveau fichier image
 * @param bucket - Nom du bucket
 */
export async function replaceImage(
  oldImageUrl: string | null,
  newFile: File,
  bucket: string = 'categories'
): Promise<{ url: string | null; error: string | null }> {
  // Supprimer l'ancienne image si elle existe
  if (oldImageUrl) {
    await deleteImage(oldImageUrl, bucket);
  }

  // Upload la nouvelle image
  return uploadImage(newFile, bucket);
}
