import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

const MASCOT = 'https://cdn.poehali.dev/projects/9c84ab67-0481-49f6-b840-91ab3c78d672/files/aac1ae14-e378-404b-abd8-feb99f7c08c1.jpg';

const NAV = [
  { id: 'home', label: 'Главная', icon: 'House' },
  { id: 'variants', label: 'Варианты', icon: 'FileStack' },
  { id: 'tutor', label: 'AI-репетитор', icon: 'Sparkles' },
  { id: 'progress', label: 'Прогресс', icon: 'Trophy' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

const SUBJECTS = [
  { name: 'Математика', icon: 'Calculator', color: 'from-violet-500 to-purple-600', done: 12, total: 20 },
  { name: 'Русский язык', icon: 'BookOpen', color: 'from-orange-500 to-rose-500', done: 8, total: 18 },
  { name: 'Физика', icon: 'Atom', color: 'from-emerald-500 to-teal-600', done: 5, total: 15 },
  { name: 'Информатика', icon: 'Cpu', color: 'from-sky-500 to-blue-600', done: 3, total: 14 },
];

const ACHIEVEMENTS = [
  { icon: 'Flame', label: '7 дней подряд', got: true },
  { icon: 'Target', label: '100 заданий', got: true },
  { icon: 'Zap', label: 'Без ошибок', got: true },
  { icon: 'Crown', label: 'Топ-10 недели', got: false },
  { icon: 'Rocket', label: 'Марафон', got: false },
  { icon: 'Star', label: 'Все темы', got: false },
];

function Stat({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-soft flex items-center gap-3">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-white shrink-0`}>
        <Icon name={icon} size={24} />
      </div>
      <div>
        <div className="font-display font-extrabold text-xl leading-none">{value}</div>
        <div className="text-xs text-muted-foreground font-semibold mt-1">{label}</div>
      </div>
    </div>
  );
}

const Index = () => {
  const [tab, setTab] = useState('home');

  return (
    <div className="min-h-screen gradient-mesh pb-28">
      {/* Top bar */}
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl gradient-hero flex items-center justify-center text-white shadow-pop">
            <Icon name="GraduationCap" size={22} />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight">ОГЭ Квест</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-full pl-3 pr-1.5 py-1.5 shadow-soft">
          <Icon name="Flame" size={18} className="text-orange-500" />
          <span className="font-extrabold text-sm">7</span>
          <div className="w-8 h-8 rounded-full gradient-hero" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 mt-6">
        {/* Hero */}
        <section className="relative gradient-hero rounded-[2rem] p-6 sm:p-8 overflow-hidden shadow-pop animate-pop-in">
          <div className="absolute -right-6 -top-6 w-40 h-40 bg-white/15 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="text-white max-w-md">
              <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur rounded-full px-3 py-1 text-xs font-bold mb-3">
                <Icon name="Calendar" size={14} /> До ОГЭ 214 дней
              </span>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">
                Привет! Готов прокачаться сегодня?
              </h1>
              <p className="text-white/80 font-semibold mt-2 text-sm">
                Реши 5 заданий и продли свою серию 🔥
              </p>
              <Button className="mt-5 bg-white text-primary hover:bg-white/90 font-extrabold rounded-2xl h-12 px-6 text-base shadow-lg">
                Начать квест
                <Icon name="ArrowRight" size={18} className="ml-1" />
              </Button>
            </div>
            <img src={MASCOT} alt="Маскот" className="w-28 h-28 sm:w-40 sm:h-40 object-contain animate-float drop-shadow-2xl rounded-3xl shrink-0" />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Stat icon="Star" value="2 480" label="Очки XP" color="bg-gradient-to-br from-violet-500 to-purple-600" />
          <Stat icon="Trophy" value="12 ур." label="Уровень" color="bg-gradient-to-br from-orange-500 to-rose-500" />
          <Stat icon="CircleCheck" value="148" label="Решено" color="bg-gradient-to-br from-emerald-500 to-teal-600" />
          <Stat icon="Flame" value="7 дн." label="Серия" color="bg-gradient-to-br from-sky-500 to-blue-600" />
        </section>

        {/* Level progress */}
        <section className="bg-white rounded-3xl p-5 mt-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-extrabold">Уровень 12 · Знаток</span>
            <span className="text-sm font-bold text-muted-foreground">2480 / 3000 XP</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-hero rounded-full" style={{ width: '82%' }} />
          </div>
          <p className="text-xs text-muted-foreground font-semibold mt-2">Ещё 520 XP до уровня «Магистр» 🚀</p>
        </section>

        {/* Subjects / variants */}
        <section className="mt-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-extrabold text-xl">Варианты по предметам</h2>
            <button className="text-sm font-bold text-primary flex items-center gap-1">
              Все <Icon name="ChevronRight" size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SUBJECTS.map((s) => (
              <div key={s.name} className="bg-white rounded-3xl p-5 shadow-soft hover:-translate-y-1 transition-transform cursor-pointer group">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}>
                    <Icon name={s.icon} size={24} />
                  </div>
                  <div>
                    <div className="font-display font-extrabold">{s.name}</div>
                    <div className="text-xs text-muted-foreground font-semibold">{s.done} из {s.total} вариантов</div>
                  </div>
                  <Icon name="ChevronRight" size={20} className="ml-auto text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full bg-gradient-to-r ${s.color} rounded-full`} style={{ width: `${(s.done / s.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI tutor card */}
        <section className="mt-7 bg-white rounded-3xl p-6 shadow-soft relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0 animate-wiggle">
              <Icon name="Sparkles" size={28} />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-extrabold text-lg">AI-репетитор онлайн 24/7</h3>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Объяснит любую тему простыми словами, разберёт ошибки и ответит на вопрос — как живой учитель.
              </p>
            </div>
            <Button className="rounded-2xl font-extrabold h-12 px-6 bg-gradient-to-br from-emerald-500 to-teal-600 hover:opacity-90 shrink-0">
              <Icon name="MessageCircle" size={18} className="mr-1" /> Спросить
            </Button>
          </div>
        </section>

        {/* Achievements */}
        <section className="mt-7">
          <h2 className="font-display font-extrabold text-xl mb-4">Достижения</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((a) => (
              <div key={a.label} className={`rounded-3xl p-4 text-center shadow-soft transition ${a.got ? 'bg-white' : 'bg-white/50 opacity-60'}`}>
                <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${a.got ? 'gradient-hero text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Icon name={a.got ? a.icon : 'Lock'} size={22} />
                </div>
                <div className="text-[11px] font-bold mt-2 leading-tight">{a.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Telegram banner */}
        <section className="mt-7 gradient-hero rounded-3xl p-5 flex items-center gap-4 shadow-pop">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white shrink-0">
            <Icon name="Send" size={24} />
          </div>
          <div className="text-white flex-1">
            <div className="font-display font-extrabold">Учись прямо в Telegram</div>
            <div className="text-white/80 text-sm font-semibold">Напоминания, задания и репетитор в боте</div>
          </div>
          <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl font-extrabold shrink-0">
            Открыть
          </Button>
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white rounded-full px-2 py-2 shadow-pop flex items-center gap-1 w-[calc(100%-2rem)] max-w-md justify-between">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            className={`flex flex-col items-center justify-center rounded-full px-3 py-2 flex-1 transition ${
              tab === n.id ? 'gradient-hero text-white shadow-lg' : 'text-muted-foreground'
            }`}
          >
            <Icon name={n.icon} size={20} />
            <span className="text-[10px] font-bold mt-0.5">{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Index;
