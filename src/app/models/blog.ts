export interface BlogResponse {
  kind: string
  id: string
  name: string
  description: string
  published: string
  updated: string
  url: string
  selfLink: string
  posts: Posts
  pages: Pages
  locale: Locale
}

export interface Posts {
  totalItems: number
  selfLink: string
}

export interface Pages {
  totalItems: number
  selfLink: string
}

export interface Locale {
  language: string
  country: string
  variant: string
}
