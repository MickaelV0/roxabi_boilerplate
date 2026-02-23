export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.banned'
  | 'user.unbanned'
  | 'user.deleted'
  | 'user.restored'
  | 'user.role_changed'
  | 'member.invited'
  | 'member.role_changed'
  | 'member.removed'
  | 'invitation.revoked'
  | 'org.created'
  | 'org.updated'
  | 'org.deleted'
  | 'org.restored'
  | 'org.parent_changed'
  | 'settings.updated'
  | 'flag.created'
  | 'flag.toggled'
  | 'flag.deleted'
  | 'impersonation.started'
  | 'impersonation.ended'

export type AuditActorType = 'user' | 'system' | 'impersonation'

export interface AuditLogEntry {
  id: string
  timestamp: Date
  actorId: string
  actorType: AuditActorType
  impersonatorId: string | null
  organizationId: string | null
  action: AuditAction
  resource: string
  resourceId: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
}
