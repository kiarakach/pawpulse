import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Sparkles, Upload, Wand2, Loader2, Cat, Dog } from 'lucide-react';
import { Image } from '@/components/ui/image';

const colorOptions = [
  { key: 'tan', label: 'Tan', dot: 'bg-tan' },
  { key: 'brown', label: 'Brown', dot: 'bg-brown' },
  { key: 'yellow', label: 'Yellow', dot: 'bg-yellow' },
  { key: 'orange', label: 'Orange', dot: 'bg-orange' },
  { key: 'black', label: 'Black', dot: 'bg-black' }
];

export default function AddPetModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [birthday, setBirthday] = useState('');
  const [color, setColor] = useState('tan');
  const [name, setName] = useState('');
  const [names, setNames] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const reset = () => {
    setStep(1); setPhotoUrl(''); setBreed(''); setAge(''); setBirthday(''); setColor('tan');
    setName(''); setNames([]); setSpecies('dog');
  };

  const close = () => { reset(); onClose(); };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const generateNames = async () => {
    setGenerating(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Suggest 6 fun, catchy pet names for a ${breed || species}. They should be adorable, family-friendly, and fit a playful pet care app called PawPulse. Mix of cute and cool.`,
        response_json_schema: {
          type: 'object',
          properties: {
            names: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setNames(res?.names || []);
    } catch (err) {
      console.error(err);
      setNames(['Biscuit', 'Marshmallow', 'Pixel', 'Mochi', 'Ziggy', 'Pickle']);
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const pet = await base44.entities.Pet.create({
        name: name.trim(),
        species,
        breed: breed.trim(),
        age: age.trim(),
        birthday: birthday || undefined,
        photo_url: photoUrl,
        color
      });
      onCreated?.(pet);
      close();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-pop-in" onClick={close} />
      <div className="relative clay w-full max-w-md p-5 rounded-b-none sm:rounded-3xl animate-float-up max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl pp-gradient flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <h2 className="font-heading font-extrabold text-lg">Welcome a New Pet!</h2>
          </div>
          <button onClick={close} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {/* step dots */}
        <div className="flex gap-1.5 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-coral' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pet Photo</label>
              <label className="mt-2 block clay-inset h-40 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden">
                {photoUrl ? (
                  <Image src={photoUrl} fittingType="fill" className="w-full h-full" />
                ) : uploading ? (
                  <Loader2 className="animate-spin text-coral" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload size={28} className="mx-auto mb-1" />
                    <span className="text-xs font-bold">Tap to add a cute photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pet Type</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { key: 'dog', label: 'Dog', icon: Dog },
                  { key: 'cat', label: 'Cat', icon: Cat }
                ].map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => setSpecies(key)}
                    className={`clay-tight py-3 flex flex-col items-center gap-1 font-heading font-bold transition-all ${species === key ? 'bg-sky text-white scale-105' : ''}`}>
                    <Icon size={22} />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Breed</label>
                <input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="e.g. Golden Retriever"
                  className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Age</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2 yrs"
                  className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Birthday (optional)</label>
              <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)}
                className="clay-inset w-full mt-2 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Accent Color</label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((c) => (
                  <button key={c.key} onClick={() => setColor(c.key)}
                    className={`w-9 h-9 rounded-full ${c.dot} transition-all ${color === c.key ? 'ring-4 ring-offset-2 ring-foreground/30 scale-110' : ''}`} />
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold text-base">
              Next: Name Your Pet
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pet Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type a name…"
                className="clay-inset w-full mt-2 px-4 py-3.5 rounded-2xl text-base font-bold outline-none focus:ring-2 ring-coral" />
            </div>
            <button onClick={generateNames} disabled={generating}
              className="clay-btn bg-grape text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
              {generating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
              {generating ? 'Generating magic names…' : 'Generate Fun Names ✨'}
            </button>
            {names.length > 0 && (
              <div className="flex flex-wrap gap-2 animate-float-up">
                {names.map((n) => (
                  <button key={n} onClick={() => setName(n)}
                    className={`clay-tight px-4 py-2.5 text-sm font-heading font-bold transition-all ${name === n ? 'bg-sun text-white scale-105' : ''}`}>
                    {n}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="clay-btn bg-muted text-foreground flex-1 py-3 font-heading font-bold">Back</button>
              <button onClick={() => setStep(3)} disabled={!name.trim()} className="clay-btn pp-gradient text-white flex-[2] py-3 font-heading font-bold disabled:opacity-50">
                Review
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="clay-tight p-4 flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted">
                {photoUrl ? <Image src={photoUrl} fittingType="fill" className="w-full h-full" /> : (
                  <div className="w-full h-full flex items-center justify-center text-coral">
                    {species === 'cat' ? <Cat size={32} /> : <Dog size={32} />}
                  </div>
                )}
              </div>
              <div>
                <div className="font-heading font-extrabold text-xl">{name}</div>
                <div className="text-sm text-muted-foreground font-semibold capitalize">
                  {species}{breed ? ` · ${breed}` : ''}{age ? ` · ${age}` : ''}
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground font-semibold">
              Ready to add {name} to your PawPulse family? 🐾
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep(2)} className="clay-btn bg-muted text-foreground flex-1 py-3 font-heading font-bold">Back</button>
              <button onClick={save} disabled={saving} className="clay-btn pp-gradient text-white flex-[2] py-3 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {saving ? 'Adding…' : 'Add My Pet!'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}