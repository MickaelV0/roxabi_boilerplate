export class OwnershipConstraintException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OwnershipConstraintException'
  }
}
