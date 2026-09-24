import React, { useState } from 'react';
import { BrandHeader } from '@/components/BottomNav';
import AmazonSearch from '@/components/shop/AmazonSearch';
import Wishlist from '@/components/shop/Wishlist';
import OrderHistory from '@/components/shop/OrderHistory';
import BookingModal from '@/components/BookingModal';
import { Dog, PawPrint, Heart } from 'lucide-react';

const SERVICES = [
  { type: 'Dog Walker', tagline: 'Loved walks, rain or shine', accent: 'from-sky/20 to-mint/15' },
  { type: 'Pet Sitter', tagline: "In-home care while you're away", accent: 'from-coral/20 to-sun/15' }
];

export default function Shop() {
  const [bookingService, setBookingService] = useState(null);

  return (
    <div className="animate-float-up pb-8">
      <BrandHeader title="PawPulse Shop" subtitle="Book pet pros & find smart gear" />

      <p className="text-center text-xs font-bold text-muted-foreground mb-4 animate-float-up">
        Scroll down to track previous purchases and find a professional to take care of your pets
        <span className="inline-block ml-1 animate-wiggle">🐾</span>
      </p>

      {/* Amazon product search */}
      <AmazonSearch className="mb-4" />

      {/* Wishlist */}
      <div className="mb-6">
        <Wishlist />
      </div>

      {/* Order history & tracking */}
      <div className="mb-6">
        <OrderHistory />
      </div>

      {/* Bookable services */}
      <div>
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <Heart size={16} className="text-coral" />
          <h3 className="font-heading font-extrabold text-base">Book a Pro</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((s) => (
            <button key={s.type} onClick={() => setBookingService(s)}
              className={`clay p-4 text-left bg-gradient-to-br ${s.accent} hover:scale-[1.02] transition-transform`}>
              <div className="w-11 h-11 rounded-2xl pp-gradient text-white flex items-center justify-center mb-2.5 clay-btn">
                {s.type === 'Dog Walker' ? <Dog size={20} /> : <PawPrint size={20} />}
              </div>
              <div className="font-heading font-extrabold text-base leading-tight">{s.type}</div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">{s.tagline}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-heading font-bold text-coral">
                Book now →
              </div>
            </button>
          ))}
        </div>
      </div>

      <BookingModal service={bookingService} onClose={() => setBookingService(null)} />
    </div>
  );
}