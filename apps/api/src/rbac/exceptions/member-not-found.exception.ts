export class MemberNotFoundException extends Error {
  constructor(memberId: string) {
    super(`Member "${memberId}" not found`)
    this.name = 'MemberNotFoundException'
  }
}
