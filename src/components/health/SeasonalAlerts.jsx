import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, LocateFixed, Sparkles, PawPrint, Plane, MapPin } from 'lucide-react';
import { getIpLocation } from '@/lib/geo';

const RISK = {
  low: { label: 'Low', chip: 'bg-mint text-accent-foreground', ring: 'bg-mint/20', paws: 1, paw: 'text-mint' },
  medium: { label: 'Watch out', chip: 'bg-sun text-foreground', ring: 'bg-sun/25', paws: 2, paw: 'text-sun' },
  high: { label: 'High alert', chip: 'bg-coral text-white', ring: 'bg-coral/20', paws: 3, paw: 'text-coral' }
};

async function fetchAlerts(pet, location) {
  const d = new Date();
  const month = d.toLocaleString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `It is ${month} ${year} in ${location}. Build a seasonal allergy & health alert chart for this pet: name=${pet.name}, species=${pet.species}, breed=${pet.breed || 'unknown'}, age=${pet.age || 'unknown'}.
Give 4-6 alerts that matter in this exact month and place for this pet's species, breed and age: seasonal allergens (pollen, mold, dust), parasites (fleas, ticks, mosquitoes/heartworm), weather or temperature hazards, and any seasonal risk specific to this breed or age group.
Pick a cute fitting emoji for each alert. Set risk to low, medium or high based on how likely it is in ${location} in ${month}.
Keep description and tip under 25 words each. Also return a short season_label like "Early fall" or "Peak summer" — never mention the city or location name in the season_label, headline, or any alert text — and a one-line headline mentioning the pet's species and breed.`,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        season_label: { type: 'string' },
        headline: { type: 'string' },
        alerts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              emoji: { type: 'string' },
              name: { type: 'string' },
              risk: { type: 'string', enum: ['low', 'medium', 'high'] },
              description: { type: 'string' },
              tip: { type: 'string' }
            },
            required: ['name', 'risk', 'description', 'tip']
          }
        }
      }
    }
  });
  return res;
}

