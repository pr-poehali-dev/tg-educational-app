// ── База данных автомобилей ───────────────────────────────────────────────────
// Структура: Регион → Марка → Модели → Годы → Блоки управления → Функции

export interface EcuFunction {
  id: string;
  name: string;
  type: 'service' | 'special' | 'adaptation' | 'activation';
  description: string;
  warning?: string;
}

export interface EcuBlock {
  id: string;
  name: string;
  address: string; // OBD адрес / протокол
  protocol: string;
  functions: EcuFunction[];
}

export interface VehicleModel {
  id: string;
  name: string;
  years: number[];
  ecus: EcuBlock[];
}

export interface VehicleMake {
  id: string;
  name: string;
  logo: string; // эмодзи или аббревиатура
  region: string;
  models: VehicleModel[];
}

// ── Блоки управления (общие шаблоны) ─────────────────────────────────────────

const VAG_ENGINE_ECU = (addr = '0x01'): EcuBlock => ({
  id: 'engine', name: 'Блок управления двигателем (ECM)', address: addr, protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',          type: 'special',    description: 'Считать все сохранённые коды неисправностей' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',         type: 'special',    description: 'Очистить память ошибок блока управления', warning: 'Ошибки будут удалены безвозвратно' },
    { id: 'live_data',   name: 'Поток данных',               type: 'special',    description: 'Параметры двигателя в реальном времени' },
    { id: 'inj_test',   name: 'Тест форсунок',              type: 'activation', description: 'Активация форсунок по одной для диагностики' },
    { id: 'throttle_adapt', name: 'Адаптация дроссельной заслонки', type: 'adaptation', description: 'Сброс и повторная адаптация дросселя', warning: 'Двигатель должен быть прогрет' },
    { id: 'idle_adapt',  name: 'Адаптация холостого хода',  type: 'adaptation', description: 'Обучение оборотов холостого хода' },
    { id: 'lambda_test', name: 'Тест лямбда-зонда',          type: 'activation', description: 'Проверка работы датчиков O2' },
    { id: 'egr_test',    name: 'Тест клапана EGR',           type: 'activation', description: 'Активация и проверка клапана EGR' },
  ],
});

const VAG_TRANSMISSION_ECU = (): EcuBlock => ({
  id: 'transmission', name: 'Блок управления АКПП/DSG (TCM)', address: '0x02', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special', description: 'Ошибки трансмиссии' },
    { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special', description: 'Очистка ошибок трансмиссии', warning: 'Будут удалены все коды' },
    { id: 'live_data', name: 'Поток данных',        type: 'special', description: 'Температура масла, передача, обороты' },
    { id: 'dsg_basic', name: 'Базовая настройка DSG', type: 'adaptation', description: 'Инициализация точек зацепления сцепления DSG', warning: 'Только для роботизированных КПП DSG/S-Tronic' },
    { id: 'oil_reset', name: 'Сброс счётчика масла АКПП', type: 'service', description: 'Обнуление интервала замены масла в АКПП' },
    { id: 'selector_adapt', name: 'Адаптация селектора', type: 'adaptation', description: 'Обучение положений рычага АКПП' },
  ],
});

const VAG_ABS_ECU = (): EcuBlock => ({
  id: 'abs', name: 'Блок ABS / ESP / ESC', address: '0x03', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',     type: 'special',    description: 'Ошибки системы ABS/ESP' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',    type: 'special',    description: 'Очистка ошибок ABS/ESP', warning: 'Убедитесь в устранении неисправности' },
    { id: 'live_data',   name: 'Поток данных',          type: 'special',    description: 'Скорость колёс, датчик ускорения' },
    { id: 'abs_bleed',   name: 'Прокачка тормозов ABS', type: 'activation', description: 'Активация насоса ABS для удаления воздуха', warning: 'Нужен помощник для прокачки' },
    { id: 'steer_adapt', name: 'Адаптация датчика угла руля', type: 'adaptation', description: 'Калибровка датчика рулевого угла (SAS)', warning: 'Установить руль ровно по центру' },
    { id: 'brake_pads',  name: 'Сброс счётчика тормозных колодок', type: 'service', description: 'Обнуление ресурса тормозных колодок' },
    { id: 'esp_calib',   name: 'Калибровка датчика ускорения G', type: 'adaptation', description: 'Обнуление нулевого положения датчика G-sensor', warning: 'Автомобиль должен стоять на ровной поверхности' },
  ],
});

