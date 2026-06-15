// ── VAG Group — VW / Audi / Skoda / Seat ─────────────────────────────────────
// Протоколы: KWP2000 (K-Line), ISO 15765 CAN, UDS/ISO14229
// Источники: Ross-Tech VCDS documentation, OpenDiag, VAG-COM protocols

import type { EcuBlock, VehicleMake } from './vehicles';

// ─── Шаблоны блоков VAG ──────────────────────────────────────────────────────

const VAG_ENGINE = (label = 'ECM', addr = '0x01', proto = 'KWP2000/CAN'): EcuBlock => ({
  id: 'engine', name: `Блок управления двигателем ${label}`, address: addr, protocol: proto,
  functions: [
    { id: 'dtc_read',        name: 'Чтение кодов DTC',                   type: 'special',    description: 'Считать все сохранённые коды неисправностей' },
    { id: 'dtc_clear',       name: 'Удаление кодов DTC',                  type: 'special',    description: 'Очистить память ошибок блока управления', warning: 'Ошибки будут удалены безвозвратно' },
    { id: 'live_data',       name: 'Поток данных (Live Data)',             type: 'special',    description: 'Все измерительные блоки (Messwertblöcke) в реальном времени' },
    { id: 'freeze_frame',    name: 'Замороженный кадр',                   type: 'special',    description: 'Данные на момент возникновения ошибки (freeze frame)' },
    { id: 'readiness',       name: 'Готовность мониторов OBDII',          type: 'special',    description: 'Статус готовности всех мониторов (readiness codes)' },
    { id: 'inj_test',        name: 'Тест форсунок (1-4/6)',               type: 'activation', description: 'Активация форсунок по одной, отключение для диагностики пропусков' },
    { id: 'inj_balance',     name: 'Балансировка форсунок / QR-коды',     type: 'adaptation', description: 'Ввод QR-кодов форсунок после замены (дизель PD/CR), адаптация по цилиндрам' },
    { id: 'throttle_adapt',  name: 'Адаптация дроссельной заслонки (TBA)', type: 'adaptation', description: 'Сброс и повторная адаптация положений дроссельной заслонки', warning: 'Двигатель прогрет до рабочей температуры' },
    { id: 'idle_adapt',      name: 'Адаптация холостого хода',            type: 'adaptation', description: 'Обучение регулятора холостого хода' },
    { id: 'lambda_test',     name: 'Тест лямбда-зонда',                   type: 'activation', description: 'Проверка сигнала и подогрева лямбда-зонда' },
    { id: 'egr_test',        name: 'Тест клапана EGR',                    type: 'activation', description: 'Принудительное открытие/закрытие клапана EGR' },
    { id: 'egr_adapt',       name: 'Адаптация EGR',                       type: 'adaptation', description: 'Обучение основного положения клапана EGR после замены или очистки' },
    { id: 'swirl_test',      name: 'Тест завихрительных заслонок (TISA)', type: 'activation', description: 'Проверка управляющих заслонок впускного коллектора' },
    { id: 'swirl_adapt',     name: 'Адаптация завихрительных заслонок',   type: 'adaptation', description: 'Базовая настройка TISA после замены или очистки' },
    { id: 'dpf_regen',       name: 'Принудительная регенерация DPF',      type: 'service',    description: 'Запуск регенерации сажевого фильтра (дизель)', warning: 'Двигатель на рабочей температуре. Не глушить 25-40 мин! Сажа в DPF должна быть > 40%' },
    { id: 'dpf_reset',       name: 'Сброс счётчика DPF',                  type: 'service',    description: 'Обнуление после замены или промышленной очистки сажевого фильтра' },
    { id: 'adblue_reset',    name: 'Сброс счётчика AdBlue',               type: 'service',    description: 'Обнуление после заправки реагента AdBlue (SCR-системы)' },
    { id: 'oil_reset',       name: 'Сброс сервисного интервала ТО',       type: 'service',    description: 'Обнуление счётчика пробега до ТО в комбинации приборов' },
    { id: 'maf_adapt',       name: 'Адаптация датчика MAF',               type: 'adaptation', description: 'Сброс долгосрочной коррекции воздуха (LTFT/MAF Adaptation)' },
    { id: 'vanos_test',      name: 'Тест фазовращателя TFSI/TSI',         type: 'activation', description: 'Проверка системы изменения фаз ГРМ (VVT) на двигателях TSI/TFSI' },
    { id: 'camshaft_adapt',  name: 'Адаптация распредвала после замены',  type: 'adaptation', description: 'Обучение системы VVT после замены цепи/звёзд ГРМ' },
    { id: 'coding',          name: 'Кодирование ЭБУ',                     type: 'special',    description: 'Изменение кодировки блока управления двигателем (Long Coding)' },
    { id: 'immo_match',      name: 'Привязка иммобилайзера',              type: 'special',    description: 'Синхронизация иммобилайзера с ЭБУ двигателя при замене', warning: 'Требуется PIN-код или EEPROM данные' },
  ],
});

