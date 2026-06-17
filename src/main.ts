import { initStaggerFadeIn } from './animations';
import { initHeroAnimations } from './hero';
import { initRelativeDates } from './dates';
import { initTooltips } from './tooltips';
import { ThemeToggle } from './theme';
import { CategoryFilter } from './filter';
import { ArticleSearch } from './search';

document.addEventListener('DOMContentLoaded', () => {
  initRelativeDates();   // date-fns: fechas relativas antes de mostrar nada
  initStaggerFadeIn('.card');   // Motion: aparición escalonada de tarjetas
  initHeroAnimations();  // GSAP: título, parallax y tilt 3D
  initTooltips();        // Tippy: tooltips en filtros, tags y badge
  new ThemeToggle('theme-toggle');
  new CategoryFilter();
  new ArticleSearch('search-input');
});
