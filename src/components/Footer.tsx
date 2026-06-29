export default function Footer() {
  return (
    <footer className="border-t-[3px] border-[var(--ink)] mt-8">
      <div className="max-w-[1160px] mx-auto px-6 py-10 text-center">
        <div className="font-display font-black text-[28px] leading-none text-[var(--ink)] mb-3">
          AI&nbsp;Pulse
        </div>
        <p className="wire mb-5">Artificial Intelligence · Reported hourly from the wire</p>
        <div className="flex items-center justify-center gap-2 wire text-[var(--ink-mute)]">
          <span>© 2026 AI Pulse</span>
          <span className="text-[var(--rule-strong)]">·</span>
          <span>All the AI that&rsquo;s fit to print</span>
        </div>
      </div>
    </footer>
  )
}
