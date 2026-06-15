import { useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { VEHICLE_DB, REGIONS, type EcuBlock, type EcuFunction } from '@/data/vehicles';
import { DTC_DB } from '@/data/dtc';

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
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
      <Icon name="ChevronLeft" size={18} />{label}
    </button>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="font-display text-xl text-cyan-glow">{title}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
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
function ScreenVin() {
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
  }, [input]);

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

function ScreenVehicle() {
  const [step, setStep] = useState<VehicleStep>('region');
  const [sel, setSel] = useState<VehicleSelection>({ region: '', make: '', model: '', year: 0, ecu: null });
  const [activeTab, setActiveTab] = useState<'dtc' | 'live' | 'special' | 'service'>('dtc');
  const [loadProgress, setLoadProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<{ecu: string; faults: DtcEntry[]}[]>([]);

  const selectedMake = VEHICLE_DB.find(m => m.id === sel.make);
  const selectedModel = selectedMake?.models.find(m => m.id === sel.model);
  const ecuFaults = sel.ecu ? (MOCK_FAULTS[sel.ecu.id] || []) : [];

  const startLoad = (makeId: string) => {
    setSel(s => ({ ...s, make: makeId }));
    setStep('loading'); setLoadProgress(0);
    const t = setInterval(() => {
      setLoadProgress(p => {
        if (p >= 100) { clearInterval(t); setStep('model'); return 100; }
        return p + Math.random() * 18;
      });
    }, 120);
  };

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
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title="Выбор автомобиля" sub="Шаг 1 из 4 — Выберите регион" />
      <div className="grid grid-cols-2 gap-3">
        {REGIONS.map(r => (
          <button key={r.id} onClick={() => { setSel(s=>({...s, region: r.id})); setStep('make'); }}
            className="border-glow bg-card rounded-xl p-5 text-left hover:bg-secondary transition">
            <div className="text-3xl mb-2">{r.flag}</div>
            <div className="font-semibold">{r.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
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
      <div className="space-y-4 animate-fade-up">
        <BackBtn onClick={() => setStep('region')} />
        <SectionTitle title="Выбор марки" sub="Шаг 2 из 4 — Выберите марку автомобиля" />
        <div className="space-y-2">
          {makes.map(m => (
            <button key={m.id} onClick={() => startLoad(m.id)}
              className="w-full border-glow bg-card rounded-xl p-4 flex items-center gap-4 hover:bg-secondary transition text-left">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">{m.logo}</div>
              <div className="flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.models.length} моделей</div>
              </div>
              <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (step === 'loading') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-up">
      <div className="w-20 h-20 rounded-full border-2 border-primary animate-pulse-glow flex items-center justify-center">
        <Icon name="Database" size={32} className="text-cyan" />
      </div>
      <div className="text-center">
        <div className="font-display text-lg text-cyan-glow mb-1">Загрузка библиотеки</div>
        <div className="text-sm text-muted-foreground">{selectedMake?.name}</div>
      </div>
      <div className="w-64 space-y-2">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full gradient-primary rounded-full transition-all duration-200" style={{ width: `${Math.min(loadProgress, 100)}%` }} />
        </div>
        <div className="text-xs text-muted-foreground text-center">{Math.round(Math.min(loadProgress, 100))}%</div>
      </div>
      <div className="text-xs text-muted-foreground space-y-1 text-center">
        {loadProgress > 20 && <div className="animate-fade-up">✓ Загрузка моделей...</div>}
        {loadProgress > 50 && <div className="animate-fade-up">✓ Загрузка блоков управления...</div>}
        {loadProgress > 80 && <div className="animate-fade-up">✓ Загрузка специальных функций...</div>}
      </div>
    </div>
  );

  // ── Model ──
  if (step === 'model') return (
    <div className="space-y-4 animate-fade-up">
      <BackBtn onClick={() => setStep('make')} />
      <SectionTitle title={`${selectedMake?.name} — Модель`} sub="Шаг 3 из 4" />
      <div className="space-y-2">
        {selectedMake?.models.map(m => (
          <button key={m.id} onClick={() => { setSel(s=>({...s, model: m.id})); setStep('year'); }}
            className="w-full border-glow bg-card rounded-xl p-4 flex items-center gap-3 hover:bg-secondary transition text-left">
            <Icon name="Car" size={20} className="text-cyan shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{m.name}</div>
              <div className="text-xs text-muted-foreground">{m.years[0]}–{m.years[m.years.length-1]} · {m.ecus.length} блоков</div>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );

  // ── Year ──
  if (step === 'year') return (
    <div className="space-y-4 animate-fade-up">
      <BackBtn onClick={() => setStep('model')} />
      <SectionTitle title="Год выпуска" sub="Шаг 4 из 4" />
      <div className="grid grid-cols-3 gap-2">
        {[...(selectedModel?.years || [])].reverse().map(y => (
          <button key={y} onClick={() => { setSel(s=>({...s, year: y})); setStep('ecus'); }}
            className={`border-glow bg-card rounded-xl py-3 text-center font-display font-bold hover:bg-secondary transition ${sel.year === y ? 'gradient-primary text-[hsl(220,20%,8%)]' : ''}`}>
            {y}
          </button>
        ))}
      </div>
    </div>
  );

  // ── ECUs List ──
  if (step === 'ecus') {
    const totalFaults = (selectedModel?.ecus || []).reduce((s, e) => s + (MOCK_FAULTS[e.id]?.length || 0), 0);
    const activeFaults = (selectedModel?.ecus || []).reduce((s, e) => s + (MOCK_FAULTS[e.id]?.filter(f=>f.status==='active').length || 0), 0);
    return (
      <div className="space-y-4 animate-fade-up">
        <BackBtn onClick={() => setStep('year')} />
        {/* Авто-шапка */}
        <div className="gradient-primary rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">{selectedMake?.logo}</div>
          <div className="text-[hsl(220,20%,8%)]">
            <div className="font-display font-bold text-lg leading-tight">{selectedMake?.name} {selectedModel?.name}</div>
            <div className="text-sm font-semibold opacity-80">{sel.year} · {selectedModel?.ecus.length} блоков</div>
          </div>
        </div>

        {/* Кнопка 3: Быстрое тестирование */}
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4">
          <div className="font-display text-sm text-cyan mb-2">⚡ БЫСТРОЕ ТЕСТИРОВАНИЕ</div>
          <div className="text-xs text-muted-foreground mb-3">Сканирование всех блоков управления одновременно</div>
          {!scanning && scanResults.length === 0 && (
            <button onClick={startScan} className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-2.5 rounded-lg font-display tracking-wider hover:opacity-90 transition">
              СКАНИРОВАТЬ ВСЕ БЛОКИ
            </button>
          )}
          {(scanning || scanResults.length > 0) && (
            <div className="space-y-1.5">
              {scanResults.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs animate-fade-up">
                  <Icon name="CheckCircle" size={14} className="text-green-400 shrink-0" />
                  <span className="flex-1 text-muted-foreground truncate">{r.ecu}</span>
                  {r.faults.length > 0 ? (
                    <span className="text-amber-400 font-bold">{r.faults.length} ош.</span>
                  ) : (
                    <span className="text-green-400 font-bold">OK</span>
                  )}
                </div>
              ))}
              {scanning && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="Loader" size={14} className="animate-spin shrink-0" />
                  Сканирование...
                </div>
              )}
              {!scanning && scanResults.length > 0 && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Итого: {totalFaults} ошибок, {activeFaults} активных</span>
                  <button onClick={() => { setScanning(false); setScanResults([]); }} className="text-xs text-cyan">Сброс</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Итог ошибок */}
        {totalFaults > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Всего ошибок', v: totalFaults, color: 'text-amber-400' },
              { label: 'Активных', v: activeFaults, color: 'text-red-400' },
              { label: 'Блоков', v: selectedModel?.ecus.length, color: 'text-cyan' },
            ].map(s => (
              <div key={s.label} className="border-glow bg-card rounded-xl p-3 text-center">
                <div className={`font-display text-2xl font-bold ${s.color}`}>{s.v}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Блоки управления */}
        <div>
          <div className="font-display text-xs text-muted-foreground mb-2">БЛОКИ УПРАВЛЕНИЯ — НАЖМИТЕ ДЛЯ ПОДКЛЮЧЕНИЯ</div>
          <div className="space-y-2">
            {selectedModel?.ecus.map(ecu => {
              const faults = MOCK_FAULTS[ecu.id] || [];
              const active = faults.filter(f => f.status === 'active').length;
              return (
                <button key={ecu.id} onClick={() => { setSel(s=>({...s, ecu})); setActiveTab('dtc'); setStep('ecu_detail'); }}
                  className={`w-full text-left border rounded-xl p-4 flex items-center gap-3 hover:bg-secondary transition ${faults.length > 0 ? 'border-amber-400/30 bg-card' : 'border-glow bg-card'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${faults.length > 0 ? 'bg-amber-400/15' : 'bg-secondary'}`}>
                    <Icon name="Cpu" size={18} className={faults.length > 0 ? 'text-amber-400' : 'text-muted-foreground'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{ecu.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{ecu.address} · {ecu.protocol}</div>
                  </div>
                  {faults.length > 0 ? (
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-amber-400">{faults.length} ош.</div>
                      {active > 0 && <div className="text-[11px] text-red-400">{active} акт.</div>}
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full shrink-0">OK</span>
                  )}
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground ml-1 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── ECU Detail ──
  if (step === 'ecu_detail' && sel.ecu) {
    const TABS = [
      { id: 'dtc',     label: 'DTC',           icon: 'AlertTriangle' },
      { id: 'live',    label: 'Поток',          icon: 'Activity' },
      { id: 'special', label: 'Специальные',    icon: 'Wrench' },
      { id: 'service', label: 'Сервис',         icon: 'Settings' },
    ] as const;

    return (
      <div className="space-y-4 animate-fade-up">
        <BackBtn onClick={() => setStep('ecus')} label="К блокам управления" />
        {/* Заголовок блока */}
        <div className="border-glow bg-card rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Icon name="Cpu" size={22} className="text-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{sel.ecu.name}</div>
            <div className="text-xs text-muted-foreground font-mono">{sel.ecu.address} · {sel.ecu.protocol}</div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Подключён
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-1.5 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition ${activeTab === t.id ? 'gradient-primary text-[hsl(220,20%,8%)]' : 'bg-secondary text-muted-foreground'}`}>
              <Icon name={t.icon} size={14} />{t.label}
            </button>
          ))}
        </div>

        {/* Таб DTC */}
        {activeTab === 'dtc' && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="font-display text-xs text-muted-foreground">КОДЫ НЕИСПРАВНОСТЕЙ ({ecuFaults.length})</div>
              <div className="flex gap-2">
                <button className="text-xs text-cyan font-bold border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition flex items-center gap-1">
                  <Icon name="RefreshCw" size={12} />Читать
                </button>
                <button className="text-xs text-red-400 font-bold border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition flex items-center gap-1">
                  <Icon name="Trash2" size={12} />Удалить
                </button>
              </div>
            </div>
            {ecuFaults.length === 0
              ? <div className="border-glow bg-card rounded-xl p-8 text-center"><Icon name="CheckCircle" size={32} className="text-green-400 mx-auto mb-2" /><div className="text-sm font-semibold text-green-400">Ошибок не обнаружено</div></div>
              : ecuFaults.map(f => <DtcCard key={f.code} entry={f} />)
            }
          </div>
        )}

        {/* Таб Live Data */}
        {activeTab === 'live' && (
          <div className="space-y-3 animate-fade-up">
            <div className="font-display text-xs text-muted-foreground mb-2">ПАРАМЕТРЫ В РЕАЛЬНОМ ВРЕМЕНИ</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Обороты', value: '850', unit: 'RPM', icon: 'Gauge' },
                { label: 'Температура ОЖ', value: '91', unit: '°C', icon: 'Thermometer' },
                { label: 'Напряжение', value: '14.2', unit: 'V', icon: 'Zap' },
                { label: 'Нагрузка ДВС', value: '23', unit: '%', icon: 'Activity' },
                { label: 'MAP сенсор', value: '101', unit: 'кПа', icon: 'Wind' },
                { label: 'IAT (впуск)', value: '+24', unit: '°C', icon: 'Thermometer' },
                { label: 'Краткая коррекция', value: '+2.3', unit: '%', icon: 'TrendingUp' },
                { label: 'Долгая коррекция', value: '+7.8', unit: '%', icon: 'TrendingUp' },
              ].map(m => (
                <div key={m.label} className="border-glow bg-card rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon name={m.icon} size={14} className="text-cyan" />
                    <span className="text-[11px] text-muted-foreground">{m.label}</span>
                  </div>
                  <div className="font-display text-lg text-cyan-glow">{m.value}<span className="text-xs text-muted-foreground ml-1">{m.unit}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Таб Специальные */}
        {activeTab === 'special' && (
          <div className="space-y-3 animate-fade-up">
            <div className="font-display text-xs text-muted-foreground mb-2">СПЕЦИАЛЬНЫЕ ФУНКЦИИ</div>
            {fnGroups.special.length + fnGroups.adaptation.length + fnGroups.activation.length === 0
              ? <div className="text-sm text-muted-foreground text-center py-8">Нет специальных функций для данного блока</div>
              : null
            }
            {fnGroups.activation.length > 0 && <FuncGroup label="Активация исполнительных элементов" fns={fnGroups.activation} color="text-amber-400" />}
            {fnGroups.adaptation.length > 0 && <FuncGroup label="Адаптации и обучения" fns={fnGroups.adaptation} color="text-cyan" />}
            {fnGroups.special.length > 0 && <FuncGroup label="Специальные функции" fns={fnGroups.special} color="text-purple-400" />}
          </div>
        )}

        {/* Таб Сервис */}
        {activeTab === 'service' && (
          <div className="space-y-3 animate-fade-up">
            <div className="font-display text-xs text-muted-foreground mb-2">СЕРВИСНЫЕ ФУНКЦИИ</div>
            {fnGroups.service.length === 0
              ? <div className="text-sm text-muted-foreground text-center py-8">Нет сервисных функций для данного блока</div>
              : <FuncGroup label="Сброс и обслуживание" fns={fnGroups.service} color="text-green-400" />
            }
          </div>
        )}
      </div>
    );
  }

  return null;
}

function FuncGroup({ label, fns, color }: { label: string; fns: EcuFunction[]; color: string }) {
  const [running, setRunning] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const runFn = (id: string) => {
    setRunning(id);
    setTimeout(() => { setRunning(null); setDone(d => [...d, id]); }, 2000);
  };
  return (
    <div>
      <div className={`text-[11px] font-bold ${color} mb-2`}>{label.toUpperCase()}</div>
      <div className="space-y-2">
        {fns.map(fn => (
          <div key={fn.id} className="border-glow bg-card rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="text-sm font-semibold">{fn.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fn.description}</div>
                {fn.warning && (
                  <div className="flex items-start gap-1.5 mt-2 text-[11px] text-amber-400">
                    <Icon name="AlertTriangle" size={12} className="shrink-0 mt-0.5" />{fn.warning}
                  </div>
                )}
              </div>
              <button onClick={() => runFn(fn.id)} disabled={running === fn.id}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-lg transition ${done.includes(fn.id) ? 'bg-green-400/15 text-green-400' : 'gradient-primary text-[hsl(220,20%,8%)]'} disabled:opacity-60 flex items-center gap-1`}>
                {running === fn.id ? <><Icon name="Loader" size={12} className="animate-spin" />Выполнение...</> : done.includes(fn.id) ? <><Icon name="Check" size={12} />Готово</> : 'Выполнить'}
              </button>
            </div>
          </div>
        ))}
      </div>
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
      <SectionTitle title="Справочник DTC" sub={`${Object.keys(DTC_DB).length} кодов с описаниями и рекомендациями`} />
      <div className="border-glow bg-card rounded-xl p-3 flex items-center gap-2">
        <Icon name="Search" size={16} className="text-muted-foreground shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Код, описание, система..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        {search && <button onClick={() => setSearch('')}><Icon name="X" size={14} className="text-muted-foreground" /></button>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all','P','C','B','U'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition ${filter===f ? 'gradient-primary text-[hsl(220,20%,8%)]' : 'bg-secondary text-muted-foreground'}`}>
            {f==='all'?'Все':`${f} · ${f==='P'?'Двигатель':f==='C'?'Шасси':f==='B'?'Кузов':'Сеть'}`}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <div className="text-center text-muted-foreground text-sm py-10">Ничего не найдено</div>}
        {filtered.map(([code, info]) => (
          <div key={code} className={`bg-card rounded-xl overflow-hidden ${info.severity==='error'?'border border-red-500/30':info.severity==='warn'?'border border-amber-400/25':'border-glow'}`}>
            <button className="w-full text-left p-4 flex items-start gap-3" onClick={() => setExpanded(expanded===code?null:code)}>
              <span className={`font-mono font-bold text-sm shrink-0 mt-0.5 ${info.severity==='error'?'text-red-400':info.severity==='warn'?'text-amber-400':'text-cyan'}`}>{code}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-snug">{info.desc}</div>
                <div className="text-xs text-muted-foreground mt-1">{info.system}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full ${info.severity==='error'?'bg-red-400/15 text-red-400':info.severity==='warn'?'bg-amber-400/15 text-amber-400':'bg-primary/15 text-cyan'}`}>
                  {info.severity==='error'?'Критично':info.severity==='warn'?'Внимание':'Инфо'}
                </span>
                <Icon name={expanded===code?'ChevronUp':'ChevronDown'} size={16} className="text-muted-foreground" />
              </div>
            </button>
            {expanded === code && (
              <div className="px-4 pb-4 border-t border-border space-y-3 animate-fade-up">
                <p className="text-xs text-muted-foreground leading-relaxed pt-3">{info.detail}</p>
                <div>
                  <div className="font-display text-[11px] text-muted-foreground mb-1.5">ПРИЧИНЫ</div>
                  {info.causes.map(c => <div key={c} className="flex items-start gap-2 text-xs py-0.5"><span className="text-amber-400 shrink-0">•</span>{c}</div>)}
                </div>
                <div>
                  <div className="font-display text-[11px] text-muted-foreground mb-1.5">ДЕЙСТВИЯ</div>
                  {info.actions.map((a,i) => <div key={a} className="flex items-start gap-2 text-xs py-0.5"><span className="text-cyan shrink-0">{i+1}.</span>{a}</div>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Экран: История ────────────────────────────────────────────────────────────
const HISTORY = [
  { id: 1, vin: 'WVWZZZ1JZ3W386752', make: 'Volkswagen Golf', date: '14.06.2025', codes: ['P0171','P0420'], status: 'warn' as const },
  { id: 2, vin: 'WBA3A5C50DF595899', make: 'BMW 3 Series',    date: '10.06.2025', codes: [],               status: 'ok'   as const },
  { id: 3, vin: 'JTDBE33K120153657', make: 'Toyota Camry',    date: '03.06.2025', codes: ['P0300','P0301'],status: 'error' as const },
];
function ScreenHistory() {
  return (
    <div className="space-y-4 animate-fade-up">
      <SectionTitle title="История проверок" sub={`${HISTORY.length} сохранённых диагностики`} />
      {HISTORY.map(h => (
        <div key={h.id} className={`bg-card rounded-xl p-4 border ${h.status==='error'?'border-red-500/35':h.status==='warn'?'border-amber-400/30':'border-glow'}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${h.status==='error'?'bg-red-400/15':h.status==='warn'?'bg-amber-400/15':'bg-green-400/10'}`}>
              <Icon name="Car" size={20} className={h.status==='error'?'text-red-400':h.status==='warn'?'text-amber-400':'text-green-400'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{h.make}</div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{h.vin}</div>
              <div className="text-xs text-muted-foreground mt-1">{h.date}</div>
            </div>
            <div className="text-right shrink-0">
              {h.codes.length>0 ? h.codes.map(c=><div key={c} className="font-mono text-xs bg-secondary px-2 py-0.5 rounded text-amber-400 mb-1">{c}</div>) : <span className="text-xs text-green-400 font-semibold">OK</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'vin',      label: 'VIN',        icon: 'Search',          num: '1' },
  { id: 'vehicle',  label: 'Авто',       icon: 'Car',             num: '2' },
  { id: 'history',  label: 'История',    icon: 'History',         num: '' },
  { id: 'dtc',      label: 'Справочник', icon: 'BookOpen',        num: '' },
];

// ── App ───────────────────────────────────────────────────────────────────────
const Index = () => {
  const [tab, setTab] = useState('vin');
  return (
    <div className="min-h-screen bg-background grid-bg pb-28">
      <div className="max-w-xl mx-auto px-4 pt-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Icon name="Activity" size={18} className="text-[hsl(220,20%,8%)]" />
            </div>
            <span className="font-display text-lg text-cyan-glow">AutoDiag Pro</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />v2.0
          </div>
        </header>
        {tab === 'vin'     && <ScreenVin />}
        {tab === 'vehicle' && <ScreenVehicle />}
        {tab === 'history' && <ScreenHistory />}
        {tab === 'dtc'     && <ScreenDTC />}
      </div>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border-glow rounded-2xl px-2 py-2 flex items-center gap-1 w-[calc(100%-2rem)] max-w-sm">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)}
            className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 flex-1 transition-all relative ${tab===n.id?'gradient-primary text-[hsl(220,20%,8%)] shadow-glow':'text-muted-foreground hover:text-foreground'}`}>
            {n.num && <span className={`absolute top-1 right-1 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${tab===n.id?'bg-white/30':'bg-secondary'}`}>{n.num}</span>}
            <Icon name={n.icon} size={20} />
            <span className="text-[10px] font-semibold mt-0.5">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Index;
