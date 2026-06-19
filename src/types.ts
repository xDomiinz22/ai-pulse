export type Category = 'model' | 'research' | 'industry' | 'ethics'
export type FilterValue = Category | 'all'
export type Theme = 'dark' | 'light'

export interface Article {
  id: number
  title: string
  short_summary: string | null
  category: Category
  source: string | null
  image_url: string | null
  read_time: number | null
  published_at: string | null
  url: string
  votes_up: number
  votes_down: number
}
