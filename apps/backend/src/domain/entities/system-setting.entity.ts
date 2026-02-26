// Domain Entity: SystemSetting
// Pure TypeScript — no framework dependency

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}
