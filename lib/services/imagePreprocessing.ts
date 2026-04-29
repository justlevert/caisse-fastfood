/**
 * Service de pré-traitement d'images pour améliorer la qualité OCR
 * Appliqué systématiquement avant extraction OCR
 */

export interface PreprocessingResult {
  processedFile: File;
  originalSize: number;
  processedSize: number;
  width: number;
  height: number;
  applied: string[];
}

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const JPEG_QUALITY = 0.92;

/**
 * Pré-traite une image pour optimiser la reconnaissance OCR
 */
export async function preprocessImage(file: File): Promise<PreprocessingResult> {
  const applied: string[] = [];
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context indisponible'));
        return;
      }

      let { width, height } = img;

      // 1. Redimensionnement si nécessaire
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
        applied.push('resize');
      }

      canvas.width = width;
      canvas.height = height;

      // 2. Dessiner l'image
      ctx.drawImage(img, 0, 0, width, height);

      // 3. Amélioration du contraste et de la netteté
      const imageData = ctx.getImageData(0, 0, width, height);
      enhanceContrast(imageData);
      applied.push('contrast');
      
      ctx.putImageData(imageData, 0, 0);

      // 4. Conversion en blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Erreur conversion blob'));
            return;
          }

          const processedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '_processed.jpg'),
            { type: 'image/jpeg' }
          );

          resolve({
            processedFile,
            originalSize: file.size,
            processedSize: blob.size,
            width,
            height,
            applied,
          });
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      reject(new Error('Erreur chargement image'));
    };

    reader.onerror = () => {
      reject(new Error('Erreur lecture fichier'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Améliore le contraste de l'image pour une meilleure lisibilité
 */
function enhanceContrast(imageData: ImageData): void {
  const data = imageData.data;
  const factor = 1.2; // Facteur de contraste

  for (let i = 0; i < data.length; i += 4) {
    // Appliquer le contraste sur RGB
    data[i] = clamp(((data[i] - 128) * factor) + 128);     // R
    data[i + 1] = clamp(((data[i + 1] - 128) * factor) + 128); // G
    data[i + 2] = clamp(((data[i + 2] - 128) * factor) + 128); // B
  }
}

/**
 * Limite une valeur entre 0 et 255
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(255, value));
}

/**
 * Convertit une image en niveaux de gris (optionnel, pour Tesseract)
 */
export async function convertToGrayscale(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context indisponible'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Conversion en niveaux de gris
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Erreur conversion blob'));
            return;
          }

          const grayscaleFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '_gray.jpg'),
            { type: 'image/jpeg' }
          );

          resolve(grayscaleFile);
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => reject(new Error('Erreur chargement image'));
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
    reader.readAsDataURL(file);
  });
}
