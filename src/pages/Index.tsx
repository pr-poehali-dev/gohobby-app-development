import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { startYandexLogin, getProfile, saveProfile, logout, UserProfile } from '@/lib/api';

const SQUASH = 'https://cdn.poehali.dev/projects/903a8275-c14c-4a10-a3b0-d0ff80d0e562/files/cd6057af-4edb-40b4-ac87-72d0d7e5309d.jpg';
const BOARD = 'https://cdn.poehali.dev/projects/903a8275-c14c-4a10-a3b0-d0ff80d0e562/files/156f4f57-d35e-4373-91dd-2798c2b65c5f.jpg';
const ART = 'https://cdn.poehali.dev/projects/903a8275-c14c-4a10-a3b0-d0ff80d0e562/files/3ae4a4a1-9297-4940-b843-af50c884ede3.jpg';

type Screen = 'onboarding' | 'auth' | 'setup' | 'app';
type Tab = 'feed' | 'create' | 'chats' | 'profile';

const HOBBY_LIST = ['🎾 Спорт', '🎲 Настолки', '🎨 Творчество', '🎸 Музыка', '📚 Книги', '🥾 Походы', '🍳 Кулинария', '📷 Фото', '🧗 Скалолазание', '♟️ Шахматы'];

const SLIDES = [
  { icon: 'Compass', title: 'Это не дейтинг', text: 'GoHobby — про общие активности, а не романтику. Ищи партнёров по интересам.', from: '#FF5E62', to: '#FF9966' },
  { icon: 'CalendarClock', title: 'Создавай слоты', text: 'Сквош завтра в 19:00? Настолки в субботу? Опубликуй активность и найди компанию.', from: '#7B2FF7', to: '#FF5E62' },
  { icon: 'Sparkles', title: 'Свайпай и матчись', text: 'Вправо — «хочу участвовать», влево — «не интересно». Совпадение открывает чат.', from: '#36D1DC', to: '#7B2FF7' },
];

const CARDS = [
  { name: 'Анна, 26', img: SQUASH, hobby: '🎾 Сквош', activity: 'Ищу партнёра для игры в сквош', when: 'Завтра · 19:00', place: 'СК «Олимп», м. Спортивная', tags: ['Новичок ок', 'Ракетка есть'] },
  { name: 'Дмитрий, 31', img: BOARD, hobby: '🎲 Настолки', activity: 'Вечер Каркассона и Манчкина', when: 'Сб · 18:30', place: 'Антикафе «Точка», центр', tags: ['4 места', 'Чай в подарок'] },
  { name: 'Лера, 24', img: ART, hobby: '🎨 Творчество', activity: 'Совместный пленэр с акварелью', when: 'Вс · 12:00', place: 'Парк Горького, у пруда', tags: ['Краски свои', 'Любой уровень'] },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState<Tab>('feed');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) {
        setUser(p);
        setScreen(p.birthDate ? 'app' : 'setup');
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <Phone>
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-grape via-coral to-sunset text-white">
          <Icon name="LoaderCircle" size={40} className="animate-spin" />
        </div>
      </Phone>
    );
  }

  if (screen === 'onboarding') {
    const s = SLIDES[slide];
    return (
      <Phone>
        <div className="h-full flex flex-col text-white transition-all duration-500" style={{ background: `linear-gradient(150deg, ${s.from}, ${s.to})` }}>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-32 h-32 rounded-[2rem] bg-white/15 backdrop-blur flex items-center justify-center mb-10 animate-float shadow-2xl">
              <Icon name={s.icon} size={56} className="text-white" />
            </div>
            <h1 key={slide} className="font-display font-extrabold text-3xl mb-4 animate-scale-in">{s.title}</h1>
            <p key={slide + 't'} className="text-white/85 text-lg leading-relaxed animate-fade-in">{s.text}</p>
          </div>
          <div className="px-8 pb-10">
            <div className="flex gap-2 justify-center mb-8">
              {SLIDES.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${i === slide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
              ))}
            </div>
            <button
              onClick={() => (slide < SLIDES.length - 1 ? setSlide(slide + 1) : setScreen('auth'))}
              className="w-full bg-white text-gray-900 font-display font-bold text-lg py-4 rounded-2xl shadow-xl active:scale-95 transition-transform"
            >
              {slide < SLIDES.length - 1 ? 'Дальше' : 'Поехали!'}
            </button>
            {slide < SLIDES.length - 1 && (
              <button onClick={() => setScreen('auth')} className="w-full text-white/70 text-sm mt-4 font-medium">Пропустить</button>
            )}
          </div>
        </div>
      </Phone>
    );
  }

  if (screen === 'auth') {
    return (
      <Phone>
        <div className="h-full flex flex-col justify-end px-8 pb-12 bg-gradient-to-br from-grape via-coral to-sunset text-white">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="font-display font-black text-5xl tracking-tight">GoHobby</div>
            <p className="text-white/80 mt-3 text-center text-lg">Хобби веселее вместе</p>
          </div>
          <button onClick={() => startYandexLogin().catch(() => alert('Добавьте ключи Яндекс ID в настройках проекта'))} className="w-full bg-white text-gray-900 font-display font-bold py-4 rounded-2xl mb-3 flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-xl">
            <span className="text-xl font-black text-[#FF0000]">Я</span> Войти через Яндекс ID
          </button>
          <button className="w-full bg-white/15 backdrop-blur border border-white/30 text-white font-display font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform opacity-60">
            <Icon name="Mail" size={20} /> Google — скоро
          </button>
          <p className="text-center text-white/60 text-xs mt-6">Регистрируясь, вы принимаете условия сервиса</p>
        </div>
      </Phone>
    );
  }

  if (screen === 'setup' && user) {
    return (
      <Phone>
        <SetupProfile user={user} onDone={(u) => { setUser(u); setScreen('app'); }} />
      </Phone>
    );
  }

  return (
    <Phone>
      <div className="h-full flex flex-col bg-[#F7F6FB]">
        <div className="flex-1 overflow-hidden">
          {tab === 'feed' && <Feed />}
          {tab === 'create' && <CreateSlot />}
          {tab === 'chats' && <Chats />}
          {tab === 'profile' && <Profile user={user} onLogout={() => { logout(); setUser(null); setScreen('onboarding'); }} />}
        </div>
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </Phone>
  );
}

