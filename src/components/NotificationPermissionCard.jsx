import React, { useState } from 'react';
import { BellRing, Leaf, Utensils, PawPrint, Check, Sparkles } from 'lucide-react';

export default function NotificationPermissionCard({ onDone }) {
  const [granted, setGranted] = useState(false);

  const allow = async () => {
    let ok = false;
    try {
      if (typeof Notification !== 'undefined') {
        ok = (await Notification.requestPermission()) === 'granted';
      }
    } catch (e) {
      console.error(e);
    }
    if (ok) {
      setGranted(true);
      setTimeout(onDone, 1600);
    } else {
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 bg-foreground/45 backdrop-blur-sm animate-pop-in">
      <div className="clay w-full max-w-sm p-6 relative overflow-hidden bg-gradient-to-br from-sun/15 via-card to-sky/15">
        <PawPrint size={90} className="absolute -right-4 -top-4 text-coral/10 pp-sway" />
        <PawPrint size={60} className="absolute -left-3 bottom-16 text-sky/15 pp-bob" />
        <Sparkles size={44} className="absolute right-8 bottom-6 text-sun/25 pp-glow" />

        {/* Phone mockup with live notifications sliding in */}
        <div className="mx-auto w-44 rounded-[1.6rem] bg-gradient-to-b from-foreground to-black border-4 border-white shadow-xl p-2 space-y-1.5 mb-5 pp-bob">
          <div className="bg-white rounded-xl px-2 py-1.5 flex items-center gap-1.5 pp-slide-in">
            <Leaf size={13} className="text-mint shrink-0" />
            <span className="text-[9px] font-bold text-foreground/80 truncate">High pollen near you right now 🌾</span>
          </div>
          <div className="bg-white rounded-xl px-2 py-1.5 flex items-center gap-1.5 pp-slide-in" style={{ animationDelay: '0.6s' }}>
            <Utensils size={13} className="text-sky shrink-0" />
            <span className="text-[9px] font-bold text-foreground/80 truncate">Dinner time! Log meals &amp; water 🍽️</span>
          </div>
          <div className="bg-white rounded-xl px-2 py-1.5 flex items-center gap-1.5 pp-slide-in" style={{ animationDelay: '1.2s' }}>
            <BellRing size={13} className="text-coral shrink-0" />
            <span className="text-[9px] font-bold text-foreground/80 truncate">Vaccination due this week 💉</span>
          </div>
        </div>

        {!granted ? (
          <>
            <div className="text-center">
              <h2 className="font-heading font-extrabold text-xl leading-tight">Never miss what matters 🐾</h2>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                Let iPhone notifications keep you ahead of your pet's day.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="clay-inset p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-mint text-white flex items-center justify-center shrink-0 pp-pulse">
                  <Leaf size={17} />
                </div>
                <p className="text-xs font-semibold leading-snug">
                  <span className="font-heading font-extrabold">Local allergy alerts</span> — know when pollen &amp; pests flare up near you, before they reach your pet.
                </p>
              </div>
              <div className="clay-inset p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky text-white flex items-center justify-center shrink-0 pp-pulse" style={{ animationDelay: '0.4s' }}>
                  <Utensils size={17} />
                </div>
                <p className="text-xs font-semibold leading-snug">
                  <span className="font-heading font-extrabold">Daily diet tracking</span> — timely nudges to log meals, water &amp; treats so every day counts.
                </p>
              </div>
            </div>

            <button onClick={allow} className="clay-btn pp-gradient text-white w-full py-3.5 mt-5 font-heading font-extrabold text-sm flex items-center justify-center gap-2">
              <BellRing size={17} /> Allow Notifications
            </button>
            <button onClick={onDone} className="w-full text-center text-xs font-bold text-muted-foreground mt-3 py-1.5">
              Maybe later
            </button>
          </>
        ) : (
          <div className="text-center py-3 animate-pop-in">
            <div className="w-16 h-16 rounded-full bg-mint text-white flex items-center justify-center mx-auto pp-tada">
              <Check size={30} strokeWidth={3} />
            </div>
            <h2 className="font-heading font-extrabold text-xl mt-3">You're all set! 🎉</h2>
            <p className="text-sm text-muted-foreground font-semibold mt-1">We'll ping you the moment your pet needs you.</p>
          </div>
        )}
      </div>
    </div>
  );
}