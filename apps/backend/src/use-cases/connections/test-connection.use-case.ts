import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";
import type { IConnectionManager } from "../../domain/interfaces/connection-manager.interface";
import type { ICryptoService } from "../../domain/interfaces/crypto.interface";

/**
 * TestConnectionUseCase
 *
 * Tests connectivity to an external database by:
 * 1. Fetching the data source from the internal DB
 * 2. Decrypting the stored password
 * 3. Delegating to ConnectionManager.testConnection()
 */
export class TestConnectionUseCase {
  constructor(
    private readonly dataSourceRepo: IDataSourceRepository,
    private readonly connectionManager: IConnectionManager,
    private readonly cryptoService: ICryptoService,
  ) {}

  async execute(id: number): Promise<{ success: boolean; error?: string }> {
    // 1. Fetch the data source
    const dataSource = await this.dataSourceRepo.findById(id);
    if (!dataSource) {
      return { success: false, error: "Connection not found" };
    }

    // 2. Decrypt the password
    const decryptedDataSource = {
      ...dataSource,
      password: this.cryptoService.decrypt(dataSource.password),
    };

    // 3. Test the connection
    try {
      const success =
        await this.connectionManager.testConnection(decryptedDataSource);
      if (!success) {
        return {
          success: false,
          error: "Unable to connect to the database",
        };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown connection error",
      };
    }
  }
}
