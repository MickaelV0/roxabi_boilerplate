export class DatabaseUnavailableException extends Error {
  constructor() {
    super('Database not available')
  }
}
