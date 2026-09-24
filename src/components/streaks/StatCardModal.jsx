import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';
import { Instagram, Loader2, RefreshCw, Camera } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function StatCardModal({ open, onClose, pets = [], badges = [], weekActions = [] }) {
  const latest = badges[badges.length - 1] || null;
  const [pet, setPet] = useState(pets[0] || null);
  const [cardUrl, setCardUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    if (open) {
      setCardUrl(latest?.stat_card_url || '');
      setShareMsg('');
      if (latest && !latest.stat_card_url) generate();
    }
  }, [open]);

  const petCounts = (type) =>
    weekActions.filter((a) => a.action_type === type && (!pet || !a.pet_name || a.pet_name === pet.name)).length;

  const generate = async () => {
    if (!latest || generating) return;
    setGenerating(true);
    setShareMsg('');
    try {
      const petName = pet?.name || 'My Pet';
      const counts = {
        walks: petCounts('walk'),
        meals: petCounts('meal_log'),
        vaccinations: petCounts('vaccination'),
        ai: weekActions.filter((a) => a.action_type === 'ai_doctor').length
      };
      const prompt = [
        'Trendy vertical Instagram story graphic, 9:16 portrait, for a pet care app called PawPulse.',
        'Gen-Z Instagram aesthetic: bold rounded playful typography, chunky sticker shapes, vibrant gradient background from coral pink to warm sunny yellow with soft pastel blobs, confetti and paw print stickers scattered around.',
        `Top headline in huge bold letters: "${petName}'s Week"`,
        pet?.photo_url
          ? 'Hero: the pet from the attached photo, in a big rounded circular frame with a thick white sticker border, centered.'
          : 'Hero: a cute happy cartoon dog and cat illustration centered.',
        `Stat callouts as bold sticker bubbles: "${counts.walks} walks", "${counts.meals} meals logged", "${counts.vaccinations} vaccinations", "${counts.ai} AI questions".`,
        `Bottom banner text: "Week ${latest.streak_number} streak" with a fire emoji and a small "PawPulse" wordmark.`,
        'High contrast, fun, colorful, premium social media design.'
      ].join(' ');

      const res = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: pet?.photo_url ? [pet.photo_url] : undefined
      });
      const url = res?.url || '';
      if (!url) throw new Error('no image returned');
      setCardUrl(url);
      await base44.entities.StreakBadge.update(latest.id, { stat_card_url: url });
    } catch (err) {
      console.error(err);
      setShareMsg('Could not design the card — tap "New design" to retry.');
    } finally {
      setGenerating(false);
    }
  };

  const share = async () => {
    if (!cardUrl) return;
    setShareMsg('');
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], 'pawpulse-stat-card.jpg', { type: blob.type || 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${pet?.name || 'My pet'}'s week on PawPulse`,
            text: `${pet?.name || 'My pet'}'s week on PawPulse 🐾`
          });
        } catch (err) {
          return; // user dismissed the share sheet
        }
        setShareMsg('Pick Instagram in the share sheet to post it 📸');
        return;
      }
    } catch (err) {
      console.error(err);
    }
    const a = document.createElement('a');
    a.href = cardUrl;
    a.download = 'pawpulse-stat-card.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShareMsg('Image saved! Open Instagram and add it to your story 📸');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-[1.75rem] bg-card p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-2 text-left">
          <DialogTitle className="font-heading font-extrabold text-lg flex items-center gap-2">
            {latest?.badge_emoji || '🏆'} {latest?.badge_name || 'Pet Stat Card'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground font-semibold">
            Week {latest?.streak_number} streak · your shareable Insta story card
          </p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-3">
          {pets.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {pets.map((p) => (
                <button key={p.id} onClick={() => { setPet(p); setCardUrl(''); }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-heading font-bold transition-all ${
                    pet?.id === p.id ? 'pp-gradient text-white scale-105' : 'clay-inset text-muted-foreground'
                  }`}>
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <div className="rounded-[1.5rem] overflow-hidden clay-inset w-full max-w-[300px] aspect-[9/16] mx-auto flex items-center justify-center">
            {generating ? (
              <div className="text-center px-6">
                <Loader2 size={28} className="animate-spin text-coral mx-auto mb-2" />
                <p className="text-xs font-heading font-bold">Designing your stat card… ✨</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-1">AI is making it Insta-ready</p>
              </div>
            ) : cardUrl ? (
              <Image src={cardUrl} fittingType="fit" className="w-full h-full" />
            ) : (
              <div className="text-center px-6">
                <Camera size={28} className="text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs font-semibold text-muted-foreground">Tap "New design" to create your card.</p>
              </div>
            )}
          </div>

          <button onClick={share} disabled={!cardUrl || generating}
            className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-50">
            <Instagram size={18} /> Share on Instagram
          </button>

          <button onClick={generate} disabled={generating}
            className="clay-btn clay-inset w-full py-2.5 text-xs font-heading font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={13} className={generating ? 'animate-spin' : ''} /> New design
          </button>

          {shareMsg && <p className="text-xs text-center font-semibold text-accent-foreground">{shareMsg}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}