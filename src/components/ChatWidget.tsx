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
// Terminal accent zone liveness marker (DESIGN.md §5): a single blinking
// spot-colored block cursor, not a generic spinner.

function TypingDots() {
  return (
    <div className="flex items-center px-4 py-3">
      <span className="term-cursor text-[var(--spot)] font-mono text-[15px] leading-none select-none" aria-hidden="true">▍</span>
    </div>
  )
}

// Transmission icon — three horizontal rules suggesting teletype output, Wire Room voice
function TransmissionIcon({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={Math.round(size * 0.77)} viewBox="0 0 13 10" fill="none" aria-hidden="true">
      <line x1="0" y1="1" x2="13" y2="1" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
      <line x1="0" y1="5" x2="9"  y2="5" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
      <line x1="0" y1="9" x2="11" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
    </svg>
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
          className="max-w-[80%] px-4 py-2.5 text-[13.5px] leading-[1.6] font-body text-[var(--paper)]"
          style={{ background: 'var(--ink)' }}
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
        <div className="max-w-[85%] px-4 py-2.5 text-[13px] leading-[1.65] bg-[var(--clip)] border border-[var(--spot)] text-[var(--spot)]">
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
        className="flex-shrink-0 flex items-center justify-center w-7 h-7 mt-0.5"
        style={{ background: 'var(--ink)' }}
      >
        <TransmissionIcon size={13} color="white" />
      </div>

      <div className="max-w-[82%] px-4 py-2.5 text-[14px] leading-[1.7] font-body bg-[var(--clip)] border border-[var(--rule)] text-[var(--ink)]">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-[var(--ink)]">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
            li: ({ children }) => <li className="text-[var(--ink-soft)]">{children}</li>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--spot)] hover:opacity-70 underline underline-offset-2 transition-opacity"
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code className="bg-[var(--paper)] border border-[var(--rule)] px-1 py-0.5 rounded-sm text-[12px] font-mono text-[var(--ink)]">
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

  // Escape key to close
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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
        className="terminal-zone fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 h-10 text-[var(--paper)] shadow-[0_4px_16px_rgba(33,27,22,0.35)] cursor-pointer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
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
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </motion.svg>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <TransmissionIcon size={13} color="white" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase">
          {open ? 'Close' : 'Ask'}
        </span>
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="fixed bottom-[72px] right-3 left-3 sm:left-auto sm:right-6 sm:w-[370px] z-50 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(33,27,22,0.3)] border border-[var(--rule-strong)]"
            style={{ height: '540px', background: 'var(--paper)' }}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            {/* Header — terminal accent zone */}
            <div
              className="terminal-zone relative flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(233, 225, 208, 0.15)' }}
            >
              <div className="flex items-center justify-center w-8 h-8 flex-shrink-0">
                <TransmissionIcon size={15} color="white" />
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-[var(--paper)] font-body leading-none">
                  AI Pulse Assistant
                </p>
                <p className="text-[11px] text-[var(--paper)] opacity-60 mt-0.5">
                  Ask about today's AI coverage
                </p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear chat"
                  className="text-[var(--paper)] opacity-60 hover:opacity-100 hover:text-[var(--spot)] transition-all cursor-pointer"
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
                    className="flex items-center justify-center w-14 h-14 mb-1"
                    style={{ background: 'var(--clip)', border: '1px solid var(--rule-strong)' }}
                  >
                    <TransmissionIcon size={22} color="var(--ink)" />
                  </div>
                  <p className="text-[13px] font-semibold text-[var(--ink)] font-display">
                    Ask anything about AI news
                  </p>
                  <p className="text-[12px] text-[var(--ink-mute)] max-w-[240px] leading-relaxed">
                    I read today's dispatches and answer from what's on the wire.
                  </p>

                  {/* Suggestion chips */}
                  <div className="flex flex-col gap-2 w-full mt-2">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-left text-[12.5px] font-body text-[var(--ink-soft)] bg-[var(--clip)] border border-[var(--rule)] px-3.5 py-2.5 hover:border-[var(--spot)] hover:text-[var(--ink)] transition-colors duration-200 cursor-pointer leading-snug"
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
                    className="flex-shrink-0 flex items-center justify-center w-7 h-7"
                    style={{ background: 'var(--ink)' }}
                  >
                    <TransmissionIcon size={13} color="white" />
                  </div>
                  <div className="bg-[var(--clip)] border border-[var(--rule)]">
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div
              className="flex-shrink-0 px-3 py-3"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <div className="flex items-center gap-2 bg-[var(--clip)] border border-[var(--rule-strong)] px-3 py-2 transition-all duration-200 focus-within:border-[var(--spot)] focus-within:shadow-[0_0_0_3px_rgba(162,59,43,0.12)]">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Ask about AI news…"
                  className="flex-1 resize-none bg-transparent font-mono text-[12.5px] text-[var(--ink)] placeholder:text-[var(--ink-mute)] outline-none leading-[1.5] max-h-[120px] disabled:opacity-50"
                  style={{ scrollbarWidth: 'none' }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 text-[var(--paper)] transition-all duration-200 disabled:opacity-30 disabled:cursor-default enabled:cursor-pointer enabled:hover:opacity-90 enabled:active:scale-90"
                  style={{ background: 'var(--ink)' }}
                  aria-label="Send"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
              <p className="text-[10.5px] text-[var(--ink-mute)] text-center mt-2 leading-none">
                Sourced from today's AI Pulse dispatches
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
