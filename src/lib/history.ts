import { type VentricularMeasurements } from './risk';

export interface Measurement extends VentricularMeasurements {
  id: string;
  date: string;
  ri: number;
}

export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function measurementError(m: Measurement): string | null {
  if (!Number.isFinite(m.pma) || m.pma < 24 || m.pma > 42 ||
      [m.viLeft, m.viRight, m.ahwLeft, m.ahwRight].some(v => !Number.isFinite(v) || v <= 0)) {
    return 'Enter PMA between 24 and 42 weeks and positive VI and AHW measurements on both sides.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(m.date) || !Number.isFinite(Date.parse(m.date)) || new Date(m.date).toISOString().slice(0, 10) !== m.date) {
    return 'Enter a valid assessment date.';
  }
  if (!Number.isFinite(m.ri) || m.ri < 0 || m.ri > 1.5) return 'RI must be blank or between 0 and 1.5.';
  return null;
}

export function readHistory(): { measurements: Measurement[]; message: string | null } {
  try {
    const saved = localStorage.getItem('phvd_data');
    if (!saved) return { measurements: [], message: null };
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new Error('Invalid history');
    const measurements: Measurement[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.clinical ||
          ['hcGrowth', 'sutures', 'fontanelle'].some(key => typeof row.clinical[key] !== 'boolean')) continue;
      const m: Measurement = {
        id: row.id, date: row.date, pma: row.pma, viLeft: row.viLeft, viRight: row.viRight,
        ahwLeft: row.ahwLeft, ahwRight: row.ahwRight, ri: row.ri ?? 0,
        clinical: { hcGrowth: row.clinical.hcGrowth, sutures: row.clinical.sutures, fontanelle: row.clinical.fontanelle },
      };
      if (!measurementError(m)) measurements.push(m);
    }
    measurements.sort((a,b) => a.pma - b.pma || a.date.localeCompare(b.date));
    return { measurements, message: measurements.length < parsed.length ? 'Some saved records are invalid and could not be displayed. The original stored data is preserved until you save or clear history.' : null };
  } catch {
    return { measurements: [], message: 'Saved history could not be read. The calculator is available; stored data has not been overwritten.' };
  }
}
