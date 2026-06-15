// ── Toyota ECU Database ───────────────────────────────────────────────────────
// Полная база данных блоков управления для диагностики автомобилей Toyota

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

// ── Живые данные ECM Toyota ───────────────────────────────────────────────────

const ecmLiveParams: EcuParam[] = [
  {
    id: 'rpm',
    name: 'Обороты двигателя',
    pid: '0x1001',
    unit: 'об/мин',
    formula: '(A * 256 + B) / 4',
    min: 0,
    max: 7500,
    group: 'ECM-001',
  },
  {
    id: 'coolant_temp',
    name: 'Температура охлаждающей жидкости',
    pid: '0x1002',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 120,
    group: 'ECM-001',
  },
  {
    id: 'throttle_pos',
    name: 'Положение дроссельной заслонки',
    pid: '0x1003',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ECM-001',
  },
  {
    id: 'maf',
    name: 'Массовый расход воздуха (MAF)',
    pid: '0x1004',
    unit: 'г/с',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 655,
    group: 'ECM-002',
  },
  {
    id: 'map',
    name: 'Давление во впускном коллекторе (MAP)',
    pid: '0x1005',
    unit: 'кПа',
    formula: 'A',
    min: 0,
    max: 255,
    group: 'ECM-002',
  },
  {
    id: 'iat',
    name: 'Температура воздуха на впуске (IAT)',
    pid: '0x1006',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 120,
    group: 'ECM-002',
  },
  {
    id: 'o2_b1s1',
    name: 'Датчик кислорода B1S1 (перед катализатором)',
    pid: '0x1007',
    unit: 'В',
    formula: '(A * 256 + B) / 200',
    min: 0.0,
    max: 1.275,
    group: 'ECM-003',
  },
  {
    id: 'o2_b1s2',
    name: 'Датчик кислорода B1S2 (после катализатора)',
    pid: '0x1008',
    unit: 'В',
    formula: '(A * 256 + B) / 200',
    min: 0.0,
    max: 1.275,
    group: 'ECM-003',
  },
  {
    id: 'stft_b1',
    name: 'Кратковременная коррекция топлива B1 (STFT)',
    pid: '0x1009',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'ECM-003',
  },
  {
    id: 'ltft_b1',
    name: 'Долгосрочная коррекция топлива B1 (LTFT)',
    pid: '0x100A',
    unit: '%',
    formula: '(A / 128 - 1) * 100',
    min: -25,
    max: 25,
    group: 'ECM-003',
  },
  {
    id: 'vvti_intake',
    name: 'Угол фазовращателя VVT-i впуск (факт.)',
    pid: '0x100B',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'ECM-004',
  },
  {
    id: 'vvti_exhaust',
    name: 'Угол фазовращателя VVT-i выпуск (факт.)',
    pid: '0x100C',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'ECM-004',
  },
  {
    id: 'vvti_intake_setpoint',
    name: 'Угол VVT-i впуск (уставка)',
    pid: '0x100D',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'ECM-004',
  },
  {
    id: 'injection_pulse',
    name: 'Длительность импульса впрыска',
    pid: '0x100E',
    unit: 'мс',
    formula: '(A * 256 + B) / 1000',
    min: 0,
    max: 30,
    group: 'ECM-005',
  },
  {
    id: 'knock_retard',
    name: 'Угол коррекции зажигания по детонации',
    pid: '0x100F',
    unit: '°',
    formula: '(A / 2) - 64',
    min: -20,
    max: 0,
    group: 'ECM-005',
  },
  {
    id: 'engine_load',
    name: 'Расчётная нагрузка двигателя',
    pid: '0x1010',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ECM-001',
  },
  {
    id: 'vehicle_speed',
    name: 'Скорость автомобиля',
    pid: '0x1011',
    unit: 'км/ч',
    formula: 'A',
    min: 0,
    max: 250,
    group: 'ECM-001',
  },
  {
    id: 'battery_voltage',
    name: 'Напряжение бортовой сети',
    pid: '0x1012',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 9.0,
    max: 15.5,
    group: 'ECM-001',
  },
  {
    id: 'boost_pressure',
    name: 'Давление наддува (для турбо версий)',
    pid: '0x1013',
    unit: 'кПа',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 350,
    group: 'ECM-002',
  },
  {
    id: 'ignition_timing',
    name: 'Угол опережения зажигания',
    pid: '0x1014',
    unit: '° КВВМТ',
    formula: 'A / 2 - 64',
    min: -64,
    max: 63.5,
    group: 'ECM-005',
  },
  {
    id: 'idle_speed_target',
    name: 'Целевые обороты холостого хода',
    pid: '0x1015',
    unit: 'об/мин',
    formula: '(A * 256 + B) / 4',
    min: 500,
    max: 1200,
    group: 'ECM-001',
  },
];

