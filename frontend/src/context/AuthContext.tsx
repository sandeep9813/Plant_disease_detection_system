import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface AuthUser {
  name: string
  email: string
}

interface StoredUser extends AuthUser {
  password: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => { ok: boolean; message?: string }
  signup: (name: string, email: string, password: string) => { ok: boolean; message?: string }
  logout: () => void
  historyKey: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const USERS_KEY = 'plantguard_users'
const SESSION_KEY = 'plantguard_session'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const getStoredUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
  } catch {
    return []
  }
}

const saveStoredUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
    } catch {
      return null
    }
  })

  const login = (email: string, password: string) => {
    const cleanEmail = normalizeEmail(email)
    const found = getStoredUsers().find(item => item.email === cleanEmail && item.password === password)
    if (!found) {
      return { ok: false, message: 'Invalid email or password.' }
    }
    const session = { name: found.name, email: found.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return { ok: true }
  }

  const signup = (name: string, email: string, password: string) => {
    const cleanEmail = normalizeEmail(email)
    if (!name.trim() || !cleanEmail || password.length < 4) {
      return { ok: false, message: 'Enter a name, valid email, and at least 4 password characters.' }
    }
    const users = getStoredUsers()
    if (users.some(item => item.email === cleanEmail)) {
      return { ok: false, message: 'An account with this email already exists.' }
    }
    const nextUser = { name: name.trim(), email: cleanEmail, password }
    saveStoredUsers([...users, nextUser])
    const session = { name: nextUser.name, email: nextUser.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return { ok: true }
  }

  const logout = () => {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo<AuthContextValue>(() => ({
    user,
    login,
    signup,
    logout,
    historyKey: user ? `plant_history_${user.email}` : 'plant_history_guest'
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