const VAG_DSG = (model = 'DSG/S-Tronic'): EcuBlock => ({
  id: 'transmission', name: `Мехатроник ${model} (TCU)`, address: '0x02', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',       name: 'Чтение кодов DTC',                   type: 'special',    description: 'Ошибки блока мехатроника DSG' },
    { id: 'dtc_clear',      name: 'Удаление кодов DTC',                  type: 'special',    description: 'Очистка ошибок', warning: 'Удалить только после устранения причины' },
    { id: 'live_data',      name: 'Поток данных DSG',                    type: 'special',    description: 'Температура масла, передача, момент, токи соленоидов, позиция сцеплений' },
    { id: 'basic_settings', name: 'Базовая настройка DSG (Grundeinst.)', type: 'adaptation', description: 'Инициализация и обучение точек зацепления сцепления DSG/S-Tronic', warning: '⚠️ Только с прогретым маслом (40-50°C). Авт. ровно, без нагрузки' },
    { id: 'kiss_point',     name: 'Адаптация Kiss-Point (сцепления)',    type: 'adaptation', description: 'Обучение точки начала зацепления K1 и K2 сцеплений' },
    { id: 'selector_adapt', name: 'Адаптация положения селектора',       type: 'adaptation', description: 'Обучение крайних положений переключателя передач' },
    { id: 'oil_reset',      name: 'Сброс счётчика масла DSG',            type: 'service',    description: 'Обнуление интервала замены масла в DSG-коробке' },
    { id: 'solenoid_test',  name: 'Тест соленоидов DSG',                 type: 'activation', description: 'Активация соленоидов гидроблока DSG по одному' },
    { id: 'learning_reset', name: 'Сброс адаптационных значений DSG',    type: 'adaptation', description: 'Полный сброс всех обученных значений (заводские данные)', warning: 'После сброса будет грубое переключение ~500 км до обучения!' },
    { id: 'coding',         name: 'Кодирование мехатроника',             type: 'special',    description: 'Изменение настроек DSG через Long Coding' },
  ],
});

const VAG_ABS = (system = 'ABS/ESP'): EcuBlock => ({
  id: 'abs', name: `Блок ${system} (J104)`, address: '0x03', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',                 type: 'special',    description: `Ошибки системы ${system}` },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',                type: 'special',    description: `Очистка ошибок ${system}`, warning: 'Убедитесь в устранении неисправности' },
    { id: 'live_data',     name: 'Поток данных',                      type: 'special',    description: 'Скорость колёс, давление тормозов, датчик угла руля, G-сенсор' },
    { id: 'brake_bleed',   name: 'Прокачка тормозов (Bremsenentl.)', type: 'activation', description: 'Активация насоса ABS для удаления воздуха из тормозной системы', warning: 'Требуется помощник! Уровень тормозной жидкости в норме!' },
    { id: 'sas_calib',     name: 'Адаптация датчика угла руля (SAS)', type: 'adaptation', description: 'Обнуление нулевого положения датчика рулевого угла G85', warning: 'Руль ровно по центру, колёса прямо!' },
    { id: 'g_sensor',      name: 'Калибровка G-датчика',              type: 'adaptation', description: 'Обнуление нулевой точки датчиков бокового/продольного ускорения', warning: 'Автомобиль на ровной горизонтальной поверхности, неподвижен' },
    { id: 'brake_pads',    name: 'Сброс счётчика тормозных колодок',  type: 'service',    description: 'Обнуление ресурса тормозных колодок в блоке' },
    { id: 'tcs_test',      name: 'Тест системы TCS (буксование)',      type: 'activation', description: 'Проверка работы системы контроля тяги' },
    { id: 'coding',        name: 'Кодирование ABS/ESP',               type: 'special',    description: 'Изменение настроек блока ABS через Long Coding' },
  ],
});

