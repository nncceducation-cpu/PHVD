// Camera capture + on-device OCR (ML Kit) for reading ultrasound measurements.
// All processing is on-device; the photo never leaves the phone.
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorPluginMlKitTextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';

export interface DetectedNumber {
  id: string;
  raw: string; // what the user sees, e.g. "2.26 cm"
  value: number; // the number as printed (e.g. 2.26)
  valueMm: number; // normalized to mm (cm*10, mm as-is, unitless as-is)
  unit: 'cm' | 'mm' | '';
}

// OCR is only available inside the native app (ML Kit is a native module).
export function isScanAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function captureAndDetect(): Promise<DetectedNumber[]> {
  const photo = await Camera.getPhoto({
    quality: 90,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    correctOrientation: true,
    saveToGallery: false,
  });
  const base64 = photo.base64String;
  if (!base64) throw new Error('No image captured');
  const result = await CapacitorPluginMlKitTextRecognition.detectText({ base64Image: base64 });
  return parseNumbers(result.text || '');
}

// Pull plausible measurement numbers out of raw OCR text.
export function parseNumbers(text: string): DetectedNumber[] {
  // Strip dates (28/07/2026), times (13:06:33) and percentages so their digits
  // don't get mistaken for measurements.
  const cleaned = text
    .replace(/\d{1,4}[\/:]\d{1,2}(?:[\/:]\d{1,4})?/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*%/g, ' ');

  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(cm|mm)?/gi;
  const out: DetectedNumber[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(cleaned)) !== null) {
    const numStr = m[1].replace(',', '.');
    const unit = (m[2] || '').toLowerCase() as 'cm' | 'mm' | '';
    const value = parseFloat(numStr);
    if (!isFinite(value)) continue;
    // Keep: anything tagged cm/mm, or a decimal (has a dot) that could be a
    // measurement (0.1-30) or an RI (0-1). Drop bare integers (frame counts, etc).
    const isDecimal = numStr.includes('.');
    if (!unit && !isDecimal) continue;
    if (!unit && (value <= 0 || value > 30)) continue;
    if (unit && (value <= 0 || value > 99)) continue;

    const valueMm = unit === 'cm' ? value * 10 : value; // mm or unitless as-is
    const raw = unit ? `${numStr} ${unit}` : numStr;
    const key = raw;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: `n${i++}`, raw, value, valueMm, unit });
  }
  return out;
}
