export interface CapturedImage {
  /** Base64 data (no `data:` prefix) */
  base64: string;
  mimeType: string;
  /** Data URL, ready to use directly in <img src> */
  previewUrl: string;
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

function drawToCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

function scaledDimensions(width: number, height: number) {
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

function canvasToCapturedImage(canvas: HTMLCanvasElement): CapturedImage {
  const previewUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = previewUrl.split(",")[1] ?? "";
  return { base64, mimeType: "image/jpeg", previewUrl };
}

/** Downscale + re-encode an uploaded/captured file so the payload sent to Gemini stays small. */
export async function compressImageFile(file: File): Promise<CapturedImage> {
  const bitmap = await createImageBitmapSafe(file);
  const { width, height } = scaledDimensions(bitmap.width, bitmap.height);
  const canvas = drawToCanvas(bitmap, width, height);
  return canvasToCapturedImage(canvas);
}

/** Grab a still frame from a live <video> element (webcam stream). */
export function captureFrameFromVideo(video: HTMLVideoElement): CapturedImage {
  const { width, height } = scaledDimensions(video.videoWidth, video.videoHeight);
  const canvas = drawToCanvas(video, width, height);
  return canvasToCapturedImage(canvas);
}

/** Smaller avatar image for profile storage in localStorage. */
export async function compressAvatarFile(file: File): Promise<string> {
  const bitmap = await createImageBitmapSafe(file);
  const max = 256;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = drawToCanvas(bitmap, width, height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

async function createImageBitmapSafe(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // fall through to <img> based decoding
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
