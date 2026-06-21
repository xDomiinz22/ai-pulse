export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] py-8">
      <div className="max-w-[1160px] mx-auto px-6 flex items-center justify-between">
        <span className="flex items-center gap-2 font-head text-[18px] font-medium text-[var(--text-1)]">
          <div className="flex items-center justify-center w-[26px] h-[26px] rounded-lg text-white"
            style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecfcf)' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" fill="currentColor"/>
              <circle cx="10" cy="2" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="10" cy="18" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="2" cy="10" r="1.5" fill="currentColor" opacity=".5"/>
              <circle cx="18" cy="10" r="1.5" fill="currentColor" opacity=".5"/>
            </svg>
          </div>
          AI<strong className="text-[#6c63ff]">Pulse</strong>
        </span>
        <p className="text-[13px] text-[var(--text-3)]">
          © 2026 AI Pulse · Artificial Intelligence News
        </p>
      </div>
    </footer>
  )
}
