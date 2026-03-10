export type RoleRow = {
  id: string
  tenantId: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
