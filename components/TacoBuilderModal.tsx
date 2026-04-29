'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppData } from '@/lib/contexts/DataContext';
import {
  Product,
  TacoSize,
  TacoMeat,
  TacoSauce,
  TacoExtra,
  TacoIngredient,
  TacoGratin,
  TacoCustomization,
} from '@/types/database.types';

interface TacoBuilderModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: (product: Product, customization: TacoCustomization) => void;
  existingCustomization?: TacoCustomization;
}

export default function TacoBuilderModal({
  product,
  onClose,
  onConfirm,
  existingCustomization,
}: TacoBuilderModalProps) {
  const { tacoSizes, tacoMeats, tacoSauces, tacoExtras, tacoIngredients, tacoGratins } = useAppData();
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [selectedSize, setSelectedSize] = useState<TacoSize | null>(null);
  const [selectedMeats, setSelectedMeats] = useState<TacoMeat[]>([]);
  const [selectedSauces, setSelectedSauces] = useState<TacoSauce[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<TacoExtra[]>([]);
  const [selectedRetraits, setSelectedRetraits] = useState<TacoIngredient[]>([]);
  const [selectedGratin, setSelectedGratin] = useState<TacoGratin | null>(null);

  useEffect(() => {
    if (existingCustomization && tacoSizes.length > 0) {
      setSelectedSize(existingCustomization.taille);
      setSelectedMeats(existingCustomization.viandes);
      setSelectedSauces(existingCustomization.sauces);
      setSelectedExtras(existingCustomization.extras);
      setSelectedRetraits(existingCustomization.retraits);
      setSelectedGratin(existingCustomization.gratin || null);
    }
  }, [existingCustomization, tacoSizes]);

  const calculatePrice = (): number => {
    if (!selectedSize) return 0;
    let total = selectedSize.prix;
    selectedExtras.forEach((extra) => {
      total += extra.prix;
    });
    if (selectedGratin) {
      total += selectedGratin.prix;
    }
    return total;
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedSize !== null;
      case 2:
        return selectedMeats.length > 0 && selectedMeats.length <= (selectedSize?.max_viandes || 0);
      case 3:
        return selectedSauces.length > 0 && selectedSauces.length <= (selectedSize?.max_sauces || 0);
      case 4:
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleValidate = () => {
    if (!selectedSize) return;

    const customization: TacoCustomization = {
      taille: selectedSize,
      viandes: selectedMeats,
      sauces: selectedSauces,
      extras: selectedExtras,
      retraits: selectedRetraits,
      gratin: selectedGratin || undefined,
    };

    onConfirm(product, customization);
  };

  const toggleMeat = (meat: TacoMeat) => {
    if (selectedMeats.find((m) => m.id === meat.id)) {
      setSelectedMeats(selectedMeats.filter((m) => m.id !== meat.id));
    } else {
      if (selectedMeats.length < (selectedSize?.max_viandes || 0)) {
        setSelectedMeats([...selectedMeats, meat]);
      }
    }
  };

  const toggleSauce = (sauce: TacoSauce) => {
    if (selectedSauces.find((s) => s.id === sauce.id)) {
      setSelectedSauces(selectedSauces.filter((s) => s.id !== sauce.id));
    } else {
      if (selectedSauces.length < (selectedSize?.max_sauces || 0)) {
        setSelectedSauces([...selectedSauces, sauce]);
      }
    }
  };

  const toggleExtra = (extra: TacoExtra) => {
    if (selectedExtras.find((e) => e.id === extra.id)) {
      setSelectedExtras(selectedExtras.filter((e) => e.id !== extra.id));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const toggleRetrait = (ingredient: TacoIngredient) => {
    if (selectedRetraits.find((i) => i.id === ingredient.id)) {
      setSelectedRetraits(selectedRetraits.filter((i) => i.id !== ingredient.id));
    } else {
      setSelectedRetraits([...selectedRetraits, ingredient]);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-[1400px] max-h-[96vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Composer votre {product.nom}</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Étape {currentStep} sur {totalSteps}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl sm:text-3xl flex-shrink-0 ml-2">
            ×
          </button>
        </div>

        {/* Indicateur de progression */}
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div
              key={step}
              className={`flex-1 h-1.5 sm:h-2 rounded-full ${
                step <= currentStep ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Étape 1 : Choix de la taille */}
        {currentStep === 1 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-5">Choisissez la taille</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {tacoSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size)}
                  className={`p-3 sm:p-6 rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all min-h-[100px] sm:min-h-[140px] ${
                    selectedSize?.id === size.id
                      ? 'bg-primary-500 text-white border-blue-600 shadow-lg'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  <div className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{size.nom}</div>
                  <div className="text-base sm:text-lg font-semibold">{size.prix.toFixed(2)} €</div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-2 opacity-80">
                    {size.max_viandes} viande{size.max_viandes > 1 ? 's' : ''}
                  </div>
                  <div className="text-xs sm:text-sm opacity-80">
                    {size.max_sauces} sauce{size.max_sauces > 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Étape 2 : Choix des viandes */}
        {currentStep === 2 && selectedSize && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Choisissez vos viandes</h3>
            {selectedSize ? (
              <>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-5">
                  Sélectionnez jusqu&apos;à {selectedSize.max_viandes} viande
                  {selectedSize.max_viandes > 1 ? 's' : ''} ({selectedMeats.length}/
                  {selectedSize.max_viandes})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {tacoMeats.map((meat) => {
                    const isSelected = selectedMeats.find((m) => m.id === meat.id);
                    const isDisabled =
                      !isSelected && selectedMeats.length >= selectedSize.max_viandes;
                return (
                  <button
                    key={meat.id}
                    onClick={() => toggleMeat(meat)}
                    disabled={isDisabled}
                    className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 sm:border-3 transition-all min-h-[90px] sm:min-h-[120px] ${
                      isSelected
                        ? 'bg-primary-500 text-white border-blue-600 shadow-lg'
                        : isDisabled
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">🍖</div>
                    <div className="text-sm sm:text-base font-semibold">{meat.nom}</div>
                  </button>
                );
              })}
                </div>
              </>
            ) : (
              <p className="text-red-500 text-center py-8">Veuillez d&apos;abord sélectionner une taille</p>
            )}
          </div>
        )}

        {/* Étape 3 : Choix des sauces */}
        {currentStep === 3 && selectedSize && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Choisissez vos sauces</h3>
            {selectedSize ? (
              <>
                <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-5">
                  Sélectionnez jusqu&apos;à {selectedSize.max_sauces} sauce
                  {selectedSize.max_sauces > 1 ? 's' : ''} ({selectedSauces.length}/
                  {selectedSize.max_sauces})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {tacoSauces.map((sauce) => {
                    const isSelected = selectedSauces.find((s) => s.id === sauce.id);
                    const isDisabled =
                      !isSelected && selectedSauces.length >= selectedSize.max_sauces;
                return (
                  <button
                    key={sauce.id}
                    onClick={() => toggleSauce(sauce)}
                    disabled={isDisabled}
                    className={`p-5 rounded-2xl border-3 transition-all min-h-[120px] ${
                      isSelected
                        ? 'bg-primary-500 text-white border-blue-600 shadow-lg'
                        : isDisabled
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">🌶️</div>
                    <div className="text-base font-semibold">{sauce.nom}</div>
                  </button>
                );
              })}
                </div>
              </>
            ) : (
              <p className="text-red-500 text-center py-8">Veuillez d&#39;abord sélectionner une taille</p>
            )}
          </div>
        )}

        {/* Étape 4 : Choix des extras */}
        {currentStep === 4 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-5">
              Suppléments (optionnel)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {tacoExtras.map((extra) => {
                const isSelected = selectedExtras.find((e) => e.id === extra.id);
                return (
                  <button
                    key={extra.id}
                    onClick={() => toggleExtra(extra)}
                    className={`p-5 rounded-2xl border-3 transition-all min-h-[120px] ${
                      isSelected
                        ? 'bg-primary-500 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-blue-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">➕</div>
                    <div className="text-base font-semibold">{extra.nom}</div>
                    <div className="text-sm mt-1">+{extra.prix.toFixed(2)} €</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 5 : Retrait d'ingrédients */}
        {currentStep === 5 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-5">
              Retirer des ingrédients (optionnel)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {tacoIngredients.map((ingredient) => {
                const isSelected = selectedRetraits.find((i) => i.id === ingredient.id);
                return (
                  <button
                    key={ingredient.id}
                    onClick={() => toggleRetrait(ingredient)}
                    className={`p-5 rounded-2xl border-3 transition-all min-h-[120px] ${
                      isSelected
                        ? 'bg-red-600 text-white border-red-600 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-red-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">❌</div>
                    <div className="text-base font-semibold">{ingredient.nom}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 6 : Gratinage */}
        {currentStep === 6 && (
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-5">
              Gratinage (optionnel)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {tacoGratins.map((gratin) => {
                const isSelected = selectedGratin?.id === gratin.id;
                return (
                  <button
                    key={gratin.id}
                    onClick={() => setSelectedGratin(isSelected ? null : gratin)}
                    className={`p-5 rounded-2xl border-3 transition-all min-h-[120px] ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-orange-400'
                    }`}
                  >
                    <div className="text-4xl mb-2">🧀</div>
                    <div className="text-base font-semibold">{gratin.nom}</div>
                    <div className="text-sm mt-1">
                      {gratin.prix === 0 ? 'Gratuit' : `+${gratin.prix.toFixed(2)} €`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Prix total */}
        <div className="mt-4 sm:mt-8 p-3 sm:p-5 bg-primary-50 rounded-xl sm:rounded-2xl border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-semibold text-gray-700">Prix total</span>
            <span className="text-xl sm:text-2xl font-bold text-primary-500">
              {calculatePrice().toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Boutons de navigation */}
        <div className="flex gap-2 sm:gap-4 mt-4 sm:mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex-1 py-3 sm:py-4 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 text-gray-700 font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all"
          >
            <span className="hidden sm:inline">← Précédent</span>
            <span className="sm:hidden">←</span>
          </button>
          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex-1 py-3 sm:py-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all"
            >
              <span className="hidden sm:inline">Suivant →</span>
              <span className="sm:hidden">→</span>
            </button>
          ) : (
            <button
              onClick={handleValidate}
              disabled={!canGoNext()}
              className="flex-1 py-3 sm:py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all"
            >
              <span className="hidden sm:inline">Ajouter au panier</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

