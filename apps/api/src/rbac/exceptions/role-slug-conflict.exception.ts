export class RoleSlugConflictException extends Error {
  constructor(slug: string) {
    super(`Role with slug "${slug}" already exists`)
    this.name = 'RoleSlugConflictException'
  }
}
