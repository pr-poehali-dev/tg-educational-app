// ── Mercedes-Benz ECU Database ────────────────────────────────────────────────
// Полная база данных блоков управления для диагностики автомобилей Mercedes-Benz

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

// ── Живые данные ME/CDI/OM (двигатель) ───────────────────────────────────────

const engineLiveParams: EcuParam[] = [
  {
    id: 'rpm',
    name: 'Обороты двигателя',
    pid: '0x0101',
    unit: 'об/мин',
    formula: '(A * 256 + B) / 4',
    min: 0,
    max: 7500,
    group: 'ENG-001',
  },
  {
    id: 'coolant_temp',
    name: 'Температура охлаждающей жидкости',
    pid: '0x0102',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 130,
    group: 'ENG-001',
  },
  {
    id: 'oil_temp',
    name: 'Температура моторного масла',
    pid: '0x0103',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'ENG-001',
  },
  {
    id: 'throttle_pos',
    name: 'Положение педали акселератора',
    pid: '0x0104',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ENG-001',
  },
  {
    id: 'engine_load',
    name: 'Нагрузка двигателя (расчётная)',
    pid: '0x0105',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ENG-001',
  },
  {
    id: 'rail_pressure_actual',
    name: 'Давление в топливной рампе Common Rail (факт.)',
    pid: '0x0106',
    unit: 'МПа',
    formula: '(A * 256 + B) * 0.1',
    min: 0,
    max: 200,
    group: 'ENG-002',
  },
  {
    id: 'rail_pressure_setpoint',
    name: 'Давление в рампе Common Rail (уставка)',
    pid: '0x0107',
    unit: 'МПа',
    formula: '(A * 256 + B) * 0.1',
    min: 0,
    max: 200,
    group: 'ENG-002',
  },
  {
    id: 'injection_qty',
    name: 'Цикловая подача топлива',
    pid: '0x0108',
    unit: 'мг/цикл',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 120,
    group: 'ENG-002',
  },
  {
    id: 'boost_actual',
    name: 'Давление наддува (факт.)',
    pid: '0x0109',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 3500,
    group: 'ENG-003',
  },
  {
    id: 'boost_setpoint',
    name: 'Давление наддува (уставка)',
    pid: '0x010A',
    unit: 'мбар',
    formula: '(A * 256 + B) - 1000',
    min: 800,
    max: 3500,
    group: 'ENG-003',
  },
  {
    id: 'egr_valve_pos',
    name: 'Положение клапана EGR (факт.)',
    pid: '0x010B',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ENG-004',
  },
  {
    id: 'egr_setpoint',
    name: 'Положение клапана EGR (уставка)',
    pid: '0x010C',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ENG-004',
  },
  {
    id: 'dpf_soot_load',
    name: 'Степень засажённости DPF (сажевый фильтр)',
    pid: '0x010D',
    unit: 'г/л',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 15,
    group: 'ENG-005',
  },
  {
    id: 'dpf_pressure_diff',
    name: 'Перепад давления на DPF',
    pid: '0x010E',
    unit: 'мбар',
    formula: '(A * 256 + B)',
    min: 0,
    max: 500,
    group: 'ENG-005',
  },
  {
    id: 'dpf_temp_before',
    name: 'Температура перед DPF',
    pid: '0x010F',
    unit: '°C',
    formula: '(A * 256 + B) - 200',
    min: -40,
    max: 1000,
    group: 'ENG-005',
  },
  {
    id: 'urea_injection',
    name: 'Подача мочевины AdBlue (дизель)',
    pid: '0x0110',
    unit: 'мг/цикл',
    formula: '(A * 256 + B) / 1000',
    min: 0,
    max: 10,
    group: 'ENG-006',
  },
  {
    id: 'urea_tank_level',
    name: 'Уровень AdBlue в баке',
    pid: '0x0111',
    unit: '%',
    formula: '(A / 255) * 100',
    min: 0,
    max: 100,
    group: 'ENG-006',
  },
  {
    id: 'lambda_b1s1',
    name: 'Лямбда-зонд B1S1 (широкополосный LSU)',
    pid: '0x0112',
    unit: 'λ',
    formula: '((A * 256 + B) / 32768) * 2',
    min: 0.5,
    max: 2.0,
    group: 'ENG-007',
  },
  {
    id: 'o2_b1s2',
    name: 'Датчик O₂ B1S2 (управляющий, после катализатора)',
    pid: '0x0113',
    unit: 'В',
    formula: '(A * 256 + B) / 200',
    min: 0.0,
    max: 1.275,
    group: 'ENG-007',
  },
  {
    id: 'intake_temp',
    name: 'Температура воздуха за интеркулером',
    pid: '0x0114',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 120,
    group: 'ENG-003',
  },
  {
    id: 'knock_correction',
    name: 'Угол коррекции зажигания по детонации',
    pid: '0x0115',
    unit: '°',
    formula: 'A / 2 - 64',
    min: -20,
    max: 0,
    group: 'ENG-008',
  },
  {
    id: 'camshaft_intake',
    name: 'Угол фазовращателя распредвала впуска',
    pid: '0x0116',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'ENG-008',
  },
  {
    id: 'camshaft_exhaust',
    name: 'Угол фазовращателя распредвала выпуска',
    pid: '0x0117',
    unit: '° КВ',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -60,
    max: 60,
    group: 'ENG-008',
  },
  {
    id: 'battery_voltage',
    name: 'Напряжение бортовой сети',
    pid: '0x0118',
    unit: 'В',
    formula: '(A * 256 + B) / 1000',
    min: 9.0,
    max: 15.5,
    group: 'ENG-001',
  },
  {
    id: 'vehicle_speed',
    name: 'Скорость автомобиля',
    pid: '0x0119',
    unit: 'км/ч',
    formula: 'A',
    min: 0,
    max: 300,
    group: 'ENG-001',
  },
];