// ── Живые данные ECT/ATF Toyota ──────────────────────────────────────────────

const ectLiveParams: EcuParam[] = [
  {
    id: 'ect_oil_temp',
    name: 'Температура масла АКПП',
    pid: '0x2801',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'ECT-001',
  },
  {
    id: 'ect_gear',
    name: 'Текущая передача',
    pid: '0x2802',
    unit: '',
    formula: 'A',
    min: 0,
    max: 8,
    group: 'ECT-001',
  },
  {
    id: 'ect_lockup',
    name: 'Состояние блокировки гидротрансформатора',
    pid: '0x2803',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'ECT-002',
  },
  {
    id: 'ect_line_pressure',
    name: 'Давление в главной магистрали АКПП',
    pid: '0x2804',
    unit: 'кПа',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 2000,
    group: 'ECT-002',
  },
  {
    id: 'ect_input_rpm',
    name: 'Обороты входного вала АКПП',
    pid: '0x2805',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 7000,
    group: 'ECT-001',
  },
  {
    id: 'ect_output_rpm',
    name: 'Обороты выходного вала АКПП',
    pid: '0x2806',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 5000,
    group: 'ECT-001',
  },
  {
    id: 'ect_shift_solenoid_a',
    name: 'Соленоид переключения SL1 (ток)',
    pid: '0x2807',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 1200,
    group: 'ECT-002',
  },
  {
    id: 'ect_shift_solenoid_b',
    name: 'Соленоид переключения SL2 (ток)',
    pid: '0x2808',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 1200,
    group: 'ECT-002',
  },
];

// ── Живые данные ABS/VSC Toyota ──────────────────────────────────────────────

const absvscLiveParams: EcuParam[] = [
  {
    id: 'vsc_speed_fl',
    name: 'Скорость колеса: переднее левое',
    pid: '0x2501',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'VSC-001',
  },
  {
    id: 'vsc_speed_fr',
    name: 'Скорость колеса: переднее правое',
    pid: '0x2502',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'VSC-001',
  },
  {
    id: 'vsc_speed_rl',
    name: 'Скорость колеса: заднее левое',
    pid: '0x2503',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'VSC-001',
  },
  {
    id: 'vsc_speed_rr',
    name: 'Скорость колеса: заднее правое',
    pid: '0x2504',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'VSC-001',
  },
  {
    id: 'vsc_yaw_rate',
    name: 'Угловая скорость рыскания',
    pid: '0x2505',
    unit: '°/с',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -150,
    max: 150,
    group: 'VSC-002',
  },
  {
    id: 'vsc_deceleration',
    name: 'Датчик замедления (продольное ускорение)',
    pid: '0x2506',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'VSC-002',
  },
  {
    id: 'vsc_lateral_accel',
    name: 'Боковое ускорение',
    pid: '0x2507',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'VSC-002',
  },
  {
    id: 'vsc_steering_angle',
    name: 'Угол поворота рулевого колеса',
    pid: '0x2508',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'VSC-003',
  },
  {
    id: 'vsc_brake_pressure',
    name: 'Давление в тормозном контуре',
    pid: '0x2509',
    unit: 'МПа',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 25,
    group: 'VSC-003',
  },
];

// ── Живые данные BCM Toyota ───────────────────────────────────────────────────

const bcmLiveParams: EcuParam[] = [
  {
    id: 'bcm_battery_voltage',
    name: 'Напряжение АКБ (12В)',
    pid: '0x3001',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 9.0,
    max: 15.5,
    group: 'BCM-001',
  },
  {
    id: 'bcm_ignition_status',
    name: 'Состояние замка зажигания',
    pid: '0x3002',
    unit: '',
    formula: 'A',
    min: 0,
    max: 3,
    group: 'BCM-001',
  },
  {
    id: 'bcm_door_status',
    name: 'Состояние дверей (бит-маска)',
    pid: '0x3003',
    unit: '',
    formula: 'A',
    min: 0,
    max: 255,
    group: 'BCM-002',
  },
];