const VAG_AIRBAG = (): EcuBlock => ({
  id: 'airbag', name: 'Модуль SRS / Airbag (J234)', address: '0x15', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',     name: 'Чтение кодов DTC',     type: 'special', description: 'Ошибки системы SRS/Airbag' },
    { id: 'dtc_clear',    name: 'Удаление кодов DTC',    type: 'special', description: 'Очистка ошибок SRS', warning: '⚠️ ОПАСНО! Работать только с отключённой клеммой АКБ не менее 60 сек! Случайное срабатывание — тяжёлая травма!' },
    { id: 'live_data',    name: 'Поток данных SRS',      type: 'special', description: 'Сопротивление цепей пиропатронов, напряжение конденсатора' },
    { id: 'crash_data',   name: 'Данные аварии',         type: 'special', description: 'Чтение информации о срабатывании подушек' },
    { id: 'crash_clear',  name: 'Сброс данных аварии',   type: 'special', description: 'Очистка памяти после ДТП и замены модуля', warning: 'Только после замены всех сработавших компонентов SRS!' },
    { id: 'clock_spring', name: 'Диагностика улитки',    type: 'special', description: 'Проверка спирального кабеля рулевого колеса (J285)' },
    { id: 'coding',       name: 'Кодирование SRS',       type: 'special', description: 'Кодировка модуля Airbag для конкретного авт. (VIN привязка)' },
  ],
});

const VAG_CLIMATE = (system = 'Climatronic'): EcuBlock => ({
  id: 'climate', name: `Блок климатической установки ${system} (J255)`, address: '0x08', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',                  type: 'special',    description: 'Ошибки климатической установки' },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',                 type: 'special',    description: 'Очистка ошибок' },
    { id: 'live_data',     name: 'Поток данных климата',               type: 'special',    description: 'Температуры испарителя/конденсора, позиции заслонок, обороты компрессора' },
    { id: 'ac_basic',      name: 'Базовая настройка климата',          type: 'adaptation', description: 'Принудительная инициализация всех моторчиков и датчиков климата' },
    { id: 'blower_test',   name: 'Тест вентилятора отопителя',         type: 'activation', description: 'Проверка мотора вентилятора на 4 скоростях' },
    { id: 'comp_test',     name: 'Принудительный запуск компрессора',  type: 'activation', description: 'Включение компрессора кондиционера для диагностики' },
    { id: 'flap_test',     name: 'Тест заслонок климата',              type: 'activation', description: 'Поочерёдное перемещение всех климатических заслонок' },
    { id: 'filter_reset',  name: 'Сброс счётчика салонного фильтра',   type: 'service',    description: 'Обнуление ресурса фильтра на комбинации приборов' },
    { id: 'ac_recharge',   name: 'Сброс после дозаправки фреоном',     type: 'service',    description: 'Обнуление данных после заправки/замены фреона' },
    { id: 'coding',        name: 'Кодирование климата',                type: 'special',    description: 'Активация зон, опций климата через Long Coding' },
  ],
});

