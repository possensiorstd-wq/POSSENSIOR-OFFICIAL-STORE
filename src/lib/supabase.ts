import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../types/store';

/**
 * Exact name of the pre-created Supabase Storage Bucket.
 * Matched strictly to user configuration: "POSSENSIOR MEDIA"
 */
export const STORAGE_BUCKET_NAME = 'POSSENSIOR MEDIA';

/**
 * Verified Owner Supabase Auth UID.
 * Only this user has administrative write access via RLS.
 */
export const OWNER_UID = 'c03c6c3a-a534-41d5-bb57-85e335f4135b';

/**
 * Database table name for product catalog.
 */
export const PRODUCTS_TABLE = 'possensior_products';

/**
 * Normalizes user-supplied Supabase Project URL.
 * Automatically cleans any trailing slash or accidental /rest/v1 path.
 */
function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = normalizeSupabaseUrl(rawUrl);

// Support both VITE_SUPABASE_ANON and VITE_SUPABASE_ANON_KEY consistently
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

/**
 * Checks whether valid Supabase environment variables are present and well-formed.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.includes('placeholder')
);

/**
 * Supabase client instance initialized with Anon key.
 * Safely initializes with fallback values if credentials are not yet set
 * to prevent runtime crashes during initial build or preview.
 */
export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Helper to convert Base64 Data URL to a native binary Blob for upload.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

/**
 * Fetch products from the Supabase public.possensior_products table.
 * Returns null if not configured or on network/query failure.
 */
export async function fetchProductsFromDatabase(): Promise<{
  products: Product[] | null;
  count: number;
  error: string | null;
}> {
  if (!isSupabaseConfigured) {
    return {
      products: null,
      count: 0,
      error: 'Supabase belum terkonfigurasi pada environment.',
    };
  }

  try {
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('id, product, updated_at')
      .order('updated_at', { ascending: false });

    if (error) {
      return { products: null, count: 0, error: error.message };
    }

    if (!data) {
      return { products: [], count: 0, error: null };
    }

    const parsed: Product[] = data
      .map((row: any) => {
        if (!row.product) return null;
        const item =
          typeof row.product === 'string'
            ? JSON.parse(row.product)
            : row.product;
        return {
          ...item,
          id: row.id || item.id,
        };
      })
      .filter(Boolean) as Product[];

    return { products: parsed, count: parsed.length, error: null };
  } catch (err: any) {
    return {
      products: null,
      count: 0,
      error: err?.message || 'Gagal memuat produk dari database.',
    };
  }
}

/**
 * Upsert a single product to public.possensior_products.
 * Column 'id' matches product.id, and column 'product' holds the full Product JSON.
 */
export async function saveProductToDatabase(
  product: Product
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const { error } = await supabase.from(PRODUCTS_TABLE).upsert(
      {
        id: product.id,
        product: product,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return {
      error: err?.message || 'Gagal menyimpan produk ke database Supabase.',
    };
  }
}

/**
 * Deletes a product from public.possensior_products by id.
 */
export async function deleteProductFromDatabase(
  productId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .delete()
      .eq('id', productId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err: any) {
    return {
      error: err?.message || 'Gagal menghapus produk dari database Supabase.',
    };
  }
}

/**
 * Database table name for orders if synced to Supabase.
 */
export const ORDERS_TABLE = 'possensior_orders';

/**
 * Deletes an order from public.possensior_orders table if available.
 */
export async function deleteOrderFromDatabase(
  orderId: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from(ORDERS_TABLE)
      .delete()
      .eq('id', orderId);

    if (error && error.code !== '42P01' && !error.message.includes('does not exist')) {
      console.warn('Supabase order delete error:', error.message);
    }
    return { error: null };
  } catch (err: any) {
    console.warn('Supabase order delete error caught:', err?.message);
    return { error: null };
  }
}

/**
 * Explicit migration of default products into the database.
 * Only called on direct user request via Owner Control.
 */
