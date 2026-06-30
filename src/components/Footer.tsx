import { format } from 'date-fns'

export default function Footer() {
  const transmission = format(new Date(), 'HH:mm:ss')

  return (
    <footer className="border-t-[3px] border-[var(--ink)] mt-8">
      <div className="max-w-[1160px] mx-auto px-6 py-10">

        {/* End-of-transmission line */}
        <div className="rule-bottom pb-6 mb-6 flex items-center justify-between gap-4">
          <span className="wire text-[var(--ink-mute)]">— 30 —</span>
          <span className="wire text-[var(--ink-mute)]">
            Transmission closed · {transmission} UTC
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="font-display font-black text-[22px] leading-none text-[var(--ink)] mb-1">
              AI&nbsp;Pulse
            </div>
            <p className="wire text-[var(--ink-mute)]">Artificial Intelligence · Reported hourly from the wire</p>
          </div>
          <span className="wire text-[var(--ink-mute)]">© 2026 AI Pulse</span>
        </div>
      </div>
    </footer>
  )
}
