import React from 'react';
import { Order } from '../types/store';
import { PossensiorWordmark } from './Logos';

interface ShippingReceiptCardProps {
  order: Order;
  className?: string;
}

export const ShippingReceiptCard: React.FC<ShippingReceiptCardProps> = ({
  order,
  className = '',
}) => {
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`printable-receipt-card bg-white border-2 border-black p-5 rounded-xl text-black ${className}`}
      style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
    >
      {/* Top Header Label */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
        <div className="flex items-center gap-2">
          <PossensiorWordmark className="h-6 w-auto text-black" color="#000000" />
          <span className="text-[11px] font-bold text-black uppercase tracking-wider">
            · Official Streetwear Fulfillment
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black font-mono tracking-wider block">
            {order.shipping.courier.toUpperCase()} EXPRESS
          </span>
          <span className="text-[11px] text-slate-700 font-mono font-semibold">
            No. Resi: {order.courierResi || order.trackingNumber}
          </span>
        </div>
      </div>

      {/* Barcode & Transit Tag */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-300 p-2.5 rounded-lg mb-3">
        <div>
          <span className="text-[9px] font-bold uppercase text-slate-500 block">Barcode Resi Paket</span>
          {/* Crisp Vector Barcode representation */}
          <div className="flex items-center gap-[2px] h-7 my-0.5">
            {[4, 2, 5, 2, 3, 6, 2, 4, 2, 5, 3, 2, 6, 2, 4, 3, 5, 2, 3, 4, 6, 2, 3, 5, 2, 4, 3, 6, 2].map((w, i) => (
              <div
                key={i}
                className="bg-black h-full"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-black font-bold tracking-widest block">
            *{order.courierResi || order.invoiceNumber}*
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Tujuan Pengiriman</span>
          <span className="text-base font-extrabold uppercase tracking-tight text-black font-mono">
            {order.shipping.city}
          </span>
          <span className="text-[10px] font-mono block text-slate-600">
            KODEPOS: {order.shipping.postalCode || '12190'}
          </span>
        </div>
      </div>

      {/* Sender & Receiver Info Split */}
      <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-300 pb-3 mb-3">
        {/* Penerima */}
        <div className="pr-3 border-r border-slate-300">
          <span className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">
            Kepada (Penerima):
          </span>
          <h4 className="font-extrabold text-sm text-black">{order.shipping.fullName}</h4>
          <p className="font-mono font-semibold text-slate-800 mt-0.5">{order.shipping.phone}</p>
          <p className="text-slate-800 mt-1 leading-relaxed text-xs">
            {order.shipping.address}, {order.shipping.city} {order.shipping.province || ''} {order.shipping.postalCode}
          </p>
          {order.shipping.notes && (
            <div className="text-[11px] text-black bg-slate-100 p-2 rounded mt-2 border border-slate-300 font-medium">
              <strong className="block text-[10px] uppercase text-slate-600">Catatan Pengiriman:</strong>
              {order.shipping.notes}
            </div>
          )}
        </div>

        {/* Pengirim */}
        <div className="pl-3">
          <span className="text-[10px] font-bold uppercase text-slate-600 block mb-0.5">
            Dari (Pengirim):
          </span>
          <h4 className="font-bold text-black">POSSENSIOR APPAREL WAREHOUSE</h4>
          <p className="font-mono font-semibold text-slate-800 mt-0.5">0812-3456-7890</p>
          <p className="text-slate-800 mt-1 text-xs leading-relaxed">
            Jl. Fatmawati No. 88, Cilandak, Jakarta Selatan 12430
          </p>
          <div className="mt-2.5 p-2 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono flex justify-between">
            <span className="text-slate-600">No. Invoice:</span>
            <span className="font-bold text-black">{order.invoiceNumber}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Tanggal Pesanan: {order.createdAt}
          </div>
        </div>
      </div>

      {/* Items List with details: Product, Variation, Qty, Unit Price, and Item Subtotal */}
      <div className="text-xs">
        <span className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
          Daftar Produk Pesanan ({totalQuantity} pcs apparel boxy):
        </span>
        <div className="divide-y divide-slate-200 border border-slate-300 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-700 grid grid-cols-12 uppercase">
            <span className="col-span-6">Produk & Variasi</span>
            <span className="col-span-2 text-center">Harga Satuan</span>
            <span className="col-span-2 text-center">Qty</span>
            <span className="col-span-2 text-right">Subtotal</span>
          </div>
          {order.items.map((item) => (
            <div key={item.id} className="p-2.5 grid grid-cols-12 items-center bg-white text-xs">
              <div className="col-span-6">
                <span className="font-bold text-black block">{item.product.name}</span>
                <span className="text-slate-600 text-[11px]">
                  Size: {item.selectedSize} · Warna: {item.selectedColor}
                </span>
              </div>
              <span className="col-span-2 text-center font-mono text-slate-700">
                {formatRupiah(item.product.price)}
              </span>
              <span className="col-span-2 text-center font-mono font-bold text-black">
                {item.quantity} pcs
              </span>
              <span className="col-span-2 text-right font-mono font-bold text-black">
                {formatRupiah(item.product.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Breakdown: Subtotal, Ongkir, Diskon, Total & Status */}
      <div className="mt-3 pt-3 border-t border-slate-300 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
          <div className="space-y-1 text-slate-700">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold">Status Pesanan:</span>
              <span className="font-bold uppercase text-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                {order.paymentStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[11px]">
              <span className="font-semibold">Metode Pembayaran: </span>
              <strong className="uppercase text-black">
                {order.paymentMethod === 'qris'
                  ? 'QRIS Manual (Scan QR)'
                  : `Transfer Bank (${order.selectedBank?.name || 'Manual'})`}
              </strong>
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              Resi Pengiriman Resmi POSSENSIOR
            </div>
          </div>

          <div className="space-y-1 font-mono text-right bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Subtotal Produk:</span>
              <span className="font-semibold text-black">{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-xs">
              <span>Biaya Kirim ({order.shipping.courier.toUpperCase()}):</span>
              <span className="font-semibold text-black">{formatRupiah(order.shippingCost)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 text-xs">
                <span>Diskon Kupon Promo:</span>
                <span className="font-semibold">- {formatRupiah(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-black pt-1.5 mt-1 text-xs font-bold text-black">
              <span className="uppercase text-[11px]">Total Pembayaran:</span>
              <span className="text-sm font-extrabold text-black">{formatRupiah(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
