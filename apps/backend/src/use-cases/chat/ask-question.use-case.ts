import type { IDataSourceRepository } from "../../domain/repositories/data-source.repository";
import type { IConnectionManager } from "../../domain/interfaces/connection-manager.interface";
import type { ISchemaIntrospector } from "../../domain/interfaces/schema-introspector.interface";
import type { ICryptoService } from "../../domain/interfaces/crypto.interface";
import type {
  IAIAgent,
  AgentEvent,
} from "../../domain/interfaces/ai-agent.interface";
import type { ISettingRepository } from "../../domain/repositories/setting.repository";

/**
 * AskQuestionUseCase
 *
 * Orchestrates the AI question-answering flow:
 * 1. Fetch the data source and decrypt password
 * 2. Introspect the target database schema
 * 3. Create the AI agent with the API key
 * 4. Stream the agent's response
 */
export class AskQuestionUseCase {
  constructor(
    private readonly dataSourceRepo: IDataSourceRepository,
    private readonly connectionManager: IConnectionManager,
    private readonly schemaIntrospector: ISchemaIntrospector,
    private readonly cryptoService: ICryptoService,
    private readonly settingRepo: ISettingRepository,
    private readonly createAgent: (apiKey: string) => IAIAgent,
  ) {}

  async *execute(
    connectionId: number,
    question: string,
  ): AsyncGenerator<AgentEvent> {
    // 1. Fetch the data source
    const dataSource = await this.dataSourceRepo.findById(connectionId);
    if (!dataSource) {
      yield { type: "error", content: "Connection not found" };
      return;
    }

    // 2. Decrypt the password
    const decryptedDs = {
      ...dataSource,
      password: this.cryptoService.decrypt(dataSource.password),
    };

    // 3. Get the API key
    const apiKeySetting = await this.settingRepo.getByKey("gemini_api_key");
    if (!apiKeySetting) {
      yield {
        type: "error",
        content: "API key not configured. Please set up your Gemini API key.",
      };
      return;
    }
    const apiKey = apiKeySetting.value;

    // 4. Introspect the schema
    let schemaContext: string;
    try {
      schemaContext =
        await this.schemaIntrospector.getSchemaDescription(decryptedDs);
    } catch (err) {
      yield {
        type: "error",
        content: `Failed to introspect schema: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
      return;
    }

    // 5. Create the bound SQL executor for this connection
    const executeSql = async (
      sql: string,
    ): Promise<Record<string, unknown>[]> => {
      return this.connectionManager.execute(decryptedDs, sql);
    };

    // 6. Create the agent and stream
    const agent = this.createAgent(apiKey);
    try {
      for await (const event of agent.stream(
        question,
        schemaContext,
        executeSql,
      )) {
        yield event;
      }
    } catch (err) {
      yield {
        type: "error",
        content: `Agent error: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }
}