// ── Живые данные EGS/722 (АКПП) ──────────────────────────────────────────────

const egsLiveParams: EcuParam[] = [
  {
    id: 'egs_oil_temp',
    name: 'Температура масла АКПП (7G/9G-Tronic)',
    pid: '0x0201',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 175,
    group: 'EGS-001',
  },
  {
    id: 'egs_gear',
    name: 'Текущая передача',
    pid: '0x0202',
    unit: '',
    formula: 'A',
    min: 0,
    max: 9,
    group: 'EGS-001',
  },
  {
    id: 'egs_tc_slip',
    name: 'Скольжение гидротрансформатора',
    pid: '0x0203',
    unit: 'об/мин',
    formula: '(A * 256 + B) - 3276',
    min: -200,
    max: 3000,
    group: 'EGS-002',
  },
  {
    id: 'egs_selector',
    name: 'Положение рычага АКПП',
    pid: '0x0204',
    unit: '',
    formula: 'A',
    min: 0,
    max: 8,
    group: 'EGS-001',
  },
  {
    id: 'egs_line_pressure',
    name: 'Давление в главной магистрали АКПП',
    pid: '0x0205',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 30,
    group: 'EGS-002',
  },
  {
    id: 'egs_solenoid_1',
    name: 'Состояние соленоида K1 (ток)',
    pid: '0x0206',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 1500,
    group: 'EGS-003',
  },
  {
    id: 'egs_solenoid_2',
    name: 'Состояние соленоида K2 (ток)',
    pid: '0x0207',
    unit: 'мА',
    formula: '(A * 256 + B)',
    min: 0,
    max: 1500,
    group: 'EGS-003',
  },
  {
    id: 'egs_input_rpm',
    name: 'Обороты входного вала АКПП',
    pid: '0x0208',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 8000,
    group: 'EGS-001',
  },
  {
    id: 'egs_output_rpm',
    name: 'Обороты выходного вала АКПП',
    pid: '0x0209',
    unit: 'об/мин',
    formula: '(A * 256 + B)',
    min: 0,
    max: 6000,
    group: 'EGS-001',
  },
];

// ── Живые данные SBC/ESP ──────────────────────────────────────────────────────

