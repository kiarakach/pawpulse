import React from 'react';
import { PawPrint, Sparkles } from 'lucide-react';

export default function CoachMessage({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isUser ? 'bg-coral/15 text-coral' : 'pp-gradient text-white'}`}>
        {isUser ? <PawPrint size={16} /> : <Sparkles size={16} />}
      </div>
      <div className={`clay-tight px-4 py-2.5 max-w-[80%] text-sm font-semibold whitespace-pre-wrap break-words ${isUser ? 'bg-coral text-white' : ''} ${message.error ? 'bg-destructive/10 text-destructive' : ''}`}>
        {message.text}
      </div>
    </div>
  );
}