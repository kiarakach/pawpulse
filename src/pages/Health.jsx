import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import { HeartPulse, Wind, Leaf } from 'lucide-react';
import RemindersTab from '@/components/health/RemindersTab';
import VaccinationChart from '@/components/health/VaccinationChart';
import SeasonalAlerts from '@/components/health/SeasonalAlerts';

const TABS = [
  { k: 'vax', label: 'Vaccination Tracker ✨' },
  { k: 'season', label: 'Allergy & Alerts' },
  { k: 'reminders', label: 'Reminders' }
];

export default function Health() {
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [tab, setTab] = useState('vax');
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center py-10 text-muted-foreground font-semibold">Loading…</div>;

  if (pets.length === 0) {
    return (
      <div className="animate-float-up">
        <BrandHeader title="Health Hub" subtitle="AI-powered care, shots & meds" />
        <div className="clay p-8 text-center">
          <HeartPulse size={40} className="text-grape mx-auto mb-3" />
          <div className="font-heading font-extrabold text-lg">Add a pet first!</div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">Head to Home to create a pet profile, then unlock the AI vaccination chart and seasonal alerts here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-up">
      <BrandHeader title="Health Hub" subtitle="AI-powered care, shots & meds" />

      {/* Pet selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-hide">
        {pets.map((p) => (
          <button key={p.id} onClick={() => setActivePet(p)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-heading font-bold whitespace-nowrap transition-all ${activePet?.id === p.id ? 'bg-grape text-white scale-105 shadow-lg' : 'clay-inset'}`}>
            {p.name}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="clay-inset p-1 flex mb-4">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 py-2.5 px-1 rounded-2xl text-[11px] sm:text-sm font-heading font-bold transition-all ${tab === t.k ? 'bg-card shadow' : 'text-muted-foreground'}`}>
            {t.k === 'season' ? (
              <span className="inline-flex items-center justify-center gap-1">
                <span className="relative inline-flex items-center">
                  <Wind size={14} className="text-grape" />
                  <Leaf size={11} className="-ml-2 -mt-2.5 rotate-[35deg] text-sun" />
                </span>
                {t.label}
              </span>
            ) : t.label}
          </button>
        ))}
      </div>

      {tab === 'vax' && <VaccinationChart key={activePet.id} pet={activePet} />}
      {tab === 'season' && <SeasonalAlerts key={activePet.id} pet={activePet} />}
      {tab === 'reminders' && <RemindersTab key={activePet.id} pet={activePet} />}
    </div>
  );
}