const espLiveParams: EcuParam[] = [
  {
    id: 'esp_speed_fl',
    name: 'Скорость колеса: переднее левое',
    pid: '0x0301',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ESP-001',
  },
  {
    id: 'esp_speed_fr',
    name: 'Скорость колеса: переднее правое',
    pid: '0x0302',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ESP-001',
  },
  {
    id: 'esp_speed_rl',
    name: 'Скорость колеса: заднее левое',
    pid: '0x0303',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ESP-001',
  },
  {
    id: 'esp_speed_rr',
    name: 'Скорость колеса: заднее правое',
    pid: '0x0304',
    unit: 'км/ч',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 300,
    group: 'ESP-001',
  },
  {
    id: 'esp_yaw_rate',
    name: 'Угловая скорость рыскания',
    pid: '0x0305',
    unit: '°/с',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -150,
    max: 150,
    group: 'ESP-002',
  },
  {
    id: 'esp_lateral_accel',
    name: 'Поперечное ускорение (боковой G)',
    pid: '0x0306',
    unit: 'м/с²',
    formula: '((A * 256 + B) - 32767) / 1000',
    min: -20,
    max: 20,
    group: 'ESP-002',
  },
  {
    id: 'esp_brake_pressure',
    name: 'Давление тормозного контура (гидравлическое)',
    pid: '0x0307',
    unit: 'бар',
    formula: '(A * 256 + B) / 10',
    min: 0,
    max: 250,
    group: 'ESP-003',
  },
  {
    id: 'esp_steering_angle',
    name: 'Угол поворота рулевого колеса',
    pid: '0x0308',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'ESP-003',
  },
  {
    id: 'esp_abs_active',
    name: 'Активность ABS',
    pid: '0x0309',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'ESP-001',
  },
  {
    id: 'esp_active',
    name: 'Активность ESP',
    pid: '0x030A',
    unit: '',
    formula: '(A >> 1) & 0x01',
    min: 0,
    max: 1,
    group: 'ESP-001',
  },
];

// ── Живые данные Airmatic/ABC (пневмоподвеска) ───────────────────────────────

const airmaticLiveParams: EcuParam[] = [
  {
    id: 'air_height_fl',
    name: 'Уровень кузова: переднее левое',
    pid: '0x2301',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -120,
    max: 120,
    group: 'AIR-001',
  },
  {
    id: 'air_height_fr',
    name: 'Уровень кузова: переднее правое',
    pid: '0x2302',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -120,
    max: 120,
    group: 'AIR-001',
  },
  {
    id: 'air_height_rl',
    name: 'Уровень кузова: заднее левое',
    pid: '0x2303',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -120,
    max: 120,
    group: 'AIR-001',
  },
  {
    id: 'air_height_rr',
    name: 'Уровень кузова: заднее правое',
    pid: '0x2304',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -120,
    max: 120,
    group: 'AIR-001',
  },
  {
    id: 'air_compressor_pressure',
    name: 'Давление воздуха в ресивере компрессора',
    pid: '0x2305',
    unit: 'бар',
    formula: '(A * 256 + B) / 100',
    min: 0,
    max: 20,
    group: 'AIR-002',
  },
  {
    id: 'air_valve_fl',
    name: 'Состояние клапана: переднее левое',
    pid: '0x2306',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'AIR-003',
  },
  {
    id: 'air_valve_fr',
    name: 'Состояние клапана: переднее правое',
    pid: '0x2307',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'AIR-003',
  },
  {
    id: 'air_valve_rl',
    name: 'Состояние клапана: заднее левое',
    pid: '0x2308',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'AIR-003',
  },
  {
    id: 'air_valve_rr',
    name: 'Состояние клапана: заднее правое',
    pid: '0x2309',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'AIR-003',
  },
  {
    id: 'air_body_level_target',
    name: 'Целевой уровень кузова',
    pid: '0x230A',
    unit: 'мм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -120,
    max: 120,
    group: 'AIR-001',
  },
  {
    id: 'air_compressor_state',
    name: 'Состояние компрессора Airmatic',
    pid: '0x230B',
    unit: '',
    formula: 'A & 0x01',
    min: 0,
    max: 1,
    group: 'AIR-002',
  },
  {
    id: 'air_compressor_temp',
    name: 'Температура компрессора Airmatic',
    pid: '0x230C',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 180,
    group: 'AIR-002',
  },
  {
    id: 'air_mode',
    name: 'Режим подвески (Comfort/Sport/High)',
    pid: '0x230D',
    unit: '',
    formula: 'A',
    min: 0,
    max: 4,
    group: 'AIR-002',
  },
];

