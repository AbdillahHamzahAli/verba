import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";
import type {
  CreateDataSourceInput,
  DataSource,
  DataSourceSummary,
} from "../../domain/entities/data-source.entity";
import { dataSources } from "./schema";
import type * as schema from "./schema";

export class DrizzleDataSourceRepository implements IDataSourceRepository {
  constructor(private db: BunSQLiteDatabase<typeof schema>) {}

  async create(
    input: CreateDataSourceInput & { encryptedPassword: string },
  ): Promise<DataSource> {
    const rows = await this.db
      .insert(dataSources)
      .values({
        name: input.name,
        type: input.type,
        host: input.host,
        port: input.port,
        database: input.database,
        username: input.username,
        encryptedPassword: input.encryptedPassword,
      })
      .returning();

    const row = rows[0]!;
    return this.mapToEntity(row, input.password);
  }

  async findAll(): Promise<DataSourceSummary[]> {
    const rows = await this.db.select().from(dataSources);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type as DataSource["type"],
      host: row.host,
      port: row.port,
      database: row.database,
      username: row.username,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  async findById(id: number): Promise<DataSource | null> {
    const rows = await this.db
      .select()
      .from(dataSources)
      .where(eq(dataSources.id, id))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0]!;
    // Return with encrypted password — decryption happens in use case layer
    return {
      id: row.id,
      name: row.name,
      type: row.type as DataSource["type"],
      host: row.host,
      port: row.port,
      database: row.database,
      username: row.username,
      password: row.encryptedPassword, // Still encrypted at this point
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .delete(dataSources)
      .where(eq(dataSources.id, id))
      .returning();

    return result.length > 0;
  }

  private mapToEntity(
    row: typeof dataSources.$inferSelect,
    decryptedPassword: string,
  ): DataSource {
    return {
      id: row.id,
      name: row.name,
      type: row.type as DataSource["type"],
      host: row.host,
      port: row.port,
      database: row.database,
      username: row.username,
      password: decryptedPassword,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}
