import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ProductCategory, ProductSize, CartItem, Order } from './types/store';
import { PRODUCTS, INITIAL_ORDERS } from './data/products';
import { LandingView } from './components/LandingView';
import { Navbar } from './components/Navbar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { OrderTrackingView } from './components/OrderTrackingView';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ContactModal } from './components/ContactModal';
import { AboutModal } from './components/AboutModal';
import { OwnerControl } from './components/OwnerControl';
import { Footer } from './components/Footer';
import { Search, Check } from 'lucide-react';
import { PossensiorIcon } from './components/Logos';
import {
  fetchProductsFromDatabase,
  saveProductToDatabase,
  deleteProductFromDatabase,
  fetchOrdersFromDatabase,
  updateOrderInDatabase,
  deleteOrderFromDatabase,
  migrateDefaultProductsToDatabase,
  isSupabaseConfigured,
  sanitizeOrderRecord,
} from './lib/supabase';

export default function App() {
  // Navigation View: 'landing' | 'home' | 'checkout' | 'tracking'
  const [currentView, setCurrentView] = useState<'landing' | 'home' | 'checkout' | 'tracking'>('landing');
  const [currentCategory, setCurrentCategory] = useState<ProductCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isOwnerOpen, setIsOwnerOpen] = useState(false);

  // Products State (Persisted in localStorage with online Supabase synchronization)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('possensior_products');
      return saved ? JSON.parse(saved) : PRODUCTS;
    } catch {
      return PRODUCTS;
    }
  });

  // Track initial Supabase catalog fetch completion to prevent race conditions
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Cart State (Persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('possensior_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Orders State (Persisted in localStorage with schema sanitization)
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('possensior_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((o) => sanitizeOrderRecord(o));
        }
      }
      return INITIAL_ORDERS.map((o) => sanitizeOrderRecord(o));
    } catch {
      return INITIAL_ORDERS.map((o) => sanitizeOrderRecord(o));
    }
  });

  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [initialTrackingCode, setInitialTrackingCode] = useState<string>('');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch products from public.possensior_products on startup
  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const { products: dbProducts, error } = await fetchProductsFromDatabase();
        if (!isMounted) return;

        if (!error && dbProducts && dbProducts.length > 0) {
          setProducts(dbProducts);
          try {
            localStorage.setItem('possensior_products', JSON.stringify(dbProducts));
          } catch (e) {
            console.error('Failed to update localStorage with DB products', e);
          }
        } else if (!error && dbProducts && dbProducts.length === 0) {
          // Database is readable but empty: keep safe fallback without overwriting DB automatically
          console.log('Database Supabase kosong. Menggunakan fallback lokal aman.');
        }
      } catch (err) {
        console.error('Failed to load products from database', err);
      } finally {
        if (isMounted) setIsDbLoaded(true);
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync products to localStorage only after initial DB fetch completes to avoid race condition
  useEffect(() => {
    if (!isDbLoaded) return;
    try {
      localStorage.setItem('possensior_products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products, isDbLoaded]);

  useEffect(() => {
    try {
      localStorage.setItem('possensior_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('possensior_orders', JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders to localStorage', e);
    }
  }, [orders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    selectedSize: ProductSize,
    selectedColor: string,
    quantity: number
  ) => {
    const itemId = `${product.id}-${selectedSize}-${selectedColor}`;
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === itemId);
      if (existing) {
        return prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevItems,
        {
          id: itemId,
          product,
          selectedSize,
          selectedColor,
          quantity,
        },
      ];
    });

    showToast(`${product.name} (${selectedSize}) ditambahkan ke keranjang`);
    setSelectedProduct(null);
  };

  const handleBuyNow = (
    product: Product,
    selectedSize: ProductSize,
    selectedColor: string,
    quantity: number
  ) => {
    handleAddToCart(product, selectedSize, selectedColor, quantity);
    setSelectedProduct(null);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Item dihapus dari keranjang');
  };

  const handleApplyVoucher = (code: string): boolean => {
    if (code === 'POSS10' || code === 'POSSENSIOR') {
      setDiscountPercent(10);
      showToast('Kupon diskon 10% berhasil diaktifkan!');
      return true;
    }
    return false;
  };

  // Order Flow
  const handleOrderCreated = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setCartItems([]);
    setCompletedOrder(order);
  };

  const handleTrackOrderFromSuccess = (invoiceNumber: string) => {
    setInitialTrackingCode(invoiceNumber);
    setCompletedOrder(null);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Owner Operations (Synchronized with Supabase and localStorage)
  const handleRefreshOrders = async (): Promise<void> => {
    try {
      const { orders: dbOrders, error } = await fetchOrdersFromDatabase();
      if (!error && dbOrders) {
        setOrders(dbOrders);
        try {
          localStorage.setItem('possensior_orders', JSON.stringify(dbOrders));
        } catch (e) {
          console.error('Failed to update localStorage with DB orders', e);
        }
      }
    } catch (e) {
      console.error('Failed to refresh orders from database', e);
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
    );
    try {
      if (isSupabaseConfigured) {
        const { error } = await updateOrderInDatabase(updatedOrder);
        if (error) {
          showToast(`Peringatan: Gagal memperbarui di database (${error})`);
          return;
        }
      }
      showToast(`Pesanan ${updatedOrder.invoiceNumber} diperbarui di database`);
    } catch (err: any) {
      console.error('Error updating order', err);
    }
  };

  const handleDeleteOrder = async (orderId: string): Promise<boolean> => {
    try {
      if (isSupabaseConfigured) {
        const { error } = await deleteOrderFromDatabase(orderId);
        if (error) {
          alert(`Gagal menghapus pesanan dari database: ${error}`);
          return false;
        }
      }
      setOrders((prev) => {
        const updated = prev.filter((o) => o.id !== orderId);
        try {
          localStorage.setItem('possensior_orders', JSON.stringify(updated));
        } catch (e) {
          console.error('LocalStorage write error', e);
        }
        return updated;
      });
      showToast('Pesanan berhasil dihapus');
      return true;
    } catch (err: any) {
      alert(`Gagal menghapus pesanan: ${err?.message || 'Error tidak diketahui'}`);
      return false;
    }
  };

  const handleAddProduct = async (newProduct: Product): Promise<boolean> => {
    const { error } = await saveProductToDatabase(newProduct);
    if (error) {
      alert(`Gagal menyimpan produk ke database Supabase: ${error}`);
      return false;
    }
    setProducts((prev) => [newProduct, ...prev]);
    showToast(`Produk "${newProduct.name}" berhasil disimpan ke database`);
    return true;
  };

  const handleUpdateProduct = async (updatedProduct: Product): Promise<boolean> => {
    const { error } = await saveProductToDatabase(updatedProduct);
    if (error) {
      alert(`Gagal memperbarui produk di database Supabase: ${error}`);
      return false;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    showToast(`Produk "${updatedProduct.name}" berhasil diperbarui di database`);
    return true;
  };

  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    const { error } = await deleteProductFromDatabase(productId);
    if (error) {
      alert(`Gagal menghapus produk dari database Supabase: ${error}`);
      return false;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Produk berhasil dihapus dari database');
    return true;
  };

  const handleMigrateDefaultProducts = async (): Promise<{
    success: boolean;
    count?: number;
    message: string;
  }> => {
    const { count, error } = await migrateDefaultProductsToDatabase(PRODUCTS);
    if (error) {
      return { success: false, message: `Migrasi gagal: ${error}` };
    }
    const { products: refreshed } = await fetchProductsFromDatabase();
    if (refreshed && refreshed.length > 0) {
      setProducts(refreshed);
    }
    showToast(`${count} produk awal berhasil dimigrasikan ke database`);
    return {
      success: true,
      count,
      message: `Berhasil memigrasikan ${count} produk ke database Supabase.`,
    };
  };

  const handleRefreshProducts = async () => {
    const { products: refreshed, error } = await fetchProductsFromDatabase();
    if (error) {
      alert(`Gagal memuat produk dari database: ${error}`);
      return;
    }
    if (refreshed && refreshed.length > 0) {
      setProducts(refreshed);
      showToast('Katalog berhasil disegarkan dari database Supabase');
    } else {
      showToast('Katalog database kosong atau belum diisi');
    }
  };

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      currentCategory === 'all' || product.category === currentCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0;
  });

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#1E2927] flex flex-col font-sans selection:bg-[#365E52] selection:text-white">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#1E2927] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 pointer-events-none"
          >
            <Check className="w-4 h-4 text-[#4ADE80]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Router with Smooth Page Transitions */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <LandingView
              onEnterStore={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="store-views-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            {/* Header Navbar with Kontak, About Us, Cek Resi & Icon-Only Cart */}
            <Navbar
              cartCount={cartTotalCount}
              onOpenCart={() => setIsCartOpen(true)}
              onNavigateTracking={() => {
                setCurrentView('tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenContact={() => setIsContactOpen(true)}
              onOpenAbout={() => setIsAboutOpen(true)}
              onBackToLanding={() => {
                setCurrentView('landing');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onGoHome={() => {
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              currentView={currentView}
            />

            {/* View Sub-Router */}
            <main className="flex-1">
              <AnimatePresence mode="wait">
                {currentView === 'home' && (
                  <motion.div
                    key="home-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
                  >
                    {/* Green Banner - Updated with exact text from Image 1 */}
                    <div className="relative mb-10 p-6 sm:p-10 rounded-3xl bg-[#2B473E] text-white overflow-hidden shadow-lg border border-[#3A5D52]">
                      <div className="relative z-10 max-w-2xl">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A2CEBE] block mb-2">
                          POSSENSIOR · OFFICIAL RELEASE 2026
                        </span>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mt-1 leading-snug">
                          Built Different. Worn With Purpose.
                        </h2>
                        <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                          POSSENSIOR menghadirkan streetwear dengan karakter kuat, siluet yang terdefinisi, dan perhatian pada setiap detail. Dirancang untuk mereka yang mengekspresikan identitas melalui gaya, dengan standar kualitas yang melampaui tren.
                        </p>
                      </div>

                      {/* Subtle Ambient Decorative Motif */}
                      <div className="absolute -right-8 -bottom-10 opacity-15 pointer-events-none">
                        <PossensiorIcon className="w-64 h-64 text-white" color="#ffffff" />
                      </div>
                    </div>

                    {/* Filter, Search & Category Segmented Controls */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                      {/* Segmented Category Buttons */}
                      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
                        <button
                          onClick={() => setCurrentCategory('all')}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            currentCategory === 'all'
                              ? 'bg-white text-[#365E52] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Semua Produk ({products.length})
                        </button>
                        <button
                          onClick={() => setCurrentCategory('tshirt')}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            currentCategory === 'tshirt'
                              ? 'bg-white text-[#365E52] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Boxy T-Shirt
                        </button>
                        <button
                          onClick={() => setCurrentCategory('longsleeve')}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            currentCategory === 'longsleeve'
                              ? 'bg-white text-[#365E52] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Longsleeve
                        </button>
                        <button
                          onClick={() => setCurrentCategory('outerwear')}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            currentCategory === 'outerwear'
                              ? 'bg-white text-[#365E52] shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Outerwear
                        </button>
                      </div>

                      {/* Search Bar & Sort Dropdown */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1 sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari artikel streetwear..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#365E52]"
                          />
                        </div>

                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-[#365E52] cursor-pointer"
                        >
                          <option value="featured">Urutkan: Unggulan</option>
                          <option value="price-asc">Harga: Rendah ke Tinggi</option>
                          <option value="price-desc">Harga: Tinggi ke Rendah</option>
                        </select>
                      </div>
                    </div>

                    {/* Product Grid */}
                    {filteredProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onOpenDetail={(prod) => setSelectedProduct(prod)}
                            onQuickAdd={(prod) => setSelectedProduct(prod)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
                        <p className="text-sm font-semibold text-slate-700">Tidak ada produk yang cocok</p>
                        <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setCurrentCategory('all');
                          }}
                          className="mt-4 px-4 py-2 bg-[#365E52] text-white text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {currentView === 'checkout' && (
                  <motion.div
                    key="checkout-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CheckoutView
                      items={cartItems}
                      discount={discountPercent}
                      onBackToStore={() => {
                        setCurrentView('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onOrderCompleted={handleOrderCreated}
                    />
                  </motion.div>
                )}

                {currentView === 'tracking' && (
                  <motion.div
                    key="tracking-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <OrderTrackingView
                      orders={orders}
                      initialTrackingCode={initialTrackingCode}
                      onBackToHome={() => {
                        setCurrentView('home');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Global Footer with Social Media & Owner Only Link */}
            <Footer
              onSelectCategory={(cat) => {
                setCurrentCategory(cat);
                setCurrentView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onNavigateTracking={() => {
                setCurrentView('tracking');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenOwnerControl={() => setIsOwnerOpen(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onProceedCheckout={() => {
            setIsCartOpen(false);
            setCurrentView('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          discount={discountPercent}
          onApplyVoucher={handleApplyVoucher}
        />
      )}

      {/* Order Success Modal */}
      {completedOrder && (
        <OrderSuccessModal
          order={completedOrder}
          isOpen={!!completedOrder}
          onTrackOrder={handleTrackOrderFromSuccess}
          onContinueShopping={() => {
            setCompletedOrder(null);
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Contact Modal */}
      {isContactOpen && (
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />
      )}

      {/* About Us Modal */}
      {isAboutOpen && (
        <AboutModal
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      )}

      {/* Owner Control Dashboard Modal */}
      {isOwnerOpen && (
        <OwnerControl
          isOpen={isOwnerOpen}
          onClose={() => setIsOwnerOpen(false)}
          orders={orders}
          onUpdateOrder={handleUpdateOrder}
          onDeleteOrder={handleDeleteOrder}
          products={products}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onMigrateDefaultProducts={handleMigrateDefaultProducts}
          onRefreshProducts={handleRefreshProducts}
          onRefreshOrders={handleRefreshOrders}
          isDbConfigured={isSupabaseConfigured}
        />
      )}
    </div>
  );
}
