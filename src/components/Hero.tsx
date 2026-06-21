import { useRef, useEffect, useLayoutEffect } from 'react'
import gsap from 'gsap'
import { format } from 'date-fns'

export default function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const blur1Ref = useRef<HTMLDivElement>(null)
  const blur2Ref = useRef<HTMLDivElement>(null)

  // Today's date, formatted like "June 21, 2026" — recomputed on each render.
  const today = format(new Date(), 'MMMM d, yyyy')

  // useLayoutEffect: corre antes del primer paint → evita el flash donde el texto
  // aparece visible un frame antes de que GSAP lo anime desde opacity:0
  useLayoutEffect(() => {
    const title = titleRef.current
    if (!title) return

    // Envuelve cada palabra de "Noticias de" en un span para animarlas por separado
    title.innerHTML = title.innerHTML.replace(
      /^([^<]+)/,
      (match) => match.trim().split(' ').map(w => `<span class="gsap-word">${w}</span>`).join(' '),
    )

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 })
      tl.from('.hero-tag',      { opacity: 0, y: -8,  duration: 0.4,  ease: 'power2.out' })
        .from('.gsap-word',     { opacity: 0, y: 32,  duration: 0.55, stagger: 0.1,  ease: 'power3.out' }, '-=0.1')
        .from('.gradient-text', { opacity: 0, y: 32,  duration: 0.55, ease: 'power3.out' }, '-=0.35')
        .from('.hero-subtitle', { opacity: 0, y: 12,  duration: 0.5,  ease: 'power2.out' }, '-=0.2')
    })

    return () => ctx.revert()
  }, [])

  // GSAP: los focos de luz siguen el cursor suavemente
  useEffect(() => {
    const b1 = blur1Ref.current
    const b2 = blur2Ref.current
    if (!b1 || !b2) return

    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      gsap.to(b1, { x: x * 50 - 25, y: y * 35 - 17, duration: 1.8, ease: 'power2.out' })
      gsap.to(b2, { x: x * -35 + 17, y: y * -25 + 12, duration: 2.2, ease: 'power2.out' })
    }

    document.addEventListener('mousemove', onMove)
    return () => document.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="relative overflow-hidden py-[90px] pb-[70px] border-b border-[var(--border)]">
      <div className="max-w-[1160px] mx-auto px-6 relative z-10">
        <div className="hero-tag text-xs font-semibold tracking-[.1em] uppercase text-[#3ecfcf] mb-5">
          {today}
        </div>
        <h1
          ref={titleRef}
          className="font-head text-[clamp(38px,6vw,68px)] font-bold leading-[1.1] tracking-[-0.02em] mb-5 text-[var(--text-1)]"
        >
          AI News<br />
          <span className="gradient-text">Artificial Intelligence</span>
        </h1>
        <p className="hero-subtitle text-lg leading-[1.7] text-[var(--text-2)] max-w-[520px]">
          Analysis, breakthroughs and trends from the AI ecosystem, curated for those building the future.
        </p>
      </div>

      {/* Focos de luz de fondo */}
      <div ref={blur1Ref} className="hero-blur w-[420px] h-[420px] -top-[100px] right-[5%]"
        style={{ background: 'rgba(108,99,255,0.18)' }} />
      <div ref={blur2Ref} className="hero-blur w-[280px] h-[280px] top-[60px] right-[22%]"
        style={{ background: 'rgba(62,207,207,0.12)' }} />
    </section>
  )
}
