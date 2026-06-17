import type { Theme } from './types';

const STORAGE_KEY = 'aipulse-theme';

export class ThemeToggle {
  private current: Theme;
  private button: HTMLButtonElement;

  constructor(buttonId: string) {
    this.button = document.getElementById(buttonId) as HTMLButtonElement;
    this.current = this.resolve();
    this.apply(this.current);
    this.button.addEventListener('click', () => this.toggle());
  }

  // Prioridad: localStorage → preferencia del sistema operativo → dark por defecto
  private resolve(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private toggle(): void {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, this.current);
    this.apply(this.current);
  }

  private apply(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
    this.button.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    this.button.innerHTML = theme === 'dark' ? ICON_SUN : ICON_MOON;
  }
}

const ICON_SUN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>`;

const ICON_MOON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>`;
