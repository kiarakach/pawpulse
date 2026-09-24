import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Stethoscope, Pill, Syringe, HeartPulse, Check, Loader2, Trash2, Calendar, Bell } from 'lucide-react';

const reminderTypeMeta = {
  Checkup: { icon: Stethoscope, bg: 'bg-grape' },
  Medication: { icon: Pill, bg: 'bg-coral' },
  Vaccination: { icon: Syringe, bg: 'bg-sky' },
  Grooming: { icon: HeartPulse, bg: 'bg-mint' }
};

export default function RemindersTab({ pet }) {
  const [reminders, setReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState({ type: 'Checkup', title: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setReminders([]);
    (async () => {
      try {
        const r = await base44.entities.Reminder.filter({ pet_id: pet.id }, 'due_date', 50);
        setReminders(r);
      } catch (err) { console.error(err); }
    })();
  }, [pet.id]);

  const addReminder = async () => {
    if (!reminderForm.title.trim() || !reminderForm.due_date) return;
    setSaving(true);
    try {
      const created = await base44.entities.Reminder.create({
        pet_id: pet.id, pet_name: pet.name,
        title: reminderForm.title.trim(), type: reminderForm.type,
        due_date: reminderForm.due_date
      });
      setReminders((p) => [...p, created].sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')));
      setReminderForm({ type: 'Checkup', title: '', due_date: '' });
      // Phone push notification (works on iPhone and Android)
      try {
        await base44.functions.invoke('sendReminderPush', {
          title: `🔔 Reminder for ${pet.name}`,
          content: `${created.title} — due ${created.due_date}.`
        });
      } catch (pushErr) {
        console.error(pushErr);
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleReminder = async (r) => {
    const updated = await base44.entities.Reminder.update(r.id, { completed: !r.completed });
    setReminders((p) => p.map((x) => (x.id === r.id ? updated : x)));
  };

  const deleteReminder = async (id) => {
    await base44.entities.Reminder.delete(id);
    setReminders((p) => p.filter((x) => x.id !== id));
  };

  return (
    <>
      <div className="clay p-4 mb-3 space-y-3">
        <div className="flex items-center gap-2 text-sm font-heading font-bold">
          <Bell size={16} className="text-grape" /> New Reminder
        </div>
        <div className="flex gap-2 flex-wrap">
          {Object.keys(reminderTypeMeta).map((t) => (
            <button key={t} onClick={() => setReminderForm((f) => ({ ...f, type: t }))}
              className={`px-3 py-2 rounded-2xl text-xs font-heading font-bold transition-all ${reminderForm.type === t ? 'bg-grape text-white' : 'clay-inset'}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={reminderForm.title} onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="What to remember?" className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-grape" />
        <input type="date" value={reminderForm.due_date} onChange={(e) => setReminderForm((f) => ({ ...f, due_date: e.target.value }))}
          className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-grape" />
        <button onClick={addReminder} disabled={saving} className="clay-btn bg-grape text-white w-full py-3 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} strokeWidth={3} />} Add Reminder
        </button>
      </div>

      {reminders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground font-semibold text-sm">No reminders set. You're all caught up! 🎉</div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((r) => {
            const M = reminderTypeMeta[r.type] || reminderTypeMeta.Checkup;
            return (
              <div key={r.id} className={`clay-tight p-3.5 flex items-center gap-3 ${r.completed ? 'opacity-60' : ''}`}>
                <button onClick={() => toggleReminder(r)} className={`w-9 h-9 rounded-2xl ${r.completed ? 'bg-mint text-white' : 'clay-inset text-muted-foreground'} flex items-center justify-center shrink-0`}>
                  <Check size={18} strokeWidth={3} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-heading font-bold text-sm ${r.completed ? 'line-through' : ''}`}>{r.title}</div>
                  <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                    <Calendar size={11} /> {r.due_date} · {r.type}
                  </div>
                </div>
                <span className={`w-2.5 h-2.5 rounded-full ${M.bg} shrink-0`} />
                <button onClick={() => deleteReminder(r.id)} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-destructive">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}