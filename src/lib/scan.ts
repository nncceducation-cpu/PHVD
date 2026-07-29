// Camera capture + on-device OCR (ML Kit) for reading ultrasound measurements.
// All processing is on-device; the photo never leaves the phone.
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorPluginMlKitTextRecognition } from '@pantrist/capacitor-plugin-ml-kit-text-recognition';

export interface DetectedNumber {
  id: string;
  raw: string; // what the user sees, e.g. "2.26 cm"
  value: number; // the number as printed (e.g. 2.26)
  valueMm: number; // normalized to mm (cm*10, mm as-is)
  unit: 'cm' | 'mm' | '';
  kind: 'measure' | 'ri'; // caliper measurement vs a Resistive Index value
  seq?: number; // 1-based caliper number as shown on the screen (measurements only)
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
  // Resistive Index is only trusted when explicitly labelled "RI" (so it is not
  // confused with the MI/TI acoustic-output indices, which are also 0-1 decimals).
  let ri: number | null = null;
  const riMatch = text.match(/\bR\s?I\b\s*[:=]?\s*(\d?\.\d{1,2})/i);
  if (riMatch) {
    const v = parseFloat(riMatch[1]);
    if (isFinite(v) && v > 0 && v <= 1.5) ri = v;
  }

  // Remove things whose digits must not be read as measurements:
  //  - dates (28/07/2026) and times (13:06:33)
  //  - percentages (AO: 50%)
  //  - acoustic-output / mechanical / thermal indices (MI 0.7, TI 0.2, TIS, TIB, AO 50)
  //  - the RI token itself
  const cleaned = text
    .replace(/\d{1,4}[/:]\d{1,2}(?:[/:]\d{1,4})?/g, ' ')
    .replace(/\d+(?:\.\d+)?\s*%/g, ' ')
    .replace(/\b(MI|TI|TIS|TIB|AO)\b\s*[:=]?\s*\d+(?:\.\d+)?/gi, ' ')
    .replace(/\bR\s?I\b\s*[:=]?\s*\d?\.\d{1,2}/gi, ' ');

  // Match numbers optionally followed by cm/mm. A caliper list looks like
  // "1 d1 2.26 cm  2 d1 1.73 cm ..."; the leading "1 d1" index digits are bare
  // integers and are dropped, leaving the real "2.26 cm" values.
  const re = /(\d{1,3}(?:[.,]\d{1,2})?)\s*(cm|mm)?/gi;
  const out: DetectedNumber[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  let i = 0;
  let seq = 0;
  while ((m = re.exec(cleaned)) !== null) {
    const numStr = m[1].replace(',', '.');
    const unit = (m[2] || '').toLowerCase() as 'cm' | 'mm' | '';
    const value = parseFloat(numStr);
    if (!isFinite(value)) continue;
    // A measurement must carry a cm/mm unit (this is what excludes caliper index
    // numbers 1,2,3,4 and probe/frame counts, which are unit-less integers).
    if (!unit) continue;
    if (value <= 0 || value > 99) continue;
    const valueMm = unit === 'cm' ? Math.round(value * 100) / 10 : value; // cm->mm
    const raw = `${numStr} ${unit}`;
    if (seen.has(raw)) continue;
    seen.add(raw);
    seq += 1;
    out.push({ id: `n${i++}`, raw, value, valueMm, unit, kind: 'measure', seq });
  }

  if (ri !== null) {
    out.push({ id: `ri${i++}`, raw: `RI ${ri}`, value: ri, valueMm: ri, unit: '', kind: 'ri' });
  }
  return out;
}
