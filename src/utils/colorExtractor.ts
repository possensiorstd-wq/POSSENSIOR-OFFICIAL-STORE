/**
 * Utility to extract dominant colors from an image using HTML5 Canvas.
 * Automatically samples pixels to find the most representative color swatches.
 */

export interface ExtractedColor {
  name: string;
  hex: string;
}

export function extractDominantColorsFromImage(
  imageSrc: string,
  fallbackColors: ExtractedColor[] = [{ name: 'Default', hex: '#18181B' }]
): Promise<ExtractedColor[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackColors);
          return;
        }

        // Downscale to 64x64 for fast color sampling
        const width = 64;
        const height = 64;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height).data;
        const colorCounts: { [key: string]: { count: number; r: number; g: number; b: number } } = {};

        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip completely transparent or pure white background edges
          if (a < 128) continue;
          if (r > 245 && g > 245 && b > 245) continue;

          // Quantize to reduce color variance
          const qR = Math.round(r / 24) * 24;
          const qG = Math.round(g / 24) * 24;
          const qB = Math.round(b / 24) * 24;
          const key = `${qR},${qG},${qB}`;

          if (!colorCounts[key]) {
            colorCounts[key] = { count: 0, r: qR, g: qG, b: qB };
          }
          colorCounts[key].count += 1;
        }

        const sorted = Object.values(colorCounts).sort((a, b) => b.count - a.count);

        if (sorted.length === 0) {
          resolve(fallbackColors);
          return;
        }

        const toHex = (c: number) => {
          const hex = Math.min(255, Math.max(0, c)).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        };

        const dominantSwatches: ExtractedColor[] = sorted.slice(0, 3).map((c, index) => {
          const hex = `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
          let colorName = `Dominant Tone ${index + 1}`;
          
          // Heuristic name identification
          const brightness = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
          if (brightness < 40) colorName = 'Pitch Charcoal';
          else if (c.b > c.r + 20 && c.b > c.g) colorName = 'Cobalt Tone';
          else if (c.g > c.r && c.g > c.b) colorName = 'Sage Olive';
          else if (c.r > c.b && c.r > c.g + 20) colorName = 'Warm Earth';
          else if (brightness > 200) colorName = 'Natural Chalk';
          else colorName = `Tone #${index + 1}`;

          return { name: colorName, hex };
        });

        resolve(dominantSwatches.length > 0 ? dominantSwatches : fallbackColors);
      } catch (err) {
        console.warn('Color extraction fallback used:', err);
        resolve(fallbackColors);
      }
    };

    img.onerror = () => {
      resolve(fallbackColors);
    };
  });
}

/**
 * Image compressor utility:
 * If an uploaded image file exceeds maxSizeBytes (5MB), compress it using Canvas to JPEG.
 */
export async function compressImageIfExceeds(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024
): Promise<{ dataUrl: string; originalSize: number; compressedSize: number; wasCompressed: boolean }> {
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (originalSize <= maxSizeBytes) {
        resolve({
          dataUrl,
          originalSize,
          compressedSize: originalSize,
          wasCompressed: false,
        });
        return;
      }

      // Needs compression
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down dimensions if huge
        const MAX_DIM = 2400;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl, originalSize, compressedSize: originalSize, wasCompressed: false });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to quality 0.82
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        // Estimate size from base64
        const compressedSize = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          originalSize,
          compressedSize,
          wasCompressed: true,
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