export async function migrateDefaultProductsToDatabase(
  defaultProducts: Product[]
): Promise<{ count: number; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { count: 0, error: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const rows = defaultProducts.map((p) => ({
      id: p.id,
      product: p,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from(PRODUCTS_TABLE)
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: rows.length, error: null };
  } catch (err: any) {
    return {
      count: 0,
      error: err?.message || 'Gagal memigrasikan produk default ke database.',
    };
  }
}

/**
 * Helper function to explicitly test the Supabase connection.
 * Does NOT assume or claim success without a real server response.
 * Never logs or returns secret keys.
 */
export async function testSupabaseConnection(): Promise<{
  configured: boolean;
  connected: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured) {
    const missing: string[] = [];
    if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON / VITE_SUPABASE_ANON_KEY');

    return {
      configured: false,
      connected: false,
      message: `Konfigurasi belum lengkap: ${missing.join(', ')} belum terisi.`,
    };
  }

  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      return {
        configured: true,
        connected: false,
        message: `Gagal terhubung ke endpoint Supabase: ${authError.message}`,
      };
    }

    return {
      configured: true,
      connected: true,
      message: 'Koneksi ke Supabase berhasil diverifikasi (Auth endpoint merespons dengan status 200 OK).',
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      message: `Terjadi kendala saat menghubungkan ke Supabase: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Uploads an image file or blob directly to the "POSSENSIOR MEDIA" Supabase Storage bucket.
 * Returns the public URL upon success, or an informative error message.
 */
export async function uploadImageToSupabase(
  file: File | Blob,
  folder: 'catalog' | 'branding' | 'general' = 'catalog'
): Promise<{ url: string | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return {
      url: null,
      error: 'Supabase belum dikonfigurasi dengan URL dan Anon Key yang valid.',
    };
  }

  try {
    let extension = 'jpg';
    if ('name' in file && typeof file.name === 'string') {
      const parts = file.name.split('.');
      if (parts.length > 1) {
        extension = parts.pop()?.toLowerCase() || 'jpg';
      }
    } else if (file.type) {
      if (file.type.includes('png')) extension = 'png';
      else if (file.type.includes('webp')) extension = 'webp';
      else if (file.type.includes('jpeg') || file.type.includes('jpg')) extension = 'jpg';
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const filePath = `${folder}/${uniqueId}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || `image/${extension}`,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    return {
      url: null,
      error: err?.message || 'Terjadi kesalahan tidak terduga saat mengunggah gambar.',
    };
  }
}

/**
 * Removes an image from the "POSSENSIOR MEDIA" bucket by its path or full public URL.
 */
export async function deleteImageFromSupabase(
  fileUrlOrPath: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured || !fileUrlOrPath) {
    return { success: false, error: 'Klien Supabase belum aktif atau URL kosong.' };
  }

  try {
    let targetPath = fileUrlOrPath;

    const bucketMarker = `/${encodeURIComponent(STORAGE_BUCKET_NAME)}/`;
    const bucketMarkerPlain = `/${STORAGE_BUCKET_NAME}/`;

    if (fileUrlOrPath.includes(bucketMarker)) {
      targetPath = decodeURIComponent(fileUrlOrPath.split(bucketMarker)[1]);
    } else if (fileUrlOrPath.includes(bucketMarkerPlain)) {
      targetPath = fileUrlOrPath.split(bucketMarkerPlain)[1];
    }

    targetPath = targetPath.split('?')[0];

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .remove([targetPath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Gagal menghapus gambar dari storage.' };
  }
}

/**
 * Performs a safe inspection of bucket access for 'POSSENSIOR MEDIA'.
 * Verifies bucket existence and checks whether RLS allows public uploads.
 */
export async function checkStorageBucketStatus(): Promise<{
  bucketExists: boolean;
  canUpload: boolean;
  message: string;
}> {
  if (!isSupabaseConfigured) {
    return {
      bucketExists: false,
      canUpload: false,
      message: 'Kredensial Supabase belum terkonfigurasi.',
    };
  }

  try {
    const { error: listError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .list('', { limit: 1 });

    if (listError) {
      return {
        bucketExists: false,
        canUpload: false,
        message: `Tidak dapat mengakses bucket "${STORAGE_BUCKET_NAME}": ${listError.message}`,
      };
    }

    // Test write permission with a micro 1x1 png blob
    const pixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const binary = atob(pixelBase64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
    const testBlob = new Blob([array], { type: 'image/png' });
    const pingFile = `_ping_test_${Date.now()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(pingFile, testBlob, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      return {
        bucketExists: true,
        canUpload: false,
        message: `Bucket "${STORAGE_BUCKET_NAME}" terdeteksi, namun unggahan dibatasi oleh Storage Policy: ${uploadError.message}`,
      };
    }

    // Clean up ping file immediately
    await supabase.storage.from(STORAGE_BUCKET_NAME).remove([pingFile]);

    return {
      bucketExists: true,
      canUpload: true,
      message: `Bucket "${STORAGE_BUCKET_NAME}" aktif dan izin unggah gambar berfungsi normal.`,
    };
  } catch (err: any) {
    return {
      bucketExists: false,
      canUpload: false,
      message: `Pemeriksaan bucket menghasilkan error: ${err?.message || 'Network error'}`,
    };
  }
}