// ── Живые данные Hybrid/EV Toyota ────────────────────────────────────────────

const hybridLiveParams: EcuParam[] = [
  {
    id: 'hv_soc',
    name: 'Заряд тяговой батареи (SOC)',
    pid: '0x3B01',
    unit: '%',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 100,
    group: 'HV-001',
  },
  {
    id: 'hv_cell_voltage_min',
    name: 'Минимальное напряжение ячейки АКБ',
    pid: '0x3B02',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 2.5,
    max: 4.5,
    group: 'HV-002',
  },
  {
    id: 'hv_cell_voltage_max',
    name: 'Максимальное напряжение ячейки АКБ',
    pid: '0x3B03',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 2.5,
    max: 4.5,
    group: 'HV-002',
  },
  {
    id: 'hv_pack_voltage',
    name: 'Напряжение тяговой батареи (суммарное)',
    pid: '0x3B04',
    unit: 'В',
    formula: '(A * 256 + B) / 10',
    min: 100,
    max: 800,
    group: 'HV-002',
  },
  {
    id: 'hv_pack_current',
    name: 'Ток тяговой батареи',
    pid: '0x3B05',
    unit: 'А',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -500,
    max: 500,
    group: 'HV-002',
  },
  {
    id: 'hv_pack_temp_max',
    name: 'Максимальная температура батарейного модуля',
    pid: '0x3B06',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 80,
    group: 'HV-003',
  },
  {
    id: 'hv_pack_temp_min',
    name: 'Минимальная температура батарейного модуля',
    pid: '0x3B07',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 80,
    group: 'HV-003',
  },
  {
    id: 'hv_motor_torque_mg1',
    name: 'Момент электромотора MG1 (генератор)',
    pid: '0x3B08',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -300,
    max: 300,
    group: 'HV-004',
  },
  {
    id: 'hv_motor_torque_mg2',
    name: 'Момент электромотора MG2 (тяговый)',
    pid: '0x3B09',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -300,
    max: 300,
    group: 'HV-004',
  },
  {
    id: 'hv_regen_power',
    name: 'Мощность рекуперативного торможения',
    pid: '0x3B0A',
    unit: 'кВт',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 150,
    group: 'HV-004',
  },
  {
    id: 'hv_inverter_temp_mg1',
    name: 'Температура инвертора MG1',
    pid: '0x3B0B',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 150,
    group: 'HV-003',
  },
  {
    id: 'hv_inverter_temp_mg2',
    name: 'Температура инвертора MG2',
    pid: '0x3B0C',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 150,
    group: 'HV-003',
  },
  {
    id: 'hv_ev_mode_active',
    name: 'Активность режима EV (только электро)',
    pid: '0x3B0D',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'HV-001',
  },
];

// ── Живые данные KDSS (Land Cruiser 300) ─────────────────────────────────────

const kdssLiveParams: EcuParam[] = [
  {
    id: 'kdss_pressure_front',
    name: 'Давление в переднем контуре KDSS',
    pid: '0x3E01',
    unit: 'МПа',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 25,
    group: 'KDSS-001',
  },
  {
    id: 'kdss_pressure_rear',
    name: 'Давление в заднем контуре KDSS',
    pid: '0x3E02',
    unit: 'МПа',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 25,
    group: 'KDSS-001',
  },
  {
    id: 'kdss_valve_front_state',
    name: 'Состояние клапана переднего стабилизатора',
    pid: '0x3E03',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'KDSS-002',
  },
  {
    id: 'kdss_valve_rear_state',
    name: 'Состояние клапана заднего стабилизатора',
    pid: '0x3E04',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'KDSS-002',
  },
  {
    id: 'kdss_body_roll',
    name: 'Угол крена кузова',
    pid: '0x3E05',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -30,
    max: 30,
    group: 'KDSS-003',
  },
  {
    id: 'kdss_mode',
    name: 'Режим работы KDSS',
    pid: '0x3E06',
    unit: '',
    formula: 'A',
    min: 0,
    max: 3,
    group: 'KDSS-002',
  },
];

// ── Определения ЭБУ Toyota ────────────────────────────────────────────────────

