import { base44 } from '@/api/base44Client';

export const STREAK_GOAL = 7;

export const ACTION_META = {
  app_open: { label: 'Open the app', emoji: '📱' },
  meal_log: { label: 'Log a meal', emoji: '🍽️' },
  walk: { label: 'Complete a walk', emoji: '🚶' },
  vaccination: { label: 'Update a vaccination', emoji: '💉' },
  ai_doctor: { label: 'Ask AI Doctor', emoji: '✨' }
};

export const BADGES = [
  { name: 'Paw Rookie', emoji: '🐾' },
  { name: 'Care Champ', emoji: '🔥' },
  { name: 'Routine Star', emoji: '⭐' },
  { name: 'Wellness Warrior', emoji: '💪' },
  { name: 'Streak Legend', emoji: '🏆' },
  { name: 'Care Royalty', emoji: '👑' }
];

export const toLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Monday-based week start as YYYY-MM-DD
export const getWeekStartStr = (d = new Date()) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return toLocalDateStr(date);
};

export async function getStreakSummary() {
  const [actions, badges] = await Promise.all([
    base44.entities.StreakAction.list('-created_date', 500),
    base44.entities.StreakBadge.list('-created_date', 50)
  ]);
  const weekStart = getWeekStartStr();
  const weekActions = actions.filter((a) => a.date >= weekStart);
  return {
    weekCount: weekActions.length,
    weekActions,
    streaks: badges.length,
    badges: [...badges].sort((a, b) => (a.streak_number || 0) - (b.streak_number || 0)),
    doneTypes: new Set(weekActions.map((a) => a.action_type))
  };
}

// Records one atomic streak action. When it is the 7th action of the week,
// unlocks the next streak badge (max one unlock per week). Returns the updated
// weekly count and the freshly unlocked badge (or null).
export async function trackAction(action_type, pet_name) {
  try {
    const today = toLocalDateStr();
    const existing = await base44.entities.StreakAction.list('-created_date', 500);
    if (action_type === 'app_open' && existing.some((a) => a.action_type === 'app_open' && a.date === today)) {
      return null;
    }
    await base44.entities.StreakAction.create({ action_type, date: today, pet_name: pet_name || '' });

    const weekStart = getWeekStartStr();
    const weekCount = existing.filter((a) => a.date >= weekStart).length + 1;

    let newBadge = null;
    if (weekCount >= STREAK_GOAL) {
      const badges = await base44.entities.StreakBadge.list('-created_date', 50);
      const unlockedThisWeek = badges.some((b) => b.earned_date >= weekStart);
      if (!unlockedThisWeek) {
        const streakNumber = badges.length + 1;
        const def = BADGES[(streakNumber - 1) % BADGES.length];
        newBadge = await base44.entities.StreakBadge.create({
          streak_number: streakNumber,
          badge_name: def.name,
          badge_emoji: def.emoji,
          earned_date: today
        });
      }
    }
    return { weekCount, newBadge };
  } catch (err) {
    console.error(err);
    return null;
  }
}