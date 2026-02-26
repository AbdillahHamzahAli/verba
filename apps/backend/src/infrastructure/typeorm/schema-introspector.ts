import { DataSource as TypeOrmDataSource } from "typeorm";
import type { DataSource } from "../../domain/entities/data-source.entity";
import type { ISchemaIntrospector } from "../../domain/interfaces/schema-introspector.interface";

interface ColumnInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

/**
 * SchemaIntrospector — introspects the schema of an external database
 * and returns a human-readable description for the AI agent.
 */
export class SchemaIntrospector implements ISchemaIntrospector {
  /**
   * Returns a formatted schema description suitable for LLM context.
   * Groups columns by table and includes type/nullability info.
   */
  async getSchemaDescription(dataSource: DataSource): Promise<string> {
    const connection = this.createTypeOrmDataSource(dataSource);
    try {
      await connection.initialize();

      const columns = await this.getColumns(connection, dataSource);

      if (columns.length === 0) {
        return "No tables found in the database.";
      }

      // Group columns by table name
      const tables = new Map<string, ColumnInfo[]>();
      for (const col of columns) {
        const existing = tables.get(col.table_name) ?? [];
        existing.push(col);
        tables.set(col.table_name, existing);
      }

      // Format as structured text
      const parts: string[] = [
        `Database: ${dataSource.database} (${dataSource.type})`,
        `Tables: ${tables.size}`,
        "",
      ];

      for (const [tableName, cols] of tables) {
        parts.push(`Table: ${tableName}`);
        parts.push("Columns:");
        for (const col of cols) {
          const nullable = col.is_nullable === "YES" ? "NULL" : "NOT NULL";
          const defaultVal = col.column_default
            ? ` DEFAULT ${col.column_default}`
            : "";
          parts.push(
            `  - ${col.column_name} ${col.data_type} ${nullable}${defaultVal}`,
          );
        }
        parts.push("");
      }

      return parts.join("\n");
    } finally {
      if (connection.isInitialized) {
        await connection.destroy();
      }
    }
  }

  /**
   * Query the information_schema for column metadata.
   * Works for both PostgreSQL and MySQL.
   */
  private async getColumns(
    connection: TypeOrmDataSource,
    dataSource: DataSource,
  ): Promise<ColumnInfo[]> {
    if (dataSource.type === "postgres") {
      return connection.query(`
        SELECT table_name, column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
      `);
    }

    // MySQL
    return connection.query(
      `
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = ?
      ORDER BY table_name, ordinal_position
    `,
      [dataSource.database],
    );
  }

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
    });
  }
}
