import type { ISettingRepository } from "../../domain/repositories/setting.repository";

const API_KEY_SETTING = "gemini_api_key";

export class SaveApiKeyUseCase {
  constructor(private settingRepo: ISettingRepository) {}

  async execute(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error("API key cannot be empty");
    }
    await this.settingRepo.upsert(API_KEY_SETTING, apiKey.trim());
  }
}
