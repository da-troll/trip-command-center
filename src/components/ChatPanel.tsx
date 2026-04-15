import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Sparkles, X, MessageSquare } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTrip } from '../context'

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

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useTrip()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

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
        body: JSON.stringify({
          messages: history,
          trip_state: state,
        }),
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
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-96 border-l border-ops-border bg-ops-surface flex flex-col h-full shrink-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ops-border shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-ops-accent/20 flex items-center justify-center">
                <Sparkles size={12} className="text-ops-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-ops-text">Trip Builder AI</p>
                <p className="text-[10px] text-ops-muted">Describe your trip, I'll build it</p>
              </div>
            </div>
            <button onClick={onClose} className="text-ops-muted hover:text-ops-text transition-colors p-1">
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 && (
              <div className="py-8">
                <div className="w-10 h-10 rounded-full bg-ops-accent/10 border border-ops-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Bot size={20} className="text-ops-accent" />
                </div>
                <p className="text-sm text-ops-text text-center mb-1">Trip Builder Agent</p>
                <p className="text-xs text-ops-muted text-center mb-6">
                  Describe your trip in plain English. I'll create groups, routes, itinerary, meals, and expenses.
                </p>
                <div className="space-y-2">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-ops-border hover:border-ops-accent/40 hover:bg-ops-bg/50 text-ops-muted hover:text-ops-text transition-all"
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
                  <div className="w-6 h-6 rounded-full bg-ops-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-ops-accent" />
                  </div>
                )}
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`text-sm rounded-lg px-3 py-2 ${
                      msg.role === 'user'
                        ? 'bg-ops-accent/15 text-ops-text ml-auto'
                        : 'bg-ops-bg border border-ops-border text-ops-text'
                    }`}
                  >
                    {msg.pending ? (
                      <div className="flex items-center gap-2 text-ops-muted">
                        <Loader2 size={13} className="animate-spin" />
                        <span className="text-xs">Thinking...</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>

                  {/* Action badges */}
                  {msg.actions && msg.actions.length > 0 && !msg.pending && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {msg.actions.map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-ops-accent/10 text-ops-accent border border-ops-accent/20"
                        >
                          {formatActionType(a.type)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-ops-info/15 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={12} className="text-ops-info" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-ops-border shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your trip..."
                rows={1}
                className="flex-1 bg-ops-bg border border-ops-border rounded-lg px-3 py-2 text-sm text-ops-text placeholder:text-ops-border resize-none focus:outline-none focus:border-ops-accent transition-colors"
                style={{ maxHeight: 80 }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="px-3 py-2 bg-ops-accent hover:bg-ops-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ChatToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-5 right-5 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all z-40
        ${open
          ? 'bg-ops-border text-ops-muted hover:text-ops-text'
          : 'bg-ops-accent hover:bg-ops-accent-hover text-white'
        }`}
    >
      {open ? <X size={18} /> : <MessageSquare size={18} />}
    </button>
  )
}

function formatActionType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, c => c.toUpperCase())
}
