import type { DataSource } from "../entities/data-source.entity";

export interface IConnectionManager {
  testConnection(dataSource: DataSource): Promise<boolean>;
  execute(
    dataSource: DataSource,
    sql: string,
  ): Promise<Record<string, unknown>[]>;
}