const VAG_INSTRUMENT = (): EcuBlock => ({
  id: 'instrument', name: 'Комбинация приборов / Instrument Cluster (J285)', address: '0x17', protocol: 'KWP2000/CAN',
  functions: [
    { id: 'dtc_read',       name: 'Чтение кодов DTC',              type: 'special',  description: 'Ошибки блока комбинации приборов' },
    { id: 'dtc_clear',      name: 'Удаление кодов DTC',             type: 'special',  description: 'Очистка ошибок' },
    { id: 'live_data',      name: 'Поток данных',                   type: 'special',  description: 'Пробег, время, напряжение, температуры' },
    { id: 'service_reset',  name: 'Сброс сервисного интервала (ТО)', type: 'service',  description: 'Обнуление OEL/INSП/AD AS интервалов ТО — масло, инспекция, сервис' },
    { id: 'oil_type',       name: 'Ввод типа масла',                type: 'service',  description: 'Указание вязкости масла для расчёта интервала (LongLife / Fixed)' },
    { id: 'coding',         name: 'Кодирование приборки',           type: 'special',  description: 'Активация опций: Км/миль, дополнительные индикаторы, Country' },
    { id: 'tpms_reset',     name: 'Сброс системы TPMS',             type: 'service',  description: 'Переобучение датчиков давления в шинах после перестановки колёс' },
    { id: 'mileage',        name: 'Чтение VIN / пробега',           type: 'special',  description: 'Данные VIN, пробег по всем одометрам' },
  ],
});

const VAG_STEERING = (system = 'EPS/Servotronic'): EcuBlock => ({
  id: 'steering', name: `Электроусилитель руля ${system} (J500)`, address: '0x44', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',              type: 'special',    description: 'Ошибки системы EPS' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',             type: 'special',    description: 'Очистка ошибок EPS' },
    { id: 'live_data',   name: 'Поток данных EPS',               type: 'special',    description: 'Момент на руле, угол поворота, ток двигателя EPS, температура' },
    { id: 'eps_calib',   name: 'Калибровка EPS (нулевое положение)', type: 'adaptation', description: 'Обучение нулевого положения рулевого колеса после снятия/замены', warning: 'Установить колёса прямо, руль по центру, включить зажигание' },
    { id: 'coding',      name: 'Кодирование EPS',                type: 'special',    description: 'Настройка характеристики усилия (Sport/Comfort/Country)' },
  ],
});

const VAG_EPB = (): EcuBlock => ({
  id: 'parking', name: 'Электрический стояночный тормоз EPB (J540)', address: '0x35', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',                   type: 'special',    description: 'Ошибки EPB' },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',                  type: 'special',    description: 'Очистка ошибок EPB' },
    { id: 'live_data',     name: 'Поток данных EPB',                    type: 'special',    description: 'Ток моторов EPB, усилие зажима, статус, температура' },
    { id: 'brake_service', name: 'Сервисный режим EPB (раздвинуть поршни)', type: 'service', description: 'Разжать поршни задних суппортов для замены колодок', warning: '⚠️ ОБЯЗАТЕЛЬНО перед заменой задних колодок! Без этого повредите мотор суппорта!' },
    { id: 'brake_close',   name: 'Закрыть суппорт (выход из сервисного режима)', type: 'service', description: 'Свести поршни после замены колодок' },
    { id: 'brake_adapt',   name: 'Адаптация EPB после замены колодок',  type: 'adaptation', description: 'Обучение усилия зажима (Зажигание ON, двигатель работает)', warning: 'Выполнять сразу после замены колодок, двигатель запущен' },
    { id: 'coding',        name: 'Кодирование EPB',                     type: 'special',    description: 'Настройка EPB под комплектацию (Auto Hold, динамическое и т.д.)' },
  ],
});

const VAG_ACC = (): EcuBlock => ({
  id: 'acc', name: 'Адаптивный круиз-контроль / ACC (J428)', address: '0x13', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',    name: 'Чтение кодов DTC',      type: 'special',    description: 'Ошибки радарного блока ACC' },
    { id: 'dtc_clear',   name: 'Удаление кодов DTC',     type: 'special',    description: 'Очистка ошибок ACC' },
    { id: 'live_data',   name: 'Поток данных ACC',       type: 'special',    description: 'Расстояние до объекта, скорость объекта, угол радара, статус' },
    { id: 'radar_calib', name: 'Калибровка радара ACC',  type: 'adaptation', description: 'Юстировка радарного датчика после замены или удара', warning: 'Требуется специальная мишень для калибровки. Ровная поверхность, 5м до стены' },
    { id: 'coding',      name: 'Кодирование ACC',        type: 'special',    description: 'Активация функций ACC через Long Coding (Country, speed limit)' },
  ],
});

