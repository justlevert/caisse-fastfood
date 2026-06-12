'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { extractInvoiceData } from '@/lib/services/ocrService';
import { pdfToImage, isPDF } from '@/lib/services/pdfToImage';
import { getOpenAIApiKey, setOpenAIApiKey, removeOpenAIApiKey } from '@/lib/services/aiOcrService';
import { InvoiceFormData, OCRConfidence } from '@/types/invoice.types';
import InvoiceHeader from '@/components/mobile/InvoiceHeader';
import InvoicePreviewCard from '@/components/mobile/InvoicePreviewCard';
import ConfidenceCard from '@/components/mobile/ConfidenceCard';
import InvoiceFormCard from '@/components/mobile/InvoiceFormCard';
import InvoiceActions from '@/components/mobile/InvoiceActions';
import CameraWithDetection from '@/components/mobile/CameraWithDetection';

type Step = 'auth' | 'historique' | 'verification';
type ModalType = null | 'add' | 'apiKey';

export default function MobileFacturesPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('auth');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const nativeCameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Charger la clé API depuis Supabase (synchronisé entre appareils)
    const loadApiKey = async () => {
      try {
        const { getOpenAIApiKeyAsync } = await import('@/lib/services/aiOcrService');
        const key = await getOpenAIApiKeyAsync();
        setHasApiKey(!!key);
      } catch (error) {
        console.error('❌ Erreur chargement clé API:', error);
        setHasApiKey(false);
      }
    };
    loadApiKey();
  }, []);
  
  const [formData, setFormData] = useState<InvoiceFormData>({
    fournisseur: '',
    adresse: '',
    date: '',
    montantValide: 0,
    montantTTC: 0,
    tva: 0,
    numeroFacture: '',
    categorie: '',
  });
  
  const [confidence, setConfidence] = useState<OCRConfidence>({
    fournisseur: 0,
    date: 0,
    montant: 0,
    tva: 0,
    numero: 0,
    adresse: 0,
  });

  const MOBILE_ACCESS_CODE = '9999';

  const handleAuth = () => {
    if (accessCode === MOBILE_ACCESS_CODE) {
      setIsAuthenticated(true);
      setStep('historique');
      loadInvoices();
    } else {
      alert('Code d\'accès incorrect');
      setAccessCode('');
    }
  };

  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const handleCameraCapture = async (file: File) => {
    console.log('📸 Photo capturée depuis caméra:', file.name);
    setShowCamera(false);
    setCapturedFile(file);
    setIsLoading(true);

    try {
      // Créer aperçu local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Extraction OCR
      console.log('🔄 Extraction OCR...');
      const ocrResult = await extractInvoiceData(file);
      console.log('📊 Résultat OCR:', ocrResult);

      // Remplir le formulaire avec les données extraites
      const ttc = ocrResult.montantTTC || 0;
      const tvaExtracted = ocrResult.tva || 0;
      const ht = ocrResult.montantHT || (ttc > 0 ? parseFloat((ttc - tvaExtracted).toFixed(2)) : 0);
      setFormData({
        fournisseur: ocrResult.fournisseur || '',
        adresse: ocrResult.adresse || '',
        date: ocrResult.date || '',
        montantValide: ht,
        montantTTC: ttc,
        tva: tvaExtracted,
        numeroFacture: ocrResult.numero || '',
        categorie: '',
      });

      setConfidence(ocrResult.confidence);
      setStep('verification');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du traitement de l\'image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📸 Fichier capturé:', file.name, file.type);
    setIsLoading(true);

    try {
      let fileForOCR: File = file;

      // Si c'est un PDF, convertir en image d'abord
      if (isPDF(file)) {
        console.log('📄 PDF détecté, conversion en image...');
        const { imageFile, previewUrl } = await pdfToImage(file);
        fileForOCR = imageFile;
        setCapturedFile(imageFile);
        setImageUrl(previewUrl);
        console.log('✅ PDF converti en image');
      } else {
        setCapturedFile(file);
        // Créer aperçu local pour les images
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Extraction OCR
      console.log('🔄 Extraction OCR...');
      const ocrResult = await extractInvoiceData(fileForOCR);
      console.log('📊 Résultat OCR:', ocrResult);

      // Remplir le formulaire avec les données extraites
      const ttc = ocrResult.montantTTC || 0;
      const tvaExtracted = ocrResult.tva || 0;
      const ht = ocrResult.montantHT || (ttc > 0 ? parseFloat((ttc - tvaExtracted).toFixed(2)) : 0);
      setFormData({
        fournisseur: ocrResult.fournisseur || '',
        adresse: ocrResult.adresse || '',
        date: ocrResult.date || '',
        montantValide: ht,
        montantTTC: ttc,
        tva: tvaExtracted,
        numeroFacture: ocrResult.numero || '',
        categorie: '',
      });

      setConfidence(ocrResult.confidence);
      setStep('verification');
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors du traitement de l\'image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setStep('historique');
    setActiveModal('add');
    setCapturedFile(null);
    setImageUrl('');
    setFormData({
      fournisseur: '',
      adresse: '',
      date: '',
      montantValide: 0,
      montantTTC: 0,
      tva: 0,
      numeroFacture: '',
      categorie: '',
    });
    setConfidence({ fournisseur: 0, date: 0, montant: 0, tva: 0, numero: 0, adresse: 0 });
  };

  const handleValidate = async () => {
    if (!formData.fournisseur || !formData.date || !formData.montantTTC) {
      alert('Veuillez remplir les champs obligatoires (Fournisseur, Date, Montant TTC)');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Erreur: Utilisateur non connecté');
        setIsLoading(false);
        return;
      }

      let uploadedImageUrl: string | null = null;

      // 2. Upload de l'image vers Supabase Storage (optionnel)
      if (capturedFile) {
        const fileName = `${Date.now()}_${capturedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, capturedFile);

        if (uploadError) {
          console.warn('⚠️ Erreur upload image:', uploadError);
          // Continue même si l'upload échoue
        } else {
          // Récupérer l'URL publique
          const { data: urlData } = supabase.storage
            .from('invoices')
            .getPublicUrl(fileName);
          
          uploadedImageUrl = urlData.publicUrl;
          console.log('✅ Image uploadée:', uploadedImageUrl);
        }
      }

      // 3. Enregistrer la facture dans la table invoices
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          fournisseur: formData.fournisseur,
          adresse: formData.adresse || null,
          date_facture: formData.date,
          montant_valide: formData.montantValide,
          montant_ttc: formData.montantTTC,
          tva: formData.tva,
          numero_facture: formData.numeroFacture || null,
          categorie: formData.categorie || null,
          image_url: uploadedImageUrl,
          confidence_fournisseur: confidence.fournisseur,
          confidence_date: confidence.date,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        throw error;
      }

      console.log('✅ Facture enregistrée:', data);
      alert('Facture enregistrée avec succès !');
      
      // Recharger la liste et retourner à l'historique
      await loadInvoices();
      setStep('historique');
      setCapturedFile(null);
      setImageUrl('');
      setFormData({
        fournisseur: '',
        adresse: '',
        date: '',
        montantValide: 0,
        montantTTC: 0,
        tva: 0,
        numeroFacture: '',
        categorie: '',
      });
      setConfidence({ fournisseur: 0, date: 0, montant: 0, tva: 0, numero: 0, adresse: 0 });
    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('Erreur lors de l\'enregistrement: ' + (error instanceof Error ? error.message : 'Inconnue'));
    } finally {
      setIsLoading(false);
    }
  };

  // Écran d'authentification
  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo et titre */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl mb-6">
              <span className="text-4xl">📱</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Factures Mobile
            </h1>
            <p className="text-blue-200 text-sm sm:text-base">
              Gestion rapide et sécurisée
            </p>
          </div>

          {/* Carte d'authentification */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Code d&apos;accès
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-6 py-5 text-3xl text-center border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none font-bold tracking-[0.5em] bg-gray-50 transition-all"
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
            </div>

            <button
              onClick={handleAuth}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <span>🔓</span>
                <span>Accéder</span>
              </span>
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Accès réservé au personnel autorisé
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Écran d'historique (page principale)
  if (step === 'historique') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Header moderne */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-xl">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setAccessCode('');
                setStep('auth');
              }}
              className="flex items-center gap-2 text-white/90 hover:text-white font-semibold text-base transition-colors"
            >
              <span className="text-xl">←</span>
              <span>Retour</span>
            </button>
            <h1 className="text-xl font-bold">Mes Factures</h1>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                hasApiKey
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
              }`}
            >
              {hasApiKey ? '🧠 IA' : '⚙️ IA'}
            </button>
          </div>
        </div>

        {/* Liste des factures */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {isLoadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Chargement...</p>
              </div>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 font-medium mb-2">Aucune facture</p>
              <p className="text-gray-500 text-sm">
                Cliquez sur le bouton + pour ajouter votre première facture
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {invoices.map(invoice => (
                <div
                  key={invoice.id}
                  className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    {invoice.image_url && (
                      <div
                        onClick={() => {
                          setImageUrl(invoice.image_url);
                          setShowImageModal(true);
                        }}
                        className="w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50 cursor-pointer hover:border-blue-400 transition-colors"
                      >
                        <img
                          src={invoice.image_url}
                          alt="Facture"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-800 truncate">
                            {invoice.fournisseur}
                          </h3>
                          {invoice.numero_facture && (
                            <p className="text-xs text-gray-500">N° {invoice.numero_facture}</p>
                          )}
                        </div>
                        <span className="text-lg font-bold text-blue-600 ml-2">
                          {invoice.montant_ttc.toFixed(2)} €
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <span className="ml-1 font-medium text-gray-700">
                            {new Date(invoice.date_facture).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {invoice.categorie && (
                          <div>
                            <span className="text-gray-500">Catégorie:</span>
                            <span className="ml-1 font-medium text-gray-700">{invoice.categorie}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bouton flottant pour ajouter une facture */}
        <button
          onClick={() => setActiveModal('add')}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-200 active:scale-95 flex items-center justify-center z-50"
        >
          <span className="text-3xl font-bold">+</span>
        </button>

        {/* Modal d'ajout de facture */}
        {activeModal === 'add' && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">📷</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Ajouter une facture</h3>
                      <p className="text-blue-100 text-xs">Photo ou fichier</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Input natif caché pour fallback */}
                <input
                  ref={nativeCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileCapture}
                  className="hidden"
                  id="camera-input-native"
                />

                {/* Bouton principal : Prendre photo */}
                <button
                  onClick={() => {
                    setActiveModal(null);
                    // Essayer d'abord la caméra avancée, sinon fallback natif
                    const hasAdvancedCamera = typeof navigator !== 'undefined' && 
                      navigator.mediaDevices && 
                      typeof navigator.mediaDevices.getUserMedia === 'function';
                    
                    if (hasAdvancedCamera) {
                      setShowCamera(true);
                    } else {
                      // Fallback direct vers input natif
                      console.log('📱 Fallback direct vers caméra native');
                      setTimeout(() => {
                        nativeCameraRef.current?.click();
                      }, 100);
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  <span className="text-2xl">📸</span>
                  <span>Prendre une photo</span>
                </button>

                {/* Séparateur */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-sm text-gray-500 font-medium">ou</span>
                  </div>
                </div>

                {/* Bouton secondaire : Charger fichier */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    onChange={(e) => {
                      setActiveModal(null);
                      handleFileCapture(e);
                    }}
                    className="hidden"
                    id="file-input-modal"
                  />
                  <label
                    htmlFor="file-input-modal"
                    className="block w-full py-4 bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-bold text-base rounded-2xl transition-all cursor-pointer text-center flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <span className="text-2xl">📂</span>
                    <span>Charger un fichier</span>
                  </label>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Formats acceptés : JPG, PNG, PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
              <div className="relative inline-block mb-6">
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">{hasApiKey ? '🧠' : '🔍'}</span>
                </div>
              </div>
              <p className="text-gray-800 text-lg font-bold mb-2">
                {hasApiKey ? 'Analyse IA en cours' : 'Analyse en cours'}
              </p>
              <p className="text-gray-500 text-sm">
                Extraction des données de la facture...
              </p>
              <div className="mt-4 flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Modal clé API */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Configuration IA</h3>
                      <p className="text-blue-100 text-xs">OpenAI GPT-4 Vision</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="text-white/80 hover:text-white text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Statut */}
                <div className={`rounded-2xl p-4 border-2 ${
                  hasApiKey 
                    ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-400' 
                    : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{hasApiKey ? '✅' : '⚠️'}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-800">
                        {hasApiKey ? 'GPT-4 Vision activé' : 'Mode Tesseract.js (basique)'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {hasApiKey
                          ? 'L\'extraction utilise l\'IA avancée pour une reconnaissance précise et intelligente.'
                          : 'Ajoutez une clé API OpenAI pour améliorer considérablement la précision.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Champ clé */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Clé API OpenAI
                  </label>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 focus:outline-none text-base font-mono transition-all"
                    placeholder="sk-proj-..."
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  {hasApiKey && (
                    <button
                      onClick={async () => {
                        const success = await removeOpenAIApiKey();
                        if (success) {
                          setHasApiKey(false);
                          setApiKeyInput('');
                          alert('✅ Clé API supprimée');
                        } else {
                          alert('❌ Erreur lors de la suppression');
                        }
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 rounded-xl font-bold transition-all active:scale-[0.98]"
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      if (!apiKeyInput.trim()) return;
                      const success = await setOpenAIApiKey(apiKeyInput.trim());
                      if (success) {
                        setHasApiKey(true);
                        setApiKeyInput('');
                        setShowApiKeyModal(false);
                        alert('✅ Clé API enregistrée et synchronisée !');
                      } else {
                        alert('❌ Erreur lors de la sauvegarde');
                      }
                    }}
                    disabled={!apiKeyInput.trim()}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                  >
                    💾 Enregistrer
                  </button>
                </div>

                {/* Info sécurité */}
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 text-lg flex-shrink-0">🔒</span>
                    <p className="text-xs text-blue-900 leading-relaxed">
                      <strong>Synchronisation :</strong> Votre clé API est stockée de manière sécurisée dans Supabase et synchronisée entre tous vos appareils (desktop + mobile).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Composant caméra avec détection - Accessible depuis tous les écrans */}
        {showCamera && (
          <CameraWithDetection
            onCapture={handleCameraCapture}
            onCancel={() => setShowCamera(false)}
            onCameraError={() => {
              console.log('⚠️ Caméra avancée indisponible, fallback natif');
              setShowCamera(false);
              // Ouvrir l'input natif en fallback
              setTimeout(() => {
                nativeCameraRef.current?.click();
              }, 100);
            }}
          />
        )}

        {/* Modal image plein écran - Accessible depuis tous les écrans */}
        {showImageModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 rounded-full w-12 h-12 flex items-center justify-center"
              >
                ×
              </button>
              <img
                src={imageUrl}
                alt="Facture"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Écran de vérification
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <InvoiceHeader onBack={handleRetake} />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          <InvoicePreviewCard
            imageUrl={imageUrl}
            fournisseur={formData.fournisseur}
            adresse={formData.adresse}
            onOpenImage={() => setShowImageModal(true)}
          />

          <ConfidenceCard scores={confidence} />

          <InvoiceFormCard
            formData={formData}
            onChange={setFormData}
            confidence={confidence}
          />

          <InvoiceActions
            onRetake={handleRetake}
            onValidate={handleValidate}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
