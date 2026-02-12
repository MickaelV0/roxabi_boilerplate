export class DefaultRoleException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DefaultRoleException'
  }
}