// ── Живые данные EPS Mercedes ─────────────────────────────────────────────────

const epsLiveParams: EcuParam[] = [
  {
    id: 'eps_angle',
    name: 'Угол рулевого вала EPS',
    pid: '0x2B01',
    unit: '°',
    formula: '((A * 256 + B) - 32767) / 10',
    min: -720,
    max: 720,
    group: 'EPS-001',
  },
  {
    id: 'eps_driver_torque',
    name: 'Момент на рулевом колесе (водитель)',
    pid: '0x2B02',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -25,
    max: 25,
    group: 'EPS-001',
  },
  {
    id: 'eps_assist_torque',
    name: 'Ассистирующий момент EPAS',
    pid: '0x2B03',
    unit: 'Нм',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -70,
    max: 70,
    group: 'EPS-001',
  },
  {
    id: 'eps_motor_current',
    name: 'Ток электродвигателя EPS',
    pid: '0x2B04',
    unit: 'А',
    formula: '((A * 256 + B) - 32767) / 100',
    min: -90,
    max: 90,
    group: 'EPS-002',
  },
  {
    id: 'eps_motor_temp',
    name: 'Температура электродвигателя EPS',
    pid: '0x2B05',
    unit: '°C',
    formula: 'A - 40',
    min: -40,
    max: 160,
    group: 'EPS-002',
  },
  {
    id: 'eps_voltage',
    name: 'Напряжение питания EPS',
    pid: '0x2B06',
    unit: 'В',
    formula: '(A * 256 + B) / 100',
    min: 9,
    max: 16,
    group: 'EPS-002',
  },
];

// ── Определения ЭБУ Mercedes-Benz ────────────────────────────────────────────

