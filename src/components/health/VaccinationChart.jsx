import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Syringe, Check, Loader2, Bell, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import { trackAction } from '@/lib/streaks';

const STAGE_COLORS = ['bg-grape', 'bg-sky', 'bg-sun', 'bg-mint', 'bg-orange'];
const STAGE_EMOJI = { Baby: '🍼', Young: '🎾', Adult: '🐾', Senior: '😴' };

async function generateChart(pet) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Build a complete life-long vaccination chart for a pet, from birth to senior years.
Pet: name=${pet.name}, species=${pet.species}, breed=${pet.breed || 'unknown'}, age=${pet.age || 'unknown'}.
Include the full baby (puppy/kitten) core vaccine series with typical exact ages (e.g. "6–8 weeks"), the first-year boosters, and all recurring adult and senior boosters with their frequency in due_age (e.g. "Every 1 year", "Every 3 years"). Also include the most recommended non-core / lifestyle vaccines for this species and breed (e.g. Bordetella, Leptospirosis, Lyme for dogs; FeLV for cats).
Set life_stage to exactly one of: Baby (birth to ~16 weeks), Young (~4 months to 1 year), Adult (1–7 years), Senior (7+ years). Order the list from birth to senior, and put recurring boosters in the Adult or Senior stage. Keep each "why" under 18 words.`,
    response_json_schema: {
      type: 'object',
      properties: {
        vaccines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vaccine_name: { type: 'string' },
              life_stage: { type: 'string', enum: ['Baby', 'Young', 'Adult', 'Senior'] },
              due_age: { type: 'string' },
              why: { type: 'string' }
            },
            required: ['vaccine_name', 'life_stage', 'due_age']
          }
        }
      }
    }
  });
  return (res?.vaccines || []).map((v) => ({
    pet_id: pet.id,
    pet_name: pet.name,
    vaccine_name: v.vaccine_name,
    life_stage: v.life_stage,
    due_age: v.due_age,
    why: v.why || '',
    done: false
  }));
}

export default function VaccinationChart({ pet }) {
  const [records, setRecords] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [planFor, setPlanFor] = useState(null);
  const [planDate, setPlanDate] = useState('');
  const [reminded, setReminded] = useState({});

  const load = async (regen = false) => {
    setBusy(true);
    setError('');
    setPlanFor(null);
    setReminded({});
    try {
      if (regen) await base44.entities.Vaccination.deleteMany({ pet_id: pet.id });
      let list = await base44.entities.Vaccination.filter({ pet_id: pet.id }, 'created_date', 100);
      if (list.length === 0) {
        const items = await generateChart(pet);
        if (!items.length) throw new Error('empty chart');
        list = await base44.entities.Vaccination.bulkCreate(items);
      }
      setRecords(list);
    } catch (err) {
      console.error(err);
      setError('PawPulse AI could not build the chart just now. Tap retry.');
      setRecords([]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    setRecords(null);
    setBusy(true);
    load();
  }, [pet.id]);

  const toggle = async (r) => {
    const done = !r.done;
    setRecords((p) => p.map((x) => (x.id === r.id ? { ...x, done } : x)));
    try {
      await base44.entities.Vaccination.update(r.id, { done });
      if (done) trackAction('vaccination', pet.name);
    } catch (err) {
      console.error(err);
      setRecords((p) => p.map((x) => (x.id === r.id ? { ...x, done: !done } : x)));
    }
  };

  const savePlan = async (r) => {
    if (!planDate) return;
    try {
      const updated = await base44.entities.Vaccination.update(r.id, { planned_date: planDate });
      await base44.entities.Reminder.create({
        pet_id: pet.id,
        pet_name: pet.name,
        title: `${r.vaccine_name} (${r.due_age})`,
        type: 'Vaccination',
        due_date: planDate
      });
      setRecords((p) => p.map((x) => (x.id === r.id ? updated : x)));
      setReminded((m) => ({ ...m, [r.id]: true }));
      // Phone push notification (works on iPhone and Android)
      try {
        await base44.functions.invoke('sendReminderPush', {
          title: `💉 ${pet.name}'s vaccine reminder`,
          content: `${r.vaccine_name} (${r.due_age}) is planned for ${planDate}.`
        });
      } catch (pushErr) {
        console.error(pushErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPlanFor(null);
      setPlanDate('');
    }
  };

  if (busy) {
    return (
      <div className="clay p-8 text-center animate-pop-in">
        <Loader2 size={28} className="animate-spin text-grape mx-auto mb-3" />
        <div className="font-heading font-extrabold text-sm">Building {pet.name}'s full-life vaccine chart…</div>
        <p className="text-xs text-muted-foreground font-semibold mt-1">PawPulse AI is drawing up every shot from birth to senior years ✨</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clay p-6 text-center">
        <TriangleAlert className="mx-auto text-coral mb-2" size={24} />
        <p className="text-sm font-semibold mb-3">{error}</p>
        <button onClick={() => load()} className="clay-btn bg-grape text-white px-5 py-2.5 font-heading font-bold text-sm">Retry</button>
      </div>
    );
  }

  const stages = [];
  (records || []).forEach((r) => {
    let s = stages.find((x) => x.name === r.life_stage);
    if (!s) {
      s = { name: r.life_stage, items: [] };
      stages.push(s);
    }
    s.items.push(r);
  });

  const doneCount = (records || []).filter((r) => r.done).length;
  const total = (records || []).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div>
      {/* Header + progress */}
      <div className="clay p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-grape" />
            <h3 className="font-heading font-extrabold text-base">Life Vaccination Chart</h3>
          </div>
          <button onClick={() => load(true)} title="Rebuild chart with AI" className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-muted-foreground hover:text-foreground">
            <RefreshCw size={14} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-semibold mb-3">
          AI-built plan for {pet.name} — check off shots already given, and set a reminder for the rest.
        </p>
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-3.5 rounded-full clay-inset overflow-hidden">
            <div className="h-full rounded-full bg-mint transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-heading font-extrabold text-muted-foreground whitespace-nowrap">{doneCount}/{total} done</span>
        </div>
      </div>

      {stages.map((stage, si) => (
        <div key={stage.name} className="mb-4">
          <div className="flex items-center gap-2 mb-2.5 px-1">
            <span className={`w-7 h-7 rounded-xl ${STAGE_COLORS[si % STAGE_COLORS.length]} text-white flex items-center justify-center text-sm`}>
              {STAGE_EMOJI[stage.name] || '🐾'}
            </span>
            <h4 className="font-heading font-extrabold text-sm">{stage.name}</h4>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{stage.items.length} vaccines</span>
          </div>
          <div className="space-y-2.5">
            {stage.items.map((r) => (
              <div key={r.id} className={`clay-tight p-3.5 flex items-start gap-3 transition-all ${r.done ? 'opacity-75' : ''}`}>
                <button onClick={() => toggle(r)}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all ${r.done ? 'bg-mint text-white scale-105' : 'clay-inset text-muted-foreground'}`}>
                  <Check size={18} strokeWidth={3} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-heading font-bold text-sm ${r.done ? 'line-through' : ''}`}>{r.vaccine_name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky/15 text-sky text-[10px] font-extrabold font-heading whitespace-nowrap">
                      {r.due_age}
                    </span>
                  </div>
                  {r.why && <p className="text-xs text-muted-foreground font-semibold mt-1">{r.why}</p>}

                  {!r.done && r.planned_date && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint/15 text-xs font-bold text-accent-foreground">
                      <Bell size={12} className="text-mint" /> Planned for {r.planned_date}{reminded[r.id] ? ' · Reminder set ✓' : ''}
                    </div>
                  )}

                  {!r.done && planFor === r.id && (
                    <div className="flex gap-2 mt-2 animate-pop-in">
                      <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
                        className="clay-inset flex-1 min-w-0 px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:ring-2 ring-grape" />
                      <button onClick={() => savePlan(r)} disabled={!planDate}
                        className="clay-btn bg-grape text-white px-3 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1 disabled:opacity-50">
                        <Bell size={12} /> Set reminder
                      </button>
                    </div>
                  )}

                  {!r.done && planFor !== r.id && (
                    <button onClick={() => { setPlanFor(r.id); setPlanDate(r.planned_date || ''); }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-heading font-bold text-grape">
                      <Bell size={12} /> {r.planned_date ? 'Change plan' : 'Plan date & remind me'}
                    </button>
                  )}
                </div>
                <Syringe size={15} className="text-muted-foreground/40 shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-[10px] text-muted-foreground font-semibold mt-4 px-4">
        AI-generated general guidance — always confirm with your vet. 🩺
      </p>
    </div>
  );
}