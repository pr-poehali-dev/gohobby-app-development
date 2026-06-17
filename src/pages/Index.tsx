import { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import {
  startYandexLogin, getProfile, saveProfile, logout,
  getFeed, swipeActivity, createActivity, getMyActivities, uploadPhoto,
  UserProfile, ActivityCard,
} from '@/lib/api';

type MyActivity = ActivityCard & { is_active: boolean; joined_count: number };

const HOBBY_LIST = [
  '🎾 Спорт', '🎲 Настолки', '🎨 Творчество', '🎸 Музыка',
  '📚 Книги', '🥾 Походы', '🍳 Кулинария', '📷 Фото',
  '🧗 Скалолазание', '♟️ Шахматы',
];

type Screen = 'onboarding' | 'auth' | 'setup' | 'app';
type Tab = 'feed' | 'create' | 'chats' | 'profile';

const SLIDES = [
  { icon: 'Compass', title: 'Это не дейтинг', text: 'GoHobby — про общие активности, а не романтику. Ищи партнёров по интересам.', from: '#FF5E62', to: '#FF9966' },
  { icon: 'CalendarClock', title: 'Создавай слоты', text: 'Сквош завтра в 19:00? Настолки в субботу? Опубликуй активность и найди компанию.', from: '#7B2FF7', to: '#FF5E62' },
  { icon: 'Sparkles', title: 'Свайпай и матчись', text: 'Вправо — «хочу участвовать», влево — «не интересно». Совпадение открывает чат.', from: '#36D1DC', to: '#7B2FF7' },
];

export default function Index() {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState<Tab>('feed');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getProfile().then((p) => {
      if (p) { setUser(p); setScreen(p.birthDate ? 'app' : 'setup'); }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <Phone>
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#7B2FF7] via-[#FF5E62] to-[#FF9966]">
          <Icon name="LoaderCircle" size={40} className="animate-spin text-white" />
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
              onClick={() => slide < SLIDES.length - 1 ? setSlide(slide + 1) : setScreen('auth')}
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
        <div className="h-full flex flex-col justify-end px-8 pb-12 bg-gradient-to-br from-[#7B2FF7] via-[#FF5E62] to-[#FF9966] text-white">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="font-display font-black text-5xl tracking-tight">GoHobby</div>
            <p className="text-white/80 mt-3 text-center text-lg">Хобби веселее вместе</p>
          </div>
          <button
            onClick={() => setScreen('app')}
            className="w-full bg-white text-gray-900 font-display font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-3"
          >
            <Icon name="ArrowRight" size={20} /> Начать
          </button>
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
          {tab === 'feed' && <Feed user={user} />}
          {tab === 'create' && <CreateSlot onCreated={() => setTab('feed')} />}
          {tab === 'chats' && <Chats />}
          {tab === 'profile' && (
            <Profile user={user} onLogout={() => { logout(); setUser(null); setScreen('onboarding'); setSlide(0); }} />
          )}
        </div>
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </Phone>
  );
}

// ─── PHONE SHELL ────────────────────────────────────────────────────────────
function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 p-4 font-sans">
      <div className="w-full max-w-[400px] h-[840px] max-h-[92vh] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-gray-900 relative">
        {children}
      </div>
    </div>
  );
}

