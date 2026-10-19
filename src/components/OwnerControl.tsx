import React, { useState, useEffect } from 'react';
import { Product, Order, ProductSize } from '../types/store';
import { SIZE_CHART } from '../data/products';
import { 
  Lock, 
  X, 
  Package, 
  Truck, 
  Printer, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Check, 
  AlertCircle,
  Upload,
  Palette,
  Ruler,
  Layers,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Database,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { PossensiorWordmark } from './Logos';
import { BatchReceiptPrintModal } from './BatchReceiptPrintModal';
import { compressImageIfExceeds, extractDominantColorsFromImage } from '../utils/colorExtractor';
import { 
  supabase, 
  OWNER_UID, 
  uploadImageToSupabase, 
  dataUrlToBlob, 
  isSupabaseConfigured 
} from '../lib/supabase';

interface OwnerControlProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => void;
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<boolean>;
  onUpdateProduct: (updatedProduct: Product) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onMigrateDefaultProducts?: () => Promise<{ success: boolean; count?: number; message: string }>;
  onRefreshProducts?: () => Promise<void>;
  isDbConfigured?: boolean;
}

export const OwnerControl: React.FC<OwnerControlProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrder,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onMigrateDefaultProducts,
  onRefreshProducts,
  isDbConfigured = isSupabaseConfigured,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [showBatchPrint, setShowBatchPrint] = useState(false);

  // Temporary edit states for resi input
  const [resiInputs, setResiInputs] = useState<{ [orderId: string]: string }>({});

  // Product Editor Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formImageNotice, setFormImageNotice] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Form Fields for Product
  const [formName, setFormName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formCategory, setFormCategory] = useState<'tshirt' | 'longsleeve' | 'outerwear'>('tshirt');
  const [formPrice, setFormPrice] = useState<number>(175000);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | undefined>(210000);
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('Heavyweight Cotton Combed 20s (220 GSM)');
  const [formFit, setFormFit] = useState('Boxy Fit (Drop Shoulder, Wide Body)');
  const [formStock, setFormStock] = useState<number>(20);
  const [formTag, setFormTag] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formAdditionalImages, setFormAdditionalImages] = useState<string[]>([]);
  const [formColors, setFormColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Washed Black', hex: '#18181B' },
  ]);
  const [formSizes, setFormSizes] = useState<ProductSize[]>(['S', 'M', 'L', 'XL']);
  const [formSizeChart, setFormSizeChart] = useState(SIZE_CHART);

  // Check active Supabase Auth session on mount and listen to changes
  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user && session.user.id === OWNER_UID) {
          setIsAuthenticated(true);
          setOwnerEmail(session.user.email || '');
        } else if (session?.user) {
          // Logged in user is not the designated owner UID
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setOwnerEmail('');
        }
      } catch (err) {
        console.error('Session verify error', err);
      }
    };

    verifySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user && session.user.id === OWNER_UID) {
        setIsAuthenticated(true);
        setOwnerEmail(session.user.email || '');
      } else {
        setIsAuthenticated(false);
        setOwnerEmail('');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  // Supabase Auth Login handler
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim() || !passwordInput) {
      setAuthErrorMessage('Silakan isi email dan password owner.');
      setAuthError(true);
      return;
    }

    setIsLoggingIn(true);
    setAuthError(false);
    setAuthErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (error) {
        setAuthErrorMessage(error.message);
        setAuthError(true);
        setIsAuthenticated(false);
        return;
      }

      if (data.user?.id !== OWNER_UID) {
        await supabase.auth.signOut();
        setAuthErrorMessage('Akses ditolak: Akun ini bukan pemilik terdaftar POSSENSIOR (UID tidak cocok).');
        setAuthError(true);
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      setOwnerEmail(data.user.email || emailInput.trim());
      setPasswordInput('');
      setAuthError(false);
    } catch (err: any) {
      setAuthErrorMessage(err?.message || 'Gagal menghubungi server autentikasi.');
      setAuthError(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error', err);
    }
    setIsAuthenticated(false);
    setOwnerEmail('');
    setPasswordInput('');
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Order status update
  const handleStatusChange = (order: Order, newStatus: any) => {
    const updated = {
      ...order,
      paymentStatus: newStatus,
      timeline: [
        ...order.timeline,
        {
          status: `Status Diperbarui: ${newStatus.replace('_', ' ').toUpperCase()}`,
          description: `Status pesanan diubah oleh Owner ke ${newStatus}.`,
          timestamp: 'Baru saja',
          completed: true,
          current: true,
        },
      ],
    };
    onUpdateOrder(updated);
  };

  // Courier Resi update
  const handleSaveResi = (order: Order) => {
    const resiValue = resiInputs[order.id];
    if (!resiValue || !resiValue.trim()) return;

    const updated: Order = {
      ...order,
      courierResi: resiValue.trim(),
      paymentStatus: 'dikirim',
      timeline: [
        ...order.timeline.map((t) => ({ ...t, current: false })),
        {
          status: 'Paket Dikirim dengan Resi Kurir',
          description: `Paket diserahkan ke kurir ${order.shipping.courier.toUpperCase()} dengan Nomor Resi: ${resiValue.trim()}.`,
          timestamp: new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
          completed: true,
          current: true,
        },
      ],
    };
    onUpdateOrder(updated);
    alert(`Nomor resi ${resiValue.trim()} berhasil disimpan dan status pesanan diperbarui menjadi "dikirim".`);
  };

  // Image Upload with Automatic Compression (>5MB), Dominant Color Extraction,
  // and direct online upload to Supabase Storage bucket "POSSENSIOR MEDIA" in "catalog/"
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    isDetail: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormImageNotice('Memproses dan mengompresi gambar...');

    try {
      const result = await compressImageIfExceeds(file, 5 * 1024 * 1024);
      if (result.wasCompressed) {
        setFormImageNotice(
          `Ukuran gambar ${(result.originalSize / 1024 / 1024).toFixed(1)} MB dikompres menjadi ${(result.compressedSize / 1024 / 1024).toFixed(1)} MB. Mengunggah ke bucket "POSSENSIOR MEDIA"...`
        );
      } else {
        setFormImageNotice(
          `Gambar diproses (${(result.originalSize / 1024 / 1024).toFixed(1)} MB). Mengunggah ke bucket "POSSENSIOR MEDIA"...`
        );
      }

      // Extract Dominant Colors Automatically if main image
      if (!isDetail) {
        const extracted = await extractDominantColorsFromImage(result.dataUrl);
        if (extracted && extracted.length > 0) {
          setFormColors(extracted);
        }
      }

      // Convert to binary Blob and upload to bucket "POSSENSIOR MEDIA" inside "catalog/" folder
      const blob = dataUrlToBlob(result.dataUrl);
      const { url, error } = await uploadImageToSupabase(blob, 'catalog');

      if (error || !url) {
        setFormImageNotice(`Gagal mengunggah gambar ke storage: ${error}`);
        alert(`Gagal mengunggah gambar ke bucket "POSSENSIOR MEDIA": ${error}\nPastikan Anda login sebagai pemilik dan policy storage telah aktif.`);
        return;
      }

      if (isDetail) {
        setFormAdditionalImages((prev) => [...prev, url]);
        setFormImageNotice('Gambar detail berhasil diunggah ke storage online (URL disimpan).');
      } else {
        setFormImage(url);
        setFormImageNotice('Gambar utama berhasil diunggah ke storage online (URL disimpan).');
      }
    } catch (err: any) {
      console.error('Image upload error', err);
      setFormImageNotice(`Gagal memproses gambar: ${err?.message || 'Error'}`);
    } finally {
      e.target.value = '';
    }
  };

  // Open Edit Product Modal
  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsCreatingNew(false);
    setFormName(prod.name);
    setFormSubtitle(prod.subtitle);
    setFormCategory(prod.category);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice);
    setFormDescription(prod.description);
    setFormMaterial(prod.material);
    setFormFit(prod.fit);
    setFormStock(prod.stockCount);
    setFormTag(prod.tag || '');
    setFormImage(prod.image);
    setFormAdditionalImages(prod.additionalImages || []);
    setFormColors(prod.colors);
    setFormSizes(prod.sizes);
    setFormSizeChart(prod.customSizeChart || SIZE_CHART);
    setFormImageNotice(null);
  };

  // Open Create New Product Modal
  const openCreateProduct = () => {
    setIsCreatingNew(true);
    setEditingProduct(null);
    setFormName('');
    setFormSubtitle('');
    setFormCategory('tshirt');
    setFormPrice(175000);
    setFormOriginalPrice(210000);
    setFormDescription('');
    setFormMaterial('Heavyweight Cotton Combed 20s (220 GSM)');
    setFormFit('Boxy Fit (Drop Shoulder, Wide Body)');
    setFormStock(25);
    setFormTag('New Arrival');
    setFormImage(products[0]?.image || '');
    setFormAdditionalImages([]);
    setFormColors([
      { name: 'Pitch Black', hex: '#18181B' },
      { name: 'Sage Green', hex: '#365E52' },
    ]);
    setFormSizes(['S', 'M', 'L', 'XL']);
    setFormSizeChart(SIZE_CHART);
    setFormImageNotice(null);
  };

  // Save Product Form: handles image upload validation, awaits database confirmation before closing
  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert('Nama produk dan harga wajib diisi.');
      return;
    }

    setIsSavingProduct(true);
    setFormImageNotice('Memvalidasi gambar dan data produk...');

    try {
      let finalMainImage = formImage || products[0]?.image || '';
      let finalAdditionalImages = [...formAdditionalImages];

      // Ensure no raw dataUrl is saved; upload if needed
      if (finalMainImage.startsWith('data:')) {
        setFormImageNotice('Mengunggah gambar utama ke Supabase Storage (POSSENSIOR MEDIA)...');
        const blob = dataUrlToBlob(finalMainImage);
        const { url, error } = await uploadImageToSupabase(blob, 'catalog');
        if (error || !url) {
          alert(`Penyimpanan produk dibatalkan: Gagal mengunggah gambar utama (${error}).`);
          setIsSavingProduct(false);
          return;
        }
        finalMainImage = url;
      }

      for (let i = 0; i < finalAdditionalImages.length; i++) {
        if (finalAdditionalImages[i].startsWith('data:')) {
          setFormImageNotice(`Mengunggah gambar detail ${i + 1} ke Supabase Storage (POSSENSIOR MEDIA)...`);
          const blob = dataUrlToBlob(finalAdditionalImages[i]);
          const { url, error } = await uploadImageToSupabase(blob, 'catalog');
          if (error || !url) {
            alert(`Penyimpanan produk dibatalkan: Gagal mengunggah gambar detail ${i + 1} (${error}).`);
            setIsSavingProduct(false);
            return;
          }
          finalAdditionalImages[i] = url;
        }
      }

      const payload: Product = {
        id: editingProduct ? editingProduct.id : `poss-${Date.now()}`,
        name: formName.trim(),
        subtitle: formSubtitle.trim() || 'Signature Boxy Fit Apparel',
        slug: formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: formCategory,
        price: Number(formPrice),
        originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
        description: formDescription.trim() || 'Koleksi apparel boxy fit Possensior dengan jahitan presisi.',
        material: formMaterial.trim(),
        fit: formFit.trim(),
        sizes: formSizes,
        colors: formColors,
        image: finalMainImage,
        additionalImages: finalAdditionalImages,
        customSizeChart: formSizeChart,
        inStock: formStock > 0,
        stockCount: Number(formStock),
        tag: formTag.trim() || undefined,
        features: [
          'Rib leher tebal anti-melar',
          'Jahitan rantai standar internasional',
          'Bahan combed heavyweight berstruktur',
        ],
      };

      if (editingProduct) {
        const success = await onUpdateProduct(payload);
        if (success) {
          setEditingProduct(null);
          setIsCreatingNew(false);
        }
      } else {
        const success = await onAddProduct(payload);
        if (success) {
          setEditingProduct(null);
          setIsCreatingNew(false);
        }
      }
    } catch (err: any) {
      alert(`Gagal menyimpan produk: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Color Variant Helpers
  const handleAddColor = () => {
    setFormColors([...formColors, { name: 'New Color', hex: '#365E52' }]);
  };

  const handleUpdateColor = (index: number, field: 'name' | 'hex', val: string) => {
    setFormColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  const handleRemoveColor = (index: number) => {
    setFormColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Size Chart Helpers
  const handleUpdateSizeRow = (index: number, field: string, val: string) => {
    setFormSizeChart((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: val } : r))
    );
  };

  const handleToggleSize = (size: ProductSize) => {
    if (formSizes.includes(size)) {
      if (formSizes.length <= 1) {
        alert('Minimal harus ada satu ukuran produk.');
        return;
      }
      setFormSizes(formSizes.filter((s) => s !== size));
    } else {
      setFormSizes([...formSizes, size]);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.paymentStatus === orderStatusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="relative bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 text-[#1E2927]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#365E52] flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Owner Control Panel</h2>
              <span className="text-[11px] text-slate-400">Possensior Internal Fulfillment & Catalog Management</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && (
              <>
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/30 rounded-lg text-emerald-300 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate max-w-[150px]">{ownerEmail || 'Owner Terverifikasi'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Keluar dari sesi Owner"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Tutup panel owner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Supabase Authentication Screen if Not Authenticated */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-[#365E52]">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-[#1E2927]">Keamanan Akses Owner</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Silakan masuk menggunakan akun Supabase Auth pemilik untuk mengelola pesanan, katalog, dan media penyimpanan.
            </p>

            <form onSubmit={handleLogin} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Akun Pemilik
                </label>
                <input
                  type="email"
                  autoFocus
                  required
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="owner@possensior.com"
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-[#365E52]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="••••••••••••"
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm font-mono tracking-widest focus:outline-none focus:border-[#365E52]"
                />
              </div>

              {authError && (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1.5 p-2.5 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authErrorMessage || 'Email atau password salah.'}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-[#365E52] hover:bg-[#2A4B41] disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun Owner...</span>
                  </>
                ) : (
                  <span>Masuk ke Dashboard Owner</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation & Status Bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-white text-[#365E52] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Pesanan & Resi ({orders.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'catalog'
                      ? 'bg-white text-[#365E52] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Katalog Produk ({products.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === 'orders' && (
                  <button
                    type="button"
                    onClick={() => setShowBatchPrint(true)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Cetak Semua Resi Sekaligus</span>
                  </button>
                )}

                {activeTab === 'catalog' && (
                  <div className="flex items-center gap-2">
                    {onRefreshProducts && (
                      <button
                        type="button"
                        disabled={isRefreshing}
                        onClick={async () => {
                          setIsRefreshing(true);
                          try {
                            await onRefreshProducts();
                          } finally {
                            setIsRefreshing(false);
                          }
                        }}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Perbarui data katalog langsung dari Supabase"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#365E52]' : ''}`} />
                        <span className="hidden sm:inline">Segarkan Data</span>
                      </button>
                    )}

                    <button
                      onClick={openCreateProduct}
                      className="px-3.5 py-2 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Produk Baru</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: ORDERS & TRACKING MANAGEMENT */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Status Filter */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
                      {['all', 'menunggu_pembayaran', 'diproses', 'dikirim', 'selesai'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer capitalize ${
                            orderStatusFilter === st
                              ? 'bg-white text-[#365E52] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <span className="text-xs text-slate-500 font-medium">
                      Menampilkan {filteredOrders.length} dari total {orders.length} pesanan
                    </span>
                  </div>

                  {/* Orders Cards List */}
                  <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        Tidak ada pesanan dengan status ini.
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#365E52]/40 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-extrabold text-sm text-[#1E2927]">
                                  {order.invoiceNumber}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs text-slate-500">{order.createdAt}</span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-0.5">
                                Penerima: <strong>{order.shipping.fullName}</strong> ({order.shipping.phone}) · {order.shipping.city}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Change Status Dropdown */}
                              <select
                                value={order.paymentStatus}
                                onChange={(e) => handleStatusChange(order, e.target.value)}
                                className="text-xs font-bold p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#365E52] cursor-pointer"
                              >
                                <option value="menunggu_pembayaran">Menunggu Pembayaran</option>
                                <option value="terverifikasi">Terverifikasi</option>
                                <option value="diproses">Diproses & Packing</option>
                                <option value="dikirim">Dikirim ke Kurir</option>
                                <option value="selesai">Selesai Diterima</option>
                              </select>
                            </div>
                          </div>

                          {/* Items & Shipping row */}
                          <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                Item Pesanan:
                              </span>
                              <div className="mt-1 space-y-1">
                                {order.items.map((it) => (
                                  <div key={it.id} className="flex items-center justify-between">
                                    <span>
                                      {it.product.name} ({it.selectedSize} · {it.selectedColor}) × {it.quantity}
                                    </span>
                                    <span className="font-mono text-slate-600">
                                      {formatRupiah(it.product.price * it.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                Pengiriman & Total:
                              </span>
                              <p className="mt-1 text-slate-700">
                                Kurir: <strong className="uppercase">{order.shipping.courier}</strong> · Alamat: {order.shipping.address}, {order.shipping.city}
                              </p>
                              <p className="font-bold text-sm text-[#365E52] mt-1 font-mono">
                                Total: {formatRupiah(order.total)}
                              </p>
                            </div>
                          </div>

                          {/* Input Nomor Resi Kurir (Aktif untuk update tracking pembeli) */}
                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl mt-2">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-[#365E52] shrink-0" />
                              <div className="text-xs">
                                <span className="font-semibold text-slate-700">Resi Pengiriman Kurir:</span>
                                {order.courierResi ? (
                                  <span className="ml-2 font-mono font-bold text-[#1E2927] bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {order.courierResi}
                                  </span>
                                ) : (
                                  <span className="ml-2 text-amber-600 font-medium">Belum ada nomor resi</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Input resi kurir..."
                                defaultValue={order.courierResi || ''}
                                onChange={(e) =>
                                  setResiInputs((prev) => ({
                                    ...prev,
                                    [order.id]: e.target.value,
                                  }))
                                }
                                className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white w-44 font-mono focus:outline-none focus:border-[#365E52]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveResi(order)}
                                className="px-3 py-1.5 bg-[#365E52] hover:bg-[#2A4B41] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Simpan Resi
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: CATALOG MANAGEMENT */}
              {activeTab === 'catalog' && (
                <div className="space-y-6">
                  {/* Sync Status Banner & Optional Safe Migration Button */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600/10 flex items-center justify-center text-[#365E52] shrink-0">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800">Tersinkronisasi dengan Supabase Database</h4>
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#365E52] text-[10px] font-bold rounded-full">
                            public.possensior_products
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Setiap penambahan, pengeditan, atau penghapusan produk langsung tercatat di Supabase secara online.
                        </p>
                      </div>
                    </div>

                    {onMigrateDefaultProducts && (
                      <button
                        type="button"
                        disabled={isMigrating}
                        onClick={async () => {
                          if (confirm('Apakah Anda ingin memigrasikan daftar produk awal ke database Supabase sekarang?')) {
                            setIsMigrating(true);
                            try {
                              const res = await onMigrateDefaultProducts();
                              alert(res.message);
                            } finally {
                              setIsMigrating(false);
                            }
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-[#365E52] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isMigrating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memigrasikan...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-3.5 h-3.5" />
                            <span>Migrasikan Produk Awal ke Database</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Product Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 shadow-xs items-center hover:border-slate-300 transition-colors"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-24 object-cover rounded-xl bg-slate-100 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600';
                          }}
                        />

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {product.category} · Stok: {product.stockCount} pcs
                          </span>
                          <h4 className="font-bold text-sm text-[#1E2927] truncate mt-0.5">{product.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{product.subtitle}</p>
                          <p className="text-sm font-mono font-bold text-[#365E52] mt-1">
                            {formatRupiah(product.price)}
                          </p>

                          {/* Color indicators */}
                          <div className="flex items-center gap-1 mt-2">
                            {product.colors.map((c) => (
                              <span
                                key={c.name}
                                className="w-3 h-3 rounded-full border border-black/10 inline-block"
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => openEditProduct(product)}
                            className="p-2 text-slate-600 hover:text-[#365E52] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={deletingProductId === product.id}
                            onClick={async () => {
                              if (confirm(`Yakin ingin menghapus produk "${product.name}" secara permanen dari database Supabase?`)) {
                                setDeletingProductId(product.id);
                                try {
                                  await onDeleteProduct(product.id);
                                } finally {
                                  setDeletingProductId(null);
                                }
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Produk"
                          >
                            {deletingProductId === product.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRODUCT CREATE / EDIT SUB-MODAL */}
        {(isCreatingNew || editingProduct) && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-[#1E2927]">
                  {editingProduct ? `Edit Katalog: ${editingProduct.name}` : 'Tambah Katalog Produk Baru'}
                </h3>
                <button
                  disabled={isSavingProduct}
                  onClick={() => {
                    setEditingProduct(null);
                    setIsCreatingNew(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer disabled:opacity-40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="space-y-5 text-xs">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Produk *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="cth: Tshirt Boxy Neuro Black"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subtitle / Seri</label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="cth: Vol. 03 — Dopamine Release"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                    >
                      <option value="tshirt">Boxy T-Shirt</option>
                      <option value="longsleeve">Longsleeve</option>
                      <option value="outerwear">Outerwear / Hoodie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Harga (Rupiah) *</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#365E52]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Stok Tersedia</label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-200 rounded-lg font-mono focus:outline-none focus:border-[#365E52]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tag Spesial (Opsional)</label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={(e) => setFormTag(e.target.value)}
                      placeholder="Best Seller / Limited Edition"
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Produk</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Deskripsi bahan, siluet boxy, dan kenyamanan pakaian..."
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                  />
                </div>

                {/* Image Uploader with Compression > 5MB, Dominant Color extraction, and direct upload to POSSENSIOR MEDIA */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-800">Unggah Gambar Utama & Detail ke Storage Online</h4>
                      <p className="text-[11px] text-slate-500">
                        Gambar di atas 5MB akan dikompresi otomatis lalu diunggah ke bucket <strong>POSSENSIOR MEDIA</strong> pada folder <code>catalog/</code>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Main Image */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gambar Utama:</label>
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#365E52] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-600 font-medium">Pilih file gambar utama</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, false)}
                          className="hidden"
                        />
                      </label>
                      {formImage && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={formImage} alt="Preview" className="w-12 h-12 rounded object-cover border" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-emerald-700 font-semibold">✓ Gambar utama siap</span>
                            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[200px]">
                              {formImage.startsWith('http') ? 'Online URL' : 'Data URL'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Additional Detail Image */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Gambar Detail Tambahan:</label>
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#365E52] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-600 font-medium">Tambah gambar detail</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageFileChange(e, true)}
                          className="hidden"
                        />
                      </label>
                      {formAdditionalImages.length > 0 && (
                        <div className="mt-2 flex gap-1.5 flex-wrap">
                          {formAdditionalImages.map((img, idx) => (
                            <img key={idx} src={img} alt="Detail" className="w-10 h-10 rounded object-cover border" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {formImageNotice && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-[#365E52] font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{formImageNotice}</span>
                    </div>
                  )}
                </div>

                {/* Color Variants Manager (with automatic dominant color detection) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-[#365E52]" />
                        <span>Varian Warna (Warna Dominan Diekstrak Otomatis)</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Owner dapat menambah, mengubah nama, atau memilih kode warna secara langsung.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[11px] text-[#365E52] cursor-pointer"
                    >
                      + Tambah Warna
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {formColors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => handleUpdateColor(idx, 'hex', e.target.value)}
                          className="w-7 h-7 rounded border-none cursor-pointer"
                        />
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => handleUpdateColor(idx, 'name', e.target.value)}
                          placeholder="Nama warna"
                          className="flex-1 p-1 border border-slate-200 rounded text-xs focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Chart & Sizes Editor */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-[#365E52]" />
                      <span>Edit Size Chart & Ukuran Tersedia</span>
                    </h4>
                  </div>

                  {/* Size toggles */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Aktifkan Ukuran:</span>
                    {(['S', 'M', 'L', 'XL'] as ProductSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSize(sz)}
                        className={`px-3 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                          formSizes.includes(sz)
                            ? 'bg-[#365E52] text-white border-[#365E52]'
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  {/* Size chart values table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] bg-white rounded-lg border border-slate-200">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                          <th className="p-2">Size</th>
                          <th className="p-2">Lebar Dada</th>
                          <th className="p-2">Panjang</th>
                          <th className="p-2">Lebar Bahu</th>
                          <th className="p-2">Panjang Lengan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formSizeChart.map((row, idx) => (
                          <tr key={row.size} className="border-b border-slate-100 last:border-none">
                            <td className="p-2 font-bold text-[#365E52]">{row.size}</td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.chest}
                                onChange={(e) => handleUpdateSizeRow(idx, 'chest', e.target.value)}
                                className="w-20 p-1 border border-slate-200 rounded text-center"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.length}
                                onChange={(e) => handleUpdateSizeRow(idx, 'length', e.target.value)}
                                className="w-20 p-1 border border-slate-200 rounded text-center"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.shoulder}
                                onChange={(e) => handleUpdateSizeRow(idx, 'shoulder', e.target.value)}
                                className="w-20 p-1 border border-slate-200 rounded text-center"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="text"
                                value={row.sleeve}
                                onChange={(e) => handleUpdateSizeRow(idx, 'sleeve', e.target.value)}
                                className="w-20 p-1 border border-slate-200 rounded text-center"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSavingProduct}
                    onClick={() => {
                      setEditingProduct(null);
                      setIsCreatingNew(false);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 bg-[#365E52] hover:bg-[#2A4B41] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingProduct ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Database...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan Katalog</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Batch Shipping Label Print Modal */}
        <BatchReceiptPrintModal
          isOpen={showBatchPrint}
          onClose={() => setShowBatchPrint(false)}
          orders={orders}
        />
      </div>
    </div>
  );
};
