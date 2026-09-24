import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, PawPrint, Mail, Phone, Users } from 'lucide-react';
import AppLogo from './AppLogo';

// Contact info (optional) helps link bookings to pet pros.
export default function ProfileGate() {
  const [checking, setChecking] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me?.display_name) {
          setNeedsProfile(true);
          setEmail(me?.email || '');
        }
      } catch (err) { console.error(err); }
      finally { setChecking(false); }
    })();
  }, []);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError('');
    try {
      await base44.auth.updateMe({
        display_name: trimmed,
        contact_email: email.trim(),
        contact_phone: phone.trim()
      });
      window.dispatchEvent(new CustomEvent('pawpulse:profile-updated', { detail: { name: trimmed } }));
      setNeedsProfile(false);
    } catch (err) {
      console.error(err);
      setError('Could not save — please try again.');
    } finally { setSaving(false); }
  };

  if (checking || !needsProfile) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" />
      <div className="relative clay w-full max-w-sm p-6 text-center animate-pop-in max-h-[92vh] overflow-y-auto">
        <AppLogo size={56} />
        <div className="font-heading font-extrabold text-xl mt-3">Welcome to PawPulse! 🐾</div>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          First things first — what should the community call you?
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Your name (e.g. Maya)"
          autoFocus
          className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral mt-4 text-center"
        />

        <div className="clay-inset p-3 rounded-2xl mt-4 flex gap-2 text-left">
          <Users size={16} className="text-sky shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-muted-foreground">
            Add your <span className="text-foreground font-bold">email &amp; phone (optional)</span> — it helps us link your info to
            <span className="text-foreground font-bold"> dog walkers, pet sitters &amp; more</span>, so the right pet pro always knows who to contact about your pet.
          </p>
        </div>

        <div className="space-y-2.5 mt-3">
          <div className="relative">
            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email (optional)"
              className="clay-inset w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-sky"
            />
          </div>
          <div className="relative">
            <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              placeholder="Phone (optional)"
              className="clay-inset w-full pl-11 pr-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-sky"
            />
          </div>
        </div>

        {error && <p className="text-xs font-bold text-destructive mt-2">{error}</p>}
        <button
          onClick={save}
          disabled={saving || !name.trim()}
          className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <PawPrint size={18} />} Start Exploring
        </button>
      </div>
    </div>
  );
}