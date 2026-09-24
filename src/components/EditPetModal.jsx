import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Upload, Loader2, Cat, Dog, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { Image } from '@/components/ui/image';

const colorOptions = [
  { key: 'tan', label: 'Tan', dot: 'bg-tan' },
  { key: 'brown', label: 'Brown', dot: 'bg-brown' },
  { key: 'yellow', label: 'Yellow', dot: 'bg-yellow' },
  { key: 'orange', label: 'Orange', dot: 'bg-orange' },
  { key: 'black', label: 'Black', dot: 'bg-black' }
];

export default function EditPetModal({ pet, onClose, onSaved, onDeleted }) {
  const [photoUrl, setPhotoUrl] = useState(pet.photo_url || '');
  const [uploading, setUploading] = useState(false);
  const [species, setSpecies] = useState(pet.species || 'dog');
  const [breed, setBreed] = useState(pet.breed || '');
  const [age, setAge] = useState(pet.age || '');
  const [birthday, setBirthday] = useState(pet.birthday || '');
  const [color, setColor] = useState(pet.color || 'tan');
  const [name, setName] = useState(pet.name || '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!pet) return null;

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

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const updated = await base44.entities.Pet.update(pet.id, {
        name: name.trim(),
        species,
        breed: breed.trim(),
        age: age.trim(),
        birthday: birthday || undefined,
        photo_url: photoUrl,
        color
      });
      onSaved?.(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await base44.entities.Pet.delete(pet.id);
      onDeleted?.(pet.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-pop-in" onClick={onClose} />
      <div className="relative clay w-full max-w-md p-5 rounded-b-none sm:rounded-3xl animate-float-up max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl pp-gradient flex items-center justify-center">
              <Pencil size={18} className="text-white" />
            </div>
            <h2 className="font-heading font-extrabold text-lg">Edit Pet</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {!confirmDelete ? (
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
                    <span className="text-xs font-bold">Tap to change photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Pet Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Type a name…"
                className="clay-inset w-full mt-2 px-4 py-3.5 rounded-2xl text-base font-bold outline-none focus:ring-2 ring-coral" />
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
            <div className="flex gap-2 pt-1">
              <button onClick={() => setConfirmDelete(true)} className="clay-btn bg-destructive text-white px-4 py-3 flex items-center gap-1.5 font-heading font-bold text-sm" title="Discard pet">
                <Trash2 size={18} /> Discard
              </button>
              <button onClick={save} disabled={saving || !name.trim()} className="clay-btn pp-gradient text-white flex-1 py-3 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Pencil size={18} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-2xl bg-destructive/15 flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <div>
              <div className="font-heading font-extrabold text-lg">Discard {pet.name}?</div>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                This permanently removes {pet.name}'s profile. Their health logs, routines and reminders will stay but won't link back.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="clay-btn bg-muted text-foreground flex-1 py-3 font-heading font-bold">Cancel</button>
              <button onClick={remove} disabled={deleting} className="clay-btn bg-destructive text-white flex-1 py-3 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                {deleting ? 'Removing…' : 'Yes, Discard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}