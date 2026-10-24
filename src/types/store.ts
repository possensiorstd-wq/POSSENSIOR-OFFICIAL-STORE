export type ProductCategory = 'all' | 'tees' | 'pants' | 'outerwear' | 'tshirt' | 'longsleeve';

export const formatCategoryName = (category?: string): string => {
  if (!category) return '';
  const lower = category.toLowerCase().trim();
  if (lower === 'tshirt' || lower === 'tees' || lower === 'boxy tshirt' || lower === 'boxy t-shirt') {
    return 'Tees';
  }
  if (lower === 'longsleeve' || lower === 'pants') {
    return 'Pants';
  }
  if (lower === 'outerwear') {
    return 'Outerwear';
  }
  return category;
};

export type ProductSize = string;

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  category: 'tees' | 'pants' | 'outerwear' | 'tshirt' | 'longsleeve';
  price: number;
  originalPrice?: number;
  description: string;
  material: string;
  fit: string;
  sizes: ProductSize[];
  colors: { name: string; hex: string }[];
  image: string;
  additionalImages?: string[];
  customSizeChart?: { size: string; chest: string; length: string; shoulder: string; sleeve: string }[];
  inStock: boolean;
  stockCount: number;
  tag?: string;
  features: string[];
}

export interface CartItem {
  id: string; // generated from productId + size + color
  product: Product;
  selectedSize: ProductSize;
  selectedColor: string;
  quantity: number;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  district?: string;
  subdistrict?: string;
  city: string;
  province: string;
  postalCode: string;
  courier: 'jne' | 'jnt' | 'spx';
  shippingCost: number;
  notes?: string;
}

export type PaymentType = 'qris' | 'bank_transfer';

export interface BankAccount {
  id: string;
  name: string;
  code: string;
  accountNumber: string;
  accountHolder: string;
  color: string;
}

export interface Order {
  id: string;
  dbId?: number | string;
  invoiceNumber: string;
  orderNumber?: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  otherFees?: number;
  shippingCost: number;
  discount: number;
  total: number;
  shipping: ShippingInfo;
  paymentMethod: PaymentType;
  selectedBank?: BankAccount;
  paymentStatus: 'menunggu_pembayaran' | 'terverifikasi' | 'diproses' | 'dikirim' | 'selesai';
  trackingNumber: string;
  courierResi?: string;
  proofUploaded?: boolean;
  proofFileName?: string;
  timeline: {
    status: string;
    description: string;
    timestamp: string;
    completed: boolean;
    current?: boolean;
  }[];
}

export interface LookbookItem {
  id: string;
  title?: string;
  description?: string;
  image_path?: string;
  image_url: string;
  sort_order?: number;
  created_at?: string | null;
  season?: string;
}

