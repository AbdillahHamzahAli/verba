import { eq, like } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { ISettingRepository } from "../../domain/repositories/setting.repository";
import type { SystemSetting } from "../../domain/entities/system-setting.entity";
import { systemSettings } from "./schema";
import type * as schema from "./schema";

export class DrizzleSettingRepository implements ISettingRepository {
  constructor(private db: BunSQLiteDatabase<typeof schema>) {}

  async getByKey(key: string): Promise<SystemSetting | null> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async getByPrefix(prefix: string): Promise<SystemSetting[]> {
    const rows = await this.db
      .select()
      .from(systemSettings)
      .where(like(systemSettings.key, `${prefix}%`));

    return rows.map((row) => ({
      id: row.id,
      key: row.key,
      value: row.value,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async upsert(key: string, value: string): Promise<void> {
    await this.db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value },
      });
  }

  async delete(key: string): Promise<boolean> {
    const existing = await this.getByKey(key);
    if (!existing) return false;
    await this.db.delete(systemSettings).where(eq(systemSettings.key, key));
    return true;
  }
}