const VAG_GATEWAY = (): EcuBlock => ({
  id: 'gateway', name: 'Шлюз CAN-шины / Gateway (J533)', address: '0x19', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',   name: 'Чтение кодов DTC',  type: 'special', description: 'Ошибки шлюза / шины CAN' },
    { id: 'dtc_clear',  name: 'Удаление кодов DTC', type: 'special', description: 'Очистка ошибок шины' },
    { id: 'live_data',  name: 'Диагностика шин',    type: 'special', description: 'Статус CAN, LIN, FlexRay шин и всех подключённых блоков' },
    { id: 'coding',     name: 'Кодирование шлюза',  type: 'special', description: 'Активация/деактивация блоков в списке шлюза' },
  ],
});

const VAG_HALDEX = (): EcuBlock => ({
  id: 'haldex', name: 'Блок управления Haldex / 4Motion (J492)', address: '0x22', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',     name: 'Чтение кодов DTC',             type: 'special',    description: 'Ошибки муфты 4Motion Haldex' },
    { id: 'dtc_clear',    name: 'Удаление кодов DTC',            type: 'special',    description: 'Очистка ошибок' },
    { id: 'live_data',    name: 'Поток данных Haldex',           type: 'special',    description: 'Момент блокировки, давление насоса, скорости валов, температура муфты' },
    { id: 'haldex_pump',  name: 'Тест насоса Haldex',            type: 'activation', description: 'Принудительный запуск гидравлического насоса муфты' },
    { id: 'haldex_oil',   name: 'Сброс счётчика масла Haldex',   type: 'service',    description: 'Обнуление интервала замены масла в муфте Haldex' },
    { id: 'haldex_adapt', name: 'Адаптация муфты Haldex',        type: 'adaptation', description: 'Обучение базового давления / точки блокировки после замены масла', warning: 'Выполнять после замены масла в муфте Haldex' },
    { id: 'coding',       name: 'Кодирование Haldex',            type: 'special',    description: 'Настройка характеристики блокировки под тип автомобиля' },
  ],
});

const VAG_AIRSUSP = (): EcuBlock => ({
  id: 'airsusp', name: 'Пневматическая подвеска (J197/J1021)', address: '0x34', protocol: 'CAN',
  functions: [
    { id: 'dtc_read',      name: 'Чтение кодов DTC',             type: 'special',    description: 'Ошибки пневматической подвески' },
    { id: 'dtc_clear',     name: 'Удаление кодов DTC',            type: 'special',    description: 'Очистка ошибок' },
    { id: 'live_data',     name: 'Поток данных',                  type: 'special',    description: 'Давление воздуха, высота кузова по углам, статус компрессора и клапанов' },
    { id: 'height_calib',  name: 'Калибровка высоты кузова',      type: 'adaptation', description: 'Обучение датчиков высоты (потенциометры) после замены', warning: 'Ровная поверхность, снаряжённая масса (водитель), зажигание ON 5 мин' },
    { id: 'comp_test',     name: 'Тест компрессора',              type: 'activation', description: 'Запуск компрессора для проверки производительности' },
    { id: 'valve_test',    name: 'Тест клапанов пневмоподвески',  type: 'activation', description: 'Поочерёдное открытие/закрытие клапанов каждого пневмобаллона' },
    { id: 'coding',        name: 'Кодирование пневмоподвески',    type: 'special',    description: 'Настройка уровней высоты, режимов, отключение функций' },
  ],
});

// ─── VW ──────────────────────────────────────────────────────────────────────

