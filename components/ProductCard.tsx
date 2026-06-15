'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types/database.types';
import { useCurrency } from '@/lib/utils/currency';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard = React.memo(({ product, onClick }: ProductCardProps) => {
  const { symbol: currencySymbol } = useCurrency();
  
  return (
    <button
      onClick={() => onClick(product)}
      className="bg-white rounded-xl sm:rounded-2xl shadow-md border-2 border-gray-200 overflow-hidden hover:shadow-xl hover:border-orange-400 transition-all duration-200 cursor-pointer active:scale-95 p-3 sm:p-4 lg:p-5"
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 flex items-center justify-center relative overflow-hidden shadow-md">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.nom}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-3xl sm:text-4xl lg:text-5xl">🍔</div>
        )}
      </div>
      <h3 className="font-bold text-gray-800 text-sm sm:text-base lg:text-lg mb-2 text-center leading-tight">
        {product.nom}
      </h3>
      <div className="flex justify-center">
        <span className="inline-block bg-orange-100 text-orange-600 font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm lg:text-base">
          {product.prix.toFixed(2)} {currencySymbol}
        </span>
      </div>
    </button>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
