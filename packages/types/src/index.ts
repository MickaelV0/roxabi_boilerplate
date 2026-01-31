export type User = {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export type ApiResponse<T> = {
  data: T
  error?: string
  meta?: {
    page?: number
    total?: number
  }
}