const ecmEcu: EcuDefinition = {
  id: 'ecm',
  name: 'Блок управления двигателем (ECM / Toyota D-4S)',
  address: '0x10',
  protocol: 'Toyota CAN / ISO 14229 UDS / ISO 15765',
  description: 'Engine Control Module — основной блок управления двигателем Toyota. Управляет впрыском (D-4S, PFI), зажиганием, системой VVT-i/Dual VVT-i/VVT-iW, EGR и нейтрализатором.',
  functions: [
    {
      id: 'ecm_read_dtc',
      name: 'Считать коды неисправностей ДВС',
      type: 'read_dtc',
      description: 'Считывает активные и сохранённые коды неисправностей из памяти блока ECM Toyota.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'ecm_clear_dtc',
      name: 'Стереть коды неисправностей ДВС',
      type: 'clear_dtc',
      description: 'Удаляет все коды неисправностей из памяти ECM. Сбрасывает статусы мониторов готовности OBD-II Toyota.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания выполнить ездовой цикл Toyota (прогрев + стабильное движение 10+ мин.) для активации мониторов.',
    },
    {
      id: 'ecm_live_data',
      name: 'Текущие параметры ДВС (живые данные)',
      type: 'live_data',
      description: 'Параметры работы двигателя Toyota в реальном времени: RPM, температуры, VVT-i, O2-датчики, коррекции топлива, наддув, детонация.',
      protocol_cmd: '22 XX XX',
      params: ecmLiveParams,
    },
    {
      id: 'ecm_vvti_test',
      name: 'Тест системы VVT-i (принудительное управление)',
      type: 'activation',
      description: 'Принудительное управление фазовращателями VVT-i впускного и выпускного распределительных валов для проверки хода и работы системы OCV (Oil Control Valve).',
      protocol_cmd: '31 01 10 01',
      warning: 'Выполнять на прогретом двигателе на холостом ходу. Убедиться в достаточном давлении масла перед тестом.',
    },
    {
      id: 'ecm_injector_balance',
      name: 'Баланс форсунок (тест производительности)',
      type: 'activation',
      description: 'Поочерёдное отключение цилиндров для проверки равномерности работы форсунок. Выявляет засорённые или неисправные форсунки по падению оборотов.',
      protocol_cmd: '31 01 10 02',
      warning: 'Выполнять на прогретом двигателе, на стабильном холостом ходу.',
    },
    {
      id: 'ecm_throttle_init',
      name: 'Инициализация дроссельной заслонки (закрытая позиция)',
      type: 'adaptation',
      description: 'Процедура инициализации дроссельного узла Toyota: обучение полностью закрытого положения и диапазона хода. Обязательна после замены дросселя или батареи.',
      protocol_cmd: '31 01 10 03',
      warning: 'Зажигание ВКЛ, двигатель ВЫКЛ. Не нажимать педаль газа в процессе инициализации.',
    },
    {
      id: 'ecm_idle_learn',
      name: 'Обучение холостого хода (Idle Speed Learn)',
      type: 'adaptation',
      description: 'Процедура обучения оборотов холостого хода Toyota. Выполняется после замены дросселя, аккумулятора или сброса ECM.',
      protocol_cmd: '31 01 10 04',
      warning: 'Двигатель прогрет. Все электроприборы выключены. Температура воздуха на впуске — выше +0°C.',
    },
    {
      id: 'ecm_oil_reset',
      name: 'Сброс интервала замены масла',
      type: 'service',
      description: 'Сброс счётчика интервала замены моторного масла в блоке ECM Toyota. Выполняется после замены масла и масляного фильтра.',
      protocol_cmd: '31 01 10 05',
    },
    {
      id: 'ecm_tpms_reset',
      name: 'Сброс/регистрация датчиков давления в шинах (TPMS)',
      type: 'service',
      description: 'Регистрация новых датчиков давления в шинах TPMS после сезонной замены колёс или установки новых датчиков. Запускает процедуру обучения ID датчиков.',
      protocol_cmd: '31 01 10 06',
      warning: 'Давление в шинах установить согласно норме до регистрации. Проехать минимум 20 км после процедуры.',
    },
  ],
};