function SetupProfile({ user, onDone }: { user: UserProfile; onDone: (u: UserProfile) => void }) {
  const [name, setName] = useState(user.name || '');
  const [birth, setBirth] = useState(user.birthDate || '');
  const [hobbies, setHobbies] = useState<string[]>(user.hobbies || []);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (h: string) => {
    setHobbies((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : prev.length < 5 ? [...prev, h] : prev);
  };

  const submit = async () => {
    setSaving(true);
    const all = custom.trim() && !hobbies.includes(custom.trim()) ? [...hobbies, custom.trim()].slice(0, 5) : hobbies;
    await saveProfile({ name, birthDate: birth || null, hobbies: all, photos: user.photos });
    onDone({ ...user, name, birthDate: birth, hobbies: all });
  };

  return (
    <div className="h-full overflow-y-auto px-6 pt-8 pb-8 bg-[#F7F6FB]">
      <h1 className="font-display font-extrabold text-2xl mb-1">Паспорт хобби</h1>
      <p className="text-gray-500 mb-6">Заполни профиль, чтобы начать</p>

      <Label>Имя</Label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как тебя зовут" className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 outline-none focus:border-grape" />

      <Label>Дата рождения</Label>
      <input type="date" value={birth || ''} onChange={(e) => setBirth(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 outline-none focus:border-grape text-gray-700" />

      <Label>Хобби (до 5)</Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {HOBBY_LIST.map((h) => (
          <button key={h} onClick={() => toggle(h)} className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${hobbies.includes(h) ? 'bg-gradient-to-r from-grape to-coral text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}>{h}</button>
        ))}
      </div>
      <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Своё хобби..." className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 outline-none focus:border-grape text-sm" />

      <button disabled={!name || saving} onClick={submit} className="w-full bg-gradient-to-r from-grape to-coral text-white font-display font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
        {saving ? 'Сохраняем...' : 'Готово'}
      </button>
    </div>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 p-4 font-sans">
      <div className="w-full max-w-[400px] h-[840px] max-h-[92vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 relative">
        {children}
      </div>
    </div>
  );
}

function Feed() {
  const [index, setIndex] = useState(0);
  const [match, setMatch] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const card = CARDS[index % CARDS.length];

  const swipe = (dir: 'left' | 'right') => {
    if (dir === 'right' && Math.random() > 0.35) {
      setMatch(true);
      setTimeout(() => { setMatch(false); setIndex((i) => i + 1); }, 1800);
    } else {
      setIndex((i) => i + 1);
    }
    setDrag(0);
  };

  return (
    <div className="h-full flex flex-col">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <span className="font-display font-black text-2xl bg-gradient-to-r from-grape to-coral bg-clip-text text-transparent">GoHobby</span>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-sunset flex items-center justify-center text-white"><Icon name="SlidersHorizontal" size={18} /></div>
      </header>

      <div className="flex-1 relative px-5">
        <div
          key={index}
          className="absolute inset-x-5 top-0 bottom-0 rounded-3xl overflow-hidden shadow-2xl animate-scale-in select-none"
          style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)`, transition: start.current === null ? 'transform .3s' : 'none' }}
          onPointerDown={(e) => { start.current = e.clientX; }}
          onPointerMove={(e) => { if (start.current !== null) setDrag(e.clientX - start.current); }}
          onPointerUp={() => { if (Math.abs(drag) > 100) swipe(drag > 0 ? 'right' : 'left'); else setDrag(0); start.current = null; }}
        >
          <img src={card.img} alt="" className="w-full h-full object-cover pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {drag > 40 && <Stamp text="УЧАСТВУЮ" color="#22c55e" rotate={-15} side="left" />}
          {drag < -40 && <Stamp text="МИМО" color="#ef4444" rotate={15} side="right" />}

          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold text-gray-900">{card.hobby}</div>

          <div className="absolute bottom-0 inset-x-0 p-5 text-white">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold mb-1"><Icon name="Megaphone" size={16} /> Предложение активности</div>
              <p className="font-display font-bold text-lg leading-snug">{card.activity}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/90">
                <span className="flex items-center gap-1"><Icon name="Clock" size={14} />{card.when}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-white/90"><Icon name="MapPin" size={14} />{card.place}</div>
            </div>
            <h2 className="font-display font-extrabold text-2xl">{card.name}</h2>
            <div className="flex gap-2 mt-2">
              {card.tags.map((t) => <span key={t} className="bg-white/20 px-2.5 py-1 rounded-full text-xs font-medium">{t}</span>)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-6">
        <button onClick={() => swipe('left')} className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 active:scale-90 transition-transform border border-gray-100">
          <Icon name="X" size={30} />
        </button>
        <button onClick={() => swipe('right')} className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform">
          <Icon name="Check" size={36} />
        </button>
      </div>

      {match && <MatchOverlay card={card} />}
    </div>
  );
}

function Stamp({ text, color, rotate, side }: { text: string; color: string; rotate: number; side: 'left' | 'right' }) {
  return (
    <div className={`absolute top-12 ${side === 'left' ? 'left-6' : 'right-6'} border-4 rounded-xl px-4 py-2 font-display font-black text-2xl`} style={{ color, borderColor: color, transform: `rotate(${rotate}deg)` }}>
      {text}
    </div>
  );
}

function MatchOverlay({ card }: { card: typeof CARDS[number] }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-grape/95 to-coral/95 backdrop-blur flex flex-col items-center justify-center text-white z-20 animate-fade-in">
      <div className="animate-pop text-center px-8">
        <div className="font-display font-black text-5xl mb-2">Мэтч! 🎉</div>
        <p className="text-white/90 text-lg mb-8">{card.name.split(',')[0]} тоже хочет участвовать</p>
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white mx-auto shadow-2xl">
          <img src={card.img} alt="" className="w-full h-full object-cover" />
        </div>
        <p className="mt-8 text-white/80">Открываем чат...</p>
      </div>
    </div>
  );
}

function CreateSlot() {
  const [hobby, setHobby] = useState('🎾 Спорт');
  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-24">
      <h1 className="font-display font-extrabold text-2xl mb-1">Создать слот</h1>
      <p className="text-gray-500 mb-6">Опубликуй активность — её увидят в ленте</p>

      <Label>Тип хобби</Label>
      <div className="flex flex-wrap gap-2 mb-5">
        {HOBBY_LIST.slice(0, 6).map((h) => (
          <button key={h} onClick={() => setHobby(h)} className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${hobby === h ? 'bg-gradient-to-r from-grape to-coral text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}>{h}</button>
        ))}
      </div>

      <Label>Дата и время</Label>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <FakeInput icon="Calendar" text="Завтра" />
        <FakeInput icon="Clock" text="19:00" />
      </div>

      <Label>Место</Label>
      <FakeInput icon="MapPin" text="СК «Олимп», м. Спортивная" full />
      <div className="h-32 rounded-2xl bg-gradient-to-br from-grape/10 to-coral/10 border border-dashed border-grape/30 flex items-center justify-center text-grape mt-3 mb-5">
        <div className="text-center"><Icon name="Map" size={28} className="mx-auto mb-1" /><span className="text-sm font-medium">Отметить на карте</span></div>
      </div>

      <Label>Фото активности</Label>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300"><Icon name="ImagePlus" size={24} /></div>
        ))}
      </div>

      <button className="w-full bg-gradient-to-r from-grape to-coral text-white font-display font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform">Опубликовать слот</button>
    </div>
  );
}

function Chats() {
  const items = [
    { name: 'Анна', img: SQUASH, last: 'Отлично, до завтра на сквоше! 🎾', time: '12:40', unread: 2 },
    { name: 'Дмитрий', img: BOARD, last: 'Беру Каркассон с собой', time: 'Вчера', unread: 0 },
    { name: 'Лера', img: ART, last: 'Какие краски брать?', time: 'Пн', unread: 0 },
  ];
  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-24">
      <h1 className="font-display font-extrabold text-2xl mb-5">Чаты</h1>
      <div className="space-y-2">
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-sm active:scale-[.98] transition-transform">
            <img src={c.img} alt="" className="w-14 h-14 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-display font-bold">{c.name}</span>
                <span className="text-xs text-gray-400">{c.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">{c.last}</p>
            </div>
            {c.unread > 0 && <span className="w-6 h-6 rounded-full bg-coral text-white text-xs flex items-center justify-center font-bold">{c.unread}</span>}
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          <img src={SQUASH} alt="" className="w-10 h-10 rounded-full object-cover" />
          <div><div className="font-display font-bold text-sm">Анна</div><div className="text-xs text-green-500">в сети</div></div>
        </div>
        <div className="space-y-2">
          <Bubble me={false} text="Привет! Готова к сквошу завтра?" />
          <Bubble me text="Да! Буду в 19:00 у входа 👍" />
          <Bubble me={false} text="Отлично, до завтра на сквоше! 🎾" />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-400">Сообщение...</div>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-grape to-coral text-white flex items-center justify-center"><Icon name="Send" size={18} /></button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ me, text }: { me: boolean; text: string }) {
  return (
    <div className={`flex ${me ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${me ? 'bg-gradient-to-r from-grape to-coral text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>{text}</div>
    </div>
  );
}

function Profile({ user, onLogout }: { user: UserProfile | null; onLogout: () => void }) {
  const age = user?.birthDate ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / 3.15576e10) : null;
  const hobbies = user?.hobbies?.length ? user.hobbies : ['🎨 Творчество', '📷 Фото', '🥾 Походы'];
  const photos = user?.photos?.length ? user.photos : [ART, BOARD, SQUASH];
  const avatar = user?.avatar || ART;

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="h-44 bg-gradient-to-br from-grape via-coral to-sunset relative">
        <button onClick={onLogout} className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white rounded-full p-2 active:scale-90 transition-transform"><Icon name="LogOut" size={18} /></button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white">
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      <div className="pt-16 px-5 text-center">
        <h1 className="font-display font-extrabold text-2xl">{user?.name || 'Гость'}{age ? `, ${age}` : ''}</h1>
        <p className="text-gray-500">Паспорт хобби</p>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {photos.slice(0, 3).map((p, i) => (
            <img key={i} src={p} className="aspect-square rounded-2xl object-cover" alt="" />
          ))}
        </div>

        <div className="text-left mt-6">
          <Label>Мои хобби</Label>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h) => (
              <span key={h} className="px-3.5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-grape to-coral text-white">{h}</span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <Stat n="12" l="Активностей" />
          <Stat n="48" l="Мэтчей" />
          <Stat n={user ? user.rating.toFixed(1) : '4.9'} l="Рейтинг" />
        </div>

        <button className="w-full bg-white border border-gray-200 text-gray-800 font-display font-bold py-3.5 rounded-2xl mt-6 flex items-center justify-center gap-2 active:scale-95 transition-transform">
          <Icon name="Pencil" size={18} /> Редактировать профиль
        </button>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-white rounded-2xl py-3 shadow-sm">
      <div className="font-display font-black text-xl bg-gradient-to-r from-grape to-coral bg-clip-text text-transparent">{n}</div>
      <div className="text-xs text-gray-500">{l}</div>
    </div>
  );
}

function NavBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { id: Tab; icon: string; label: string }[] = [
    { id: 'feed', icon: 'Flame', label: 'Лента' },
    { id: 'create', icon: 'PlusCircle', label: 'Создать' },
    { id: 'chats', icon: 'MessageCircle', label: 'Чаты' },
    { id: 'profile', icon: 'User', label: 'Профиль' },
  ];
  return (
    <nav className="bg-white border-t border-gray-100 flex justify-around items-center px-2 py-3">
      {items.map((it) => (
        <button key={it.id} onClick={() => setTab(it.id)} className={`flex flex-col items-center gap-1 transition-colors ${tab === it.id ? 'text-grape' : 'text-gray-400'}`}>
          <Icon name={it.icon} size={24} />
          <span className="text-[11px] font-semibold">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-bold text-sm text-gray-800 mb-2">{children}</div>;
}

function FakeInput({ icon, text, full }: { icon: string; text: string; full?: boolean }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl px-4 py-3.5 flex items-center gap-2 text-gray-700 ${full ? 'w-full' : ''}`}>
      <Icon name={icon} size={18} className="text-grape" />
      <span className="text-sm font-medium truncate">{text}</span>
    </div>
  );
}