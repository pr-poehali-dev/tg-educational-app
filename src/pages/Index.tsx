import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';
import { VEHICLE_DB, REGIONS, type EcuBlock, type EcuFunction } from '@/data/vehicles';
import { DTC_DB } from '@/data/dtc';
import { elm327, LIVE_PARAMS_CONFIG, PARAM_GROUPS, type LiveParam } from '@/lib/bluetooth';
import { useBuiltinProtocols } from '@/hooks/useBuiltinProtocols';

// ── VIN API ───────────────────────────────────────────────────────────────────
interface VinResult {
  vin: string; make: string; model: string; year: string;
  type: string; engine: string; fuel: string; country: string;
  doors: string; drive: string; transmission: string;
  wmi: string; vds: string; serial: string;
}
function localCountry(vin: string): string {
  const map: Record<string, string> = { W: 'Германия', V: 'Швеция/Франция', S: 'Великобритания', Z: 'Италия', X: 'Россия', J: 'Япония', K: 'Южная Корея', L: 'Китай', '1': 'США', '2': 'Канада', '3': 'Мексика' };
  return map[vin[0]] || 'Неизвестно';
}
function localDecodeVin(vin: string): VinResult {
  const v = vin.toUpperCase();
  const makes: Record<string, string> = { WVW: 'Volkswagen', WAU: 'Audi', WBA: 'BMW', WDD: 'Mercedes-Benz', WDB: 'Mercedes-Benz', TMB: 'Škoda', VSS: 'SEAT', JTD: 'Toyota', JTM: 'Toyota', SAL: 'Land Rover', XTA: 'LADA (ВАЗ)', YV1: 'Volvo', ZAR: 'Alfa Romeo', KNM: 'Kia', KMH: 'Hyundai', VF1: 'Renault', VF3: 'Peugeot' };
  const years: Record<string, string> = { A:'1980',B:'1981',C:'1982',D:'1983',E:'1984',F:'1985',G:'1986',H:'1987',J:'1988',K:'1989',L:'1990',M:'1991',N:'1992',P:'1993',R:'1994',S:'1995',T:'1996',V:'1997',W:'1998',X:'1999',Y:'2000','1':'2001','2':'2002','3':'2003','4':'2004','5':'2005','6':'2006','7':'2007','8':'2008','9':'2009' };
  return { vin: v, make: makes[v.slice(0,3)] || 'Неизвестно', model: '—', year: years[v[9]] || '—', type: '—', engine: '—', fuel: '—', country: localCountry(v), doors: '—', drive: '—', transmission: '—', wmi: v.slice(0,3), vds: v.slice(3,9), serial: v.slice(11) };
}
async function fetchVin(vin: string): Promise<VinResult> {
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
    const json = await res.json();
    const r = json.Results?.[0];
    if (!r || r.ErrorCode !== '0') return localDecodeVin(vin);
    const tf = (v: string) => !v ? '—' : v.includes('Gasoline') ? 'Бензин' : v.includes('Diesel') ? 'Дизель' : v.includes('Electric') ? 'Электро' : v.includes('Hybrid') ? 'Гибрид' : v;
    const td = (v: string) => !v ? '—' : v.includes('FWD') ? 'Передний (FWD)' : v.includes('RWD') ? 'Задний (RWD)' : (v.includes('AWD') || v.includes('4WD')) ? 'Полный (AWD)' : v;
    const tt = (v: string) => !v ? '—' : v.includes('Automatic') ? 'Автоматическая' : v.includes('Manual') ? 'Механическая' : v.includes('CVT') ? 'Вариатор (CVT)' : v;
    return { vin: vin.toUpperCase(), make: r.Make||'—', model: r.Model||'—', year: r.ModelYear||'—', type: r.VehicleType||'—', engine: r.DisplacementL ? `${parseFloat(r.DisplacementL).toFixed(1)}L ${r.EngineCylinders||''}-цил.` : '—', fuel: tf(r.FuelTypePrimary), country: r.PlantCountry||localCountry(vin), doors: r.Doors||'—', drive: td(r.DriveType), transmission: tt(r.TransmissionStyle), wmi: vin.slice(0,3), vds: vin.slice(3,9), serial: vin.slice(11) };
  } catch { return localDecodeVin(vin); }
}

