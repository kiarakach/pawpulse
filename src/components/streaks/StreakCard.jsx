import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Lock, Camera } from 'lucide-react';
import { getStreakSummary, STREAK_GOAL, ACTION_META, BADGES } from '@/lib/streaks';
import StatCardModal from './StatCardModal';

export default function StreakCard({ pets }) {
  const [summary, setSummary] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);

  const load = async () => {
    try { setSummary(await getStreakSummary()); } catch (err) { console.error(err); }
  };

  useEffect(() => { load(); }, []);

  if (!summary) return null;

  const weekCount = Math.min(summary.weekCount, STREAK_GOAL);
  const latest = summary.badges[summary.badges.length - 1];
  const nextBadge = BADGES[summary.badges.length % BADGES.length];
  const newUnlock = latest && !latest.stat_card_url;

  return (
    <div className="clay p-5 mb-5 bg-gradient-to-br from-sun/15 via-cream to-coral/15">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-11 h-11 rounded-2xl pp-gradient text-white flex items-center justify-center clay-btn shrink-0">
            <Flame size={22} className="pp-glow" />
          </span>
          <div>
            <h3 className="font-heading font-extrabold text-base leading-none">My Reward Center (unlock Social memories)</h3>
            <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
              {summary.streaks} {summary.streaks === 1 ? 'streak' : 'streaks'} completed 🔥
            </p>
          </div>
        </div>
        {summary.streaks > 0 && (
          <button onClick={() => setCardOpen(true)}
            className="clay-btn bg-coral text-white px-3.5 py-2 text-xs font-heading font-bold flex items-center gap-1.5">
            <Trophy size={13} /> Stat Card
          </button>
        )}
      </div>

      {/* Fun explainer + flying pet */}
      <div className="clay-inset p-3.5 mb-3.5">
        <p className="text-[11px] font-semibold text-muted-foreground leading-snug">
          <span className="font-heading font-extrabold text-foreground">What's a Care Streak? 🐾</span>{' '}
          Every little act of love — a meal log, walkie, vaccine or vet check-in — feeds your streak flame.
          Hit {STREAK_GOAL} actions in a week to unlock a shiny badge!
        </p>
        <p className="text-[11px] font-semibold text-muted-foreground leading-snug mt-1.5">
          <span className="font-heading font-extrabold text-foreground">Why it's pawsitively worth it 🎁</span>{' '}
          Each badge lets you design an Instagram-ready Story Card & Pet Flash Card of your bestie —
          made to be shared with the world! 📸
        </p>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-heading font-bold">This week</span>
        <span className="text-xs font-heading font-extrabold text-coral">{weekCount}/{STREAK_GOAL} actions</span>
      </div>
      <div className="clay-inset h-3 rounded-full overflow-hidden mb-3">
        <div className="h-full pp-gradient rounded-full transition-all duration-500"
          style={{ width: `${(weekCount / STREAK_GOAL) * 100}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.entries(ACTION_META).map(([key, meta]) => {
          const done = summary.doneTypes.has(key);
          return (
            <span key={key}
              className={`px-2.5 py-1 rounded-full text-[10px] font-heading font-bold flex items-center gap-1 ${
                done ? 'bg-mint text-accent-foreground' : 'clay-inset text-muted-foreground'
              }`}>
              {meta.emoji} {done ? '✓ ' : ''}{meta.label}
            </span>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {summary.badges.map((b) => (
          <span key={b.id} title={b.badge_name}
            className="w-9 h-9 rounded-2xl bg-sun/25 border border-sun/50 flex items-center justify-center text-lg animate-pop-in">
            {b.badge_emoji}
          </span>
        ))}
        <span title={`${nextBadge.name} — next badge`} className="w-9 h-9 rounded-2xl clay-inset flex items-center justify-center text-muted-foreground/60">
          <Lock size={13} />
        </span>
      </div>

      {newUnlock && (
        <button onClick={() => setCardOpen(true)}
          className="clay-btn bg-sun text-foreground w-full mt-3 py-3 font-heading font-bold flex items-center justify-center gap-2 animate-pop-in">
          <Camera size={16} /> Streak complete! Design your shareable stat card 🎉
        </button>
      )}

      <div className="relative h-7 overflow-hidden mt-2" aria-hidden="true">
        <span className="absolute top-0 text-xl pp-fly select-none">🐶✨</span>
      </div>

      <StatCardModal open={cardOpen} onClose={() => { setCardOpen(false); load(); }}
        pets={pets} badges={summary.badges} weekActions={summary.weekActions} />
    </div>
  );
}