const meEcu: EcuDefinition = {
  id: 'me_cdi',
  name: 'Блок управления двигателем (ME / CDI / Bosch MED17)',
  address: '0x01',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS / KWP2000',
  description: 'Основной блок управления двигателем Mercedes-Benz (ME для бензиновых, CDI для дизельных). Управляет впрыском, зажиганием/HPFP, наддувом, EGR, DPF, SCR (AdBlue) и фазовращателями.',
  functions: [
    {
      id: 'me_read_dtc',
      name: 'Считать коды неисправностей ДВС',
      type: 'read_dtc',
      description: 'Считывает активные и сохранённые коды неисправностей из памяти блока ME/CDI Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'me_clear_dtc',
      name: 'Стереть коды неисправностей ДВС',
      type: 'clear_dtc',
      description: 'Удаляет все коды неисправностей из памяти блока ME/CDI. Сбрасывает флаги мониторов готовности OBD-II.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания необходим ездовой цикл Mercedes для активации мониторов OBD.',
    },
    {
      id: 'me_live_data',
      name: 'Текущие параметры ДВС (живые данные)',
      type: 'live_data',
      description: 'Параметры работы двигателя Mercedes-Benz в реальном времени: RPM, температуры, давление в рампе, наддув, EGR, DPF, AdBlue, лямбда-зонды, фазовращатели.',
      protocol_cmd: '22 XX XX',
      params: engineLiveParams,
    },
    {
      id: 'me_injector_test',
      name: 'Тест форсунок (поочерёдная активация)',
      type: 'activation',
      description: 'Поочерёдная активация форсунок Common Rail (CDI) или бензиновых форсунок прямого впрыска для проверки работоспособности и диагностики.',
      protocol_cmd: '31 01 01 01',
      warning: 'Выполнять при заглушённом двигателе. Для CDI — не допускать избыточного впрыска топлива в цилиндры.',
    },
    {
      id: 'me_swirl_adapt',
      name: 'Адаптация вихревых заслонок (CDI)',
      type: 'adaptation',
      description: 'Процедура адаптации положений вихревых заслонок впускного коллектора дизельного двигателя CDI. Выполняется после замены заслонок или привода.',
      protocol_cmd: '31 01 01 02',
      warning: 'Применимо только к дизельным версиям CDI. Двигатель должен быть прогрет.',
    },
    {
      id: 'me_service_a_reset',
      name: 'Сброс сервиса A (Service A Reset)',
      type: 'service',
      description: 'Сброс счётчика интервала обслуживания Сервис A Mercedes-Benz (масло + фильтры). Выполняется после прохождения Сервис A.',
      protocol_cmd: '31 01 01 03',
      warning: 'Только после фактического выполнения Сервиса A согласно регламенту Mercedes-Benz.',
    },
    {
      id: 'me_service_b_reset',
      name: 'Сброс сервиса B (Service B Reset)',
      type: 'service',
      description: 'Сброс счётчика расширенного технического обслуживания Сервис B Mercedes-Benz (масло, фильтры, тормозная жидкость, свечи, ремни и т.д.).',
      protocol_cmd: '31 01 01 04',
      warning: 'Только после фактического выполнения Сервиса B согласно регламенту Mercedes-Benz.',
    },
    {
      id: 'me_adblue_reset',
      name: 'Сброс предупреждения AdBlue (SCR)',
      type: 'service',
      description: 'Сброс предупреждения о низком уровне мочевины AdBlue и обнуление данных дозирования SCR (Selective Catalytic Reduction) после заправки AdBlue.',
      protocol_cmd: '31 01 01 05',
      warning: 'Выполнять только после заправки AdBlue до необходимого уровня. Игнорирование предупреждения AdBlue может привести к блокировке запуска двигателя.',
    },
    {
      id: 'me_dpf_regen',
      name: 'Принудительная регенерация DPF (сажевого фильтра)',
      type: 'activation',
      description: 'Запуск принудительной регенерации сажевого фильтра DPF — выжигание сажи путём повышения температуры выхлопных газов до 600-700°C. Выполняется при высокой степени засажённости.',
      protocol_cmd: '31 01 01 06',
      warning: 'Выполнять на открытой площадке. Не использовать вблизи горючих материалов! Температура выхлопа резко возрастает. Процедура занимает 20-40 минут.',
    },
    {
      id: 'me_oil_reset',
      name: 'Сброс интервала замены масла',
      type: 'service',
      description: 'Целевой сброс счётчика интервала замены моторного масла в блоке ME/CDI Mercedes-Benz.',
      protocol_cmd: '31 01 01 07',
    },
    {
      id: 'me_scn_coding',
      name: 'SCN-кодирование ME/CDI',
      type: 'coding',
      description: 'Variant coding (SCN Coding) — кодирование блока управления двигателем Mercedes-Benz после замены или обновления ПО. Требует VIN и авторизацию Mercedes-Benz Online.',
      protocol_cmd: '2E XX XX XX',
      warning: 'SCN-кодирование требует подключения к серверу Mercedes-Benz. Без кодирования после замены блок будет ограниченно функционировать.',
    },
  ],
};

const egsEcu: EcuDefinition = {
  id: 'egs',
  name: 'Блок управления АКПП (EGS / 7G-Tronic / 9G-Tronic)',
  address: '0x02',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Электронное управление коробкой передач Mercedes-Benz. Обслуживает 7-ступенчатый автомат 7G-Tronic (722.9) или 9-ступенчатый 9G-Tronic (725.0). Управляет переключениями, блокировкой ГТ и давлениями.',
  functions: [
    {
      id: 'egs_read_dtc',
      name: 'Считать коды неисправностей АКПП',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока управления АКПП Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'egs_clear_dtc',
      name: 'Стереть коды неисправностей АКПП',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока EGS.',
      protocol_cmd: '14 FF FF FF',
      warning: 'После стирания выполнить проверочную поездку для подтверждения устранения неисправности.',
    },
    {
      id: 'egs_live_data',
      name: 'Текущие параметры АКПП',
      type: 'live_data',
      description: 'Температура масла, передача, скольжение ГТ, давление в магистрали, состояние соленоидов, обороты валов в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: egsLiveParams,
    },
    {
      id: 'egs_adaptation_reset',
      name: 'Сброс адаптаций АКПП',
      type: 'adaptation',
      description: 'Сброс накопленных адаптаций АКПП Mercedes-Benz (давлений переключения, характеристик соленоидов, точки блокировки ГТ). Выполняется после замены масла ATF, гидроблока или при дёрганьях.',
      protocol_cmd: '31 01 02 01',
      warning: 'После сброса необходима плавная обкатка АКПП: не менее 500 км в нормальном режиме без форсированных разгонов.',
    },
    {
      id: 'egs_oil_reset',
      name: 'Сброс интервала замены масла АКПП',
      type: 'service',
      description: 'Сброс счётчика интервала замены трансмиссионного масла ATF в блоке EGS Mercedes-Benz.',
      protocol_cmd: '31 01 02 02',
    },
    {
      id: 'egs_scn_coding',
      name: 'SCN-кодирование EGS',
      type: 'coding',
      description: 'Variant coding / SCN Coding блока управления АКПП после замены или обновления программного обеспечения. Требует авторизацию Mercedes-Benz Online.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Требуется онлайн-авторизация Mercedes-Benz Xentry для записи кода SCN.',
    },
  ],
};

