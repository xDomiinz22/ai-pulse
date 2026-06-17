import gsap from 'gsap';

export function initStaggerFadeIn(selector: string = '.card'): void {
  const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));

  const inViewport = cards.filter(c => c.getBoundingClientRect().top < window.innerHeight);
  const belowFold  = cards.filter(c => c.getBoundingClientRect().top >= window.innerHeight);

  // Estado inicial para todos
  gsap.set(cards, { opacity: 0, y: 20 });

  // Tarjetas visibles: GSAP stagger nativo
  if (inViewport.length > 0) {
    gsap.to(inViewport, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: 0.08,
      ease: 'power2.out',
      delay: 0.1,
    });
  }

  // Tarjetas fuera del viewport: se revelan al entrar en pantalla
  belowFold.forEach(card => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        gsap.to(card, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(card);
  });
}

// Entrada con rebote para tarjetas que reaparecen al cambiar filtro o búsqueda
export function popIn(card: HTMLElement, delayMs = 0): void {
  gsap.fromTo(
    card,
    { opacity: 0, y: 10, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.32, delay: delayMs / 1000, ease: 'back.out(1.5)' }
  );
}
