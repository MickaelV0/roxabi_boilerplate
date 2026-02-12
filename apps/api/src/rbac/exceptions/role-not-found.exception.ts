export class RoleNotFoundException extends Error {
  constructor(public readonly roleId: string) {
    super(`Role ${roleId} not found`)
    this.name = 'RoleNotFoundException'
  }
}
