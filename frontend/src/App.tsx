import { Navigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, Scan, MessageSquare, History, Leaf, Menu, X, LogOut, UserCircle, BookOpen } from 'lucide-react'
import { useState } from 'react'
import HomePage from './pages/HomePage'
import DetectionPage from './pages/DetectionPage'
import ChatPage from './pages/ChatPage'
import HistoryPage from './pages/HistoryPage'
import LoginPage from './pages/LoginPage'
import TreatmentGuidesPage from './pages/TreatmentGuidesPage'
import { useAuth } from './context/AuthContext'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/detect', label: 'Detect Disease', icon: <Scan size={20} /> },
    { path: '/chat', label: 'PlantGuard AI', icon: <MessageSquare size={20} /> },
    { path: '/guides', label: 'Treatment Guides', icon: <BookOpen size={20} /> },
    { path: '/history', label: 'History', icon: <History size={20} /> },
  ]

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar for Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Leaf size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">PlantGuard AI</h1>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-emerald-700 text-white' 
                    : 'text-emerald-100 hover:bg-emerald-800'}
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-emerald-800">
            <div className="bg-emerald-800/50 p-4 rounded-xl text-sm text-emerald-200 space-y-3">
              <div className="flex items-center gap-2">
                <UserCircle size={18} className="text-white" />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{user.name}</p>
                  <p className="text-xs truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-950/50 hover:bg-emerald-950 text-white rounded-lg font-bold transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-600" size={24} />
            <span className="font-bold text-emerald-900">PlantGuard AI</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/detect" element={<DetectionPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/guides" element={<TreatmentGuidesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/login" element={<Navigate to="/detect" replace />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default App
