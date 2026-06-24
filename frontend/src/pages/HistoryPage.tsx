import { useState, useEffect } from 'react'
import { History as HistoryIcon, Trash2, Calendar, Activity, ChevronRight, Search, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface HistoryItem {
  id: number
  date: string
  prediction: string
  confidence: number
  preview: string
  is_uncertain?: boolean
  confidence_message?: string
}

const HistoryPage = () => {
  const { historyKey, user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
    setHistory(savedHistory)
  }, [historyKey])

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem(historyKey)
      setHistory([])
    }
  }

  const deleteItem = (id: number) => {
    const updated = history.filter(item => item.id !== id)
    localStorage.setItem(historyKey, JSON.stringify(updated))
    setHistory(updated)
  }

  const filteredHistory = history.filter(item => 
    item.prediction.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <HistoryIcon className="text-emerald-600" />
            Detection History
          </h2>
          <p className="text-slate-600">Review scans saved for {user?.name}.</p>
        </div>

        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-bold"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text"
              placeholder="Search history by disease name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHistory.map((item) => (
              <div 
                key={item.id} 
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all flex h-32"
              >
                <div className="w-32 h-full bg-slate-100 shrink-0 relative overflow-hidden">
                  <img 
                    src={item.preview} 
                    alt={item.prediction} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-900 truncate">{item.prediction}</h3>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {item.date.split(',')[0]}
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity size={12} />
                        {item.confidence.toFixed(1)}% Match
                      </div>
                    </div>
                    {item.is_uncertain && (
                      <div className="flex items-center gap-1 text-xs text-amber-700 mt-2">
                        <AlertTriangle size={12} />
                        Low confidence
                      </div>
                    )}
                  </div>

                  <Link 
                    to="/chat" 
                    state={{ query: item.prediction }}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:gap-2 transition-all mt-auto"
                  >
                    Get Treatment Advice
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">No matching scans found for "{searchTerm}".</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 space-y-4">
          <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto text-slate-400">
            <HistoryIcon size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">No scans yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Upload images in the Detection page to start building your history.</p>
          </div>
          <Link 
            to="/detect" 
            className="inline-block px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Start Scanning
          </Link>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
