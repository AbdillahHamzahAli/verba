import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";
import type { DataSourceSummary } from "../../domain/entities/data-source.entity";

export class ListConnectionsUseCase {
  constructor(private dataSourceRepo: IDataSourceRepository) {}

  async execute(): Promise<DataSourceSummary[]> {
    return this.dataSourceRepo.findAll();
  }
}
