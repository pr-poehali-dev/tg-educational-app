// ── Toyota / Lexus — полная база ─────────────────────────────────────────────
// Протоколы: ISO 14230-4 (KWP2000), ISO 15765-4 (CAN), Toyota-CAN (OBD2)
// Источники: OpenOBD, Ross-Tech wiki адаптированные под Toyota, iFixit, TechDoc TIS

import type { EcuBlock, VehicleMake } from './vehicles';

// ─── Шаблоны блоков Toyota ───────────────────────────────────────────────────

const TOY_ENGINE = (engine = 'ECM', addr = '0x10', proto = 'Toyota-CAN/ISO14229'): EcuBlock => ({
  id: 'engine', name: `Блок управления двигателем (${engine})`, address: addr, protocol: proto,
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',               type: 'special',    description: 'Считать коды неисправностей из памяти ECM' },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',              type: 'special',    description: 'Очистить память DTC', warning: 'Коды удаляются безвозвратно' },
    { id: 'live_data',     name: 'Поток данных',                    type: 'special',    description: 'Все параметры двигателя в реальном времени' },
    { id: 'freeze_frame',  name: 'Замороженный кадр (Freeze Frame)', type: 'special',    description: 'Данные на момент появления ошибки' },
    { id: 'o2_monitor',    name: 'Монитор датчиков O2',             type: 'special',    description: 'Статус готовности мониторов лямбда-зондов' },
    { id: 'readiness',     name: 'Готовность OBDII мониторов',      type: 'special',    description: 'Статус всех 8 мониторов готовности (readiness)' },
    { id: 'vvti_test',     name: 'Тест системы VVT-i',              type: 'activation', description: 'Активация управляющего клапана VVT-i для проверки' },
    { id: 'vvtie_test',    name: 'Тест VVT-iE (электр. фазовращатель)', type: 'activation', description: 'Проверка электрического фазовращателя впуска', warning: 'Только для двигателей с VVT-iE (2AR-FE и выше)' },
    { id: 'inj_balance',   name: 'Балансировка форсунок',            type: 'adaptation', description: 'Обучение коррекции подачи топлива по цилиндрам (ISC)' },
    { id: 'inj_test',      name: 'Тест форсунок (1-4)',              type: 'activation', description: 'Активация форсунок по одной с контролем CRANK RPM' },
    { id: 'throttle_init', name: 'Инициализация электронного дросселя (ETCSi)', type: 'adaptation', description: 'Сброс и повторная инициализация ETCS-i', warning: 'ДВС заглушить, зажигание ON, не нажимать педаль газа' },
    { id: 'idle_learn',    name: 'Обучение холостого хода',          type: 'adaptation', description: 'Автоматическое обучение оборотов ХХ после чистки дросселя' },
    { id: 'map_reset',     name: 'Сброс адаптаций топливных карт',   type: 'adaptation', description: 'Обнуление долгосрочных топливных коррекций (LTFT)' },
    { id: 'dpf_regen',     name: 'Принудительная регенерация DPF',   type: 'service',    description: 'Принудительный запуск регенерации сажевого фильтра (дизель)', warning: 'Только на заглушённых оборотах, температура > 80°C, уровень масла в норме' },
    { id: 'oil_reset',     name: 'Сброс счётчика масла / ТО',        type: 'service',    description: 'Обнуление напоминания о замене масла (Oil Maintenance Required)' },
    { id: 'egr_test',      name: 'Тест клапана EGR',                 type: 'activation', description: 'Принудительное открытие/закрытие EGR для диагностики' },
    { id: 'evap_test',     name: 'Тест системы EVAP',                type: 'activation', description: 'Запуск теста утечек системы улавливания паров' },
    { id: 'iac_test',      name: 'Тест клапана IAC (холостого хода)', type: 'activation', description: 'Проверка шагового двигателя IAC' },
  ],
});

