import React, { useState, useEffect } from 'react';
import { Product, Order, ProductSize, formatCategoryName } from '../types/store';
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
import { SingleReceiptPrintModal } from './SingleReceiptPrintModal';
import { compressImageIfExceeds } from '../utils/colorExtractor';
import { 
  supabase, 
  OWNER_UID, 
  uploadImageToSupabase, 
  dataUrlToBlob, 
  isSupabaseConfigured,
  subscribeToOrders,
  migrateLocalStorageOrdersToDatabase
} from '../lib/supabase';

interface OwnerControlProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder?: (orderId: string) => Promise<boolean> | boolean;
  products: Product[];
  onAddProduct: (newProduct: Product) => Promise<boolean>;
  onUpdateProduct: (updatedProduct: Product) => Promise<boolean>;
  onDeleteProduct: (productId: string) => Promise<boolean>;
  onMigrateDefaultProducts?: () => Promise<{ success: boolean; count?: number; message: string }>;
  onRefreshProducts?: () => Promise<void>;
  onRefreshOrders?: () => Promise<void>;
  isDbConfigured?: boolean;
}

export const OwnerControl: React.FC<OwnerControlProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrder,
  onDeleteOrder,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onMigrateDefaultProducts,
  onRefreshProducts,
  onRefreshOrders,
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
  const [singlePrintOrder, setSinglePrintOrder] = useState<Order | null>(null);
  const [isDeletingOrderId, setIsDeletingOrderId] = useState<string | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderFetchError, setOrderFetchError] = useState<string | null>(null);
  const [isMigratingOrders, setIsMigratingOrders] = useState(false);

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
  const [formCategory, setFormCategory] = useState<'tees' | 'pants' | 'outerwear' | 'tshirt' | 'longsleeve'>('tees');
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

  const loadOrdersFromDb = async () => {
    if (!onRefreshOrders) return;
    setIsLoadingOrders(true);
    setOrderFetchError(null);
    try {
      await onRefreshOrders();
    } catch (err: any) {
      setOrderFetchError(err?.message || 'Gagal memuat pesanan dari database');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isOpen) return;

    loadOrdersFromDb();

    const unsubscribe = subscribeToOrders(() => {
      loadOrdersFromDb();
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, isOpen]);

  const handleMigrateLocalOrders = async () => {
    if (!orders || orders.length === 0) {
      alert('Tidak ada pesanan lokal untuk dimigrasikan.');
      return;
    }
    const confirmed = window.confirm(
      `Apakah kamu ingin memigrasikan ${orders.length} pesanan yang tersimpan di browser ini ke tabel database Supabase "public.possensior_orders"? Data yang sudah ada di database tidak akan diduplikasi.`
    );
    if (!confirmed) return;

    setIsMigratingOrders(true);
    try {
      const { migratedCount, error } = await migrateLocalStorageOrdersToDatabase(orders);
      if (error) {
        alert(`Migrasi pesanan gagal: ${error}`);
      } else {
        alert(`Berhasil! ${migratedCount} pesanan lokal telah dimigrasikan ke database Supabase.`);
        await loadOrdersFromDb();
      }
    } catch (err: any) {
      alert(`Terjadi error saat migrasi: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsMigratingOrders(false);
    }
  };

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
      loadOrdersFromDb();
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
        ...(order.timeline || []).map((t) => ({ ...t, current: false })),
        {
          status: 'Paket Dikirim dengan Resi Kurir',
          description: `Paket diserahkan ke kurir ${(order.shipping?.courier || 'JNE').toUpperCase()} dengan Nomor Resi: ${resiValue.trim()}.`,
          timestamp: new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short' }).format(new Date()),
          completed: true,
          current: true,
        },
      ],
    };
    onUpdateOrder(updated);
    alert(`Nomor resi ${resiValue.trim()} berhasil disimpan dan status pesanan diperbarui menjadi "dikirim".`);
  };

  // Single Order Receipt Printing
  const handlePrintSingleOrder = (order: Order) => {
    setSinglePrintOrder(order);
  };

  // Delete Order with explicit user confirmation
  const handleDeleteOrderClick = async (order: Order) => {
    const confirmed = window.confirm(
      'Apakah kamu yakin ingin menghapus pesanan ini? Pesanan yang dihapus tidak dapat dikembalikan.'
    );
    if (!confirmed) return;

    if (!onDeleteOrder) {
      alert('Fitur hapus pesanan tidak tersedia.');
      return;
    }

    setIsDeletingOrderId(order.id);
    try {
      const ok = await onDeleteOrder(order.id);
      if (ok) {
        alert(`Pesanan ${order.invoiceNumber} berhasil dihapus.`);
      } else {
        alert(`Gagal menghapus pesanan ${order.invoiceNumber}.`);
      }
    } catch (err: any) {
      alert(`Terjadi kendala saat menghapus pesanan: ${err?.message || 'Error tidak diketahui'}`);
    } finally {
      setIsDeletingOrderId(null);
    }
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
    const normalizedCat = prod.category === 'tshirt' ? 'tees' : prod.category === 'longsleeve' ? 'pants' : prod.category;
    setFormCategory(normalizedCat);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice);
    setFormDescription(prod.description);
    setFormMaterial(prod.material);
    setFormFit(prod.fit);
    setFormStock(prod.stockCount);
    setFormTag(prod.tag || '');
    setFormImage(prod.image);
    setFormAdditionalImages(prod.additionalImages || []);

    // Clean deduplicated colors from saved product data (by name)
    const seenCol = new Set<string>();
    const cleanColors: { name: string; hex: string }[] = [];
    if (prod.colors && Array.isArray(prod.colors)) {
      for (const c of prod.colors) {
        if (!c || !c.name) continue;
        const trimmed = c.name.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!seenCol.has(key)) {
          seenCol.add(key);
          cleanColors.push({
            name: trimmed,
            hex: c.hex && c.hex.trim() ? c.hex.trim() : '#18181B',
          });
        }
      }
    }
    setFormColors(cleanColors.length > 0 ? cleanColors : [{ name: 'Washed Black', hex: '#18181B' }]);

    // Load custom size chart rows if present, or match product sizes (never reset to default if custom exists)
    const initialChart =
      prod.customSizeChart && prod.customSizeChart.length > 0
        ? prod.customSizeChart
        : prod.sizes && prod.sizes.length > 0
        ? prod.sizes.map((sz) => {
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
          })
        : SIZE_CHART;

    setFormSizeChart(initialChart);
    setFormImageNotice(null);
  };

  // Open Create New Product Modal
  const openCreateProduct = () => {
    setIsCreatingNew(true);
    setEditingProduct(null);
    setFormName('');
    setFormSubtitle('');
    setFormCategory('tees');
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
    const defaultChart = [
      { size: 'S', chest: '54 cm', length: '68 cm', shoulder: '52 cm', sleeve: '22 cm' },
      { size: 'M', chest: '57 cm', length: '71 cm', shoulder: '55 cm', sleeve: '23 cm' },
      { size: 'L', chest: '60 cm', length: '74 cm', shoulder: '58 cm', sleeve: '24 cm' },
      { size: 'XL', chest: '63 cm', length: '77 cm', shoulder: '61 cm', sleeve: '25 cm' },
    ];
    setFormSizeChart(defaultChart);
    setFormImageNotice(null);
  };

  // Save Product Form: handles image upload validation, awaits database confirmation before closing
  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      alert('Nama produk dan harga wajib diisi.');
      return;
    }

    if (formSizeChart.length === 0) {
      alert('Minimal harus ada 1 ukuran pada Size Chart.');
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

      // Deduplicate colors strictly by name to prevent duplicates or redundant options
      const seenColNames = new Set<string>();
      const cleanColors: { name: string; hex: string }[] = [];
      for (const c of formColors) {
        if (!c || !c.name) continue;
        const trimmedName = c.name.trim();
        if (!trimmedName) continue;
        const key = trimmedName.toLowerCase();
        if (!seenColNames.has(key)) {
          seenColNames.add(key);
          cleanColors.push({
            name: trimmedName,
            hex: c.hex && c.hex.trim() ? c.hex.trim() : '#18181B',
          });
        }
      }

      // Clean, trim, and validate Size Chart rows
      const cleanSizeChart = formSizeChart
        .map((r) => ({
          size: r.size.trim(),
          chest: r.chest.trim() || '-',
          length: r.length.trim() || '-',
          shoulder: r.shoulder.trim() || '-',
          sleeve: r.sleeve.trim() || '-',
        }))
        .filter((r) => r.size.length > 0);

      if (cleanSizeChart.length === 0) {
        alert('Minimal harus ada 1 baris ukuran yang valid pada Size Chart.');
        setIsSavingProduct(false);
        return;
      }

      // Derive active sizes directly from clean Size Chart rows (preserves user casing, deduplicated)
      const seenSizes = new Set<string>();
      const finalSizes: string[] = [];
      for (const row of cleanSizeChart) {
        const key = row.size.toLowerCase();
        if (!seenSizes.has(key)) {
          seenSizes.add(key);
          finalSizes.push(row.size);
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
        sizes: finalSizes.length > 0 ? finalSizes : ['All Size'],
        colors: cleanColors.length > 0 ? cleanColors : [{ name: 'Pitch Black', hex: '#18181B' }],
        image: finalMainImage,
        additionalImages: finalAdditionalImages,
        customSizeChart: cleanSizeChart,
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
    setFormColors([...formColors, { name: 'Warna Baru', hex: '#365E52' }]);
  };

  const handleUpdateColor = (index: number, field: 'name' | 'hex', val: string) => {
    setFormColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  const handleRemoveColor = (index: number) => {
    if (formColors.length <= 1) {
      alert('Minimal harus ada 1 varian warna.');
      return;
    }
    setFormColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Size Chart Helpers (Menambah, Mengubah & Menghapus Ukuran secara dinamis)
  const handleAddSizeRow = () => {
    const existingSizes = formSizeChart.map((r) => r.size.toUpperCase().trim());
    const candidates = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'All Size'];
    const nextSize = candidates.find((s) => !existingSizes.includes(s)) || `Size-${formSizeChart.length + 1}`;

    setFormSizeChart((prev) => [
      ...prev,
      { size: nextSize, chest: '60 cm', length: '74 cm', shoulder: '58 cm', sleeve: '24 cm' },
    ]);
  };

  const handleUpdateSizeRow = (index: number, field: string, val: string) => {
    setFormSizeChart((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: val } : r))
    );
  };

  const handleRemoveSizeRow = (index: number) => {
    if (formSizeChart.length <= 1) {
      alert('Minimal harus ada 1 baris ukuran pada Size Chart agar pelanggan dapat memilih ukuran.');
      return;
    }
    const targetSize = formSizeChart[index]?.size || 'ini';
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus ukuran "${targetSize}" dari Size Chart produk ini?`
    );
    if (!confirmed) return;

    setFormSizeChart((prev) => prev.filter((_, i) => i !== index));
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
                  <div className="flex items-center gap-2">
                    {onRefreshOrders && (
                      <button
                        type="button"
                        disabled={isLoadingOrders}
                        onClick={loadOrdersFromDb}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Perbarui daftar pesanan langsung dari database Supabase"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin text-[#365E52]' : ''}`} />
                        <span className="hidden sm:inline">Segarkan Pesanan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isMigratingOrders}
                      onClick={handleMigrateLocalOrders}
                      className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Migrasikan pesanan browser ke database Supabase"
                    >
                      <Database className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Migrasi Pesanan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!orders || orders.length === 0) {
                          alert('Belum ada pesanan yang tersedia untuk dicetak.');
                          return;
                        }
                        setShowBatchPrint(true);
                      }}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cetak Semua Resi</span>
                    </button>
                  </div>
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
                  {/* Database Sync Banner */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#365E52] shrink-0" />
                      <span className="text-slate-700 font-medium">
                        Daftar pesanan tersinkronisasi online dengan tabel <strong>public.possensior_orders</strong> di Supabase.
                      </span>
                    </div>
                    {isLoadingOrders && (
                      <span className="flex items-center gap-1.5 text-[#365E52] font-semibold text-[11px] shrink-0">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memuat...</span>
                      </span>
                    )}
                  </div>

                  {orderFetchError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700">
                      <span>{orderFetchError}</span>
                      <button
                        type="button"
                        onClick={loadOrdersFromDb}
                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 font-bold rounded-lg cursor-pointer"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}

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
                                Penerima: <strong>{order.shipping?.fullName || 'Penerima'}</strong> ({order.shipping?.phone || '-'}) · {order.shipping?.city || '-'}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
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

                              {/* Tombol Cetak Resi Individual */}
                              <button
                                type="button"
                                onClick={() => handlePrintSingleOrder(order)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200 shadow-2xs hover:border-slate-300 active:scale-95"
                                title={`Cetak resi untuk pesanan ${order.invoiceNumber}`}
                              >
                                <Printer className="w-3.5 h-3.5 text-[#365E52]" />
                                <span>Cetak Resi</span>
                              </button>

                              {/* Tombol Hapus Pesanan Individual */}
                              <button
                                type="button"
                                disabled={isDeletingOrderId === order.id}
                                onClick={() => handleDeleteOrderClick(order)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-red-200 shadow-2xs disabled:opacity-50 active:scale-95"
                                title={`Hapus pesanan ${order.invoiceNumber}`}
                              >
                                {isDeletingOrderId === order.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                )}
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>

                          {/* Items & Shipping row */}
                          <div className="py-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                                Item Pesanan:
                              </span>
                              <div className="mt-1 space-y-1">
                                {(order.items || []).map((it) => (
                                  <div key={it.id} className="flex items-center justify-between">
                                    <span>
                                      {it.product?.name || 'Apparel Possensior'} ({it.selectedSize} · {it.selectedColor}) × {it.quantity}
                                    </span>
                                    <span className="font-mono text-slate-600">
                                      {formatRupiah((it.product?.price || 0) * it.quantity)}
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
                                Kurir: <strong className="uppercase">{order.shipping?.courier || 'JNE'}</strong> · Alamat: {order.shipping?.address || '-'}, {order.shipping?.city || '-'}
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
                            {formatCategoryName(product.category)} · Stok: {product.stockCount} pcs
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
                      <option value="tees">Tees</option>
                      <option value="pants">Pants</option>
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

                {/* Color Variants Manager (Strict source of truth for catalog color choices) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-[#365E52]" />
                        <span>Pilihan Varian Warna Produk</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Hanya warna yang ditambahkan di sini yang akan muncul sebagai pilihan di katalog pelanggan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[11px] text-[#365E52] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Warna</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {formColors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <input
                          type="color"
                          value={color.hex}
                          onChange={(e) => handleUpdateColor(idx, 'hex', e.target.value)}
                          className="w-7 h-7 rounded border-none cursor-pointer shrink-0"
                          title="Pilih kode warna swatch"
                        />
                        <input
                          type="text"
                          value={color.name}
                          onChange={(e) => handleUpdateColor(idx, 'name', e.target.value)}
                          placeholder="Nama warna (cth: Washed Black)"
                          className="flex-1 p-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-[#365E52]"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(idx)}
                          disabled={formColors.length <= 1}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title={formColors.length <= 1 ? "Minimal 1 varian warna harus tersisa" : "Hapus warna ini"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Chart & Sizes Editor (Add, edit size name, edit measurements, and delete rows) */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-[#365E52]" />
                        <span>Panduan Ukuran & Size Chart Produk</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Setiap ukuran yang ada di tabel ini otomatis menjadi opsi ukuran yang dapat dipilih pelanggan di katalog.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSizeRow}
                      className="px-3 py-1.5 bg-[#365E52] hover:bg-[#2A4B41] text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Ukuran</span>
                    </button>
                  </div>

                  {/* Size chart values table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                          <th className="p-2.5 font-bold">Ukuran (Size)</th>
                          <th className="p-2.5 font-bold">Lebar Dada</th>
                          <th className="p-2.5 font-bold">Panjang</th>
                          <th className="p-2.5 font-bold">Lebar Bahu</th>
                          <th className="p-2.5 font-bold">Panjang Lengan</th>
                          <th className="p-2.5 font-bold text-center w-14">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {formSizeChart.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.size}
                                onChange={(e) => handleUpdateSizeRow(idx, 'size', e.target.value)}
                                placeholder="cth: XXL"
                                className="w-24 p-1.5 border border-slate-300 rounded-md font-bold text-[#365E52] bg-white focus:outline-none focus:border-[#365E52]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.chest}
                                onChange={(e) => handleUpdateSizeRow(idx, 'chest', e.target.value)}
                                placeholder="cth: 60 cm"
                                className="w-24 p-1.5 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:border-[#365E52]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.length}
                                onChange={(e) => handleUpdateSizeRow(idx, 'length', e.target.value)}
                                placeholder="cth: 74 cm"
                                className="w-24 p-1.5 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:border-[#365E52]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.shoulder}
                                onChange={(e) => handleUpdateSizeRow(idx, 'shoulder', e.target.value)}
                                placeholder="cth: 58 cm"
                                className="w-24 p-1.5 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:border-[#365E52]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={row.sleeve}
                                onChange={(e) => handleUpdateSizeRow(idx, 'sleeve', e.target.value)}
                                placeholder="cth: 24 cm"
                                className="w-24 p-1.5 border border-slate-200 rounded-md text-slate-700 bg-white focus:outline-none focus:border-[#365E52]"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveSizeRow(idx)}
                                disabled={formSizeChart.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  formSizeChart.length <= 1
                                    ? 'Minimal harus ada 1 ukuran tersisa'
                                    : `Hapus ukuran ${row.size || `baris ke-${idx + 1}`}`
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>*Nilai pengukuran dapat diisi bebas secara manual (contoh: 54 cm, 60 cm, dsb).</span>
                    <span className="font-medium text-[#365E52]">Total {formSizeChart.length} ukuran aktif</span>
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

        {/* Single Order Shipping Receipt Print Modal */}
        <SingleReceiptPrintModal
          isOpen={!!singlePrintOrder}
          onClose={() => setSinglePrintOrder(null)}
          order={singlePrintOrder}
        />

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
