import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { DRIZZLE, type DrizzleDB } from '../database/drizzle.provider.js'
import { users } from '../database/schema/auth.schema.js'

const profileColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: users.emailVerified,
  image: users.image,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
}

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getProfile(userId: string) {
    const [user] = await this.db
      .select(profileColumns)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    return user ?? null
  }

  async updateProfile(userId: string, data: { name?: string; image?: string }) {
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning(profileColumns)
    return updated ?? null
  }
}
