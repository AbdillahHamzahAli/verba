import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";
import type { ICryptoService } from "../../domain/interfaces/crypto.interface";
import type {
  CreateDataSourceInput,
  DataSource,
} from "../../domain/entities/data-source.entity";

export class CreateConnectionUseCase {
  constructor(
    private dataSourceRepo: IDataSourceRepository,
    private cryptoService: ICryptoService,
  ) {}

  async execute(input: CreateDataSourceInput): Promise<DataSource> {
    // Encrypt the password before storing
    const encryptedPassword = this.cryptoService.encrypt(input.password);

    return this.dataSourceRepo.create({
      ...input,
      encryptedPassword,
    });
  }
}
