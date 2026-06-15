// ── Ленивый загрузчик баз данных автомобилей ─────────────────────────────────
// Файлы загружаются только когда нужны (code splitting через dynamic import)
// Структура: make → model → ecu → functions

import type { MakeDB, ModelDefinition, EcuDefinition, EcuFunction, EcuParam } from '@/data/db/types';

export type { MakeDB, ModelDefinition, EcuDefinition, EcuFunction, EcuParam };

// Карта: make_id → () => Promise<MakeDB>
const DB_LOADERS: Record<string, () => Promise<{ default: MakeDB }>> = {
  vw:           () => import('@/data/db/vw'),
  audi:         () => import('@/data/db/audi'),
  bmw:          () => import('@/data/db/bmw'),
  mercedes:     () => import('@/data/db/mercedes'),
  toyota:       () => import('@/data/db/toyota'),
};

// Кэш загруженных баз
const cache: Record<string, MakeDB> = {};

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Загрузить базу для марки (ленивая загрузка с кэшем)
 */
export async function loadMakeDB(makeId: string): Promise<MakeDB | null> {
  if (cache[makeId]) return cache[makeId];
  const loader = DB_LOADERS[makeId];
  if (!loader) return null;
  try {
    const mod = await loader();
    cache[makeId] = mod.default;
    return mod.default;
  } catch (e) {
    console.error(`[dbLoader] Failed to load DB for ${makeId}:`, e);
    return null;
  }
}

/**
 * Найти модель в уже загруженной базе
 */
export function findModel(db: MakeDB, modelId: string): ModelDefinition | null {
  return db.models.find(m => m.id === modelId) ?? null;
}

/**
 * Найти блок управления для модели
 */
export function findEcu(model: ModelDefinition, ecuId: string): EcuDefinition | null {
  return model.ecus.find(e => e.id === ecuId) ?? null;
}

/**
 * Найти функцию внутри блока
 */
export function findFunction(ecu: EcuDefinition, fnId: string): EcuFunction | null {
  return ecu.functions.find(f => f.id === fnId) ?? null;
}

/**
 * Есть ли база для данной марки
 */
export function hasDB(makeId: string): boolean {
  return makeId in DB_LOADERS;
}

/**
 * Список марок с полными базами
 */
export const MAKES_WITH_DB = Object.keys(DB_LOADERS);

/**
 * Получить live-параметры для конкретного блока и функции live_data
 */
export function getLiveParams(ecu: EcuDefinition): EcuParam[] {
  const liveDataFn = ecu.functions.find(f => f.type === 'live_data');
  return liveDataFn?.params ?? [];
}
