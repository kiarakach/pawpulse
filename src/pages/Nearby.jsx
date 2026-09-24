import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Loader2, LocateFixed, ExternalLink, MapPin, PawPrint, Compass, Frown } from 'lucide-react';
import { BrandHeader } from '@/components/BottomNav';
import { getPosition, reverseGeocode, mapsSearchUrl } from '@/lib/geo';

const CATEGORIES_BY_PET = {
  dog: [
    { key: 'dog park', label: 'Dog Parks', emoji: '🌳' },
    { key: 'dog play area', label: 'Play Areas', emoji: '🎾' },
    { key: 'veterinarian', label: 'Vets', emoji: '🩺' },
    { key: 'emergency vet', label: 'Emergency Vets', emoji: '🚑' },
    { key: 'pet store', label: 'Pet Stores', emoji: '🛍️' },
    { key: 'dog groomer', label: 'Groomers', emoji: '✂️' },
    { key: 'dog daycare', label: 'Daycare', emoji: '🏠' },
    { key: 'dog friendly beach', label: 'Dog Beaches', emoji: '🏖️' },
    { key: 'dog friendly cafe', label: 'Dog Cafés', emoji: '☕' },
    { key: 'dog trainer', label: 'Trainers', emoji: '🎓' }
  ],
  cat: [
    { key: 'cat park', label: 'Cat Parks', emoji: '🌳' },
    { key: 'cat playground', label: 'Play Areas', emoji: '🎾' },
    { key: 'veterinarian', label: 'Vets', emoji: '🩺' },
    { key: 'emergency vet', label: 'Emergency Vets', emoji: '🚑' },
    { key: 'pet store', label: 'Pet Stores', emoji: '🛍️' },
    { key: 'cat groomer', label: 'Groomers', emoji: '✂️' },
    { key: 'cat hotel', label: 'Cat Hotels', emoji: '🏠' },
    { key: 'cat friendly beach', label: 'Cat Beaches', emoji: '🏖️' },
    { key: 'cat cafe', label: 'Cat Cafés', emoji: '☕' },
    { key: 'cat trainer', label: 'Trainers', emoji: '🎓' }
  ],
  both: [
    { key: 'pet park', label: 'Pet Parks', emoji: '🌳' },
    { key: 'pet play area', label: 'Play Areas', emoji: '🎾' },
    { key: 'veterinarian', label: 'Vets', emoji: '🩺' },
    { key: 'emergency vet', label: 'Emergency Vets', emoji: '🚑' },
    { key: 'pet store', label: 'Pet Stores', emoji: '🛍️' },
    { key: 'pet groomer', label: 'Groomers', emoji: '✂️' },
    { key: 'pet daycare', label: 'Daycare', emoji: '🏠' },
    { key: 'pet friendly beach', label: 'Pet Beaches', emoji: '🏖️' },
    { key: 'pet friendly cafe', label: 'Pet Cafés', emoji: '☕' },
    { key: 'pet trainer', label: 'Trainers', emoji: '🎓' }
  ]
};

