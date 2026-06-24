import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, CheckCircle2, AlertTriangle, Download, Flame } from 'lucide-react'
import { api, PredictionResult } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const DetectionPage = () => {
  const { historyKey, user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0]
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setError(null)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  })

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.predict(file)
      setResult(data)
      
      // Save to history
      const historyItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        prediction: data.prediction,
        confidence: data.confidence,
        preview: preview,
        is_uncertain: data.is_uncertain,
        confidence_message: data.confidence_message,
        heatmap: data.heatmap,
        top_3: data.top_3
      }
      const existingHistory = JSON.parse(localStorage.getItem(historyKey) || '[]')
      localStorage.setItem(historyKey, JSON.stringify([historyItem, ...existingHistory]))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze image. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }

  const downloadReport = () => {
    if (!result || !preview) return
    const topRows = result.top_3.map(item => `
      <tr>
        <td>${item.class_name}</td>
        <td>${item.confidence.toFixed(1)}%</td>
      </tr>
    `).join('')
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) return
    reportWindow.document.write(`
      <html>
        <head>
          <title>PlantGuard AI Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1 { color: #047857; margin-bottom: 4px; }
            .meta { color: #64748b; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 20px 0; }
            img { width: 100%; border-radius: 10px; border: 1px solid #e2e8f0; }
            .box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
            .warning { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            td, th { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; }
            @media print { button { display: none; } body { margin: 18px; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Save as PDF</button>
          <h1>PlantGuard AI Disease Report</h1>
          <div class="meta">Generated for ${user?.name || 'User'} on ${new Date().toLocaleString()}</div>
          <div class="box ${result.is_uncertain ? 'warning' : ''}">
            <h2>${result.prediction}</h2>
            <p><strong>Confidence:</strong> ${result.confidence.toFixed(1)}%</p>
            <p>${result.confidence_message}</p>
          </div>
          <div class="grid">
            <div>
              <h3>Uploaded Image</h3>
              <img src="${preview}" />
            </div>
            ${result.heatmap ? `
              <div>
                <h3>Model Attention Heatmap</h3>
                <img src="${result.heatmap}" />
              </div>
            ` : ''}
          </div>
          <div class="box">
            <h3>Top Predictions</h3>
            <table>
              <thead><tr><th>Disease</th><th>Confidence</th></tr></thead>
              <tbody>${topRows}</tbody>
            </table>
          </div>
        </body>
      </html>
    `)
    reportWindow.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Disease Detection</h2>
        <p className="text-slate-600">Upload a high-quality photo of a plant leaf for accurate analysis.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {!preview ? (
          <div 
            {...getRootProps()} 
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'}
            `}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-emerald-50 rounded-full">
                <Upload size={32} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-slate-500">PNG, JPG, JPEG (Max 10MB)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative aspect-video max-h-[400px] bg-slate-100 rounded-xl overflow-hidden group">
              <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
              {!loading && !result && (
                <button 
                  onClick={reset}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                <AlertTriangle size={20} />
                <p>{error}</p>
              </div>
            )}

            <div className="flex justify-center">
              {!result ? (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-3"
                >
                  {loading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    'Run Analysis'
                  )}
                </button>
              ) : (
                <button
                  onClick={reset}
                  className="px-8 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all"
                >
                  Scan Another Leaf
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Result */}
            <div className="lg:col-span-2 bg-white rounded-2xl border-t-4 border-emerald-500 p-8 shadow-md">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-1">Primary Prediction</h3>
                  <p className="text-3xl font-black text-slate-900">{result.prediction}</p>
                </div>
                <div className={`${result.is_uncertain ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'} px-4 py-2 rounded-lg font-black text-xl`}>
                  {result.confidence.toFixed(1)}%
                </div>
              </div>

              <div className="space-y-4">
                <div className={`${result.is_uncertain ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'} border rounded-xl p-4 flex items-start gap-3`}>
                  {result.is_uncertain ? <AlertTriangle size={20} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={20} className="shrink-0 mt-0.5" />}
                  <p>{result.confidence_message}</p>
                </div>
                <p className="text-slate-600">
                  You can ask PlantGuard AI in the chat section for detailed treatment instructions for this result.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    <Download size={18} />
                    Report
                  </button>
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                    <CheckCircle2 size={18} />
                    <span>Analysis Complete</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top 3 List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h4 className="font-bold text-slate-900 mb-4">Top 3 Predictions</h4>
              <div className="space-y-3">
                {result.top_3.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.class_name}</span>
                      <span className="text-slate-500">{item.confidence.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${item.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.heatmap && (
              <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="text-rose-500" size={20} />
                  <h4 className="font-bold text-slate-900">Model Attention Heatmap</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                    <img src={preview || ''} alt="Original scan" className="w-full h-full object-contain" />
                  </div>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                    <img src={result.heatmap} alt="Heatmap overlay" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DetectionPage