const ectEcu: EcuDefinition = {
  id: 'ect',
  name: 'Блок управления АКПП (ECT / Toyota AA80E / AB60)',
  address: '0x28',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Electronic Controlled Transmission — блок управления автоматической коробкой передач Toyota. Управляет 6/8-ступенчатым АКПП с гидротрансформатором, соленоидами и давлениями.',
  functions: [
    {
      id: 'ect_read_dtc',
      name: 'Считать коды неисправностей АКПП',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока управления АКПП Toyota.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'ect_clear_dtc',
      name: 'Стереть коды неисправностей АКПП',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока ECT.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания выполнить проверочную поездку в различных режимах.',
    },
    {
      id: 'ect_live_data',
      name: 'Текущие параметры АКПП',
      type: 'live_data',
      description: 'Температура масла, текущая передача, состояние блокировки ГТ, давление в магистрали, обороты валов в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: ectLiveParams,
    },
    {
      id: 'ect_adaptation_reset',
      name: 'Сброс адаптаций АКПП',
      type: 'adaptation',
      description: 'Сброс накопленных адаптаций коробки передач Toyota (давлений переключения, характеристик соленоидов). Выполняется после замены масла ATF или гидроблока.',
      protocol_cmd: '31 01 28 01',
      warning: 'После сброса необходима плавная обкатка АКПП не менее 300 км в смешанном цикле.',
    },
    {
      id: 'ect_oil_reset',
      name: 'Сброс интервала замены масла АКПП',
      type: 'service',
      description: 'Сброс счётчика интервала замены трансмиссионного масла ATF в блоке ECT Toyota.',
      protocol_cmd: '31 01 28 02',
    },
  ],
};

const absvscEcu: EcuDefinition = {
  id: 'abs_vsc',
  name: 'Блок ABS/VSC (Skid Control ECU / Bosch)',
  address: '0x25',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Skid Control ECU — блок управления системами ABS и VSC (Vehicle Stability Control) Toyota. Реализует функции ABS, TRC, VSC, EBD, BA и Hill Start Assist.',
  functions: [
    {
      id: 'vsc_read_dtc',
      name: 'Считать коды неисправностей ABS/VSC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока ABS/VSC Toyota.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'vsc_clear_dtc',
      name: 'Стереть коды неисправностей ABS/VSC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока ABS/VSC.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'vsc_live_data',
      name: 'Текущие параметры ABS/VSC',
      type: 'live_data',
      description: 'Скорости четырёх колёс, угол рыскания, боковое и продольное ускорения, угол руля, давление в тормозах в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: absvscLiveParams,
    },
    {
      id: 'vsc_sas_reset',
      name: 'Калибровка датчика угла поворота руля (SAS)',
      type: 'adaptation',
      description: 'Калибровка нулевого положения датчика угла рулевого колеса Toyota. Выполняется после замены рулевой рейки, наконечников рулевых тяг или регулировки развала/схождения.',
      protocol_cmd: '31 01 25 01',
      warning: 'Автомобиль на ровной горизонтальной поверхности, колёса прямо.',
    },
    {
      id: 'vsc_brake_bleed',
      name: 'Прокачка тормозов (режим ABS)',
      type: 'activation',
      description: 'Принудительная активация насоса гидромодулятора ABS для прокачки тормозной системы. Позволяет удалить воздух из блока ABS без специального оборудования.',
      protocol_cmd: '31 01 25 02',
      warning: 'Уровень тормозной жидкости выше MIN. Требуется помощник. Не осушать бачок!',
    },
    {
      id: 'vsc_pad_reset',
      name: 'Сброс индикатора износа тормозных колодок',
      type: 'service',
      description: 'Сброс предупреждения об износе тормозных колодок в блоке ABS/VSC Toyota после замены колодок.',
      protocol_cmd: '31 01 25 03',
    },
  ],
};

const srsToyotaEcu: EcuDefinition = {
  id: 'srs',
  name: 'Блок управления SRS / Airbag (Toyota)',
  address: '0x11',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Блок управления системой пассивной безопасности Toyota SRS. Управляет фронтальными, боковыми и шторными подушками безопасности, преднатяжителями ремней, датчиками удара.',
  functions: [
    {
      id: 'srs_read_dtc',
      name: 'Считать коды неисправностей SRS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока SRS Toyota.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'srs_clear_dtc',
      name: 'Стереть коды неисправностей SRS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока SRS.',
      protocol_cmd: '14 FF FF FF',
      warning: 'Перед стиранием устранить все неисправности. Повреждение SRS может привести к гибели!',
    },
    {
      id: 'srs_live_data',
      name: 'Текущие параметры SRS',
      type: 'live_data',
      description: 'Состояние датчиков удара, напряжение питания, статус компонентов SRS в реальном времени.',
      protocol_cmd: '22 XX XX',
    },
    {
      id: 'srs_crash_data',
      name: 'Чтение данных ДТП (Crash Data)',
      type: 'service',
      description: 'Считывание зафиксированных параметров при срабатывании SRS: скорость, ускорения, состояние ремней. Используется при экспертизе ДТП.',
      protocol_cmd: '19 02 09',
      warning: 'Crash Data не стираются стандартными командами. Для сброса требуется авторизованная процедура Toyota.',
    },
  ],
};

