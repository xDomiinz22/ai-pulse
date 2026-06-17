import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

const CATEGORY_LABELS: Record<string, string> = {
  model:    'Modelos de IA',
  research: 'Investigación científica',
  industry: 'Noticias de industria',
  ethics:   'Ética e impacto social',
};

export function initTooltips(): void {
  tooltipFilterButtons();
  tooltipTags();
  tooltipLiveBadge();
}

// Botones de filtro → cuántos artículos hay en esa categoría
function tooltipFilterButtons(): void {
  document.querySelectorAll<HTMLElement>('[data-filter]').forEach(btn => {
    const filter = btn.dataset.filter!;
    if (filter === 'all') return;

    const count = document.querySelectorAll(`.card[data-category="${filter}"]`).length;
    const label = CATEGORY_LABELS[filter] ?? filter;

    tippy(btn, {
      content: `${label} · ${count} artículo${count !== 1 ? 's' : ''}`,
      placement: 'bottom',
      theme: 'aipulse',
      animation: 'shift-away',
      delay: [300, 0],
    });
  });
}

// Tags dentro de las tarjetas → descripción de la categoría
function tooltipTags(): void {
  document.querySelectorAll<HTMLElement>('.tag').forEach(tag => {
    const category = Object.keys(CATEGORY_LABELS).find(k => tag.classList.contains(`tag--${k}`));
    if (!category) return;

    tippy(tag, {
      content: CATEGORY_LABELS[category],
      placement: 'top',
      theme: 'aipulse',
      animation: 'shift-away',
      delay: [200, 0],
    });
  });
}

// Badge "En vivo" → explica qué significa
function tooltipLiveBadge(): void {
  const badge = document.querySelector('.live-badge');
  if (!badge) return;

  tippy(badge, {
    content: 'Noticias actualizadas cada hora',
    placement: 'bottom',
    theme: 'aipulse',
    animation: 'shift-away',
  });
}
