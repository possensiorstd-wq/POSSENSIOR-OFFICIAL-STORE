import React, { useRef } from 'react';
import { Order } from '../types/store';
import { Printer, X } from 'lucide-react';
import { ShippingReceiptCard } from './ShippingReceiptCard';
import { printReceiptElement } from '../utils/printReceipts';

interface BatchReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const BatchReceiptPrintModal: React.FC<BatchReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !orders || orders.length === 0) return null;

  const handlePrint = () => {
    try {
      if (printAreaRef.current) {
        printReceiptElement(printAreaRef.current, `Resi-Batch-${orders.length}-Pesanan`);
      } else {
        window.print();
      }
    } catch (err: any) {
      console.error('Batch print failed', err);
      window.print();
    }
  };

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="print-modal-window relative bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Controls Bar - Hidden completely during browser print */}
        <div className="no-print p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Cetak Dokumen Resi Sekaligus ({orders.length} Pesanan)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              title="Langsung cetak dokumen resi ke printer / simpan PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dokumen</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dedicated Printable Area */}
        <div
          ref={printAreaRef}
          className="possensior-print-zone print-modal-scroll flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 print:bg-white print:p-0"
        >
          {orders.map((order, idx) => (
            <div
              key={order.id}
              className={idx < orders.length - 1 ? 'print-page-break' : ''}
            >
              <ShippingReceiptCard order={order} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
