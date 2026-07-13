/**
 * Ported from the PHVD tab of the "DRIVE IVH 2.0" Google AI Studio app
 * (components/PHVD.tsx, 561 lines).
 *
 * Two deliberate changes for the iOS build - both documented in README.md:
 *   1. The "Generate Clinical Report" button and its `generatePHVDReport` Gemini call
 *      are removed. An API key cannot be shipped inside an app bundle; it is trivially
 *      extractable. Removing it also lets the App Store privacy answer be a clean
 *      "Data Not Collected". To restore the feature, put a serverless proxy in front of
 *      Gemini and call that.
 *   2. The `stats_measurements` / `stats_updated` localStorage counters are dropped -
 *      they fed the parent app's dashboard, which does not exist in the standalone app.
 *
 * The clinical logic - getVIP97, getRiskZone, getManagementAdvice, RiskGraph - is
 * unchanged from the source.
 */
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Trash2,
  TrendingUp,
  Save,
  LineChart,
  ClipboardList,
} from 'lucide-react';

// -- Types & Interfaces --

interface Measurement {
  id: string;
  date: string;
  pma: number; // Post-menstrual age in weeks
  viLeft: number;
  viRight: number;
  ahwLeft: number;
  ahwRight: number;
  todLeft: number;
  todRight: number;
  clinical: {
    hcGrowth: boolean; // >2cm/week
    sutures: boolean; // separated
    fontanelle: boolean; // bulging
  };
}

type RiskZone = 'Green' | 'Yellow' | 'Red';

// -- Constants & Helpers --

// Linear approximation of Brouwer et al. (2012) VI 97th percentile
// Formula derived from data points: 24w=9.3mm, 40w=13.8mm
const getVIP97 = (pma: number) => 0.28 * pma + 2.6;

const getRiskZone = (m: Measurement): { zone: RiskZone; reasons: string[] } => {
  const maxVI = Math.max(m.viLeft, m.viRight);
  const maxAHW = Math.max(m.ahwLeft, m.ahwRight);
  const maxTOD = Math.max(m.todLeft, m.todRight);
  const p97 = getVIP97(m.pma);
  const p97plus4 = p97 + 4;

  const reasons: string[] = [];

  // -- RED ZONE CHECK (High Risk) --
  // Criteria: VI > 97th+4mm OR AHW > 10mm OR TOD > 25mm OR Clinical Signs
  const isRedVI = maxVI > p97plus4;
  const isRedAHW = maxAHW > 10;
  const isRedTOD = maxTOD > 25;
  const hasClinicalSigns =
    m.clinical.hcGrowth || m.clinical.sutures || m.clinical.fontanelle;

  if (isRedVI || isRedAHW || isRedTOD || hasClinicalSigns) {
    if (isRedVI) reasons.push(`VI (${maxVI.toFixed(1)}mm) > 97th% + 4mm`);
    if (isRedAHW) reasons.push(`AHW (${maxAHW.toFixed(1)}mm) > 10mm`);
    if (isRedTOD) reasons.push(`TOD (${maxTOD.toFixed(1)}mm) > 25mm`);
    if (m.clinical.hcGrowth) reasons.push('Rapid HC Growth (>2cm/wk)');
    if (m.clinical.sutures) reasons.push('Separated Sutures');
    if (m.clinical.fontanelle) reasons.push('Bulging Fontanelle');
    return { zone: 'Red', reasons };
  }

  // -- YELLOW ZONE CHECK (Moderate Risk) --
  // Criteria: VI > 97th% AND (AHW > 6mm OR TOD > 25mm)
  // We treat Yellow as VI > 97th AND AHW > 6mm (since AHW > 10 is red)
  const isYellowVI = maxVI > p97;
  const isYellowAHW = maxAHW > 6;

  if (isYellowVI && isYellowAHW) {
    reasons.push(`VI (${maxVI.toFixed(1)}mm) > 97th% AND AHW > 6mm`);
    return { zone: 'Yellow', reasons };
  }

  // -- GREEN ZONE CHECK (Low Risk) --
  return {
    zone: 'Green',
    reasons: ['Measurements within stable range', 'No clinical signs'],
  };
};

