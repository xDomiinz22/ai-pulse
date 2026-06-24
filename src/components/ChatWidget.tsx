import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import ReactMarkdown from 'react-markdown'
import { API } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

type Role = 'user' | 'assistant' | 'error'

interface Message {
  id: number
  role: Role
  text: string
}

const SUGGESTIONS = [
  'What has OpenAI been up to recently?',
  'Any news about EU AI regulation?',
  'What are the latest AI research breakthroughs?',
]

let msgId = 0
const nextId = () => ++msgId

// ── Typing indicator ───────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-[7px] h-[7px] rounded-full bg-[var(--text-3)]"
          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Single message bubble ─────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div
          className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-[13.5px] leading-[1.65] text-white"
          style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
        >
          {msg.text}
        </div>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div
        className="flex justify-start"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13px] leading-[1.65] bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {msg.text}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex items-start gap-2.5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* AI avatar */}
      <div
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full mt-0.5"
        style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="3" fill="white" />
          <circle cx="10" cy="2" r="1.5" fill="white" opacity=".5" />
          <circle cx="10" cy="18" r="1.5" fill="white" opacity=".5" />
          <circle cx="2" cy="10" r="1.5" fill="white" opacity=".5" />
          <circle cx="18" cy="10" r="1.5" fill="white" opacity=".5" />
        </svg>
      </div>

      <div className="max-w-[82%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13.5px] leading-[1.7] bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-1)]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-[var(--text-1)]">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
            li: ({ children }) => <li className="text-[var(--text-2)]">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6c63ff] hover:text-[#3ecfcf] underline underline-offset-2 transition-colors"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="bg-[var(--bg)] px-1 py-0.5 rounded text-[12px] font-mono text-[#3ecfcf]">
                {children}
              </code>
            ),
          }}
        >
          {msg.text}
        </ReactMarkdown>
      </div>
    </motion.div>
  )
}

// ── Main widget ────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [open, setOpen]       = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)

  const bottomRef  = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const panelRef   = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300)
  }, [open])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setMessages(prev => [...prev, { id: nextId(), role: 'user', text: trimmed }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setMessages(prev => [...prev, {
          id: nextId(),
          role: 'error',
          text: data.error ?? 'Something went wrong. Please try again.',
        }])
      } else {
        setMessages(prev => [...prev, { id: nextId(), role: 'assistant', text: data.answer }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: nextId(),
        role: 'error',
        text: 'Could not reach the server. Check your connection and try again.',
      }])
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <>
      {/* ── Floating action button ── */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full text-white shadow-[0_8px_30px_rgba(108,99,255,0.45)] cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open AI chat"
        title="Ask AI Pulse"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="fixed bottom-24 right-6 z-50 flex flex-col w-[370px] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.35)] border border-[var(--border)]"
            style={{ height: '540px', background: 'var(--bg)' }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
              >
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="3" fill="white" />
                  <circle cx="10" cy="2" r="1.5" fill="white" opacity=".5" />
                  <circle cx="10" cy="18" r="1.5" fill="white" opacity=".5" />
                  <circle cx="2" cy="10" r="1.5" fill="white" opacity=".5" />
                  <circle cx="18" cy="10" r="1.5" fill="white" opacity=".5" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[var(--text-1)] font-head leading-none">
                  AI Pulse Assistant
                </p>
                <p className="text-[11px] text-[var(--text-3)] mt-0.5">
                  Ask about AI news in your database
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
              {/* Welcome / empty state */}
              {isEmpty && (
                <motion.div
                  className="flex flex-col items-center text-center pt-6 pb-2 gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-2xl mb-1"
                    style={{ background: 'linear-gradient(135deg,rgba(108,99,255,0.15),rgba(62,207,207,0.15))', border: '1px solid rgba(108,99,255,0.2)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="3" fill="url(#g)" />
                      <circle cx="10" cy="2" r="1.5" fill="url(#g)" opacity=".5" />
                      <circle cx="10" cy="18" r="1.5" fill="url(#g)" opacity=".5" />
                      <circle cx="2" cy="10" r="1.5" fill="url(#g)" opacity=".5" />
                      <circle cx="18" cy="10" r="1.5" fill="url(#g)" opacity=".5" />
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                          <stop stopColor="#6c63ff" />
                          <stop offset="1" stopColor="#3ecfcf" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--text-1)] font-head">
                    Ask me anything about AI news
                  </p>
                  <p className="text-[12px] text-[var(--text-3)] max-w-[240px] leading-relaxed">
                    I search your article database and answer with citations.
                  </p>

                  {/* Suggestion chips */}
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-[12px] text-[var(--text-2)] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 hover:border-[#6c63ff]/40 hover:text-[var(--text-1)] transition-all duration-200 cursor-pointer leading-snug"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message list */}
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} />
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div
                  className="flex items-start gap-2.5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full"
                    style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="3" fill="white" />
                      <circle cx="10" cy="2" r="1.5" fill="white" opacity=".5" />
                      <circle cx="10" cy="18" r="1.5" fill="white" opacity=".5" />
                      <circle cx="2" cy="10" r="1.5" fill="white" opacity=".5" />
                      <circle cx="18" cy="10" r="1.5" fill="white" opacity=".5" />
                    </svg>
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-[var(--bg-card)] border border-[var(--border)]">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div
              className="flex-shrink-0 px-3 py-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 transition-all duration-200 focus-within:border-[#6c63ff]/60 focus-within:shadow-[0_0_0_3px_rgba(108,99,255,0.1)]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Ask about AI news…"
                  className="flex-1 resize-none bg-transparent text-[13.5px] text-[var(--text-1)] placeholder:text-[var(--text-3)] outline-none leading-[1.5] max-h-[120px] disabled:opacity-50"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-default enabled:cursor-pointer enabled:hover:opacity-90 enabled:active:scale-90"
                  style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}
                  aria-label="Send"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-[10.5px] text-[var(--text-3)] text-center mt-2 leading-none">
                Answers are based on articles in the AI Pulse database
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
