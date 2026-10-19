export type ProductCategory = 'all' | 'tshirt' | 'longsleeve' | 'outerwear';

export type ProductSize = string;

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  slug: string;
  category: 'tshirt' | 'longsleeve' | 'outerwear';
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
  city: string;
  province: string;
  postalCode: string;
  courier: 'jne' | 'sicepat' | 'jnt';
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
  invoiceNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
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
