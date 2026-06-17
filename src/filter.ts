import gsap from 'gsap';
import type { FilterValue } from './types';

export class CategoryFilter {
  private current: FilterValue = 'all';
  private readonly cards: HTMLElement[];
  private readonly grid: HTMLElement;
  private readonly buttons: HTMLButtonElement[];
  private readonly countEl: HTMLElement | null;
  private readonly noResults: HTMLElement | null;

  constructor() {
    this.grid      = document.getElementById('news-grid')!;
    this.cards     = Array.from(document.querySelectorAll<HTMLElement>('.card[data-category]'));
    this.buttons   = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-filter]'));
    this.countEl   = document.querySelector<HTMLElement>('.section__count');
    this.noResults = document.getElementById('no-results');

    this.buttons.forEach(btn =>
      btn.addEventListener('click', () => this.setFilter(btn.dataset.filter as FilterValue))
    );
  }

  getActive(): FilterValue { return this.current; }

  setFilter(filter: FilterValue): void {
    if (this.current === filter) return;
    this.current = filter;
    this.syncButtons();
    this.applyFilter();
  }

  private syncButtons(): void {
    this.buttons.forEach(btn =>
      btn.classList.toggle('filter-btn--active', btn.dataset.filter === this.current)
    );
  }

  private applyFilter(): void {
    const isFiltered = this.current !== 'all';
    this.grid.classList.toggle('grid--filtered', isFiltered);

    const toHide = this.cards.filter(c => !this.matches(c) && !c.classList.contains('card--hidden'));
    const toShow = this.cards.filter(c =>  this.matches(c) &&  c.classList.contains('card--hidden'));

    // Ocultar: fade rápido → display:none + reset de estilos inline
    toHide.forEach(card => {
      gsap.to(card, {
        opacity: 0,
        scale: 0.95,
        duration: 0.15,
        onComplete: () => {
          card.classList.add('card--hidden');
          gsap.set(card, { opacity: 1, scale: 1, clearProps: 'transform' });
        },
      });
    });

    // Mostrar: quitar display:none → GSAP anima la entrada con stagger
    toShow.forEach((card, i) => {
      card.classList.remove('card--hidden');
      gsap.fromTo(
        card,
        { opacity: 0, y: 8, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, delay: i * 0.05, ease: 'power2.out' }
      );
    });

    this.updateCount();
  }

  private matches(card: HTMLElement): boolean {
    return this.current === 'all' || card.dataset.category === this.current;
  }

  private updateCount(): void {
    const visible = this.cards.filter(c => !c.classList.contains('card--hidden')).length;
    if (this.countEl) {
      this.countEl.textContent = `${visible} artículo${visible !== 1 ? 's' : ''}`;
    }
    if (this.noResults) {
      this.noResults.hidden = visible > 0;
    }
  }
}
