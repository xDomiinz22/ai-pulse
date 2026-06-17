import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function initRelativeDates(): void {
  const dateEls = document.querySelectorAll<HTMLElement>('[data-date]');

  dateEls.forEach(el => {
    const iso = el.dataset.date!;
    const date = parseISO(iso);

    // Texto relativo: "hace 2 días", "hace 5 horas"...
    el.textContent = formatDistanceToNow(date, { locale: es, addSuffix: true });

    // La fecha exacta aparece en el tooltip nativo del navegador (title)
    el.title = date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });
}
