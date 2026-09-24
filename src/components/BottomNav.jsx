import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, HeartPulse, CalendarCheck, Users, MapPinned } from 'lucide-react';
import AppLogo from './AppLogo';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon, color: 'coral' },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, color: 'sky' },
  { to: '/health', label: 'Health', icon: HeartPulse, color: 'grape' },
  { to: '/routines', label: 'My Routines', icon: CalendarCheck, color: 'mint' },
  { to: '/community', label: 'Community', icon: Users, color: 'sun' },
  { to: '/nearby', label: 'Nearby', icon: MapPinned, color: 'orange' }
];

const activeBg = {
  coral: 'bg-coral text-white shadow-[0_6px_14px_-4px_hsl(355_89%_64%/0.6)]',
  sky: 'bg-sky text-white shadow-[0_6px_14px_-4px_hsl(199_89%_58%/0.6)]',
  grape: 'bg-grape text-white shadow-[0_6px_14px_-4px_hsl(265_80%_70%/0.6)]',
  mint: 'bg-mint text-white shadow-[0_6px_14px_-4px_hsl(152_56%_58%/0.6)]',
  sun: 'bg-sun text-white shadow-[0_6px_14px_-4px_hsl(43_96%_62%/0.6)]',
  orange: 'bg-orange text-white shadow-[0_6px_14px_-4px_hsl(25_95%_55%/0.6)]'
};

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 px-3 pointer-events-none">
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <div className="clay flex items-center justify-around gap-1 px-2 py-2">
          {items.map(({ to, label, icon: Icon, color }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2 min-w-[3.2rem] transition-all duration-200 ${isActive ? activeBg[color] + ' scale-105' : 'text-foreground/60 hover:bg-muted/60'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={2.4} className={isActive ? 'animate-pop-in' : ''} />
                  <span className="text-[10px] font-bold font-heading leading-none">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function BrandHeader({ title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <AppLogo />
      <div>
        <h1 className="font-heading font-extrabold text-xl leading-none text-foreground tracking-tight">{title || 'PawPulse'}</h1>
        {subtitle && <p className="text-xs text-muted-foreground font-semibold mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}