const TOY_ABS = (system = 'ABS/VSC/TRC', addr = '0x25'): EcuBlock => ({
  id: 'abs', name: `Блок ${system}`, address: addr, protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',               type: 'special',    description: `Ошибки системы ${system}` },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',              type: 'special',    description: `Очистка ошибок ${system}`, warning: 'Убедитесь в устранении причины' },
    { id: 'live_data',     name: 'Поток данных',                    type: 'special',    description: 'Скорость всех колёс, датчик угла руля, G-sensor, давление в ТЦ' },
    { id: 'sas_reset',     name: 'Калибровка датчика угла руля (SAS)', type: 'adaptation', description: 'Обнуление нулевого положения датчика рулевого угла', warning: 'Установить колёса прямо, руль по центру перед выполнением' },
    { id: 'g_sensor',      name: 'Калибровка датчика G (ускорение)', type: 'adaptation', description: 'Обнуление нулевой точки датчика бокового/продольного ускорения', warning: 'Автомобиль на ровной горизонтальной поверхности, без груза' },
    { id: 'yaw_calib',     name: 'Калибровка датчика курсовой устойчивости (Yaw Rate)', type: 'adaptation', description: 'Сброс нулевой точки датчика Yaw', warning: 'Ровная поверхность, автомобиль неподвижен минимум 5 сек' },
    { id: 'brake_bleed',   name: 'Прокачка тормозов (режим насоса ABS)', type: 'activation', description: 'Активация насоса ABS для облегчения прокачки тормозной системы', warning: 'Требуется помощник. Уровень тормозной жидкости в норме!' },
    { id: 'pad_reset',     name: 'Сброс счётчика тормозных колодок', type: 'service',    description: 'Обнуление индикатора износа тормозных колодок' },
    { id: 'brake_disc_adapt', name: 'Адаптация новых тормозных дисков', type: 'adaptation', description: 'Обучение после замены тормозных дисков' },
  ],
});

const TOY_TRANSMISSION = (type = 'АКПП (ECT)', addr = '0x28'): EcuBlock => ({
  id: 'transmission', name: `Блок управления ${type}`, address: addr, protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',               type: 'special',    description: `Ошибки блока ${type}` },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',              type: 'special',    description: 'Очистка ошибок трансмиссии' },
    { id: 'live_data',     name: 'Поток данных',                    type: 'special',    description: 'Температура масла, номер передачи, входной/выходной валы, токи соленоидов' },
    { id: 'adapt_reset',   name: 'Сброс адаптаций АКПП',            type: 'adaptation', description: 'Обнуление обучения моментов переключений передач', warning: 'После сброса АКПП будет переключаться резко ~300 км до полного обучения' },
    { id: 'oil_reset',     name: 'Сброс счётчика масла АКПП',       type: 'service',    description: 'Обнуление интервала замены масла в АКПП' },
    { id: 'solenoid_test', name: 'Тест соленоидов АКПП',            type: 'activation', description: 'Активация соленоидов управления по одному для диагностики' },
    { id: 'shift_adapt',   name: 'Сброс адаптации точек переключения', type: 'adaptation', description: 'Обнуление точек переключения при ухудшении качества работы' },
  ],
});

const TOY_AIRBAG = (): EcuBlock => ({
  id: 'airbag', name: 'Модуль SRS / Airbag (SQUIB)', address: '0x11', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',     name: 'Чтение кодов DTC',    type: 'special', description: 'Ошибки системы пассивной безопасности SRS' },
    { id: 'dtc_clear',    name: 'Удаление кодов DTC',   type: 'special', description: 'Очистка ошибок SRS', warning: '⚠️ ОПАСНО! Работать только при ВЫКЛЮЧЕННОМ зажигании и снятой клемме АКБ не менее 90 сек! Случайное срабатывание подушки — тяжёлая травма!' },
    { id: 'live_data',    name: 'Поток данных',         type: 'special', description: 'Напряжение пиропатронов, состояние цепей' },
    { id: 'crash_data',   name: 'Чтение данных аварии', type: 'special', description: 'Данные о срабатывании подушек: скорость, время, причина' },
    { id: 'clock_spring', name: 'Диагностика улитки (Clock Spring)', type: 'special', description: 'Проверка целостности спирального кабеля рулевого колеса' },
  ],
});

const TOY_CLIMATE = (): EcuBlock => ({
  id: 'climate', name: 'Блок климат-контроля (A/C ECU)', address: '0x3B', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',     name: 'Чтение кодов DTC',              type: 'special',    description: 'Ошибки климатической установки' },
    { id: 'dtc_clear',    name: 'Удаление кодов DTC',             type: 'special',    description: 'Очистка ошибок климата' },
    { id: 'live_data',    name: 'Поток данных',                   type: 'special',    description: 'Температуры испарителя/конденсора, обороты компрессора, давления' },
    { id: 'ac_calib',     name: 'Базовая настройка климата',      type: 'adaptation', description: 'Инициализация моторчиков заслонок и датчиков температуры' },
    { id: 'blower_test',  name: 'Тест вентилятора',               type: 'activation', description: 'Проверка мотора вентилятора на всех скоростях' },
    { id: 'comp_test',    name: 'Тест компрессора кондиционера',  type: 'activation', description: 'Принудительное включение компрессора' },
    { id: 'filter_reset', name: 'Сброс счётчика салонного фильтра', type: 'service',  description: 'Обнуление индикатора замены салонного фильтра' },
  ],
});

