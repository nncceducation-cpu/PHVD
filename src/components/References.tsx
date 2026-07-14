import { BookOpen, ExternalLink } from 'lucide-react';

interface Reference {
  authors: string;
  title: string;
  journal: string;
  doi: string;
  url: string;
  note: string;
}

const REFERENCES: Reference[] = [
  {
    authors:
      'El-Dib M, Limbrick DD Jr, Inder T, Whitelaw A, Kulkarni AV, Warf B, Volpe JJ, de Vries LS.',
    title: 'Management of Post-hemorrhagic Ventricular Dilatation in the Preterm Infant.',
    journal: 'J Pediatr. 2020;226:16-27.e3.',
    doi: '10.1016/j.jpeds.2020.07.079',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8297821/',
    note: 'Source of the Green / Yellow / Red risk-stratification framework and the management pathway shown in this app.',
  },
  {
    authors:
      'Brouwer MJ, de Vries LS, Groenendaal F, Koopman C, Pistorius LR, Mulder EJH, Benders MJNL.',
    title: 'New reference values for the neonatal cerebral ventricles.',
    journal: 'Radiology. 2012;262(1):224-233.',
    doi: '10.1148/radiol.11110334',
    url: 'https://doi.org/10.1148/radiol.11110334',
    note: 'Source of the ventricular index 97th-centile reference curve plotted against your measurements.',
  },
];

export default function References() {
  return (
    <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <BookOpen size={18} className="text-blue-600" />
        References
      </h2>
      <p className="text-xs text-slate-500 mt-1">
        The clinical logic in this app is drawn from the peer-reviewed literature below. Read the
        primary sources before applying any output to a patient.
      </p>

      <ol className="mt-4 space-y-4">
        {REFERENCES.map((r, i) => (
          <li key={r.doi} className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 font-medium leading-snug">{r.title}</p>
              <p className="text-xs text-slate-600 mt-1">{r.authors}</p>
              <p className="text-xs text-slate-500 italic">{r.journal}</p>
              <p className="text-xs text-slate-500 mt-1">
                doi: <span className="font-mono text-[11px] text-slate-600">{r.doi}</span>
              </p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{r.note}</p>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Read the paper
                <ExternalLink size={12} />
              </a>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-[11px] text-slate-400 mt-5 leading-relaxed">
        This app is an educational and reference tool. It reproduces the published frameworks above
        for convenience; it does not extend, validate, or substitute for them, and it is not
        endorsed by their authors.
      </p>

      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-700">
          Created by the Sarnat&#8209;NNCC program
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Neonatal Neuro&#8209;Critical Care. Developed by Dr Khorshid Mohammad, staff neonatologist.
        </p>
      </div>
    </section>
  );
}
