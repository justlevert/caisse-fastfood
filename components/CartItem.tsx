'use client';

import React, { useMemo } from 'react';
import { CartItem as CartItemType } from '@/types/database.types';
import { useCurrency } from '@/lib/utils/currency';

interface CartItemProps {
  item: CartItemType;
  index: number;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
}

const CartItem = React.memo(({ item, index, onUpdateQuantity, onRemove, onEdit }: CartItemProps) => {
  const { symbol: currencySymbol } = useCurrency();
  
  const itemPrice = useMemo(() => {
    return item.customization
      ? item.customization.taille.prix +
        item.customization.extras.reduce((sum, e) => sum + e.prix, 0) +
        (item.customization.gratin?.prix || 0)
      : item.product.prix;
  }, [item.customization, item.product.prix]);

  const totalPrice = useMemo(() => {
    return itemPrice * item.quantite;
  }, [itemPrice, item.quantite]);

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-5 border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3 lg:mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-sm lg:text-base text-gray-800">{item.product.nom}</h3>
          {item.customization && (
            <div className="text-xs text-gray-600 mt-2 space-y-1">
              <p>• Taille: {item.customization.taille.nom}</p>
              <p>• Viandes: {item.customization.viandes.map(v => v.nom).join(', ')}</p>
              <p>• Sauces: {item.customization.sauces.map(s => s.nom).join(', ')}</p>
              {item.customization.extras.length > 0 && (
                <p>• Extras: {item.customization.extras.map(e => e.nom).join(', ')}</p>
              )}
              {item.customization.retraits.length > 0 && (
                <p>• Sans: {item.customization.retraits.map(r => r.nom).join(', ')}</p>
              )}
              {item.customization.gratin && (
                <p>• Gratinage: {item.customization.gratin.nom}</p>
              )}
            </div>
          )}
          <p className="text-xs lg:text-sm text-gray-500 mt-2">
            {itemPrice.toFixed(2)} {currencySymbol} × {item.quantite}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 ml-3">
          <div className="flex gap-2">
            {item.customization && onEdit && (
              <button
                onClick={() => onEdit(index)}
                className="text-blue-500 hover:text-blue-700 text-lg font-semibold"
                title="Modifier"
              >
                ✏️
              </button>
            )}
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 text-2xl font-bold leading-none"
            >
              ×
            </button>
          </div>
          <p className="font-bold text-orange-600 text-base lg:text-lg">
            {totalPrice.toFixed(2)} {currencySymbol}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateQuantity(index, -1)}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-200 hover:bg-gray-300 border-2 border-gray-300 hover:border-gray-400 font-bold text-xl lg:text-2xl transition-all duration-200 active:scale-95 flex items-center justify-center"
          >
            −
          </button>
          <span className="w-12 lg:w-14 text-center font-bold text-lg lg:text-xl">
            {item.quantite}
          </span>
          <button
            onClick={() => onUpdateQuantity(index, 1)}
            className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-2 border-orange-400 shadow-md hover:shadow-lg font-bold text-xl lg:text-2xl text-white transition-all duration-200 active:scale-95 flex items-center justify-center"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;