const espEcu: EcuDefinition = {
  id: 'sbc_esp',
  name: 'Блок ESP / SBC (Sensotronic Brake Control / Bosch)',
  address: '0x03',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Блок управления ESP и (для старших моделей) Sensotronic Brake Control (SBC) Mercedes-Benz. Реализует ABS, ESP, ASR, BAS, Hill-Start и электронную блокировку дифференциала.',
  functions: [
    {
      id: 'esp_read_dtc',
      name: 'Считать коды неисправностей ESP/SBC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока ESP/SBC Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'esp_clear_dtc',
      name: 'Стереть коды неисправностей ESP/SBC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока ESP/SBC.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'esp_live_data',
      name: 'Текущие параметры ESP/SBC',
      type: 'live_data',
      description: 'Скорости четырёх колёс, угловая скорость рыскания, боковое ускорение, гидравлическое давление тормозов, угол руля в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: espLiveParams,
    },
    {
      id: 'esp_sas_adapt',
      name: 'Адаптация датчика угла рулевого колеса (SAS)',
      type: 'adaptation',
      description: 'Калибровка нулевого положения датчика угла поворота рулевого колеса Mercedes-Benz. Выполняется после ремонта рулевого управления, замены блока ESP или регулировки углов установки колёс.',
      protocol_cmd: '31 01 03 01',
      warning: 'Автомобиль на ровной горизонтальной поверхности, передние колёса установлены прямо.',
    },
    {
      id: 'esp_brake_bleed',
      name: 'Прокачка тормозов (с активацией насоса ESP/SBC)',
      type: 'activation',
      description: 'Активация гидравлического насоса блока ESP/SBC для прокачки тормозной системы и удаления воздуха из гидромодулятора.',
      protocol_cmd: '31 01 03 02',
      warning: 'Уровень тормозной жидкости выше MIN! Требуется помощник. При SBC — использовать специальный режим прокачки, не осушать аккумулятор SBC.',
    },
    {
      id: 'esp_pad_reset',
      name: 'Сброс индикатора износа тормозных колодок',
      type: 'service',
      description: 'Сброс предупреждения об износе тормозных колодок в блоке ESP Mercedes-Benz после их замены.',
      protocol_cmd: '31 01 03 03',
    },
  ],
};

const airbagMercEcu: EcuDefinition = {
  id: 'srs_airbag',
  name: 'Блок управления SRS / Airbag (Mercedes-Benz)',
  address: '0x15',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Блок управления системой пассивной безопасности Mercedes-Benz SRS. Управляет фронтальными и боковыми подушками безопасности, шторками, преднатяжителями ремней и датчиками давления в сиденьях.',
  functions: [
    {
      id: 'srs_read_dtc',
      name: 'Считать коды неисправностей SRS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока SRS Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'srs_clear_dtc',
      name: 'Стереть коды неисправностей SRS',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока SRS.',
      protocol_cmd: '14 FF FF FF',
      warning: 'Перед стиранием устранить все неисправности. Повреждение SRS опасно для жизни!',
    },
    {
      id: 'srs_crash_data',
      name: 'Чтение данных о ДТП (Crash Data / Event Data)',
      type: 'service',
      description: 'Считывание зафиксированных данных на момент срабатывания SRS Mercedes-Benz: скорость, ускорения, состояние ремней, временные метки срабатывания каждого пиропатрона.',
      protocol_cmd: '19 02 09',
      warning: 'Crash Data не стираются стандартными командами. Для сброса необходима авторизованная процедура Mercedes-Benz Xentry.',
    },
  ],
};

