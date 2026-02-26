import type { ISettingRepository } from "../../domain/repositories/setting.repository";

const API_KEY_SETTING = "gemini_api_key";

export class CheckSetupStatusUseCase {
  constructor(private settingRepo: ISettingRepository) {}

  async execute(): Promise<{ configured: boolean }> {
    const setting = await this.settingRepo.getByKey(API_KEY_SETTING);
    return { configured: setting !== null && setting.value.length > 0 };
  }
}