const getManagementAdvice = (zone: RiskZone) => {
  switch (zone) {
    case 'Green':
      return {
        title: 'Low Risk - Observation',
        actions: [
          'Observation in NICU',
          'Cranial US twice a week until stable for 2 weeks',
          'Then every 1-2 weeks till 34 weeks PMA',
          'MRI at Term Equivalent',
        ],
        color: 'bg-emerald-100 border-emerald-200 text-emerald-800',
      };
    case 'Yellow':
      return {
        title: 'Moderate Risk - Evaluation',
        actions: [
          'Referral to regional center for neurosurgical review',
          'Consider LP 2-3 times (remove 10ml/kg)',
          'Cranial US 2-3x a week until stable for 2 weeks',
          'Neurosurgical intervention if no stabilization occurs',
          'MRI at Term Equivalent',
        ],
        color: 'bg-amber-100 border-amber-200 text-amber-800',
      };
    case 'Red':
      return {
        title: 'High Risk - Intervention',
        actions: [
          'Consider LP 2-3 times (temporizing)',
          'Neurosurgical intervention including either temporizing measures (Reservoir/VSGS) or VP Shunt',
          'MRI at Term Equivalent',
        ],
        color: 'bg-rose-100 border-rose-200 text-rose-800',
      };
  }
};

