import { useState } from 'react';
import DisclaimerGate from './components/DisclaimerGate';
import PhvdTab from './components/PhvdTab';

export default function App() {
  const [accepted, setAccepted] = useState(false);

  if (!accepted) return <DisclaimerGate onAccept={() => setAccepted(true)} />;

  return (
    <div className="min-h-full bg-slate-100 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-5 py-4">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">PHVD</h1>
        <p className="text-xs text-slate-500">Post-Haemorrhagic Ventricular Dilatation</p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <PhvdTab />
      </main>

      <footer className="bg-white border-t border-slate-200 px-5 py-2 text-center text-[11px] text-slate-400">
        Educational reference only &mdash; not a diagnostic device. Clinical judgment required.
      </footer>
    </div>
  );
}
