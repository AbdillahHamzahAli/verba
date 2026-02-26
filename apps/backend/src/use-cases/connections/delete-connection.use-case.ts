import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";

export class DeleteConnectionUseCase {
  constructor(private dataSourceRepo: IDataSourceRepository) {}

  async execute(id: number): Promise<boolean> {
    return this.dataSourceRepo.delete(id);
  }
}
