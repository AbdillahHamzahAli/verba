import { DataSource as TypeOrmDataSource } from "typeorm";
import type { DataSource } from "../../domain/entities/data-source.entity";
import type { IConnectionManager } from "../../domain/interfaces/connection-manager.interface";

/**
 * ConnectionManager — manages dynamic TypeORM connections to external databases.
 * Each connection is ephemeral: created on demand, used, and destroyed.
 */
export class ConnectionManager implements IConnectionManager {
  /**
   * Test if a connection to the given data source is valid.
   */
  async testConnection(dataSource: DataSource): Promise<boolean> {
    const connection = this.createTypeOrmDataSource(dataSource);
    try {
      await connection.initialize();
      await connection.query("SELECT 1");
      return true;
    } catch {
      return false;
    } finally {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
  }

  /**
   * Execute a raw SQL query against the given data source.
   * Creates a temporary connection, runs the query, and destroys it.
   */
  async execute(
    dataSource: DataSource,
    sql: string,
  ): Promise<Record<string, unknown>[]> {
    const connection = this.createTypeOrmDataSource(dataSource);
    try {
      await connection.initialize();
      const result = await connection.query(sql);
      return result as Record<string, unknown>[];
    } finally {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
  }

  /**
   * Build a TypeORM DataSource config from our domain entity.
   */
  private createTypeOrmDataSource(ds: DataSource): TypeOrmDataSource {
    return new TypeOrmDataSource({
      type: ds.type === "postgres" ? "postgres" : "mysql",
      host: ds.host,
      port: ds.port,
      database: ds.database,
      username: ds.username,
      password: ds.password,
      synchronize: false,
      logging: false,
      // Connection pool settings — keep small since connections are short-lived
      extra: {
        max: 2,
        idleTimeoutMillis: 5000,
      },
    });
  }
}
