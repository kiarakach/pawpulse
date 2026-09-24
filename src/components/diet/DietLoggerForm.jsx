import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Droplets, Soup, Cookie, Zap, CalendarDays, Check } from 'lucide-react';
import { trackAction } from '@/lib/streaks';

const todayStr = () => new Date().toISOString().slice(0, 10);

const NumField = ({ label, icon: Icon, value, onChange, placeholder }) => (
  <label className="block">
    <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
      <Icon size={11} /> {label}
    </span>
    <input
      type="number" min="0" step="any" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="clay-inset w-full px-3.5 py-2.5 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-grape bg-card"
    />
  </label>
);

const ACTIVITIES = [
  { key: 'low', label: 'Low', emoji: '🛋️' },
  { key: 'medium', label: 'Medium', emoji: '🚶' },
  { key: 'high', label: 'High', emoji: '🏃' }
];

export default function DietLoggerForm({ pet, onSaved }) {
  const [form, setForm] = useState({
    date: todayStr(), water_oz: '', meal1_cups: '', meal2_cups: '', meal3_cups: '', treats_count: '', activity: 'medium'
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date) { setError('Pick a date first.'); return; }
    setSaving(true);
    setError('');
    try {
      await base44.entities.DietLog.create({
        pet_id: pet.id,
        pet_name: pet.name,
        date: form.date,
        water_oz: parseFloat(form.water_oz) || 0,
        meal1_cups: parseFloat(form.meal1_cups) || 0,
        meal2_cups: parseFloat(form.meal2_cups) || 0,
        meal3_cups: parseFloat(form.meal3_cups) || 0,
        treats_count: parseFloat(form.treats_count) || 0,
        activity: form.activity
      });
      setSaved(true);
      trackAction('meal_log', pet.name);
      setForm(f => ({ ...f, water_oz: '', meal1_cups: '', meal2_cups: '', meal3_cups: '', treats_count: '' }));
      if (onSaved) await onSaved();
    } catch (err) {
      console.error(err);
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="clay p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-10 h-10 rounded-2xl bg-sky/20 text-sky flex items-center justify-center clay-btn shrink-0">
          <Plus size={18} />
        </span>
        <div>
          <h2 className="font-heading font-extrabold text-base leading-none">Daily Diet Logger</h2>
          <p className="text-[11px] text-muted-foreground font-semibold mt-1">Log {pet.name}'s meals, water, treats & activity</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-3.5">
        <NumField label="Date" icon={CalendarDays} value={form.date}
          onChange={(v) => set('date', v)} placeholder="mm/dd/yyyy" />

        <NumField label="Water (oz)" icon={Droplets} value={form.water_oz}
          onChange={(v) => set('water_oz', v)} placeholder="e.g. 12" />

        <div className="grid grid-cols-3 gap-2.5">
          <NumField label="Dry food · Meal 1 (cups)" icon={Soup} value={form.meal1_cups}
            onChange={(v) => set('meal1_cups', v)} placeholder="0.5" />
          <NumField label="Meal 2 (cups)" icon={Soup} value={form.meal2_cups}
            onChange={(v) => set('meal2_cups', v)} placeholder="0.5" />
          <NumField label="Meal 3 (cups)" icon={Soup} value={form.meal3_cups}
            onChange={(v) => set('meal3_cups', v)} placeholder="0" />
        </div>

        <NumField label="Treats (N)" icon={Cookie} value={form.treats_count}
          onChange={(v) => set('treats_count', v)} placeholder="e.g. 3" />

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
            <Zap size={11} /> Activity for the day
          </span>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITIES.map((a) => (
              <button type="button" key={a.key} onClick={() => set('activity', a.key)}
                className={`clay-tight py-2.5 flex items-center justify-center gap-1.5 font-heading font-bold text-sm transition-all ${
                  form.activity === a.key ? 'bg-mint text-foreground scale-105' : 'text-muted-foreground'
                }`}>
                <span className="text-base leading-none">{a.emoji}</span> {a.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-destructive font-semibold">{error}</p>}

        <button type="submit" disabled={saving}
          className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <Check size={18} /> : <Plus size={18} />}
          {saving ? 'Saving…' : saved ? 'Saved! Log another day' : 'Save Daily Intake'}
        </button>
      </form>
    </div>
  );
}