const TOY_EPS = (): EcuBlock => ({
  id: 'eps', name: 'Электроусилитель руля (EPS ECU)', address: '0x56', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',          type: 'special',    description: 'Ошибки системы EPS' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',         type: 'special',    description: 'Очистка ошибок EPS' },
    { id: 'live_data',   name: 'Поток данных',               type: 'special',    description: 'Момент на руле, ток мотора EPS, угол, скорость автомобиля' },
    { id: 'eps_calib',   name: 'Калибровка EPS (нулевое положение)', type: 'adaptation', description: 'Обучение центрального положения рулевого вала', warning: 'Колёса прямо, руль по центру' },
    { id: 'torque_adj',  name: 'Регулировка усилия EPS',     type: 'special',    description: 'Изменение характеристики усиления рулевого управления (Sport/Normal/Comfort)' },
  ],
});

const TOY_INSTRUMENT = (): EcuBlock => ({
  id: 'instrument', name: 'Комбинация приборов (Meter ECU)', address: '0x17', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',       name: 'Чтение кодов DTC',           type: 'special',  description: 'Ошибки панели приборов' },
    { id: 'dtc_clear',      name: 'Удаление кодов DTC',          type: 'special',  description: 'Очистка ошибок' },
    { id: 'oil_reset',      name: 'Сброс счётчика масла',        type: 'service',  description: 'Обнуление Oil Maintenance Required (OMR)' },
    { id: 'service_reset',  name: 'Сброс интервала ТО',          type: 'service',  description: 'Сброс напоминания о плановом ТО' },
    { id: 'tpms_reset',     name: 'Сброс системы TPMS',          type: 'service',  description: 'Переобучение датчиков давления в шинах после замены колёс' },
    { id: 'odometer',       name: 'Чтение данных одометра',      type: 'special',  description: 'Данные пробега и счётчиков' },
  ],
});

const TOY_4WD = (system = 'Multi-Mode 4WD'): EcuBlock => ({
  id: '4wd', name: `Блок управления ${system}`, address: '0x3E', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',           type: 'special',    description: `Ошибки системы ${system}` },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',          type: 'special',    description: 'Очистка ошибок 4WD' },
    { id: 'live_data',   name: 'Поток данных',                type: 'special',    description: 'Режим 4WD, момент на осях, угловые скорости, температура муфты' },
    { id: '4wd_mode',    name: 'Принудительное переключение режима', type: 'activation', description: '2H → 4H → 4L принудительно для диагностики привода' },
    { id: 'diff_test',   name: 'Тест блокировки дифференциала', type: 'activation', description: 'Принудительная блокировка межосевого дифференциала' },
    { id: 'coupling_adapt', name: 'Адаптация муфты 4WD',      type: 'adaptation', description: 'Обучение базовых параметров многодисковой муфты после замены масла' },
    { id: 'oil_reset_4wd',  name: 'Сброс масла раздаточной коробки', type: 'service', description: 'Обнуление интервала замены масла в раздаточной коробке' },
  ],
});

const TOY_HYBRID = (): EcuBlock => ({
  id: 'hv', name: 'Блок управления гибридной системой (HV ECU)', address: '0x07', protocol: 'Toyota-CAN/HVBUS',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC (HV)',        type: 'special',    description: 'Ошибки высоковольтной части гибрида' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC (HV)',       type: 'special',    description: 'Очистка ошибок HV', warning: '⚠️ Высоковольтная система 201-650В. Работы только при сервисном отключении!' },
    { id: 'live_data',   name: 'Поток данных HV',              type: 'special',    description: 'SOC батареи, ток заряда/разряда, температура ячеек, мощность MG1/MG2' },
    { id: 'batt_check',  name: 'Диагностика HV батареи',       type: 'special',    description: 'Состояние и балансировка ячеек высоковольтной батареи' },
    { id: 'mg1_test',    name: 'Тест MG1 (генератор-стартер)',  type: 'activation', description: 'Проверка мотор-генератора MG1', warning: 'Сервисный режим! ВВ батарея активна' },
    { id: 'mg2_test',    name: 'Тест MG2 (тяговый мотор)',      type: 'activation', description: 'Проверка тягового мотор-генератора MG2', warning: 'Сервисный режим! ВВ батарея активна' },
    { id: 'inv_cool',    name: 'Прокачка системы охлаждения инвертора', type: 'activation', description: 'Активация насоса охлаждения инвертора для удаления воздуха' },
    { id: 'ready_check', name: 'Проверка системы READY',        type: 'special',    description: 'Диагностика цепи запуска гибридной системы' },
    { id: 'batt_reset',  name: 'Сброс данных деградации батареи', type: 'service',  description: 'Обнуление статистики для переобучения BMS после замены батарейных модулей', warning: 'Выполнять только после замены аккумуляторных блоков!' },
  ],
});