export default function Nearby() {
  const [petType, setPetType] = useState('dog');
  const [active, setActive] = useState('dog park');
  const [custom, setCustom] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const what = useCustom ? custom.trim() : active;

  const detect = async () => {
    setLocating(true);
    setLocError('');
    try {
      const pos = await getPosition();
      setCoords(pos);
      const place = await reverseGeocode(pos.lat, pos.lng);
      setLocationText(place);
    } catch {
      setLocError('Could not get your location. Type your city or area below.');
    } finally {
      setLocating(false);
    }
  };

  const search = async () => {
    let loc = locationText.trim();
    if (!loc && coords) loc = `${coords.lat},${coords.lng}`;
    if (!loc) {
      setLocError('Add your location to find nearby places.');
      return;
    }
    if (!what) return;
    setSearching(true);
    setSearchError('');
    setResults([]);
    setHasSearched(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Find 6 real, well-known "${what}" places near ${loc} that are suitable for ${petType === 'both' ? 'dogs and cats' : petType === 'cat' ? 'cats' : 'dogs'}. For each place return its name, full street address, a short one-sentence description, and a single maps_query string combining the name and address. Only include genuine places that actually exist near that location.`,
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            places: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  address: { type: 'string' },
                  description: { type: 'string' },
                  maps_query: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setResults(res?.places || []);
    } catch (e) {
      setSearchError('Could not fetch nearby places right now.');
    } finally {
      setSearching(false);
    }
  };

  const fallbackUrl = what
    ? mapsSearchUrl(`${what} near ${locationText || (coords ? `${coords.lat},${coords.lng}` : 'me')}`)
    : '';

  return (
    <div className="min-h-screen pb-28 px-4 pt-5 max-w-2xl mx-auto">
      <BrandHeader title="Nearby" subtitle="Find pet-friendly spots around you 🐾" />

      <div className="clay p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Who's coming along?</label>
          <div className="grid grid-cols-3 gap-2 mt-2.5">
            {[
              { key: 'dog', label: 'Dog', emoji: '🐶' },
              { key: 'cat', label: 'Cat', emoji: '🐱' },
              { key: 'both', label: 'Both', emoji: '🐾' }
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setPetType(p.key);
                  setActive(CATEGORIES_BY_PET[p.key][0].key);
                  setUseCustom(false);
                  setCustom('');
                }}
                className={`clay-tight py-3 flex flex-col items-center gap-0.5 font-heading font-bold text-sm transition-all ${
                  petType === p.key ? 'bg-sun text-foreground scale-105' : ''
                }`}
              >
                <span className="text-xl">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">What are you looking for?</label>
          <div className="flex flex-wrap gap-2 mt-2.5">
            {(CATEGORIES_BY_PET[petType] || CATEGORIES_BY_PET.dog).map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setActive(c.key);
                  setUseCustom(false);
                }}
                className={`clay-tight px-3.5 py-2 text-sm font-heading font-bold transition-all ${
                  !useCustom && active === c.key ? 'bg-orange text-white scale-105' : ''
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <input
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setUseCustom(true);
              }}
              placeholder="Or type anything (e.g. dog swimming pool)…"
              className={`clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-orange ${
                useCustom ? 'ring-2 ring-orange' : ''
              }`}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your location</label>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={detect}
              disabled={locating}
              className="clay-btn bg-sky text-white px-4 py-3 flex items-center gap-2 font-heading font-bold text-sm disabled:opacity-60"
            >
              {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              {locating ? 'Locating…' : 'Use my location'}
            </button>
            <input
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="City or area…"
              className="clay-inset flex-1 min-w-0 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-sky"
            />
          </div>
          {locError && <p className="text-xs text-destructive font-semibold mt-1.5">{locError}</p>}
        </div>

        <button
          onClick={search}
          disabled={searching || !what}
          className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {searching ? 'Searching nearby…' : 'Find Nearby Spots'}
        </button>
      </div>

      <div className="mt-5">
        {searching && (
          <div className="clay p-6 text-center">
            <Loader2 className="animate-spin text-coral mx-auto mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">Sniffing out the best {what} near you…</p>
          </div>
        )}

        {!searching && searchError && (
          <div className="clay p-5 text-center">
            <Frown className="mx-auto text-coral mb-2" />
            <p className="text-sm font-semibold mb-3">{searchError}</p>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noreferrer"
              className="clay-btn bg-sky text-white inline-flex items-center gap-2 px-5 py-2.5 font-heading font-bold text-sm"
            >
              <MapPin size={16} /> Open Google Maps
            </a>
          </div>
        )}

        {!searching && !searchError && hasSearched && results.length === 0 && (
          <div className="clay p-5 text-center">
            <PawPrint className="mx-auto text-coral mb-2" />
            <p className="text-sm font-semibold text-muted-foreground mb-3">No spots found. Try a broader search?</p>
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noreferrer"
              className="clay-btn bg-sky text-white inline-flex items-center gap-2 px-5 py-2.5 font-heading font-bold text-sm"
            >
              <MapPin size={16} /> Search on Google Maps
            </a>
          </div>
        )}

        {!searching && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Compass size={18} className="text-orange" />
              <h2 className="font-heading font-extrabold text-base">{results.length} {what} near you</h2>
            </div>
            {results.map((p, i) => {
              const query = p.maps_query || `${p.name} ${p.address}`;
              return (
                <div key={i} className="clay p-4 animate-float-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="font-heading font-extrabold text-base leading-tight">{p.name}</div>
                  <div className="text-xs text-muted-foreground font-semibold mt-0.5 flex items-center gap-1">
                    <MapPin size={12} /> {p.address}
                  </div>
                  {p.description && <p className="text-sm text-foreground/80 font-medium mt-2">{p.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <a
                      href={mapsSearchUrl(query)}
                      target="_blank"
                      rel="noreferrer"
                      className="clay-btn pp-gradient text-white px-4 py-2.5 font-heading font-bold text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink size={14} /> Open in Maps
                    </a>
                    <a
                      href={mapsSearchUrl(query)}
                      target="_blank"
                      rel="noreferrer"
                      className="clay-btn bg-muted text-foreground px-4 py-2.5 font-heading font-bold text-xs flex items-center gap-1.5"
                    >
                      <MapPin size={14} /> Directions
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!hasSearched && !searching && (
          <div className="clay p-6 text-center mt-5">
            <div className="w-14 h-14 rounded-2xl bg-orange/15 flex items-center justify-center mx-auto mb-3">
              <Compass size={28} className="text-orange" />
            </div>
            <p className="font-heading font-bold text-base">Pick a category, add your location, and go!</p>
            <p className="text-sm text-muted-foreground font-semibold mt-1">
              We'll fetch real spots with links to open in Google Maps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}