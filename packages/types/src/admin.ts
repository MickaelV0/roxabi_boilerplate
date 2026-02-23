/** Org member as returned by the admin members API */
export type Member = {
  id: string
  userId: string
  role: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

/** Pagination metadata returned alongside paginated API responses */
export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

/** Response shape for the admin members list endpoint */
export type MembersResponse = {
  data: Member[]
  pagination: PaginationMeta
}
