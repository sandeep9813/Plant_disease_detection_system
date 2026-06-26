import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, Bot, User, Loader2, Sparkles, Youtube, ExternalLink } from 'lucide-react'
import { api, ChatMessage } from '../services/api'
import { motion } from 'framer-motion'

const ChatPage = () => {
  const location = useLocation()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'bot', 
      content: "Hello! I am **PlantGuard AI**. I can help you identify symptoms, treatments, and prevention strategies for 38 different plant conditions. How can I help you today?" 
    }
  ])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Automatically trigger a chat search if navigating from History with a crop/disease state
  useEffect(() => {
    if (location.state?.query) {
      const initialQuery = location.state.query;
      
      // Clear location state immediately to prevent re-triggering query on reload
      window.history.replaceState({}, document.title);
      
      const performAutoQuery = async () => {
        setMessages(prev => [...prev, { role: 'user', content: initialQuery }]);
        setLoading(true);
        try {
          const response = await api.chat(initialQuery, []);
          setMessages(prev => [...prev, { role: 'bot', content: response.response }]);
        } catch (err) {
          setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to my knowledge base. Please make sure the backend is running." }]);
        } finally {
          setLoading(false);
        }
      };
      
      performAutoQuery();
    }
  }, [location.state])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await api.chat(userMessage, messages)
      setMessages(prev => [...prev, { role: 'bot', content: response.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to my knowledge base. Please make sure the backend is running." }])
    } finally {
      setLoading(false)
    }
  }

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <h3 key={i} className="text-xl font-bold text-emerald-900 mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>
      }
      if (line.startsWith('**')) {
        const parts = line.split('**')
        return (
          <p key={i} className="mb-1">
            <span className="font-bold text-emerald-800">{parts[1]}</span>
            {parts[2]}
          </p>
        )
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc text-slate-700 mb-1">{line.substring(2)}</li>
      }
      if (line.includes('https://www.youtube.com')) {
        const url = line.split(': ')[1]
        return (
          <div key={i} className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-700">
              <Youtube size={24} />
              <span className="font-bold">Watch Treatment Guide</span>
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              Open YouTube <ExternalLink size={14} />
            </a>
          </div>
        )
      }
      return <p key={i} className="text-slate-700 mb-1">{line}</p>
    })
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-emerald-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="font-bold">PlantGuard AI Chat</h2>
            <p className="text-xs text-emerald-300">Online | Knowledge Base V1.0</p>
          </div>
        </div>
        <Sparkles className="text-emerald-400" size={20} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0
                ${msg.role === 'user' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white'}
              `}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`
                p-4 rounded-2xl shadow-sm
                ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}
              `}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.role === 'user' ? msg.content : formatContent(msg.content)}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
                <span className="text-slate-500 text-sm">PlantGuard is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about symptoms, treatments, or specific diseases..."
          className="flex-1 px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
        <button 
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-slate-300 transition-all"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  )
}

export default ChatPage
