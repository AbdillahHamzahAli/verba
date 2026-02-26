import type {
  CreateDataSourceInput,
  DataSource,
  DataSourceSummary,
} from "../entities/data-source.entity";

export interface IDataSourceRepository {
  create(
    input: CreateDataSourceInput & { encryptedPassword: string },
  ): Promise<DataSource>;
  findAll(): Promise<DataSourceSummary[]>;
  findById(id: number): Promise<DataSource | null>;
  delete(id: number): Promise<boolean>;
}
