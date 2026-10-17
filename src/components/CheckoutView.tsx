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
  const [city, setCity] = useState('Jakarta Selatan');
  const [province, setProvince] = useState('DKI Jakarta');
  const [postalCode, setPostalCode] = useState('12190');
  const [courier, setCourier] = useState<'jne' | 'sicepat' | 'jnt'>('sicepat');
  const [notes, setNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentType>('qris');
  const [selectedBank, setSelectedBank] = useState<BankAccount>(BANK_ACCOUNTS[0]);
  const [copiedBank, setCopiedBank] = useState(false);
  const [downloadedQRIS, setDownloadedQRIS] = useState(false);
  const [uploadedProof, setUploadedProof] = useState<string | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = discount > 0 ? Math.round(subtotal * (discount / 100)) : 0;
  
  const courierRates = {
    jne: 18000,
    sicepat: 20000,
    jnt: 19000,
  };
  const shippingCost = courierRates[courier];
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedProof(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProofPreviewUrl(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadQRIS = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 780;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 600, 780);

    // Header bar
    ctx.fillStyle = '#365E52';
    ctx.fillRect(0, 0, 600, 95);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('POSSENSIOR OFFICIAL STORE', 300, 42);
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillText('QRIS PEMBAYARAN MANUAL', 300, 70);

    // QRIS & GPN Subheaders
    ctx.fillStyle = '#18181B';
    ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('QRIS', 50, 140);
    ctx.textAlign = 'right';
    ctx.fillText('GPN', 550, 140);

    // QR Border Card
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 160, 500, 500);

    const finishDownload = () => {
      ctx.fillStyle = '#64748B';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`NMID: ${QRIS_MANUAL_CONFIG.nmid} · ${QRIS_MANUAL_CONFIG.storeName}`, 300, 695);

      ctx.fillStyle = '#365E52';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(`TOTAL: ${formatRupiah(grandTotal)}`, 300, 735);

      const link = document.createElement('a');
      link.download = `QRIS-Possensior-Manual-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloadedQRIS(true);
      setTimeout(() => setDownloadedQRIS(false), 3000);
    };

    const drawFallbackPattern = () => {
      ctx.fillStyle = '#18181B';
      ctx.fillRect(90, 200, 100, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(110, 220, 60, 60);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(125, 235, 30, 30);

      ctx.fillRect(410, 200, 100, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(430, 220, 60, 60);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(445, 235, 30, 30);

      ctx.fillRect(90, 520, 100, 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(110, 540, 60, 60);
      ctx.fillStyle = '#18181B';
      ctx.fillRect(125, 555, 30, 30);

      const matrixDots = [
        [220, 210, 30, 30], [270, 205, 40, 25], [330, 210, 25, 40],
        [215, 270, 45, 25], [280, 260, 30, 30], [335, 270, 40, 25],
        [110, 335, 30, 30], [165, 325, 40, 25], [225, 325, 30, 30], [385, 325, 30, 40], [440, 335, 30, 30],
        [120, 395, 35, 25], [175, 400, 25, 25], [385, 395, 45, 30], [445, 400, 35, 25],
        [225, 455, 30, 25], [275, 445, 40, 30], [335, 455, 30, 25], [385, 465, 25, 25],
        [225, 525, 35, 30], [275, 535, 25, 25], [325, 515, 30, 35], [375, 535, 40, 25], [435, 525, 30, 30],
        [225, 585, 25, 25], [265, 595, 40, 20], [325, 585, 30, 30], [385, 595, 35, 25], [445, 585, 40, 30]
      ];
      matrixDots.forEach(([x, y, w, h]) => {
        ctx.fillRect(x, y, w, h);
      });

      ctx.fillStyle = '#365E52';
      ctx.fillRect(260, 370, 80, 80);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'italic bold 52px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('P', 300, 430);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = QRIS_MANUAL_CONFIG.image;
    img.onload = () => {
      ctx.drawImage(img, 70, 180, 460, 460);
      finishDownload();
    };
    img.onerror = () => {
      drawFallbackPattern();
      finishDownload();
    };
  };

  const handleSendProofViaWhatsApp = () => {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setFormError('Harap lengkapi nama penerima, nomor WhatsApp, dan alamat pengiriman terlebih dahulu sebelum mengirim bukti pembayaran.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `POSS-${randomSuffix}`;

    const newOrder: Order = {
      id: `order-${Date.now()}`,
      invoiceNumber,
      createdAt: new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date()),
      items: [...items],
      subtotal,
      shippingCost,
      discount: discountAmount,
      total: grandTotal,
      shipping: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        province,
        postalCode,
        courier,
        shippingCost,
        notes: notes.trim(),
      },
      paymentMethod: 'qris',
      paymentStatus: 'menunggu_pembayaran',
      trackingNumber: invoiceNumber,
      proofUploaded: false,
      timeline: [
        {
          status: 'Pesanan Dibuat',
          description: `Pesanan ${invoiceNumber} berhasil dicatat di sistem Possensior.`,
          timestamp: 'Baru saja',
          completed: true,
        },
        {
          status: 'Menunggu Pembayaran Berhasil',
          description: 'Pesanan telah dikonfirmasi dan menunggu verifikasi bukti pembayaran QRIS dari chat WhatsApp.',
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

    const productListText = items
      .map(
        (it, idx) =>
          `  ${idx + 1}. *${it.product.name}*\n     Size: ${it.selectedSize} · Warna: ${it.selectedColor} · Qty: ${it.quantity} pcs (${formatRupiah(it.product.price * it.quantity)})`
      )
      .join('\n');

    const waMessage = 
`Halo Admin POSSENSIOR, saya ingin konfirmasi pesanan dan mengirimkan bukti pembayaran QRIS.

📦 *INFORMASI PESANAN*
• No. Invoice: *${invoiceNumber}*
• Tanggal: ${newOrder.createdAt}
• Total Tagihan: *${formatRupiah(grandTotal)}* (QRIS Manual)

👤 *DATA PENERIMA*
• Nama Penerima: ${fullName.trim()}
• No. WhatsApp / HP: ${phone.trim()}
• Alamat Pengiriman: ${address.trim()}, ${city.trim()}, ${province} ${postalCode}
• Ekspedisi: ${courier.toUpperCase()} (${formatRupiah(shippingCost)})
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

    const waUrl = `https://wa.me/${QRIS_MANUAL_CONFIG.adminWhatsApp}?text=${encodeURIComponent(waMessage)}`;

    // Open WhatsApp
    window.open(waUrl, '_blank');

    setIsSubmitting(false);
    onOrderCompleted(newOrder);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'qris') {
      handleSendProofViaWhatsApp();
      return;
    }

    if (paymentMethod === 'bank_transfer' && !uploadedProof) {
      setFormError('Wajib melampirkan foto struk transfer sebelum menekan tombol bayar dan konfirmasi.');
      return;
    }
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setFormError('Harap lengkapi nama penerima, nomor WhatsApp, dan alamat pengiriman.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const invoiceNumber = `POSS-${randomSuffix}`;

    setTimeout(() => {
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        invoiceNumber,
        createdAt: new Intl.DateTimeFormat('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date()),
        items: [...items],
        subtotal,
        shippingCost,
        discount: discountAmount,
        total: grandTotal,
        shipping: {
          fullName,
          phone,
          address,
          city,
          province,
          postalCode,
          courier,
          shippingCost,
          notes,
        },
        paymentMethod,
        selectedBank: paymentMethod === 'bank_transfer' ? selectedBank : undefined,
        paymentStatus: 'menunggu_pembayaran',
        trackingNumber: invoiceNumber,
        proofUploaded: !!uploadedProof,
        proofFileName: uploadedProof || undefined,
        timeline: [
          {
            status: 'Pesanan Dibuat',
            description: `Pesanan ${invoiceNumber} berhasil dicatat di sistem Possensior.`,
            timestamp: 'Baru saja',
            completed: true,
          },
          {
            status: 'Menunggu Konfirmasi Pembayaran',
            description: `Menunggu transfer ke rekening ${selectedBank.name}.`,
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

      setIsSubmitting(false);
      onOrderCompleted(newOrder);
    }, 800);
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
                    Alamat Lengkap (Jalan, Nomor Rumah, RT/RW, Kelurahan, Kecamatan) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Fatmawati Raya No. 12, RT 03/05, Cilandak Barat"
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
                    onClick={() => setCourier('sicepat')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'sicepat'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">SiCepat BEST</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">1-2 Hari</span>
                    <span className="block text-xs font-mono font-bold mt-1 text-[#365E52]">Rp 20.000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourier('jne')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'jne'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">JNE Reguler</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">2-3 Hari</span>
                    <span className="block text-xs font-mono font-bold mt-1 text-[#365E52]">Rp 18.000</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCourier('jnt')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      courier === 'jnt'
                        ? 'border-[#365E52] bg-[#365E52]/5 text-[#365E52] font-semibold'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-xs font-bold">J&T Express</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">1-3 Hari</span>
                    <span className="block text-xs font-mono font-bold mt-1 text-[#365E52]">Rp 19.000</span>
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
                  <div className="mx-auto max-w-[280px] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                    <div className="flex items-center justify-between w-full text-[10px] font-bold text-slate-700 tracking-wider mb-2">
                      <span>QRIS</span>
                      <span className="text-[#365E52] font-extrabold tracking-wide">POSSENSIOR</span>
                      <span>GPN</span>
                    </div>

                    {/* QR Code Image Container */}
                    <div className="w-56 h-56 relative rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center p-2">
                      <img
                        src={QRIS_MANUAL_CONFIG.image}
                        alt="QRIS Manual Possensior"
                        onError={(e) => {
                          // In case image not yet replaced, fallback to SVG visual
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                          const fallback = document.getElementById('qris-svg-fallback');
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        className="w-full h-full object-contain"
                      />
                      <div id="qris-svg-fallback" style={{ display: 'none' }} className="w-full h-full flex-col items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-36 h-36 text-slate-900 fill-current">
                          <rect x="0" y="0" width="30" height="30" rx="3" fill="#18181B" />
                          <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                          <rect x="10" y="10" width="10" height="10" fill="#18181B" />
                          <rect x="70" y="0" width="30" height="30" rx="3" fill="#18181B" />
                          <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                          <rect x="80" y="10" width="10" height="10" fill="#18181B" />
                          <rect x="0" y="70" width="30" height="30" rx="3" fill="#18181B" />
                          <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                          <rect x="10" y="80" width="10" height="10" fill="#18181B" />
                          <rect x="36" y="8" width="8" height="8" fill="#18181B" />
                          <rect x="52" y="12" width="6" height="12" fill="#18181B" />
                          <rect x="12" y="38" width="10" height="8" fill="#18181B" />
                          <rect x="40" y="40" width="20" height="20" rx="3" fill="#365E52" />
                          <rect x="68" y="44" width="8" height="14" fill="#18181B" />
                          <rect x="82" y="36" width="10" height="10" fill="#18181B" />
                          <rect x="42" y="68" width="12" height="8" fill="#18181B" />
                          <rect x="62" y="72" width="14" height="14" fill="#18181B" />
                          <rect x="80" y="80" width="12" height="12" fill="#18181B" />
                        </svg>
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono mt-2 font-medium">
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

                  <p className="text-xs text-slate-600 mt-3 font-medium">
                    Buka m-banking (BCA, Livin, dll) atau e-wallet (GoPay, OVO, Dana, ShopeePay). Scan QRIS di atas dan ketikkan nominal manual sebesar <strong className="text-[#365E52] font-mono">{formatRupiah(grandTotal)}</strong>.
                  </p>

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

                    {/* Tombol Kirim Bukti Pembayaran dibawah tombol unduh */}
                    <button
                      type="button"
                      onClick={handleSendProofViaWhatsApp}
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Kirim Bukti Pembayaran</span>
                    </button>

                    <span className="text-[10px] text-slate-500 leading-tight">
                      Setelah mengklik tombol di atas, Anda akan diarahkan ke WhatsApp untuk mengirim bukti pembayaran. Pesanan Anda akan otomatis dicatat dan menunggu verifikasi.
                    </span>
                  </div>
                </div>
              )}

              {/* Bank Transfer Manual Container */}
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  {/* Select Bank */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Pilih Rekening Tujuan:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BANK_ACCOUNTS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            selectedBank.id === bank.id
                              ? 'border-[#365E52] bg-[#365E52]/10 text-[#365E52] font-bold shadow-xs'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <span className="block text-xs font-bold">{bank.code}</span>
                          <span className="block text-[11px] text-slate-500 mt-0.5">{bank.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Account Card with Copy Button */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-400 block">
                        {selectedBank.name}
                      </span>
                      <span className="text-base sm:text-lg font-extrabold text-[#1E2927] font-mono tracking-wider mt-0.5 block">
                        {selectedBank.accountNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium block mt-0.5">
                        a/n {selectedBank.accountHolder}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-[#365E52] text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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

                  {/* Upload Transfer Proof (Mandatory for Bank Transfer) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>Unggah Foto Struk Transfer</span>
                        <span className="text-red-500 font-bold">*Wajib</span>
                      </label>
                      {uploadedProof ? (
                        <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Struk Terlampir</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium">
                          Belum Dilampirkan
                        </span>
                      )}
                    </div>

                    <label className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      uploadedProof 
                        ? 'border-[#365E52] bg-[#365E52]/5' 
                        : 'border-slate-300 hover:border-[#365E52] bg-slate-50/70 hover:bg-slate-50'
                    }`}>
                      {proofPreviewUrl ? (
                        <div className="flex flex-col items-center gap-2 text-center">
                          <img
                            src={proofPreviewUrl}
                            alt="Bukti Transfer"
                            className="w-24 h-24 object-cover rounded-lg border border-slate-300 shadow-xs"
                          />
                          <span className="text-xs text-[#365E52] font-bold">{uploadedProof}</span>
                          <span className="text-[10px] text-slate-500 underline">Klik untuk mengganti foto struk</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs font-semibold text-slate-700">
                            Pilih Foto Struk / Tangkapan Layar M-Banking
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Format JPG, PNG, atau WEBP (Maks 10MB)
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
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
                          {item.selectedSize} · {item.quantity} pcs
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
                  <span>Ongkos Kirim ({courier.toUpperCase()})</span>
                  <span className="font-mono tabular-nums">{formatRupiah(shippingCost)}</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-[#1E2927] pt-2 border-t border-slate-200">
                  <span>Total Pembayaran</span>
                  <span className="font-mono tabular-nums text-lg text-[#365E52]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Primary Action Button */}
              {(() => {
                const isMissingReceipt = paymentMethod === 'bank_transfer' && !uploadedProof;
                const isButtonDisabled = isSubmitting || isMissingReceipt;

                return (
                  <div className="space-y-2">
                    <button
                      type="submit"
                      disabled={isButtonDisabled}
                      aria-disabled={isButtonDisabled}
                      className={`w-full py-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
                        isButtonDisabled
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-90 border border-slate-300 shadow-none pointer-events-none'
                          : paymentMethod === 'qris'
                            ? 'bg-[#25D366] hover:bg-[#20ba59] text-white shadow-md cursor-pointer active:scale-[0.99]'
                            : 'bg-[#365E52] hover:bg-[#2A4B41] text-white shadow-md cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      {isSubmitting ? (
                        <span>Memproses Pesanan...</span>
                      ) : paymentMethod === 'qris' ? (
                        <>
                          <MessageCircle className="w-4 h-4 fill-current" />
                          <span>Kirim Bukti Pembayaran</span>
                        </>
                      ) : (
                        <>
                          <span>Bayar dan Konfirmasi</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {isMissingReceipt && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl flex items-center justify-center gap-1.5 font-medium text-center">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Foto struk transfer wajib dilampirkan untuk mengaktifkan tombol ini</span>
                      </div>
                    )}
                  </div>
                );
              })()}

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
