import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Heart, Trash2, ExternalLink, Plus, Check } from 'lucide-react';

export default function Wishlist() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');

  const load = async () => setItems(await base44.entities.WishlistItem.list('-created_date', 50));

  useEffect(() => {
    load();
    const unsub = base44.entities.WishlistItem.subscribe(() => load());
    return unsub;
  }, []);

  const addItem = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await base44.entities.WishlistItem.create({
      item_name: name.trim(),
      price: price ? Number(price) : undefined,
      url: url.trim() || undefined
    });
    setName(''); setPrice(''); setUrl('');
    load();
  };

  const togglePurchased = async (item) => {
    await base44.entities.WishlistItem.update(item.id, { purchased: !item.purchased });
    load();
  };

  const remove = async (id) => {
    await base44.entities.WishlistItem.delete(id);
    load();
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Heart size={16} className="text-coral" />
        <h3 className="font-heading font-extrabold text-base">Wishlist</h3>
        <span className="text-xs font-bold text-muted-foreground ml-1">
          {items ? `${items.filter(i => !i.purchased).length} to get` : ''}
        </span>
      </div>

      <form onSubmit={addItem} className="clay p-3 mb-3 flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name (e.g. Smart feeder)"
            className="clay-inset flex-1 px-3 py-2 text-sm font-semibold outline-none min-w-0"
            required
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$"
            type="number"
            min="0"
            step="0.01"
            className="clay-inset w-20 px-3 py-2 text-sm font-semibold outline-none"
          />
        </div>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste product link (optional)"
            className="clay-inset flex-1 px-3 py-2 text-sm font-semibold outline-none min-w-0"
          />
          <button type="submit" className="clay-btn pp-gradient text-white px-4 py-2 text-sm font-heading font-bold flex items-center gap-1 shrink-0">
            <Plus size={16} /> Add
          </button>
        </div>
      </form>

      {items && items.length === 0 && (
        <p className="text-center text-xs font-semibold text-muted-foreground py-3">
          Nothing saved yet — add items you're eyeing for later.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items?.map((item) => (
          <div key={item.id} className="clay-tight p-3 flex items-center gap-2.5">
            <button
              onClick={() => togglePurchased(item)}
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.purchased ? 'bg-mint text-white' : 'clay-inset text-transparent hover:text-muted-foreground/40'}`}
              aria-label="Mark as purchased"
            >
              <Check size={16} strokeWidth={3} />
            </button>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-heading font-bold truncate ${item.purchased ? 'line-through text-muted-foreground' : ''}`}>
                {item.item_name}
              </div>
              {item.price != null && (
                <div className="text-xs font-semibold text-muted-foreground">${item.price.toFixed(2)}</div>
              )}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-xl clay-inset flex items-center justify-center text-muted-foreground hover:text-sky shrink-0"
                aria-label="Open product link"
              >
                <ExternalLink size={15} />
              </a>
            )}
            <button
              onClick={() => remove(item.id)}
              className="w-8 h-8 rounded-xl clay-inset flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Delete wishlist item"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}