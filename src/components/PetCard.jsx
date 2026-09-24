import React, { useState } from 'react';
import { Image } from '@/components/ui/image';
import { Pencil } from 'lucide-react';
import EditPetModal from './EditPetModal';

const colorGradient = {
  tan: 'from-yellow/25 to-orange/20',
  brown: 'from-brown/25 to-tan/20',
  yellow: 'from-yellow/30 to-orange/20',
  orange: 'from-orange/30 to-yellow/20',
  black: 'from-black/15 to-brown/15'
};

export default function PetCard({ pet, onChanged }) {
  const [editing, setEditing] = useState(false);
  const gradient = colorGradient[pet.color] || colorGradient.tan;

  return (
    <>
      <div className={`clay text-left p-0 overflow-hidden w-40 relative bg-gradient-to-br ${gradient} animate-float-up`}>
        <button
          onClick={() => setEditing(true)}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-foreground clay-btn"
          title="Edit pet"
        >
          <Pencil size={15} />
        </button>
        <div className="aspect-[2.5/2] bg-white/40 relative">
          {pet.photo_url ? (
            <Image src={pet.photo_url} fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {pet.species === 'cat' ? '🐱' : '🐶'}
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="font-heading font-extrabold text-base leading-tight">{pet.name}</div>
          <div className="text-xs text-muted-foreground font-semibold mt-0.5 capitalize">
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}{pet.age ? ` · ${pet.age}` : ''}
          </div>
        </div>
      </div>

      {editing && (
        <EditPetModal
          pet={pet}
          onClose={() => setEditing(false)}
          onSaved={onChanged}
          onDeleted={onChanged}
        />
      )}
    </>
  );
}