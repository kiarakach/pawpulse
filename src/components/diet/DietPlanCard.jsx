import React from 'react';
import { Droplets, Flame, Utensils, Soup, Cookie, TriangleAlert, RefreshCw, Sparkles, Loader2 } from 'lucide-react';

const bullets = (plan) => [
  { icon: Droplets, chip: 'text-sky bg-sky/15', label: 'Water', value: `${plan.water_oz} oz / day` },
  { icon: Flame, chip: 'text-orange bg-orange/15', label: 'Ideal calorie intake / day', value: `${plan.calories_per_day} Cal` },
  { icon: Utensils, chip: 'text-grape bg-grape/15', label: 'No. of meals per day', value: `${plan.meals_per_day}` },
  { icon: Soup, chip: 'text-brown bg-brown/15', label: 'Cups of dry food per meal', value: `${plan.cups_per_meal} cups / meal` },
  { icon: Cookie, chip: 'text-sun bg-sun/25', label: 'Max pet-treats', value: `${plan.max_treats_grams} g (should not exceed 100 Cal)` },
  { icon: TriangleAlert, chip: 'text-coral bg-coral/15', label: 'Symptoms to watch out for', value: (plan.symptoms || []).join(', ') || 'GDV (bloating), dehydration, allergy' }
];

export default function DietPlanCard({ pet, plan, loading, error, onRefresh }) {
  return (
    <div className="clay p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-2xl pp-gradient text-white flex items-center justify-center clay-btn shrink-0">
            <Sparkles size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading font-extrabold text-base leading-none">Most Ideal Diet Intake for {pet.name}</h2>
            <p className="text-[11px] text-muted-foreground font-semibold mt-1 truncate">
              AI-tailored for {pet.name} · {pet.breed || pet.species}{pet.age ? ` · ${pet.age}` : ''}
            </p>
          </div>
        </div>
        <button onClick={onRefresh} disabled={loading} title="Refresh AI suggestion"
          className="clay-btn bg-card p-2.5 text-muted-foreground shrink-0 disabled:opacity-60">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {loading && (
        <div className="clay-inset p-5 text-center">
          <Loader2 className="animate-spin text-grape mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">Chef AI is plating {pet.name}'s ideal diet… 🍽️</p>
        </div>
      )}

      {!loading && error && (
        <div className="clay-inset p-4 text-center">
          <p className="text-sm font-semibold mb-2">Could not generate the diet plan right now.</p>
          <button onClick={onRefresh} className="clay-btn bg-grape text-white px-4 py-2 font-heading font-bold text-xs">Try again</button>
        </div>
      )}

      {!loading && !error && plan && (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {bullets(plan).map(({ icon: Icon, chip, label, value }) => (
            <div key={label} className="clay-inset p-3 flex items-center gap-2.5 bg-card">
              <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${chip}`}>
                <Icon size={17} />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground leading-none">{label}</div>
                <div className="font-heading font-bold text-sm mt-1 truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}