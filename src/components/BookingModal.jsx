import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, CheckCircle2, PawPrint, Calendar, Clock, Dog, Cat } from 'lucide-react';

const DURATIONS = ['30 min', '1 hour', '2 hours', 'Half day', 'Full day'];

export default function BookingModal({ service, onClose, onBooked }) {
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [petName, setPetName] = useState('');
  const [customPet, setCustomPet] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('1 hour');
  const [notes, setNotes] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Pet.list('-created_date', 50);
        setPets(list);
        if (list[0]) setPetName(list[0].name);
        const me = await base44.auth.me();
        setContactName(me?.display_name || '');
        setContactPhone(me?.contact_phone || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPets(false);
      }
    })();
  }, []);

  if (!service) return null;

  const finalPet = petName === '__custom' ? customPet.trim() : petName;

  const submit = async () => {
    if (!finalPet || !date) return;
    setSaving(true);
    try {
      const created = await base44.entities.ServiceBooking.create({
        service_type: service.type,
        pet_name: finalPet,
        date,
        time: time || undefined,
        duration,
        notes: notes.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined
      });
      setDone(true);
      onBooked?.(created);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-pop-in" onClick={onClose} />
      <div className="relative clay w-full max-w-md p-5 rounded-b-none sm:rounded-3xl animate-float-up max-h-[92vh] overflow-y-auto">
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-mint/20 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={34} className="text-mint" />
            </div>
            <div className="font-heading font-extrabold text-lg">Booking requested! 🎉</div>
            <p className="text-sm text-muted-foreground font-semibold mt-1.5">
              We've logged your {service.type.toLowerCase()} request for {finalPet} on {date}. A sitter will reach out shortly.
            </p>
            <button onClick={onClose} className="clay-btn pp-gradient text-white w-full py-3 mt-5 font-heading font-bold">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl pp-gradient flex items-center justify-center">
                  {service.type === 'Dog Walker' ? <Dog size={20} className="text-white" /> : <PawPrint size={20} className="text-white" />}
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-lg leading-none">{service.type}</h2>
                  <p className="text-xs text-muted-foreground font-semibold mt-0.5">{service.tagline}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><PawPrint size={12} /> Your Pet</label>
                {loadingPets ? (
                  <div className="clay-inset mt-2 px-4 py-3 rounded-2xl text-sm text-muted-foreground font-semibold">Loading pets…</div>
                ) : pets.length === 0 ? (
                  <input value={customPet} onChange={(e) => { setCustomPet(e.target.value); setPetName('__custom'); }} placeholder="Type your pet's name…"
                    className="clay-inset w-full mt-2 px-4 py-3.5 rounded-2xl text-base font-bold outline-none focus:ring-2 ring-coral" />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {pets.map((p) => (
                      <button key={p.id} onClick={() => setPetName(p.name)}
                        className={`clay-tight px-3.5 py-2 text-sm font-heading font-bold flex items-center gap-1.5 transition-all ${petName === p.name ? 'bg-sky text-white scale-105' : ''}`}>
                        {p.species === 'cat' ? <Cat size={14} /> : <Dog size={14} />}
                        {p.name}
                      </button>
                    ))}
                    <button onClick={() => setPetName('__custom')}
                      className={`clay-tight px-3.5 py-2 text-sm font-heading font-bold transition-all ${petName === '__custom' ? 'bg-sky text-white scale-105' : ''}`}>
                      + Other
                    </button>
                  </div>
                )}
                {petName === '__custom' && (
                  <input value={customPet} onChange={(e) => setCustomPet(e.target.value)} placeholder="Pet's name…"
                    className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Calendar size={12} /> Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Clock size={12} /> Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Duration</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DURATIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)}
                      className={`clay-tight px-3.5 py-2 text-sm font-heading font-bold transition-all ${duration === d ? 'bg-sun text-foreground scale-105' : ''}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your Name</label>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Jane Doe"
                    className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Phone</label>
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567"
                    className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything we should know? e.g. shy around strangers, needs a leash…"
                  rows={2} className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral resize-none" />
              </div>

              <button onClick={submit} disabled={saving || !finalPet || !date}
                className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {saving ? 'Booking…' : `Request ${service.type}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}