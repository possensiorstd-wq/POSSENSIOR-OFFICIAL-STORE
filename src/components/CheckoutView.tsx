import React, { useState, useEffect } from 'react';
import { CartItem, ShippingInfo, PaymentType, BankAccount, Order } from '../types/store';
import { BANK_ACCOUNTS, QRIS_MANUAL_CONFIG } from '../data/products';
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  Truck, 
  Upload, 
  AlertCircle,
  Clock,
  Sparkles,
  Download,
  MessageCircle
} from 'lucide-react';
import { PossensiorIcon } from './Logos';
import { 
  saveOrderToDatabase, 
  fetchPaymentQrisUrl, 
  getPaymentQrisPublicUrl, 
  DEFAULT_PAYMENT_QRIS_FILE 
} from '../lib/supabase';

interface CheckoutViewProps {
  items: CartItem[];
  discount: number;
  onBackToStore: () => void;
  onOrderCompleted: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  items,
  discount,
  onBackToStore,
  onOrderCompleted,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [subdistrict, setSubdistrict] = useState('');
  const [city, setCity] = useState('Jakarta Selatan');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('12190');
  const [courier, setCourier] = useState<'jne' | 'jnt' | 'spx'>('jne');
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('qris');
  const [selectedBank, setSelectedBank] = useState<BankAccount>(BANK_ACCOUNTS[0]);
  const [copiedBank, setCopiedBank] = useState(false);
  const [downloadedQRIS, setDownloadedQRIS] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedConfirmedOrder, setSavedConfirmedOrder] = useState<Order | null>(null);

  // Authentic Supabase Storage QRIS state (POSSENSIOR MEDIA/payment/QRIS MANUAL.jpeg)
  const [qrisImageUrl, setQrisImageUrl] = useState<string>(
    QRIS_MANUAL_CONFIG.image || getPaymentQrisPublicUrl(DEFAULT_PAYMENT_QRIS_FILE)
  );
  const [isQrisLoading, setIsQrisLoading] = useState(false);
  const [qrisLoadError, setQrisLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadQrisFromSupabase() {
      setIsQrisLoading(true);
      setQrisLoadError(false);
      try {
        const res = await fetchPaymentQrisUrl();
        if (isMounted && res.url) {
          setQrisImageUrl(res.url);
        }
      } catch (err) {
        console.warn('Gagal mengambil URL QRIS Supabase:', err);
      } finally {
        if (isMounted) {
          setIsQrisLoading(false);
        }
      }
    }

    loadQrisFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate pricing: 5% other fees as per Possensior original system
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = discount > 0 ? Math.round(subtotal * (discount / 100)) : 0;
  const otherFees = Math.round(subtotal * 0.05);
  const shippingCost = 0; // Included in 5% other fees
  const grandTotal = Math.max(0, subtotal - discountAmount + otherFees);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(grandTotal));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(selectedBank.accountNumber);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleDownloadQRIS = async () => {
    try {
      const targetSrc = qrisImageUrl || QRIS_MANUAL_CONFIG.image || getPaymentQrisPublicUrl(DEFAULT_PAYMENT_QRIS_FILE);
      const response = await fetch(targetSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'QRIS-POSSENSIOR.jpeg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadedQRIS(true);
      setTimeout(() => setDownloadedQRIS(false), 3000);
    } catch {
      const link = document.createElement('a');
      link.href = qrisImageUrl || QRIS_MANUAL_CONFIG.image || getPaymentQrisPublicUrl(DEFAULT_PAYMENT_QRIS_FILE);
      link.download = 'QRIS-POSSENSIOR.jpeg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedQRIS(true);
      setTimeout(() => setDownloadedQRIS(false), 3000);
    }
  };

  const processOrderSubmission = async (method: 'qris' | 'bank_transfer') => {
    if (isSubmitting) return;

    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setFormError('Harap lengkapi nama penerima, nomor WhatsApp/telepon, alamat pengiriman, dan kota/kabupaten.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      let confirmedOrder = savedConfirmedOrder;

      // Only perform database insert if order was not already saved during this checkout session
      if (!confirmedOrder) {
        const orderToSave: Order = {
          id: `order-${Date.now()}`,
          invoiceNumber: '', // Official number will be assigned by Supabase database (PS-0000X)
          createdAt: new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date()),
          items: [...items],
          subtotal,
          otherFees,
          shippingCost: 0,
          discount: discountAmount,
          total: grandTotal,
          shipping: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            district: district.trim(),
            subdistrict: subdistrict.trim(),
            city: city.trim(),
            province,
            postalCode: postalCode.trim(),
            courier,
            shippingCost: 0,
            notes: notes.trim(),
          },
          paymentMethod: method,
          selectedBank: method === 'bank_transfer' ? selectedBank : undefined,
          paymentStatus: 'menunggu_pembayaran',
          trackingNumber: '',
          proofUploaded: true,
          timeline: [
            {
              status: 'Pesanan Dibuat',
              description: 'Pesanan berhasil dicatat di sistem Possensior.',
              timestamp: 'Baru saja',
              completed: true,
            },
            {
              status: method === 'qris' ? 'Menunggu Konfirmasi QRIS' : 'Menunggu Konfirmasi Transfer',
              description:
                method === 'qris'
                  ? 'Pesanan telah dicatat di database Supabase dan menunggu bukti pembayaran QRIS melalui WhatsApp.'
                  : `Menunggu transfer ke rekening ${selectedBank.name} (${selectedBank.accountNumber}) dan verifikasi bukti via WhatsApp.`,
              timestamp: 'Menunggu tindakan',
              completed: false,
              current: true,
            },
            {
              status: 'Pengemasan & Quality Control',
              description: 'Barang sedang dipersiapkan dan diinspeksi di warehouse Possensior.',
              timestamp: 'Menunggu',
              completed: false,
            },
            {
              status: 'Pengiriman Kurir',
              description: `Akan dikirim menggunakan ${courier.toUpperCase()}.`,
              timestamp: 'Estimasi 1-2 hari',
              completed: false,
            },
            {
              status: 'Pesanan Selesai',
              description: 'Paket telah sampai di alamat tujuan.',
              timestamp: 'Estimasi 2-3 hari',
              completed: false,
            },
          ],
        };

        // Direct write to public.possensior_orders table first
        const { order: newlySavedOrder, error: dbError } = await saveOrderToDatabase(orderToSave);

        if (dbError || !newlySavedOrder) {
          setIsSubmitting(false);
          setFormError(
            `Gagal menyimpan pesanan ke database Supabase: ${dbError || 'Terjadi gangguan koneksi'}. Silakan coba tekan tombol kembali untuk mencoba lagi. Data checkout Anda tetap tersimpan dan tidak akan hilang.`
          );
          return;
        }

        confirmedOrder = newlySavedOrder;
        setSavedConfirmedOrder(newlySavedOrder);
      }

      const productListText = items
        .map(
          (it, idx) =>
            `  ${idx + 1}. *${it.product.name}*\n     Size: ${it.selectedSize} · Warna: ${it.selectedColor} · Qty: ${it.quantity} pcs (${formatRupiah(it.product.price * it.quantity)})`
        )
        .join('\n');

      const addressFull = `${address.trim()}${district ? `, Kec. ${district.trim()}` : ''}${subdistrict ? `, Kel. ${subdistrict.trim()}` : ''}, ${city.trim()}, ${province} ${postalCode.trim()}`;

      let waMessage = '';
      if (method === 'qris') {
        waMessage = 
`Halo Admin POSSENSIOR, saya ingin konfirmasi pesanan dan mengirimkan bukti pembayaran QRIS.

📦 *INFORMASI PESANAN*
• No. Pesanan Resmi: *${confirmedOrder.invoiceNumber}*
• Tanggal: ${confirmedOrder.createdAt}
• Total Tagihan: *${formatRupiah(grandTotal)}* (QRIS Manual)

👤 *DATA PENERIMA*
• Nama Penerima: ${fullName.trim()}
• No. WhatsApp / HP: ${phone.trim()}
• Alamat Pengiriman: ${addressFull}
• Ekspedisi: ${courier.toUpperCase()}
${notes.trim() ? `• Catatan Pengiriman: ${notes.trim()}\n` : ''}
👕 *DAFTAR PRODUK*
${productListText}

💳 *METODE PEMBAYARAN*
• Metode: QRIS Manual POSSENSIOR
• Total Yang Ditransfer: *${formatRupiah(grandTotal)}*
• Status: *Menunggu Verifikasi Pembayaran*

--------------------------------------------
📌 *PENTING*:
Saya melampirkan foto / tangkapan layar bukti transfer atau pembayaran QRIS pada pesan ini. Mohon admin segera memverifikasi pesanan saya. Terima kasih!`;
      } else {
        waMessage = 
`Halo Admin POSSENSIOR, saya ingin konfirmasi pesanan dan mengirimkan bukti pembayaran transfer bank.

📦 *INFORMASI PESANAN*
• No. Pesanan Resmi: *${confirmedOrder.invoiceNumber}*
• Tanggal: ${confirmedOrder.createdAt}
• Total Tagihan: *${formatRupiah(grandTotal)}*

👤 *DATA PENERIMA*
• Nama Penerima: ${fullName.trim()}
• No. WhatsApp / HP: ${phone.trim()}
• Alamat Pengiriman: ${addressFull}
• Ekspedisi: ${courier.toUpperCase()}
${notes.trim() ? `• Catatan Pengiriman: ${notes.trim()}\n` : ''}
👕 *DAFTAR PRODUK*
${productListText}

💳 *METODE PEMBAYARAN*
• Metode: Transfer Bank Manual
• Bank Tujuan: *${selectedBank.name}*
• No. Rekening: *${selectedBank.accountNumber}* (a/n ${selectedBank.accountHolder})
• Nominal Yang Ditransfer: *${formatRupiah(grandTotal)}*
• Status: *Menunggu Verifikasi Pembayaran*

--------------------------------------------
📌 *PENTING*:
Saya melampirkan foto / bukti transfer bank pada pesan WhatsApp ini. Mohon admin memeriksa pembayaran dan memproses pesanan saya. Terima kasih!`;
      }

      const waUrl = `https://wa.me/6285777240570?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      setIsSubmitting(false);
      onOrderCompleted(confirmedOrder);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(
        `Terjadi kendala saat memproses pesanan: ${err?.message || 'Error tidak diketahui'}. Data Anda tetap aman, silakan coba kembali.`
      );
    }
  };

  const handleSendProofViaWhatsApp = () => {
    processOrderSubmission(paymentMethod);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'qris') {
      processOrderSubmission('qris');
    } else {
      processOrderSubmission('bank_transfer');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={onBackToStore}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#365E52] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog Produk</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-8 border-b border-slate-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E2927]">
              Checkout & Pembayaran
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Selesaikan detail pengiriman dan pembayaran resmi Possensior.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#365E52] bg-[#365E52]/10 py-1.5 px-3 rounded-lg w-fit">
            <ShieldCheck className="w-4 h-4" />
            <span>Transaksi Dijamin Aman & Terenkripsi</span>
          </div>
        </div>

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Shipping & Payment Options (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer & Shipping Details */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <h2 className="text-sm font-bold text-[#1E2927] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#365E52] text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                <span>Informasi Pengiriman</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap Penerima *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Muhammad Raditya"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp / Telepon *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alamat Lengkap (Jalan, Nomor Rumah, RT/RW) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Fatmawati Raya No. 12, RT 03/05"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Contoh: Cilandak"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kelurahan / Desa
                  </label>
                  <input
                    type="text"
                    value={subdistrict}
                    onChange={(e) => setSubdistrict(e.target.value)}
                    placeholder="Contoh: Cilandak Barat"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kota / Kabupaten *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Jakarta Selatan"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12190"
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>
              </div>

              {/* Courier Selection */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Pilih Kurir Ekspedisi:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCourier('jne')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'jne'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold ring-1 ring-[#365E52]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">1. JNE</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">JNE Reguler</span>
                    <span className="block text-[10px] font-medium text-emerald-700 mt-1">Termasuk Biaya 5%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourier('jnt')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'jnt'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold ring-1 ring-[#365E52]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">2. J&T</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">J&T Express</span>
                    <span className="block text-[10px] font-medium text-emerald-700 mt-1">Termasuk Biaya 5%</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourier('spx')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'spx'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold ring-1 ring-[#365E52]'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">3. SPX</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">SPX Express</span>
                    <span className="block text-[10px] font-medium text-emerald-700 mt-1">Termasuk Biaya 5%</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Payment Method Selection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
              <h2 className="text-sm font-bold text-[#1E2927] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#365E52] text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                <span>Pilih Metode Pembayaran Resmi</span>
              </h2>

              {/* Payment selector tabs */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    paymentMethod === 'qris'
                      ? 'border-[#365E52] bg-[#365E52]/5 ring-1 ring-[#365E52]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'qris' ? 'bg-[#365E52] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2927]">QRIS (Semua E-Wallet)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">GoPay, OVO, ShopeePay, Dana, BCA</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-[#365E52] bg-[#365E52]/5 ring-1 ring-[#365E52]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === 'bank_transfer' ? 'bg-[#365E52] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E2927]">Transfer Bank Manual</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">BCA, Mandiri, BRI, BNI</p>
                  </div>
                </button>
              </div>

              {/* Manual QRIS Container */}
              {paymentMethod === 'qris' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-3 px-1">
                    <span className="font-bold text-[#365E52] flex items-center gap-1.5">
                      <QrCode className="w-4 h-4" />
                      <span>QRIS MANUAL POSSENSIOR</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                      Scan & Input Nominal Manual
                    </span>
                  </div>

                  {/* Manual QRIS Image Card */}
                  <div className="mx-auto w-full max-w-[340px] sm:max-w-[380px] bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 tracking-wider mb-2.5 px-1">
                      <span>QRIS</span>
                      <span className="text-[#365E52] font-extrabold tracking-wide">POSSENSIOR</span>
                      <span>GPN</span>
                    </div>

                    {/* QR Code Image Container */}
                    <div className="w-full relative rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-3 sm:p-4 min-h-[280px]">
                      {isQrisLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex flex-col items-center justify-center z-10">
                          <div className="w-8 h-8 border-3 border-[#365E52] border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-[11px] font-semibold text-slate-600">Memuat QRIS Supabase...</span>
                        </div>
                      )}

                      {qrisLoadError ? (
                        <div className="text-center p-4">
                          <p className="text-xs text-rose-600 font-semibold mb-2">Gagal memuat gambar QRIS dari Supabase Storage.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setQrisLoadError(false);
                              setQrisImageUrl(getPaymentQrisPublicUrl(DEFAULT_PAYMENT_QRIS_FILE) + '?t=' + Date.now());
                            }}
                            className="text-xs text-[#365E52] underline font-bold cursor-pointer"
                          >
                            Muat Ulang QRIS
                          </button>
                        </div>
                      ) : (
                        <img
                          src={qrisImageUrl}
                          alt="QRIS Manual POSSENSIOR"
                          onError={() => setQrisLoadError(true)}
                          className="w-full max-w-[280px] sm:max-w-[320px] aspect-square object-contain rounded-lg block shadow-2xs"
                        />
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono mt-2.5 font-medium">
                      NMID: {QRIS_MANUAL_CONFIG.nmid} · {QRIS_MANUAL_CONFIG.storeName}
                    </span>
                  </div>

                  {/* Manual Nominal Box with 1-Click Copy */}
                  <div className="mt-4 p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl max-w-sm mx-auto flex items-center justify-between shadow-2xs">
                    <div className="text-left">
                      <span className="text-[10px] font-bold uppercase text-[#365E52]/80 block">
                        Nominal Yang Harus Dimasukkan Manual:
                      </span>
                      <span className="text-lg font-extrabold text-[#365E52] font-mono tracking-tight">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 text-[#365E52] text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Salin nominal tagihan"
                    >
                      {copiedAmount ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Nominal</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Official Formal Steps: Cara Pembayaran QRIS */}
                  <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl text-left text-xs space-y-2.5">
                    <span className="font-bold text-[#1E2927] block text-xs">Cara Pembayaran QRIS:</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                      <li>Unduh gambar QRIS atau pindai kode QRIS menggunakan aplikasi pembayaran yang mendukung QRIS.</li>
                      <li>Masukkan nominal pembayaran yang tertera pada halaman ini. Gunakan tombol salin nominal jika tersedia.</li>
                      <li>Selesaikan pembayaran dan simpan tangkapan layar atau bukti pembayaran.</li>
                      <li>Tekan tombol <strong>Kirim Bukti Pembayaran</strong> untuk mengirimkan bukti transfer via WhatsApp ke admin POSSENSIOR.</li>
                      <li>Pesanan akan diproses setelah pembayaran diverifikasi oleh admin.</li>
                    </ol>
                  </div>

                  {/* Action Buttons: Unduh QRIS & Kirim Bukti Pembayaran */}
                  <div className="mt-4 flex flex-col items-center gap-2 max-w-sm mx-auto">
                    {/* Tombol Unduh Kode QRIS */}
                    <button
                      type="button"
                      onClick={handleDownloadQRIS}
                      className={`w-full py-2.5 border text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${
                        downloadedQRIS
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white hover:bg-[#365E52]/5 border-slate-300 text-[#365E52]'
                      }`}
                    >
                      {downloadedQRIS ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>QRIS Berhasil Diunduh!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 text-[#365E52]" />
                          <span>Unduh Kode QRIS ke Perangkat</span>
                        </>
                      )}
                    </button>

                    {/* Tombol Kirim Bukti Pembayaran */}
                    <button
                      type="button"
                      onClick={handleSendProofViaWhatsApp}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{isSubmitting ? 'Menyimpan Pesanan...' : 'Kirim Bukti Pembayaran'}</span>
                    </button>

                    <span className="text-[10px] text-slate-500 leading-tight">
                      Setelah mengklik tombol di atas, Anda akan diarahkan ke WhatsApp untuk mengirim bukti pembayaran. Pesanan Anda otomatis tersimpan di database dan menunggu verifikasi admin.
                    </span>
                  </div>
                </div>
              )}

              {/* Bank Transfer Manual Container (Mengikuti alur QRIS wajib kirim bukti ke WhatsApp) */}
              {paymentMethod === 'bank_transfer' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 px-1">
                    <span className="font-bold text-[#365E52] flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>TRANSFER BANK MANUAL</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
                      Tepat 2 Rekening Resmi
                    </span>
                  </div>

                  {/* Select Bank (Strictly BCA and CIMB NIAGA) */}
                  <div className="text-left">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Pilih Rekening Tujuan Pembayaran:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {BANK_ACCOUNTS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedBank.id === bank.id
                              ? 'border-[#365E52] bg-white text-[#365E52] font-bold shadow-xs ring-2 ring-[#365E52]/20'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span className="block text-xs font-bold text-[#1E2927]">{bank.name}</span>
                          <span className="block font-mono text-xs text-slate-500 mt-1">{bank.accountNumber}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">a/n {bank.accountHolder}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Bank Account Card with Copy Button */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-left shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                        {selectedBank.name}
                      </span>
                      <span className="text-base sm:text-xl font-extrabold text-[#1E2927] font-mono tracking-wider mt-0.5 block">
                        {selectedBank.accountNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium block mt-0.5">
                        Atas Nama: <strong>{selectedBank.accountHolder}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#365E52] text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedBank ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin No. Rek</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Manual Nominal Box with 1-Click Copy */}
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl flex items-center justify-between text-left shadow-2xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#365E52]/80 block">
                        Nominal Yang Harus Ditransfer:
                      </span>
                      <span className="text-lg font-extrabold text-[#365E52] font-mono tracking-tight">
                        {formatRupiah(grandTotal)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAmount}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 text-[#365E52] text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Salin nominal tagihan"
                    >
                      {copiedAmount ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Nominal</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Official Formal Steps: Cara Pembayaran Transfer Bank */}
                  <div className="p-4 bg-white border border-slate-200 rounded-xl text-left text-xs space-y-2.5">
                    <span className="font-bold text-[#1E2927] block text-xs">Cara Pembayaran Transfer Bank:</span>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
                      <li>Pilih salah satu rekening tujuan di atas (BCA atau CIMB NIAGA).</li>
                      <li>Salin nomor rekening dan nominal tagihan yang harus ditransfer.</li>
                      <li>Lakukan transfer manual melalui ATM, M-Banking, atau Internet Banking sesuai nominal yang tertera.</li>
                      <li>Selesaikan transfer dan simpan tangkapan layar atau foto struk bukti pembayaran.</li>
                      <li>Tekan tombol <strong>Kirim Bukti Pembayaran</strong> untuk menyimpan pesanan dan mengirimkan bukti transfer via WhatsApp ke admin POSSENSIOR.</li>
                      <li>Pesanan Anda akan tercatat di sistem dan segera diproses setelah diverifikasi admin.</li>
                    </ol>
                  </div>

                  {/* Action Button: Kirim Bukti Pembayaran */}
                  <div className="mt-4 flex flex-col items-center gap-2 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={handleSendProofViaWhatsApp}
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{isSubmitting ? 'Menyimpan Pesanan...' : 'Kirim Bukti Pembayaran'}</span>
                    </button>

                    <span className="text-[10px] text-slate-500 leading-tight">
                      Setelah mengklik tombol di atas, Anda akan diarahkan ke WhatsApp admin (085777240570) untuk melampirkan bukti transfer. Pesanan Anda tetap tersimpan di database meskipun WhatsApp belum selesai.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm sticky top-24 space-y-5">
              <h3 className="text-base font-bold text-[#1E2927]">Ringkasan Pesanan</h3>

              {/* Items List */}
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover bg-stone-100 border border-slate-200"
                      />
                      <div>
                        <span className="font-bold text-slate-800 line-clamp-1">{item.product.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {item.selectedSize} · {item.selectedColor} · {item.quantity} pcs
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-700">
                      {formatRupiah(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 text-xs pt-3 border-t border-slate-100">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal Produk</span>
                  <span className="font-mono tabular-nums">{formatRupiah(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#365E52] font-semibold">
                    <span>Diskon Kupon</span>
                    <span className="font-mono tabular-nums">-{formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500">
                  <span>Biaya Lainnya (5% · Kurir {courier.toUpperCase()})</span>
                  <span className="font-mono tabular-nums">{formatRupiah(otherFees)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-[#1E2927] pt-2 border-t border-slate-200">
                  <span>Total Pembayaran</span>
                  <span className="font-mono tabular-nums text-lg text-[#365E52]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Menyimpan ke Database...</span>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Kirim Bukti Pembayaran</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 text-center leading-relaxed">
                Dengan mengonfirmasi pesanan, Anda menyetujui syarat & ketentuan pengembalian barang dan garansi penukaran size Possensior.
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
