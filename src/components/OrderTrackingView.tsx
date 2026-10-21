import React, { useState } from 'react';
import { Order } from '../types/store';
import { Search, ArrowLeft, Package, Truck, CheckCircle2, Clock, AlertCircle, MapPin } from 'lucide-react';

interface OrderTrackingViewProps {
  orders: Order[];
  initialTrackingCode?: string;
  onBackToHome: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  orders,
  initialTrackingCode = '',
  onBackToHome,
}) => {
  const [searchInput, setSearchInput] = useState(
    initialTrackingCode || (orders[0]?.invoiceNumber || 'POSS-782103')
  );
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(
    orders.find((o) => o.invoiceNumber.toLowerCase() === (initialTrackingCode || 'POSS-782103').toLowerCase()) ||
    orders[0] ||
    null
  );
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) return;

    const found = orders.find((o) => o.invoiceNumber.toUpperCase() === query);
    setSearchedOrder(found || null);
    setHasSearched(true);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#365E52] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Belanja</span>
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#365E52]">
            Possensior Express Tracking
          </span>
          <h1 className="text-3xl font-extrabold text-[#1E2927] mt-1">
            Cek Resi & Status Pesanan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Pantau perjalanan pesanan apparel boxy Anda secara real-time langsung dari sistem gudang Possensior.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-md mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Masukkan Nomor Invoice (cth: POSS-782103)"
                className="w-full pl-10 pr-3 py-2.5 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#365E52] uppercase font-mono shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              Lacak
            </button>
          </form>

          {/* Quick preset links */}
          {orders.length > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400 flex-wrap">
              <span>Pesanan Terbaru:</span>
              {orders.slice(0, 3).map((ord) => (
                <button
                  key={ord.id}
                  onClick={() => {
                    setSearchInput(ord.invoiceNumber);
                    setSearchedOrder(ord);
                  }}
                  className="font-mono font-semibold text-[#365E52] underline hover:text-[#25433A] cursor-pointer"
                >
                  {ord.invoiceNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Container */}
        {searchedOrder ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-300">
            {/* Top Order Badge Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400">Nomor Invoice</span>
                <h3 className="text-xl font-mono font-extrabold text-[#1E2927]">
                  {searchedOrder.invoiceNumber}
                </h3>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Dibuat pada: {searchedOrder.createdAt}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#365E52]/10 text-[#365E52] border border-[#365E52]/20 capitalize">
                  Status: {searchedOrder.paymentStatus.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
              {/* Timeline (7 cols) */}
              <div className="md:col-span-7">
                <h4 className="text-sm font-bold text-[#1E2927] mb-6 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#365E52]" />
                  <span>Linimasa Pengiriman</span>
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {searchedOrder.timeline.map((step, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 group">
                      {/* Status Node Dot */}
                      <div
                        className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          step.completed
                            ? 'bg-[#365E52] border-white text-white shadow-xs'
                            : 'bg-white border-slate-300 text-slate-400'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h5
                            className={`text-xs font-bold ${
                              step.completed ? 'text-[#1E2927]' : 'text-slate-400'
                            }`}
                          >
                            {step.status}
                          </h5>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {step.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order & Recipient Details (5 cols) */}
              <div className="md:col-span-5 space-y-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#365E52]" />
                    <span>Penerima & Alamat</span>
                  </h5>
                  <p className="text-xs font-bold text-[#1E2927]">{searchedOrder.shipping?.fullName || 'Penerima'}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{searchedOrder.shipping?.phone || '-'}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {[
                      searchedOrder.shipping?.address,
                      searchedOrder.shipping?.district ? `Kec. ${searchedOrder.shipping.district}` : null,
                      searchedOrder.shipping?.subdistrict ? `Kel. ${searchedOrder.shipping.subdistrict}` : null,
                      searchedOrder.shipping?.city,
                      searchedOrder.shipping?.province,
                      searchedOrder.shipping?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <div className="mt-2 text-xs font-semibold text-[#365E52]">
                    Kurir: {(searchedOrder.shipping?.courier || 'JNE').toUpperCase()}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#365E52]" />
                    <span>Produk Dipesan</span>
                  </h5>
                  <div className="space-y-2">
                    {(searchedOrder.items || []).map((it) => (
                      <div key={it.id} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-800 line-clamp-1">{it.product?.name || 'Apparel'}</span>
                          <span className="text-[11px] text-slate-400">
                            {it.selectedSize} · {it.quantity} pcs
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-slate-700">
                          {formatRupiah((it.product?.price || 0) * it.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Metode Bayar:</span>
                    <span className="font-bold uppercase text-slate-700">{searchedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Pembayaran:</span>
                    <span className="font-bold text-[#365E52] font-mono">{formatRupiah(searchedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          hasSearched && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nomor Resi Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500 mt-1">
                Pastikan nomor invoice yang dimasukkan tepat (format: POSS-XXXXXX). Coba cek salah satu invoice demo di atas.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};
