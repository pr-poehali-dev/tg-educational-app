import { useState, useEffect, useCallback } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

const FOLDER_PATH_KEY = 'protocol_folder_path';

export interface ProtocolFile {
  name: string;
  path: string;
  makeId?: string;
  modelId?: string;
}

export interface ProtocolData {
  makeId: string;
  modelId: string;
  year?: number;
  ecus: Array<{
    id: string;
    name: string;
    address: string;
    protocol: string;
    functions: Array<{
      id: string;
      name: string;
      type: 'service' | 'special' | 'adaptation' | 'activation';
      description: string;
      warning?: string;
    }>;
  }>;
}

export function useProtocolFolder() {
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<ProtocolFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  // Сканирование папки
  const scanFolder = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await Filesystem.readdir({
        path,
        directory: Directory.ExternalStorage,
      });
      const jsonFiles = result.files
        .filter(f => f.name.endsWith('.json'))
        .map(f => ({ name: f.name, path: `${path}/${f.name}`, ...parseFileName(f.name) }));
      setFiles(jsonFiles);
    } catch {
      try {
        const result = await Filesystem.readdir({
          path,
          directory: Directory.Documents,
        });
        const jsonFiles = result.files
          .filter(f => f.name.endsWith('.json'))
          .map(f => ({ name: f.name, path: `${path}/${f.name}`, ...parseFileName(f.name) }));
        setFiles(jsonFiles);
      } catch {
        setError('Не удалось прочитать папку. Проверь права доступа к хранилищу.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Проверяем при старте сохранённую папку
  useEffect(() => {
    const checkSaved = async () => {
      try {
        const { value } = await Preferences.get({ key: FOLDER_PATH_KEY });
        if (value) {
          setFolderPath(value);
          setIsFirstLaunch(false);
          await scanFolder(value);
        } else {
          setIsFirstLaunch(true);
        }
      } catch {
        setIsFirstLaunch(true);
      }
    };
    checkSaved();
  }, [scanFolder]);

  // Выбор/подтверждение папки
  const selectFolder = useCallback(async (customPath?: string) => {
    const path = customPath || '/storage/emulated/0/OBDProtocols';
    setIsLoading(true);
    setError(null);
    try {
      await Filesystem.readdir({ path, directory: Directory.ExternalStorage });
      await Preferences.set({ key: FOLDER_PATH_KEY, value: path });
      setFolderPath(path);
      setIsFirstLaunch(false);
      await scanFolder(path);
      return true;
    } catch {
      setError(`Папка не найдена: ${path}\nУбедись что папка существует и приложение имеет разрешение на хранилище.`);
      setIsLoading(false);
      return false;
    }
  }, [scanFolder]);

  // Чтение файла протокола
  const readProtocol = useCallback(async (filePath: string): Promise<ProtocolData | null> => {
    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.ExternalStorage,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(result.data as string) as ProtocolData;
    } catch {
      try {
        const result = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        return JSON.parse(result.data as string) as ProtocolData;
      } catch {
        return null;
      }
    }
  }, []);

  // Поиск протокола для конкретного авто
  const findProtocol = useCallback(async (makeId: string, modelId: string, year?: number): Promise<ProtocolData | null> => {
    const candidates = files.filter(f => {
      const n = f.name.toLowerCase();
      return (n.includes(makeId.toLowerCase()) || f.makeId === makeId) &&
             (n.includes(modelId.toLowerCase()) || f.modelId === modelId);
    });

    if (year && candidates.length > 1) {
      const withYear = candidates.find(f => f.name.includes(String(year)));
      if (withYear) return readProtocol(withYear.path);
    }

    return candidates.length > 0 ? readProtocol(candidates[0].path) : null;
  }, [files, readProtocol]);

  // Сброс папки
  const resetFolder = useCallback(async () => {
    await Preferences.remove({ key: FOLDER_PATH_KEY });
    setFolderPath(null);
    setFiles([]);
    setIsFirstLaunch(true);
  }, []);

  return {
    folderPath,
    files,
    isLoading,
    error,
    isFirstLaunch,
    selectFolder,
    readProtocol,
    findProtocol,
    resetFolder,
    refreshFiles: () => folderPath ? scanFolder(folderPath) : Promise.resolve(),
  };
}

function parseFileName(name: string): { makeId?: string; modelId?: string } {
  const parts = name.replace('.json', '').toLowerCase().split(/[_\-\s]+/);
  return parts.length >= 2 ? { makeId: parts[0], modelId: parts[1] } : {};
}
