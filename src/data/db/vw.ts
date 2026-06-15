// ── Volkswagen ECU Database ───────────────────────────────────────────────────
// Полная база данных блоков управления для диагностики автомобилей Volkswagen

export interface EcuParam {
  id: string;
  name: string;
  pid?: string;       // OBD PID или проприетарный адрес
  unit: string;
  formula?: string;   // формула расчёта значения из сырых байт
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

// ── Общие параметры живых данных ДВС (GMB = Group Measurement Block) ─────────

const engineLiveParams: EcuParam[] = [
  {
    id: 'rpm',
    name: 'Обороты двигателя',
    pid: '0x01F0',
    unit: 'об/мин',
    formula: '(A * 256 + B) / 4',
    min: 0,
    max: 8000,
    group: 'GMB-001',
  },
  {
    id: 'coolant_temp',
    name: 'Температура охлаждающей жидкости',
    pid: '0x0105',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 130,
    group: 'GMB-001',
  },
  {
    id: 'throttle_pos',
    name: 'Положение дроссельной заслонки',
    pid: '0x0111',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-001',
  },
  {
    id: 'maf',
    name: 'Расход воздуха (MAF)',
    pid: '0x0110',
    unit: 'г/с',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 655,
    group: 'GMB-002',
  },
  {
    id: 'map',
    name: 'Давление во впускном коллекторе (MAP)',
    pid: '0x010B',
    unit: 'кПа',
    formula: 'A',
    min: 0,
    max: 255,
    group: 'GMB-002',
  },
  {
    id: 'lambda_b1s1',
    name: 'Лямбда-зонд B1S1 (широкополосный)',
    pid: '0x0244',
    unit: 'λ',
    formula: '((A * 256 + B) / 32768) * 2',
    min: 0.5,
    max: 2.0,
    group: 'GMB-003',
  },
  {
    id: 'lambda_b1s2',
    name: 'Лямбда-зонд B1S2 (нагревательный)',
    pid: '0x0245',
    unit: 'В',
    formula: '(A * 256 + B) / 200',
    min: 0.0,
    max: 1.275,
    group: 'GMB-003',
  },
  {
    id: 'stft_b1',
    name: 'Кратковременная коррекция топлива B1 (STFT)',
    pid: '0x0106',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'GMB-003',
  },
  {
    id: 'ltft_b1',
    name: 'Долгосрочная коррекция топлива B1 (LTFT)',
    pid: '0x0107',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'GMB-003',
  },
  {
    id: 'fuel_pressure',
    name: 'Давление топлива в рампе',
    pid: '0x0123',
    unit: 'МПа',
    formula: '(A * 256 + B) * 0.079',
    min: 0,
    max: 65,
    group: 'GMB-004',
  },
  {
    id: 'fuel_pressure_low',
    name: 'Давление топлива (низкое давление)',
    pid: '0x012A',
    unit: 'бар',
    formula: '(A * 256 + B) / 40',
    min: 0,
    max: 10,
    group: 'GMB-004',
  },
  {
    id: 'timing_advance',
    name: 'Угол опережения зажигания',
    pid: '0x010E',
    unit: '° КВВМТ',
    formula: 'A / 2 - 64',
    min: -64,
    max: 63.5,
    group: 'GMB-005',
  },
  {
    id: 'boost_pressure',
    name: 'Давление наддува (факт.)',
    pid: '0x010F',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 2500,
    group: 'GMB-005',
  },
  {
    id: 'boost_pressure_setpoint',
    name: 'Давление наддува (уставка)',
    pid: '0x0210',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 2500,
    group: 'GMB-005',
  },
  {
    id: 'egr_valve',
    name: 'Положение клапана ЕGR',
    pid: '0x0212',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-006',
  },
  {
    id: 'egr_setpoint',
    name: 'Уставка клапана EGR',
    pid: '0x0213',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-006',
  },
  {
    id: 'intake_air_temp',
    name: 'Температура воздуха на впуске',
    pid: '0x010F',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 120,
    group: 'GMB-002',
  },
  {
    id: 'engine_load',
    name: 'Расчётная нагрузка двигателя',
    pid: '0x0104',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-001',
  },
  {
    id: 'oil_temp',
    name: 'Температура масла двигателя',
    pid: '0x015C',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 150,
    group: 'GMB-007',
  },
  {
    id: 'battery_voltage',
    name: 'Напряжение бортовой сети',
    pid: '0x0142',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 9.0,
    max: 15.5,
    group: 'GMB-007',
  },
  {
    id: 'vehicle_speed',
    name: 'Скорость автомобиля',
    pid: '0x010D',
    unit: 'км/ч',
    formula: 'A',
    min: 0,
    max: 255,
    group: 'GMB-001',
  },
  {
    id: 'injector_pw_1',
    name: 'Длительность впрыска форсунка 1',
    pid: '0x0230',
    unit: 'мс',
    formula: '(A * 256 + B) / 1000',
    min: 0,
    max: 30,
    group: 'GMB-008',
  },
  {
    id: 'knock_retard_b1',
    name: 'Угол коррекции по детонации B1',
    pid: '0x0232',
    unit: '°',
    formula: 'A / 2 - 64',
    min: -20,
    max: 0,
    group: 'GMB-005',
  },
  {
    id: 'turbo_vane_pos',
    name: 'Положение лопаток турбины ВГТ',
    pid: '0x0240',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-005',
  },
  {
    id: 'swirl_flap_pos',
    name: 'Положение вихревых заслонок',
    pid: '0x0245',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'GMB-006',
  },
];

// ── Параметры живых данных АКПП DSG ──────────────────────────────────────────

const dsgLiveParams: EcuParam[] = [
  {
    id: 'dsg_oil_temp',
    name: 'Температура масла DSG',
    pid: '0x0201',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'DSG-001',
  },
  {
    id: 'dsg_gear',
    name: 'Текущая передача',
    pid: '0x0202',
    unit: '',
    formula: 'A',
    min: 0,
    max: 7,
    group: 'DSG-001',
  },
  {
    id: 'dsg_target_gear',
    name: 'Целевая передача',
    pid: '0x0203',
    unit: '',
    formula: 'A',
    min: 0,
    max: 7,
    group: 'DSG-001',
  },
  {
    id: 'dsg_clutch1_temp',
    name: 'Температура сцепления K1 (нечётные)',
    pid: '0x0204',
    unit: '°C',
    formula: '(A * 256 + B) - 100',
    min: -40,
    max: 300,
    group: 'DSG-002',
  },
  {
    id: 'dsg_clutch2_temp',
    name: 'Температура сцепления K2 (чётные)',
    pid: '0x0205',
    unit: '°C',
    formula: '(A * 256 + B) - 100',
    min: -40,
    max: 300,
    group: 'DSG-002',
  },
  {
    id: 'dsg_input_rpm',
    name: 'Обороты входного вала DSG',
    pid: '0x0206',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 8000,
    group: 'DSG-001',
  },
  {
    id: 'dsg_output_rpm',
    name: 'Обороты выходного вала DSG',
    pid: '0x0207',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 6000,
    group: 'DSG-001',
  },
  {
    id: 'dsg_selector_pos',
    name: 'Положение селектора АКПП',
    pid: '0x0208',
    unit: '',
    formula: 'A',
    min: 0,
    max: 8,
    group: 'DSG-001',
  },
  {
    id: 'dsg_clutch1_pressure',
    name: 'Давление в K1',
    pid: '0x0209',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 20,
    group: 'DSG-002',
  },
  {
    id: 'dsg_clutch2_pressure',
    name: 'Давление в K2',
    pid: '0x020A',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 20,
    group: 'DSG-002',
  },
  {
    id: 'dsg_torque_req',
    name: 'Запрос момента от АКПП',
    pid: '0x020B',
    unit: 'Нм',
    formula: '(A * 256 + B) - 3276',
    min: -500,
    max: 500,
    group: 'DSG-003',
  },
  {
    id: 'dsg_slip_k1',
    name: 'Скольжение сцепления K1',
    pid: '0x020C',
    unit: 'об/мин',
    formula: '(A * 256 + B) - 3276',
    min: -500,
    max: 500,
    group: 'DSG-002',
  },
];

// ── Параметры живых данных ABS/ESP ───────────────────────────────────────────

const absLiveParams: EcuParam[] = [
  {
    id: 'wheel_speed_fl',
    name: 'Скорость колеса: передн. левое',
    pid: '0x03A1',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ABS-001',
  },
  {
    id: 'wheel_speed_fr',
    name: 'Скорость колеса: передн. правое',
    pid: '0x03A2',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ABS-001',
  },
  {
    id: 'wheel_speed_rl',
    name: 'Скорость колеса: задн. левое',
    pid: '0x03A3',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ABS-001',
  },
  {
    id: 'wheel_speed_rr',
    name: 'Скорость колеса: задн. правое',
    pid: '0x03A4',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ABS-001',
  },
  {
    id: 'lateral_accel',
    name: 'Боковое ускорение (G-сенсор)',
    pid: '0x03A5',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'ABS-002',
  },
  {
    id: 'longitudinal_accel',
    name: 'Продольное ускорение',
    pid: '0x03A6',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'ABS-002',
  },
  {
    id: 'yaw_rate',
    name: 'Угловая скорость рыскания (Yaw Rate)',
    pid: '0x03A7',
    unit: '°/с',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -150,
    max: 150,
    group: 'ABS-002',
  },
  {
    id: 'steering_angle',
    name: 'Угол поворота рулевого колеса',
    pid: '0x03A8',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'ABS-003',
  },
  {
    id: 'brake_pressure',
    name: 'Давление в тормозной системе',
    pid: '0x03A9',
    unit: 'бар',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 250,
    group: 'ABS-003',
  },
  {
    id: 'abs_active',
    name: 'Активность ABS',
    pid: '0x03AA',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'ABS-001',
  },
  {
    id: 'esp_active',
    name: 'Активность ESP',
    pid: '0x03AB',
    unit: '',
    formula: '(A >> 1) & 0x01',
    min: 0,
    max: 1,
    group: 'ABS-001',
  },
];

// ── Параметры живых данных EPS ────────────────────────────────────────────────

const epsLiveParams: EcuParam[] = [
  {
    id: 'eps_steering_angle',
    name: 'Угол рулевого вала (EPS)',
    pid: '0x44A1',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'EPS-001',
  },
  {
    id: 'eps_torque_driver',
    name: 'Момент на рулевом колесе (водитель)',
    pid: '0x44A2',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -20,
    max: 20,
    group: 'EPS-001',
  },
  {
    id: 'eps_torque_assist',
    name: 'Момент усилителя EPS',
    pid: '0x44A3',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -50,
    max: 50,
    group: 'EPS-001',
  },
  {
    id: 'eps_motor_current',
    name: 'Ток электродвигателя EPS',
    pid: '0x44A4',
    unit: 'А',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -80,
    max: 80,
    group: 'EPS-002',
  },
  {
    id: 'eps_motor_temp',
    name: 'Температура электродвигателя EPS',
    pid: '0x44A5',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 150,
    group: 'EPS-002',
  },
  {
    id: 'eps_supply_voltage',
    name: 'Напряжение питания EPS',
    pid: '0x44A6',
    unit: 'В',
    formula: '(A * 256 + B) / 100',
    min: 9,
    max: 16,
    group: 'EPS-002',
  },
];

// ── Параметры живых данных климат-контроля ────────────────────────────────────

const climateLiveParams: EcuParam[] = [
  {
    id: 'evap_temp',
    name: 'Температура испарителя',
    pid: '0x08A1',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 40,
    group: 'CLIM-001',
  },
  {
    id: 'cabin_temp_set',
    name: 'Заданная температура салона',
    pid: '0x08A2',
    unit: '°C',
    formula: 'A / 2',
    min: 16,
    max: 30,
    group: 'CLIM-001',
  },
  {
    id: 'cabin_temp_actual',
    name: 'Фактическая температура салона',
    pid: '0x08A3',
    unit: '°C',
    formula: 'A - 40',
    min: -20,
    max: 60,
    group: 'CLIM-001',
  },
  {
    id: 'ambient_temp',
    name: 'Температура наружного воздуха',
    pid: '0x08A4',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 60,
    group: 'CLIM-001',
  },
  {
    id: 'blend_flap_driver',
    name: 'Положение смесительной заслонки (водит.)',
    pid: '0x08A5',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'CLIM-002',
  },
  {
    id: 'blend_flap_pass',
    name: 'Положение смесительной заслонки (пасс.)',
    pid: '0x08A6',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'CLIM-002',
  },
  {
    id: 'compressor_state',
    name: 'Состояние компрессора A/C',
    pid: '0x08A7',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'CLIM-003',
  },
  {
    id: 'ac_high_pressure',
    name: 'Давление в системе A/C (высокое)',
    pid: '0x08A8',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 35,
    group: 'CLIM-003',
  },
  {
    id: 'blower_speed',
    name: 'Скорость вентилятора печки',
    pid: '0x08A9',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'CLIM-002',
  },
  {
    id: 'coolant_temp_heater',
    name: 'Температура ОЖ (теплообменник)',
    pid: '0x08AA',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 130,
    group: 'CLIM-001',
  },
];

// ── Параметры живых данных Haldex 4Motion ────────────────────────────────────

const haldexLiveParams: EcuParam[] = [
  {
    id: 'haldex_clutch_torque',
    name: 'Момент муфты Haldex',
    pid: '0x22A1',
    unit: 'Нм',
    formula: '(A * 256 + B) / 4',
    min: 0,
    max: 1500,
    group: 'HAL-001',
  },
  {
    id: 'haldex_clutch_slip',
    name: 'Скольжение муфты Haldex',
    pid: '0x22A2',
    unit: 'об/мин',
    formula: '(A * 256 + B) - 3276',
    min: -500,
    max: 500,
    group: 'HAL-001',
  },
  {
    id: 'haldex_oil_temp',
    name: 'Температура масла Haldex',
    pid: '0x22A3',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'HAL-002',
  },
  {
    id: 'haldex_pump_duty',
    name: 'Скважность насоса Haldex',
    pid: '0x22A4',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'HAL-001',
  },
  {
    id: 'haldex_input_speed',
    name: 'Скорость входного вала Haldex',
    pid: '0x22A5',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 6000,
    group: 'HAL-001',
  },
  {
    id: 'haldex_output_speed',
    name: 'Скорость выходного вала Haldex',
    pid: '0x22A6',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 6000,
    group: 'HAL-001',
  },
];

// ── Определения блоков управления ─────────────────────────────────────────────

const engineEcu: EcuDefinition = {
  id: 'ecm',
  name: 'Блок управления двигателем (ECM/ME)',
  address: '0x01',
  protocol: 'KWP2000/ISO-TP CAN',
  description: 'Основной блок управления двигателем. Управляет впрыском, зажиганием, наддувом, EGR и системой нейтрализации отработавших газов.',
  functions: [
    {
      id: 'ecm_read_dtc',
      name: 'Считать коды неисправностей',
      type: 'read_dtc',
      description: 'Считывает все активные и сохранённые коды неисправностей (P-коды) из памяти блока управления двигателем.',
      protocol_cmd: '03',
    },
    {
      id: 'ecm_clear_dtc',
      name: 'Стереть коды неисправностей',
      type: 'clear_dtc',
      description: 'Удаляет все коды неисправностей из памяти блока управления двигателем. Также сбрасывает флаги готовности (readiness monitors).',
      protocol_cmd: '04',
      warning: 'После стирания кодов необходимо выполнить ездовой цикл для прохождения мониторов готовности OBD.',
    },
    {
      id: 'ecm_live_data',
      name: 'Текущие параметры (Живые данные)',
      type: 'live_data',
      description: 'Отображает текущие значения параметров работы двигателя в режиме реального времени через группы измерительных блоков (GMB).',
      protocol_cmd: '21 XX',
      params: engineLiveParams,
    },
    {
      id: 'ecm_throttle_adaptation',
      name: 'Адаптация дроссельной заслонки',
      type: 'adaptation',
      description: 'Выполняет базовые настройки дроссельной заслонки: обучение крайних положений (полностью открыто/закрыто) и режима холостого хода.',
      protocol_cmd: '10 03 28 00 00',
      warning: 'Двигатель должен быть прогрет до рабочей температуры. Выключить кондиционер и все мощные потребители.',
    },
    {
      id: 'ecm_idle_adaptation',
      name: 'Адаптация холостого хода',
      type: 'adaptation',
      description: 'Адаптирует блок управления к условиям холостого хода: обороты ХХ, подача воздуха на ХХ. Рекомендуется после чистки дросселя или замены РХХ.',
      protocol_cmd: '10 03 28 10 00',
      warning: 'Перед адаптацией убедитесь, что двигатель прогрет, все дополнительные нагрузки отключены.',
    },
    {
      id: 'ecm_injector_test',
      name: 'Тест форсунок (активация)',
      type: 'activation',
      description: 'Активация форсунок по одной для проверки их работоспособности и характеристик распыла. Позволяет выявить залипание или засорение.',
      protocol_cmd: '30 01 0A 0B 0C',
      warning: 'Выполнять при выключенном двигателе во избежание попадания топлива в цилиндры.',
    },
    {
      id: 'ecm_lambda_test',
      name: 'Тест лямбда-зондов',
      type: 'activation',
      description: 'Принудительная активация нагревателей лямбда-зондов и проверка сигналов B1S1/B1S2 в различных режимах работы двигателя.',
      protocol_cmd: '30 03 0E 0F',
    },
    {
      id: 'ecm_egr_test',
      name: 'Тест клапана EGR',
      type: 'activation',
      description: 'Принудительное открытие и закрытие клапана рециркуляции отработавших газов (EGR) для проверки его механической и электрической исправности.',
      protocol_cmd: '30 04 12',
      warning: 'Выполнять при прогретом двигателе на холостом ходу.',
    },
    {
      id: 'ecm_swirl_flap_test',
      name: 'Тест вихревых заслонок впуска',
      type: 'activation',
      description: 'Принудительное управление вихревыми заслонками (Swirl Flaps) для проверки приводов и механической части.',
      protocol_cmd: '30 05 13',
      warning: 'Применимо только для дизельных двигателей. Проверить отсутствие шума и клина.',
    },
    {
      id: 'ecm_oil_reset',
      name: 'Сброс интервала замены масла',
      type: 'service',
      description: 'Сброс счётчика интервала технического обслуживания по замене моторного масла (сервисная индикация WIV/INSP).',
      protocol_cmd: '31 01 A0 00',
    },
  ],
};

const dsgEcu: EcuDefinition = {
  id: 'tcm',
  name: 'Блок управления АКПП (DSG/TCM)',
  address: '0x02',
  protocol: 'KWP2000/ISO-TP CAN',
  description: 'Блок управления роботизированной коробкой передач DSG (DQ200 7-ступ. / DQ250 6-ступ. / DQ381 7-ступ.). Управляет переключением передач, сцеплениями и гидравликой.',
  functions: [
    {
      id: 'tcm_read_dtc',
      name: 'Считать коды неисправностей АКПП',
      type: 'read_dtc',
      description: 'Считывает все активные и сохранённые коды неисправностей блока управления коробкой передач DSG.',
      protocol_cmd: '03',
    },
    {
      id: 'tcm_clear_dtc',
      name: 'Стереть коды неисправностей АКПП',
      type: 'clear_dtc',
      description: 'Удаляет все коды неисправностей из памяти блока управления АКПП.',
      protocol_cmd: '04',
      warning: 'После стирания необходимо выполнить проверочную поездку в различных режимах для подтверждения устранения неисправности.',
    },
    {
      id: 'tcm_live_data',
      name: 'Текущие параметры DSG',
      type: 'live_data',
      description: 'Отображает рабочие параметры коробки передач в режиме реального времени: температуры, давления, обороты.',
      protocol_cmd: '21 XX',
      params: dsgLiveParams,
    },
    {
      id: 'tcm_dsg_basic_settings',
      name: 'Базовые настройки DSG (BSG)',
      type: 'adaptation',
      description: 'Выполнение процедуры базовых настроек блока DSG: обучение точек касания сцеплений K1/K2, давлений заполнения и характеристик переключения.',
      protocol_cmd: '10 03 3C 00 00',
      warning: 'Строго следовать процедуре VAG: двигатель прогрет, педаль тормоза нажата, селектор в положении P. Процедура занимает до 10 минут.',
    },
    {
      id: 'tcm_clutch_adaptation',
      name: 'Адаптация сцеплений DSG',
      type: 'adaptation',
      description: 'Индивидуальная адаптация точек касания сцеплений K1 (нечётные передачи) и K2 (чётные передачи) для устранения рывков и пробуксовки.',
      protocol_cmd: '10 03 3D 01 00',
      warning: 'Требуется специализированный стенд или строгое соблюдение протокола адаптации. Неправильно выполненная адаптация может повредить сцепления.',
    },
    {
      id: 'tcm_oil_reset',
      name: 'Сброс интервала масла DSG',
      type: 'service',
      description: 'Сброс счётчика интервала замены масла в коробке передач DSG (масло DSG рассчитано на 60 000 км при обычных условиях).',
      protocol_cmd: '31 01 B0 00',
    },
    {
      id: 'tcm_selector_adaptation',
      name: 'Адаптация механизма выбора передач',
      type: 'adaptation',
      description: 'Обучение датчика положения селектора и механизма переключения передач после замены или ремонта.',
      protocol_cmd: '10 03 3E 02 00',
      warning: 'Выполнять только после замены или разборки механизма выбора передач.',
    },
  ],
};

const absEcu: EcuDefinition = {
  id: 'abs_esp',
  name: 'Блок ABS/ESP (Bosch ESP 9.x / MK100)',
  address: '0x03',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления антиблокировочной системой тормозов (ABS) и системой курсовой устойчивости (ESP). Отвечает за активную безопасность.',
  functions: [
    {
      id: 'abs_read_dtc',
      name: 'Считать коды неисправностей ABS/ESP',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока ABS/ESP: датчики скорости колёс, G-сенсор, датчик рыскания, ГТЦ, насос ABS.',
      protocol_cmd: '03',
    },
    {
      id: 'abs_clear_dtc',
      name: 'Стереть коды неисправностей ABS/ESP',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока ABS/ESP.',
      protocol_cmd: '04',
    },
    {
      id: 'abs_live_data',
      name: 'Текущие параметры ABS/ESP',
      type: 'live_data',
      description: 'Отображение скоростей колёс, параметров G-сенсора, угла рыскания и состояния систем ABS/ESP в реальном времени.',
      protocol_cmd: '21 XX',
      params: absLiveParams,
    },
    {
      id: 'abs_brake_bleed',
      name: 'Прокачка тормозов (с активацией насоса ABS)',
      type: 'activation',
      description: 'Активация насоса ABS для прокачки тормозной системы и блока гидравлического модулятора ABS. Позволяет удалить воздух из системы без ручной прокачки.',
      protocol_cmd: '30 06 14',
      warning: 'Требуется помощник. Уровень тормозной жидкости должен быть выше минимума. Не допускать осушения бачка ГТЦ!',
    },
    {
      id: 'abs_sas_calibration',
      name: 'Калибровка датчика угла поворота руля (SAS)',
      type: 'adaptation',
      description: 'Выполнение калибровки датчика угла поворота рулевого колеса после ремонта рулевого управления, замены ступицы или регулировки сход-развала.',
      protocol_cmd: '10 03 40 00 00',
      warning: 'Автомобиль должен стоять на ровной горизонтальной поверхности. Рулевое колесо установить прямо (колёса прямо).',
    },
    {
      id: 'abs_esp_basic_settings',
      name: 'Базовые настройки ESP',
      type: 'adaptation',
      description: 'Калибровка нулевых точек датчиков ускорения и рыскания. Выполняется после замены блока ESP или длительного хранения автомобиля.',
      protocol_cmd: '10 03 41 00 00',
      warning: 'Автомобиль должен быть неподвижен на ровной поверхности. Не допускать вибрации и движения в процессе калибровки.',
    },
    {
      id: 'abs_brake_pad_reset',
      name: 'Сброс датчиков износа тормозных колодок',
      type: 'service',
      description: 'Сброс сервисного предупреждения об износе тормозных колодок после замены колодок.',
      protocol_cmd: '31 01 C0 00',
    },
    {
      id: 'abs_g_sensor_calibration',
      name: 'Калибровка G-сенсора',
      type: 'adaptation',
      description: 'Калибровка датчика продольных и поперечных ускорений. Выполняется после замены блока ABS/ESP или при наличии ошибок G-сенсора.',
      protocol_cmd: '10 03 42 00 00',
      warning: 'Автомобиль должен стоять неподвижно на ровной горизонтальной поверхности.',
    },
  ],
};

const airbagEcu: EcuDefinition = {
  id: 'srs',
  name: 'Блок управления подушками безопасности (SRS/Airbag)',
  address: '0x15',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления системой пассивной безопасности: подушки безопасности (фронтальные, боковые, шторки), преднатяжители ремней, датчики удара.',
  functions: [
    {
      id: 'srs_read_dtc',
      name: 'Считать коды неисправностей SRS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока SRS: состояние датчиков удара, пиропатронов, блока питания, шлейфа руля.',
      protocol_cmd: '03',
    },
    {
      id: 'srs_clear_dtc',
      name: 'Стереть коды неисправностей SRS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока SRS. Не стирает данные о срабатывании подушек.',
      protocol_cmd: '04',
      warning: 'Перед стиранием кодов устранить все причины неисправностей. Ложное срабатывание или повреждение компонентов SRS может привести к гибели людей.',
    },
    {
      id: 'srs_live_data',
      name: 'Текущие параметры SRS',
      type: 'live_data',
      description: 'Состояние датчиков удара, напряжение питания, статус компонентов системы.',
      protocol_cmd: '21 XX',
    },
    {
      id: 'srs_crash_data_read',
      name: 'Чтение данных о ДТП (Crash Data)',
      type: 'service',
      description: 'Считывание записанных параметров на момент срабатывания SRS: скорость, ускорения, состояние ремней. Данные не стираются обычными процедурами.',
      protocol_cmd: '19 02 FF',
      warning: 'Crash Data записываются только при срабатывании системы. Стирание Crash Data требует специальной авторизованной процедуры VAG.',
    },
  ],
};

const kombiEcu: EcuDefinition = {
  id: 'kombi',
  name: 'Щиток приборов (KI / KOMBI)',
  address: '0x17',
  protocol: 'ISO-TP CAN',
  description: 'Комбинация приборов. Отображает информацию водителю: скорость, обороты, топливо, температуры. Хранит пробег и данные техобслуживания.',
  functions: [
    {
      id: 'kombi_read_dtc',
      name: 'Считать коды неисправностей KI',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей щитка приборов: дисплей, датчики, коммуникация CAN.',
      protocol_cmd: '03',
    },
    {
      id: 'kombi_clear_dtc',
      name: 'Стереть коды неисправностей KI',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти щитка приборов.',
      protocol_cmd: '04',
    },
    {
      id: 'kombi_service_reset',
      name: 'Сброс сервисного интервала (WIV)',
      type: 'service',
      description: 'Сброс индикатора сервисного интервала (WIV — Wartungsintervallverlängerung) в щитке приборов. Выполняется после прохождения ТО.',
      protocol_cmd: '31 01 A0 00',
      warning: 'Убедитесь, что техническое обслуживание фактически выполнено перед сбросом индикатора.',
    },
    {
      id: 'kombi_oil_reset',
      name: 'Сброс индикатора замены масла',
      type: 'service',
      description: 'Сброс отдельного счётчика интервала замены моторного масла на щитке приборов.',
      protocol_cmd: '31 01 A1 00',
    },
    {
      id: 'kombi_coding',
      name: 'Кодирование щитка приборов',
      type: 'coding',
      description: 'Изменение параметров кодирования щитка: единицы измерения (км/миля), опции отображения, активация скрытых функций.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Изменение кодирования может привести к некорректной работе щитка. Рекомендуется сохранить текущее кодирование перед изменением.',
    },
    {
      id: 'kombi_hidden_menu',
      name: 'Активация скрытого меню технического блока',
      type: 'activation',
      description: 'Активация расширенного технического меню щитка приборов для просмотра диагностических параметров непосредственно на дисплее автомобиля.',
      protocol_cmd: '2E C0 03 00',
    },
  ],
};

const epbEcu: EcuDefinition = {
  id: 'epb',
  name: 'Электрический стояночный тормоз (EPB)',
  address: '0x35',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления электрическим стояночным тормозом. Управляет электромоторами суппортов задних тормозных механизмов.',
  functions: [
    {
      id: 'epb_read_dtc',
      name: 'Считать коды неисправностей EPB',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока EPB: электромоторы, датчики, управляющий модуль.',
      protocol_cmd: '03',
    },
    {
      id: 'epb_clear_dtc',
      name: 'Стереть коды неисправностей EPB',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EPB.',
      protocol_cmd: '04',
    },
    {
      id: 'epb_brake_service_mode',
      name: 'Сервисный режим EPB (для замены колодок)',
      type: 'service',
      description: 'Отводит поршни суппортов задних тормозных механизмов в исходное положение для замены тормозных колодок. Блокирует работу EPB на время обслуживания.',
      protocol_cmd: '31 01 E0 00',
      warning: 'ВАЖНО: Включить режим обслуживания ПЕРЕД снятием колёс. После замены колодок обязательно деактивировать сервисный режим и выполнить адаптацию.',
    },
    {
      id: 'epb_brake_adapt',
      name: 'Адаптация EPB после замены колодок',
      type: 'adaptation',
      description: 'Выполняет базовые настройки EPB после замены тормозных колодок: обучение хода поршней суппортов и усилия зажатия.',
      protocol_cmd: '10 03 E1 00 00',
      warning: 'Выполнять после установки новых тормозных колодок и сборки тормозных механизмов.',
    },
  ],
};

const epsEcu: EcuDefinition = {
  id: 'eps',
  name: 'Электроусилитель руля (EPS)',
  address: '0x44',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления электрическим усилителем рулевого управления. Регулирует усилие на руле в зависимости от скорости и нагрузки.',
  functions: [
    {
      id: 'eps_read_dtc',
      name: 'Считать коды неисправностей EPS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока EPS: датчик момента, электродвигатель, датчик угла поворота, блок питания.',
      protocol_cmd: '03',
    },
    {
      id: 'eps_clear_dtc',
      name: 'Стереть коды неисправностей EPS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EPS.',
      protocol_cmd: '04',
    },
    {
      id: 'eps_live_data',
      name: 'Текущие параметры EPS',
      type: 'live_data',
      description: 'Угол поворота руля, момент водителя, ток электродвигателя, температура EPS в режиме реального времени.',
      protocol_cmd: '21 XX',
      params: epsLiveParams,
    },
    {
      id: 'eps_calibration',
      name: 'Калибровка нулевого положения EPS',
      type: 'adaptation',
      description: 'Калибровка датчика нулевого положения рулевого вала. Выполняется после замены блока EPS, рулевой рейки или рулевого вала.',
      protocol_cmd: '10 03 44 00 00',
      warning: 'Автомобиль должен стоять с прямо установленными колёсами. Не поворачивать руль в процессе калибровки.',
    },
    {
      id: 'eps_torque_adjustment',
      name: 'Регулировка усилия на руле',
      type: 'adaptation',
      description: 'Корректировка характеристик усилия рулевого управления (адаптация под предпочтения водителя или требования производителя).',
      protocol_cmd: '2E 44 F0 XX',
      warning: 'Изменение характеристики усиления может негативно повлиять на управляемость. Только для специалистов.',
    },
  ],
};

const climateEcu: EcuDefinition = {
  id: 'climatronic',
  name: 'Климат-контроль (Climatronic)',
  address: '0x08',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления системой автоматического климат-контроля (Climatronic). Управляет вентилятором, заслонками, компрессором кондиционера.',
  functions: [
    {
      id: 'clim_read_dtc',
      name: 'Считать коды неисправностей климат-контроля',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока климат-контроля: датчики температуры, датчики положения заслонок, компрессор, вентилятор.',
      protocol_cmd: '03',
    },
    {
      id: 'clim_clear_dtc',
      name: 'Стереть коды неисправностей климат-контроля',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока климат-контроля.',
      protocol_cmd: '04',
    },
    {
      id: 'clim_live_data',
      name: 'Текущие параметры климат-контроля',
      type: 'live_data',
      description: 'Температуры, положения заслонок, состояние компрессора и вентилятора в реальном времени.',
      protocol_cmd: '21 XX',
      params: climateLiveParams,
    },
    {
      id: 'clim_basic_settings',
      name: 'Базовые настройки климат-контроля',
      type: 'adaptation',
      description: 'Калибровка датчиков положения заслонок и сервоприводов. Выполняется после замены блока или сервоприводов заслонок.',
      protocol_cmd: '10 03 08 00 00',
    },
    {
      id: 'clim_filter_reset',
      name: 'Сброс индикатора замены салонного фильтра',
      type: 'service',
      description: 'Сброс счётчика интервала замены салонного фильтра (фильтра вентиляции). Выполняется после замены фильтра.',
      protocol_cmd: '31 01 08 A0',
    },
  ],
};

const gatewayEcu: EcuDefinition = {
  id: 'gateway',
  name: 'Шлюз (Gateway / Diagnoseinterface)',
  address: '0x19',
  protocol: 'ISO-TP CAN',
  description: 'Центральный шлюз (Gateway). Обеспечивает связь между шинами CAN (Antrieb, Komfort, Infotainment) и диагностическим разъёмом OBD-II.',
  functions: [
    {
      id: 'gw_read_dtc',
      name: 'Считать коды неисправностей шлюза',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей шлюза: ошибки шин CAN, ошибки связи между блоками, неисправности питания.',
      protocol_cmd: '03',
    },
    {
      id: 'gw_clear_dtc',
      name: 'Стереть коды неисправностей шлюза',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти шлюза. Не влияет на коды в других блоках управления.',
      protocol_cmd: '04',
    },
  ],
};

const haldexEcu: EcuDefinition = {
  id: 'haldex',
  name: 'Блок управления Haldex 4Motion (4WD)',
  address: '0x22',
  protocol: 'ISO-TP CAN',
  description: 'Блок управления электронно-управляемой муфтой Haldex полного привода 4Motion. Регулирует распределение момента между осями.',
  functions: [
    {
      id: 'haldex_read_dtc',
      name: 'Считать коды неисправностей Haldex',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока Haldex 4Motion: насос, муфта, датчики давления и температуры.',
      protocol_cmd: '03',
    },
    {
      id: 'haldex_clear_dtc',
      name: 'Стереть коды неисправностей Haldex',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока Haldex.',
      protocol_cmd: '04',
    },
    {
      id: 'haldex_live_data',
      name: 'Текущие параметры Haldex 4Motion',
      type: 'live_data',
      description: 'Момент муфты, скольжение, температура масла, скважность насоса в реальном времени.',
      protocol_cmd: '21 XX',
      params: haldexLiveParams,
    },
    {
      id: 'haldex_oil_reset',
      name: 'Сброс интервала замены масла Haldex',
      type: 'service',
      description: 'Сброс счётчика интервала замены масла в муфте Haldex (рекомендуется каждые 60 000 км или 4 года).',
      protocol_cmd: '31 01 22 A0',
    },
    {
      id: 'haldex_adaptation',
      name: 'Адаптация муфты Haldex',
      type: 'adaptation',
      description: 'Выполнение процедуры адаптации муфты Haldex после замены масла или механических компонентов: обучение характеристик насоса и давлений.',
      protocol_cmd: '10 03 22 01 00',
      warning: 'Выполнять на ровной площадке. Прогреть муфту перед адаптацией (несколько разгонов с пробуксовкой).',
    },
  ],
};

// ── Функция формирования набора ЭБУ для модели ───────────────────────────────

function buildStandardEcus(options?: { hasEpb?: boolean; hasHaldex?: boolean }): EcuDefinition[] {
  const ecus: EcuDefinition[] = [
    engineEcu,
    dsgEcu,
    absEcu,
    airbagEcu,
    kombiEcu,
    epsEcu,
    climateEcu,
    gatewayEcu,
  ];
  if (options?.hasEpb) ecus.push(epbEcu);
  if (options?.hasHaldex) ecus.push(haldexEcu);
  return ecus;
}

// ── Описание моделей Volkswagen ───────────────────────────────────────────────

const golfMk7: ModelDefinition = {
  id: 'golf_mk7',
  name: 'Golf VII (MK7)',
  years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
  platform: 'MQB A0/A1',
  ecus: buildStandardEcus({ hasEpb: true }),
};

const golfMk8: ModelDefinition = {
  id: 'golf_mk8',
  name: 'Golf VIII (MK8)',
  years: [2020, 2021, 2022, 2023, 2024],
  platform: 'MQB evo',
  ecus: buildStandardEcus({ hasEpb: true }),
};

const passatB8: ModelDefinition = {
  id: 'passat_b8',
  name: 'Passat B8',
  years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'MQB B',
  ecus: buildStandardEcus({ hasEpb: true }),
};

const tiguanII: ModelDefinition = {
  id: 'tiguan_ii',
  name: 'Tiguan II (AD1)',
  years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'MQB A1',
  ecus: buildStandardEcus({ hasEpb: true, hasHaldex: true }),
};

const poloVI: ModelDefinition = {
  id: 'polo_vi',
  name: 'Polo VI (AW)',
  years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'MQB A0',
  ecus: buildStandardEcus({ hasEpb: false }),
};

// ── Экспорт базы данных Volkswagen ────────────────────────────────────────────

const vwDB: MakeDB = {
  id: 'vw',
  name: 'Volkswagen',
  region: 'EU',
  protocol_family: 'VAG KWP2000 / UDS over ISO-TP CAN',
  models: [golfMk7, golfMk8, passatB8, tiguanII, poloVI],
};

export default vwDB;
