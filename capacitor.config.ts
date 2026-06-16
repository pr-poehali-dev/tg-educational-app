import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.poehali.obdpro',
  appName: 'OBD Диагностика',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    Filesystem: {
      // Разрешаем доступ к внешнему хранилищу Android
    },
    Preferences: {
      group: 'OBDProStorage',
    },
  },
};

export default config;
