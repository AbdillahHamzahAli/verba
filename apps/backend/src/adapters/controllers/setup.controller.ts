import { Router } from "express";
import type { CheckSetupStatusUseCase } from "../../use-cases/setup/check-setup-status.use-case";
import type { SaveApiKeyUseCase } from "../../use-cases/setup/save-api-key.use-case";
import type { ISettingRepository } from "../../domain/repositories/setting.repository";

const API_KEY_PREFIX = "api_key:";
const ACTIVE_KEY_SETTING = "active_api_key";

export function createSetupController(
  checkSetupStatus: CheckSetupStatusUseCase,
  saveApiKey: SaveApiKeyUseCase,
  settingRepo: ISettingRepository,
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

  // ─── Multi API Key Management ────────────────────

  // GET /api/setup/api-keys — list all stored keys (masked)
  router.get("/api-keys", async (_req, res) => {
    try {
      const keys = await settingRepo.getByPrefix(API_KEY_PREFIX);
      const activeSetting = await settingRepo.getByKey(ACTIVE_KEY_SETTING);
      const activeLabel = activeSetting?.value || null;

      const result = keys.map((k) => {
        const label = k.key.replace(API_KEY_PREFIX, "");
        const val = k.value;
        const masked =
          val.length > 12 ? `${val.slice(0, 8)}...${val.slice(-4)}` : "***";
        return {
          label,
          masked,
          length: val.length,
          active: label === activeLabel,
          createdAt: k.createdAt,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("Error listing API keys:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POST /api/setup/api-keys — add a new key with label
  router.post("/api-keys", async (req, res) => {
    try {
      const { label, apiKey } = req.body;
      if (!label || !apiKey) {
        res.status(400).json({ error: "label and apiKey are required" });
        return;
      }

      const settingKey = `${API_KEY_PREFIX}${label.trim()}`;
      await settingRepo.upsert(settingKey, apiKey.trim());

      // Also save as gemini_api_key for backward compat
      await settingRepo.upsert("gemini_api_key", apiKey.trim());

      // If no active key set, make this one active
      const activeSetting = await settingRepo.getByKey(ACTIVE_KEY_SETTING);
      if (!activeSetting) {
        await settingRepo.upsert(ACTIVE_KEY_SETTING, label.trim());
      }

      res.status(201).json({ success: true, message: "API key added" });
    } catch (error) {
      console.error("Error adding API key:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PUT /api/setup/api-keys/:label/activate — set active key
  router.put("/api-keys/:label/activate", async (req, res) => {
    try {
      const { label } = req.params;
      const settingKey = `${API_KEY_PREFIX}${label}`;
      const keySetting = await settingRepo.getByKey(settingKey);

      if (!keySetting) {
        res.status(404).json({ error: "API key not found" });
        return;
      }

      await settingRepo.upsert(ACTIVE_KEY_SETTING, label);
      // Also update gemini_api_key for backward compat
      await settingRepo.upsert("gemini_api_key", keySetting.value);

      res.json({ success: true, message: `API key "${label}" activated` });
    } catch (error) {
      console.error("Error activating API key:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DELETE /api/setup/api-keys/:label — delete a key
  router.delete("/api-keys/:label", async (req, res) => {
    try {
      const { label } = req.params;
      const settingKey = `${API_KEY_PREFIX}${label}`;
      const deleted = await settingRepo.delete(settingKey);

      if (!deleted) {
        res.status(404).json({ error: "API key not found" });
        return;
      }

      // If this was the active key, clear active
      const activeSetting = await settingRepo.getByKey(ACTIVE_KEY_SETTING);
      if (activeSetting?.value === label) {
        await settingRepo.delete(ACTIVE_KEY_SETTING);
        // Try to set another key as active
        const remaining = await settingRepo.getByPrefix(API_KEY_PREFIX);
        if (remaining.length > 0) {
          const newLabel = remaining[0]!.key.replace(API_KEY_PREFIX, "");
          await settingRepo.upsert(ACTIVE_KEY_SETTING, newLabel);
          await settingRepo.upsert("gemini_api_key", remaining[0]!.value);
        }
      }

      res.json({ success: true, message: "API key deleted" });
    } catch (error) {
      console.error("Error deleting API key:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ─── Legacy endpoint (backward compat) ───────────

  // POST /api/setup/api-key — save API key (old way, still works)
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
