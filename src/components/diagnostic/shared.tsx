import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { DTC_DB } from '@/data/dtc';

// ── VIN API ───────────────────────────────────────────────────────────────────
export interface VinResult {
  vin: string; make: string; model: string; year: string;
  type: string; engine: string; fuel: string; country: string;
  doors: string; drive: string; transmission: string;
  wmi: string; vds: string; serial: string;
}

export function localCountry(vin: string): string {
  const map: Record<string, string> = { W: 'Германия', V: 'Швеция/Франция', S: 'Великобритания', Z: 'Италия', X: 'Россия', J: 'Япония', K: 'Южная Корея', L: 'Китай', '1': 'США', '2': 'Канада', '3': 'Мексика' };
  return map[vin[0]] || 'Неизвестно';
}

export function localDecodeVin(vin: string): VinResult {
  const v = vin.toUpperCase();
  const makes: Record<string, string> = { WVW: 'Volkswagen', WAU: 'Audi', WBA: 'BMW', WDD: 'Mercedes-Benz', WDB: 'Mercedes-Benz', TMB: 'Škoda', VSS: 'SEAT', JTD: 'Toyota', JTM: 'Toyota', SAL: 'Land Rover', XTA: 'LADA (ВАЗ)', YV1: 'Volvo', ZAR: 'Alfa Romeo', KNM: 'Kia', KMH: 'Hyundai', VF1: 'Renault', VF3: 'Peugeot' };
  const years: Record<string, string> = { A:'1980',B:'1981',C:'1982',D:'1983',E:'1984',F:'1985',G:'1986',H:'1987',J:'1988',K:'1989',L:'1990',M:'1991',N:'1992',P:'1993',R:'1994',S:'1995',T:'1996',V:'1997',W:'1998',X:'1999',Y:'2000','1':'2001','2':'2002','3':'2003','4':'2004','5':'2005','6':'2006','7':'2007','8':'2008','9':'2009' };
  return { vin: v, make: makes[v.slice(0,3)] || 'Неизвестно', model: '—', year: years[v[9]] || '—', type: '—', engine: '—', fuel: '—', country: localCountry(v), doors: '—', drive: '—', transmission: '—', wmi: v.slice(0,3), vds: v.slice(3,9), serial: v.slice(11) };
}

export async function fetchVin(vin: string): Promise<VinResult> {
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

// ── DTC типы ──────────────────────────────────────────────────────────────────
export type DtcStatus = 'active' | 'stored' | 'temporary' | 'historical';
export const STATUS_CFG: Record<DtcStatus, { label: string; color: string; bg: string; dot: string }> = {
  active:     { label: 'Активная',     color: 'text-red-400',          bg: 'bg-red-400/15',    dot: 'bg-red-400' },
  stored:     { label: 'Сохранённая',  color: 'text-amber-400',        bg: 'bg-amber-400/15',  dot: 'bg-amber-400' },
  temporary:  { label: 'Временная',    color: 'text-yellow-300',       bg: 'bg-yellow-300/15', dot: 'bg-yellow-300' },
  historical: { label: 'Историческая', color: 'text-muted-foreground', bg: 'bg-secondary',     dot: 'bg-muted-foreground' },
};
export interface DtcEntry { code: string; status: DtcStatus; count: number; lastSeen: string; }

// ── Shared UI ─────────────────────────────────────────────────────────────────
export function BackBtn({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4">
      <Icon name="ChevronLeft" size={18} />{label}
    </button>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <div className="font-display text-xl text-cyan-glow">{title}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ── DTC Card ──────────────────────────────────────────────────────────────────
export function DtcCard({ entry }: { entry: DtcEntry }) {
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
