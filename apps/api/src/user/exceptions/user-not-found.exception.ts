// Domain exception — pure TypeScript, no NestJS imports (per backend-patterns §1.3)
export class UserNotFoundException extends Error {
  constructor(public readonly userId: string) {
    super(`User ${userId} not found`)
    this.name = 'UserNotFoundException'
  }
}