export const VW_MAKE: VehicleMake = {
  id: 'vw', name: 'Volkswagen', logo: '🔵', region: 'europe',
  models: [
    {
      id: 'golf7', name: 'Golf VII / GTI / R (5G)',
      years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      ecus: [
        VAG_ENGINE('EA888/EA211', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ250'),
        VAG_ABS('ABS/ESP MK20/MK60'),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'golf8', name: 'Golf VIII / GTE / GTI / R (CD1)',
      years: [2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 evo/EA888 evo', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200-MQB-evo/DQ381'),
        VAG_ABS('ABS/ESP ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'passat-b7', name: 'Passat B7 (3C)',
      years: [2010,2011,2012,2013,2014,2015],
      ecus: [
        VAG_ENGINE('EA888 Gen2/EA189', '0x01'),
        VAG_DSG('DSG DQ250/DQ500'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic 2-зонный'),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_GATEWAY(),
        {
          id: 'acc_passat', name: 'Круиз-контроль / ACC', address: '0x13', protocol: 'CAN',
          functions: [
            { id: 'dtc_read', name: 'Чтение кодов DTC', type: 'special', description: 'Ошибки ACC/GRA' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC', type: 'special', description: 'Очистка' },
            { id: 'radar_calib', name: 'Калибровка радара', type: 'adaptation', description: 'Юстировка радарного датчика ACC', warning: 'Специальная мишень, ровная поверхность' },
          ],
        },
      ],
    },
    {
      id: 'passat-b8', name: 'Passat B8 (3G)',
      years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA189 evo', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ250/DQ381/DL382'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic 3-зонный'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'tiguan1', name: 'Tiguan I (5N)',
      years: [2007,2008,2009,2010,2011,2012,2013,2014,2015,2016],
      ecus: [
        VAG_ENGINE('EA113/EA888 Gen1', '0x01'),
        VAG_DSG('DSG DQ250/DQ500'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'tiguan2', name: 'Tiguan II / Allspace (AD1/BW2)',
      years: [2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA211 evo', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ381'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'polo5', name: 'Polo V (6R/6C)',
      years: [2009,2010,2011,2012,2013,2014,2015,2016,2017],
      ecus: [
        VAG_ENGINE('EA111/EA211', '0x01'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'polo6', name: 'Polo VI (AW)',
      years: [2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 evo 1.0TSI/1.6MPI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS('ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'touareg2', name: 'Touareg II (7P)',
      years: [2010,2011,2012,2013,2014,2015,2016,2017,2018],
      ecus: [
        VAG_ENGINE('3.0 TDI/3.6 FSI/4.2 FSI', '0x01'),
        VAG_DSG('АКПП 8HP (ZF)'),
        VAG_ABS('ABS/ESP'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
        {
          id: 'locking', name: 'Блок блокировки дифференциалов', address: '0x26', protocol: 'CAN',
          functions: [
            { id: 'dtc_read',   name: 'Чтение кодов DTC',          type: 'special',    description: 'Ошибки блокировок Touareg' },
            { id: 'dtc_clear',  name: 'Удаление кодов DTC',         type: 'special',    description: 'Очистка' },
            { id: 'live_data',  name: 'Поток данных',               type: 'special',    description: 'Статусы блокировок, момент 4Motion' },
            { id: 'diff_test',  name: 'Тест блокировок',            type: 'activation', description: 'Принудительное включение блокировок дифференциалов для диагностики' },
          ],
        },
      ],
    },
    {
      id: 'touareg3', name: 'Touareg III (CR7)',
      years: [2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('3.0 TDI Evo/3.0 TSI', '0x01', 'CAN/UDS'),
        VAG_DSG('АКПП 8HP (ZF)'),
        VAG_ABS('ABS/ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('4-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'sharan', name: 'Sharan / SEAT Alhambra (7N)',
      years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      ecus: [
        VAG_ENGINE('EA888/EA189 TDI', '0x01'),
        VAG_DSG('DSG DQ250/DQ500'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'caddy', name: 'Caddy IV (SA)',
      years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211/EA288 TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ250'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'touran', name: 'Touran II (1T/5T)',
      years: [2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      ecus: [
        VAG_ENGINE('EA113/EA888/EA189', '0x01'),
        VAG_DSG('DSG DQ200/DQ250'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'crafter', name: 'Crafter / MAN TGE (SY)',
      years: [2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('2.0 TDI CR/2.5 TDI', '0x01'),
        VAG_ABS('ABS/ESP'),
        VAG_AIRBAG(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
  ],
};

// ─── Audi ─────────────────────────────────────────────────────────────────────

export const AUDI_MAKE: VehicleMake = {
  id: 'audi', name: 'Audi', logo: '⚪', region: 'europe',
  models: [
    {
      id: 'a3-8v', name: 'A3 / S3 / RS3 (8V)',
      years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021],
      ecus: [
        VAG_ENGINE('EA888 Gen3 TFSI/TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG S-Tronic DQ200/DQ250'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('Audi climatronic 2-зонный'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS MMI'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'a4-b8', name: 'A4 / S4 / RS4 (B8)',
      years: [2007,2008,2009,2010,2011,2012,2013,2014,2015],
      ecus: [
        VAG_ENGINE('EA888 Gen2 TFSI/TDI', '0x01'),
        VAG_DSG('S-Tronic DQ250/DL501 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Audi climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        {
          id: 'quattro_b8', name: 'Блок управления quattro (Torsen)', address: '0x22', protocol: 'CAN',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC',   type: 'special', description: 'Ошибки quattro' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',  type: 'special', description: 'Очистка' },
            { id: 'live_data', name: 'Поток данных',        type: 'special', description: 'Момент на осях, блокировка Torsen, скольжение' },
          ],
        },
      ],
    },
    {
      id: 'a4-b9', name: 'A4 / A4 Avant / S4 / RS4 (B9)',
      years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3B/EA839 3.0T', '0x01', 'CAN/UDS'),
        VAG_DSG('S-Tronic DQ200/DL382/ZF 8HP'),
        VAG_ABS('ABS/ESP ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Audi climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'a6-c7', name: 'A6 / S6 / RS6 (C7)',
      years: [2011,2012,2013,2014,2015,2016,2017,2018],
      ecus: [
        VAG_ENGINE('EA888/EA897 3.0 TFSI/TDI', '0x01'),
        VAG_DSG('S-Tronic DL501/ZF 8HP'),
        VAG_ABS('ABS/ESP MK C1/MK25'),
        VAG_AIRBAG(),
        VAG_CLIMATE('4-зонный Audi climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'a6-c8', name: 'A6 / S6 / RS6 / A7 (C8)',
      years: [2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA839 3.0T/EA888 Gen4', '0x01', 'CAN/UDS'),
        VAG_DSG('ZF 8HP 8-ст.'),
        VAG_ABS('ABS/ESC MK C2'),
        VAG_AIRBAG(),
        VAG_CLIMATE('4-зонный climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
        {
          id: 'air48v', name: '48V мягкий гибрид (MHEV ECU)', address: '0x61', protocol: 'CAN/UDS',
          functions: [
            { id: 'dtc_read',  name: 'Чтение кодов DTC 48V', type: 'special',    description: 'Ошибки системы MHEV' },
            { id: 'dtc_clear', name: 'Удаление кодов DTC',    type: 'special',    description: 'Очистка' },
            { id: 'live_data', name: 'Параметры MHEV',        type: 'special',    description: 'Ток BSG, заряд 48V батареи, рекуперация' },
          ],
        },
      ],
    },
    {
      id: 'q5-fy', name: 'Q5 / SQ5 (FY)',
      years: [2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3B/EA839 3.0T', '0x01', 'CAN/UDS'),
        VAG_DSG('S-Tronic DL382/ZF 8HP'),
        VAG_ABS('ABS/ESP ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'q7-4m', name: 'Q7 / Q8 / SQ7 / SQ8 (4M/4MN)',
      years: [2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA897 3.0 TDI/4.0 TFSI/EA839', '0x01', 'CAN/UDS'),
        VAG_DSG('ZF 8HP 8-ст.'),
        VAG_ABS('ABS/ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('4-зонный climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
        {
          id: 'rear_steer', name: 'Задний активный руль (J793)', address: '0x60', protocol: 'CAN',
          functions: [
            { id: 'dtc_read',    name: 'Чтение кодов DTC',           type: 'special',    description: 'Ошибки заднего руля' },
            { id: 'dtc_clear',   name: 'Удаление кодов DTC',          type: 'special',    description: 'Очистка' },
            { id: 'live_data',   name: 'Поток данных',                type: 'special',    description: 'Угол заднего руля, ток мотора, статус' },
            { id: 'rear_calib',  name: 'Калибровка заднего руля',     type: 'adaptation', description: 'Обучение нулевого положения задних рулевых тяг', warning: 'Автомобиль на ровной поверхности, зажигание ON' },
          ],
        },
      ],
    },
    {
      id: 'a1-gb', name: 'A1 (8X / GB)',
      years: [2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA111/EA211 evo 1.0-1.4TSI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
  ],
};

// ─── Škoda ────────────────────────────────────────────────────────────────────

export const SKODA_MAKE: VehicleMake = {
  id: 'skoda', name: 'Škoda', logo: '🟢', region: 'europe',
  models: [
    {
      id: 'octavia3', name: 'Octavia III / RS (5E)',
      years: [2013,2014,2015,2016,2017,2018,2019,2020],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA211/EA189 TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ250'),
        VAG_ABS('ABS/ESP MK20'),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'octavia4', name: 'Octavia IV (NX)',
      years: [2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 evo/EA888 Gen4', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ381'),
        VAG_ABS('ABS/ESP ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'superb2', name: 'Superb II / III (3T / 3V)',
      years: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888/EA897 3.6 V6/EA189 TDI', '0x01'),
        VAG_DSG('DSG DQ250/DQ381'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_AIRSUSP(),
      ],
    },
    {
      id: 'kodiaq', name: 'Kodiaq / Kodiaq RS (NS)',
      years: [2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA211 evo', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ381/DQ500'),
        VAG_ABS('ABS/ESP ESC MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный Climatronic'),
        VAG_INSTRUMENT(),
        VAG_STEERING('EPS'),
        VAG_EPB(),
        VAG_ACC(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'karoq', name: 'Karoq (NU)',
      years: [2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 evo 1.5TSI/1.6TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ381'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'fabia3', name: 'Fabia III / IV (NJ/PJ)',
      years: [2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 1.0TSI/1.2TSI/1.6TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
    {
      id: 'rapid', name: 'Rapid / Spaceback (NH)',
      years: [2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022],
      ecus: [
        VAG_ENGINE('EA211 1.4TSI/1.6MPI', '0x01'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
  ],
};

// ─── SEAT ─────────────────────────────────────────────────────────────────────

export const SEAT_MAKE: VehicleMake = {
  id: 'seat', name: 'SEAT / Cupra', logo: '🟡', region: 'europe',
  models: [
    {
      id: 'leon3', name: 'Leon III / Cupra (5F)',
      years: [2012,2013,2014,2015,2016,2017,2018,2019,2020],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA211', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ250'),
        VAG_ABS('ABS/ESP MK20'),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'ateca', name: 'Ateca / Cupra Ateca (KH)',
      years: [2016,2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3/EA211 evo', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200/DQ381'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'tarraco', name: 'Tarraco (KN)',
      years: [2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA888 Gen3B 2.0TSI/TDI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ381/DQ500'),
        VAG_ABS('ABS/ESP MK C1'),
        VAG_AIRBAG(),
        VAG_CLIMATE('3-зонный'),
        VAG_INSTRUMENT(),
        VAG_STEERING(),
        VAG_EPB(),
        VAG_GATEWAY(),
        VAG_HALDEX(),
      ],
    },
    {
      id: 'ibiza5', name: 'Ibiza V / Arona (KJ/KH)',
      years: [2017,2018,2019,2020,2021,2022,2023,2024],
      ecus: [
        VAG_ENGINE('EA211 evo 1.0TSI/1.5TSI', '0x01', 'CAN/UDS'),
        VAG_DSG('DSG DQ200 7-ст.'),
        VAG_ABS(),
        VAG_AIRBAG(),
        VAG_CLIMATE(),
        VAG_INSTRUMENT(),
        VAG_GATEWAY(),
      ],
    },
  ],
};
