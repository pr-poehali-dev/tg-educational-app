import { useState, useEffect, useCallback } from 'react';

// Список всех встроенных протоколов (лежат в public/protocols/)
// При сборке APK они попадают в assets и доступны через fetch('protocols/...')
const PROTOCOL_FILES = [
  'toyota_corolla',
  'volkswagen_golf',
  'audi_a4',
  'bmw_3series',
  'bmw_5series',
  'bmw_x5',
  'mercedes_c_class',
  'hyundai_solaris',
  'hyundai_santa_fe',
  'kia_rio',
  'kia_sorento',
  'nissan_qashqai',
  'nissan_x_trail',
  'renault_duster',
  'ford_focus',
  'mazda_cx5',
  'subaru_forester',
  'mitsubishi_outlander',
  'lada_vesta',
  'haval_jolion',
  'geely_coolray',
  'chery_tiggo',
  'byd_seal',
] as const;

export interface ProtocolEcu {
  id: string;
  name: string;
  address: string;
  response_address?: string;
  protocol: string;
  baudrate?: number;
  note?: string;
  functions: Array<{
    id: string;
    name: string;
    type: 'service' | 'special' | 'adaptation' | 'activation';
    description: string;
    warning?: string;
    service?: string;
    routine_id?: string;
    did?: string;
    note?: string;
    steps?: string[];
    pids?: Array<{ pid: string; name: string; unit: string; formula?: string }>;
  }>;
}

export interface BuiltinProtocol {
  makeId: string;
  modelId: string;
  name: string;
  years?: number[];
  ecus: ProtocolEcu[];
  common_dtc_codes?: Record<string, string>;
  notes?: string[];
}

interface ProtocolIndex {
  [key: string]: BuiltinProtocol; // key: "makeId_modelId"
}

// Кэш загруженных протоколов — не грузить повторно
const protocolCache: ProtocolIndex = {};

export function useBuiltinProtocols() {
  const [protocols, setProtocols] = useState<ProtocolIndex>(protocolCache);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(Object.keys(protocolCache).length > 0);

  // Загрузить все протоколы при первом использовании
  useEffect(() => {
    if (loaded) return;
    loadAllProtocols();
  }, [loaded]);

  const loadAllProtocols = async () => {
    setLoading(true);
    const results: ProtocolIndex = {};

    await Promise.allSettled(
      PROTOCOL_FILES.map(async (filename) => {
        try {
          const res = await fetch(`protocols/${filename}.json`);
          if (!res.ok) return;
          const data: BuiltinProtocol = await res.json();
          const key = `${data.makeId}_${data.modelId}`;
          results[key] = data;
          // Сохраняем в глобальный кэш
          protocolCache[key] = data;
        } catch {
          // Тихо игнорируем ошибки загрузки отдельных файлов
        }
      })
    );

    setProtocols({ ...protocolCache });
    setLoaded(true);
    setLoading(false);
  };

  // Найти протокол для конкретного авто
  const findProtocol = useCallback((makeId: string, modelId: string): BuiltinProtocol | null => {
    // Точное совпадение
    const exactKey = `${makeId}_${modelId}`;
    if (protocols[exactKey]) return protocols[exactKey];

    // Поиск по частичному совпадению makeId
    const byMake = Object.values(protocols).find(p => p.makeId === makeId);
    if (byMake) return byMake;

    return null;
  }, [protocols]);

  // Получить список всех доступных протоколов
  const getAllProtocols = useCallback((): BuiltinProtocol[] => {
    return Object.values(protocols);
  }, [protocols]);

  return {
    protocols,
    loading,
    loaded,
    findProtocol,
    getAllProtocols,
    totalCount: Object.keys(protocols).length,
  };
}
