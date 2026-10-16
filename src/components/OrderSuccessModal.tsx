import React from 'react';
import { Order } from '../types/store';
import { CheckCircle2, ArrowRight, Search, Copy, Check } from 'lucide-react';
import { PossensiorIcon } from './Logos';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onTrackOrder: (invoice: string) => void;
  onContinueShopping: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onTrackOrder,
  onContinueShopping,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !order) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(order.invoiceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 text-center border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-[#365E52]/10 text-[#365E52] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-[#365E52]">
          Pesanan Berhasil Dibuat
        </span>

        <h2 className="text-2xl font-extrabold text-[#1E2927] mt-1">
          Terima Kasih Atas Pesanan Anda!
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          Pesanan Anda telah kami catat di warehouse Possensior. Simpan nomor invoice berikut untuk mengecek status resi pengiriman.
        </p>

        {/* Invoice Highlight Box */}
        <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
          <div className="text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Nomor Invoice Resmi</span>
            <span className="text-lg font-mono font-extrabold text-[#365E52] tracking-wider block">
              {order.invoiceNumber}
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>

        {/* Summary Info */}
        <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100 text-left space-y-1 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-500">Penerima:</span>
            <span className="font-semibold">{order.shipping.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Metode Bayar:</span>
            <span className="font-semibold uppercase">{order.paymentMethod === 'qris' ? 'QRIS Instan' : `Transfer ${order.selectedBank?.name || 'Bank'}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Transaksi:</span>
            <span className="font-bold text-[#365E52] font-mono">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => onTrackOrder(order.invoiceNumber)}
            className="w-full py-3.5 bg-[#365E52] hover:bg-[#2A4B41] text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Lacak Status di Cek Resi Sekarang</span>
          </button>

          <button
            onClick={onContinueShopping}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Kembali ke Beranda Belanja
          </button>
        </div>
      </div>
    </div>
  );
};
