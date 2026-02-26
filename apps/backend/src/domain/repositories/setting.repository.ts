import type { SystemSetting } from "../entities/system-setting.entity";

export interface ISettingRepository {
  getByKey(key: string): Promise<SystemSetting | null>;
  upsert(key: string, value: string): Promise<void>;
}
