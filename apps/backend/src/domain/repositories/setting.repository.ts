import type { SystemSetting } from "../entities/system-setting.entity";

export interface ISettingRepository {
  getByKey(key: string): Promise<SystemSetting | null>;
  getByPrefix(prefix: string): Promise<SystemSetting[]>;
  upsert(key: string, value: string): Promise<void>;
  delete(key: string): Promise<boolean>;
}
