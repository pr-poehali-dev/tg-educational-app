// ── BMW ECU Database ──────────────────────────────────────────────────────────
// Полная база данных блоков управления для диагностики автомобилей BMW

export interface EcuParam {
  id: string;
  name: string;
  pid?: string;
  unit: string;
  formula?: string;
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

// ── Живые данные DME (двигатель) ─────────────────────────────────────────────

const dmeLiveParams: EcuParam[] = [
  {
    id: 'rpm',
    name: 'Обороты двигателя',
    pid: '0x1201',
    unit: 'об/мин',
    formula: '(A * 256 + B) / 4',
    min: 0,
    max: 8000,
    group: 'DME-001',
  },
  {
    id: 'coolant_temp',
    name: 'Температура охлаждающей жидкости',
    pid: '0x1202',
    unit: '°C',
    formula: 'A - 48',
    min: -48,
    max: 134,
    group: 'DME-001',
  },
  {
    id: 'oil_temp',
    name: 'Температура моторного масла',
    pid: '0x1203',
    unit: '°C',
    formula: 'A - 48',
    min: -48,
    max: 170,
    group: 'DME-001',
  },
  {
    id: 'throttle_pos',
    name: 'Положение педали акселератора',
    pid: '0x1204',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'DME-001',
  },
  {
    id: 'engine_load',
    name: 'Нагрузка двигателя',
    pid: '0x1205',
    unit: '%',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 100,
    group: 'DME-001',
  },
  {
    id: 'boost_actual',
    name: 'Давление наддува (факт.)',
    pid: '0x1206',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 3200,
    group: 'DME-002',
  },
  {
    id: 'boost_desired',
    name: 'Давление наддува (уставка)',
    pid: '0x1207',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 3200,
    group: 'DME-002',
  },
  {
    id: 'vanos_intake',
    name: 'Угол фазовращателя VANOS впуск (факт.)',
    pid: '0x1208',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'DME-003',
  },
  {
    id: 'vanos_exhaust',
    name: 'Угол фазовращателя VANOS выпуск (факт.)',
    pid: '0x1209',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'DME-003',
  },
  {
    id: 'vanos_intake_setpoint',
    name: 'Угол VANOS впуск (уставка)',
    pid: '0x120A',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'DME-003',
  },
  {
    id: 'vanos_exhaust_setpoint',
    name: 'Угол VANOS выпуск (уставка)',
    pid: '0x120B',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'DME-003',
  },
  {
    id: 'lambda_b1s1',
    name: 'Лямбда-зонд B1S1 (широкополосный)',
    pid: '0x120C',
    unit: 'λ',
    formula: '((A * 256 + B) / 32768) * 2',
    min: 0.5,
    max: 2.0,
    group: 'DME-004',
  },
  {
    id: 'lambda_b1s2',
    name: 'Лямбда-зонд B1S2 (управляющий)',
    pid: '0x120D',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 0,
    max: 1.275,
    group: 'DME-004',
  },
  {
    id: 'stft_b1',
    name: 'Кратковременная коррекция топлива B1',
    pid: '0x120E',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'DME-004',
  },
  {
    id: 'ltft_b1',
    name: 'Долгосрочная коррекция топлива B1',
    pid: '0x120F',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'DME-004',
  },
  {
    id: 'rail_pressure',
    name: 'Давление в топливной рампе',
    pid: '0x1210',
    unit: 'бар',
    formula: '(A * 256 + B) * 0.5',
    min: 0,
    max: 2200,
    group: 'DME-005',
  },
  {
    id: 'injection_qty',
    name: 'Цикловая подача топлива (дизель)',
    pid: '0x1211',
    unit: 'мг/цикл',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 100,
    group: 'DME-005',
  },
  {
    id: 'intake_air_temp',
    name: 'Температура воздуха на впуске',
    pid: '0x1212',
    unit: '°C',
    formula: 'A - 48',
    min: -48,
    max: 120,
    group: 'DME-002',
  },
  {
    id: 'ambient_temp',
    name: 'Температура наружного воздуха',
    pid: '0x1213',
    unit: '°C',
    formula: 'A - 48',
    min: -48,
    max: 60,
    group: 'DME-001',
  },
  {
    id: 'knock_v_cyl1',
    name: 'Напряжение датчика детонации, цил. 1',
    pid: '0x1214',
    unit: 'мВ',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 5000,
    group: 'DME-006',
  },
  {
    id: 'knock_v_cyl2',
    name: 'Напряжение датчика детонации, цил. 2',
    pid: '0x1215',
    unit: 'мВ',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 5000,
    group: 'DME-006',
  },
  {
    id: 'knock_v_cyl3',
    name: 'Напряжение датчика детонации, цил. 3',
    pid: '0x1216',
    unit: 'мВ',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 5000,
    group: 'DME-006',
  },
  {
    id: 'knock_v_cyl4',
    name: 'Напряжение датчика детонации, цил. 4',
    pid: '0x1217',
    unit: 'мВ',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 5000,
    group: 'DME-006',
  },
  {
    id: 'battery_voltage',
    name: 'Напряжение бортовой сети',
    pid: '0x1218',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 9.0,
    max: 15.5,
    group: 'DME-001',
  },
  {
    id: 'vehicle_speed',
    name: 'Скорость автомобиля',
    pid: '0x1219',
    unit: 'км/ч',
    formula: 'A',
    min: 0,
    max: 280,
    group: 'DME-001',
  },
  {
    id: 'maf',
    name: 'Массовый расход воздуха (MAF/HFM)',
    pid: '0x121A',
    unit: 'кг/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 1200,
    group: 'DME-002',
  },
];

// ── Живые данные EGS/SMG ─────────────────────────────────────────────────────

const egsLiveParams: EcuParam[] = [
  {
    id: 'egs_oil_temp',
    name: 'Температура масла АКПП',
    pid: '0x1801',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 175,
    group: 'EGS-001',
  },
  {
    id: 'egs_gear',
    name: 'Текущая передача',
    pid: '0x1802',
    unit: '',
    formula: 'A',
    min: 0,
    max: 8,
    group: 'EGS-001',
  },
  {
    id: 'egs_torque_input',
    name: 'Входной момент АКПП',
    pid: '0x1803',
    unit: 'Нм',
    formula: '(A * 256 + B) - 3000',
    min: -500,
    max: 700,
    group: 'EGS-002',
  },
  {
    id: 'egs_shift_speed',
    name: 'Скорость переключения передач',
    pid: '0x1804',
    unit: 'мс',
    formula: '(A * 256 + B)',
    min: 0,
    max: 1000,
    group: 'EGS-002',
  },
  {
    id: 'egs_selector',
    name: 'Положение рычага АКПП',
    pid: '0x1805',
    unit: '',
    formula: 'A',
    min: 0,
    max: 7,
    group: 'EGS-001',
  },
  {
    id: 'egs_line_pressure',
    name: 'Давление в главной магистрали АКПП',
    pid: '0x1806',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 25,
    group: 'EGS-002',
  },
];

// ── Живые данные DSC ──────────────────────────────────────────────────────────

const dscLiveParams: EcuParam[] = [
  {
    id: 'dsc_speed_fl',
    name: 'Скорость колеса: переднее левое',
    pid: '0x5601',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'DSC-001',
  },
  {
    id: 'dsc_speed_fr',
    name: 'Скорость колеса: переднее правое',
    pid: '0x5602',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'DSC-001',
  },
  {
    id: 'dsc_speed_rl',
    name: 'Скорость колеса: заднее левое',
    pid: '0x5603',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'DSC-001',
  },
  {
    id: 'dsc_speed_rr',
    name: 'Скорость колеса: заднее правое',
    pid: '0x5604',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'DSC-001',
  },
  {
    id: 'dsc_steering_angle',
    name: 'Угол поворота рулевого колеса',
    pid: '0x5605',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'DSC-002',
  },
  {
    id: 'dsc_lateral_accel',
    name: 'Поперечное ускорение (G-сенсор)',
    pid: '0x5606',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'DSC-002',
  },
  {
    id: 'dsc_yaw_rate',
    name: 'Угловая скорость рыскания',
    pid: '0x5607',
    unit: '°/с',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -150,
    max: 150,
    group: 'DSC-002',
  },
  {
    id: 'dsc_brake_pressure',
    name: 'Давление в тормозном контуре',
    pid: '0x5608',
    unit: 'бар',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 250,
    group: 'DSC-003',
  },
  {
    id: 'dsc_abs_active',
    name: 'Активность ABS',
    pid: '0x5609',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'DSC-001',
  },
  {
    id: 'dsc_dsc_active',
    name: 'Активность DSC',
    pid: '0x560A',
    unit: '',
    formula: '(A >> 1) & 0x01',
    min: 0,
    max: 1,
    group: 'DSC-001',
  },
];

// ── Живые данные EPS ──────────────────────────────────────────────────────────

const epsLiveParams: EcuParam[] = [
  {
    id: 'eps_angle',
    name: 'Угол рулевого вала EPS',
    pid: '0x6001',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'EPS-001',
  },
  {
    id: 'eps_assist_torque',
    name: 'Ассистирующий момент EPS',
    pid: '0x6002',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'EPS-001',
  },
  {
    id: 'eps_driver_torque',
    name: 'Момент водителя на руле',
    pid: '0x6003',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -20,
    max: 20,
    group: 'EPS-001',
  },
  {
    id: 'eps_motor_current',
    name: 'Ток электродвигателя EPS',
    pid: '0x6004',
    unit: 'А',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -80,
    max: 80,
    group: 'EPS-002',
  },
  {
    id: 'eps_motor_temp',
    name: 'Температура электродвигателя EPS',
    pid: '0x6005',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'EPS-002',
  },
];

// ── Живые данные EDC (электронные амортизаторы) ───────────────────────────────

const edcLiveParams: EcuParam[] = [
  {
    id: 'edc_height_fl',
    name: 'Высота кузова: переднее левое',
    pid: '0xA001',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -100,
    max: 100,
    group: 'EDC-001',
  },
  {
    id: 'edc_height_fr',
    name: 'Высота кузова: переднее правое',
    pid: '0xA002',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -100,
    max: 100,
    group: 'EDC-001',
  },
  {
    id: 'edc_height_rl',
    name: 'Высота кузова: заднее левое',
    pid: '0xA003',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -100,
    max: 100,
    group: 'EDC-001',
  },
  {
    id: 'edc_height_rr',
    name: 'Высота кузова: заднее правое',
    pid: '0xA004',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -100,
    max: 100,
    group: 'EDC-001',
  },
  {
    id: 'edc_current_fl',
    name: 'Ток управления амортизатором: пер. лев.',
    pid: '0xA005',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 2500,
    group: 'EDC-002',
  },
  {
    id: 'edc_current_fr',
    name: 'Ток управления амортизатором: пер. пр.',
    pid: '0xA006',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 2500,
    group: 'EDC-002',
  },
  {
    id: 'edc_current_rl',
    name: 'Ток управления амортизатором: зад. лев.',
    pid: '0xA007',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 2500,
    group: 'EDC-002',
  },
  {
    id: 'edc_current_rr',
    name: 'Ток управления амортизатором: зад. пр.',
    pid: '0xA008',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 2500,
    group: 'EDC-002',
  },
  {
    id: 'edc_mode',
    name: 'Режим работы EDC',
    pid: '0xA009',
    unit: '',
    formula: 'A',
    min: 0,
    max: 4,
    group: 'EDC-003',
  },
];

// ── Блок DME ──────────────────────────────────────────────────────────────────

const dmeEcu: EcuDefinition = {
  id: 'dme',
  name: 'Блок управления двигателем (DME / Bosch MEVD17)',
  address: '0x12',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Digital Motor Electronics — основной блок управления двигателем BMW. Управляет впрыском, зажиганием, наддувом, системой VANOS, клапаном Valvetronic и всеми вспомогательными системами ДВС.',
  functions: [
    {
      id: 'dme_read_dtc',
      name: 'Считать коды неисправностей ДВС',
      type: 'read_dtc',
      description: 'Считывает активные и сохранённые коды неисправностей из памяти блока DME BMW.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'dme_clear_dtc',
      name: 'Стереть коды неисправностей ДВС',
      type: 'clear_dtc',
      description: 'Удаляет все коды неисправностей из памяти блока DME. Сбрасывает статусы мониторов готовности OBD-II.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания выполнить ездовой цикл для активации мониторов OBD. Некоторые флаги потребуют до нескольких циклов прогрева.',
    },
    {
      id: 'dme_live_data',
      name: 'Текущие параметры ДВС (живые данные)',
      type: 'live_data',
      description: 'Параметры работы двигателя BMW в реальном времени: обороты, температуры, наддув, VANOS, лямбда-зонды, коррекции топлива, давление в рампе, детонация.',
      protocol_cmd: '22 XX XX',
      params: dmeLiveParams,
    },
    {
      id: 'dme_vanos_test',
      name: 'Тест системы VANOS (принудительное управление)',
      type: 'activation',
      description: 'Принудительное управление фазовращателями VANOS впускного и выпускного распределительных валов для проверки хода и электрической исправности.',
      protocol_cmd: '31 01 12 01',
      warning: 'Выполнять на прогретом двигателе, на холостом ходу. Наблюдать за обоими значениями углов в живых данных.',
    },
    {
      id: 'dme_swirl_flap_test',
      name: 'Тест вихревых заслонок впуска (дизель)',
      type: 'activation',
      description: 'Принудительное открытие и закрытие вихревых заслонок впускного коллектора для проверки приводов (применимо к дизельным двигателям BMW).',
      protocol_cmd: '31 01 12 02',
      warning: 'Только для дизельных версий. Проверить отсутствие механического заклинивания заслонок.',
    },
    {
      id: 'dme_injector_test',
      name: 'Тест форсунок (поочерёдная активация)',
      type: 'activation',
      description: 'Поочерёдная активация форсунок (бензиновых Piezo FSI или дизельных Common Rail) для проверки работоспособности и выявления проблем с распылом.',
      protocol_cmd: '31 01 12 03',
      warning: 'Выполнять при заглушённом двигателе. Не допускать переполнения цилиндров топливом.',
    },
    {
      id: 'dme_idle_adaptation',
      name: 'Адаптация холостого хода / сброс адаптаций впуска',
      type: 'adaptation',
      description: 'Сброс и повторное обучение параметров холостого хода (регулятора холостого хода, положения дроссельной заслонки). Выполняется после чистки или замены дросселя.',
      protocol_cmd: '31 01 12 04',
      warning: 'Двигатель должен быть прогрет до рабочей температуры. Отключить кондиционер.',
    },
    {
      id: 'dme_oil_reset',
      name: 'Сброс сервисного интервала CBS (масло)',
      type: 'service',
      description: 'Сброс счётчика интервала технического обслуживания по замене моторного масла в системе CBS (Condition Based Service) BMW.',
      protocol_cmd: '31 01 12 05',
    },
    {
      id: 'dme_fuel_adaptation_reset',
      name: 'Сброс адаптаций топливоподачи',
      type: 'adaptation',
      description: 'Сброс накопленных долгосрочных адаптаций системы топливоподачи (LTFT, адаптация нулевого количества дизеля). Выполняется после замены форсунок или топливного насоса.',
      protocol_cmd: '31 01 12 06',
      warning: 'После сброса необходима обкатка не менее 50 км для повторного накопления адаптаций.',
    },
  ],
};

// ── Блок EGS/SMG ─────────────────────────────────────────────────────────────

const egsEcu: EcuDefinition = {
  id: 'egs',
  name: 'Блок управления АКПП (EGS / ZF 8HP / GA8HP)',
  address: '0x18',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Электронное управление коробкой передач BMW — Efficient Gear Selection. Управляет 8-ступенчатым автоматом ZF 8HP или 6-ступенчатым ZF 6HP. Оптимизирует переключения по экономии и динамике.',
  functions: [
    {
      id: 'egs_read_dtc',
      name: 'Считать коды неисправностей АКПП',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока управления коробкой передач BMW.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'egs_clear_dtc',
      name: 'Стереть коды неисправностей АКПП',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EGS.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания выполнить проверочную поездку в различных режимах нагрузки.',
    },
    {
      id: 'egs_live_data',
      name: 'Текущие параметры АКПП',
      type: 'live_data',
      description: 'Температура масла, передача, входной момент, скорость переключения, давление в магистрали АКПП в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: egsLiveParams,
    },
    {
      id: 'egs_adaptation_reset',
      name: 'Сброс адаптаций АКПП',
      type: 'adaptation',
      description: 'Сброс накопленных адаптаций коробки передач BMW (давлений переключения, задержек срабатывания). Выполняется после замены масла, гидроблока или при жалобах на качество переключений.',
      protocol_cmd: '31 01 18 01',
      warning: 'После сброса необходима плавная обкатка АКПП: минимум 500 км в нормальном режиме езды.',
    },
    {
      id: 'egs_oil_reset',
      name: 'Сброс интервала замены масла АКПП (CBS)',
      type: 'service',
      description: 'Сброс сервисного интервала замены трансмиссионного масла в системе CBS BMW.',
      protocol_cmd: '31 01 18 02',
    },
  ],
};

// ── Блок DSC ──────────────────────────────────────────────────────────────────

const dscEcu: EcuDefinition = {
  id: 'dsc',
  name: 'Блок DSC (Dynamic Stability Control / Bosch DSC10)',
  address: '0x56',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Блок управления динамической стабилизацией BMW (DSC = Dynamic Stability Control). Объединяет функции ABS, ASC, DTC, CBC и системы помощи при торможении (DBC).',
  functions: [
    {
      id: 'dsc_read_dtc',
      name: 'Считать коды неисправностей DSC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока DSC: датчики скорости колёс, датчик давления, G-сенсор, датчик рыскания, насос ABS.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'dsc_clear_dtc',
      name: 'Стереть коды неисправностей DSC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока DSC BMW.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'dsc_live_data',
      name: 'Текущие параметры DSC',
      type: 'live_data',
      description: 'Скорости четырёх колёс, угол руля, поперечное ускорение, угол рыскания, давление в тормозном контуре в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: dscLiveParams,
    },
    {
      id: 'dsc_brake_bleed',
      name: 'Прокачка тормозов (с активацией насоса ABS)',
      type: 'activation',
      description: 'Активация гидронасоса модулятора ABS для прокачки тормозной системы и удаления воздуха из гидравлического блока DSC.',
      protocol_cmd: '31 01 56 01',
      warning: 'Уровень тормозной жидкости выше MIN. Требуется помощник. Не допускать осушения бачка ГТЦ!',
    },
    {
      id: 'dsc_sas_calibration',
      name: 'Калибровка датчика угла поворота руля (SAS)',
      type: 'adaptation',
      description: 'Калибровка нулевого положения датчика угла рулевого колеса. Выполняется после регулировки углов установки колёс или замены рулевой рейки.',
      protocol_cmd: '31 01 56 02',
      warning: 'Автомобиль на ровной поверхности, колёса прямо. Не вращать руль в процессе.',
    },
    {
      id: 'dsc_brake_pad_reset',
      name: 'Сброс индикатора износа тормозных колодок',
      type: 'service',
      description: 'Сброс предупреждения об износе тормозных колодок после их замены.',
      protocol_cmd: '31 01 56 03',
    },
    {
      id: 'dsc_epdl_adaptation',
      name: 'Адаптация EPDL (электронная блокировка дифференциала)',
      type: 'adaptation',
      description: 'Базовая адаптация системы электронной блокировки дифференциала (EPDL / eDiff) после замены блока DSC или дифференциала.',
      protocol_cmd: '31 01 56 04',
      warning: 'Автомобиль должен стоять неподвижно. Не нажимать педали в процессе адаптации.',
    },
  ],
};

// ── Блок MRS/ACSM (Airbag) ───────────────────────────────────────────────────

const airbagEcu: EcuDefinition = {
  id: 'acsm',
  name: 'Блок управления SRS / Airbag (ACSM / MRS)',
  address: '0x00',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Advanced Crash Safety Module — блок управления системой пассивной безопасности BMW. Управляет фронтальными, боковыми и шторными подушками безопасности, преднатяжителями ремней.',
  functions: [
    {
      id: 'acsm_read_dtc',
      name: 'Считать коды неисправностей SRS/Airbag',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока ACSM: пиропатроны, датчики удара, шлейф рулевого колеса, датчики давления боковых подушек.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'acsm_clear_dtc',
      name: 'Стереть коды неисправностей SRS/Airbag',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока ACSM BMW.',
      protocol_cmd: '14 FF FF FF',
      warning: 'Перед стиранием устранить все неисправности. Некорректная работа SRS опасна для жизни!',
    },
    {
      id: 'acsm_live_data',
      name: 'Текущие параметры SRS',
      type: 'live_data',
      description: 'Состояние датчиков удара, напряжение питания блока, статус компонентов системы пассивной безопасности.',
      protocol_cmd: '22 XX XX',
    },
    {
      id: 'acsm_crash_data',
      name: 'Чтение данных о ДТП (Crash Data)',
      type: 'service',
      description: 'Считывание зафиксированных параметров в момент срабатывания системы SRS: скорость, ускорения, состояние ремней и подушек безопасности.',
      protocol_cmd: '19 02 09',
      warning: 'Данные Crash Data записываются только при срабатывании SRS. Сброс требует специальной авторизованной процедуры BMW AG.',
    },
  ],
};

// ── Блок KOMBI ────────────────────────────────────────────────────────────────

const kombiEcu: EcuDefinition = {
  id: 'kombi',
  name: 'Щиток приборов (KOMBI / Instrument Cluster)',
  address: '0x80',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Комбинация приборов BMW. Отображает информацию iDrive, борткомпьютер, индикаторы CBS (Condition Based Service), пробег. Хранит данные технического обслуживания.',
  functions: [
    {
      id: 'kombi_read_dtc',
      name: 'Считать коды неисправностей щитка',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей щитка приборов BMW.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'kombi_clear_dtc',
      name: 'Стереть коды неисправностей щитка',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти щитка приборов.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'kombi_cbs_reset',
      name: 'Сброс CBS (Condition Based Service)',
      type: 'service',
      description: 'Сброс одного или нескольких элементов системы технического обслуживания CBS BMW: масло, микрофильтр, тормозная жидкость, тормозные колодки, свечи зажигания.',
      protocol_cmd: '31 01 80 01',
      warning: 'Выполнять только после фактического выполнения соответствующего вида технического обслуживания.',
    },
    {
      id: 'kombi_oil_reset',
      name: 'Сброс индикатора замены масла CBS',
      type: 'service',
      description: 'Целевой сброс только счётчика моторного масла в системе CBS BMW.',
      protocol_cmd: '31 01 80 02',
    },
    {
      id: 'kombi_coding',
      name: 'Кодирование щитка приборов',
      type: 'coding',
      description: 'Изменение параметров кодирования щитка: единицы измерения (км/мили), язык, опции отображения iDrive, активация скрытых функций (видеопредупреждения и т.д.).',
      protocol_cmd: '2E XX XX XX',
      warning: 'Рекомендуется сохранить текущее кодирование (FDL) перед любыми изменениями.',
    },
  ],
};

// ── Блок EPS ──────────────────────────────────────────────────────────────────

const epsEcu: EcuDefinition = {
  id: 'eps',
  name: 'Электроусилитель руля EPS (EPAS / ZF Servolectric)',
  address: '0x60',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Блок управления электрическим усилителем рулевого управления BMW (ZF Servolectric или Bosch). Включает активный возврат руля и режим Servotronic (нагрузочно-зависимое усиление).',
  functions: [
    {
      id: 'eps_read_dtc',
      name: 'Считать коды неисправностей EPS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока EPS BMW: датчик момента, мотор, датчик угла, питание.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'eps_clear_dtc',
      name: 'Стереть коды неисправностей EPS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EPS.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'eps_live_data',
      name: 'Текущие параметры EPS',
      type: 'live_data',
      description: 'Угол рулевого вала, момент водителя, ассистирующий момент, ток и температура электродвигателя в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: epsLiveParams,
    },
    {
      id: 'eps_calibration',
      name: 'Калибровка нулевого положения EPS',
      type: 'adaptation',
      description: 'Обучение нулевого положения датчика рулевого вала EPS. Выполняется после замены рулевой рейки, блока EPS или рулевого вала.',
      protocol_cmd: '31 01 60 01',
      warning: 'Автомобиль стоит с прямо установленными колёсами. Не вращать руль в процессе.',
    },
  ],
};

// ── Блок EDC ──────────────────────────────────────────────────────────────────

const edcEcu: EcuDefinition = {
  id: 'edc',
  name: 'Электронное управление амортизаторами (EDC / M-Technik)',
  address: '0xA0',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Electronic Damper Control — блок управления электронно-управляемыми амортизаторами BMW. Адаптирует жёсткость подвески в зависимости от режима езды (Comfort/Sport/Sport+).',
  functions: [
    {
      id: 'edc_read_dtc',
      name: 'Считать коды неисправностей EDC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока EDC: датчики высоты кузова, актуаторы амортизаторов, шины CAN.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'edc_clear_dtc',
      name: 'Стереть коды неисправностей EDC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EDC.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'edc_live_data',
      name: 'Текущие параметры EDC',
      type: 'live_data',
      description: 'Высота кузова в четырёх точках, ток управления каждым амортизатором, режим EDC в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: edcLiveParams,
    },
    {
      id: 'edc_calibration',
      name: 'Калибровка датчиков высоты кузова EDC',
      type: 'adaptation',
      description: 'Обучение нулевых точек датчиков уровня кузова EDC. Выполняется после замены амортизатора, рычага подвески или самого датчика высоты.',
      protocol_cmd: '31 01 A0 01',
      warning: 'Автомобиль без нагрузки на ровной горизонтальной поверхности. Давление в шинах по норме.',
    },
    {
      id: 'edc_ride_height_calibration',
      name: 'Калибровка уровней высоты (Normal/Sport)',
      type: 'adaptation',
      description: 'Обучение целевых уровней кузова для каждого режима EDC: Comfort, Sport и Sport+. Выполняется после замены амортизаторов другой серии.',
      protocol_cmd: '31 01 A0 02',
      warning: 'Следовать инструкции пошагово. Нагрузка в автомобиле — стандартная (без пассажиров).',
    },
  ],
};

// ── Блок FEM/BDC ─────────────────────────────────────────────────────────────

const femEcu: EcuDefinition = {
  id: 'fem_bdc',
  name: 'Блок управления кузовом (FEM / BDC)',
  address: '0x40',
  protocol: 'BMW-ENET / D-CAN (ISO 14229 UDS)',
  description: 'Front Electronic Module / Body Domain Controller — центральный блок управления кузовными функциями BMW. Управляет освещением, центральным замком, стеклоподъёмниками, иммобилайзером и CAS.',
  functions: [
    {
      id: 'fem_read_dtc',
      name: 'Считать коды неисправностей FEM/BDC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока FEM/BDC BMW: освещение, центральный замок, стеклоподъёмники, шины кузова.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'fem_clear_dtc',
      name: 'Стереть коды неисправностей FEM/BDC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока FEM/BDC.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'fem_coding',
      name: 'Кодирование FEM/BDC (опции кузова)',
      type: 'coding',
      description: 'Изменение параметров кодирования блока FEM/BDC: опции освещения, поведения замков, жестов открытия багажника, Welcome-освещения и других кузовных функций.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Рекомендуется сохранить текущий FDL перед изменением. Неверное кодирование может нарушить работу замков или освещения.',
    },
  ],
};

// ── Фабричная функция ─────────────────────────────────────────────────────────

function buildBmwEcus(options?: { hasEdc?: boolean }): EcuDefinition[] {
  const base: EcuDefinition[] = [dmeEcu, egsEcu, dscEcu, airbagEcu, kombiEcu, epsEcu, femEcu];
  if (options?.hasEdc) base.push(edcEcu);
  return base;
}

// ── Модели BMW ────────────────────────────────────────────────────────────────

const bmw3F30G20: ModelDefinition = {
  id: 'bmw_3_f30_g20',
  name: 'BMW 3 серия F30 / G20',
  years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'CLAR / UKL2',
  ecus: buildBmwEcus({ hasEdc: false }),
};

const bmw5F10G30: ModelDefinition = {
  id: 'bmw_5_f10_g30',
  name: 'BMW 5 серия F10 / G30',
  years: [2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'CLAR',
  ecus: buildBmwEcus({ hasEdc: true }),
};

const bmwX5F15G05: ModelDefinition = {
  id: 'bmw_x5_f15_g05',
  name: 'BMW X5 F15 / G05',
  years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'CLAR',
  ecus: buildBmwEcus({ hasEdc: true }),
};

const bmw1F20F40: ModelDefinition = {
  id: 'bmw_1_f20_f40',
  name: 'BMW 1 серия F20 / F40',
  years: [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'UKL2 / FAAR',
  ecus: buildBmwEcus({ hasEdc: false }),
};

// ── Экспорт ───────────────────────────────────────────────────────────────────

const bmwDB: MakeDB = {
  id: 'bmw',
  name: 'BMW',
  region: 'EU',
  protocol_family: 'BMW ENET (DoIP) / D-CAN (ISO 15765) / UDS ISO 14229',
  models: [bmw3F30G20, bmw5F10G30, bmwX5F15G05, bmw1F20F40],
};

export default bmwDB;
