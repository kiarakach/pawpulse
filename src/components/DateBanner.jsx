import React, { useEffect, useMemo } from 'react';
import { CalendarDays, PartyPopper } from 'lucide-react';
import { celebrateBirthday } from '@/lib/confetti';

function isBirthdayToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export default function DateBanner({ pets = [] }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const celebrants = useMemo(
    () => (pets || []).filter((p) => isBirthdayToday(p.birthday)),
    [pets]
  );

  // Fire confetti once on entry when a pet has a birthday today.
  useEffect(() => {
    if (celebrants.length === 0) return;
    const firedKey = `pp-bday-${today.getMonth()}-${today.getDate()}`;
    if (sessionStorage.getItem(firedKey)) return;
    sessionStorage.setItem(firedKey, '1');
    celebrateBirthday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrants.length]);

  const celebrating = celebrants.length > 0;

  return (
    <div
      className={`clay-tight px-4 py-3 mb-4 flex items-center gap-3 ${
        celebrating ? 'pp-gradient text-white border-0' : ''
      } animate-float-up`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          celebrating ? 'bg-white/25' : 'clay-inset'
        }`}
      >
        {celebrating ? (
          <PartyPopper size={18} />
        ) : (
          <CalendarDays size={18} className="text-coral" />
        )}
      </div>
      <div className="min-w-0">
        <div className={`text-[10px] font-bold uppercase tracking-wide ${celebrating ? 'text-white/85' : 'text-muted-foreground'}`}>
          {dateLabel}
        </div>
        {celebrating ? (
          <div className="font-heading font-extrabold text-sm truncate">
            🎂 Happy Birthday, {celebrants.map((p) => p.name).join(' & ')}!
          </div>
        ) : (
          <div className="font-heading font-bold text-sm">Have a pawsome day! 🐾</div>
        )}
      </div>
    </div>
  );
}