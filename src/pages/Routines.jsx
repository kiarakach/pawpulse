import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import { CalendarCheck, Plus, Check, Loader2, Trash2, Clock, Bone, Footprints, Moon, Gamepad2 } from 'lucide-react';
import { trackAction } from '@/lib/streaks';

const typeMeta = {
  Feeding: { icon: Bone, bg: 'bg-sun' },
  Walk: { icon: Footprints, bg: 'bg-mint' },
  Sleep: { icon: Moon, bg: 'bg-grape' },
  Play: { icon: Gamepad2, bg: 'bg-sky' }
};

const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Routines() {
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'Feeding', label: '', time: '08:00', days: dayNames });

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Pet.list('-created_date', 50);
        setPets(list);
        if (list.length) setActivePet(list[0]);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  const loadRoutines = async () => {
    if (!activePet) return;
    try {
      const r = await base44.entities.Routine.filter({ pet_id: activePet.id }, 'time', 50);
      setRoutines(r);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadRoutines(); }, [activePet]);

  const toggleDay = (d) => setForm((f) => ({
    ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d]
  }));

  const addRoutine = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.Routine.create({
        pet_id: activePet.id, pet_name: activePet.name,
        type: form.type, label: form.label.trim(),
        time: form.time, days: form.days, done_today: false
      });
      setRoutines((p) => [...p, created].sort((a, b) => (a.time || '').localeCompare(b.time || '')));
      setForm({ type: 'Feeding', label: '', time: '08:00', days: dayNames });
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleDone = async (r) => {
    const updated = await base44.entities.Routine.update(r.id, { done_today: !r.done_today });
    setRoutines((p) => p.map((x) => (x.id === r.id ? updated : x)));
    if (!r.done_today && r.type === 'Walk') trackAction('walk', r.pet_name);
  };

  const remove = async (id) => {
    await base44.entities.Routine.delete(id);
    setRoutines((p) => p.filter((x) => x.id !== id));
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground font-semibold">Loading…</div>;

  if (pets.length === 0) {
    return (
      <div className="animate-float-up">
        <BrandHeader title="Daily Routines" subtitle="Feeding, walks, sleep & play" />
        <div className="clay p-8 text-center">
          <CalendarCheck size={40} className="text-mint mx-auto mb-3" />
          <div className="font-heading font-extrabold text-lg">Add a pet first!</div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">Create a pet profile on the Home tab to start building routines.</p>
        </div>
      </div>
    );
  }

  const doneCount = routines.filter((r) => r.done_today).length;

  return (
    <div className="animate-float-up">
      <BrandHeader title="Daily Routines" subtitle="Feeding, walks, sleep & play" />

      <div className="clay p-4 mb-4 bg-gradient-to-br from-mint/15 to-cream border-l-4 border-mint">
        <p className="text-sm font-extrabold leading-snug">
          This is your AI Pet Care Module — Add your Pet's core daily reminders here (feed, walk, meds) &amp; this app will automatically remind you and take it from here.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-hide">
        {pets.map((p) => (
          <button key={p.id} onClick={() => setActivePet(p)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-heading font-bold whitespace-nowrap transition-all ${activePet?.id === p.id ? 'bg-mint text-white scale-105 shadow-lg' : 'clay-inset'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* progress */}
      {routines.length > 0 && (
        <div className="clay p-4 mb-4 bg-gradient-to-br from-mint/15 to-cream">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-sm">Today's Progress</span>
            <span className="text-xs font-heading font-bold text-mint">{doneCount}/{routines.length} done</span>
          </div>
          <div className="clay-inset h-3 rounded-full overflow-hidden">
            <div className="h-full bg-mint rounded-full transition-all duration-500" style={{ width: `${routines.length ? (doneCount / routines.length) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <button onClick={() => setShowForm((s) => !s)} className="clay-btn pp-gradient text-white w-full py-3 mb-3 font-heading font-bold flex items-center justify-center gap-2">
        <Plus size={18} strokeWidth={3} /> Add Routine
      </button>

      {showForm && (
        <div className="clay p-4 mb-3 space-y-3 animate-pop-in">
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(typeMeta).map((t) => {
              const M = typeMeta[t];
              return (
                <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                  className={`py-3 rounded-2xl flex flex-col items-center gap-1 transition-all ${form.type === t ? `${M.bg} text-white scale-105` : 'clay-inset'}`}>
                  <M.icon size={18} />
                  <span className="text-[10px] font-heading font-bold">{t}</span>
                </button>
              );
            })}
          </div>
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Label (e.g. Breakfast kibble)" className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-mint" />
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Time</label>
            <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="clay-inset px-4 py-2.5 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-mint" />
          </div>
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Days</div>
            <div className="flex gap-1.5">
              {dayNames.map((d) => (
                <button key={d} onClick={() => toggleDay(d)}
                  className={`w-9 h-9 rounded-xl text-[11px] font-heading font-bold transition-all ${form.days.includes(d) ? 'bg-mint text-white' : 'clay-inset text-muted-foreground'}`}>
                  {d[0]}
                </button>
              ))}
            </div>
          </div>
          <button onClick={addRoutine} disabled={saving} className="clay-btn bg-mint text-white w-full py-3 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Save Routine
          </button>
        </div>
      )}

      {routines.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-semibold text-sm">No routines yet. Add your first one! 🐾</div>
      ) : (
        <div className="space-y-2.5">
          {routines.map((r) => {
            const M = typeMeta[r.type] || typeMeta.Feeding;
            return (
              <div key={r.id} className={`clay-tight p-3.5 flex items-center gap-3 ${r.done_today ? 'opacity-65' : ''}`}>
                <button onClick={() => toggleDone(r)} className={`w-10 h-10 rounded-2xl ${r.done_today ? 'bg-mint text-white' : M.bg + ' text-white'} flex items-center justify-center shrink-0`}>
                  {r.done_today ? <Check size={20} strokeWidth={3} /> : <M.icon size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-heading font-bold text-sm ${r.done_today ? 'line-through' : ''}`}>{r.label}</div>
                  <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                    <Clock size={11} /> {r.time || '—'} · {r.type}
                  </div>
                  {r.days?.length === 7 ? (
                    <span className="text-[10px] text-muted-foreground font-bold">Every day</span>
                  ) : r.days?.length > 0 ? (
                    <span className="text-[10px] text-muted-foreground font-bold">{r.days.join(', ')}</span>
                  ) : null}
                </div>
                <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-destructive">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}