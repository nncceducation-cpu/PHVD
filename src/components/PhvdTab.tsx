import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  X,
  Loader2,
  ImageDown,
} from 'lucide-react';
import { captureAndDetect, isScanAvailable, type DetectedNumber } from '../lib/scan';
import { saveElementToPhotos, downloadElementAsPng, isSaveToPhotosAvailable } from '../lib/exportImage';

import { getVIP97, getRiskZone, type RiskZone } from '../lib/risk';
import NumericInput from './NumericInput';
import { readHistory, measurementError, localDate, type Measurement } from '../lib/history';

const getManagementAdvice = (zone: RiskZone) => {
  switch (zone) {
    case 'Unclassified':
      return { title: 'Assessment incomplete or discordant', actions: ['Confirm VI and AHW measurements and review with the clinical team.'], color: 'bg-slate-100 border-slate-300 text-slate-800' };
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
          'Then every 1-2 weeks till 34 weeks PMA',
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
  const [loaded] = useState(readHistory);
  const [measurements, setMeasurements] = useState<Measurement[]>(loaded.measurements);
  const [storageMsg, setStorageMsg] = useState<string | null>(loaded.message);
  const [historyChanged, setHistoryChanged] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [currentM, setCurrentM] = useState<Measurement>({
    id: '',
    date: localDate(),
    pma: 28,
    viLeft: 0,
    viRight: 0,
    ahwLeft: 0,
    ahwRight: 0,
    ri: 0,
    clinical: { hcGrowth: false, sutures: false, fontanelle: false },
  });

  // -- Scan (camera + on-device OCR) state --
  const [scanChips, setScanChips] = useState<DetectedNumber[]>([]);
  const [activeChipId, setActiveChipId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const activeChip = scanChips.find((c) => c.id === activeChipId) || null;

  const runScan = async () => {
    setScanError(null);
    setScanning(true);
    try {
      const found = await captureAndDetect();
      if (found.length === 0) {
        setScanError('No numbers detected. Try a closer, straighter photo of the measurement list.');
      }
      setScanChips(found);
      setActiveChipId(null);
      // NOTE: values are intentionally NOT auto-placed into VI/AHW/L/R fields.
      // OCR cannot tell which caliper is VI (straight) vs AHW (diagonal), nor
      // which side is which (the screen is a mirror image), and sonographers
      // measure in no fixed order — so the clinician assigns each number.
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (!/cancel/i.test(msg)) setScanError('Could not read the image. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  // Fill a field from the currently-selected chip. mode 'mm' converts cm->mm.
  const consumeChip = (setter: (n: number) => void, mode: 'mm' | 'raw'): boolean => {
    if (!activeChip) return false;
    setter(mode === 'mm' ? activeChip.valueMm : activeChip.value);
    setScanChips((cs) => cs.filter((c) => c.id !== activeChip.id));
    setActiveChipId(null);
    return true;
  };

  // Do not overwrite stored data during startup or after a failed read.
  useEffect(() => {
    if (!historyChanged) return;
    try {
      localStorage.setItem('phvd_data', JSON.stringify(measurements));
      setStorageMsg(null);
    } catch {
      setStorageMsg('History could not be saved on this device. Keep the page open or download the assessment image.');
    }
  }, [measurements, historyChanged]);

  const addMeasurement = () => {
    const error = measurementError(currentM);
    if (error) { alert(error); return; }
    if (savedSignature === JSON.stringify(currentM)) return;
    setHistoryChanged(true);
    const newEntry = { ...currentM, id: crypto.randomUUID() };
    setMeasurements((previous) => [...previous, newEntry].sort((a, b) => a.pma - b.pma || a.date.localeCompare(b.date)));
    // Retain the assessment so downloading immediately after Save exports it.
    setSavedSignature(JSON.stringify(currentM));
  };

  const currentRisk = getRiskZone(currentM);
  const advice = getManagementAdvice(currentRisk.zone);

  // -- Save assessment as an image to device Photos --
  const reportRef = useRef<HTMLDivElement>(null);
  const [savingImg, setSavingImg] = useState(false);
  const [imgMsg, setImgMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const saveImage = async () => {
    if (!reportRef.current) return;
    setImgMsg(null);
    setSavingImg(true);
    try {
      if (isSaveToPhotosAvailable()) {
        await saveElementToPhotos(reportRef.current);
        setImgMsg({ ok: true, text: 'Saved to your Photos (PHVD album).' });
      } else {
        await downloadElementAsPng(reportRef.current);
        setImgMsg({ ok: true, text: 'Image downloaded.' });
      }
    } catch (e: any) {
      const m = String(e?.message || e || '');
      setImgMsg({ ok: false, text: /denied|permission/i.test(m) ? 'Photos permission was denied.' : 'Could not save the image. Please try again.' });
    } finally {
      setSavingImg(false);
      setTimeout(() => setImgMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {storageMsg && <p role="status" className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">{storageMsg}</p>}
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LineChart className="text-blue-600" />
            PHVD Risk Stratification
          </h2>
          <p className="text-slate-600 mt-2 text-sm leading-relaxed">
            This module implements the risk stratification and management framework proposed
            by El-Dib et al. (2020). Enter ventricular measurements (VI and AHW) to
            calculate the risk zone. TOD is excluded from this version; the full paper also uses TOD.
            The VI 97th % curve uses the exact polynomial in the authors’ supplementary calculators.
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
              <strong>RI:</strong> Resistive Index (recorded only)
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

            {/* Scan from ultrasound (native app only) */}
            {isScanAvailable() && (
              <div className="mb-5">
                <button
                  onClick={runScan}
                  disabled={scanning}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {scanning ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                  {scanning ? 'Reading image…' : 'Scan from ultrasound'}
                </button>
                {scanError && (
                  <p className="mt-2 text-xs text-rose-600">{scanError}</p>
                )}
                {scanChips.length > 0 && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Tap a number, then tap its field
                      </p>
                      <button
                        onClick={() => { setScanChips([]); setActiveChipId(null); }}
                        className="text-slate-400 hover:text-rose-500"
                        aria-label="Clear detected numbers"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scanChips.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setActiveChipId(activeChipId === c.id ? null : c.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold border transition-colors ${
                            activeChipId === c.id
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400'
                          }`}
                        >
                          {c.seq ? <span className={activeChipId === c.id ? 'text-blue-200' : 'text-slate-400'}>{c.seq}. </span> : null}
                          {c.raw}
                          {c.unit === 'cm' && (
                            <span className={activeChipId === c.id ? 'text-blue-100' : 'text-slate-400'}> → {c.valueMm} mm</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      cm is converted to mm automatically. You assign each number, since the app can't tell VI from AHW
                      or side: <span className="font-semibold text-slate-500">straight caliper = VI, diagonal = AHW; screen-left = patient's right.</span> Always verify against the screen before saving.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Date & Age */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="assessment-date" className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                <input
                  type="date"
                  id="assessment-date"
                  value={currentM.date}
                  onChange={(e) => setCurrentM({ ...currentM, date: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  PMA (Weeks)
                </label>
                <NumericInput
                  value={currentM.pma}
                  onValueChange={(pma) => setCurrentM({ ...currentM, pma })}
                  min={24}
                  max={42}
                  step="any"
                  aria-label="PMA in decimal weeks"
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4">Enter age in decimal weeks: 28 weeks + 6 days = 28.857 weeks.</p>
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
                  setL={(v) => setCurrentM((m) => ({ ...m, viLeft: v }))}
                  setR={(v) => setCurrentM((m) => ({ ...m, viRight: v }))}
                  armed={!!activeChip}
                  pickL={() => consumeChip((v) => setCurrentM((m) => ({ ...m, viLeft: v })), 'mm')}
                  pickR={() => consumeChip((v) => setCurrentM((m) => ({ ...m, viRight: v })), 'mm')}
                />
                <MeasurementRow
                  label="AHW"
                  valL={currentM.ahwLeft}
                  valR={currentM.ahwRight}
                  setL={(v) => setCurrentM((m) => ({ ...m, ahwLeft: v }))}
                  setR={(v) => setCurrentM((m) => ({ ...m, ahwRight: v }))}
                  armed={!!activeChip}
                  pickL={() => consumeChip((v) => setCurrentM((m) => ({ ...m, ahwLeft: v })), 'mm')}
                  pickR={() => consumeChip((v) => setCurrentM((m) => ({ ...m, ahwRight: v })), 'mm')}
                />
                {/* RI — single value, recorded only */}
                <div className="grid grid-cols-3 gap-4 items-center pt-1">
                  <div className="font-bold text-sm text-slate-700">RI</div>
                  <NumericInput
                    optional
                    step="0.01"
                    min="0"
                    max="1.5"
                    aria-label="Resistive Index (optional)"
                    value={currentM.ri}
                    onClick={(e) => {
                      if (activeChip) {
                        e.preventDefault();
                        consumeChip((v) => setCurrentM((m) => ({ ...m, ri: v })), 'raw');
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    onValueChange={(ri) => setCurrentM((m) => ({ ...m, ri }))}
                    className={`col-span-2 w-full p-2 text-center border rounded outline-none text-sm font-mono ${
                      activeChip ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/40' : 'border-slate-300 focus:border-blue-500'
                    }`}
                    placeholder="e.g. 0.75"
                  />
                </div>
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
              data-risk-zone={currentRisk.zone}
              className={`p-4 rounded-lg mb-4 border ${advice.color} flex items-center justify-between`}
            >
              <div className="font-bold">{advice.title}</div>
              {currentRisk.zone === 'Red' && <AlertTriangle className="text-rose-600" />}
              {currentRisk.zone === 'Yellow' && <AlertTriangle className="text-amber-600" />}
              {currentRisk.zone === 'Green' && <CheckCircle className="text-emerald-600" />}
            </div>

            <button
              onClick={addMeasurement}
              disabled={savedSignature === JSON.stringify(currentM)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors mb-3"
            >
              <Save size={18} /> Save Measurement
            </button>
            {savedSignature === JSON.stringify(currentM) && <p role="status" className="mb-3 text-xs text-slate-600">Measurement added. Edit the fields for the next assessment.</p>}

            <button
              onClick={saveImage}
              disabled={savingImg}
              className="w-full py-3 border border-slate-300 hover:bg-slate-50 disabled:opacity-60 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {savingImg ? <Loader2 size={18} className="animate-spin" /> : <ImageDown size={18} />}
              {isSaveToPhotosAvailable() ? 'Save assessment to Photos' : 'Download assessment image'}
            </button>
            {imgMsg && (
              <p className={`mt-2 text-xs ${imgMsg.ok ? 'text-emerald-600' : 'text-rose-600'}`}>{imgMsg.text}</p>
            )}
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
                onClick={() => { setHistoryChanged(true); setSavedSignature(null); setMeasurements([]); }}
                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear History
              </button>
            </div>

            <div className="h-64 w-full">
              <RiskGraph measurements={[...measurements, { ...currentM, id: 'current' }]} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Graph colors show VI measurement bands only. The overall zone also requires AHW and clinical signs.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-slate-300"></div>
                <span>VI 97th %</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-red-300"></div>
                <span>VI 97th % + 4 mm</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Your Data (Max VI)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4">Anterior Horn Width Trend</h3>
            <div className="h-64 w-full"><RiskGraph metric="AHW" measurements={[...measurements, { ...currentM, id: 'current' }]} /></div>
            <p className="mt-2 text-xs text-slate-500">AHW bands: green ≤ 6 mm, yellow &gt; 6–10 mm, red &gt; 10 mm. Overall classification uses combined VI/AHW criteria.</p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 text-sm">
            {(['Green', 'Yellow', 'Red'] as const).map((zone) => {
              const plan = getManagementAdvice(zone);
              return <div key={zone} className={`rounded-lg border p-4 ${plan.color}`}>
                <h3 className="text-lg font-bold underline mb-3">{`${zone} Zone`}</h3>
                <h4 className="font-bold mb-1">Key Criteria:</h4>
                <p>{zone === 'Green' ? 'VI ≤ 97th % AND AHW ≤ 6 mm' : zone === 'Yellow' ? 'VI > 97th % AND AHW > 6 mm' : 'VI > 97th % + 4 mm AND AHW > 10 mm'}</p>
                <p className="mt-3 font-semibold">{zone === 'Red' ? 'OR any listed clinical sign:' : 'AND absence of all listed clinical signs:'}</p>
                <ul className="list-disc ml-4 mt-1"><li>HC Growth &gt; 2 cm/week</li><li>Separated Sutures</li><li>Bulging Fontanelle</li></ul>
                {zone === 'Yellow' && <p className="mt-2 text-xs">Red criteria take priority.</p>}
                <h4 className="font-bold mt-4 mb-1">Management:</h4>
                <ul className="list-disc ml-4 space-y-2">{plan.actions.map(action => <li key={action}>{action}</li>)}</ul>
              </div>;
            })}
          </div>
          <p className="text-xs text-slate-600">Changes in NIRS or Doppler RI may suggest impaired cerebral perfusion and a more urgent need for intervention. RI is recorded as additional information and does not automatically assign a zone.</p>
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

      {/* Off-screen printable report captured by "Save to Photos" */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', top: 0, width: '420px' }}
      >
        <div ref={reportRef} className="bg-white p-6" style={{ width: '420px', fontFamily: 'system-ui, sans-serif' }}>
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <LineChart className="text-blue-600" size={22} />
            <div>
              <div className="text-lg font-bold text-slate-800 leading-tight">PHVD Risk Assessment</div>
              <div className="text-[11px] text-slate-500">El-Dib et al. (2020) framework — VI/AHW only; TOD excluded</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-slate-500">Date:</span> <span className="font-semibold text-slate-800">{currentM.date}</span></div>
            <div><span className="text-slate-500">PMA:</span> <span className="font-semibold text-slate-800">{currentM.pma} wks</span></div>
          </div>

          <table className="mt-3 w-full text-sm border border-slate-200" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs">
                <th className="text-left p-2 border border-slate-200">Measure</th>
                <th className="p-2 border border-slate-200">Left (mm)</th>
                <th className="p-2 border border-slate-200">Right (mm)</th>
              </tr>
            </thead>
            <tbody className="font-mono text-slate-800">
              <tr><td className="p-2 border border-slate-200 font-sans font-bold">VI</td><td className="p-2 border border-slate-200 text-center">{currentM.viLeft || '—'}</td><td className="p-2 border border-slate-200 text-center">{currentM.viRight || '—'}</td></tr>
              <tr><td className="p-2 border border-slate-200 font-sans font-bold">AHW</td><td className="p-2 border border-slate-200 text-center">{currentM.ahwLeft || '—'}</td><td className="p-2 border border-slate-200 text-center">{currentM.ahwRight || '—'}</td></tr>
              <tr><td className="p-2 border border-slate-200 font-sans font-bold">RI</td><td className="p-2 border border-slate-200 text-center" colSpan={2}>{currentM.ri || '—'}</td></tr>
            </tbody>
          </table>

          <div className={`mt-3 p-3 rounded-lg border ${advice.color}`}>
            <div className="font-bold text-sm">{advice.title}</div>
            {currentRisk.reasons.length > 0 && (
              <ul className="mt-1 list-disc ml-4 text-xs">
                {currentRisk.reasons.map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            )}
          </div>

          <div className="mt-3">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Management plan</div>
            <ol className="list-decimal ml-4 text-xs text-slate-700 space-y-0.5">
              {advice.actions.map((a, i) => (<li key={i}>{a}</li>))}
            </ol>
          </div>

          <div className="mt-3 h-48 w-full">
            <RiskGraph measurements={[...measurements, { ...currentM, id: 'current' }]} />
          </div>

          <div className="mt-3 text-[9px] leading-snug text-slate-400 border-t border-slate-200 pt-2">
            Decision-support / education aid only — not a diagnostic interpretation. Verify against the source images and your unit's protocol.
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
  armed?: boolean;
  pickL?: () => boolean;
  pickR?: () => boolean;
}> = ({ label, valL, valR, setL, setR, armed, pickL, pickR }) => {
  const cls = (extra: string) =>
    `w-full p-2 text-center border rounded outline-none text-sm font-mono ${
      armed ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/40' : 'border-slate-300 focus:border-blue-500'
    } ${extra}`;
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <div className="font-bold text-sm text-slate-700">{label}</div>
      <NumericInput
        aria-label={`${label} left in mm`}
        step="0.1"
        min="0"
        value={valL}
        onClick={(e) => {
          if (armed && pickL) { e.preventDefault(); pickL(); (e.target as HTMLInputElement).blur(); }
        }}
        onValueChange={setL}
        className={cls('')}
        placeholder="L"
      />
      <NumericInput
        aria-label={`${label} right in mm`}
        step="0.1"
        min="0"
        value={valR}
        onClick={(e) => {
          if (armed && pickR) { e.preventDefault(); pickR(); (e.target as HTMLInputElement).blur(); }
        }}
        onValueChange={setR}
        className={cls('')}
        placeholder="R"
      />
    </div>
  );
};

const Checkbox: React.FC<{
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors focus-within:ring-2 focus-within:ring-blue-500">
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
      className="sr-only"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

// SVG Graph Component
const RiskGraph: React.FC<{ measurements: Measurement[]; metric?: 'VI' | 'AHW' }> = ({ measurements, metric = 'VI' }) => {
  // Config
  const width = 100;
  const height = 100;
  const padX = 10;
  const padY = 10;
  const minPMA = 24;
  const maxPMA = 42;
  const minVI = 0;
  const plotMeasurements = measurements.filter(m => Number.isFinite(m.pma) && m.pma >= 24 && m.pma <= 42 && (metric === 'VI' ? [m.viLeft, m.viRight] : [m.ahwLeft, m.ahwRight]).every(v => Number.isFinite(v) && v > 0)).sort((a,b) => a.pma - b.pma || a.date.localeCompare(b.date));
  const maxValue = plotMeasurements.reduce((max,m) => Math.max(max, ...(metric === 'VI' ? [m.viLeft,m.viRight] : [m.ahwLeft,m.ahwRight])), 0);
  const maxVI = Math.max(metric === 'VI' ? 25 : 16, Math.ceil(maxValue / 5) * 5);
  const reference = (pma: number) => metric === 'VI' ? getVIP97(pma) : 6;
  const upper = (pma: number) => metric === 'VI' ? getVIP97(pma) + 4 : 10;

  // Scales
  const scaleX = (pma: number) =>
    padX + ((pma - minPMA) / (maxPMA - minPMA)) * (width - 2 * padX);
  const scaleY = (vi: number) =>
    height - padY - ((vi - minVI) / (maxVI - minVI)) * (height - 2 * padY);

  // Generate Reference Lines
  const p97Points: string[] = [];
  const p97Plus4Points: string[] = [];
  for (let day = 0; day <= (maxPMA - minPMA) * 7; day++) {
    const p = minPMA + day / 7;
    const val = reference(p);
    p97Points.push(`${scaleX(p)},${scaleY(val)}`);
    p97Plus4Points.push(`${scaleX(p)},${scaleY(upper(p))}`);
  }

  // User Data Points
  const userPoints = plotMeasurements
    .map((m) => ({
      x: scaleX(m.pma),
      y: scaleY(metric === 'VI' ? Math.max(m.viLeft, m.viRight) : Math.max(m.ahwLeft, m.ahwRight)),
      id: m.id,
    }));

  return (
    <svg
      role="img"
      aria-label={`${metric} measurement trend`}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full bg-slate-50 border border-slate-100 rounded-lg"
    >
      {/* VI bands only; overall assessment also requires AHW and clinical signs. */}
      <polygon points={`${padX},${scaleY(0)} ${width-padX},${scaleY(0)} ${[...p97Points].reverse().join(' ')}`} fill="#d1fae5" />
      <polygon points={`${p97Points.join(' ')} ${[...p97Plus4Points].reverse().join(' ')}`} fill="#fef3c7" />
      <polygon points={`${padX},${padY} ${width-padX},${padY} ${[...p97Plus4Points].reverse().join(' ')}`} fill="#ffe4e6" />
      {/* Grid Lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={i}
          x1={padX}
          y1={scaleY(i * maxVI / 4)}
          x2={width - padX}
          y2={scaleY(i * maxVI / 4)}
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      ))}

      {Array.from({length: 5}, (_,i) => <text key={i} x={padX - 1} y={scaleY(i * maxVI / 4) + 1} fontSize="2.5" textAnchor="end" fill="#64748b">{(i * maxVI / 4).toFixed(1)}</text>)}
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
        y={scaleY(reference(41))}
        fontSize="3"
        fill="#64748b"
        textAnchor="end"
      >
        {metric === 'VI' ? '97th %' : '6 mm'}
      </text>
      <text
        x={width - padX - 5}
        y={scaleY(upper(41))}
        fontSize="3"
        fill="#f87171"
        textAnchor="end"
      >
        {metric === 'VI' ? '+4 mm' : '10 mm'}
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
        {metric === 'VI' ? 'Ventricular Index (mm)' : 'Anterior Horn Width (mm)'}
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
