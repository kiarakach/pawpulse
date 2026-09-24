import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, ShoppingBag, HeartPulse, CalendarCheck, Users, MapPinned, Sparkles, Star, Salad } from 'lucide-react';
import AppLogo from './AppLogo';

const items = [
  { to: '/', label: 'Home', icon: HomeIcon, color: 'coral' },
  { to: '/health', label: 'Health Hub', icon: HeartPulse, color: 'grape' },
  { to: '/diet', label: 'Diet Doctor', icon: Salad, color: 'sky', badge: 'popular' },
  { to: '/routines', label: 'My Routines', icon: CalendarCheck, color: 'mint' },
  { to: '/nearby', label: 'Nearby', icon: MapPinned, color: 'orange' },
  { to: '/coach', label: 'Ask AI Vet', icon: Sparkles, color: 'yellow' },
  { to: '/community', label: 'Community', icon: Users, color: 'sun' },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, color: 'sky' }
];

const activeBg = {
  coral: 'bg-coral text-white shadow-[0_6px_14px_-4px_hsl(355_89%_64%/0.6)]',
  sky: 'bg-sky text-white shadow-[0_6px_14px_-4px_hsl(199_89%_58%/0.6)]',
  grape: 'bg-grape text-white shadow-[0_6px_14px_-4px_hsl(265_80%_70%/0.6)]',
  mint: 'bg-mint text-white shadow-[0_6px_14px_-4px_hsl(152_56%_58%/0.6)]',
  sun: 'bg-sun text-white shadow-[0_6px_14px_-4px_hsl(43_96%_62%/0.6)]',
  orange: 'bg-orange text-white shadow-[0_6px_14px_-4px_hsl(25_95%_55%/0.6)]',
  yellow: 'bg-yellow text-black shadow-[0_6px_14px_-4px_hsl(48_90%_55%/0.6)]'
};

export default function SideNav() {
  return (
    <nav className="fixed left-0 top-0 bottom-0 z-40 py-3 pl-3 pointer-events-none">
      <div className="clay h-full w-20 flex flex-col items-center gap-1 py-3 pointer-events-auto overflow-y-auto scrollbar-hide">
        <AppLogo className="mb-2" />
        {items.map(({ to, label, icon: Icon, color, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-2.5 w-16 shrink-0 transition-all duration-200 ${isActive ? activeBg[color] + ' scale-105' : 'text-foreground/60 hover:bg-muted/60'}`
            }
          >
            {({ isActive }) => (
              <>
                {badge && (
                  <span className="absolute -top-1.5 -right-1 z-10 flex items-center gap-0.5 rounded-full bg-sun px-1 py-0.5 text-[6px] font-extrabold font-heading tracking-tight text-foreground shadow-[0_3px_8px_-2px_hsl(25_95%_55%/0.7)] border border-white/70 animate-pop-in">
                    <Star size={6} className="fill-foreground" />Popular
                  </span>
                )}
                <Icon size={20} strokeWidth={2.4} className={isActive ? 'animate-pop-in' : ''} />
                <span className="text-[10px] font-bold font-heading leading-tight text-center">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}