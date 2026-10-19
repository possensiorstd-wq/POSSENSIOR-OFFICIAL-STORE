import React, { useState, useEffect } from 'react';
import { Product, ProductSize } from '../types/store';
import { X, Check, ShoppingBag, ShieldCheck, Truck, Ruler, Palette } from 'lucide-react';
import { SIZE_CHART } from '../data/products';
import { PossensiorIcon } from './Logos';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, size: ProductSize, color: string, quantity: number) => void;
  onBuyNow: (product: Product, size: ProductSize, color: string, quantity: number) => void;
}

// Clean deduplication strictly using the colors saved on the product
function deduplicateColors(
  colors: { name: string; hex: string }[] = []
): { name: string; hex: string }[] {
  const seen = new Set<string>();
  const unique: { name: string; hex: string }[] = [];

  for (const c of colors) {
    if (!c || !c.name) continue;
    const nameTrimmed = c.name.trim();
    if (!nameTrimmed) continue;
    const key = nameTrimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push({
        name: nameTrimmed,
        hex: c.hex && c.hex.trim() ? c.hex.trim() : '#18181B',
      });
    }
  }

  return unique.length > 0 ? unique : [{ name: 'Standard', hex: '#18181B' }];
}

function getProductSizeChart(
  product: Product
): { size: string; chest: string; length: string; shoulder: string; sleeve: string }[] {
  if (product.customSizeChart && product.customSizeChart.length > 0) {
    return product.customSizeChart;
  }
  if (product.sizes && product.sizes.length > 0) {
    return product.sizes.map((sz) => {
      const match = SIZE_CHART.find((row) => row.size.toUpperCase() === sz.toUpperCase());
      return (
        match || {
          size: sz,
          chest: '57 cm',
          length: '71 cm',
          shoulder: '55 cm',
          sleeve: '23 cm',
        }
      );
    });
  }
  return SIZE_CHART;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [activeImage, setActiveImage] = useState(product?.image || '');
  const [availableColors, setAvailableColors] = useState<{ name: string; hex: string }[]>([]);
  const [selectedColor, setSelectedColor] = useState('Standard');
  const [selectedSize, setSelectedSize] = useState<ProductSize>('L');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Synchronize strictly with the product's saved data — NO auto-extracted image colors
  useEffect(() => {
    if (!product) return;
    setActiveImage(product.image);
    setImageError(false);

    // 1. Colors strictly from product.colors without duplicates or artificial image analysis
    const uniqueColors = deduplicateColors(product.colors);
    setAvailableColors(uniqueColors);
    setSelectedColor(uniqueColors[0]?.name || 'Standard');

    // 2. Sizes strictly from product's custom size chart or defined sizes
    const activeChart = getProductSizeChart(product);
    const sizes = activeChart.map((r) => r.size);
    setSelectedSize(sizes[0] || 'L');
  }, [product]);

  const activeSizeChart = React.useMemo(() => {
    if (!product) return [];
    return getProductSizeChart(product);
  }, [product]);

  const availableSizes = React.useMemo(() => {
    return activeSizeChart.map((r) => r.size);
  }, [activeSizeChart]);

  if (!isOpen || !product) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuy = () => {
    onBuyNow(product, selectedSize, selectedColor, quantity);
  };

  const allImages = [product.image, ...(product.additionalImages || [])].filter(Boolean);

  const handleColorSelect = (colorName: string, colorIndex: number) => {
    setSelectedColor(colorName);
    if (allImages[colorIndex]) {
      setActiveImage(allImages[colorIndex]);
      setImageError(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 flex flex-col md:flex-row max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/90 hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer"
          aria-label="Tutup detail produk"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Product Image Gallery */}
        <div className="md:w-1/2 bg-stone-100 relative min-h-[300px] md:min-h-full flex flex-col items-center justify-center p-4">
          <div className="w-full flex-1 flex items-center justify-center">
            {!imageError ? (
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full max-h-[460px] object-cover object-center rounded-2xl shadow-xs"
              />
            ) : (
              <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-gradient-to-br from-[#EAEFEA] to-[#D5E1DC] p-8 text-center rounded-2xl">
                <PossensiorIcon className="w-24 h-24 text-[#365E52] opacity-80 mb-3" color="#365E52" />
                <span className="text-sm font-bold text-[#365E52] uppercase tracking-wider">{product.name}</span>
                <span className="text-xs text-slate-500 mt-1">{product.material}</span>
              </div>
            )}
          </div>

          {/* Additional detail thumbnails */}
          {allImages.length > 1 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImage === img ? 'border-[#365E52] ring-2 ring-[#365E52]/20' : 'border-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Special collection badge */}
          {product.tag && (
            <div className="absolute top-6 left-6 bg-[#365E52] text-white text-xs font-semibold py-1 px-3 rounded-md shadow-sm">
              {product.tag}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Category and Fit Metadata */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="capitalize">{product.category}</span>
              <span aria-hidden="true">·</span>
              <span>{product.material}</span>
            </div>

            <h2 className="text-2xl font-extrabold text-[#1E2927] leading-tight">
              {product.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">{product.subtitle}</p>

            {/* Price section */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-[#365E52] font-mono tabular-nums">
                {formatRupiah(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through font-mono tabular-nums">
                  {formatRupiah(product.originalPrice)}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Pilihan Warna Resmi dari Owner Control — 1 swatch per warna unik */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#365E52]" />
                  <span>
                    Pilihan Warna: <strong className="text-[#365E52] font-semibold">{selectedColor}</strong>
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {availableColors.length} varian tersedia
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {availableColors.map((color, idx) => (
                  <button
                    key={`${color.name}-${color.hex}-${idx}`}
                    type="button"
                    onClick={() => handleColorSelect(color.name, idx)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedColor === color.name
                        ? 'border-[#365E52] bg-[#365E52]/10 text-[#365E52] font-bold ring-1 ring-[#365E52]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-2xs shrink-0 inline-block"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector + Size Guide Toggle */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Pilih Ukuran Boxy</span>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="text-xs font-semibold text-[#365E52] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span>{showSizeGuide ? 'Tutup Panduan' : 'Panduan Ukuran Boxy'}</span>
                </button>
              </div>

              {/* Size guide interactive table: displays only sizes saved on this product */}
              {showSizeGuide && (
                <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <p className="font-bold text-slate-700 mb-1.5">Tabel Ukuran (Centimeter):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-center font-mono text-[11px] bg-white rounded-lg border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                          <th className="p-1.5">Size</th>
                          <th className="p-1.5">Dada</th>
                          <th className="p-1.5">Panjang</th>
                          <th className="p-1.5">Bahu</th>
                          <th className="p-1.5">Lengan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSizeChart.map((row) => (
                          <tr key={row.size} className="border-b border-slate-100 last:border-none">
                            <td className="p-1.5 font-bold text-[#365E52]">{row.size}</td>
                            <td className="p-1.5">{row.chest}</td>
                            <td className="p-1.5">{row.length}</td>
                            <td className="p-1.5">{row.shoulder}</td>
                            <td className="p-1.5">{row.sleeve}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">
                    *Toleransi ukuran 1–2 cm. Potongan Boxy lebar dan sedikit cropped.
                  </p>
                </div>
              )}

              {/* Size buttons: dynamically rendered from activeSizeChart */}
              <div className="flex items-center gap-2 flex-wrap">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-12 py-2 px-3.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'border-[#365E52] bg-[#365E52] text-white shadow-xs'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Jumlah Beli</span>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-xs font-mono font-bold text-slate-800">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleAdd}
                className="py-3 px-4 bg-white border border-[#365E52] text-[#365E52] hover:bg-[#365E52]/5 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Keranjang</span>
              </button>

              <button
                type="button"
                onClick={handleBuy}
                className="py-3 px-4 bg-[#365E52] hover:bg-[#2A4B41] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Beli Sekarang</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#365E52]" />
                <span>Garansi Resmi Tukar Size</span>
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#365E52]" />
                <span>Siap Kirim Hari Ini</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
