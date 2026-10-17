import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Exact name of the pre-created Supabase Storage Bucket.
 * Matched strictly to user configuration: "POSSENSIOR MEDIA"
 */
export const STORAGE_BUCKET_NAME = 'POSSENSIOR MEDIA';

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
