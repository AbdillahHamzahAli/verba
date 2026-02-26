import express from "express";
import cors from "cors";
import { initializeDatabase, getDatabase } from "./infrastructure/database";
import { DrizzleSettingRepository } from "./infrastructure/database/drizzle-setting.repository";
import { DrizzleDataSourceRepository } from "./infrastructure/database/drizzle-data-source.repository";
import { CryptoService } from "./infrastructure/crypto/crypto.service";
import { ConnectionManager } from "./infrastructure/typeorm/connection-manager";
import { SchemaIntrospector } from "./infrastructure/typeorm/schema-introspector";
import { LangGraphAgent } from "./infrastructure/ai/agent";
import { CheckSetupStatusUseCase } from "./use-cases/setup/check-setup-status.use-case";
import { SaveApiKeyUseCase } from "./use-cases/setup/save-api-key.use-case";
import { CreateConnectionUseCase } from "./use-cases/connections/create-connection.use-case";
import { ListConnectionsUseCase } from "./use-cases/connections/list-connections.use-case";
import { DeleteConnectionUseCase } from "./use-cases/connections/delete-connection.use-case";
import { TestConnectionUseCase } from "./use-cases/connections/test-connection.use-case";
import { AskQuestionUseCase } from "./use-cases/chat/ask-question.use-case";
import { createSetupController } from "./adapters/controllers/setup.controller";
import { createConnectionsController } from "./adapters/controllers/connections.controller";
import { createChatController } from "./adapters/controllers/chat.controller";

const PORT = process.env.PORT || 3001;

// ─── Bootstrap ───────────────────────────────────────────────
function bootstrap() {
  // 1. Initialize infrastructure
  initializeDatabase();
  const db = getDatabase();

  // 2. Create repositories & services (Infrastructure)
  const settingRepo = new DrizzleSettingRepository(db);
  const dataSourceRepo = new DrizzleDataSourceRepository(db);
  const cryptoService = new CryptoService();
  const connectionManager = new ConnectionManager();
  const schemaIntrospector = new SchemaIntrospector();

  // 3. Create use cases
  const checkSetupStatus = new CheckSetupStatusUseCase(settingRepo);
  const saveApiKey = new SaveApiKeyUseCase(settingRepo);
  const createConnection = new CreateConnectionUseCase(
    dataSourceRepo,
    cryptoService,
  );
  const listConnections = new ListConnectionsUseCase(dataSourceRepo);
  const deleteConnection = new DeleteConnectionUseCase(dataSourceRepo);
  const testConnection = new TestConnectionUseCase(
    dataSourceRepo,
    connectionManager,
    cryptoService,
  );
  const askQuestion = new AskQuestionUseCase(
    dataSourceRepo,
    connectionManager,
    schemaIntrospector,
    cryptoService,
    settingRepo,
    (apiKey) => new LangGraphAgent(apiKey),
  );

  // 4. Create Express app & controllers
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Request/Response logger
  app.use((req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    res.on("finish", () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color =
        status >= 500
          ? "\x1b[31m" // red
          : status >= 400
            ? "\x1b[33m" // yellow
            : status >= 300
              ? "\x1b[36m" // cyan
              : "\x1b[32m"; // green
      const reset = "\x1b[0m";

      console.log(`${color}${method} ${url} ${status}${reset} ${duration}ms`);
    });

    next();
  });

  // 5. Mount routes
  app.use(
    "/api/setup",
    createSetupController(checkSetupStatus, saveApiKey, settingRepo),
  );
  app.use(
    "/api/connections",
    createConnectionsController(
      createConnection,
      listConnections,
      deleteConnection,
      testConnection,
    ),
  );
  app.use("/api/chat", createChatController(askQuestion));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 6. Start server
  app.listen(PORT, () => {
    console.log(`🚀 Verba backend running at http://localhost:${PORT}`);
  });
}

bootstrap();
