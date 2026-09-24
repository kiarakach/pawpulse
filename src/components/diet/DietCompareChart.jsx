import React from 'react';
import { PawPrint, ChartColumn } from 'lucide-react';

const ACT_SCORE = { low: 1, medium: 2, high: 3 };
const clamp = (v) => Math.max(0, Math.min(150, Math.round(v)));

export default function DietCompareChart({ pet, plan, logs }) {
  if (!plan) return null;

  const n = logs.length;
  const avg = (fn) => logs.reduce((s, l) => s + (fn(l) || 0), 0) / n;

  const idealCups = (plan.meals_per_day || 1) * (plan.cups_per_meal || 0);
  const avgWater = avg(l => l.water_oz);
  const avgCups = avg(l => (l.meal1_cups || 0) + (l.meal2_cups || 0) + (l.meal3_cups || 0));
  const avgTreats = avg(l => l.treats_count);
  const avgAct = avg(l => ACT_SCORE[l.activity] || 0);

  const rows = [
    { emoji: '💧', label: 'Water', pct: clamp((avgWater / (plan.water_oz || 1)) * 100), detail: `${avgWater.toFixed(1)} oz vs ${plan.water_oz} oz ideal` },
    { emoji: '🍲', label: 'Food', pct: clamp((avgCups / (idealCups || 1)) * 100), detail: `${avgCups.toFixed(1)} cups vs ${idealCups.toFixed(1)} cups ideal` },
    { emoji: '🍪', label: 'Treats', pct: clamp((avgTreats * 10) / (plan.max_treats_grams || 1) * 100), detail: `≈${Math.round(avgTreats * 10)} g vs ${plan.max_treats_grams} g max` },
    { emoji: '⚡', label: 'Activity', pct: clamp((avgAct / 3) * 100), detail: `${avgAct >= 2.5 ? 'High' : avgAct >= 1.5 ? 'Medium' : 'Low'} vs recommended` }
  ];

  return (
    <div className="clay p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-10 h-10 rounded-2xl bg-grape/20 text-grape flex items-center justify-center clay-btn shrink-0">
          <ChartColumn size={18} />
        </span>
        <div>
          <h2 className="font-heading font-extrabold text-base leading-none">{pet.name} vs. the Ideal 📊</h2>
          <p className="text-[11px] text-muted-foreground font-semibold mt-1">
            {n > 0 ? `Averages across ${n} logged day${n > 1 ? 's' : ''}` : 'Chart fills in as you log daily intake'}
          </p>
        </div>
      </div>

      {n === 0 ? (
        <div className="clay-inset p-6 text-center">
          <PawPrint className="mx-auto text-grape mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">
            Log a day of meals & water above to see how {pet.name} compares to the ideal plan 🐾
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-end gap-1.5 text-[10px] font-extrabold text-grape mb-0.5">
            <span className="inline-block w-4 border-t-2 border-dashed border-grape" /> Ideal
          </div>
          {rows.map((r) => (
            <div key={r.label} className="clay-inset p-3 bg-card">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="font-heading text-sm">{r.emoji} {r.label}</span>
                <span className="text-muted-foreground text-[11px]">{r.detail}</span>
              </div>
              <div className="relative h-4 rounded-full bg-muted/80">
                <div className="h-full rounded-full pp-gradient animate-pop-in" style={{ width: `${Math.max(2, (r.pct / 150) * 100)}%` }} />
                <div className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-grape" style={{ left: '66.67%' }} />
                <span className="absolute -top-0.5 right-1 text-[10px] font-extrabold text-foreground/70">{r.pct}%</span>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground font-semibold text-center">
            Aim near the dashed line for water, food & activity. Treats show % of the daily treat limit (≈10 g per treat) — lower is better!
          </p>
        </div>
      )}
    </div>
  );
}