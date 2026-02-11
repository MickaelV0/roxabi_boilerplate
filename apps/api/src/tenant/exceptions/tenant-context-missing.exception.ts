export class TenantContextMissingException extends Error {
  constructor() {
    super('No tenant context available')
  }
}
