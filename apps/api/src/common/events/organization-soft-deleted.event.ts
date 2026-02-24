export const ORGANIZATION_SOFT_DELETED = 'organization.soft-deleted' as const

export class OrganizationSoftDeletedEvent {
  constructor(public readonly organizationId: string) {}
}
