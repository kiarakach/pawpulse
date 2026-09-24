import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Flower2, Bell, Utensils, Lightbulb, PawPrint, ChevronsUpDown } from 'lucide-react';
import { getPosition, reverseGeocode } from '@/lib/geo';

const todayKey = () => new Date().toISOString().slice(0, 10);

const FALLBACK = {
  allergy: 'Wipe paws after walks to keep seasonal pollen at bay 🌾',
  diet: 'Fresh water bowl refilled today keeps tails wagging 💧',
  tip: 'Cats sleep 12–16 hours a day — it keeps their energy systems sharp! 😴'
};

const TILES = [
  { key: 'allergy', icon: Flower2, tile: 'bg-gradient-to-br from-coral/30 to-coral/10 border-coral', iconBg: 'text-coral', anim: 'pp-shake' },
  { key: 'reminder', icon: Bell, tile: 'bg-gradient-to-br from-yellow/35 to-sun/10 border-yellow', iconBg: 'text-yellow', anim: 'pp-tada' },
  { key: 'diet', icon: Utensils, tile: 'bg-gradient-to-br from-sky/30 to-sky/10 border-sky', iconBg: 'text-sky', anim: 'pp-jump' },
  { key: 'tip', icon: Lightbulb, tile: 'bg-gradient-to-br from-mint/35 to-mint/10 border-mint', iconBg: 'text-mint', anim: 'pp-pulse' }
];

function Tile({ icon: Icon, tile, iconBg, text, loading, anim }) {
  return (
    <div className={`rounded-2xl border-t-4 ${tile} p-2.5 min-h-[5rem] flex flex-col gap-1.5`}>
      <span className={`inline-flex justify-center rounded-full ${anim}`}>
        <Icon size={24} strokeWidth={2.4} className={iconBg} />
      </span>
      {loading ? (
        <>
          <div className="h-2 rounded-full bg-white/15 animate-pulse w-full" />
          <div className="h-2 rounded-full bg-white/15 animate-pulse w-2/3" />
        </>
      ) : (
        <span className="text-[11px] font-semibold leading-snug text-white/85">{text}</span>
      )}
    </div>
  );
}

async function fetchLiveContent(pet) {
  const cacheKey = `pp_today_v1_${pet.id}`;
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    if (cached && cached.date === todayKey()) return cached;
  } catch { /* ignore bad cache */ }

  let location = null;
  try {
    const pos = await getPosition();
    location = await reverseGeocode(pos.lat, pos.lng);
  } catch { /* location denied — generic seasonal advice */ }

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Today is ${todayKey()}. A pet owner needs a daily snapshot for their pet ${pet.name} (${pet.species}, breed: ${pet.breed || 'unknown'}, age: ${pet.age || 'unknown'}). Location: ${location || 'unknown — give general advice for this time of year in the northern hemisphere'}.
Return exactly three short lines:
1. "allergy": one sentence on today's realistic seasonal allergy/environment risk for this pet at this location and time of year, with one quick action the owner can take.
2. "diet": one short diet/hydration recommendation line for this species and breed today.
3. "tip": one surprising, delightful "did you know?" fact specific to this species or breed, phrased personally about ${pet.name}.
Each line under 18 words, warm and playful, no emojis.`,
    add_context_from_internet: true,
    response_json_schema: {
      type: 'object',
      properties: {
        allergy: { type: 'string' },
        diet: { type: 'string' },
        tip: { type: 'string' }
      },
      required: ['allergy', 'diet', 'tip']
    }
  });

  const content = { date: todayKey(), allergy: res.allergy, diet: res.diet, tip: res.tip };
  try { localStorage.setItem(cacheKey, JSON.stringify(content)); } catch { /* storage full */ }
  return content;
}

export default function TodayCard({ pets }) {
  const [petIndex, setPetIndex] = useState(0);
  const [content, setContent] = useState(null);
  const [reminder, setReminder] = useState(null);
  const [loading, setLoading] = useState(true);

  const pet = pets[petIndex];
  const nextPet = pets[(petIndex + 1) % pets.length];

  useEffect(() => {
    if (!pet) return;
    let alive = true;
    setLoading(true);
    setContent(null);
    setReminder(null);

    (async () => {
      try {
        const list = await base44.entities.Reminder.filter({ pet_id: pet.id, completed: false }, 'due_date', 5);
        if (alive) setReminder(list[0] || null);
      } catch (err) { console.error(err); }
      try {
        const c = await fetchLiveContent(pet);
        if (alive) setContent(c);
      } catch (err) {
        console.error(err);
        if (alive) setContent(FALLBACK);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [pet?.id]);

  if (!pet) return null;

  const tileText = {
    allergy: content?.allergy,
    reminder: reminder
      ? `${reminder.title} — due ${reminder.due_date}`
      : loading ? null : 'All caught up — no reminders! 🎉',
    diet: content?.diet,
    tip: content?.tip
  };

  return (
    <div className="p-4 mb-5 rounded-[1.75rem] animate-float-up backdrop-blur-xl border border-white/10 bg-gradient-to-br from-foreground via-black to-foreground shadow-[0_8px_0_-2px_hsl(var(--foreground)/0.04),0_16px_30px_-10px_hsl(250_30%_20%/0.35)]">
      <h3 className="font-heading font-extrabold text-lg text-center mb-3 text-white">
        Today's Alert Dashboard for <span className="text-coral">{pet.name}</span>
      </h3>

      <div className="flex gap-3">
        {/* Pet photo + switcher */}
        <div className="flex flex-col items-center gap-2 shrink-0 w-[4.6rem]">
          <div className="w-[4.6rem] h-[4.6rem] rounded-full overflow-hidden clay-inset bg-card">
            {pet.photo_url ? (
              <Image src={pet.photo_url} className="w-full h-full" fittingType="fill" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-coral/60">
                <PawPrint size={26} />
              </div>
            )}
          </div>
          {pets.length > 1 && (
            <button
              onClick={() => setPetIndex((i) => (i + 1) % pets.length)}
              className="clay-inset px-2 py-1.5 rounded-full text-[10px] font-heading font-bold text-foreground/70 flex items-center gap-1 whitespace-nowrap"
            >
              <ChevronsUpDown size={11} /> {nextPet?.name}
            </button>
          )}
        </div>

        {/* Live tiles */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          {TILES.map(({ key, icon, tile, iconBg, anim }) => (
            <Tile key={key} icon={icon} tile={tile} iconBg={iconBg} anim={anim} text={tileText[key]} loading={loading && !tileText[key]} />
          ))}
        </div>
      </div>
    </div>
  );
}