const TOY_PARKING = (): EcuBlock => ({
  id: 'parking', name: 'Электрический стояночный тормоз (EPB ECU)', address: '0x35', protocol: 'Toyota-CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',                  type: 'special',    description: 'Ошибки EPB' },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',                 type: 'special',    description: 'Очистка ошибок EPB' },
    { id: 'live_data',     name: 'Поток данных',                       type: 'special',    description: 'Ток моторов EPB, усилие зажима, статус' },
    { id: 'brake_service', name: 'Сервисный режим EPB (замена колодок)', type: 'service',  description: 'Раздвинуть поршни суппорта для замены задних колодок', warning: '⚠️ Обязательно активировать перед заменой задних колодок!' },
    { id: 'brake_close',   name: 'Закрыть суппорт (выход из сервисного режима)', type: 'service', description: 'Свести поршни суппорта обратно после замены колодок' },
    { id: 'brake_adapt',   name: 'Адаптация EPB после замены колодок', type: 'adaptation', description: 'Обучение усилия зажима после замены тормозных колодок', warning: 'Выполнять сразу после замены колодок' },
  ],
});

// ─── Модели Toyota ───────────────────────────────────────────────────────────

export const TOYOTA_MAKE: VehicleMake = {
  id: 'toyota', name: 'Toyota', logo: '🔴', region: 'asia',
  models: [
    // ── Camry ──
    {
      id: 'camry', name: 'Camry (V50/V55/V70)',
      years: [2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2AR-FE/6AR-FSE', '0x10'),
        TOY_ABS('ABS/VSC/TRC'),
        TOY_TRANSMISSION('АКПП U760E/UA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        {
          id: 'bcm', name: 'Мультиплексный блок (MPX/Body ECU)', address: '0x20', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',      type: 'special', description: 'Ошибки кузовной электроники' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',     type: 'special', description: 'Очистка ошибок' },
            { id: 'live_data',   name: 'Поток данных',           type: 'special', description: 'Статусы дверей, окон, замков, освещения' },
            { id: 'window_init', name: 'Инициализация стеклоподъёмников', type: 'adaptation', description: 'Переобучение крайних положений после замены стекла/мотора' },
          ],
        },
      ],
    },

    // ── Corolla ──
    {
      id: 'corolla', name: 'Corolla (E140/E150/E160/E170/E180/E210)',
      years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('1ZR-FE/2ZR-FE/1NR-FE', '0x10'),
        TOY_ABS(),
        TOY_TRANSMISSION('АКПП U341E/U760F'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
      ],
    },

    // ── RAV4 ──
    {
      id: 'rav4', name: 'RAV4 (XA30/XA40/XA50)',
      years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2AR-FE/2GR-FE/M20A-FKS', '0x10'),
        TOY_ABS('ABS/VSC/TRC/AWD-I'),
        TOY_TRANSMISSION('АКПП U760E/A960E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_4WD('Active Torque Control AWD'),
        {
          id: 'hybrid_rav4', name: 'HV система RAV4 Hybrid (AXAH5)', address: '0x07', protocol: 'Toyota-CAN/HVBUS',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special', description: 'Ошибки гибрида RAV4' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special', description: 'Очистка', warning: 'ВВ система активна!' },
            { id: 'live_data', name: 'Поток данных HV',     type: 'special', description: 'SOC, температура, ток ВВ батареи' },
            { id: 'batt_check', name: 'Диагностика батареи', type: 'special', description: 'Состояние ячеек Ni-MH / Li-ion' },
          ],
        },
      ],
    },

    // ── Land Cruiser 200 ──
    {
      id: 'lc200', name: 'Land Cruiser 200 (J200)',
      years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      ecus: [
        TOY_ENGINE('1UR-FE/1VD-FTV (дизель)', '0x10'),
        TOY_ABS('ABS/VSC/HAC/DAC/A-TRC'),
        TOY_TRANSMISSION('АКПП AB60F/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_INSTRUMENT(),
        TOY_4WD('Multi-Mode 4WD с блокировками'),
        {
          id: 'kdss', name: 'Кинетическая система KDSS', address: '0x3E', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',      name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки гидравлической системы KDSS' },
            { id: 'dtc_clear',     name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
            { id: 'live_data',     name: 'Поток данных KDSS',       type: 'special',    description: 'Давление в гидроцилиндрах KDSS, ход подвески' },
            { id: 'kdss_calib',    name: 'Калибровка KDSS',         type: 'adaptation', description: 'Обучение после замены компонентов подвески', warning: 'Ровная поверхность, снаряжённая масса' },
            { id: 'kdss_bleed',    name: 'Прокачка гидросистемы KDSS', type: 'activation', description: 'Удаление воздуха из гидравлического контура KDSS' },
            { id: 'height_front',  name: 'Регулировка высоты (перед)', type: 'adaptation', description: 'Настройка высоты передней подвески' },
            { id: 'height_rear',   name: 'Регулировка высоты (зад)',   type: 'adaptation', description: 'Настройка высоты задней подвески' },
          ],
        },
        {
          id: 'crawl', name: 'Система Crawl Control / Multi-Terrain Select', address: '0x4A', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки Crawl Control' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC', type: 'special', description: 'Очистка ошибок' },
            { id: 'live_data',   name: 'Поток данных',       type: 'special', description: 'Режим MTS, скорость Crawl Control, статус блокировок' },
          ],
        },
        {
          id: 'dpf_lc', name: 'DPF система (1VD-FTV дизель)', address: '0x18', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',   name: 'Чтение кодов DTC DPF', type: 'special',    description: 'Ошибки сажевого фильтра' },
            { id: 'dtc_clear',  name: 'Удаление кодов DTC',    type: 'special',    description: 'Очистка ошибок DPF' },
            { id: 'live_data',  name: 'Параметры DPF',         type: 'special',    description: 'Перепад давления DPF, накопленная сажа, температура регенерации' },
            { id: 'dpf_regen',  name: 'Принудительная регенерация DPF', type: 'service', description: 'Запуск принудительной регенерации сажевого фильтра', warning: 'Двигатель на рабочей температуре. Не глушить 25-40 минут!' },
            { id: 'dpf_reset',  name: 'Сброс счётчика DPF',   type: 'service',    description: 'Обнуление после замены или очистки DPF' },
          ],
        },
      ],
    },

    // ── Land Cruiser Prado 150 ──
    {
      id: 'lc150', name: 'Land Cruiser Prado 150 (J150)',
      years: [2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('1GR-FE/2TR-FE/1KD-FTV/2KD-FTV', '0x10'),
        TOY_ABS('ABS/VSC/HAC/DAC/A-TRC'),
        TOY_TRANSMISSION('АКПП AB60F/6-ст.'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_4WD('Part-Time 4WD / Active TEMS'),
        {
          id: 'tems', name: 'Электронная подвеска TEMS / AVS', address: '0x39', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',       type: 'special',    description: 'Ошибки TEMS/AVS' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',      type: 'special',    description: 'Очистка ошибок' },
            { id: 'live_data',   name: 'Поток данных TEMS',       type: 'special',    description: 'Режим работы амортизаторов, ускорения кузова, ход подвески' },
            { id: 'tems_calib',  name: 'Калибровка TEMS',         type: 'adaptation', description: 'Обучение нулевых положений датчиков хода', warning: 'Ровная поверхность, снаряжённая масса' },
            { id: 'height_calib', name: 'Калибровка высоты кузова', type: 'adaptation', description: 'Обучение датчиков дорожного просвета' },
          ],
        },
        {
          id: 'dpf_prado', name: 'DPF / DOC система (дизель)', address: '0x18', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',     type: 'special',    description: 'Ошибки DPF/DOC' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',    type: 'special',    description: 'Очистка ошибок' },
            { id: 'live_data', name: 'Параметры DPF',         type: 'special',    description: 'Накопленная сажа %, температура, перепад давления' },
            { id: 'dpf_regen', name: 'Принудительная регенерация', type: 'service', description: 'Запуск регенерации DPF на стационаре', warning: 'Температура ОЖ > 80°C, уровень масла OK, не глушить 30 мин!' },
            { id: 'dpf_reset', name: 'Сброс счётчика DPF',   type: 'service',    description: 'Сброс после замены/очистки DPF' },
          ],
        },
      ],
    },

    // ── Highlander ──
    {
      id: 'highlander', name: 'Highlander / Kluger (XU40/XU50/XU70)',
      years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2GR-FE/2GR-FXS/F33A-FTS', '0x10'),
        TOY_ABS('ABS/VSC/TRC'),
        TOY_TRANSMISSION('АКПП A960E/U760E/AB60F'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_4WD('AWD Active Torque Control'),
        TOY_HYBRID(),
      ],
    },

    // ── Prius ──
    {
      id: 'prius', name: 'Prius (XW20/XW30/XW50/XW60)',
      years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('1NZ-FXE/2ZR-FXE/M20A-FXS', '0x10'),
        TOY_ABS('ABS/VSC/Regenerative Brake'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        {
          id: 'hv_battery', name: 'БМС высоковольтной батареи (HV Battery ECU)', address: '0x09', protocol: 'Toyota-CAN/HVBUS',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',        type: 'special',    description: 'Ошибки ВВ батареи' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',       type: 'special',    description: 'Очистка', warning: 'ВВ система 201В' },
            { id: 'live_data',   name: 'Поток данных батареи',     type: 'special',    description: 'SOC %, напряжение каждого блока, токи, температуры по зонам' },
            { id: 'cell_balance', name: 'Балансировка ячеек',      type: 'adaptation', description: 'Принудительная балансировка ячеек батареи' },
            { id: 'soc_reset',   name: 'Сброс/Переобучение SOC',   type: 'adaptation', description: 'Обнуление и переобучение алгоритма определения заряда', warning: 'Только после замены батарейных модулей!' },
            { id: 'fan_test',    name: 'Тест вентилятора охлаждения АКБ', type: 'activation', description: 'Проверка вентилятора охлаждения высоковольтной батареи' },
          ],
        },
        {
          id: 'inverter', name: 'Инвертор / Преобразователь (Inverter ECU)', address: '0x0B', protocol: 'Toyota-CAN/HVBUS',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',         type: 'special',    description: 'Ошибки инвертора' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',        type: 'special',    description: 'Очистка', warning: 'Работы при снятом сервисном штекере ВВ!' },
            { id: 'live_data',   name: 'Поток данных инвертора',    type: 'special',    description: 'Токи фаз MG1/MG2, температура IGBT-модулей, напряжение DC-шины' },
            { id: 'cool_bleed',  name: 'Прокачка охлаждения инвертора', type: 'activation', description: 'Активация электронасоса охлаждения для удаления воздуха' },
          ],
        },
      ],
    },

    // ── Yaris / Vitz ──
    {
      id: 'yaris', name: 'Yaris / Vitz / Aqua (XP90/XP130/XP150/XP210)',
      years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('1KR-FE/1NZ-FE/2NZ-FE', '0x10'),
        TOY_ABS(),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
      ],
    },

    // ── Fortuner ──
    {
      id: 'fortuner', name: 'Fortuner (AN50/AN150)',
      years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('1GR-FE/2GR-FKS/1KD-FTV/2KD-FTV', '0x10'),
        TOY_ABS('ABS/VSC/HAC/DAC'),
        TOY_TRANSMISSION('АКПП A750F/A760F/AB60F'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_INSTRUMENT(),
        TOY_4WD('Part-Time 4WD'),
        {
          id: 'dpf_fortuner', name: 'DPF система дизель (1KD/2KD)', address: '0x18', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special',    description: 'Ошибки DPF' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special',    description: 'Очистка' },
            { id: 'live_data', name: 'Параметры DPF',       type: 'special',    description: 'Сажа %, температура, перепад давления' },
            { id: 'dpf_regen', name: 'Регенерация DPF',     type: 'service',    description: 'Принудительная регенерация сажевого фильтра', warning: 'ОЖ > 80°C. Не глушить 30 минут!' },
          ],
        },
      ],
    },

    // ── Hilux ──
    {
      id: 'hilux', name: 'Hilux (AN10/AN20/AN120)',
      years: [2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2TR-FE/1GD-FTV/2GD-FTV', '0x10'),
        TOY_ABS('ABS/VSC/HAC'),
        TOY_TRANSMISSION('АКПП A750F/AB60F/6-ст.'),
        TOY_AIRBAG(),
        TOY_INSTRUMENT(),
        TOY_4WD('Part-Time 4WD'),
        {
          id: 'dpf_hilux', name: 'DPF система (GD-серия)', address: '0x18', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special',    description: 'Ошибки DPF Hilux' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special',    description: 'Очистка' },
            { id: 'live_data', name: 'Параметры DPF',       type: 'special',    description: 'Накопление сажи, температура, регенерация' },
            { id: 'dpf_regen', name: 'Принудительная регенерация', type: 'service', description: 'Регенерация DPF на стационаре', warning: 'Только при горящей лампе DPF. Не глушить 25-40 мин!' },
          ],
        },
      ],
    },

    // ── Avensis ──
    {
      id: 'avensis', name: 'Avensis (T250/T270)',
      years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018],
      ecus: [
        TOY_ENGINE('1ZZ-FE/2ZZ-GE/2AD-FHV/1AD-FTV', '0x10'),
        TOY_ABS(),
        TOY_TRANSMISSION('АКПП U341E/U341F'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        {
          id: 'dpf_avensis', name: 'DPF система (2AD-FHV/1AD-FTV)', address: '0x18', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special',    description: 'Ошибки DPF Avensis' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special',    description: 'Очистка' },
            { id: 'live_data', name: 'Параметры DPF',       type: 'special',    description: 'Показатели сажевого фильтра' },
            { id: 'dpf_regen', name: 'Принудительная регенерация DPF', type: 'service', description: 'Регенерация DPF', warning: 'ОЖ > 80°C. Не глушить 30 мин!' },
          ],
        },
      ],
    },

    // ── Auris ──
    {
      id: 'auris', name: 'Auris / Blade (E150/E180)',
      years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019],
      ecus: [
        TOY_ENGINE('1ZR-FE/1ZR-FAE/1AD-FTV', '0x10'),
        TOY_ABS(),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
      ],
    },

    // ── C-HR ──
    {
      id: 'chr', name: 'C-HR (AX10)',
      years: [2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('8NR-FTS/2ZR-FXE', '0x10'),
        TOY_ABS('ABS/VSC/TRC/AWD-i'),
        TOY_TRANSMISSION('АКПП C550F / e-CVT'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_PARKING(),
      ],
    },

    // ── Crown ──
    {
      id: 'crown', name: 'Crown (S200/S210/XS235)',
      years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('4GR-FSE/2GR-FSE/2.5T T24A-FTS', '0x10'),
        TOY_ABS('ABS/VSC/TRC/Pre-Collision'),
        TOY_TRANSMISSION('АКПП AB60F/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        {
          id: 'airsusp_crown', name: 'Пневматическая подвеска Crown (AHS)', address: '0x3C', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',           type: 'special',    description: 'Ошибки пневматической подвески' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',          type: 'special',    description: 'Очистка ошибок' },
            { id: 'live_data',   name: 'Поток данных AHS',            type: 'special',    description: 'Давление, высота кузова по углам, статус компрессора' },
            { id: 'height_calib', name: 'Калибровка высоты кузова',   type: 'adaptation', description: 'Обучение датчиков высоты после замены компонентов', warning: 'Ровная горизонтальная поверхность, стандартная нагрузка' },
            { id: 'comp_test',   name: 'Тест компрессора',            type: 'activation', description: 'Проверка компрессора пневмоподвески' },
          ],
        },
      ],
    },

    // ── Venza ──
    {
      id: 'venza', name: 'Venza (AV10/GV80)',
      years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2GR-FE/A25A-FXS', '0x10'),
        TOY_ABS('ABS/VSC/AWD-i'),
        TOY_TRANSMISSION('АКПП U760E / e-CVT'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        TOY_PARKING(),
      ],
    },

    // ── Alphard / Vellfire ──
    {
      id: 'alphard', name: 'Alphard / Vellfire (AH20/AH30/AH40)',
      years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2GR-FE/2AR-FE/T24A-FTS', '0x10'),
        TOY_ABS('ABS/VSC/TRC'),
        TOY_TRANSMISSION('АКПП U760E/AB60F'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        TOY_PARKING(),
      ],
    },

    // ── Tacoma (для тех кто покупает б/у из США) ──
    {
      id: 'tacoma', name: 'Tacoma (N200/N300)',
      years: [2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2TR-FE/1GR-FE', '0x10'),
        TOY_ABS('ABS/VSC/ATRAC'),
        TOY_TRANSMISSION('АКПП A750F/AB60F'),
        TOY_AIRBAG(),
        TOY_INSTRUMENT(),
        TOY_4WD('Part-Time 4WD / Auto LSD'),
      ],
    },
  ],
};

