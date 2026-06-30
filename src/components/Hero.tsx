import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null)

  // Discreet front-page reveal: eyebrow, headline and lede settle into place.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.lead-el', {
        opacity: 0,
        y: 18,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        delay: 0.05,
      })
    }, rootRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={rootRef}
      className="rule-bottom"
    >
      <div className="max-w-[820px] mx-auto px-6 py-14 md:py-16 text-center">
        <div className="lead-el wire mb-5">The AI Pulse Brief</div>

        <h1 className="lead-el font-display font-black text-[var(--ink)] leading-[0.98] tracking-[-0.02em] mb-6"
          style={{ fontSize: 'clamp(34px, 5.5vw, 60px)', textWrap: 'balance' } as CSSProperties}>
          All the AI that&rsquo;s <span className="gradient-text">fit to print.</span>
        </h1>

        <p className="lead-el font-body text-[var(--ink-soft)] mx-auto max-w-[560px]"
          style={{ fontSize: '18px', lineHeight: 1.65 }}>
          Breakthroughs, research and industry moves from across the
          artificial-intelligence world — filtered, summarized and ranked,
          fresh from the wire every hour.
        </p>
      </div>
    </section>
  )
}
