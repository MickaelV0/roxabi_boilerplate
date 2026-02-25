export const ORGANIZATION_CREATED = 'organization.created' as const

export class OrganizationCreatedEvent {
  constructor(
    public readonly organizationId: string,
    public readonly creatorUserId: string
  ) {}
}
