export class InvalidCursorError extends Error {
  constructor(message = 'Invalid cursor token') {
    super(message)
    this.name = 'InvalidCursorError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
