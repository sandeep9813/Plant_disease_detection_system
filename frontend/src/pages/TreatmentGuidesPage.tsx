import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, CheckCircle2, MessageSquare, Search, ShieldCheck, Youtube } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/api';

interface TreatmentGuide {
  crop: string;
  disease: string;
  symptoms: string[];
  immediateAction: string;
  treatment: string;
  prevention: string;
  youtubeLink: string;
}

const TreatmentGuidesPage = () => {
  const [guides, setGuides] = useState<TreatmentGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [selectedGuide, setSelectedGuide] = useState<TreatmentGuide | null>(null);

  // Fetch guides from backend
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const data = await api.getGuides(); // We'll add this method below
        setGuides(data);

        // Set first guide as default once loaded
        if (data.length > 0) {
          setSelectedGuide(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch treatment guides:', err);
        setError('Failed to load treatment guides. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGuides();
  }, []);

  const crops = useMemo(() => {
    if (!guides.length) return ['All'];
    return ['All', ...Array.from(new Set(guides.map((guide) => guide.crop)))];
  }, [guides]);

  const filteredGuides = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guides.filter((guide) => {
      const matchesCrop = selectedCrop === 'All' || guide.crop === selectedCrop;
      const searchableText = `${guide.crop} ${guide.disease} ${guide.symptoms.join(' ')}`.toLowerCase();
      return matchesCrop && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [guides, query, selectedCrop]);

  const selectGuide = (guide: TreatmentGuide) => {
    setSelectedGuide(guide);
  };

  if (loading) {
    return (
      <div className="max-w-6xl py-12 mx-auto text-center">
        <div className="w-8 h-8 mx-auto mb-4 border-4 rounded-full animate-spin border-emerald-600 border-t-transparent" />
        <p className="text-slate-600">Loading treatment guides...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl py-12 mx-auto text-center">
        <div className="mb-2 text-red-600">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-white bg-slate-900 rounded-xl hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold tracking-wider uppercase text-emerald-600">Treatment Guides</p>
          <h2 className="text-3xl font-bold text-slate-900">Quick care steps for common plant diseases</h2>
        </div>

        {selectedGuide && (
          <Link
            to="/chat"
            state={{ query: `How do I treat ${selectedGuide.crop} ${selectedGuide.disease}?` }}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 font-bold text-white transition-colors bg-emerald-600 rounded-xl hover:bg-emerald-700"
          >
            <MessageSquare size={18} />
            Ask AI About This
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
          <div className="p-4 space-y-4 border-b">
            <div className="relative">
              <Search size={18} className="absolute -translate-y-1/2 left-3 top-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search crop or disease"
                className="w-full py-3 pl-10 pr-4 outline-none bg-slate-100 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {crops.map((crop) => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedCrop === crop
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto p-3 space-y-2">
            {filteredGuides.map((guide) => (
              <button
                key={`${guide.crop}-${guide.disease}`}
                onClick={() => selectGuide(guide)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedGuide?.crop === guide.crop && selectedGuide?.disease === guide.disease
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="text-xs font-bold tracking-wider uppercase text-slate-500">{guide.crop}</span>
                <p className="font-bold text-slate-900">{guide.disease}</p>
              </button>
            ))}

            {filteredGuides.length === 0 && (
              <div className="p-5 text-center text-slate-500">
                No guide matches your search yet.
              </div>
            )}
          </div>
        </aside>

        {selectedGuide && (
          <motion.section
            key={`${selectedGuide.crop}-${selectedGuide.disease}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200"
          >
            <div className="p-6 text-white lg:p-8 bg-emerald-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-emerald-300">{selectedGuide.crop}</p>
                  <h3 className="text-3xl font-black">{selectedGuide.disease}</h3>
                </div>
                <div className="p-3 bg-white/10 rounded-xl">
                  <BookOpen size={28} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 lg:p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="p-5 border md:col-span-1 bg-amber-50 border-amber-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 font-bold text-amber-800">
                    <AlertTriangle size={18} />
                    Symptoms
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    {selectedGuide.symptoms.map((symptom, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 gap-4 md:col-span-2">
                  <div className="p-5 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      Immediate Action
                    </div>
                    <p className="leading-relaxed text-slate-600">{selectedGuide.immediateAction}</p>
                  </div>

                  <div className="p-5 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      Treatment
                    </div>
                    <p className="leading-relaxed text-slate-600">{selectedGuide.treatment}</p>
                  </div>

                  <div className="p-5 border border-slate-200 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-slate-900">
                      <ShieldCheck size={18} className="text-emerald-600" />
                      Prevention
                    </div>
                    <p className="leading-relaxed text-slate-600">{selectedGuide.prevention}</p>
                  </div>
                </div>
              </div>

              <a
                href={selectedGuide.youtubeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 p-4 text-red-700 transition-colors border border-red-100 bg-red-50 rounded-2xl hover:bg-red-100"
              >
                <span className="flex items-center gap-3 font-bold">
                  <Youtube size={24} />
                  Watch treatment videos
                </span>
                <span className="text-sm font-bold">Open</span>
              </a>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default TreatmentGuidesPage;