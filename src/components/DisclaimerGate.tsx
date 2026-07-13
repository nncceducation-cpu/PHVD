/**
 * Shown on every cold start until accepted.
 * This is deliberate: App Review guideline 1.4.1 (medical apps) and the
 * "educational / reference" positioning both depend on this being unmissable.
 * Do not move it behind a settings screen.
 */
export default function DisclaimerGate({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="min-h-full bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-md">
        <h2 className="text-xl font-bold text-slate-800 mb-3">Before you continue</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          PHVD is an{' '}
          <strong className="text-slate-800">
            educational and reference tool for qualified healthcare professionals
          </strong>
          . It is not a medical device, does not provide a diagnosis, and does not replace
          clinical assessment or your local protocol.
        </p>
        <ul className="list-disc ml-5 mt-3 space-y-1 text-sm text-slate-600">
          <li>All outputs are indicative and must be independently verified.</li>
          <li>Do not use it as the sole basis for any treatment decision.</li>
          <li>No patient data is transmitted off this device.</li>
        </ul>
        <p className="text-xs text-slate-400 mt-4">
          Risk stratification adapted from El-Dib et al. (2020); reference curve from Brouwer et
          al. (2012).
        </p>
        <button
          onClick={onAccept}
          className="w-full mt-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
        >
          I understand and accept
        </button>
      </div>
    </div>
  );
}
