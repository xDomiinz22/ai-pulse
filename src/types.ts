export type Category = 'model' | 'research' | 'industry' | 'ethics';
export type FilterValue = Category | 'all';
export type Theme = 'dark' | 'light';

// Interface preparada para cuando se conecte una base de datos.
// El módulo de búsqueda usará este contrato en lugar de scraping del DOM.
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  date: string;
  readTime: number;
}
