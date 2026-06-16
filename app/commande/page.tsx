'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Product, CartItem, TacoCustomization } from '@/types/database.types';
import { useAppData } from '@/lib/contexts/DataContext';
import { useFullscreen } from '@/lib/hooks/useFullscreen';
import { useCurrency } from '@/lib/utils/currency';
import Sidebar from '@/components/Sidebar';
import ProductCard from '@/components/ProductCard';
import CartItemComponent from '@/components/CartItem';
import ValidationModal from '@/components/ValidationModal';

// Lazy load TacoBuilderModal (chargé uniquement si nécessaire)
const TacoBuilderModal = dynamic(() => import('@/components/TacoBuilderModal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="text-white">Chargement...</div></div>
});

export default function CommandePage() {
  const { categories, products, isLoading: dataLoading } = useAppData();
  const { symbol: currencySymbol } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mode, setMode] = useState<'sur_place' | 'a_emporter'>('sur_place');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showTacoBuilder, setShowTacoBuilder] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  // Activer le mode plein écran pour tablette
  useFullscreen();

  useEffect(() => {
    if (categories.length > 0) {
      // Si aucune catégorie n'est sélectionnée, sélectionner la première
      if (!selectedCategory) {
        setSelectedCategory(categories[0].id);
      } else {
        // Vérifier si la catégorie sélectionnée existe toujours
        const categoryExists = categories.some(cat => cat.id === selectedCategory);
        if (!categoryExists) {
          // Si la catégorie a été supprimée, sélectionner la première
          setSelectedCategory(categories[0].id);
        }
      }
    } else if (categories.length === 0 && selectedCategory) {
      // Si toutes les catégories ont été supprimées
      setSelectedCategory(null);
    }
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return selectedCategory
      ? products.filter((p) => p.category_id === selectedCategory)
      : products;
  }, [products, selectedCategory]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.customization
        ? item.customization.taille.prix +
          item.customization.extras.reduce((extraSum, e) => extraSum + e.prix, 0) +
          (item.customization.gratin?.prix || 0)
        : item.product.prix;
      return sum + itemPrice * item.quantite;
    }, 0);
  }, [cart]);

  const handleProductClick = useCallback((product: Product) => {
    if (product.is_customizable) {
      setSelectedProduct(product);
      setShowTacoBuilder(true);
    } else {
      addToCart(product);
    }
  }, []);

  const addToCart = (product: Product, customization?: TacoCustomization) => {
    if (editingCartIndex !== null) {
      const updatedCart = [...cart];
      updatedCart[editingCartIndex] = { product, quantite: updatedCart[editingCartIndex].quantite, customization };
      setCart(updatedCart);
      setEditingCartIndex(null);
    } else {
      const existingItem = cart.find((item) => 
        item.product.id === product.id && 
        !item.customization && 
        !customization
      );
      if (existingItem) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id && !item.customization
              ? { ...item, quantite: item.quantite + 1 }
              : item
          )
        );
      } else {
        setCart([...cart, { product, quantite: 1, customization }]);
      }
    }
  };

  const updateQuantity = useCallback((index: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item, i) =>
          i === index
            ? { ...item, quantite: item.quantite + delta }
            : item
        )
        .filter((item) => item.quantite > 0)
    );
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prevCart) => prevCart.filter((_, i) => i !== index));
  }, []);

  const handleEditTaco = useCallback((index: number) => {
    setCart((prevCart) => {
      const item = prevCart[index];
      if (item.customization) {
        setSelectedProduct(item.product);
        setEditingCartIndex(index);
        setShowTacoBuilder(true);
      }
      return prevCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col lg:flex-row h-screen">
        {/* Section Gauche/Centre - Catégories et Produits */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 overflow-hidden">
          {/* Header */}
          <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 sm:p-3 bg-white hover:bg-orange-50 border-2 border-gray-300 hover:border-orange-400 rounded-xl sm:rounded-2xl transition-all"
              >
                <span className="text-2xl sm:text-3xl">☰</span>
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Nouvelle Commande</h1>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setMode('sur_place')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-200 ${
                  mode === 'sur_place'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50 border-2 border-orange-400'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400 hover:shadow-md active:scale-98'
                }`}
              >
                🏪 <span className="hidden sm:inline">Sur Place</span>
              </button>
              <button
                onClick={() => setMode('a_emporter')}
                className={`flex-1 sm:flex-none px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base lg:text-lg transition-all duration-200 ${
                  mode === 'a_emporter'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/50 border-2 border-orange-400'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400 hover:shadow-md active:scale-98'
                }`}
              >
                📦 <span className="hidden sm:inline">À Emporter</span>
              </button>
            </div>
          </div>

          {/* Catégories */}
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative flex flex-col items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-5 rounded-xl sm:rounded-2xl font-bold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/40 border-2 border-orange-400'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-orange-400 hover:shadow-md active:scale-98'
                  }`}
                >
                  {category.image_url ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={category.image_url}
                        alt={category.nom}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="text-xl sm:text-2xl lg:text-3xl">🍔</div>
                  )}
                  <span className="text-xs sm:text-sm">{category.nom}</span>
                  {selectedCategory === category.id && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-white rounded-t-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Produits */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={handleProductClick}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Section Droite - Panier */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 bg-white border-l border-gray-200 flex-col">
          <div className="p-4 lg:p-6 border-b border-gray-200">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-800">Panier</h2>
            <p className="text-xs lg:text-sm text-gray-500 mt-1">
              {cart.length} article{cart.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 mt-8 lg:mt-12">
                <div className="text-4xl lg:text-6xl mb-3 lg:mb-4">🛒</div>
                <p className="text-sm lg:text-base">Panier vide</p>
              </div>
            ) : (
              <div className="space-y-2 lg:space-y-3">
                {cart.map((item, index) => (
                  <CartItemComponent
                    key={`${item.product.id}-${index}`}
                    item={item}
                    index={index}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    onEdit={handleEditTaco}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="p-4 lg:p-6 border-t border-gray-200 space-y-3 lg:space-y-4">
            <div className="flex justify-between items-center text-xl lg:text-2xl font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-orange-500">{total.toFixed(2)} {currencySymbol}</span>
            </div>

            {cart.length > 0 && (
              <>
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="w-full py-4 lg:py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg lg:text-xl rounded-xl lg:rounded-2xl shadow-xl shadow-green-500/50 hover:shadow-2xl active:scale-98 transition-all duration-200"
                >
                  ✓ Valider la commande
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-3 lg:py-4 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-600 font-bold text-base lg:text-lg rounded-xl lg:rounded-2xl border-2 border-red-300 hover:border-red-500 hover:shadow-lg active:scale-98 transition-all duration-200"
                >
                  🗑️ Vider le panier
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bouton panier flottant mobile */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 left-4 z-40">
          <button
            onClick={() => setShowValidationModal(true)}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-orange-500/50 flex items-center justify-between px-6"
          >
            <span>🛒 {cart.length} article{cart.length !== 1 ? 's' : ''}</span>
            <span>{total.toFixed(2)} {currencySymbol}</span>
          </button>
        </div>
      )}

      {/* Modale de validation */}
      {showValidationModal && (
        <ValidationModal
          mode={mode}
          total={total}
          cart={cart}
          onClose={() => setShowValidationModal(false)}
          onConfirm={() => {
            setShowValidationModal(false);
            clearCart();
          }}
          onShowToast={(message: string, type: 'success' | 'error') => {
            setToastMessage(message);
            setToastType(type);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
          }}
        />
      )}

      {showTacoBuilder && selectedProduct && (
        <TacoBuilderModal
          product={selectedProduct}
          existingCustomization={
            editingCartIndex !== null ? cart[editingCartIndex]?.customization : undefined
          }
          onClose={() => {
            setShowTacoBuilder(false);
            setSelectedProduct(null);
            setEditingCartIndex(null);
          }}
          onConfirm={(product, customization) => {
            addToCart(product, customization);
            setShowTacoBuilder(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Toast de notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">
          <div
            className={`px-6 py-4 rounded-2xl shadow-2xl ${
              toastType === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            <p className="font-semibold text-lg">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
