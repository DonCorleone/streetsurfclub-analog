import { Page } from "./pages"

export interface PostResponse {
  kind: string
  items: Post[]
  etag: string
}

export interface Post extends Page {
  content: string
  images: Image[]
  replies: Replies
  etag: string
  titleLink?: string
  labels?: string[]
}

export interface Image {
  url: string
}

export interface Replies {
  totalItems: string
  selfLink: string
}
