import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { BrandHeader } from '@/components/BottomNav';
import CoachMessage from '@/components/coach/CoachMessage';
import { Sparkles, SendHorizonal, Loader2, PawPrint } from 'lucide-react';
import { trackAction } from '@/lib/streaks';

const SUGGESTIONS = [
  'How often should I bathe my dog?',
  'Why is my cat scratching the couch?',
  'How do I stop my puppy from biting?',
  'How do I introduce a new pet to my home?'
];

export default function Coach() {
  const [pets, setPets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    base44.entities.Pet.list('-created_date', 50)
      .then(setPets)
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const ask = async (text) => {
    const question = (text ?? input).trim();
    if (!question || thinking) return;
    setInput('');
    const next = [...messages, { role: 'user', text: question }];
    setMessages(next);
    setThinking(true);
    try {
      const petContext = pets.length
        ? `The user's pets: ${pets.map((p) => `${p.name} (${p.species}${p.breed ? ', ' + p.breed : ''}${p.age ? ', age ' + p.age : ''})`).join('; ')}.`
        : 'The user has not added any pets yet.';
      const history = next.slice(-6).map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          'You are PawPulse\'s friendly AI pet care coach. Give warm, practical, safe advice about dogs and cats in easy language with a positive tone. Keep answers concise (under 150 words). Tailor advice to the user\'s own pets when relevant. If the question describes an emergency or urgent health issue, tell them to contact their vet right away.\n\n' +
          petContext +
          '\n\nConversation so far:\n' +
          history +
          '\n\nRespond to the user\'s latest message.'
      });
      const answer = typeof res === 'string' ? res : res?.response || '';
      setMessages((prev) => [...prev, { role: 'coach', text: answer }]);
      trackAction('ai_doctor');
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: 'coach', text: "Sorry, I couldn't answer that — please try again in a moment.", error: true }
      ]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="animate-float-up flex flex-col min-h-[calc(100vh-2.5rem)]">
      <BrandHeader title="AI Care Coach" subtitle="Ask anything about your pets" />

      <div className="clay flex-1 p-4 mb-4">
        {messages.length === 0 && !thinking ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-2xl pp-gradient flex items-center justify-center mx-auto mb-3 text-white">
              <PawPrint size={32} />
            </div>
            <div className="font-heading font-extrabold text-lg">Hi! I'm your care coach 🐾</div>
            <p className="text-sm text-muted-foreground font-semibold mt-1 max-w-xs mx-auto">
              Ask me anything about your pets — feeding, behavior, training, grooming and more.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => ask(s)}
                  className="clay-tight px-3.5 py-2 text-xs font-heading font-bold text-left transition-all hover:scale-105">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => <CoachMessage key={i} message={m} />)}
            {thinking && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-xl pp-gradient flex items-center justify-center text-white shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="clay-tight px-4 py-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-semibold">Thinking…</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-3">
        <div className="clay p-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask()}
            placeholder="Ask a pet question…"
            className="clay-inset flex-1 px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 ring-coral"
          />
          <button onClick={() => ask()} disabled={thinking || !input.trim()}
            className="clay-btn pp-gradient text-white w-12 h-12 shrink-0 flex items-center justify-center disabled:opacity-50">
            {thinking ? <Loader2 size={18} className="animate-spin" /> : <SendHorizonal size={18} />}
          </button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground font-semibold mt-1.5">
          For urgent health issues, always contact your vet.
        </p>
      </div>
    </div>
  );
}