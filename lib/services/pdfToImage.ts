/**
 * Convertit la première page d'un fichier PDF en image (File)
 * Utilise pdf.js pour le rendu côté client
 */

export async function pdfToImage(pdfFile: File): Promise<{ imageFile: File; previewUrl: string }> {
  // Import dynamique de pdf.js (côté client uniquement)
  const pdfjsLib = await import('pdfjs-dist');

  // Configurer le worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  // Lire le fichier PDF en ArrayBuffer
  const arrayBuffer = await pdfFile.arrayBuffer();

  // Charger le document PDF
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Récupérer la première page
  const page = await pdf.getPage(1);

  // Définir la résolution de rendu (2x pour bonne qualité OCR)
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  // Créer un canvas pour le rendu
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Impossible de créer le contexte canvas');
  }

  // Rendre la page sur le canvas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as any)).promise;

  // Convertir le canvas en Blob puis en File
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Erreur conversion canvas en blob'));
      },
      'image/png',
      0.95
    );
  });

  const imageFile = new File(
    [blob],
    pdfFile.name.replace(/\.pdf$/i, '.png'),
    { type: 'image/png' }
  );

  // Créer un aperçu URL
  const previewUrl = canvas.toDataURL('image/png');

  // Nettoyer
  canvas.remove();

  console.log(`✅ [PDF] Converti: ${pdfFile.name} → ${imageFile.name} (${Math.round(blob.size / 1024)}KB)`);

  return { imageFile, previewUrl };
}

/**
 * Vérifie si un fichier est un PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
