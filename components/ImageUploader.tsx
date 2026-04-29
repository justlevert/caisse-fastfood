'use client';

import { useState, useRef } from 'react';
import { uploadImage } from '@/lib/supabaseStorage';

interface ImageUploaderProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageUrlChange: (url: string) => void;
}

export default function ImageUploader({ 
  currentImageUrl, 
  onImageUploaded,
  onImageUrlChange 
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || '');
  const [useUrl, setUseUrl] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    // Créer une prévisualisation locale
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Upload vers Supabase
    const result = await uploadImage(file, 'categories');

    if (result.error) {
      setError(result.error);
      setPreviewUrl(currentImageUrl || '');
      setUploading(false);
      return;
    }

    if (result.url) {
      setPreviewUrl(result.url);
      onImageUploaded(result.url);
    }

    setUploading(false);
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onImageUrlChange(url);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Toggle URL / Upload */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setUseUrl(true)}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            useUrl 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔗 URL
        </button>
        <button
          type="button"
          onClick={() => setUseUrl(false)}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
            !useUrl 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📁 Upload
        </button>
      </div>

      {/* Input URL */}
      {useUrl && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            URL de l&apos;image
          </label>
          <input
            type="text"
            value={previewUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none"
            placeholder="https://exemple.com/image.jpg"
          />
        </div>
      )}

      {/* Upload fichier */}
      {!useUrl && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Choisir une image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="text-gray-600">⏳ Upload en cours...</span>
            ) : (
              <span className="text-gray-600">📁 Cliquer pour choisir une image</span>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            JPG, PNG ou WebP • Max 2MB
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          ❌ {error}
        </div>
      )}

      {/* Aperçu */}
      {previewUrl && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Aperçu
          </label>
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
            <img
              src={previewUrl}
              alt="Aperçu"
              className="w-full h-full object-contain"
              onError={() => {
                setError('Impossible de charger l\'image');
                setPreviewUrl('');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
