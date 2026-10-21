import React, { useEffect } from 'react';
import { Order } from '../types/store';
import { Printer, X, AlertCircle } from 'lucide-react';
import { ShippingReceiptCard } from './ShippingReceiptCard';

interface SingleReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const SingleReceiptPrintModal: React.FC<SingleReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err: any) {
      console.error('Print dialog failed', err);
      alert(
        `Gagal membuka dialog cetak browser: ${err?.message || 'Akses cetak dibatasi oleh pengaturan browser.'}`
      );
    }
  };

  // Automatically trigger window.print() once the modal renders the receipt
  useEffect(() => {
    if (isOpen && order) {
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (err: any) {
          console.error('Auto print trigger failed', err);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, order]);

  return (
    <div className="print-modal-backdrop fixed inset-0 z-60 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="print-modal-window relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Controls Bar - Hidden completely during browser print */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#365E52] flex items-center justify-center text-white">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                Cetak Resi: {order.invoiceNumber}
              </h3>
              <span className="text-[11px] text-slate-400">
                Penerima: {order.shipping?.fullName || 'Penerima'} ({order.shipping?.city || '-'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              title="Kirim dokumen resi ke printer atau simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Sekarang (Print)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Tutup pratinjau resi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informational Tip - Hidden during print */}
        <div className="no-print px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 text-[11px] text-[#365E52] font-medium flex items-center justify-between print:hidden">
          <span>
            Dialog cetak browser akan terbuka otomatis. Jika tidak muncul, klik tombol <strong>"Cetak Sekarang (Print)"</strong>.
          </span>
          <span className="font-mono text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
            Hanya 1 resi ini yang tercetak
          </span>
        </div>

        {/* Dedicated Printable Area: only this order's card is rendered */}
        <div className="possensior-print-zone flex-1 overflow-y-auto p-6 bg-slate-100 print:bg-white print:p-0">
          <ShippingReceiptCard order={order} />
        </div>
      </div>
    </div>
  );
};
