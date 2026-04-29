'use client';

interface InvoicePreviewCardProps {
  imageUrl: string;
  fournisseur: string;
  adresse?: string;
  onOpenImage: () => void;
}

export default function InvoicePreviewCard({
  imageUrl,
  fournisseur,
  adresse,
  onOpenImage,
}: InvoicePreviewCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
      <div className="flex items-start gap-3">
        {/* Miniature image */}
        <div 
          className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors"
          onClick={onOpenImage}
        >
          <img
            src={imageUrl}
            alt="Facture"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-800 mb-1 truncate">
            {fournisseur || 'Fournisseur'}
          </h2>
          {adresse && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {adresse}
            </p>
          )}
          <button
            onClick={onOpenImage}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors"
          >
            <span>🔍</span>
            <span>Voir l&apos;image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
