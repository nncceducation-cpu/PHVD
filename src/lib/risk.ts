export interface VentricularMeasurements {
  pma: number;
  viLeft: number;
  viRight: number;
  ahwLeft: number;
  ahwRight: number;
  clinical: { hcGrowth: boolean; sutures: boolean; fontanelle: boolean };
}
export type RiskZone = 'Green' | 'Yellow' | 'Red' | 'Unclassified';

// El-Dib supplementary spreadsheets, Constants!C3:C129 (labelled p97.5).
// Figure 5 calls this reference the 97th percentile. Keep the exact polynomial.
export const getVIP97 = (pma: number) =>
  0.642056 + 0.424486 * pma - 0.002409 * pma * pma;

export function getRiskZone(m: VentricularMeasurements): { zone: RiskZone; reasons: string[] } {
  const reasons: string[] = [];
  if (m.clinical.hcGrowth) reasons.push('Rapid HC Growth (>2cm/wk)');
  if (m.clinical.sutures) reasons.push('Separated Sutures');
  if (m.clinical.fontanelle) reasons.push('Bulging Fontanelle');
  if (reasons.length) return { zone: 'Red', reasons };

  if (!Number.isFinite(m.pma) || m.pma < 24 || m.pma > 42 ||
      [m.viLeft, m.viRight, m.ahwLeft, m.ahwRight].some(v => !Number.isFinite(v) || v <= 0)) {
    return { zone: 'Unclassified', reasons: ['Enter PMA (24–42 weeks) and positive VI and AHW measurements on both sides.'] };
  }
  const vi = Math.max(m.viLeft, m.viRight);
  const ahw = Math.max(m.ahwLeft, m.ahwRight);
  const p97 = getVIP97(m.pma);
  // Figure 5: AND between VI and AHW; clinical signs override measurements.
  // TOD is excluded in this VI/AHW version, including legacy saved values.
  if (vi > p97 + 4 && ahw > 10) {
    return { zone: 'Red', reasons: [`VI (${vi.toFixed(1)}mm) > 97th % + 4 mm AND AHW (${ahw.toFixed(1)}mm) > 10 mm`] };
  }
  if (vi > p97 && ahw > 6) {
    return { zone: 'Yellow', reasons: [`VI (${vi.toFixed(1)}mm) > 97th % AND AHW (${ahw.toFixed(1)}mm) > 6 mm`] };
  }
  if (vi <= p97 && ahw <= 6) {
    return { zone: 'Green', reasons: ['VI ≤ 97th % AND AHW ≤ 6 mm', 'No clinical signs'] };
  }
  // Figure 5 does not assign discordant VI/AHW pairs a category.
  return { zone: 'Unclassified', reasons: ['Discordant VI/AHW measurements do not meet a combined Figure 5 zone. Review measurements and the complete assessment with the clinical team.'] };
}