const bcmEcu: EcuDefinition = {
  id: 'bcm',
  name: 'Блок управления кузовом (BCM / Body ECU)',
  address: '0x30',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Body Control Module Toyota — управляет кузовными функциями: центральным замком, освещением, стеклоподъёмниками, стеклоочистителями, системой Smart Entry.',
  functions: [
    {
      id: 'bcm_read_dtc',
      name: 'Считать коды неисправностей BCM',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока управления кузовом Toyota.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'bcm_clear_dtc',
      name: 'Стереть коды неисправностей BCM',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти BCM.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'bcm_live_data',
      name: 'Текущие параметры BCM',
      type: 'live_data',
      description: 'Напряжение АКБ, состояние зажигания, статус дверей, окон и кузовных переключателей в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: bcmLiveParams,
    },
    {
      id: 'bcm_coding',
      name: 'Кодирование BCM (опции кузова)',
      type: 'coding',
      description: 'Изменение параметров кодирования BCM Toyota: режимы замков, автоматическое закрытие окон при запирании, чувствительность датчика дождя, опции Welcome-освещения.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Рекомендуется записать текущее кодирование перед изменением.',
    },
  ],
};

const hybridEcu: EcuDefinition = {
  id: 'hv_ecm',
  name: 'Блок управления гибридной системой (HV ECU / G0C)',
  address: '0x3B',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Гибридный блок управления Toyota (HV Control ECU). Управляет тяговой батареей, инверторами, электромоторами MG1/MG2, рекуперативным торможением и режимами EV/HV.',
  functions: [
    {
      id: 'hv_read_dtc',
      name: 'Считать коды неисправностей гибридной системы',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока HV ECU: тяговая батарея, инверторы, электромоторы MG1/MG2, высоковольтная цепь.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'hv_clear_dtc',
      name: 'Стереть коды неисправностей гибридной системы',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока HV ECU.',
      protocol_cmd: '14 FF FF FF',
      warning: 'Перед стиранием устранить все причины неисправностей. Высоковольтная система опасна для жизни — работать только после деактивации HV!',
    },
    {
      id: 'hv_live_data',
      name: 'Текущие параметры гибридной системы',
      type: 'live_data',
      description: 'SOC тяговой батареи, напряжения ячеек, температуры батареи и инверторов, моменты MG1/MG2, мощность рекуперации в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: hybridLiveParams,
    },
    {
      id: 'hv_battery_balance',
      name: 'Балансировка ячеек тяговой батареи',
      type: 'service',
      description: 'Запуск процедуры балансировки ячеек тяговой NiMH/Li-ion батареи Toyota. Выравнивает напряжения ячеек для восстановления ёмкости и равномерного износа.',
      protocol_cmd: '31 01 3B 01',
      warning: 'Процедура занимает длительное время. Автомобиль должен быть подключён к зарядному устройству (PHEV) или работать в специальном режиме прогрева.',
    },
    {
      id: 'hv_system_check',
      name: 'Проверка высоковольтной цепи (HV Check)',
      type: 'activation',
      description: 'Комплексная диагностика высоковольтной цепи гибридной системы Toyota: тест изоляции, проверка реле предварительного заряда, контакторов и защитных устройств.',
      protocol_cmd: '31 01 3B 02',
      warning: 'ВЫСОКОЕ НАПРЯЖЕНИЕ! Работать только в диэлектрических перчатках. Не прикасаться к оранжевым кабелям без деактивации HV системы.',
    },
  ],
};

