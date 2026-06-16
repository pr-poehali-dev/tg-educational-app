# Сборка Android APK

## Требования
- Node.js 18+
- Java JDK 17+
- Android Studio (для эмулятора или USB-отладки)
- Android SDK (устанавливается вместе с Android Studio)

## Шаги сборки

### 1. Инициализация (один раз)
```bash
npx cap add android
```

### 2. Сборка и синхронизация
```bash
bun run build
npx cap sync android
```

### 3. Открыть в Android Studio
```bash
npx cap open android
```

В Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### 4. Или запустить напрямую на устройстве (USB-отладка)
```bash
npx cap run android
```

---

## Права доступа (уже настроены)

В `android/app/src/main/AndroidManifest.xml` должны быть:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
```

После `cap add android` добавь эти строки в AndroidManifest.xml вручную.

---

## Структура папки протоколов на телефоне

```
/storage/emulated/0/OBDProtocols/
├── volkswagen_golf.json
├── volkswagen_polo.json
├── audi_a4_2019.json
├── toyota_camry.json
└── bmw_3series_2021.json
```

### Формат файла протокола (.json)

```json
{
  "makeId": "volkswagen",
  "modelId": "golf",
  "year": 2020,
  "ecus": [
    {
      "id": "engine",
      "name": "Блок управления двигателем (ECM)",
      "address": "0x01",
      "protocol": "KWP2000/CAN",
      "functions": [
        {
          "id": "dtc_read",
          "name": "Чтение кодов DTC",
          "type": "special",
          "description": "Считать все сохранённые коды неисправностей"
        },
        {
          "id": "oil_reset",
          "name": "Сброс масла",
          "type": "service",
          "description": "Сброс счётчика замены масла",
          "warning": "Только после замены масла"
        }
      ]
    }
  ]
}
```

### Типы функций
- `special` — диагностические (DTC, поток данных)
- `service` — сервисные (сброс масла, ТО)
- `adaptation` — адаптации (дроссель, форсунки)
- `activation` — активации (тест актуаторов)