const airmaticEcu: EcuDefinition = {
  id: 'airmatic',
  name: 'Пневматическая подвеска (Airmatic / ABC)',
  address: '0x23',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Блок управления пневматической подвеской Airmatic (E/S-Class) или гидравлической активной подвеской ABC (Active Body Control, S-Class). Управляет высотой кузова и жёсткостью в зависимости от режима Comfort/Sport.',
  functions: [
    {
      id: 'air_read_dtc',
      name: 'Считать коды неисправностей Airmatic/ABC',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока пневматической/гидравлической подвески Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'air_clear_dtc',
      name: 'Стереть коды неисправностей Airmatic/ABC',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока Airmatic/ABC.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'air_live_data',
      name: 'Текущие параметры Airmatic/ABC',
      type: 'live_data',
      description: 'Уровни кузова в четырёх точках, давление в ресивере, состояние клапанов и компрессора, режим подвески в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: airmaticLiveParams,
    },
    {
      id: 'air_level_calibration',
      name: 'Калибровка датчиков уровня кузова',
      type: 'adaptation',
      description: 'Обучение нулевых точек датчиков высоты кузова Airmatic. Выполняется после замены датчика уровня, пневмостойки, рычага подвески или блока управления.',
      protocol_cmd: '31 01 23 01',
      warning: 'Автомобиль на ровной горизонтальной поверхности без нагрузки. Шины накачаны по норме.',
    },
    {
      id: 'air_compressor_test',
      name: 'Тест компрессора Airmatic',
      type: 'activation',
      description: 'Принудительное включение компрессора пневматической подвески Airmatic для проверки производительности и давления накачки.',
      protocol_cmd: '31 01 23 02',
      warning: 'Не запускать при температуре компрессора выше 120°C. Дать остыть перед повторным тестом.',
    },
    {
      id: 'air_scn_coding',
      name: 'SCN-кодирование Airmatic',
      type: 'coding',
      description: 'Variant coding / SCN Coding блока управления подвеской Airmatic после замены или обновления ПО.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Требуется онлайн-авторизация Mercedes-Benz Xentry для записи кода SCN.',
    },
  ],
};

const epsEcuMerc: EcuDefinition = {
  id: 'eps_epas',
  name: 'Электроусилитель руля EPS / EPAS (Mercedes-Benz)',
  address: '0x2B',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Блок управления электрическим усилителем рулевого управления EPAS Mercedes-Benz. Включает адаптивное усиление (ACPS), функцию Active Parking Assist и интеграцию с системами Distronic Plus.',
  functions: [
    {
      id: 'eps_read_dtc',
      name: 'Считать коды неисправностей EPS',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока EPS/EPAS Mercedes-Benz.',
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
      description: 'Угол руля, момент водителя, ассистирующий момент, ток и температура электродвигателя в реальном времени.',
      protocol_cmd: '22 XX XX',
      params: epsLiveParams,
    },
    {
      id: 'eps_sas_calibration',
      name: 'Калибровка датчика угла руля EPS (SAS)',
      type: 'adaptation',
      description: 'Калибровка нулевого положения датчика рулевого вала блока EPS Mercedes-Benz. Выполняется после замены рулевой рейки, блока EPS или регулировки сход-развала.',
      protocol_cmd: '31 01 2B 01',
      warning: 'Автомобиль неподвижен, колёса прямо. Не вращать руль в процессе калибровки.',
    },
    {
      id: 'eps_torque_adjustment',
      name: 'Регулировка характеристики усиления EPS',
      type: 'adaptation',
      description: 'Корректировка кривой усиления рулевого управления EPS Mercedes-Benz. Используется при перекалибровке или замене блока.',
      protocol_cmd: '2E 2B F0 XX',
      warning: 'Изменение усиления влияет на управляемость. Только для квалифицированных специалистов.',
    },
    {
      id: 'eps_scn_coding',
      name: 'SCN-кодирование EPS',
      type: 'coding',
      description: 'Variant coding / SCN Coding блока EPS после замены. Необходима привязка к VIN и авторизация через Mercedes-Benz Xentry Online.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Требуется онлайн-авторизация Mercedes-Benz Xentry.',
    },
  ],
};