// ─── SETUP PROFILE ──────────────────────────────────────────────────────────
function SetupProfile({ user, onDone }: { user: UserProfile; onDone: (u: UserProfile) => void }) {
  const [name, setName] = useState(user.name || '');
  const [birth, setBirth] = useState(user.birthDate || '');
  const [hobbies, setHobbies] = useState<string[]>(user.hobbies || []);
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (h: string) =>
    setHobbies((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : prev.length < 5 ? [...prev, h] : prev);

  const submit = async () => {
    setSaving(true);
    const all = custom.trim() && !hobbies.includes(custom.trim())
      ? [...hobbies, custom.trim()].slice(0, 5) : hobbies;
    await saveProfile({ name, birthDate: birth || null, hobbies: all, photos: user.photos });
    onDone({ ...user, name, birthDate: birth, hobbies: all });
  };

  return (
    <div className="h-full overflow-y-auto px-6 pt-8 pb-8 bg-[#F7F6FB]">
      <h1 className="font-display font-extrabold text-2xl mb-1">Паспорт хобби</h1>
      <p className="text-gray-500 mb-6">Заполни профиль, чтобы начать</p>
      <Label>Имя</Label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Как тебя зовут"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 outline-none focus:border-[#7B2FF7] font-sans" />
      <Label>Дата рождения</Label>
      <input type="date" value={birth} onChange={(e) => setBirth(e.target.value)}
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 outline-none focus:border-[#7B2FF7] text-gray-700" />
      <Label>Хобби (до 5)</Label>
      <div className="flex flex-wrap gap-2 mb-3">
        {HOBBY_LIST.map((h) => (
          <button key={h} onClick={() => toggle(h)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold transition-all ${hobbies.includes(h) ? 'bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}>
            {h}
          </button>
        ))}
      </div>
      <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Своё хобби..."
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6 outline-none focus:border-[#7B2FF7] text-sm" />
      <button disabled={!name || saving} onClick={submit}
        className="w-full bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] text-white font-display font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
        {saving ? 'Сохраняем...' : 'Готово'}
      </button>
    </div>
  );
}

// ─── FEED ───────────────────────────────────────────────────────────────────
function Feed({ user }: { user: UserProfile | null }) {
  const [cards, setCards] = useState<ActivityCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<ActivityCard | null>(null);
  const [drag, setDrag] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getFeed();
    setCards(data);
    setIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const card = cards[idx] ?? null;

  const doSwipe = async (dir: 'left' | 'right') => {
    if (!card || swiping) return;
    setSwiping(true);
    setDrag(0);
    if (dir === 'right') {
      const res = await swipeActivity(card.id, 'join');
      if (res.match) {
        setMatch(card);
        setTimeout(() => { setMatch(null); setIdx((i) => i + 1); setSwiping(false); }, 2000);
        return;
      }
    } else {
      await swipeActivity(card.id, 'skip');
    }
    setIdx((i) => i + 1);
    setSwiping(false);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
        <Icon name="LoaderCircle" size={36} className="animate-spin text-[#7B2FF7]" />
        <span className="text-sm">Загружаем активности...</span>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-4">
        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#7B2FF7]/10 to-[#FF5E62]/10 flex items-center justify-center">
          <Icon name="Coffee" size={36} className="text-[#7B2FF7]" />
        </div>
        <h2 className="font-display font-extrabold text-xl">Активностей пока нет</h2>
        <p className="text-gray-500 text-sm">Создай первый слот — и другие смогут к тебе присоединиться</p>
        <button onClick={load} className="flex items-center gap-2 text-[#7B2FF7] font-semibold text-sm">
          <Icon name="RefreshCw" size={16} /> Обновить
        </button>
      </div>
    );
  }

  const spotsLeft = card.spots_left ?? (card.spots_total - 0);
  const spotsPercent = Math.round((spotsLeft / card.spots_total) * 100);

  return (
    <div className="h-full flex flex-col">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <span className="font-display font-black text-2xl bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] bg-clip-text text-transparent">GoHobby</span>
        <button onClick={load} className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF5E62] to-[#FF9966] flex items-center justify-center text-white active:scale-90 transition-transform">
          <Icon name="RefreshCw" size={17} />
        </button>
      </header>

      <div className="flex-1 relative px-5 pb-2">
        <div
          key={card.id}
          className="absolute inset-x-5 top-0 bottom-0 rounded-3xl overflow-hidden shadow-2xl animate-scale-in select-none cursor-grab active:cursor-grabbing"
          style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)`, transition: startX.current === null ? 'transform .3s' : 'none' }}
          onPointerDown={(e) => { startX.current = e.clientX; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (startX.current !== null) setDrag(e.clientX - startX.current); }}
          onPointerUp={() => { if (Math.abs(drag) > 90) doSwipe(drag > 0 ? 'right' : 'left'); else setDrag(0); startX.current = null; }}
        >
          {card.photo_url ? (
            <img src={card.photo_url} alt="" className="w-full h-full object-cover pointer-events-none" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#7B2FF7] to-[#FF5E62] flex items-center justify-center pointer-events-none">
              <span className="text-8xl">{card.hobby.split(' ')[0]}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />

          {drag > 40 && <SwipeStamp text="УЧАСТВУЮ" color="#22c55e" rotate={-12} left />}
          {drag < -40 && <SwipeStamp text="МИМО" color="#ef4444" rotate={12} left={false} />}

          {/* Hobby badge */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-sm font-bold text-gray-900">{card.hobby}</div>

          {/* Spots badge */}
          <div className="absolute top-4 right-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur ${spotsLeft <= 1 ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-900'}`}>
              <Icon name="Users" size={14} />
              {spotsLeft} из {card.spots_total}
            </div>
          </div>

          {/* Spots bar */}
          <div className="absolute top-[3.5rem] right-4 left-4 h-1 bg-white/30 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${spotsLeft <= 1 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${spotsPercent}%` }} />
          </div>

          <div className="absolute bottom-0 inset-x-0 p-5 text-white pointer-events-none">
            <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold mb-1 opacity-80">
                <Icon name="Megaphone" size={15} /> Предложение активности
              </div>
              <p className="font-display font-bold text-lg leading-snug">{card.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/90">
                <span className="flex items-center gap-1"><Icon name="Clock" size={14} />{formatDate(card.date)} · {card.time}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-white/90">
                <Icon name="MapPin" size={14} />{card.place}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {card.creator_avatar ? (
                <img src={card.creator_avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-white/20 flex items-center justify-center font-bold">{card.creator_name[0]}</div>
              )}
              <h2 className="font-display font-extrabold text-xl">{card.creator_name}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 py-4">
        <button onClick={() => doSwipe('left')} disabled={swiping}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-red-500 active:scale-90 transition-transform border border-gray-100 disabled:opacity-50">
          <Icon name="X" size={30} />
        </button>
        <div className="text-center">
          <div className="text-xs text-gray-400 font-medium">{cards.length - idx} в ленте</div>
        </div>
        <button onClick={() => doSwipe('right')} disabled={swiping}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-50">
          <Icon name="Check" size={30} />
        </button>
      </div>

      {match && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#7B2FF7]/95 to-[#FF5E62]/95 backdrop-blur flex flex-col items-center justify-center text-white z-20 animate-fade-in rounded-[2rem]">
          <div className="animate-pop text-center px-8">
            <div className="font-display font-black text-5xl mb-2">Мэтч! 🎉</div>
            <p className="text-white/90 text-lg mb-8">{match.creator_name} ждёт тебя</p>
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white mx-auto shadow-2xl bg-white/20 flex items-center justify-center">
              {match.creator_avatar
                ? <img src={match.creator_avatar} alt="" className="w-full h-full object-cover" />
                : <span className="text-5xl">{match.hobby.split(' ')[0]}</span>}
            </div>
            <p className="mt-6 text-white/80 text-sm">{match.hobby} · {formatDate(match.date)} · {match.time}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SwipeStamp({ text, color, rotate, left }: { text: string; color: string; rotate: number; left: boolean }) {
  return (
    <div className={`absolute top-12 ${left ? 'left-6' : 'right-6'} border-4 rounded-xl px-4 py-2 font-display font-black text-2xl z-10`}
      style={{ color, borderColor: color, transform: `rotate(${rotate}deg)` }}>
      {text}
    </div>
  );
}

// ─── CREATE SLOT ─────────────────────────────────────────────────────────────
function CreateSlot({ onCreated }: { onCreated: () => void }) {
  const [hobby, setHobby] = useState('🎾 Спорт');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [spots, setSpots] = useState(2);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      setUploading(true);
      try {
        const url = await uploadPhoto(dataUrl);
        setPhotoUrl(url);
      } catch {
        setPhotoPreview(null);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!desc || !date || !time || !place) return;
    setSaving(true);
    const res = await createActivity({ hobby, description: desc, date, time, place, spots, photoUrl });
    setSaving(false);
    if (res.ok) { setDone(true); setTimeout(() => { setDone(false); onCreated(); }, 1200); }
  };

  if (done) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 gap-4">
        <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pop">
          <Icon name="CheckCircle" size={40} className="text-white" />
        </div>
        <h2 className="font-display font-extrabold text-2xl">Слот создан!</h2>
        <p className="text-gray-500 text-sm">Другие пользователи увидят его в ленте</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-5 pt-6 pb-8">
      <h1 className="font-display font-extrabold text-2xl mb-1">Создать слот</h1>
      <p className="text-gray-500 text-sm mb-5">Опубликуй активность — её увидят другие</p>

      <Label>Тип хобби</Label>
      <div className="flex flex-wrap gap-2 mb-5">
        {HOBBY_LIST.map((h) => (
          <button key={h} onClick={() => setHobby(h)}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition-all ${hobby === h ? 'bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'}`}>
            {h}
          </button>
        ))}
      </div>

      <Label>Описание активности</Label>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
        placeholder="Напр: Ищу партнёра для игры в сквош, уровень новичок+"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-[#7B2FF7] text-sm resize-none h-20" />

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <Label>Дата</Label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-[#7B2FF7] text-sm text-gray-700" />
        </div>
        <div>
          <Label>Время</Label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-[#7B2FF7] text-sm text-gray-700" />
        </div>
      </div>

      <Label>Место</Label>
      <input value={place} onChange={(e) => setPlace(e.target.value)}
        placeholder="Адрес или название места"
        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-[#7B2FF7] text-sm" />

      <Label>Фото активности</Label>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        className={`relative mb-4 rounded-2xl overflow-hidden border-2 border-dashed transition-colors ${photoPreview ? 'border-[#7B2FF7]' : 'border-gray-200 bg-white'} ${uploading ? 'opacity-70' : 'cursor-pointer hover:border-[#7B2FF7]/60'}`}
      >
        {photoPreview ? (
          <>
            <img src={photoPreview} alt="" className="w-full h-36 object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white font-semibold text-sm">Изменить фото</span>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                <Icon name="LoaderCircle" size={22} className="animate-spin text-white" />
                <span className="text-white text-sm font-medium">Загружаем...</span>
              </div>
            )}
            {photoUrl && !uploading && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Icon name="Check" size={14} className="text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Icon name="ImagePlus" size={28} />
            <span className="text-sm">Нажми, чтобы добавить фото</span>
            <span className="text-xs text-gray-300">JPG, PNG до 5 МБ</span>
          </div>
        )}
      </div>

      <Label>Количество участников</Label>
      <div className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 mb-6">
        <button onClick={() => setSpots((s) => Math.max(1, s - 1))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-lg active:scale-90 transition-transform">−</button>
        <div className="flex-1 text-center">
          <span className="font-display font-bold text-2xl bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] bg-clip-text text-transparent">{spots}</span>
          <span className="text-gray-500 text-sm ml-2">{spots === 1 ? 'человек' : spots < 5 ? 'человека' : 'человек'}</span>
        </div>
        <button onClick={() => setSpots((s) => Math.min(10, s + 1))} className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7B2FF7] to-[#FF5E62] flex items-center justify-center font-bold text-white text-lg active:scale-90 transition-transform">+</button>
      </div>

      <button disabled={!desc || !date || !time || !place || saving || uploading} onClick={submit}
        className="w-full bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] text-white font-display font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50">
        {saving ? 'Публикуем...' : 'Опубликовать слот'}
      </button>
    </div>
  );
}

// ─── CHATS ──────────────────────────────────────────────────────────────────
function Chats() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center gap-4">
      <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#7B2FF7]/10 to-[#FF5E62]/10 flex items-center justify-center">
        <Icon name="MessageCircle" size={36} className="text-[#7B2FF7]" />
      </div>
      <h2 className="font-display font-extrabold text-xl">Чаты появятся после мэтча</h2>
      <p className="text-gray-400 text-sm">Свайпни активность вправо и договорись о встрече</p>
    </div>
  );
}

// ─── PROFILE ────────────────────────────────────────────────────────────────
function Profile({ user, onLogout }: { user: UserProfile | null; onLogout: () => void }) {
  const [myActivities, setMyActivities] = useState<MyActivity[]>([]);

  useEffect(() => { getMyActivities().then(setMyActivities); }, []);

  const age = user?.birthDate ? Math.floor((Date.now() - new Date(user.birthDate).getTime()) / 3.15576e10) : null;
  const hobbies = user?.hobbies?.length ? user.hobbies : [];
  const avatar = user?.avatar || null;

  return (
    <div className="h-full overflow-y-auto pb-24">
      <div className="h-44 bg-gradient-to-br from-[#7B2FF7] via-[#FF5E62] to-[#FF9966] relative">
        <button onClick={onLogout} className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white rounded-full p-2 active:scale-90 transition-transform">
          <Icon name="LogOut" size={18} />
        </button>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white">
            {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full bg-gradient-to-br from-[#7B2FF7] to-[#FF5E62] flex items-center justify-center text-white font-display font-black text-3xl">
                {user?.name?.[0] || '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-16 px-5 text-center">
        <h1 className="font-display font-extrabold text-2xl">{user?.name || 'Гость'}{age ? `, ${age}` : ''}</h1>
        <p className="text-gray-500 text-sm">{user?.email || ''}</p>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <Stat n={String(myActivities.length)} l="Слотов" />
          <Stat n={String(myActivities.filter((a) => !a.is_active).length)} l="Заполнено" />
          <Stat n={user ? user.rating.toFixed(1) : '5.0'} l="Рейтинг" />
        </div>

        {hobbies.length > 0 && (
          <div className="text-left mt-6">
            <Label>Мои хобби</Label>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((h) => (
                <span key={h} className="px-3.5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] text-white">{h}</span>
              ))}
            </div>
          </div>
        )}

        {myActivities.length > 0 && (
          <div className="text-left mt-6">
            <Label>Мои активности</Label>
            <div className="space-y-2">
              {myActivities.map((a) => {
                const joined = a.joined_count ?? 0;
                const left = a.spots_total - joined;
                return (
                  <div key={a.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-bold text-[#7B2FF7]">{a.hobby}</span>
                        <p className="text-sm text-gray-700 mt-0.5">{a.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(a.date)} · {a.time} · {a.place}</p>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ml-2 shrink-0 ${left === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <Icon name="Users" size={12} />
                        {joined}/{a.spots_total}
                      </div>
                    </div>
                    {!a.is_active && (
                      <div className="mt-2 text-xs text-red-500 font-semibold flex items-center gap-1">
                        <Icon name="XCircle" size={12} /> Все места заняты — слот закрыт
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NAV BAR ────────────────────────────────────────────────────────────────
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
        <button key={it.id} onClick={() => setTab(it.id)}
          className={`flex flex-col items-center gap-1 transition-colors ${tab === it.id ? 'text-[#7B2FF7]' : 'text-gray-400'}`}>
          <Icon name={it.icon} size={24} />
          <span className="text-[11px] font-semibold">{it.label}</span>
        </button>
      ))}
    </nav>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-display font-bold text-sm text-gray-800 mb-2">{children}</div>;
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-white rounded-2xl py-3 shadow-sm">
      <div className="font-display font-black text-xl bg-gradient-to-r from-[#7B2FF7] to-[#FF5E62] bg-clip-text text-transparent">{n}</div>
      <div className="text-xs text-gray-500">{l}</div>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Сегодня';
  if (d.toDateString() === tomorrow.toDateString()) return 'Завтра';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}