import { Router } from "express";
import type { CheckSetupStatusUseCase } from "../../use-cases/setup/check-setup-status.use-case";
import type { SaveApiKeyUseCase } from "../../use-cases/setup/save-api-key.use-case";

export function createSetupController(
  checkSetupStatus: CheckSetupStatusUseCase,
  saveApiKey: SaveApiKeyUseCase,
): Router {
  const router = Router();

  // GET /api/setup/status
  router.get("/status", async (_req, res) => {
    try {
      const result = await checkSetupStatus.execute();
      res.json(result);
    } catch (error) {
      console.error("Error checking setup status:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/setup/api-key
  router.post("/api-key", async (req, res) => {
    try {
      const { apiKey } = req.body;
      await saveApiKey.execute(apiKey);
      res.json({ success: true, message: "API key saved successfully" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(400).json({ error: message });
    }
  });

  return router;
}