const VAG_AIRBAG_ECU = (): EcuBlock => ({
  id: 'airbag', name: 'Модуль SRS / Airbag', address: '0x15', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки системы SRS' },
    { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка ошибок SRS', warning: '⚠️ ОПАСНО! Работа с SRS требует специальной подготовки. Случайное срабатывание подушки может привести к травмам.' },
    { id: 'live_data', name: 'Поток данных',       type: 'special', description: 'Состояние цепей пиропатронов' },
    { id: 'crash_data', name: 'Данные аварии',     type: 'special', description: 'Чтение данных о срабатывании подушек' },
  ],
});

const VAG_CLIMATE_ECU = (): EcuBlock => ({
  id: 'climate', name: 'Блок климатической установки', address: '0x08', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',  name: 'Чтение кодов DTC',     type: 'special',    description: 'Ошибки климат-контроля' },
    { id: 'dtc_clear', name: 'Удаление кодов DTC',    type: 'special',    description: 'Очистка ошибок климата' },
    { id: 'live_data', name: 'Поток данных',          type: 'special',    description: 'Температуры, положение заслонок' },
    { id: 'ac_recalib', name: 'Базовая настройка климата', type: 'adaptation', description: 'Инициализация моторчиков и заслонок кондиционера' },
    { id: 'pollen_filter', name: 'Сброс счётчика салонного фильтра', type: 'service', description: 'Обнуление интервала замены фильтра' },
  ],
});

const VAG_INSTRUMENT_ECU = (): EcuBlock => ({
  id: 'instrument', name: 'Панель приборов (BCM/Kombi)', address: '0x17', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',   name: 'Чтение кодов DTC',      type: 'special',    description: 'Ошибки приборной панели' },
    { id: 'dtc_clear',  name: 'Удаление кодов DTC',     type: 'special',    description: 'Очистка ошибок' },
    { id: 'service_reset', name: 'Сброс сервисного интервала (ТО)', type: 'service', description: 'Обнуление счётчика километров до ТО' },
    { id: 'oil_reset',  name: 'Сброс счётчика масла',  type: 'service',    description: 'Сброс индикатора замены масла' },
    { id: 'coding',     name: 'Кодирование опций',      type: 'special',    description: 'Активация/деактивация функций автомобиля' },
    { id: 'hidden_menu', name: 'Скрытое меню дилера',  type: 'special',    description: 'Доступ к инженерному меню панели приборов' },
  ],
});

const VAG_STEERING_ECU = (): EcuBlock => ({
  id: 'steering', name: 'Электроусилитель руля (EPS)', address: '0x44', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',   name: 'Чтение кодов DTC',    type: 'special',    description: 'Ошибки электроусилителя' },
    { id: 'dtc_clear',  name: 'Удаление кодов DTC',   type: 'special',    description: 'Очистка ошибок EPS' },
    { id: 'live_data',  name: 'Поток данных',         type: 'special',    description: 'Угол руля, момент, ток двигателя EPS' },
    { id: 'eps_calib',  name: 'Калибровка EPS',       type: 'adaptation', description: 'Обучение нулевого положения руля', warning: 'Установить колёса ровно перед выполнением' },
    { id: 'torque_adj', name: 'Настройка усилия на руле', type: 'special', description: 'Изменение характеристики усилия EPS' },
  ],
});