// ─── Lexus ────────────────────────────────────────────────────────────────────

export const LEXUS_MAKE: VehicleMake = {
  id: 'lexus', name: 'Lexus', logo: '🔲', region: 'asia',
  models: [
    // ── RX ──
    {
      id: 'rx', name: 'RX 300/330/350/400h/450h (XU30/XU350/XU550)',
      years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2GR-FE/3MZ-FE/8AR-FTS/T24A-FTS', '0x10'),
        TOY_ABS('ABS/VSC/TRC/AWD-i'),
        TOY_TRANSMISSION('АКПП A750E/AB60F/e-CVT'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_4WD('AWD Torque-On-Demand'),
        TOY_HYBRID(),
        TOY_PARKING(),
        {
          id: 'airride_rx', name: 'Adaptive Variable Suspension (AVS)', address: '0x39', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',          type: 'special',    description: 'Ошибки системы AVS Lexus' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',         type: 'special',    description: 'Очистка ошибок' },
            { id: 'live_data',   name: 'Поток данных AVS',           type: 'special',    description: 'Режимы амортизаторов, ускорения кузова, ход подвески' },
            { id: 'avs_calib',   name: 'Калибровка AVS',             type: 'adaptation', description: 'Обучение датчиков после замены', warning: 'Ровная горизонтальная поверхность' },
          ],
        },
      ],
    },

    // ── GX ──
    {
      id: 'gx', name: 'GX 460/470 (J120/J150)',
      years: [2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2UZ-FE/1GR-FE', '0x10'),
        TOY_ABS('ABS/VSC/HAC/DAC/KDSS'),
        TOY_TRANSMISSION('АКПП A750F/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_INSTRUMENT(),
        TOY_4WD('Part-Time 4WD с KDSS'),
        {
          id: 'kdss_gx', name: 'KDSS / TEMS Lexus GX', address: '0x3E', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',    type: 'special',    description: 'Ошибки KDSS/TEMS' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',   type: 'special',    description: 'Очистка' },
            { id: 'live_data',   name: 'Поток данных',         type: 'special',    description: 'Давление KDSS, режимы TEMS' },
            { id: 'kdss_calib',  name: 'Калибровка KDSS',      type: 'adaptation', description: 'Обучение после замены компонентов', warning: 'Ровная поверхность' },
          ],
        },
      ],
    },

    // ── LX ──
    {
      id: 'lx', name: 'LX 470/570 (J100/J200)',
      years: [1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2UZ-FE/3UR-FE', '0x10'),
        TOY_ABS('ABS/VSC/HAC/DAC/Crawl'),
        TOY_TRANSMISSION('АКПП AB60F/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_INSTRUMENT(),
        TOY_4WD('Multi-Mode 4WD + блокировки'),
        {
          id: 'airsusp_lx', name: 'Пневматическая подвеска Lexus LX', address: '0x3C', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',          type: 'special',    description: 'Ошибки пневмоподвески' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',         type: 'special',    description: 'Очистка' },
            { id: 'live_data',   name: 'Поток данных',               type: 'special',    description: 'Давление в пневмостойках, высота кузова по углам' },
            { id: 'height_calib', name: 'Калибровка высоты',         type: 'adaptation', description: 'Обучение датчиков высоты', warning: 'Ровная поверхность, стандартная нагрузка (2 человека)' },
            { id: 'comp_test',   name: 'Тест компрессора',           type: 'activation', description: 'Проверка компрессора и клапанов' },
            { id: 'kdss_lx',     name: 'Калибровка KDSS Lexus LX',  type: 'adaptation', description: 'Обучение гидравлической системы стабилизаторов' },
          ],
        },
      ],
    },

    // ── ES ──
    {
      id: 'es', name: 'ES 250/300/330/350 (XV10/XV30/XV40/XV60/XV70)',
      years: [1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('2AZ-FE/2GR-FE/A25A-FXS', '0x10'),
        TOY_ABS(),
        TOY_TRANSMISSION('АКПП U341E/U760E/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        TOY_PARKING(),
      ],
    },

    // ── IS ──
    {
      id: 'is', name: 'IS 200/220d/250/300/350 (XE10/XE20/XE30)',
      years: [1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      ecus: [
        TOY_ENGINE('1G-FE/4GR-FSE/2IS-GSE/2AR-FSE', '0x10'),
        TOY_ABS('ABS/VSC/TRC/PCS'),
        TOY_TRANSMISSION('АКПП A960E/AA80E'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        {
          id: 'avs_is', name: 'Адаптивная подвеска AVS', address: '0x39', protocol: 'Toyota-CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',  type: 'special',    description: 'Ошибки AVS' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special',    description: 'Очистка' },
            { id: 'live_data', name: 'Поток данных AVS',   type: 'special',    description: 'Параметры электромагнитных амортизаторов' },
            { id: 'avs_calib', name: 'Калибровка AVS',     type: 'adaptation', description: 'Обучение датчиков', warning: 'Ровная поверхность' },
          ],
        },
      ],
    },

    // ── NX ──
    {
      id: 'nx', name: 'NX 200t/300/300h/350h/450h+ (AZ10/AZ20)',
      years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        TOY_ENGINE('8AR-FTS/F33A-FTS', '0x10'),
        TOY_ABS('ABS/VSC/TRC/AWD-i/PCS'),
        TOY_TRANSMISSION('АКПП U760E/e-CVT'),
        TOY_AIRBAG(),
        TOY_CLIMATE(),
        TOY_EPS(),
        TOY_INSTRUMENT(),
        TOY_HYBRID(),
        TOY_PARKING(),
        TOY_4WD('AWD-i'),
      ],
    },
  ],
};
