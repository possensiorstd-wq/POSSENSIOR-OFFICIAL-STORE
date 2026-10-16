import React, { useState } from 'react';
import { CartItem } from '../types/store';
import { X, Trash2, ArrowRight, ShoppingBag, Tag, Check } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onProceedCheckout: () => void;
  discount: number;
  onApplyVoucher: (code: string) => boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedCheckout,
  discount,
  onApplyVoucher,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(discount > 0);
  const [couponMessage, setCouponMessage] = useState<string | null>(
    discount > 0 ? 'Kupon diskon 10% aktif!' : null
  );

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discountAmount = discount > 0 ? Math.round(subtotal * (discount / 100)) : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const success = onApplyVoucher(couponCode.trim().toUpperCase());
    if (success) {
      setCouponApplied(true);
      setCouponMessage('Kode promo berhasil diterapkan (-10%)');
    } else {
      setCouponMessage('Kode promo tidak valid (Coba: POSS10)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#365E52]" />
            <h2 className="text-base font-bold text-[#1E2927]">Keranjang Belanja</h2>
            <span className="text-xs text-slate-400 font-medium font-mono">
              ({items.reduce((acc, i) => acc + i.quantity, 0)} item)
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup keranjang"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Pilih apparel boxy favorit Anda dari koleksi terbaru Possensior.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-[#365E52] text-white text-xs font-semibold rounded-lg hover:bg-[#2A4B41] transition-colors cursor-pointer"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70"
              >
                {/* Product thumbnail */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="w-18 h-18 object-cover rounded-xl bg-white border border-slate-200 shrink-0"
                />

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2927] line-clamp-1">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ukuran: <span className="font-bold text-slate-700">{item.selectedSize}</span> · {item.selectedColor}
                    </p>
                    <p className="text-xs font-bold text-[#365E52] mt-1 font-mono tabular-nums">
                      {formatRupiah(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/50">
                    <div className="flex items-center border border-slate-200 bg-white rounded-md overflow-hidden text-xs">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2.5 py-0.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2.5 py-0.5 font-bold font-mono text-[11px] text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2.5 py-0.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer"
                      title="Hapus dari keranjang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-white space-y-3">
            {/* Voucher Code Form */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Kode Promo (cth: POSS10)"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52] uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Terapkan
              </button>
            </form>

            {couponMessage && (
              <p className={`text-[11px] font-medium flex items-center gap-1 ${
                couponApplied ? 'text-[#365E52]' : 'text-amber-600'
              }`}>
                {couponApplied && <Check className="w-3 h-3" />}
                <span>{couponMessage}</span>
              </p>
            )}

            {/* Price breakdown */}
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Produk</span>
                <span className="font-mono tabular-nums">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#365E52] font-medium">
                  <span>Diskon Promo (10%)</span>
                  <span className="font-mono tabular-nums">-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#1E2927] pt-2 border-t border-slate-100">
                <span>Total Belanja</span>
                <span className="font-mono tabular-nums text-base text-[#365E52]">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="w-full py-3.5 bg-[#365E52] hover:bg-[#2A4B41] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