const BMW_ENGINE_ECU = (): EcuBlock => ({
  id: 'engine', name: 'Блок управления двигателем (DME)', address: '0x12', protocol: 'BMW-ENET/CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',        type: 'special',    description: 'Коды неисправностей DME' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка ошибок DME' },
    { id: 'live_data',   name: 'Поток данных',             type: 'special',    description: 'Параметры двигателя в реальном времени' },
    { id: 'vanos_test',  name: 'Тест VANOS',               type: 'activation', description: 'Проверка муфт VANOS (фазы ГРМ)' },
    { id: 'swirl_test',  name: 'Тест завихрительных заслонок', type: 'activation', description: 'Диагностика заслонок впускного коллектора' },
    { id: 'inj_test',    name: 'Тест форсунок',            type: 'activation', description: 'Активация форсунок по одной' },
    { id: 'oil_cond',    name: 'Состояние масла',          type: 'special',    description: 'Качество масла, срок следующей замены' },
    { id: 'oil_reset',   name: 'Сброс CBS (ТО)',           type: 'service',    description: 'Сброс счётчиков технического обслуживания BMW CBS', warning: 'Выполнять только после проведения ТО' },
  ],
});

const BMW_ABS_ECU = (): EcuBlock => ({
  id: 'abs', name: 'Блок DSC (ABS/ESP)', address: '0x56', protocol: 'BMW-ENET/CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки DSC' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок DSC' },
    { id: 'live_data',   name: 'Поток данных',            type: 'special',    description: 'Скорость колёс, G-sensor, руль' },
    { id: 'brake_bleed', name: 'Прокачка тормозов',      type: 'activation', description: 'Активация насоса DSC для прокачки' },
    { id: 'sas_calib',   name: 'Калибровка датчика угла руля', type: 'adaptation', description: 'Обучение SAS', warning: 'Колёса прямо, руль по центру' },
    { id: 'brake_reset', name: 'Сброс счётчика колодок',  type: 'service',    description: 'Обнуление ресурса тормозных колодок' },
    { id: 'epdl_adapt',  name: 'Адаптация тормозного диска', type: 'adaptation', description: 'Калибровка новых тормозных дисков/колодок' },
  ],
});

const BMW_GEARBOX_ECU = (): EcuBlock => ({
  id: 'transmission', name: 'Блок EGS (АКПП)', address: '0x18', protocol: 'BMW-ENET/CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',    type: 'special',    description: 'Ошибки EGS' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',   type: 'special',    description: 'Очистка ошибок EGS' },
    { id: 'live_data',   name: 'Поток данных',         type: 'special',    description: 'Температура масла, передача, блокировка' },
    { id: 'adapt_reset', name: 'Сброс адаптаций АКПП', type: 'adaptation', description: 'Обнуление обучения переключений', warning: 'После сброса АКПП будет работать резко до полного обучения' },
    { id: 'oil_reset',   name: 'Сброс масла АКПП',    type: 'service',    description: 'Обнуление интервала замены масла АКПП' },
  ],
});

const TOYOTA_ENGINE_ECU = (): EcuBlock => ({
  id: 'engine', name: 'Блок управления двигателем (ECM)', address: '0x10', protocol: 'Toyota-CAN/ISO14229',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',        type: 'special',    description: 'Коды неисправностей ECM' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка ошибок ECM' },
    { id: 'live_data',   name: 'Поток данных',             type: 'special',    description: 'Параметры двигателя в реальном времени' },
    { id: 'vvti_test',   name: 'Тест VVT-i',               type: 'activation', description: 'Проверка системы изменения фаз газораспределения VVT-i' },
    { id: 'inj_balance', name: 'Балансировка форсунок',    type: 'adaptation', description: 'Обучение коррекции подачи топлива по цилиндрам' },
    { id: 'throttle_init', name: 'Инициализация дросселя', type: 'adaptation', description: 'Процедура инициализации электронного дросселя' },
    { id: 'idle_learn',  name: 'Обучение холостого хода',  type: 'adaptation', description: 'Автоматическое обучение оборотов ХХ' },
    { id: 'oil_reset',   name: 'Сброс счётчика масла',    type: 'service',    description: 'Обнуление интервала замены масла' },
  ],
});

