// ── Общие типы базы данных диагностики ───────────────────────────────────────
// Используется всеми файлами в src/data/db/

export interface EcuParam {
  id: string;
  name: string;
  pid?: string;
  unit: string;
  formula?: string;
  min?: number;
  max?: number;
  group: string;
}

export interface EcuFunction {
  id: string;
  name: string;
  type: 'read_dtc' | 'clear_dtc' | 'live_data' | 'service' | 'adaptation' | 'activation' | 'coding';
  description: string;
  protocol_cmd?: string;
  warning?: string;
  params?: EcuParam[];
}

export interface EcuDefinition {
  id: string;
  name: string;
  address: string;
  protocol: string;
  description: string;
  functions: EcuFunction[];
}

export interface ModelDefinition {
  id: string;
  name: string;
  years: number[];
  platform: string;
  ecus: EcuDefinition[];
}

export interface MakeDB {
  id: string;
  name: string;
  region: string;
  protocol_family: string;
  models: ModelDefinition[];
}
