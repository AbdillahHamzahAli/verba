import express from "express";
import cors from "cors";
import { initializeDatabase, getDatabase } from "./infrastructure/database";
import { DrizzleSettingRepository } from "./infrastructure/database/drizzle-setting.repository";
import { DrizzleDataSourceRepository } from "./infrastructure/database/drizzle-data-source.repository";
import { CryptoService } from "./infrastructure/crypto/crypto.service";
import { CheckSetupStatusUseCase } from "./use-cases/setup/check-setup-status.use-case";
import { SaveApiKeyUseCase } from "./use-cases/setup/save-api-key.use-case";
import { CreateConnectionUseCase } from "./use-cases/connections/create-connection.use-case";
import { ListConnectionsUseCase } from "./use-cases/connections/list-connections.use-case";
import { DeleteConnectionUseCase } from "./use-cases/connections/delete-connection.use-case";
import { createSetupController } from "./adapters/controllers/setup.controller";
import { createConnectionsController } from "./adapters/controllers/connections.controller";

const PORT = process.env.PORT || 3001;

// ─── Bootstrap ───────────────────────────────────────────────
function bootstrap() {
  // 1. Initialize infrastructure
  initializeDatabase();
  const db = getDatabase();

  // 2. Create repositories (Infrastructure)
  const settingRepo = new DrizzleSettingRepository(db);
  const dataSourceRepo = new DrizzleDataSourceRepository(db);
  const cryptoService = new CryptoService();

  // 3. Create use cases
  const checkSetupStatus = new CheckSetupStatusUseCase(settingRepo);
  const saveApiKey = new SaveApiKeyUseCase(settingRepo);
  const createConnection = new CreateConnectionUseCase(
    dataSourceRepo,
    cryptoService,
  );
  const listConnections = new ListConnectionsUseCase(dataSourceRepo);
  const deleteConnection = new DeleteConnectionUseCase(dataSourceRepo);

  // 4. Create Express app & controllers
  const app = express();
  app.use(cors());
  app.use(express.json());

  // 5. Mount routes
  app.use("/api/setup", createSetupController(checkSetupStatus, saveApiKey));
  app.use(
    "/api/connections",
    createConnectionsController(
      createConnection,
      listConnections,
      deleteConnection,
    ),
  );

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
