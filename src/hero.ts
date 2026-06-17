import gsap from 'gsap';

export function initHeroAnimations(): void {
  splitTitleWords();
  animateHeroEntrance();
  initBlurParallax();
  initCardTilt();
}

// Envuelve cada palabra del título en un span para poder animarlas individualmente
function splitTitleWords(): void {
  const title = document.querySelector<HTMLElement>('.hero__title');
  if (!title) return;

  // Transforma "Noticias de<br>..." → "<span>Noticias</span> <span>de</span><br>..."
  title.innerHTML = title.innerHTML.replace(
    /^([^<]+)/,
    (match) =>
      match
        .trim()
        .split(' ')
        .map(w => `<span class="gsap-word">${w}</span>`)
        .join(' ')
  );
}

function animateHeroEntrance(): void {
  const tl = gsap.timeline({ delay: 0.1 });

  tl.from('.hero__tag', {
    opacity: 0,
    y: -8,
    duration: 0.4,
    ease: 'power2.out',
  })
    .from(
      '.gsap-word',
      {
        opacity: 0,
        y: 32,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power3.out',
      },
      '-=0.1'
    )
    .from(
      '.gradient-text',
      {
        opacity: 0,
        y: 32,
        duration: 0.55,
        ease: 'power3.out',
      },
      '-=0.35'
    )
    .from(
      '.hero__subtitle',
      {
        opacity: 0,
        y: 12,
        duration: 0.5,
        ease: 'power2.out',
      },
      '-=0.2'
    );
}

// Los focos de luz del hero siguen el cursor del ratón suavemente
function initBlurParallax(): void {
  const blur1 = document.querySelector<HTMLElement>('.hero__blur--1');
  const blur2 = document.querySelector<HTMLElement>('.hero__blur--2');
  if (!blur1 || !blur2) return;

  document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    gsap.to(blur1, {
      x: x * 50 - 25,
      y: y * 35 - 17,
      duration: 1.8,
      ease: 'power2.out',
    });
    gsap.to(blur2, {
      x: x * -35 + 17,
      y: y * -25 + 12,
      duration: 2.2,
      ease: 'power2.out',
    });
  });
}

// Las tarjetas se inclinan en 3D siguiendo el cursor mientras el ratón está encima
function initCardTilt(): void {
  document.querySelectorAll<HTMLElement>('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

      gsap.to(card, {
        rotateY: x * 6,
        rotateX: -y * 5,
        y: -4,
        transformPerspective: 900,
        ease: 'power2.out',
        duration: 0.35,
        overwrite: 'auto',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    });
  });
}
