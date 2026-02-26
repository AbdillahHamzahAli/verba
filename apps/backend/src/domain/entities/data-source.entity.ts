// Domain Entity: DataSource
// Pure TypeScript — no framework dependency

export type DatabaseType = "postgres" | "mysql";

export interface DataSource {
  id: number;
  name: string;
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string; // Decrypted in-memory only
  createdAt: Date;
  updatedAt: Date;
}

// Used when creating a new data source (without id and timestamps)
export type CreateDataSourceInput = Omit<
  DataSource,
  "id" | "createdAt" | "updatedAt"
>;

// Used for listing — password is always omitted
export type DataSourceSummary = Omit<DataSource, "password">;
