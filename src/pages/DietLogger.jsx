import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import { Apple, HeartPulse } from 'lucide-react';
import DietSection from '@/components/diet/DietSection';

export default function DietLogger() {
  const [pets, setPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Pet.list('-created_date', 50);
        setPets(list);
        if (list.length) setActivePet(list[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-center py-10 text-muted-foreground font-semibold">Loading…</div>;

  if (pets.length === 0) {
    return (
      <div className="animate-float-up">
        <BrandHeader title="Diet Doctor" subtitle="AI diet plans & daily intake tracking" />
        <div className="clay p-8 text-center">
          <Apple size={40} className="text-sky mx-auto mb-3" />
          <div className="font-heading font-extrabold text-lg">Add a pet first!</div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Head to Home to create a pet profile, then unlock the AI ideal-diet plan and daily logging here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-float-up">
      <BrandHeader title="Diet Doctor" subtitle="AI diet plans & daily intake tracking 🍽️" />

      {/* Pet tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 scrollbar-hide">
        {pets.map((p) => (
          <button key={p.id} onClick={() => setActivePet(p)}
            className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-heading font-bold whitespace-nowrap transition-all ${
              activePet?.id === p.id ? 'bg-sky text-white scale-105 shadow-lg' : 'clay-inset'
            }`}>
            {p.species === 'cat' ? '🐱' : '🐶'} {p.name}
          </button>
        ))}
      </div>

      {activePet && <DietSection key={activePet.id} pet={activePet} />}

      <p className="text-center text-[10px] text-muted-foreground font-semibold mt-4 flex items-center justify-center gap-1">
        <HeartPulse size={11} /> AI suggestions are general guidance — always confirm with your vet.
      </p>
    </div>
  );
}