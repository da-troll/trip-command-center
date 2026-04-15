import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context'
import { useShell } from '../App'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  actions?: Action[]
  pending?: boolean
}

interface Action {
  type: string
  [key: string]: unknown
}

const SUGGESTIONS = [
  'Plan a weekend trip to Lake Tahoe for 3 groups',
  'Add a hiking activity for Saturday morning',
  'Set up meals for the whole trip',
  'What\'s still missing from this trip?',
]

export function ChatPanel() {
  const { state, dispatch } = useTrip()
  const { chatOpen, setChatOpen } = useShell()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [chatOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function send(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text: msg }
    const pendingMsg: Message = { id: crypto.randomUUID(), role: 'assistant', text: '', pending: true }
    setMessages(prev => [...prev, userMsg, pendingMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.text }))

      const resp = await fetch('./api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, trip_state: state }),
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `HTTP ${resp.status}`)
      }

      const data = await resp.json()

      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          dispatch(action)
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === pendingMsg.id
            ? { ...m, text: data.text, actions: data.actions, pending: false }
            : m
        )
      )
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === pendingMsg.id
            ? { ...m, text: `Error: ${err instanceof Error ? err.message : 'Something went wrong'}`, pending: false }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setChatOpen(false)}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 right-0 h-[100dvh] md:relative md:inset-auto md:h-auto md:w-96 glass-heavy border-l border-white/[0.06] flex flex-col z-50 md:z-auto md:shrink-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-ops-accent/15 border border-ops-accent/20 flex items-center justify-center">
                  <Sparkles size={13} className="text-ops-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-ops-text">Trip Builder AI</p>
                  <p className="text-[10px] text-ops-muted">Describe your trip, I'll build it</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="touch-target text-ops-muted hover:text-ops-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="py-6 sm:py-8">
                  <div className="w-12 h-12 rounded-full bg-ops-accent/10 border border-ops-accent/20 flex items-center justify-center mx-auto mb-4">
                    <Bot size={22} className="text-ops-accent" />
                  </div>
                  <p className="text-sm text-ops-text text-center mb-1">Trip Builder Agent</p>
                  <p className="text-xs text-ops-muted text-center mb-6 px-4">
                    Describe your trip in plain English. I'll create groups, routes, itinerary, meals, and expenses.
                  </p>
                  <div className="space-y-2 px-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="w-full text-left text-xs px-3 py-3 rounded-lg glass-card-hover text-ops-muted hover:text-ops-text"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-ops-accent/15 border border-ops-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={11} className="text-ops-accent" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`text-sm rounded-xl px-3.5 py-2.5 ${
                        msg.role === 'user'
                          ? 'bg-ops-accent/15 border border-ops-accent/20 text-ops-text'
                          : 'glass-card text-ops-text'
                      }`}
                    >
                      {msg.pending ? (
                        <div className="flex items-center gap-2 text-ops-muted">
                          <Loader2 size={13} className="animate-spin" />
                          <span className="text-xs">Thinking...</span>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                    </div>

                    {msg.actions && msg.actions.length > 0 && !msg.pending && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.actions.map((a, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-ops-accent/10 text-ops-accent border border-ops-accent/20 backdrop-blur-sm">
                            {formatActionType(a.type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-ops-info/15 border border-ops-info/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={11} className="text-ops-info" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/[0.06] shrink-0">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your trip..."
                  rows={1}
                  className="flex-1 glass-input !rounded-xl resize-none"
                  style={{ maxHeight: 80 }}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="glass-btn-accent !rounded-xl touch-target disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function ChatToggle() {
  const { chatOpen, setChatOpen } = useShell()

  return (
    <button
      onClick={() => setChatOpen(!chatOpen)}
      className={`fixed bottom-5 right-5 w-13 h-13 rounded-full shadow-lg flex items-center justify-center transition-all z-40
        ${chatOpen
          ? 'glass-heavy text-ops-muted hover:text-ops-text'
          : 'glass-btn-accent !rounded-full !p-3.5 shadow-ops-accent/20'
        }`}
    >
      {chatOpen ? <X size={18} /> : <MessageSquare size={18} />}
    </button>
  )
}

function formatActionType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())
}
