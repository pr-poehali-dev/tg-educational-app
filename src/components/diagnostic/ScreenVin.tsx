import { useState, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { fetchVin, SectionTitle, type VinResult } from './shared';

export default function ScreenVin() {
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
        <input value={input} onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g,''))}
          placeholder="Введите VIN (17 символов)" maxLength={17}
          className="w-full bg-secondary rounded-lg px-4 py-3 font-mono text-sm tracking-widest outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-sans"
          onKeyDown={e => e.key === 'Enter' && search()} />
        <div className="flex gap-2">
          {['WVWZZZ1JZ3W386752','WBA3A5C50DF595899','JTD...'].slice(0,2).map((ex,i) => (
            <button key={i} onClick={() => setInput(ex)} className="text-[11px] text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg hover:text-foreground transition font-mono">{ex.slice(0,8)}…</button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground self-center">{input.length}/17</span>
        </div>
        {error && <div className="text-xs text-red-400 flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</div>}
        <button onClick={search} disabled={loading || input.length < 17}
          className="w-full gradient-primary text-[hsl(220,20%,8%)] font-bold py-3 rounded-xl font-display tracking-wider disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Icon name="Loader" size={16} className="animate-spin" />Декодирование...</> : <><Icon name="Search" size={16} />Декодировать VIN</>}
        </button>
      </div>

      {result && (
        <div className="border-glow bg-card rounded-xl overflow-hidden animate-fade-up">
          <div className="gradient-primary p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon name="Car" size={20} className="text-[hsl(220,20%,8%)]" />
            </div>
            <div>
              <div className="font-display font-bold text-[hsl(220,20%,8%)]">{result.make} {result.model}</div>
              <div className="text-xs text-[hsl(220,20%,8%)]/70">{result.year} · {result.country}</div>
            </div>
          </div>
          <div className="divide-y divide-border">
            {fields.map(([label, value, mono]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-xs font-semibold max-w-[60%] text-right truncate ${mono ? 'font-mono text-cyan' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-glow bg-card rounded-xl p-4">
        <div className="font-display text-xs text-muted-foreground mb-3">КАК ЧИТАТЬ VIN</div>
        <div className="flex gap-1 font-mono text-[11px] mb-3">
          {['WVW','ZZZ1J','Z','3W386752'].map((seg, i) => (
            <span key={i} className={`px-2 py-1 rounded ${i===0?'bg-cyan/20 text-cyan':i===1?'bg-purple-400/20 text-purple-400':i===2?'bg-amber-400/20 text-amber-400':'bg-green-400/20 text-green-400'}`}>{seg}</span>
          ))}
        </div>
        {[['Синий (1-3)', 'WMI — производитель и страна'], ['Фиолетовый (4-9)', 'VDS — характеристики авто'], ['Оранжевый (10)', 'Год выпуска'], ['Зелёный (11-17)', 'Серийный номер']].map(([c,d]) => (
          <div key={c} className="text-[11px] text-muted-foreground mb-1"><span className="text-foreground">{c}:</span> {d}</div>
        ))}
      </div>
    </div>
  );
}
