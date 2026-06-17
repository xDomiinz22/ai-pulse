import Fuse from 'fuse.js';
import gsap from 'gsap';

interface CardItem {
  element: HTMLElement;
  title: string;
  excerpt: string;
}

export class ArticleSearch {
  private readonly input: HTMLInputElement;
  private readonly grid: HTMLElement | null;
  private readonly countEl: HTMLElement | null;
  private readonly noResults: HTMLElement | null;
  private readonly fuse: Fuse<CardItem>;
  private readonly allItems: CardItem[];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(inputId: string) {
    this.input     = document.getElementById(inputId) as HTMLInputElement;
    this.grid      = document.getElementById('news-grid');
    this.countEl   = document.querySelector<HTMLElement>('.section__count');
    this.noResults = document.getElementById('no-results');

    // Construye el índice de búsqueda leyendo el DOM una sola vez
    this.allItems = Array.from(
      document.querySelectorAll<HTMLElement>('.card[data-category]')
    ).map(el => ({
      element: el,
      title:   el.querySelector('.card__title')?.textContent?.trim() ?? '',
      excerpt: el.querySelector('.card__excerpt')?.textContent?.trim() ?? '',
    }));

    // threshold 0.35 → tolera errores tipográficos leves ("alphafold" → "AlphaFold")
    this.fuse = new Fuse(this.allItems, {
      keys: [
        { name: 'title',   weight: 0.7 },
        { name: 'excerpt', weight: 0.3 },
      ],
      threshold: 0.35,
      includeScore: true,
    });

    this.input.addEventListener('input', () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.search(this.input.value), 200);
    });
  }

  private search(raw: string): void {
    const query = raw.trim();

    if (!query) {
      this.showAll();
      return;
    }

    this.grid?.classList.add('grid--filtered');
    const matchedElements = new Set(this.fuse.search(query).map(r => r.item.element));
    let visible = 0;

    this.allItems.forEach(({ element }) => {
      const matches = matchedElements.has(element);

      if (matches) {
        if (element.classList.contains('card--search-hidden')) {
          element.classList.remove('card--search-hidden');
          gsap.fromTo(element,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
          );
        }
        visible++;
      } else {
        if (!element.classList.contains('card--search-hidden')) {
          gsap.to(element, {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
              element.classList.add('card--search-hidden');
              gsap.set(element, { opacity: 1 });
            },
          });
        }
      }
    });

    this.updateCount(visible);
  }

  private showAll(): void {
    this.grid?.classList.remove('grid--filtered');
    this.allItems.forEach(({ element }) => {
      if (element.classList.contains('card--search-hidden')) {
        element.classList.remove('card--search-hidden');
        gsap.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      }
    });
    this.updateCount(this.allItems.length);
  }

  private updateCount(visible: number): void {
    if (this.countEl) {
      this.countEl.textContent = `${visible} artículo${visible !== 1 ? 's' : ''}`;
    }
    if (this.noResults) {
      this.noResults.hidden = visible > 0;
    }
  }

  // — Preparado para base de datos ————————————————————————————
  // Cuando haya una API, reemplaza search() por esta versión.
  // El resto de la clase (animaciones, count, noResults) no cambia.
  //
  // private async searchRemote(query: string): Promise<void> {
  //   const res = await fetch(`/api/articles?q=${encodeURIComponent(query)}`);
  //   const articles: Article[] = await res.json();
  //   this.renderResults(articles);
  // }
}
