export type Category = 'model' | 'research' | 'industry' | 'ethics'
export type FilterValue = Category | 'all'
export type Theme = 'dark' | 'light'

export interface Article {
  id: string
  title: string
  excerpt: string
  category: Category
  date: string   // ISO 8601: "2026-06-16"
  readTime: number
}