const kdssEcu: EcuDefinition = {
  id: 'kdss',
  name: 'Система KDSS (Kinetic Dynamic Suspension System)',
  address: '0x3E',
  protocol: 'Toyota CAN / ISO 14229 UDS',
  description: 'Kinetic Dynamic Suspension System — гидравлическая система управления стабилизаторами Toyota Land Cruiser. Автоматически отсоединяет стабилизаторы при бездорожье для увеличения хода подвески.',
  functions: [
    {
      id: 'kdss_read_dtc',
      name: 'Считать коды неисправностей KDSS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей системы KDSS: датчики давления, клапаны, гидравлический насос.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'kdss_clear_dtc',
      name: 'Стереть коды неисправностей KDSS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока KDSS.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'kdss_live_data',
      name: 'Текущие параметры KDSS',
      type: 'live_data',
      description: 'Давление в переднем/заднем контурах KDSS, состояние клапанов стабилизаторов, угол крена кузова, режим работы системы.',
      protocol_cmd: '22 XX XX',
      params: kdssLiveParams,
    },
    {
      id: 'kdss_calibration',
      name: 'Калибровка системы KDSS',
      type: 'adaptation',
      description: 'Базовая калибровка датчиков давления и позиционных датчиков системы KDSS. Выполняется после замены гидравлических компонентов или блока управления.',
      protocol_cmd: '31 01 3E 01',
      warning: 'Автомобиль без нагрузки, колёса прямо. Шины накачаны до нормы. Двигатель прогрет.',
    },
    {
      id: 'kdss_height_adjustment',
      name: 'Регулировка высоты кузова KDSS',
      type: 'adaptation',
      description: 'Процедура регулировки целевых уровней кузова для системы KDSS после замены амортизаторов, пружин или компонентов подвески.',
      protocol_cmd: '31 01 3E 02',
      warning: 'Выполнять на ровной горизонтальной площадке. Нагрузка — стандартная (без пассажиров и груза).',
    },
  ],
};

// ── Фабричная функция ─────────────────────────────────────────────────────────

function buildToyotaEcus(options?: {
  hasHybrid?: boolean;
  hasKdss?: boolean;
}): EcuDefinition[] {
  const base: EcuDefinition[] = [ecmEcu, ectEcu, absvscEcu, srsToyotaEcu, bcmEcu];
  if (options?.hasHybrid) base.push(hybridEcu);
  if (options?.hasKdss) base.push(kdssEcu);
  return base;
}

// ── Модели Toyota ─────────────────────────────────────────────────────────────

const toyotaCamryV70: ModelDefinition = {
  id: 'camry_v70',
  name: 'Toyota Camry V70',
  years: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'TNGA-K (GA-K)',
  ecus: buildToyotaEcus({ hasHybrid: true }),
};

const toyotaRav4V: ModelDefinition = {
  id: 'rav4_v',
  name: 'Toyota RAV4 V (XA50)',
  years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'TNGA-K (GA-K)',
  ecus: buildToyotaEcus({ hasHybrid: true }),
};

const toyotaLandCruiser300: ModelDefinition = {
  id: 'land_cruiser_300',
  name: 'Toyota Land Cruiser 300 (J300)',
  years: [2021, 2022, 2023, 2024],
  platform: 'TNGA-F (GA-F)',
  ecus: buildToyotaEcus({ hasHybrid: false, hasKdss: true }),
};

const toyotaHighlanderU70: ModelDefinition = {
  id: 'highlander_u70',
  name: 'Toyota Highlander U70 (XU70)',
  years: [2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'TNGA-K (GA-K)',
  ecus: buildToyotaEcus({ hasHybrid: true }),
};

const toyotaCorollaE210: ModelDefinition = {
  id: 'corolla_e210',
  name: 'Toyota Corolla E210',
  years: [2018, 2019, 2020, 2021, 2022, 2023, 2024],
  platform: 'TNGA-C (GA-C)',
  ecus: buildToyotaEcus({ hasHybrid: true }),
};

// ── Экспорт ───────────────────────────────────────────────────────────────────

const toyotaDB: MakeDB = {
  id: 'toyota',
  name: 'Toyota',
  region: 'JP/GLOBAL',
  protocol_family: 'Toyota CAN / ISO 15765-4 / ISO 14229 UDS / Toyota Techstream',
  models: [toyotaCamryV70, toyotaRav4V, toyotaLandCruiser300, toyotaHighlanderU70, toyotaCorollaE210],
};

export default toyotaDB;