const scmEcu: EcuDefinition = {
  id: 'scm_kombi',
  name: 'Щиток приборов / Cockpit (SCM / KI)',
  address: '0x07',
  protocol: 'Mercedes-Benz CAN / ISO 14229 UDS',
  description: 'Блок управления щитком приборов и центром управления автомобилем Mercedes-Benz. Хранит данные техобслуживания (Сервис A/B), пробег, отображает информацию на цифровом щитке MBUX.',
  functions: [
    {
      id: 'scm_read_dtc',
      name: 'Считать коды неисправностей щитка',
      type: 'read_dtc',
      description: 'Считывает коды неисправностей блока SCM Mercedes-Benz.',
      protocol_cmd: '19 02 FF',
    },
    {
      id: 'scm_clear_dtc',
      name: 'Стереть коды неисправностей щитка',
      type: 'clear_dtc',
      description: 'Удаляет коды неисправностей из памяти блока SCM.',
      protocol_cmd: '14 FF FF FF',
    },
    {
      id: 'scm_service_reset',
      name: 'Сброс сервисного интервала Сервис A/B',
      type: 'service',
      description: 'Сброс индикатора сервисного обслуживания Сервис A или Сервис B в щитке приборов Mercedes-Benz. Выполняется после прохождения соответствующего вида ТО.',
      protocol_cmd: '31 01 07 01',
      warning: 'Убедитесь, что ТО фактически выполнено согласно регламенту Mercedes-Benz.',
    },
    {
      id: 'scm_oil_reset',
      name: 'Сброс счётчика замены масла',
      type: 'service',
      description: 'Целевой сброс только счётчика замены моторного масла в щитке приборов Mercedes-Benz.',
      protocol_cmd: '31 01 07 02',
    },
    {
      id: 'scm_scn_coding',
      name: 'SCN-кодирование щитка приборов',
      type: 'coding',
      description: 'Variant coding / SCN Coding щитка приборов Mercedes-Benz после замены. Привязывает блок к VIN, устанавливает опции оснащения и единицы измерения.',
      protocol_cmd: '2E XX XX XX',
      warning: 'Требуется онлайн-авторизация Mercedes-Benz Xentry Online для получения и записи SCN-кода.',
    },
  ],
};

// ── Фабричная функция ─────────────────────────────────────────────────────────

function buildMercEcus(options?: { hasAirmatic?: boolean }): EcuDefinition[] {
  const base: EcuDefinition[] = [meEcu, egsEcu, espEcu, airbagMercEcu, epsEcuMerc, scmEcu];
  if (options?.hasAirmatic) base.push(airmaticEcu);
  return base;
}

// ── Модели Mercedes-Benz ──────────────────────────────────────────────────────

const mercCW205: ModelDefinition = {
  id: 'c_w205',
  name: 'Mercedes-Benz C-Class W205',
  years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
  platform: 'MRA (Modular Rear Architecture)',
  ecus: buildMercEcus({ hasAirmatic: false }),
};

const mercEW213: ModelDefinition = {
  id: 'e_w213',
  name: 'Mercedes-Benz E-Class W213',
  years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
  platform: 'MRA (Modular Rear Architecture)',
  ecus: buildMercEcus({ hasAirmatic: true }),
};

const mercGlcX253: ModelDefinition = {
  id: 'glc_x253',
  name: 'Mercedes-Benz GLC X253',
  years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
  platform: 'MHA (Modular High Architecture)',
  ecus: buildMercEcus({ hasAirmatic: true }),
};

const mercSW222: ModelDefinition = {
  id: 's_w222',
  name: 'Mercedes-Benz S-Class W222',
  years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
  platform: 'MRA (Modular Rear Architecture)',
  ecus: buildMercEcus({ hasAirmatic: true }),
};

// ── Экспорт ───────────────────────────────────────────────────────────────────

const mercedesDB: MakeDB = {
  id: 'mercedes',
  name: 'Mercedes-Benz',
  region: 'EU',
  protocol_family: 'Mercedes-Benz CAN (MOST / FlexRay) / ISO 14229 UDS / KWP2000 / Xentry DoIP',
  models: [mercCW205, mercEW213, mercGlcX253, mercSW222],
};

export default mercedesDB;
