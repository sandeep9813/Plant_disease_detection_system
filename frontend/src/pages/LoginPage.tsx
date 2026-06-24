import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Leaf, Lock, Mail, User, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const { user, login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) {
    return <Navigate to="/detect" replace />
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setError('')
    const result = mode === 'login'
      ? login(email, password)
      : signup(name, email, password)
    if (!result.ok) {
      setError(result.message || 'Something went wrong.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-emerald-900 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <Leaf size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black">PlantGuard AI</h1>
              <p className="text-sm text-emerald-200">Sign in to save scans and reports.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`py-2 rounded-lg font-bold text-sm transition-colors ${mode === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
              }}
              className={`py-2 rounded-lg font-bold text-sm transition-colors ${mode === 'signup' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signup' && (
            <label className="block space-y-2">
              <span className="text-sm font-bold text-slate-700">Full name</span>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                  placeholder="Your name"
                />
              </div>
            </label>
          )}

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-transparent rounded-xl focus:bg-white focus:border-emerald-500 outline-none"
                placeholder="Minimum 4 characters"
              />
            </div>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            {mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