function AlertCard({ alert, index }) {
  const R = RISK[alert.risk] || RISK.medium;
  return (
    <div className="clay-tight p-4 animate-float-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-2xl ${R.ring} flex items-center justify-center shrink-0 text-2xl`}>
          {alert.emoji || '🐾'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="font-heading font-extrabold text-sm leading-tight">{alert.name}</div>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold font-heading ${R.chip}`}>
              {R.label}
            </span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {[0, 1, 2].map((i) => (
              <PawPrint key={i} size={12} fill="currentColor" className={i < R.paws ? R.paw : 'text-muted-foreground/30'} />
            ))}
          </div>
          <p className="text-xs text-foreground/80 font-semibold mt-2">{alert.description}</p>
          <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground font-semibold">
            <span>💡</span>
            <span>{alert.tip}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertChart({ data }) {
  return (
    <div>
      <div className="clay p-5 mb-3 bg-gradient-to-br from-sky/15 to-mint/15 animate-pop-in">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wide">
          <Sparkles size={12} className="text-mint" /> {data.season_label}
        </div>
        <div className="font-heading font-extrabold text-base mt-1 leading-tight">{data.headline}</div>
      </div>
      <div className="space-y-2.5">
        {(data.alerts || []).map((a, i) => (
          <AlertCard key={i} alert={a} index={i} />
        ))}
      </div>
      <p className="text-center text-[10px] text-muted-foreground font-semibold mt-4 px-4">
        AI-generated general guidance — always check with your vet for anything unusual. 🩺
      </p>
    </div>
  );
}

function LoadingCard({ label, sub }) {
  return (
    <div className="clay p-8 text-center animate-pop-in">
      <Loader2 size={28} className="animate-spin text-mint mx-auto mb-3" />
      <div className="font-heading font-extrabold text-sm">{label}</div>
      <p className="text-xs text-muted-foreground font-semibold mt-1">{sub}</p>
    </div>
  );
}

export default function SeasonalAlerts({ pet }) {
  const [locationText, setLocationText] = useState('');
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [travelCity, setTravelCity] = useState('');
  const [travelLoading, setTravelLoading] = useState(false);
  const [travelData, setTravelData] = useState(null);
  const [travelError, setTravelError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const auto = async () => {
      setLoading(true);
      setError('');
      try {
        const loc = await getIpLocation();
        if (cancelled) return;
        setLocationText(loc);
        const res = await fetchAlerts(pet, loc);
        if (cancelled) return;
        setData(res);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('We could not detect your location. Check your connection and retry.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    auto();
    return () => { cancelled = true; };
  }, [pet.id, retryCount]);

  const runTravel = async () => {
    const loc = travelCity.trim();
    if (!loc) {
      setTravelError('Type the city you are traveling to.');
      return;
    }
    setTravelLoading(true);
    setTravelError('');
    setTravelData(null);
    try {
      setTravelData(await fetchAlerts(pet, loc));
    } catch (e) {
      console.error(e);
      setTravelError('Could not build the travel alert chart. Try again.');
    } finally {
      setTravelLoading(false);
    }
  };

  return (
    <div>
      {/* Auto-detected location banner */}
      {locationText && !error && (
        <div className="clay p-4 mb-3 flex items-center gap-2 animate-pop-in">
          <MapPin size={14} className="text-sky shrink-0" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide truncate">
            Allergy &amp; Alerts near you
          </span>
        </div>
      )}

      {!loading && error && (
        <div className="clay p-6 text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-coral/15 flex items-center justify-center mx-auto mb-3">
            <LocateFixed size={26} className="text-coral" />
          </div>
          <p className="font-heading font-bold text-base">Couldn't find you 😿</p>
          <p className="text-sm text-muted-foreground font-semibold mt-1">{error}</p>
          <button onClick={() => setRetryCount((c) => c + 1)}
            className="clay-btn bg-sky text-white px-5 py-2.5 mt-3 font-heading font-bold text-sm">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <LoadingCard
          label={`Building ${pet.name}'s seasonal alert chart…`}
          sub={`PawPulse AI is checking allergens, pests & weather for this time of year 🌼`}
        />
      )}

      {!loading && data && <AlertChart data={data} />}



      {/* Travel section */}
      <div className="clay p-5 mt-5">
        <div className="flex items-center gap-2 mb-1.5">
          <Plane size={16} className="text-sky" />
          <h3 className="font-heading font-extrabold text-sm">Traveling to a different city — know your pet's alert chart</h3>
        </div>
        <p className="text-xs text-muted-foreground font-semibold mb-3">
          Going on a trip? Get a fresh seasonal chart for {pet.name} at your destination.
        </p>
        <div className="flex gap-2">
          <input value={travelCity} onChange={(e) => setTravelCity(e.target.value)}
            placeholder="Destination city (e.g. Miami)…" className="clay-inset flex-1 min-w-0 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-sky" />
          <button onClick={runTravel} disabled={travelLoading}
            className="clay-btn bg-sky text-white px-4 py-3 rounded-2xl font-heading font-bold text-sm flex items-center gap-2 disabled:opacity-60">
            {travelLoading ? <Loader2 size={16} className="animate-spin" /> : <Plane size={16} />}
            {travelLoading ? 'Checking…' : 'Check'}
          </button>
        </div>
        {travelError && <p className="text-xs text-destructive font-semibold mt-1.5">{travelError}</p>}
      </div>

      {travelLoading && (
        <div className="mt-4">
          <LoadingCard
            label={`Checking ${travelCity || 'your destination'} for ${pet.name}…`}
            sub="Allergens, pests and weather — one fresh chart for your trip ✈️"
          />
        </div>
      )}

      {!travelLoading && travelData && (
        <div className="mt-4">
          <div className="flex items-center gap-1.5 px-1 mb-2.5">
            <Plane size={14} className="text-sky" />
            <span className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wide">Travel chart</span>
          </div>
          <AlertChart data={travelData} />
        </div>
      )}
    </div>
  );
}