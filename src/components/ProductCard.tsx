import React, { useState } from 'react';
import { Product } from '../types/store';
import { Eye, Plus, Sparkles } from 'lucide-react';
import { PossensiorIcon } from './Logos';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onQuickAdd,
}) => {
  const [imageError, setImageError] = useState(false);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      {/* Product Image Area */}
      <div className="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden flex items-center justify-center">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          /* Styled Fallback Container (Zero-Broken-Image Policy) */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAEFEA] to-[#D5E1DC] p-6 text-center">
            <PossensiorIcon className="w-16 h-16 text-[#365E52] opacity-80 mb-2" color="#365E52" />
            <span className="text-xs font-bold text-[#365E52] uppercase tracking-wider">{product.name}</span>
            <span className="text-[11px] text-slate-500 mt-1">{product.material}</span>
          </div>
        )}

        {/* Quiet Unboxed Badge for Special Items */}
        {product.tag && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs border border-slate-200/80 text-[#365E52] text-[11px] font-bold py-0.5 px-2.5 rounded-md shadow-xs">
            {product.tag}
          </div>
        )}

        {/* Quick View Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center p-4">
          <span className="bg-white/95 text-slate-800 text-xs font-semibold py-2 px-4 rounded-lg shadow-md flex items-center gap-1.5 transition-transform group-hover:scale-100 scale-95">
            <Eye className="w-3.5 h-3.5 text-[#365E52]" />
            <span>Lihat Detail</span>
          </span>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata: Category & Fit (Unboxed clean text) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="capitalize">{product.category}</span>
            <span aria-hidden="true">·</span>
            <span>{product.fit}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-base font-bold text-[#1E2927] group-hover:text-[#365E52] transition-colors leading-snug line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {product.subtitle}
          </p>
        </div>

        {/* Pricing & Quick Add Button */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-[#1E2927] font-mono tabular-nums">
              {formatRupiah(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-slate-400 line-through font-mono tabular-nums">
                {formatRupiah(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            className="p-2 text-slate-600 hover:text-white bg-slate-100 hover:bg-[#365E52] rounded-lg transition-colors cursor-pointer"
            aria-label={`Pilih ukuran untuk ${product.name}`}
            title="Pilih ukuran dan beli"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
