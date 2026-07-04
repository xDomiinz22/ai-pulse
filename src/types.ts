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

export interface Head {
  title: string
  url: string
}

// Server-rendered payload serialized into the HTML (window.__INITIAL_DATA__)
// so the client hydrates with the same data the server already fetched,
// instead of re-fetching and flashing an empty/loading state.
export interface InitialData {
  filter: FilterValue
  query: string
  articles: Article[]
  counts: Record<string, number>
  heads: Head[]
}