const TOYOTA_ABS_ECU = (): EcuBlock => ({
  id: 'abs', name: 'Блок ABS / VSC / TRC', address: '0x25', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки ABS/VSC' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок ABS/VSC' },
    { id: 'live_data',   name: 'Поток данных',            type: 'special',    description: 'Скорость колёс, датчики' },
    { id: 'sas_reset',   name: 'Калибровка угла руля',    type: 'adaptation', description: 'Обнуление датчика угла поворота', warning: 'Руль должен быть по центру' },
    { id: 'brake_bleed', name: 'Прокачка тормозов',      type: 'activation', description: 'Режим прокачки с активацией насоса ABS' },
    { id: 'pad_reset',   name: 'Сброс ресурса колодок',  type: 'service',    description: 'Обнуление счётчика тормозных колодок' },
  ],
});

const MERCEDES_ENGINE_ECU = (): EcuBlock => ({
  id: 'engine', name: 'Блок управления двигателем (ME/CDI)', address: '0x01', protocol: 'Mercedes-CAN/UDS',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',        type: 'special',    description: 'Коды неисправностей ME/CDI' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка ошибок' },
    { id: 'live_data',   name: 'Поток данных',             type: 'special',    description: 'Параметры двигателя в реальном времени' },
    { id: 'inj_test',    name: 'Тест форсунок',            type: 'activation', description: 'Активация форсунок для диагностики (дизель)' },
    { id: 'swirl_adapt', name: 'Адаптация завихрительных заслонок', type: 'adaptation', description: 'Обучение положения заслонок впуска' },
    { id: 'service_a',   name: 'Сброс Сервиса A',          type: 'service',    description: 'Сброс малого ТО Mercedes' },
    { id: 'service_b',   name: 'Сброс Сервиса B',          type: 'service',    description: 'Сброс большого ТО Mercedes' },
    { id: 'adblue_reset', name: 'Сброс счётчика AdBlue',   type: 'service',    description: 'Обнуление после заправки реагента AdBlue' },
  ],
});

// ── База марок и моделей ─────────────────────────────────────────────────────