// ── DTC статусы ───────────────────────────────────────────────────────────────
type DtcStatus = 'active' | 'stored' | 'temporary' | 'historical';
const STATUS_CFG: Record<DtcStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:     { label: 'Активная',     color: 'text-red-400',          bg: 'bg-red-400/15',    dot: 'bg-red-400' },
  stored:     { label: 'Сохранённая',  color: 'text-amber-400',        bg: 'bg-amber-400/15',  dot: 'bg-amber-400' },
  temporary:  { label: 'Временная',    color: 'text-yellow-300',       bg: 'bg-yellow-300/15', dot: 'bg-yellow-300' },
  historical: { label: 'Историческая', color: 'text-muted-foreground', bg: 'bg-secondary',     dot: 'bg-muted-foreground' },
};
interface DtcEntry { code: string; status: DtcStatus; count: number; lastSeen: string; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
function BackBtn({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 active:scale-95">
      <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center">
        <Icon name="ChevronLeft" size={16} />
      </div>
      <span>{label}</span>
    </button>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-2xl text-foreground leading-tight">{title}</h2>
      {sub && <div className="text-sm text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ── DTC Card (с автоподгрузкой из справочника) ───────────────────────────────
function DtcCard({ entry }: { entry: DtcEntry }) {
  const [open, setOpen] = useState(false);
  const info = DTC_DB[entry.code];
  const st = STATUS_CFG[entry.status];
  const sev = info?.severity;
  return (
    <div className={`bg-card rounded-xl overflow-hidden border ${entry.status === 'active' ? 'border-red-500/40' : entry.status === 'stored' ? 'border-amber-400/30' : 'border-border'}`}>
      <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setOpen(o => !o)}>
        <div className="flex flex-col items-center gap-1.5 shrink-0 mt-0.5">
          <span className={`font-mono font-bold text-sm ${sev === 'error' ? 'text-red-400' : sev === 'warn' ? 'text-amber-400' : 'text-cyan'}`}>{entry.code}</span>
          <span className={`w-2 h-2 rounded-full ${st.dot}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium leading-snug">{info?.desc || 'Неизвестный код — нет в справочнике'}</div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
            {info?.system && <span className="text-[11px] text-muted-foreground">{info.system}</span>}
            <span className="text-[11px] text-muted-foreground">{entry.count}× · {entry.lastSeen}</span>
          </div>
        </div>
        <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0 mt-1" />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border space-y-3">
          {info ? (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed pt-3">{info.detail}</p>
              <div>
                <div className="font-display text-[11px] text-muted-foreground mb-1.5">ПРИЧИНЫ</div>
                {info.causes.map(c => <div key={c} className="flex items-start gap-2 text-xs py-0.5"><span className="text-amber-400 shrink-0">•</span>{c}</div>)}
              </div>
              <div>
                <div className="font-display text-[11px] text-muted-foreground mb-1.5">ДЕЙСТВИЯ</div>
                {info.actions.map((a, i) => <div key={a} className="flex items-start gap-2 text-xs py-0.5"><span className="text-cyan shrink-0">{i+1}.</span>{a}</div>)}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground pt-3">Код отсутствует в локальном справочнике. Рекомендуется поиск по коду в специализированных базах данных.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Экран: VIN ────────────────────────────────────────────────────────────────
function ScreenVin({ onVinDecoded }: { onVinDecoded?: (v: VinResult) => void }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<VinResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    const v = input.trim().toUpperCase();
    if (v.length !== 17) { setError('VIN должен содержать ровно 17 символов'); return; }
    setError(''); setLoading(true); setResult(null);
    const r = await fetchVin(v);
    setResult(r); setLoading(false);
    onVinDecoded?.(r);
  }, [input, onVinDecoded]);

  const fields: [string, string, boolean][] = result ? [
    ['VIN', result.vin, true], ['Марка', result.make, false], ['Модель', result.model, false],
    ['Год выпуска', result.year, false], ['Тип ТС', result.type, false], ['Двигатель', result.engine, false],
    ['Топливо', result.fuel, false], ['Привод', result.drive, false], ['КПП', result.transmission, false],
    ['Количество дверей', result.doors, false], ['Страна', result.country, false],
    ['WMI', result.wmi, true], ['VDS', result.vds, true], ['Серийный номер', result.serial, true],
  ] : [];

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title="Интеллект. VIN-дешифратор" sub="Расшифровка через базу NHTSA + локальный справочник" />
      <div className="border-glow bg-card rounded-xl p-4 space-y-3">
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,'').slice(0,17))}
          placeholder="Введите VIN (17 знаков)" maxLength={17} onKeyDown={e => e.key==='Enter' && search()}
          className="w-full bg-secondary rounded-lg px-4 py-3 font-mono text-sm tracking-widest outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{input.length}/17</span>
          {input.length === 17 && <span className="text-green-400">✓ Корректная длина</span>}
        </div>
        <button onClick={search} disabled={loading || input.length !== 17}
          className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-3 rounded-lg font-display tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Icon name="Loader" size={16} className="animate-spin" />ЗАПРОС...</> : <><Icon name="Search" size={16} />РАСШИФРОВАТЬ VIN</>}
        </button>
      </div>
      {error && <div className="border border-red-500/40 bg-card rounded-xl p-4 text-sm text-red-400 flex gap-2"><Icon name="AlertCircle" size={16} className="shrink-0 mt-0.5" />{error}</div>}
      {result && (
        <div className="border-glow bg-card rounded-xl overflow-hidden animate-fade-up">
          <div className="gradient-primary px-4 py-3 flex items-center gap-2">
            <Icon name="Car" size={18} className="text-[hsl(220,20%,8%)]" />
            <span className="font-display font-bold text-[hsl(220,20%,8%)] text-lg">{result.make} {result.model !== '—' ? result.model : ''} {result.year !== '—' ? result.year : ''}</span>
          </div>
          <div className="p-4">
            {fields.map(([label, value, mono]) => value && value !== '—' && (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border last:border-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-sm font-semibold ml-4 text-right ${mono ? 'font-mono text-cyan' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="border-glow bg-card rounded-xl p-4">
        <div className="font-display text-xs text-muted-foreground mb-2">СТРУКТУРА VIN</div>
        <div className="flex gap-1.5 text-xs flex-wrap font-mono">
          {[['WMI (1-3)','bg-primary/20 text-cyan'],['VDS (4-9)','bg-accent/20 text-amber-400'],['Год (10)','bg-secondary'],['Завод (11)','bg-secondary'],['Серия (12-17)','bg-secondary']].map(([l,c]) => (
            <span key={l} className={`${c} px-2 py-1 rounded`}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Экран: Выбор авто (Кнопка 2) ─────────────────────────────────────────────
type VehicleStep = 'region' | 'make' | 'loading' | 'model' | 'year' | 'ecus' | 'ecu_detail';

interface VehicleSelection {
  region: string; make: string; model: string; year: number;
  ecu: EcuBlock | null;
}

const MOCK_FAULTS: Record<string, DtcEntry[]> = {
  engine: [
    { code: 'P0171', status: 'active', count: 12, lastSeen: 'сейчас' },
    { code: 'P0420', status: 'stored', count: 3, lastSeen: '2 дня назад' },
    { code: 'P0130', status: 'historical', count: 1, lastSeen: '14 дней назад' },
  ],
  abs: [
    { code: 'C0035', status: 'temporary', count: 5, lastSeen: '1 час назад' },
  ],
  transmission: [],
  airbag: [],
  climate: [],
  instrument: [],
  steering: [],
  parking: [],
  '4motion': [],
  airsusp: [],
  kdss: [],
};

function ScreenVehicle({ btConnected }: { btConnected: boolean }) {
  const [step, setStep] = useState<VehicleStep>('region');
  const [sel, setSel] = useState<VehicleSelection>({ region: '', make: '', model: '', year: 0, ecu: null });
  const [activeTab, setActiveTab] = useState<'dtc' | 'live' | 'special' | 'service'>('dtc');
  const [dtcLoading, setDtcLoading] = useState(false);
  const [dtcClearing, setDtcClearing] = useState(false);
  const [realDtc, setRealDtc] = useState<string[] | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{ecu: string; faults: DtcEntry[]}[]>([]);

  // Встроенные протоколы (грузятся из public/protocols/ при старте)
  const { findProtocol, loading: protocolsLoading, totalCount } = useBuiltinProtocols();
  const [protocolEcus, setProtocolEcus] = useState<EcuBlock[] | null>(null);
  const [protocolStatus, setProtocolStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  const selectedMake = VEHICLE_DB.find(m => m.id === sel.make);
  const selectedModel = selectedMake?.models.find(m => m.id === sel.model);
  // Используем ECU из файла протокола если найден, иначе из встроенной БД
  const activeEcus = protocolEcus ?? selectedModel?.ecus ?? [];
  const ecuFaults = sel.ecu ? (MOCK_FAULTS[sel.ecu.id] || []) : [];

  const startLoad = (makeId: string) => {
    setSel(s => ({ ...s, make: makeId }));
    setProtocolEcus(null);
    setProtocolStatus('idle');
    setStep('loading'); setLoadProgress(0);
    const t = setInterval(() => {
      setLoadProgress(p => {
        if (p >= 100) { clearInterval(t); setStep('model'); return 100; }
        return p + Math.random() * 18;
      });
    }, 120);
  };

  // Загрузка протокола после выбора года — из встроенных файлов
  const loadProtocolForSelection = useCallback(async (makeId: string, modelId: string, _year: number) => {
    setProtocolStatus('loading');
    const data = findProtocol(makeId, modelId);
    if (data && data.ecus?.length > 0) {
      setProtocolEcus(data.ecus as EcuBlock[]);
      setProtocolStatus('found');
    } else {
      setProtocolEcus(null);
      setProtocolStatus('not_found');
    }
  }, [findProtocol]);

  const startScan = () => {
    setScanning(true); setScanResults([]);
    const ecus = selectedModel?.ecus || [];
    let i = 0;
    const t = setInterval(() => {
      if (i >= ecus.length) { clearInterval(t); setScanning(false); return; }
      const ecu = ecus[i];
      setScanResults(r => [...r, { ecu: ecu.name, faults: MOCK_FAULTS[ecu.id] || [] }]);
      i++;
    }, 700);
  };

  const fnGroups = sel.ecu ? {
    special: sel.ecu.functions.filter(f => f.type === 'special' && f.id !== 'dtc_read' && f.id !== 'dtc_clear' && f.id !== 'live_data'),
    service: sel.ecu.functions.filter(f => f.type === 'service'),
    adaptation: sel.ecu.functions.filter(f => f.type === 'adaptation'),
    activation: sel.ecu.functions.filter(f => f.type === 'activation'),
  } : { special: [], service: [], adaptation: [], activation: [] };

  // ── Region ──
  if (step === 'region') return (
    <div className="animate-fade-up space-y-5">
      <SectionTitle title="Выбор автомобиля" sub="Выберите регион производителя" />
      <div className="grid grid-cols-2 gap-3">
        {REGIONS.map((r, i) => (
          <button key={r.id}
            onClick={() => { setSel(s=>({...s, region: r.id})); setStep('make'); }}
            style={{ animationDelay: `${i * 50}ms` }}
            className="animate-fade-up bg-card border border-white/5 rounded-2xl p-5 text-left active:scale-95 transition-all hover:border-white/10 hover:bg-secondary/60">
            <div className="text-4xl mb-3">{r.flag}</div>
            <div className="font-semibold text-foreground text-sm">{r.name}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {VEHICLE_DB.filter(m => m.region === r.id).length} марок
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Make ──
  if (step === 'make') {
    const makes = VEHICLE_DB.filter(m => m.region === sel.region);
    return (
      <div className="animate-fade-up space-y-4">
        <BackBtn onClick={() => setStep('region')} />
        <SectionTitle title="Марка" sub="Выберите производителя" />
        <div className="space-y-2">
          {makes.map((m, i) => (
            <button key={m.id} onClick={() => startLoad(m.id)}
              style={{ animationDelay: `${i * 30}ms` }}
              className="animate-fade-up w-full bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all hover:border-white/10 hover:bg-secondary/60 text-left">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0 border border-white/5">
                {m.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{m.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{m.models.length} моделей</div>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (step === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] animate-fade-up gap-8">
      {/* Лого марки */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-card border border-white/8 flex items-center justify-center text-5xl shadow-card animate-scale-in">
          {selectedMake?.logo}
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
          <Icon name="Loader2" size={14} className="text-white animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className="font-display text-xl text-foreground">{selectedMake?.name}</div>
        <div className="text-sm text-muted-foreground">Загрузка данных...</div>
      </div>
      {/* Прогресс-бар */}
      <div className="w-56 space-y-3">
        <div className="h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-150"
            style={{ width: `${Math.min(loadProgress, 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{loadProgress > 20 ? '✓ Модели' : '○ Модели'}</span>
          <span>{loadProgress > 55 ? '✓ ЭБУ' : '○ ЭБУ'}</span>
          <span>{loadProgress > 80 ? '✓ Функции' : '○ Функции'}</span>
        </div>
      </div>
    </div>
  );

  // ── Model ──
  if (step === 'model') return (
    <div className="animate-fade-up space-y-4">
      <BackBtn onClick={() => setStep('make')} />
      {/* Заголовок с маркой */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-card border border-white/8 flex items-center justify-center text-xl shrink-0">
          {selectedMake?.logo}
        </div>
        <SectionTitle title={selectedMake?.name ?? ''} sub="Выберите модель" />
      </div>
      <div className="space-y-2">
        {selectedMake?.models.map((m, i) => (
          <button key={m.id}
            onClick={() => { setSel(s=>({...s, model: m.id})); setStep('year'); }}
            style={{ animationDelay: `${i * 25}ms` }}
            className="animate-fade-up w-full bg-card border border-white/5 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all hover:border-white/10 text-left">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Icon name="Car" size={17} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm">{m.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {m.years[0]}–{m.years[m.years.length-1]} · {m.ecus.length} блоков ЭБУ
              </div>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );

  // ── Year ──
  if (step === 'year') return (
    <div className="animate-fade-up space-y-4">
      <BackBtn onClick={() => setStep('model')} />
      <SectionTitle title="Год выпуска" sub={selectedModel?.name} />
      <div className="grid grid-cols-4 gap-2">
        {[...(selectedModel?.years || [])].reverse().map((y, i) => (
          <button key={y}
            onClick={() => {
              setSel(s=>({...s, year: y}));
              loadProtocolForSelection(sel.make, sel.model, y);
              setStep('ecus');
            }}
            style={{ animationDelay: `${i * 15}ms` }}
            className={`animate-fade-up rounded-2xl py-3 text-center text-sm font-semibold transition-all active:scale-90 ${
              sel.year === y
                ? 'gradient-primary text-white shadow-glow'
                : 'bg-card border border-white/5 text-foreground hover:border-white/10 hover:bg-secondary/60'
            }`}>
            {y}
          </button>
        ))}
      </div>
    </div>
  );

  // ── ECUs List ──
  if (step === 'ecus') {
    const totalFaults = activeEcus.reduce((s, e) => s + (MOCK_FAULTS[e.id]?.length || 0), 0);
    const activeFaults = activeEcus.reduce((s, e) => s + (MOCK_FAULTS[e.id]?.filter(f=>f.status==='active').length || 0), 0);
    return (
      <div className="space-y-4 animate-fade-up">
        <BackBtn onClick={() => setStep('year')} />
        {/* Авто-шапка */}
        <div className="relative overflow-hidden rounded-3xl p-5 gradient-primary">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shrink-0 border border-white/20">
              {selectedMake?.logo}
            </div>
            <div className="text-white flex-1 min-w-0">
              <div className="font-display text-xl font-bold leading-tight truncate">
                {selectedMake?.name} {selectedModel?.name}
              </div>
              <div className="text-sm opacity-80 mt-0.5">{sel.year} · {activeEcus.length} блоков ЭБУ</div>
            </div>
          </div>
          {/* Статус протокола прямо в шапке */}
          {protocolStatus === 'found' && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/80 relative">
              <Icon name="FileCheck" size={12} className="shrink-0" />
              Протокол загружен · {activeEcus.length} блоков ЭБУ
            </div>
          )}
          {protocolStatus === 'loading' && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/70 relative">
              <Icon name="Loader2" size={12} className="animate-spin shrink-0" />
              Загружаем протокол...
            </div>
          )}
          {protocolStatus === 'not_found' && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-white/60 relative">
              <Icon name="Database" size={12} className="shrink-0" />
              Используется встроенная БД · {activeEcus.length} блоков
            </div>
          )}
        </div>

        {/* Быстрое сканирование */}
        <div className="bg-card border border-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Быстрое сканирование</div>
              <div className="text-xs text-muted-foreground">Все блоки управления сразу</div>
            </div>
            {!scanning && scanResults.length === 0 && (
              <button onClick={startScan}
                className="px-4 py-2 gradient-primary text-white text-xs font-semibold rounded-xl active:scale-95 transition-all shadow-glow">
                Сканировать
              </button>
            )}
            {scanResults.length > 0 && !scanning && (
              <button onClick={() => { setScanning(false); setScanResults([]); }}
                className="px-3 py-1.5 bg-secondary text-muted-foreground text-xs rounded-xl active:scale-95 transition-all">
                Сброс
              </button>
            )}
          </div>
          {(scanning || scanResults.length > 0) && (
            <div className="space-y-2 mt-1">
              {scanResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 animate-fade-up">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.faults.length > 0 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  <span className="flex-1 text-xs text-foreground truncate">{r.ecu}</span>
                  {r.faults.length > 0
                    ? <span className="text-xs font-semibold text-amber-400">{r.faults.length} ошиб.</span>
                    : <span className="text-xs font-semibold text-emerald-400">OK</span>}
                </div>
              ))}
              {scanning && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Icon name="Loader2" size={12} className="animate-spin shrink-0" />
                  Сканирование...
                </div>
              )}
              {!scanning && scanResults.length > 0 && (
                <div className="flex gap-4 pt-2 mt-1 border-t border-white/5">
                  <div className="text-xs"><span className="font-semibold text-amber-400">{totalFaults}</span> <span className="text-muted-foreground">ошибок</span></div>
                  <div className="text-xs"><span className="font-semibold text-red-400">{activeFaults}</span> <span className="text-muted-foreground">активных</span></div>
                  <div className="text-xs"><span className="font-semibold text-blue-400">{activeEcus.length}</span> <span className="text-muted-foreground">блоков</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Блоки управления (ЭБУ) */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-1">
            Блоки управления
          </div>
          {activeEcus.map((ecu, i) => {
            const faults = MOCK_FAULTS[ecu.id] || [];
            const active = faults.filter(f => f.status === 'active').length;
            const hasError = faults.length > 0;
            return (
              <button key={ecu.id}
                onClick={() => { setSel(s=>({...s, ecu})); setActiveTab('dtc'); setStep('ecu_detail'); }}
                style={{ animationDelay: `${i * 25}ms` }}
                className={`animate-fade-up w-full text-left rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all ${
                  hasError
                    ? 'bg-amber-500/6 border border-amber-500/25 hover:bg-amber-500/10'
                    : 'bg-card border border-white/5 hover:border-white/10 hover:bg-secondary/60'
                }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  hasError ? 'bg-amber-500/15' : 'bg-secondary'
                }`}>
                  <Icon name="Cpu" size={18} className={hasError ? 'text-amber-400' : 'text-muted-foreground'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{ecu.name}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{ecu.address} · {ecu.protocol}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasError ? (
                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-400">{faults.length} ош.</div>
                      {active > 0 && <div className="text-[11px] text-red-400">{active} акт.</div>}
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">OK</span>
                  )}
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Подвал — счётчик встроенных протоколов */}
        <div className="flex items-center gap-2 px-1 py-2">
          <Icon name="Database" size={13} className="text-muted-foreground shrink-0" />
          <div className="text-xs text-muted-foreground">
            {protocolsLoading ? 'Загрузка протоколов...' : `${totalCount} протоколов встроено`}
          </div>
        </div>
      </div>
    );
  }

  // ── ECU Detail ──
  if (step === 'ecu_detail' && sel.ecu) {
    const TABS = [
      { id: 'dtc',     label: 'DTC',        icon: 'AlertTriangle' },
      { id: 'live',    label: 'Поток',       icon: 'Activity' },
      { id: 'special', label: 'Функции',     icon: 'Wrench' },
      { id: 'service', label: 'Сервис',      icon: 'Settings' },
    ] as const;

    return (
      <div className="space-y-4 animate-fade-up">
        <BackBtn onClick={() => setStep('ecus')} label="Блоки управления" />

        {/* Шапка ЭБУ */}
        <div className="bg-card border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Icon name="Cpu" size={22} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate leading-tight">{sel.ecu.name}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">{sel.ecu.address} · {sel.ecu.protocol}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Активен</span>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="grid grid-cols-4 gap-1.5 bg-secondary/50 rounded-2xl p-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all ${
                activeTab === t.id
                  ? 'bg-card shadow-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              <Icon name={t.icon} size={15} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Таб DTC */}
        {activeTab === 'dtc' && (
          <div className="space-y-3 animate-fade-up">
            {/* Кнопки чтения/сброса */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-muted-foreground">
                Коды неисправностей · {realDtc !== null ? realDtc.length : ecuFaults.length}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!btConnected) return;
                    setDtcLoading(true);
                    try { const codes = await elm327.readDTC(); setRealDtc(codes); }
                    finally { setDtcLoading(false); }
                  }}
                  disabled={dtcLoading || !btConnected}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 ${
                    btConnected ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25' : 'bg-secondary text-muted-foreground opacity-50'
                  }`}>
                  <Icon name={dtcLoading ? 'Loader2' : 'RefreshCw'} size={12} className={dtcLoading ? 'animate-spin' : ''} />
                  {dtcLoading ? 'Чтение...' : 'Читать'}
                </button>
                <button
                  onClick={async () => {
                    if (!btConnected) return;
                    setDtcClearing(true);
                    try { await elm327.clearDTC(); setRealDtc([]); }
                    finally { setDtcClearing(false); }
                  }}
                  disabled={dtcClearing || !btConnected}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all active:scale-95 ${
                    btConnected ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-secondary text-muted-foreground opacity-50'
                  }`}>
                  <Icon name={dtcClearing ? 'Loader2' : 'Trash2'} size={12} className={dtcClearing ? 'animate-spin' : ''} />
                  {dtcClearing ? 'Сброс...' : 'Удалить'}
                </button>
              </div>
            </div>
            {!btConnected && (
              <div className="flex items-center gap-2.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-2xl px-4 py-3">
                <Icon name="Bluetooth" size={14} className="shrink-0" />
                Подключите адаптер ELM327 для чтения реальных ошибок
              </div>
            )}
            {realDtc !== null ? (
              realDtc.length === 0
                ? <div className="bg-card border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <Icon name="CheckCircle" size={28} className="text-emerald-400" />
                    </div>
                    <div className="font-semibold text-emerald-400">Ошибок нет</div>
                    <div className="text-xs text-muted-foreground mt-1">Блок работает исправно</div>
                  </div>
                : realDtc.map(code => (
                    <DtcCard key={code} entry={{ code, status: 'active', count: 1, lastSeen: 'только что' }} />
                  ))
            ) : (
              ecuFaults.length === 0
                ? <div className="bg-card border border-white/5 rounded-2xl p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                      <Icon name="CheckCircle" size={28} className="text-emerald-400" />
                    </div>
                    <div className="font-semibold text-emerald-400">Ошибок нет</div>
                    <div className="text-xs text-muted-foreground mt-1">Блок работает исправно</div>
                  </div>
                : ecuFaults.map(f => <DtcCard key={f.code} entry={f} />)
            )}
          </div>
        )}

        {/* Таб Live Data */}
        {activeTab === 'live' && <LiveDataTab btConnected={elm327.isConnected()} />}

        {/* Таб Функции */}
        {activeTab === 'special' && (
          <div className="space-y-3 animate-fade-up">
            {fnGroups.special.length + fnGroups.adaptation.length + fnGroups.activation.length === 0 ? (
              <div className="bg-card border border-white/5 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Icon name="Wrench" size={22} className="text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">Нет специальных функций для этого блока</div>
              </div>
            ) : (
              <>
                {fnGroups.activation.length > 0 && <FuncGroup label="Активация" icon="Zap" fns={fnGroups.activation} accent="amber" />}
                {fnGroups.adaptation.length > 0 && <FuncGroup label="Адаптации" icon="SlidersHorizontal" fns={fnGroups.adaptation} accent="blue" />}
                {fnGroups.special.length > 0 && <FuncGroup label="Специальные" icon="Cpu" fns={fnGroups.special} accent="violet" />}
              </>
            )}
          </div>
        )}

        {/* Таб Сервис */}
        {activeTab === 'service' && (
          <div className="space-y-3 animate-fade-up">
            {fnGroups.service.length === 0 ? (
              <div className="bg-card border border-white/5 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-3">
                  <Icon name="Settings" size={22} className="text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground">Нет сервисных функций для этого блока</div>
              </div>
            ) : (
              <FuncGroup label="Сервис и сброс" icon="Settings" fns={fnGroups.service} accent="emerald" />
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

type AccentColor = 'blue' | 'violet' | 'amber' | 'emerald';
const ACCENT_MAP: Record<AccentColor, { text: string; bg: string; btn: string }> = {
  blue:    { text: 'text-blue-400',    bg: 'bg-blue-500/10',    btn: 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25' },
  violet:  { text: 'text-violet-400',  bg: 'bg-violet-500/10',  btn: 'bg-violet-500/15 text-violet-400 hover:bg-violet-500/25' },
  amber:   { text: 'text-amber-400',   bg: 'bg-amber-500/10',   btn: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', btn: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' },
};

function FuncGroup({ label, icon, fns, accent }: { label: string; icon: string; fns: EcuFunction[]; accent: AccentColor }) {
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const a = ACCENT_MAP[accent];
  const runFn = (id: string) => {
    setRunning(id);
    setTimeout(() => { setRunning(null); setDone(d => [...d, id]); }, 2200);
  };
  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-2 text-xs font-semibold ${a.text} px-1`}>
        <Icon name={icon} size={13} />
        {label}
      </div>
      {fns.map(fn => (
        <div key={fn.id} className="bg-card border border-white/5 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">{fn.name}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{fn.description}</div>
              {fn.warning && (
                <div className="flex items-start gap-1.5 mt-2.5 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
                  <Icon name="AlertTriangle" size={12} className="shrink-0 mt-0.5" />
                  <span>{fn.warning}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => runFn(fn.id)}
              disabled={running === fn.id}
              className={`shrink-0 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center gap-1.5 ${
                done.includes(fn.id)
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : running === fn.id
                  ? a.btn
                  : a.btn
              }`}>
              {running === fn.id
                ? <><Icon name="Loader2" size={12} className="animate-spin" />Работа...</>
                : done.includes(fn.id)
                ? <><Icon name="Check" size={12} />Готово</>
                : 'Старт'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Экран: Справочник DTC ─────────────────────────────────────────────────────
function ScreenDTC() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'P'|'C'|'B'|'U'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = Object.entries(DTC_DB).filter(([code, info]) => {
    const q = search.toUpperCase();
    return (!q || code.includes(q) || info.desc.toUpperCase().includes(q) || info.system.toUpperCase().includes(q)) && (filter === 'all' || code.startsWith(filter));
  });

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title="Справочник DTC" sub={`${Object.keys(DTC_DB).length} кодов`} />

      {/* Поиск */}
      <div className="bg-card border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
        <Icon name="Search" size={16} className="text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Код или описание..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {search && (
          <button onClick={() => setSearch('')} className="text-muted-foreground active:scale-90 transition-transform">
            <Icon name="X" size={14} />
          </button>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
        {([
          { id: 'all', label: 'Все' },
          { id: 'P', label: 'P · Двигатель' },
          { id: 'C', label: 'C · Шасси' },
          { id: 'B', label: 'B · Кузов' },
          { id: 'U', label: 'U · Сеть' },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
              filter === f.id
                ? 'gradient-primary text-white shadow-glow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Список кодов */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <Icon name="SearchX" size={32} className="text-muted-foreground mx-auto mb-3" />
            <div className="text-sm text-muted-foreground">Ничего не найдено</div>
          </div>
        )}
        {filtered.map(([code, info]) => (
          <div key={code} className={`bg-card rounded-2xl overflow-hidden border transition-all ${
            info.severity === 'error'
              ? 'border-red-500/25'
              : info.severity === 'warn'
              ? 'border-amber-500/20'
              : 'border-white/5'
          }`}>
            <button className="w-full text-left p-4 flex items-start gap-3"
              onClick={() => setExpanded(expanded === code ? null : code)}>
              <span className={`font-mono font-bold text-sm shrink-0 mt-0.5 ${
                info.severity === 'error' ? 'text-red-400'
                : info.severity === 'warn' ? 'text-amber-400'
                : 'text-blue-400'
              }`}>{code}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-snug text-foreground">{info.desc}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{info.system}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                  info.severity === 'error' ? 'bg-red-500/15 text-red-400'
                  : info.severity === 'warn' ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-blue-500/15 text-blue-400'
                }`}>
                  {info.severity === 'error' ? 'Крит.' : info.severity === 'warn' ? 'Внимание' : 'Инфо'}
                </span>
                <Icon name={expanded === code ? 'ChevronUp' : 'ChevronDown'} size={15} className="text-muted-foreground" />
              </div>
            </button>
            {expanded === code && (
              <div className="px-4 pb-4 border-t border-white/5 space-y-3 animate-fade-up">
                <p className="text-xs text-muted-foreground leading-relaxed pt-3">{info.detail}</p>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Причины</div>
                  <div className="space-y-1">
                    {info.causes.map(c => (
                      <div key={c} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="text-amber-400 shrink-0 mt-0.5">·</span>{c}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Что делать</div>
                  <div className="space-y-1">
                    {info.actions.map((a, i) => (
                      <div key={a} className="flex items-start gap-2 text-xs text-foreground">
                        <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>{a}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Data Tab (25+ параметров с группировкой + реальный BT) ──────────────
const MOCK_LIVE: Record<string, string> = {
  '010C': '850', '010D': '0', '0105': '91', '010F': '24', '0111': '15',
  '0104': '23', '010A': '310', '010B': '101', '0110': '8.3', '0114': '0.45',
  '0115': '0.72', '0106': '+2.3', '0107': '+7.8', '012F': '62', '0133': '101',
  '0146': '18', '015C': '89', '012C': '12', '012E': '0', '010E': '12.0',
  '011F': '1840', '0121': '0', '0142': '14.2', '013C': '520',
};

function LiveDataTab({ btConnected }: { btConnected: boolean }) {
  const [params, setParams] = useState<LiveParam[]>(() =>
    LIVE_PARAMS_CONFIG.map(p => ({ ...p, value: MOCK_LIVE[p.pid] ?? '—', raw: null }))
  );
  const [polling, setPolling] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(async () => {
    if (polling) { clearInterval(intervalRef.current!); setPolling(false); return; }
    setPolling(true);
    if (btConnected) {
      // Реальный опрос ELM327
      const poll = async () => {
        const pids = LIVE_PARAMS_CONFIG.map(p => p.pid);
        const results = await elm327.readAllLiveData(pids);
        setParams(prev => prev.map(p => {
          const raw = results.get(p.pid) ?? null;
          return { ...p, raw, value: raw !== null ? raw.toFixed(raw < 10 ? 2 : 0) : '—' };
        }));
      };
      poll();
      intervalRef.current = setInterval(poll, 1000);
    } else {
      // Демо-симуляция
      intervalRef.current = setInterval(() => {
        setParams(prev => prev.map(p => {
          const base = parseFloat(MOCK_LIVE[p.pid] ?? '0');
          const jitter = (Math.random() - 0.5) * base * 0.04;
          const val = (base + jitter);
          return { ...p, value: val.toFixed(val < 10 ? 2 : 0), raw: val };
        }));
      }, 800);
    }
  }, [polling, btConnected]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const groups = ['all', ...Object.keys(PARAM_GROUPS)];
  const filtered = activeGroup === 'all' ? params : params.filter(p => p.group === activeGroup);

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <div className="font-display text-xs text-muted-foreground">{params.length} ПАРАМЕТРОВ</div>
        <button onClick={startPolling}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition ${polling ? 'bg-red-400/15 text-red-400' : 'gradient-primary text-[hsl(220,20%,8%)]'}`}>
          <Icon name={polling ? 'StopCircle' : 'Play'} size={13} />
          {polling ? 'Стоп' : btConnected ? 'Читать с ELM327' : 'Демо-режим'}
        </button>
      </div>
      {!btConnected && (
        <div className="text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <Icon name="Bluetooth" size={12} /><span>Адаптер не подключён — показываются демо-данные</span>
        </div>
      )}
      {/* Группы */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {groups.map(g => {
          const cfg = PARAM_GROUPS[g];
          return (
            <button key={g} onClick={() => setActiveGroup(g)}
              className={`shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full transition ${activeGroup === g ? 'gradient-primary text-[hsl(220,20%,8%)]' : 'bg-secondary text-muted-foreground'}`}>
              {cfg && <Icon name={cfg.icon} size={12} />}
              {g === 'all' ? 'Все' : cfg?.label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {filtered.map(p => (
          <div key={p.id} className="border-glow bg-card rounded-xl p-3">
            <div className="text-[11px] text-muted-foreground mb-1 truncate">{p.name}</div>
            <div className="flex items-end gap-1">
              <span className={`font-display text-lg font-bold ${polling ? 'text-cyan-glow' : 'text-foreground'}`}>{p.value}</span>
              <span className="text-xs text-muted-foreground mb-0.5">{p.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── История подключений ───────────────────────────────────────────────────────
interface SessionRecord {
  id: number; device: string; make: string; model: string;
  date: string; duration: string; dtcCount: number; status: 'ok'|'warn'|'error';
}

const SESSIONS_INIT: SessionRecord[] = [
  { id: 1, device: 'ELM327 v1.5', make: 'Volkswagen', model: 'Golf VII', date: '14.06.2025 14:32', duration: '18 мин', dtcCount: 2, status: 'warn' },
  { id: 2, device: 'OBDLink MX+', make: 'BMW',         model: '3 Series F30', date: '10.06.2025 09:15', duration: '35 мин', dtcCount: 0, status: 'ok' },
  { id: 3, device: 'Vgate iCar', make: 'Toyota',       model: 'Camry V70', date: '03.06.2025 16:47', duration: '12 мин', dtcCount: 3, status: 'error' },
  { id: 4, device: 'ELM327 BLE', make: 'Haval',        model: 'Jolion', date: '28.05.2025 11:00', duration: '8 мин', dtcCount: 0, status: 'ok' },
];

interface ReportModal { session: SessionRecord; }

function ScreenHistory({ lastVin }: { lastVin?: VinResult | null }) {
  const [sessions, setSessions] = useState<SessionRecord[]>(SESSIONS_INIT);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [report, setReport] = useState<ReportModal | null>(null);

  const deleteSession = (id: number) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    setExpanded(null);
  };

  const exportHistory = () => {
    const data = JSON.stringify(sessions, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diagnostic-history-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title="История подключений" sub={`${sessions.length} сессий диагностики`} />

      {/* VIN с первой вкладки */}
      {lastVin && (
        <div className="border border-cyan/30 bg-cyan/5 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Icon name="Search" size={14} className="text-cyan shrink-0" />
            <div className="font-display text-xs text-cyan">ПОСЛЕДНИЙ ДЕКОДИРОВАННЫЙ VIN</div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-sm">{lastVin.make} {lastVin.model} {lastVin.year}</div>
              <div className="font-mono text-xs text-muted-foreground mt-0.5">{lastVin.vin}</div>
            </div>
            <button
              onClick={() => {
                const newSession: SessionRecord = {
                  id: Date.now(), device: 'VIN Decoder', make: lastVin.make, model: lastVin.model,
                  date: new Date().toLocaleString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
                  duration: '—', dtcCount: 0, status: 'ok',
                };
                setSessions(prev => [newSession, ...prev]);
              }}
              className="shrink-0 text-xs font-bold gradient-primary text-[hsl(220,20%,8%)] px-3 py-1.5 rounded-lg">
              + В историю
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            {[['Топливо', lastVin.fuel], ['Привод', lastVin.drive], ['Страна', lastVin.country]].map(([l,v]) => (
              <div key={l} className="bg-secondary rounded-lg p-2">
                <div className="text-muted-foreground">{l}</div>
                <div className="font-semibold truncate">{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Сессий', v: sessions.length, color: 'text-cyan' },
          { label: 'С ошибками', v: sessions.filter(s => s.dtcCount > 0).length, color: 'text-amber-400' },
          { label: 'Чистых', v: sessions.filter(s => s.dtcCount === 0).length, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="border-glow bg-card rounded-xl p-3 text-center">
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.v}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Список сессий */}
      <div className="space-y-2">
        {sessions.length === 0 && (
          <div className="border-glow bg-card rounded-xl p-8 text-center">
            <Icon name="History" size={32} className="text-muted-foreground mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">История пуста</div>
          </div>
        )}
        {sessions.map(s => (
          <div key={s.id} className={`bg-card rounded-xl overflow-hidden border ${s.status==='error'?'border-red-500/30':s.status==='warn'?'border-amber-400/25':'border-glow'}`}>
            <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(expanded===s.id?null:s.id)}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.status==='error'?'bg-red-400/15':s.status==='warn'?'bg-amber-400/15':'bg-green-400/10'}`}>
                <Icon name="Car" size={18} className={s.status==='error'?'text-red-400':s.status==='warn'?'text-amber-400':'text-green-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{s.make} {s.model}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.date} · {s.duration}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">{s.device}</div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                {s.dtcCount > 0
                  ? <span className="text-xs font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full">{s.dtcCount} ош.</span>
                  : <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">OK</span>}
                <Icon name={expanded===s.id?'ChevronUp':'ChevronDown'} size={14} className="text-muted-foreground" />
              </div>
            </button>
            {expanded === s.id && (
              <div className="px-4 pb-4 border-t border-border animate-fade-up pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[['Устройство', s.device], ['Длительность', s.duration], ['Марка', s.make], ['Модель', s.model]].map(([l,v]) => (
                    <div key={l} className="bg-secondary rounded-lg p-2.5">
                      <div className="text-muted-foreground mb-0.5">{l}</div>
                      <div className="font-semibold">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setReport({ session: s })}
                    className="flex-1 text-xs font-bold border border-primary/30 text-cyan py-2 rounded-lg hover:bg-primary/10 transition flex items-center justify-center gap-1">
                    <Icon name="FileText" size={13} />Открыть отчёт
                  </button>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="flex-1 text-xs font-bold border border-red-400/30 text-red-400 py-2 rounded-lg hover:bg-red-400/10 transition flex items-center justify-center gap-1">
                    <Icon name="Trash2" size={13} />Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={exportHistory} className="w-full border border-border text-muted-foreground text-sm font-semibold py-3 rounded-xl hover:bg-secondary transition flex items-center justify-center gap-2">
        <Icon name="Download" size={16} />Экспорт истории (.json)
      </button>

      {/* Модал: Отчёт */}
      {report && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={() => setReport(null)}>
          <div className="bg-card border-glow rounded-2xl w-full max-w-sm p-5 space-y-4 animate-fade-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-display text-base text-cyan-glow">Отчёт сессии</div>
              <button onClick={() => setReport(null)}><Icon name="X" size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Автомобиль', `${report.session.make} ${report.session.model}`],
                ['Дата', report.session.date],
                ['Длительность', report.session.duration],
                ['Адаптер', report.session.device],
                ['Найдено ошибок', String(report.session.dtcCount)],
                ['Статус', report.session.status === 'ok' ? 'Без ошибок' : report.session.status === 'warn' ? 'Внимание' : 'Критические ошибки'],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between bg-secondary rounded-lg px-3 py-2">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const text = `Отчёт диагностики\n${report.session.make} ${report.session.model}\nДата: ${report.session.date}\nАдаптер: ${report.session.device}\nДлительность: ${report.session.duration}\nОшибок: ${report.session.dtcCount}`;
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `report-${report.session.id}.txt`; a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
              <Icon name="Download" size={16} />Скачать отчёт
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Система обновлений и загрузки библиотек ──────────────────────────────────
const APP_VERSION = '2.1.0';
const LIBRARY_VERSION = '2024-06-15';

interface MakeLibEntry {
  id: string; name: string; region: string;
  status: 'builtin' | 'partial' | 'empty';
  pids: string;
  loaded?: { fileName: string; version: string; count: number };
  // keywords для авторассортировки пачки файлов
  keywords: string[];
}

const MAKE_LIBS_INIT: MakeLibEntry[] = [
  // ── Встроенные ──
  { id: 'obd2',       name: 'OBD-II (SAE J1979)',           region: 'Стандарт', status: 'builtin', pids: '25 PIDs',                              keywords: ['obd2','obd-ii','obd','j1979'] },
  { id: 'dtc_db',     name: 'DTC база (ISO 15031-6)',        region: 'Стандарт', status: 'builtin', pids: `${Object.keys(DTC_DB).length} кодов`,  keywords: ['dtc','iso15031','p0','p1','p2','p3','c0','b0','u0'] },
  { id: 'vin',        name: 'VIN декодер (NHTSA)',           region: 'Стандарт', status: 'builtin', pids: 'API онлайн',                           keywords: ['vin','nhtsa','wmi'] },
  // ── Европа ──
  { id: 'vag',        name: 'VAG (VW / Audi / Skoda / SEAT / Porsche)', region: 'Европа', status: 'partial', pids: 'Базовые', keywords: ['vag','vw','volkswagen','audi','skoda','seat','porsche','bentley'] },
  { id: 'bmw',        name: 'BMW / Mini / Rolls-Royce',      region: 'Европа', status: 'partial', pids: 'Базовые', keywords: ['bmw','mini','rolls-royce','rollsroyce'] },
  { id: 'mercedes',   name: 'Mercedes-Benz / Smart',         region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['mercedes','benz','smart','mb','xentry','wis'] },
  { id: 'opel',       name: 'Opel / Vauxhall / Buick',       region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['opel','vauxhall','buick','gm'] },
  { id: 'peugeot',    name: 'Peugeot / Citroën / DS',        region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['peugeot','citroen','citroën','ds','psa'] },
  { id: 'renault',    name: 'Renault / Dacia / Alpine',      region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['renault','dacia','alpine','logan'] },
  { id: 'fiat',       name: 'Fiat / Alfa Romeo / Lancia / Jeep', region: 'Европа', status: 'empty', pids: 'Нет данных', keywords: ['fiat','alfa','alfaromeo','lancia','jeep','stellantis'] },
  { id: 'volvo',      name: 'Volvo',                         region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['volvo'] },
  { id: 'saab',       name: 'Saab',                          region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['saab'] },
  { id: 'ford_eu',    name: 'Ford / Lincoln',                region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['ford','lincoln','ids','fjds'] },
  { id: 'jaguar',     name: 'Jaguar / Land Rover',           region: 'Европа', status: 'empty',   pids: 'Нет данных', keywords: ['jaguar','landrover','land rover','jlr'] },
  // ── Япония ──
  { id: 'toyota',     name: 'Toyota / Lexus',                region: 'Япония', status: 'partial', pids: 'Базовые', keywords: ['toyota','lexus','techstream','tis'] },
  { id: 'honda',      name: 'Honda / Acura',                 region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['honda','acura','hds'] },
  { id: 'nissan',     name: 'Nissan / Infiniti',             region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['nissan','infiniti','consult','datsun'] },
  { id: 'mazda',      name: 'Mazda',                         region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['mazda','ids','mazda ids'] },
  { id: 'subaru',     name: 'Subaru',                        region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['subaru','select monitor'] },
  { id: 'mitsubishi', name: 'Mitsubishi',                    region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['mitsubishi','mmcs','mut'] },
  { id: 'suzuki',     name: 'Suzuki',                        region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['suzuki'] },
  { id: 'isuzu',      name: 'Isuzu',                         region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['isuzu'] },
  { id: 'daihatsu',   name: 'Daihatsu',                      region: 'Япония', status: 'empty',   pids: 'Нет данных', keywords: ['daihatsu'] },
  // ── Корея ──
  { id: 'hyundai',    name: 'Hyundai / Kia / Genesis',       region: 'Корея',  status: 'empty',   pids: 'Нет данных', keywords: ['hyundai','kia','genesis','gds','kds'] },
  { id: 'ssangyong',  name: 'SsangYong',                     region: 'Корея',  status: 'empty',   pids: 'Нет данных', keywords: ['ssangyong','ssang yong'] },
  // ── США ──
  { id: 'gm',         name: 'GM (Chevrolet / Cadillac / GMC)', region: 'США', status: 'empty',   pids: 'Нет данных', keywords: ['chevrolet','chevy','cadillac','gmc','gm','tech2'] },
  { id: 'chrysler',   name: 'Chrysler / Dodge / RAM / Jeep',  region: 'США', status: 'empty',   pids: 'Нет данных', keywords: ['chrysler','dodge','ram','witech','fca'] },
  { id: 'tesla',      name: 'Tesla',                           region: 'США', status: 'empty',   pids: 'Нет данных', keywords: ['tesla'] },
  // ── Россия / СНГ ──
  { id: 'lada',       name: 'LADA / ВАЗ / НИВА',             region: 'Россия', status: 'empty',  pids: 'Нет данных', keywords: ['lada','ваз','vaz','niva','niva lada','priora','granta'] },
  { id: 'gaz',        name: 'ГАЗ / Волга / Газель',          region: 'Россия', status: 'empty',  pids: 'Нет данных', keywords: ['газ','gaz','volga','gazelle','газель'] },
  { id: 'uaz',        name: 'УАЗ',                            region: 'Россия', status: 'empty',  pids: 'Нет данных', keywords: ['уаз','uaz'] },
  // ── Китай ──
  { id: 'haval',      name: 'Haval / Great Wall',             region: 'Китай', status: 'partial', pids: 'Базовые', keywords: ['haval','great wall','greatwall','gwm'] },
  { id: 'chery',      name: 'Chery / Exeed / Omoda',          region: 'Китай', status: 'partial', pids: 'Базовые', keywords: ['chery','exeed','omoda'] },
  { id: 'geely',      name: 'Geely / Lynk&Co / Zeekr',       region: 'Китай', status: 'partial', pids: 'Базовые', keywords: ['geely','lynk','zeekr','emgrand'] },
  { id: 'byd',        name: 'BYD',                            region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['byd'] },
  { id: 'mg',         name: 'MG / Roewe / SAIC',              region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['mg','roewe','saic','morris garages'] },
  { id: 'changan',    name: 'Changan / Deepal',               region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['changan','deepal','chang an'] },
  { id: 'gac',        name: 'GAC / Trumpchi / Aion',          region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['gac','trumpchi','aion'] },
  { id: 'nio',        name: 'NIO / Li Auto / Xpeng',          region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['nio','li auto','xpeng','li','lixiang'] },
  { id: 'jac',        name: 'JAC / Sehol',                    region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['jac','sehol'] },
  { id: 'lifan',      name: 'Lifan / Baic / Beijing',         region: 'Китай', status: 'empty',  pids: 'Нет данных', keywords: ['lifan','baic','beijing'] },
  // ── Индия ──
  { id: 'tata',       name: 'Tata / Jaguar (Tata)',           region: 'Индия', status: 'empty',  pids: 'Нет данных', keywords: ['tata','tata motors'] },
  { id: 'mahindra',   name: 'Mahindra',                       region: 'Индия', status: 'empty',  pids: 'Нет данных', keywords: ['mahindra'] },
];

// Авторассортировка пачки файлов по ключевым словам в имени/содержимом
function detectMakeId(fileName: string, json: Record<string, unknown>, libs: MakeLibEntry[]): string | null {
  const needle = (fileName + ' ' + (json.make ?? '') + ' ' + (json.brand ?? '') + ' ' + (json.id ?? '')).toLowerCase();
  for (const lib of libs) {
    if (lib.id === 'obd2' || lib.id === 'dtc_db' || lib.id === 'vin') continue;
    if (lib.keywords.some(k => needle.includes(k))) return lib.id;
  }
  return null;
}

function ScreenUpdates() {
  const [checkState, setCheckState] = useState<'idle'|'checking'|'uptodate'|'available'>('idle');
  const [showInstructions, setShowInstructions] = useState(false);
  const [libs, setLibs] = useState<MakeLibEntry[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('libs_loaded') ?? '{}') as Record<string, MakeLibEntry['loaded']>;
      return MAKE_LIBS_INIT.map(l => saved[l.id]
        ? { ...l, status: 'builtin' as const, pids: `${saved[l.id]!.count} блоков`, loaded: saved[l.id] }
        : l
      );
    } catch { return MAKE_LIBS_INIT; }
  });
  const [uploadTarget, setUploadTarget] = useState<string | null>(null); // null = авторежим
  const [batchResults, setBatchResults] = useState<{name: string; makeId: string|null; ok: boolean; msg: string}[]>([]);
  const [showBatch, setShowBatch] = useState(false);
  const [uploadStep, setUploadStep] = useState<'idle'|'parsing'|'done'|'error'>('idle');
  const [uploadMsg, setUploadMsg] = useState('');
  const [dtcStep, setDtcStep] = useState<'idle'|'parsing'|'done'|'error'>('idle');
  const [dtcMsg, setDtcMsg] = useState('');
  const [dtcCount, setDtcCount] = useState(() => {
    try {
      const ext = JSON.parse(localStorage.getItem('dtc_ext') ?? '{}') as Record<string, unknown>;
      return Object.keys(DTC_DB).length + Object.keys(ext).length;
    } catch { return Object.keys(DTC_DB).length; }
  });
  const [libSearch, setLibSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('Все');
  const fileRef = useRef<HTMLInputElement>(null);
  const batchRef = useRef<HTMLInputElement>(null);
  const dtcRef = useRef<HTMLInputElement>(null);

  const checkUpdates = () => {
    setCheckState('checking');
    setTimeout(() => setCheckState('uptodate'), 2000);
  };

  // Загрузка по конкретной марке
  const startUpload = (makeId: string) => {
    setUploadTarget(makeId);
    setUploadStep('idle'); setUploadMsg('');
    fileRef.current?.click();
  };

  // Сохраняем загруженные библиотеки в localStorage при каждом изменении
  useEffect(() => {
    const loaded: Record<string, MakeLibEntry['loaded']> = {};
    libs.forEach(l => { if (l.loaded) loaded[l.id] = l.loaded; });
    localStorage.setItem('libs_loaded', JSON.stringify(loaded));
  }, [libs]);

  const saveLib = (makeId: string, loadedData: MakeLibEntry['loaded']) => {
    setLibs(prev => prev.map(l => l.id === makeId
      ? { ...l, status: 'builtin' as const, pids: `${loadedData!.count} блоков`, loaded: loadedData }
      : l
    ));
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setUploadStep('parsing');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text) as Record<string, unknown>;
        const count = (json.makes as unknown[])?.length ?? (json.ecus as unknown[])?.length ?? (json.pids as unknown[])?.length ?? 1;
        const ver = (json.version as string) ?? 'неизвестно';
        setTimeout(() => {
          setUploadStep('done');
          setUploadMsg(`Загружено: ${count} блоков, версия ${ver}`);
          saveLib(uploadTarget, { fileName: file.name, version: ver, count });
        }, 800);
      } catch {
        setUploadStep('error');
        setUploadMsg('Ошибка: не удалось разобрать JSON файл');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Массовая загрузка — авторассортировка
  const handleBatch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const results: typeof batchResults = [];
    let processed = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processed++;
        try {
          const json = JSON.parse(ev.target?.result as string) as Record<string, unknown>;
          const makeId = detectMakeId(file.name, json, MAKE_LIBS_INIT);
          const count = (json.makes as unknown[])?.length ?? (json.ecus as unknown[])?.length ?? (json.pids as unknown[])?.length ?? 1;
          const ver = (json.version as string) ?? '—';
          if (makeId) {
            saveLib(makeId, { fileName: file.name, version: ver, count });
            results.push({ name: file.name, makeId, ok: true, msg: `→ ${MAKE_LIBS_INIT.find(l=>l.id===makeId)?.name ?? makeId}, ${count} блоков` });
          } else {
            results.push({ name: file.name, makeId: null, ok: false, msg: 'Марка не распознана — загрузи вручную' });
          }
        } catch {
          results.push({ name: file.name, makeId: null, ok: false, msg: 'Ошибка разбора JSON' });
        }
        if (processed === files.length) {
          setBatchResults(results);
          setShowBatch(true);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  // Загрузка DTC из файла
  const handleDtcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDtcStep('parsing'); setDtcMsg('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const json = JSON.parse(text) as Record<string, unknown>;
        // Поддерживаем два формата:
        // 1. { "P0001": { desc, detail, system, severity, causes, actions } ... }
        // 2. { "codes": { ... } } или { "dtc": { ... } }
        const rawCodes = (json.codes ?? json.dtc ?? json) as Record<string, unknown>;
        const count = Object.keys(rawCodes).filter(k => /^[PCBU]\d/i.test(k)).length;
        if (count === 0) throw new Error('Нет DTC кодов в файле');
        // Merge в существующую базу через localStorage
        const existing = JSON.parse(localStorage.getItem('dtc_ext') ?? '{}') as Record<string, unknown>;
        const merged = { ...existing, ...rawCodes };
        localStorage.setItem('dtc_ext', JSON.stringify(merged));
        const total = count + dtcCount;
        setDtcCount(total);
        setDtcStep('done');
        setDtcMsg(`Добавлено ${count} кодов. Всего в базе: ${total}`);
      } catch (err) {
        setDtcStep('error');
        setDtcMsg(`Ошибка: ${err instanceof Error ? err.message : 'неверный формат файла'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetUpload = () => { setUploadTarget(null); setUploadStep('idle'); setUploadMsg(''); };

  const regions = ['Все', ...Array.from(new Set(MAKE_LIBS_INIT.map(l => l.region)))];
  const visibleLibs = libs.filter(l => {
    const matchRegion = regionFilter === 'Все' || l.region === regionFilter;
    const matchSearch = !libSearch || l.name.toLowerCase().includes(libSearch.toLowerCase());
    return matchRegion && matchSearch;
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Обновления и библиотеки" sub="Управление версиями и базами данных" />
        <button
          onClick={() => setShowInstructions(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs font-bold border border-amber-400/40 text-amber-400 px-3 py-2 rounded-xl hover:bg-amber-400/10 transition mt-1">
          <Icon name="BookOpen" size={14} />Инструкции
        </button>
      </div>

      {/* Версия */}
      <div className="border-glow bg-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-sm text-muted-foreground">ПРИЛОЖЕНИЕ</div>
            <div className="font-semibold mt-0.5">Diagnostic v{APP_VERSION}</div>
          </div>
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Icon name="Activity" size={18} className="text-[hsl(220,20%,8%)]" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">База DTC: {dtcCount} кодов · Библиотека: {LIBRARY_VERSION}</div>
        <button onClick={checkUpdates} disabled={checkState==='checking'}
          className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-2.5 rounded-lg font-display tracking-wider disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {checkState==='checking' ? <><Icon name="Loader" size={14} className="animate-spin" />Проверка...</>
          : checkState==='uptodate' ? <><Icon name="CheckCircle" size={14} />Актуальная версия</>
          : checkState==='available' ? <><Icon name="Download" size={14} />Доступно обновление</>
          : <><Icon name="RefreshCw" size={14} />Проверить обновления</>}
        </button>
        {checkState==='uptodate' && <div className="text-xs text-green-400 text-center">Установлена последняя версия</div>}
      </div>

      {/* ── DTC база ── */}
      <div className="border-glow bg-card rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-sm text-muted-foreground">БАЗА КОДОВ ОШИБОК (DTC)</div>
            <div className="font-semibold mt-0.5">{dtcCount} кодов в базе</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-400/15 flex items-center justify-center">
            <Icon name="AlertTriangle" size={18} className="text-amber-400" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground leading-relaxed">
          Загрузи JSON-файл с кодами ошибок — новые коды добавятся к встроенной базе. Поддерживаемый формат:
        </div>
        <div className="bg-secondary rounded-lg p-3 text-[11px] font-mono text-muted-foreground space-y-0.5">
          <div className="text-cyan mb-1">{'// Формат файла DTC (dtc-база.json)'}</div>
          <div>{'{'}</div>
          <div className="pl-3"><span className="text-amber-400">"P0001"</span>{': { '}<span className="text-green-400">"desc"</span>{': "...", '}<span className="text-green-400">"detail"</span>{': "...", '}<span className="text-green-400">"system"</span>{': "...", '}<span className="text-green-400">"severity"</span>{': "error|warn|info", '}<span className="text-green-400">"causes"</span>{': [...], '}<span className="text-green-400">"actions"</span>{': [...] },'}</div>
          <div className="pl-3"><span className="text-amber-400">"P0100"</span>{': { ... }'}</div>
          <div>{'}'}</div>
        </div>
        <div className="text-[11px] text-muted-foreground">Можно загружать несколько файлов подряд — коды суммируются.</div>

        {dtcStep === 'parsing' && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon name="Loader" size={13} className="animate-spin text-cyan" />Разбор файла DTC...</div>}
        {dtcStep === 'done' && <div className="flex items-center gap-2 text-xs text-green-400"><Icon name="CheckCircle" size={13} />{dtcMsg}</div>}
        {dtcStep === 'error' && <div className="flex items-center gap-2 text-xs text-red-400"><Icon name="AlertCircle" size={13} />{dtcMsg}</div>}

        <input ref={dtcRef} type="file" accept=".json" className="hidden" onChange={handleDtcFile} />
        <button onClick={() => { setDtcStep('idle'); dtcRef.current?.click(); }}
          className="w-full border border-amber-400/40 text-amber-400 font-bold py-2.5 rounded-xl hover:bg-amber-400/10 transition flex items-center justify-center gap-2 text-sm">
          <Icon name="FolderOpen" size={16} />Загрузить DTC базу (.json)
        </button>
      </div>

      {/* ── Массовая загрузка ── */}
      <div className="border border-cyan/25 bg-cyan/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon name="Layers" size={16} className="text-cyan shrink-0" />
          <div>
            <div className="font-semibold text-sm">Массовая загрузка библиотек</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Выбери сразу несколько файлов — авторассортирую по маркам</div>
          </div>
        </div>
        <input ref={batchRef} type="file" accept=".json,.adl.json" multiple className="hidden" onChange={handleBatch} />
        <button onClick={() => batchRef.current?.click()}
          className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Icon name="Upload" size={16} />Загрузить несколько файлов сразу
        </button>
        {showBatch && batchResults.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-display text-[11px] text-muted-foreground">РЕЗУЛЬТАТ РАССОРТИРОВКИ:</div>
            {batchResults.map((r, i) => (
              <div key={i} className={`flex items-start gap-2 text-[11px] rounded-lg px-3 py-2 ${r.ok ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                <Icon name={r.ok ? 'CheckCircle' : 'AlertCircle'} size={12} className="shrink-0 mt-0.5" />
                <div><span className="font-mono">{r.name}</span><span className="text-muted-foreground ml-1">— {r.msg}</span></div>
              </div>
            ))}
            <button onClick={() => setShowBatch(false)} className="text-[11px] text-muted-foreground underline">Скрыть</button>
          </div>
        )}
      </div>

      {/* ── Библиотеки по маркам ── */}
      <div className="space-y-2">
        <div className="font-display text-xs text-muted-foreground">БИБЛИОТЕКИ ПРОТОКОЛОВ ПО МАРКАМ ({libs.filter(l=>l.status!=='empty').length}/{libs.length})</div>

        {/* Поиск + фильтр по региону */}
        <div className="flex gap-2">
          <div className="flex-1 border-glow bg-card rounded-lg px-3 py-2 flex items-center gap-2">
            <Icon name="Search" size={13} className="text-muted-foreground shrink-0" />
            <input value={libSearch} onChange={e => setLibSearch(e.target.value)} placeholder="Поиск марки..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {regions.map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full transition ${regionFilter===r ? 'gradient-primary text-[hsl(220,20%,8%)]' : 'bg-secondary text-muted-foreground'}`}>
              {r}
            </button>
          ))}
        </div>

        {/* Статус загрузки по одной марке */}
        {uploadStep === 'parsing' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary rounded-xl px-4 py-3">
            <Icon name="Loader" size={14} className="animate-spin text-cyan" />Разбор файла...
          </div>
        )}
        {uploadStep === 'done' && (
          <div className="flex items-center justify-between bg-green-400/10 border border-green-400/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-green-400"><Icon name="CheckCircle" size={14} />{uploadMsg}</div>
            <button onClick={resetUpload} className="text-[11px] text-muted-foreground underline">OK</button>
          </div>
        )}
        {uploadStep === 'error' && (
          <div className="flex items-center justify-between bg-red-400/10 border border-red-400/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-red-400"><Icon name="AlertCircle" size={14} />{uploadMsg}</div>
            <button onClick={resetUpload} className="text-[11px] text-muted-foreground underline">Закрыть</button>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".json,.adl.json" className="hidden" onChange={handleFile} />

        <div className="space-y-1.5">
          {visibleLibs.map(lib => (
            <div key={lib.id} className={`border rounded-xl p-3 flex items-center gap-3 ${lib.status==='builtin'?'border-green-400/25 bg-green-400/5':lib.status==='partial'?'border-amber-400/20 bg-card':'border-border bg-card'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${lib.status==='builtin'?'bg-green-400':lib.status==='partial'?'bg-amber-400':'bg-muted-foreground/30'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{lib.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/60">{lib.region}</span>
                  {lib.loaded
                    ? <span className="text-[10px] text-green-400 font-mono truncate">· {lib.loaded.fileName} · v{lib.loaded.version}</span>
                    : <span className="text-[10px] text-muted-foreground">· {lib.pids}</span>
                  }
                </div>
              </div>
              {lib.status === 'builtin' && !lib.loaded ? (
                <span className="shrink-0 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Встроена</span>
              ) : (
                <button
                  onClick={() => startUpload(lib.id)}
                  disabled={uploadStep === 'parsing'}
                  className="shrink-0 flex items-center gap-1 text-[11px] font-bold border border-primary/30 text-cyan px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition disabled:opacity-40">
                  <Icon name="Upload" size={11} />{lib.loaded ? 'Обновить' : 'Загрузить'}
                </button>
              )}
            </div>
          ))}
          {visibleLibs.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-6">Ничего не найдено</div>
          )}
        </div>
      </div>

      {/* Модал: Инструкции — через portal чтобы не зависел от скролла */}
      {showInstructions && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setShowInstructions(false)}>
          <div className="bg-card border-glow rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
              <div className="font-display text-base text-cyan-glow">Где брать данные для библиотек</div>
              <button onClick={() => setShowInstructions(false)}><Icon name="X" size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">

              {/* 1. ASAM */}
              <div className="border-glow bg-secondary rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan/10 flex items-center justify-center shrink-0">
                      <Icon name="FileCode" size={16} className="text-cyan" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">ASAM MCD-2D / ODX</div>
                      <div className="text-[11px] text-muted-foreground">Открытый стандарт ISO 22901</div>
                    </div>
                  </div>
                  <a href="https://www.asam.net/standards/detail/mcd-2-d/" target="_blank" rel="noreferrer"
                    className="shrink-0 text-[11px] text-cyan border border-cyan/30 rounded-full px-2.5 py-1 hover:bg-cyan/10 transition flex items-center gap-1">
                    <Icon name="ExternalLink" size={11} />Сайт
                  </a>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Производители передают данные официальным партнёрам в формате ODX (XML). Именно в этом формате описаны все блоки, параметры и функции.
                </div>
                <div className="bg-background rounded-lg p-2.5 text-[11px] space-y-1 text-muted-foreground">
                  <div className="font-semibold text-foreground mb-1">Шаги:</div>
                  <div>1. Скачать ODX-файл для нужной марки</div>
                  <div>2. Распарсить XML — теги <span className="font-mono text-cyan">{'<DIAG-SERVICE>'}</span>, <span className="font-mono text-cyan">{'<PARAM>'}</span></div>
                  <div>3. Конвертировать в <span className="font-mono text-cyan">.adl.json</span> → загрузить выше</div>
                </div>
              </div>

              {/* 2. GitHub */}
              <div className="border-glow bg-secondary rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-400/10 flex items-center justify-center shrink-0">
                      <Icon name="Github" size={16} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">OpenDiagnostics / GitHub</div>
                      <div className="text-[11px] text-muted-foreground">Сообщество reverse engineering</div>
                    </div>
                  </div>
                  <a href="https://github.com/topics/obd2-diagnostics" target="_blank" rel="noreferrer"
                    className="shrink-0 text-[11px] text-purple-400 border border-purple-400/30 rounded-full px-2.5 py-1 hover:bg-purple-400/10 transition flex items-center gap-1">
                    <Icon name="ExternalLink" size={11} />GitHub
                  </a>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Репозитории с готовыми расшифровками протоколов: <span className="text-foreground">pyOBD, python-OBD, freediag, OpenVehicles</span>.
                </div>
                <div className="bg-background rounded-lg p-2.5 text-[11px] space-y-1 text-muted-foreground">
                  <div className="font-semibold text-foreground mb-1">Полезные репозитории:</div>
                  <div>• <span className="font-mono text-cyan">github.com/brendan-w/python-OBD</span></div>
                  <div>• <span className="font-mono text-cyan">github.com/rnd-ash/OpenVehicleDiag</span></div>
                  <div>• <span className="font-mono text-cyan">github.com/iDiagnostics</span></div>
                </div>
              </div>

              {/* 3. Реверс-инжиниринг */}
              <div className="border-glow bg-secondary rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
                      <Icon name="Radio" size={16} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Реверс-инжиниринг (SocketCAN)</div>
                      <div className="text-[11px] text-muted-foreground">Захват трафика с реального авто</div>
                    </div>
                  </div>
                  <a href="https://www.csselectronics.com/pages/can-bus-simple-intro-tutorial" target="_blank" rel="noreferrer"
                    className="shrink-0 text-[11px] text-amber-400 border border-amber-400/30 rounded-full px-2.5 py-1 hover:bg-amber-400/10 transition flex items-center gap-1">
                    <Icon name="ExternalLink" size={11} />Гайд
                  </a>
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Подключаешь SocketCAN-адаптер к OBD-II, запускаешь оригинальный сканер и записываешь весь CAN-трафик.
                </div>
                <div className="bg-background rounded-lg p-2.5 text-[11px] space-y-1 text-muted-foreground">
                  <div>1. Адаптер <span className="text-foreground">PCAN-USB</span> или <span className="text-foreground">CANable</span> (~30–80$)</div>
                  <div>2. Программа <span className="font-mono text-cyan">SavvyCAN</span> или <span className="font-mono text-cyan">Wireshark</span></div>
                  <div>3. Записываешь запросы/ответы оригинального сканера</div>
                  <div>4. Расшифрованные команды → <span className="font-mono text-cyan">.adl.json</span></div>
                </div>
              </div>

              {/* 4. Дилерская документация */}
              <div className="border-glow bg-secondary rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-green-400/10 flex items-center justify-center shrink-0">
                    <Icon name="BookOpen" size={16} className="text-green-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Дилерская документация</div>
                    <div className="text-[11px] text-muted-foreground">WIS / ELSA / TIS / ISTA</div>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-2.5 text-[11px] text-muted-foreground">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div><span className="text-foreground">VW/Audi/Skoda</span> → ELSA / ODIS</div>
                    <div><span className="text-foreground">BMW/Mini</span> → ISTA-D / ISTA-P</div>
                    <div><span className="text-foreground">Toyota/Lexus</span> → TIS / Techstream</div>
                    <div><span className="text-foreground">Mercedes</span> → WIS / XENTRY</div>
                    <div><span className="text-foreground">Ford</span> → IDS / FJDS</div>
                    <div><span className="text-foreground">Hyundai/Kia</span> → GDS / KDS</div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="border border-cyan/25 bg-cyan/5 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed">
                <span className="text-foreground font-semibold">Нашла данные?</span> Пришли описание параметров для нужной марки — оформлю в <span className="font-mono text-cyan">.adl.json</span> и загрузишь через кнопку в списке выше.
              </div>

              <button onClick={() => setShowInstructions(false)}
                className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-3 rounded-xl text-sm">
                Закрыть
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'vin',      label: 'VIN',     icon: 'Search',   color: 'from-blue-500 to-blue-600' },
  { id: 'vehicle',  label: 'Авто',    icon: 'Car',      color: 'from-violet-500 to-purple-600' },
  { id: 'history',  label: 'Сессии',  icon: 'History',  color: 'from-emerald-500 to-teal-600' },
  { id: 'dtc',      label: 'Коды',    icon: 'BookOpen', color: 'from-amber-500 to-orange-500' },
  { id: 'updates',  label: 'Файлы',   icon: 'Download', color: 'from-pink-500 to-rose-500' },
];

// ── App ───────────────────────────────────────────────────────────────────────
const Index = () => {
  const [tab, setTab] = useState('vin');
  const [prevTab, setPrevTab] = useState('vin');
  const [btConnected, setBtConnected] = useState(false);
  const [btName, setBtName] = useState<string | null>(null);
  const [btError, setBtError] = useState('');
  const [btConnecting, setBtConnecting] = useState(false);
  const [lastVin, setLastVin] = useState<VinResult | null>(null);

  useEffect(() => {
    elm327.onDisconnect(() => { setBtConnected(false); setBtName(null); });
  }, []);

  const switchTab = (id: string) => { setPrevTab(tab); setTab(id); };

  const connectBluetooth = async () => {
    setBtConnecting(true); setBtError('');
    try {
      await elm327.connect();
      setBtConnected(true);
      setBtName(elm327.getDeviceName());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes('cancelled')) setBtError(msg);
    } finally {
      setBtConnecting(false);
    }
  };

  const disconnectBluetooth = async () => {
    await elm327.disconnect();
    setBtConnected(false); setBtName(null);
  };

  const activeNav = NAV.find(n => n.id === tab);

  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/5 px-4 safe-top">
        <div className="max-w-xl mx-auto flex items-center justify-between h-14">

          {/* Логотип */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
              <Icon name="Zap" size={16} className="text-white" />
            </div>
            <div>
              <div className="font-display text-sm text-foreground leading-none">OBD Pro</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">
                {activeNav?.label}
              </div>
            </div>
          </div>

          {/* Bluetooth кнопка */}
          <button
            onClick={btConnected ? disconnectBluetooth : connectBluetooth}
            disabled={btConnecting}
            className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 border transition-all active:scale-95 ${
              btConnected
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : btConnecting
                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10'
                : 'border-white/10 text-muted-foreground bg-white/5 hover:border-blue-500/30 hover:text-blue-400'
            }`}
          >
            {btConnecting ? (
              <><Icon name="Loader2" size={12} className="animate-spin" /><span>Поиск...</span></>
            ) : btConnected ? (
              <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span>{btName || 'ELM327'}</span></>
            ) : (
              <><Icon name="Bluetooth" size={12} /><span>Подключить</span></>
            )}
          </button>
        </div>
      </header>

      {/* ── BT ошибка ── */}
      {btError && (
        <div className="max-w-xl mx-auto w-full px-4 pt-3 animate-fade-up">
          <div className="flex items-start gap-2.5 text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-2xl px-4 py-3">
            <Icon name="AlertCircle" size={14} className="shrink-0 mt-0.5" />
            <span>{btError}</span>
            <button onClick={() => setBtError('')} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
              <Icon name="X" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Контент ── */}
      <main className="flex-1 max-w-xl mx-auto w-full px-4 pt-5 pb-32">
        <div key={tab} className="animate-fade-up">
          {tab === 'vin'     && <ScreenVin onVinDecoded={setLastVin} />}
          {tab === 'vehicle' && <ScreenVehicle btConnected={btConnected} />}
          {tab === 'history' && <ScreenHistory lastVin={lastVin} />}
          {tab === 'dtc'     && <ScreenDTC />}
          {tab === 'updates' && <ScreenUpdates />}
        </div>
      </main>

      {/* ── Bottom Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom">
        <div className="max-w-xl mx-auto flex items-center px-2 pt-2 pb-1">
          {NAV.map(n => {
            const active = tab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => switchTab(n.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl transition-all active:scale-90"
              >
                {/* Иконка с фоном */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                  active
                    ? `bg-gradient-to-br ${n.color} shadow-glow scale-110`
                    : 'bg-transparent'
                }`}>
                  <Icon
                    name={n.icon}
                    size={active ? 20 : 22}
                    className={active ? 'text-white' : 'text-muted-foreground'}
                  />
                </div>
                {/* Лейбл */}
                <span className={`text-[10px] font-semibold transition-colors ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {n.label}
                </span>
                {/* Точка-индикатор */}
                <span className={`w-1 h-1 rounded-full transition-all duration-300 ${
                  active ? 'bg-blue-500 opacity-100' : 'opacity-0'
                }`} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Index;