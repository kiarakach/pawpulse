import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import { Users, Plus, Heart, MessageCircle, Send, Upload, Loader2, Cat, Dog, X, Lightbulb } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ caption: '', tip: '', species: 'dog', petName: '', imageUrl: '', uploading: false });
  const [commenting, setCommenting] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [myName, setMyName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setMyName(me?.display_name || '');
      } catch (err) { console.error(err); }
    })();
    const onProfile = (e) => setMyName(e.detail?.name || '');
    window.addEventListener('pawpulse:profile-updated', onProfile);
    return () => window.removeEventListener('pawpulse:profile-updated', onProfile);
  }, []);

  const showName = (n) => (n === 'You' && myName ? myName : n);

  const load = async () => {
    try {
      const list = await base44.entities.CommunityPost.list('-created_date', 50);
      setPosts(list);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, uploading: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((f) => ({ ...f, imageUrl: file_url, uploading: false }));
    } catch (err) { console.error(err); setForm((f) => ({ ...f, uploading: false })); }
  };

  const post = async () => {
    if (!form.caption.trim()) return;
    setSaving(true);
    try {
      const created = await base44.entities.CommunityPost.create({
        author_name: myName || 'You',
        pet_name: form.petName.trim() || 'My Pet',
        species: form.species,
        image_url: form.imageUrl,
        caption: form.caption.trim(),
        tip: form.tip.trim(),
        likes: 0,
        comments: []
      });
      setPosts((p) => [created, ...p]);
      setForm({ caption: '', tip: '', species: 'dog', petName: '', imageUrl: '', uploading: false });
      setShowForm(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const like = async (p) => {
    const updated = await base44.entities.CommunityPost.update(p.id, { likes: (p.likes || 0) + 1 });
    setPosts((arr) => arr.map((x) => (x.id === p.id ? updated : x)));
  };

  const addComment = async (p) => {
    if (!commentText.trim()) return;
    const newComment = { author: myName || 'You', text: commentText.trim() };
    const updated = await base44.entities.CommunityPost.update(p.id, {
      comments: [...(p.comments || []), newComment]
    });
    setPosts((arr) => arr.map((x) => (x.id === p.id ? updated : x)));
    setCommentText('');
    setCommenting(null);
  };

  return (
    <div className="animate-float-up">
      <div className="flex items-center justify-between">
        <BrandHeader title="Pet Community" subtitle="Share photos, tips & love" />
        <button onClick={() => setShowForm(true)} className="w-11 h-11 rounded-2xl pp-gradient text-white flex items-center justify-center clay-btn">
          <Plus size={22} strokeWidth={3} />
        </button>
      </div>

      {/* Featured tip banner */}
      <div className="clay p-4 mb-4 bg-gradient-to-br from-sun/20 to-cream flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sun text-white flex items-center justify-center clay-btn"><Lightbulb size={20} /></div>
        <div>
          <div className="font-heading font-bold text-sm">Tip of the day 💡</div>
          <p className="text-xs text-muted-foreground font-semibold">Share what works for your pet — a small tip can help a whole pack of pet parents!</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground font-semibold">Loading posts…</div>
      ) : posts.length === 0 ? (
        <div className="clay p-8 text-center">
          <Users size={40} className="text-coral mx-auto mb-3" />
          <div className="font-heading font-extrabold text-lg">Be the first to post!</div>
          <p className="text-sm text-muted-foreground font-semibold mt-1">Share a photo or a tip about your pet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <div key={p.id} className="clay p-0 overflow-hidden animate-float-up">
              <div className="p-3.5 flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-coral to-sun text-white flex items-center justify-center font-heading font-bold">
                  {(showName(p.author_name) || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm flex items-center gap-1.5">
                    {showName(p.author_name)}
                    <span className="text-muted-foreground font-normal">·</span>
                    <span className="text-muted-foreground font-semibold flex items-center gap-1">
                      {p.species === 'cat' ? <Cat size={12} /> : <Dog size={12} />} {p.pet_name}
                    </span>
                  </div>
                </div>
              </div>

              {p.image_url && (
                <div className="aspect-square bg-muted">
                  <Image src={p.image_url} fittingType="fill" className="w-full h-full" />
                </div>
              )}

              <div className="p-3.5">
                <p className="text-sm font-semibold leading-relaxed">{p.caption}</p>
                {p.tip && (
                  <div className="mt-2 clay-inset p-3 rounded-2xl flex gap-2">
                    <Lightbulb size={15} className="text-sun shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-muted-foreground">{p.tip}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <button onClick={() => like(p)} className="flex items-center gap-1.5 text-sm font-heading font-bold transition-all active:scale-90">
                    <Heart size={18} className="text-coral fill-coral" /> {p.likes || 0}
                  </button>
                  <button onClick={() => setCommenting(commenting === p.id ? null : p.id)} className="flex items-center gap-1.5 text-sm font-heading font-bold text-muted-foreground transition-all active:scale-90">
                    <MessageCircle size={18} /> {(p.comments?.length) || 0}
                  </button>
                </div>

                {p.comments?.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {p.comments.map((c, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-heading font-bold">{showName(c.author)}: </span>
                        <span className="text-muted-foreground font-semibold">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {commenting === p.id && (
                  <div className="flex gap-2 mt-3 animate-pop-in">
                    <input value={commenting === p.id ? commentText : ''} onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addComment(p)}
                      placeholder="Add a kind comment…"
                      className="clay-inset flex-1 px-3 py-2.5 rounded-2xl text-xs font-semibold outline-none focus:ring-2 ring-coral" />
                    <button onClick={() => addComment(p)} className="w-10 h-10 rounded-2xl bg-coral text-white flex items-center justify-center clay-btn">
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New post modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-pop-in" onClick={() => setShowForm(false)} />
          <div className="relative clay w-full max-w-md p-5 rounded-b-none sm:rounded-3xl animate-float-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-extrabold text-lg">Share a Post</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full clay-inset flex items-center justify-center text-muted-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                {[{ k: 'dog', label: 'Dog', icon: Dog }, { k: 'cat', label: 'Cat', icon: Cat }].map(({ k, label, icon: Icon }) => (
                  <button key={k} onClick={() => setForm((f) => ({ ...f, species: k }))}
                    className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 font-heading font-bold text-sm transition-all ${form.species === k ? 'bg-coral text-white scale-105' : 'clay-inset'}`}>
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
              <input value={form.petName} onChange={(e) => setForm((f) => ({ ...f, petName: e.target.value }))}
                placeholder="Pet's name" className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
              <label className="block clay-inset h-36 rounded-3xl flex items-center justify-center cursor-pointer overflow-hidden">
                {form.imageUrl ? (
                  <Image src={form.imageUrl} fittingType="fill" className="w-full h-full" />
                ) : form.uploading ? (
                  <Loader2 className="animate-spin text-coral" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload size={26} className="mx-auto mb-1" />
                    <span className="text-xs font-bold">Add a pet photo</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={upload} />
              </label>
              <textarea value={form.caption} onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                placeholder="Write a caption…" rows={2} className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral resize-none" />
              <input value={form.tip} onChange={(e) => setForm((f) => ({ ...f, tip: e.target.value }))}
                placeholder="Share a tip? (optional)" className="clay-inset w-full px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral" />
              <button onClick={post} disabled={saving || !form.caption.trim()} className="clay-btn pp-gradient text-white w-full py-3.5 font-heading font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Post it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}