export const VEHICLE_DB: VehicleMake[] = [
  // ── VOLKSWAGEN ──
  {
    id: 'vw', name: 'Volkswagen', logo: '🔵', region: 'europe',
    models: [
      {
        id: 'golf', name: 'Golf (VII/VIII)', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [VAG_ENGINE_ECU(), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU(), VAG_STEERING_ECU(),
          { id: 'parking', name: 'Электрический стояночный тормоз (EPB)', address: '0x35', protocol: 'CAN',
            functions: [
              { id: 'dtc_read',     name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки EPB' },
              { id: 'dtc_clear',    name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок EPB' },
              { id: 'brake_service', name: 'Сервисный режим (замена колодок)', type: 'service', description: 'Раздвинуть поршни суппорта для замены задних колодок', warning: 'Выполнять только при замене тормозных колодок!' },
              { id: 'brake_adapt',  name: 'Адаптация стояночного тормоза', type: 'adaptation', description: 'Обучение усилия зажима EPB после замены колодок' },
            ]},
        ],
      },
      {
        id: 'passat', name: 'Passat (B7/B8)', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
        ecus: [VAG_ENGINE_ECU(), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU(), VAG_STEERING_ECU()],
      },
      {
        id: 'tiguan', name: 'Tiguan (I/II)', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [VAG_ENGINE_ECU(), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU(),
          { id: '4motion', name: 'Блок управления 4Motion (Haldex)', address: '0x22', protocol: 'CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',         type: 'special',    description: 'Ошибки муфты 4Motion' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',        type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data', name: 'Поток данных',              type: 'special',    description: 'Момент блокировки, температура муфты' },
              { id: 'haldex_oil', name: 'Сброс масла Haldex',      type: 'service',    description: 'Обнуление интервала замены масла в муфте Haldex' },
              { id: 'haldex_adapt', name: 'Адаптация муфты Haldex', type: 'adaptation', description: 'Обучение базового давления муфты' },
            ]},
        ],
      },
      {
        id: 'polo', name: 'Polo (V/VI)', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
        ecus: [VAG_ENGINE_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_INSTRUMENT_ECU()],
      },
    ],
  },

  // ── AUDI ──
  {
    id: 'audi', name: 'Audi', logo: '⚪', region: 'europe',
    models: [
      {
        id: 'a4', name: 'A4 (B8/B9)', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [VAG_ENGINE_ECU('0x01'), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU(), VAG_STEERING_ECU()],
      },
      {
        id: 'a6', name: 'A6 (C7/C8)', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [VAG_ENGINE_ECU(), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU(), VAG_STEERING_ECU(),
          { id: 'airsusp', name: 'Пневматическая подвеска (Airmatic)', address: '0x34', protocol: 'CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки пневмоподвески' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data', name: 'Поток данных',            type: 'special',    description: 'Давление, высота кузова' },
              { id: 'height_calib', name: 'Калибровка высоты кузова', type: 'adaptation', description: 'Обучение датчиков высоты', warning: 'Автомобиль должен стоять на ровной поверхности без груза' },
              { id: 'compressor_test', name: 'Тест компрессора',  type: 'activation', description: 'Запуск компрессора для проверки' },
            ]},
        ],
      },
      {
        id: 'q5', name: 'Q5 (8R/FY)', years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [VAG_ENGINE_ECU(), VAG_TRANSMISSION_ECU(), VAG_ABS_ECU(), VAG_AIRBAG_ECU(), VAG_CLIMATE_ECU(), VAG_INSTRUMENT_ECU()],
      },
    ],
  },

  // ── BMW ──
  {
    id: 'bmw', name: 'BMW', logo: '🔷', region: 'europe',
    models: [
      {
        id: '3series', name: '3 Series (F30/G20)', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [BMW_ENGINE_ECU(), BMW_ABS_ECU(), BMW_GEARBOX_ECU(),
          { id: 'airbag', name: 'Модуль SRS (MRS)', address: '0x00', protocol: 'BMW-ENET',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки SRS' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка ошибок SRS', warning: '⚠️ Только при исправной системе SRS' },
              { id: 'live_data', name: 'Поток данных',       type: 'special', description: 'Состояние пиропатронов' },
            ]},
          { id: 'instrument', name: 'Комбинация приборов (KOMBI)', address: '0x80', protocol: 'BMW-ENET',
            functions: [
              { id: 'dtc_read',    name: 'Чтение кодов DTC',    type: 'special', description: 'Ошибки KOMBI' },
              { id: 'service_reset', name: 'Сброс CBS (ТО)',     type: 'service', description: 'Сброс счётчиков обслуживания BMW' },
              { id: 'oil_reset',   name: 'Сброс масла',         type: 'service', description: 'Обнуление счётчика масла' },
              { id: 'coding',      name: 'Кодирование',         type: 'special', description: 'Активация скрытых функций BMW' },
            ]},
        ],
      },
      {
        id: '5series', name: '5 Series (F10/G30)', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [BMW_ENGINE_ECU(), BMW_ABS_ECU(), BMW_GEARBOX_ECU(),
          { id: 'airsusp', name: 'Электронная подвеска (EDC)', address: '0xA0', protocol: 'BMW-ENET',
            functions: [
              { id: 'dtc_read',   name: 'Чтение кодов DTC',   type: 'special',    description: 'Ошибки EDC' },
              { id: 'dtc_clear',  name: 'Удаление кодов DTC',  type: 'special',    description: 'Очистка ошибок' },
              { id: 'edc_calib',  name: 'Калибровка EDC',      type: 'adaptation', description: 'Обучение датчиков положения кузова' },
            ]},
        ],
      },
      {
        id: 'x5', name: 'X5 (E70/F15/G05)', years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [BMW_ENGINE_ECU(), BMW_ABS_ECU(), BMW_GEARBOX_ECU()],
      },
    ],
  },

  // ── MERCEDES ──
  {
    id: 'mercedes', name: 'Mercedes-Benz', logo: '⭐', region: 'europe',
    models: [
      {
        id: 'c-class', name: 'C-Class (W204/W205)', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
        ecus: [MERCEDES_ENGINE_ECU(),
          { id: 'abs', name: 'Блок ESP (ABS)', address: '0x03', protocol: 'Mercedes-CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки ESP' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data', name: 'Поток данных',            type: 'special',    description: 'Скорость колёс, датчики' },
              { id: 'sas_adapt', name: 'Адаптация датчика угла руля', type: 'adaptation', description: 'Калибровка SAS', warning: 'Руль по центру, колёса прямо' },
              { id: 'brake_bleed', name: 'Прокачка тормозов',    type: 'activation', description: 'Режим прокачки ESP' },
              { id: 'pad_reset',  name: 'Сброс ресурса колодок', type: 'service',    description: 'Обнуление счётчика колодок' },
            ]},
          { id: 'airbag', name: 'Модуль SRS/Airbag', address: '0x15', protocol: 'Mercedes-CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки SRS' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка', warning: '⚠️ Требует специальной подготовки' },
            ]},
        ],
      },
      {
        id: 'e-class', name: 'E-Class (W212/W213)', years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [MERCEDES_ENGINE_ECU()],
      },
    ],
  },

  // ── TOYOTA ──
  {
    id: 'toyota', name: 'Toyota', logo: '🔴', region: 'asia',
    models: [
      {
        id: 'camry', name: 'Camry (V50/V70)', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [TOYOTA_ENGINE_ECU(), TOYOTA_ABS_ECU(),
          { id: 'transmission', name: 'Блок управления АКПП (ECT)', address: '0x28', protocol: 'Toyota-CAN',
            functions: [
              { id: 'dtc_read',    name: 'Чтение кодов DTC',      type: 'special',    description: 'Ошибки АКПП' },
              { id: 'dtc_clear',   name: 'Удаление кодов DTC',     type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data',   name: 'Поток данных',           type: 'special',    description: 'Температура масла, передача' },
              { id: 'adapt_reset', name: 'Сброс адаптаций АКПП',  type: 'adaptation', description: 'Обнуление обучения переключений', warning: 'После сброса нужно обкатать АКПП' },
            ]},
          { id: 'airbag', name: 'Модуль SRS/Airbag', address: '0x11', protocol: 'Toyota-CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки SRS' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка', warning: '⚠️ Осторожно с системой SRS' },
            ]},
        ],
      },
      {
        id: 'rav4', name: 'RAV4 (IV/V)', years: [2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [TOYOTA_ENGINE_ECU(), TOYOTA_ABS_ECU()],
      },
      {
        id: 'land-cruiser', name: 'Land Cruiser (200/300)', years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [TOYOTA_ENGINE_ECU(), TOYOTA_ABS_ECU(),
          { id: 'kdss', name: 'Гидропневматическая подвеска KDSS', address: '0x3E', protocol: 'Toyota-CAN',
            functions: [
              { id: 'dtc_read',   name: 'Чтение кодов DTC',      type: 'special',    description: 'Ошибки KDSS' },
              { id: 'dtc_clear',  name: 'Удаление кодов DTC',     type: 'special',    description: 'Очистка ошибок' },
              { id: 'kdss_calib', name: 'Калибровка KDSS',        type: 'adaptation', description: 'Обучение после замены компонентов', warning: 'Ровная поверхность, без нагрузки' },
              { id: 'height_adj', name: 'Настройка высоты кузова', type: 'adaptation', description: 'Регулировка высоты для KDSS' },
            ]},
        ],
      },
    ],
  },

  // ── KIA ──
  {
    id: 'kia', name: 'Kia', logo: '🟡', region: 'asia',
    models: [
      {
        id: 'rio', name: 'Rio (III/IV)', years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [
          { id: 'engine', name: 'Блок управления двигателем (ECM)', address: '0x01', protocol: 'KIA-CAN/UDS',
            functions: [
              { id: 'dtc_read',    name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки двигателя' },
              { id: 'dtc_clear',   name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data',   name: 'Поток данных',            type: 'special',    description: 'Параметры двигателя' },
              { id: 'throttle',    name: 'Адаптация дросселя',      type: 'adaptation', description: 'Обучение электронного дросселя' },
              { id: 'idle',        name: 'Адаптация ХХ',            type: 'adaptation', description: 'Обучение холостого хода' },
              { id: 'oil_reset',   name: 'Сброс счётчика масла',   type: 'service',    description: 'Обнуление интервала замены масла' },
            ]},
          { id: 'abs', name: 'Блок ABS / ESP', address: '0x0C', protocol: 'KIA-CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',        type: 'special',    description: 'Ошибки ABS/ESP' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка ошибок' },
              { id: 'sas_calib', name: 'Калибровка датчика угла руля', type: 'adaptation', description: 'Обнуление SAS', warning: 'Руль по центру' },
              { id: 'brake_bleed', name: 'Прокачка тормозов',     type: 'activation', description: 'Режим прокачки' },
            ]},
        ],
      },
      {
        id: 'sportage', name: 'Sportage (III/IV/V)', years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [
          { id: 'engine', name: 'Блок управления двигателем (ECM)', address: '0x01', protocol: 'KIA-CAN/UDS',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special', description: 'Ошибки двигателя' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special', description: 'Очистка ошибок' },
              { id: 'live_data', name: 'Поток данных',        type: 'special', description: 'Параметры двигателя' },
              { id: 'dpf_reset', name: 'Регенерация DPF',    type: 'service', description: 'Принудительная регенерация сажевого фильтра (дизель)' },
              { id: 'oil_reset', name: 'Сброс масла',        type: 'service', description: 'Обнуление счётчика масла' },
            ]},
        ],
      },
    ],
  },

  // ── LADA / AVTOVAZ ──
  {
    id: 'lada', name: 'LADA (АвтоВАЗ)', logo: '🇷🇺', region: 'russia',
    models: [
      {
        id: 'vesta', name: 'Vesta / Vesta Cross', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [
          { id: 'engine', name: 'Блок управления двигателем (BOSCH/ЯНВАРЬ)', address: '0x01', protocol: 'ISO14230/CAN',
            functions: [
              { id: 'dtc_read',    name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки двигателя' },
              { id: 'dtc_clear',   name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
              { id: 'live_data',   name: 'Поток данных',            type: 'special',    description: 'Параметры двигателя' },
              { id: 'inj_test',    name: 'Тест форсунок',           type: 'activation', description: 'Активация форсунок по одному' },
              { id: 'throttle',    name: 'Адаптация дросселя',      type: 'adaptation', description: 'Обучение нулевого положения дросселя' },
              { id: 'idle',        name: 'Адаптация ХХ',            type: 'adaptation', description: 'Обучение холостого хода' },
              { id: 'oil_reset',   name: 'Сброс ТО',               type: 'service',    description: 'Обнуление сервисного интервала' },
            ]},
          { id: 'abs', name: 'Блок ABS (Bosch 9.0)', address: '0x0C', protocol: 'CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',        type: 'special',    description: 'Ошибки ABS' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка ошибок' },
              { id: 'sas_calib', name: 'Калибровка датчика угла руля', type: 'adaptation', description: 'Обнуление SAS после ТО рулевого', warning: 'Руль по центру' },
              { id: 'brake_bleed', name: 'Прокачка тормозов',     type: 'activation', description: 'Режим прокачки с насосом ABS' },
            ]},
        ],
      },
      {
        id: 'xray', name: 'XRAY / XRAY Cross', years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
        ecus: [
          { id: 'engine', name: 'Блок управления двигателем', address: '0x01', protocol: 'CAN',
            functions: [
              { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки двигателя' },
              { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка ошибок' },
              { id: 'live_data', name: 'Поток данных',       type: 'special', description: 'Параметры' },
              { id: 'oil_reset', name: 'Сброс ТО',          type: 'service', description: 'Обнуление сервисного счётчика' },
            ]},
        ],
      },
    ],
  },
];

export const REGIONS = [
  { id: 'europe', name: 'Европа', flag: '🇪🇺' },
  { id: 'asia',   name: 'Азия',   flag: '🌏' },
  { id: 'russia', name: 'Россия', flag: '🇷🇺' },
  { id: 'usa',    name: 'США',    flag: '🇺🇸' },
];
