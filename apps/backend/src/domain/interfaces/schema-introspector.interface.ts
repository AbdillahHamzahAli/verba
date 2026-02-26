import type { DataSource } from "../entities/data-source.entity";

export interface ISchemaIntrospector {
  getSchemaDescription(dataSource: DataSource): Promise<string>;
}