const PHVD: React.FC = () => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentM, setCurrentM] = useState<Measurement>({
    id: '',
    date: new Date().toISOString().split('T')[0],
    pma: 28,
    viLeft: 0,
    viRight: 0,
    ahwLeft: 0,
    ahwRight: 0,
    todLeft: 0,
    todRight: 0,
    clinical: { hcGrowth: false, sutures: false, fontanelle: false },
  });

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('phvd_data');
    if (saved) {
      try {
        setMeasurements(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('phvd_data', JSON.stringify(measurements));
  }, [measurements]);

  const addMeasurement = () => {
    if (currentM.pma < 24 || currentM.pma > 42) {
      alert('PMA must be between 24 and 42 weeks');
      return;
    }
    const newEntry = { ...currentM, id: Date.now().toString() };
    setMeasurements([...measurements, newEntry].sort((a, b) => a.pma - b.pma));
    // Reset inputs slightly but keep PMA/Date handy
    setCurrentM({
      ...currentM,
      viLeft: 0,
      viRight: 0,
      ahwLeft: 0,
      ahwRight: 0,
      todLeft: 0,
      todRight: 0,
      clinical: { hcGrowth: false, sutures: false, fontanelle: false },
    });
  };

  const currentRisk = getRiskZone(currentM);
  const advice = getManagementAdvice(currentRisk.zone);

  return (
    <div className="space-y-8 pb-10">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LineChart className="text-blue-600" />
            PHVD Risk Stratification
          </h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            This module implements the risk stratification and management framework proposed
            by El-Dib et al. (2020). Enter ventricular measurements (VI, AHW, TOD) to
            calculate the risk zone.
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-xs text-slate-500 w-full md:w-64">
          <h4 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
            <Info size={14} /> Definitions
          </h4>
          <ul className="space-y-1">
            <li>
              <strong>VI:</strong> Ventricular Index (Levene)
            </li>
            <li>
              <strong>AHW:</strong> Anterior Horn Width
            </li>
            <li>
              <strong>TOD:</strong> Thalamo-Occipital Distance
            </li>
            <li>
              <strong>PMA:</strong> Post-Menstrual Age
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CALCULATOR */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
              <Plus className="text-blue-500" size={20} />
              New Assessment
            </h3>

            {/* Date & Age */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  value={currentM.date}
                  onChange={(e) => setCurrentM({ ...currentM, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  PMA (Weeks)
                </label>
                <input
                  type="number"
                  value={currentM.pma}
                  onChange={(e) =>
                    setCurrentM({ ...currentM, pma: parseFloat(e.target.value) })
                  }
                  min={24}
                  max={42}
                  step={0.1}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Measurements Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-2">
                <div></div>
                <div className="text-center text-xs font-bold text-slate-400">LEFT (mm)</div>
                <div className="text-center text-xs font-bold text-slate-400">RIGHT (mm)</div>
              </div>

              <div className="space-y-3">
                <MeasurementRow
                  label="VI"
                  valL={currentM.viLeft}
                  valR={currentM.viRight}
                  setL={(v) => setCurrentM({ ...currentM, viLeft: v })}
                  setR={(v) => setCurrentM({ ...currentM, viRight: v })}
                />
                <MeasurementRow
                  label="AHW"
                  valL={currentM.ahwLeft}
                  valR={currentM.ahwRight}
                  setL={(v) => setCurrentM({ ...currentM, ahwLeft: v })}
                  setR={(v) => setCurrentM({ ...currentM, ahwRight: v })}
                />
                <MeasurementRow
                  label="TOD"
                  valL={currentM.todLeft}
                  valR={currentM.todRight}
                  setL={(v) => setCurrentM({ ...currentM, todLeft: v })}
                  setR={(v) => setCurrentM({ ...currentM, todRight: v })}
                />
              </div>
            </div>

            {/* Clinical Signs */}
            <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                Clinical Signs
              </h4>
              <div className="space-y-2">
                <Checkbox
                  label="HC Growth > 2 cm/week"
                  checked={currentM.clinical.hcGrowth}
                  onChange={(c) =>
                    setCurrentM({
                      ...currentM,
                      clinical: { ...currentM.clinical, hcGrowth: c },
                    })
                  }
                />
                <Checkbox
                  label="Separated Sutures"
                  checked={currentM.clinical.sutures}
                  onChange={(c) =>
                    setCurrentM({
                      ...currentM,
                      clinical: { ...currentM.clinical, sutures: c },
                    })
                  }
                />
                <Checkbox
                  label="Bulging Fontanelle"
                  checked={currentM.clinical.fontanelle}
                  onChange={(c) =>
                    setCurrentM({
                      ...currentM,
                      clinical: { ...currentM.clinical, fontanelle: c },
                    })
                  }
                />
              </div>
            </div>

            {/* Live Risk Preview */}
            <div
              className={`p-4 rounded-lg mb-4 border ${advice.color} flex items-center justify-between`}
            >
              <div className="font-bold">{advice.title}</div>
              {currentRisk.zone === 'Red' && <AlertTriangle className="text-rose-600" />}
              {currentRisk.zone === 'Yellow' && <AlertTriangle className="text-amber-600" />}
              {currentRisk.zone === 'Green' && <CheckCircle className="text-emerald-600" />}
            </div>

            <button
              onClick={addMeasurement}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors mb-3"
            >
              <Save size={18} /> Save Measurement
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: GRAPHS & RECS */}
        <div className="lg:col-span-7 space-y-6">
          {/* Trends Graph */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={20} />
                Ventricular Index Trend
              </h3>
              <button
                onClick={() => setMeasurements([])}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear History
              </button>
            </div>

            <div className="h-64 w-full">
              <RiskGraph measurements={[...measurements, { ...currentM, id: 'current' }]} />
            </div>
            <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-300"></div>
                <span>P97 (Brouwer)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-300"></div>
                <span>P97 + 4mm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Your Data (Max VI)</span>
              </div>
            </div>
          </div>

          {/* Current Action Plan */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList className="text-blue-500" size={20} />
              Management Plan
            </h3>

            {currentRisk.reasons.length > 0 && (
              <div className="mb-4 bg-slate-50 p-3 rounded-md border border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Triggers</div>
                <ul className="list-disc ml-4 space-y-1 text-sm text-slate-700">
                  {currentRisk.reasons.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              {advice.actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100"
                >
                  <div className="mt-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Subcomponents ---

const MeasurementRow: React.FC<{
  label: string;
  valL: number;
  setL: (n: number) => void;
  valR: number;
  setR: (n: number) => void;
}> = ({ label, valL, valR, setL, setR }) => (
  <div className="grid grid-cols-3 gap-4 items-center">
    <div className="font-bold text-sm text-slate-700">{label}</div>
    <input
      type="number"
      step="0.1"
      min="0"
      value={valL || ''}
      onChange={(e) => setL(parseFloat(e.target.value))}
      className="w-full p-2 text-center border border-slate-300 rounded focus:border-blue-500 outline-none text-sm font-mono"
      placeholder="L"
    />
    <input
      type="number"
      step="0.1"
      min="0"
      value={valR || ''}
      onChange={(e) => setR(parseFloat(e.target.value))}
      className="w-full p-2 text-center border border-slate-300 rounded focus:border-blue-500 outline-none text-sm font-mono"
      placeholder="R"
    />
  </div>
);

const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
    <div
      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
        checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
      }`}
    >
      {checked && <CheckCircle size={14} className="text-white" />}
    </div>
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

// SVG Graph Component
const RiskGraph: React.FC<{ measurements: Measurement[] }> = ({ measurements }) => {
  // Config
  const width = 100;
  const height = 100;
  const padX = 10;
  const padY = 10;
  const minPMA = 24;
  const maxPMA = 42;
  const minVI = 0;
  const maxVI = 25; // y-axis max

  // Scales
  const scaleX = (pma: number) =>
    padX + ((pma - minPMA) / (maxPMA - minPMA)) * (width - 2 * padX);
  const scaleY = (vi: number) =>
    height - padY - ((vi - minVI) / (maxVI - minVI)) * (height - 2 * padY);

  // Generate Reference Lines
  const p97Points: string[] = [];
  const p97Plus4Points: string[] = [];
  for (let p = minPMA; p <= maxPMA; p += 1) {
    const val = getVIP97(p);
    p97Points.push(`${scaleX(p)},${scaleY(val)}`);
    p97Plus4Points.push(`${scaleX(p)},${scaleY(val + 4)}`);
  }

  // User Data Points
  const userPoints = measurements
    .filter((m) => m.viLeft > 0 || m.viRight > 0)
    .map((m) => ({
      x: scaleX(m.pma),
      y: scaleY(Math.max(m.viLeft, m.viRight)),
      id: m.id,
    }));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full bg-slate-50 border border-slate-100 rounded-lg"
    >
      {/* Grid Lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={padX}
          y1={scaleY(i * 5)}
          x2={width - padX}
          y2={scaleY(i * 5)}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      ))}

      {/* Reference Curves */}
      <polyline
        points={p97Points.join(' ')}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1"
        strokeDasharray="2 1"
      />
      <polyline
        points={p97Plus4Points.join(' ')}
        fill="none"
        stroke="#fca5a5"
        strokeWidth="1"
        strokeDasharray="2 1"
      />

      <text
        x={width - padX - 5}
        y={scaleY(getVIP97(41))}
        fontSize="3"
        fill="#64748b"
        textAnchor="end"
      >
        97th%
      </text>
      <text
        x={width - padX - 5}
        y={scaleY(getVIP97(41) + 4)}
        fontSize="3"
        fill="#f87171"
        textAnchor="end"
      >
        +4mm
      </text>

      {/* Axis Labels */}
      <text x={width / 2} y={height - 2} fontSize="3" textAnchor="middle" fill="#64748b">
        Post-Menstrual Age (Weeks)
      </text>
      <text
        x={3}
        y={height / 2}
        fontSize="3"
        textAnchor="middle"
        fill="#64748b"
        transform={`rotate(-90, 3, ${height / 2})`}
      >
        Ventricular Index (mm)
      </text>

      {/* X-Axis Ticks */}
      {[24, 28, 32, 36, 40].map((p) => (
        <text
          key={p}
          x={scaleX(p)}
          y={height - 6}
          fontSize="2.5"
          textAnchor="middle"
          fill="#94a3b8"
        >
          {p}
        </text>
      ))}

      {/* User Data Points & Lines */}
      <polyline
        points={userPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1"
      />
      {userPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.id === 'current' ? 1.5 : 1}
          fill={p.id === 'current' ? '#2563eb' : '#93c5fd'}
          stroke="white"
          strokeWidth="0.2"
          className={p.id === 'current' ? 'animate-pulse' : ''}
        />
      ))}
    </svg>
  );
};

export default PHVD;
