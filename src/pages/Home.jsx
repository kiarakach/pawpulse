import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import PetCard from '@/components/PetCard';
import AddPetModal from '@/components/AddPetModal';
import StreakCard from '@/components/streaks/StreakCard';
import { trackAction } from '@/lib/streaks';
import TodayCard from '@/components/home/TodayCard';
import NotificationPermissionCard from '@/components/NotificationPermissionCard';
import DateBanner from '@/components/DateBanner';
import { Plus, HeartPulse, MapPinned, Salad, Sparkles, PawPrint, Stethoscope } from 'lucide-react';
import AppLogo, { LOGO_URL } from '@/components/AppLogo';
import { Image } from '@/components/ui/image';
import { Link } from 'react-router-dom';

export default function Home() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [showNotifCard, setShowNotifCard] = useState(false);

  const notificationsAllowed = () => typeof Notification !== 'undefined' && Notification.permission === 'granted';

  const load = async () => {
    try {
      const list = await base44.entities.Pet.list('-created_date', 50);
      setPets(list);
      return list;
    } catch (err) {
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const list = await load();
      if (list.length && !notificationsAllowed()) setShowNotifCard(true);
    })();
    trackAction('app_open');
  }, []);

  const handlePetCreated = async () => {
    await load();
    if (!notificationsAllowed()) setShowNotifCard(true);
  };

  return (
    <div className="animate-float-up">
      <DateBanner pets={pets} />
      {/* Hero banner */}
      <div className="clay p-5 mb-5 overflow-hidden relative bg-gradient-to-br from-coral/15 via-cream to-sky/15">
        <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none w-28 h-28 mix-blend-multiply">
          <Image src={LOGO_URL} className="w-full h-full" focalPointX={0.5} focalPointY={0.3} />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <AppLogo size={40} />
          <span className="font-heading font-extrabold text-2xl tracking-tight">PawPulse:           </span>
        </div>
        <h2 className="font-heading font-extrabold text-lg leading-tight mt-2">
          Welcome, <span className="text-coral">Pet Owner</span>
        </h2>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          Your all-in-one hub for pet care, health & fun! 🐾
        </p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-extrabold text-lg">My Pets</h3>
        <button onClick={() => setAddOpen(true)} className="clay-btn pp-gradient text-white px-4 py-2.5 flex items-center gap-1.5 text-sm font-heading font-bold">
          <Plus size={16} strokeWidth={3} /> Add Pet
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-xs font-semibold text-muted-foreground">🐠 Fish &amp; 🐹 Hamster options coming soon!</span>
      </div>

      {loading ?
      <div className="text-center py-10 text-muted-foreground font-semibold">Loading your pets…</div> :
      pets.length === 0 ?
      <button onClick={() => setAddOpen(true)} className="clay w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-coral/15 flex items-center justify-center mx-auto mb-3">
            <PawPrint size={32} className="text-coral" />
          </div>
          <div className="font-heading font-extrabold text-lg">Add your first pet!</div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">Let's set up a profile and meet your furry friend ✨</p>
        </button> :

      <div className="grid grid-cols-2 gap-3">
          {pets.map((p) =>
        <PetCard key={p.id} pet={p} onChanged={load} />
        )}
        </div>
      }

      {!loading && pets.length > 0 && (
        <div className="mt-7"><TodayCard pets={pets} /></div>
      )}
      {/* Quick links */}
      <h3 className="font-heading font-extrabold text-lg mt-7 mb-3">My Quick Links</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/health" className="clay p-3 text-center">
          <div className="w-11 h-11 rounded-2xl bg-grape text-white flex items-center justify-center mx-auto mb-2 clay-btn"><HeartPulse size={20} /></div>
          <div className="text-xs font-heading font-bold">My Pet's Health Hub</div>
        </Link>
        <Link to="/diet" className="clay p-3 text-center">
          <div className="w-11 h-11 rounded-2xl bg-sky text-white flex items-center justify-center mx-auto mb-2 clay-btn"><Salad size={20} /></div>
          <div className="text-xs font-heading font-bold">My Pet's Diet Doctor</div>
        </Link>
        <Link to="/nearby" className="clay p-3 text-center">
          <div className="w-11 h-11 rounded-2xl bg-orange text-white flex items-center justify-center mx-auto mb-2 clay-btn"><MapPinned size={20} /></div>
          <div className="text-xs font-heading font-bold">Nearby</div>
        </Link>
        <Link to="/coach" className="clay p-3 text-center">
          <div className="w-11 h-11 rounded-2xl bg-mint text-white flex items-center justify-center mx-auto mb-2 clay-btn"><Stethoscope size={20} /></div>
          <div className="text-xs font-heading font-bold">Ask AI Vet</div>
        </Link>
      </div>

      {!loading && pets.length > 0 && <div className="mt-7"><StreakCard pets={pets} /></div>}

      <div className="clay p-4 mt-5 flex items-center gap-3 bg-gradient-to-br from-sun/15 to-cream">
        <div className="w-10 h-10 rounded-xl bg-sun text-white flex items-center justify-center clay-btn">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="font-heading font-bold text-sm">New pet? We'll help!</div>
          <div className="text-xs text-muted-foreground font-semibold">Generate a fun name & set up a profile in seconds.</div>
        </div>
      </div>

      <AddPetModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={handlePetCreated} />
      {showNotifCard && <NotificationPermissionCard onDone={() => setShowNotifCard(false)} />}
    </div>);

}