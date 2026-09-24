import React, { useState } from 'react';
import { Search, ExternalLink, ShoppingBag } from 'lucide-react';

const CHIPS = [
  { label: 'Smart Feeder', query: 'pet smart feeder' },
  { label: 'GPS Tracker', query: 'pet gps tracker' },
  { label: 'Pet Camera', query: 'pet camera with app' },
  { label: 'Smart Collar', query: 'smart dog collar' },
  { label: 'Litter Box', query: 'automatic litter box' },
  { label: 'Grooming Kit', query: 'pet grooming kit' }
];

// 4★ & up customer review filter (rh) + sorted by highest customer rating
export const amazonSearchUrl = (q) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(q)}&rh=p_72%3A1248879011&sort=review-rank`;

export default function AmazonSearch({ className = '' }) {
  const [query, setQuery] = useState('');

  const openAmazon = (q) => window.open(amazonSearchUrl(q), '_blank');
  const submit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) openAmazon(q);
  };

  return (
    <div className={`clay p-4 bg-gradient-to-br from-sun/15 to-coral/10 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl pp-gradient text-white flex items-center justify-center clay-btn shrink-0">
          <ShoppingBag size={18} />
        </div>
        <div>
          <div className="font-heading font-extrabold text-base leading-tight">Shop pet products on Amazon</div>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">Search any product — opens straight on Amazon.</p>
        </div>
      </div>

      <form onSubmit={submit} className="flex gap-2 mt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search pet products… (e.g. smart feeder)"
          className="clay-inset flex-1 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="clay-btn pp-gradient text-white px-4 sm:px-5 flex items-center gap-1.5 font-heading font-bold disabled:opacity-50"
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        {CHIPS.map((c) => (
          <button
            key={c.label}
            onClick={() => openAmazon(c.query)}
            className="clay-tight px-3 py-1.5 text-xs font-heading font-bold inline-flex items-center gap-1 transition-all hover:scale-105"
          >
            {c.label}
            <ExternalLink size={11} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}