import { v4 as uuidv4 } from 'uuid';
import type { GardenPhoto } from '@/types/note';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.75;

export async function compressAndEncodeImage(file: File): Promise<GardenPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          } else {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        const base64Length = dataUrl.split(',')[1]?.length ?? 0;
        const sizeKb = Math.round((base64Length * 3) / 4 / 1024);

        resolve({
          id: uuidv4(),
          dataUrl,
          fileName: file.name,
          sizeKb,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
