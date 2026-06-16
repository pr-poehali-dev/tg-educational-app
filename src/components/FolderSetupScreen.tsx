import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface FolderSetupScreenProps {
  onSelect: (path: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const COMMON_PATHS = [
  '/storage/emulated/0/OBDProtocols',
  '/storage/emulated/0/Download/OBDProtocols',
  '/storage/emulated/0/Documents/OBDProtocols',
  '/sdcard/OBDProtocols',
];

export default function FolderSetupScreen({ onSelect, isLoading, error }: FolderSetupScreenProps) {
  const [customPath, setCustomPath] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleSelect = (path: string) => {
    onSelect(path);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Логотип / заголовок */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
          <Icon name="FolderOpen" size={40} className="text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">OBD Диагностика</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Укажи папку на телефоне, где хранятся файлы протоколов (.json)
        </p>
      </div>

      {/* Инструкция */}
      <div className="w-full max-w-sm mb-6 bg-secondary/50 rounded-xl p-4 border border-border">
        <div className="flex gap-2 mb-3">
          <Icon name="Info" size={16} className="text-cyan-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Создай папку <span className="text-foreground font-mono font-medium">OBDProtocols</span> на телефоне
            и положи в неё файлы протоколов в формате JSON.
            Например: <span className="font-mono text-cyan-400">volkswagen_golf.json</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Icon name="FileJson" size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Формат имени файла: <span className="font-mono text-foreground">марка_модель.json</span> или <span className="font-mono text-foreground">марка_модель_год.json</span>
          </p>
        </div>
      </div>

      {/* Быстрые пути */}
      <div className="w-full max-w-sm space-y-2 mb-4">
        <p className="text-xs text-muted-foreground mb-2 px-1">Стандартные расположения:</p>
        {COMMON_PATHS.map(path => (
          <button
            key={path}
            onClick={() => handleSelect(path)}
            disabled={isLoading}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-colors text-left disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Icon name="Folder" size={16} className="text-cyan-400" />
            </div>
            <span className="text-xs font-mono text-foreground break-all">{path}</span>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-auto shrink-0" />
          </button>
        ))}
      </div>

      {/* Свой путь */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors mb-4"
        >
          Указать свой путь к папке
        </button>
      ) : (
        <div className="w-full max-w-sm mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={customPath}
              onChange={e => setCustomPath(e.target.value)}
              placeholder="/storage/emulated/0/МояПапка"
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSelect(customPath)}
              disabled={!customPath.trim() || isLoading}
              className="px-4 py-2.5 bg-cyan-500 text-black rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-cyan-400 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="w-full max-w-sm mt-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex gap-2">
            <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-400 whitespace-pre-line">{error}</p>
          </div>
        </div>
      )}

      {/* Загрузка */}
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="Loader2" size={16} className="animate-spin" />
          Проверяем папку...
        </div>
      )}

      {/* Разрешения */}
      <div className="mt-8 w-full max-w-sm p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <div className="flex gap-2">
          <Icon name="ShieldAlert" size={16} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-400/80">
            При первом запуске Android попросит разрешение на доступ к хранилищу — нажми «Разрешить».
          </p>
        </div>
      </div>
    </div>
  );
}
