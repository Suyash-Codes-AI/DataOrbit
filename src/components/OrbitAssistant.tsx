import React, { useEffect, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

type Message = { role: 'user' | 'model'; text: string };

const suggestions = ['What can I do here?', 'How do I analyze a CSV?', 'Where are saved queries?'];

export const OrbitAssistant: React.FC = () => {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hi, I’m Orbit. Ask me how to navigate DataOrbit or use any feature.' },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text = input) => {
    const clean = text.trim();
    if (!clean || sending) return;
    const next = [...messages, { role: 'user' as const, text: clean }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const response = await fetch('/api/site-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages((current) => [...current, { role: 'model', text: data.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: 'model', text: error instanceof Error && error.message ? error.message : 'I am temporarily unavailable. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-12 right-4 z-50 sm:right-6">
      {open && (
        <section className={`orbit-chat mb-3 flex h-[min(520px,72vh)] w-[calc(100vw-2rem)] max-w-[370px] flex-col overflow-hidden rounded-3xl border shadow-2xl ${isDark ? 'border-slate-700/80 bg-[#101620] text-slate-100 shadow-black/40' : 'border-slate-200 bg-white text-slate-900 shadow-slate-400/25'}`} aria-label="Orbit website assistant">
          <header className={`flex items-center justify-between border-b px-4 py-3.5 ${isDark ? 'border-slate-700/70 bg-[#141c29]' : 'border-slate-200 bg-slate-50'}`}>
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                <Bot className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#141c29] bg-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold">Orbit assistant</h2>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Website guide · Online</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className={`rounded-lg p-2 transition ${isDark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-200'}`} aria-label="Close assistant"><X className="h-4 w-4" /></button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[86%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.role === 'user' ? 'rounded-br-md bg-blue-600 text-white' : isDark ? 'rounded-bl-md border border-slate-700 bg-[#182131] text-slate-200' : 'rounded-bl-md border border-slate-200 bg-slate-100 text-slate-700'}`}>{message.text}</div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} className={`rounded-full border px-2.5 py-1.5 text-[10px] transition ${isDark ? 'border-slate-700 text-slate-400 hover:border-blue-500/60 hover:text-blue-300' : 'border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600'}`}>{suggestion}</button>)}
              </div>
            )}
            {sending && <div className={`flex w-fit gap-1 rounded-2xl rounded-bl-md border px-3 py-3 ${isDark ? 'border-slate-700 bg-[#182131]' : 'border-slate-200 bg-slate-100'}`}><span className="orbit-dot" /><span className="orbit-dot" /><span className="orbit-dot" /></div>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); send(); }} className={`border-t p-3 ${isDark ? 'border-slate-700/70' : 'border-slate-200'}`}>
            <div className={`flex items-end gap-2 rounded-2xl border p-1.5 pl-3 ${isDark ? 'border-slate-700 bg-[#0c111a]' : 'border-slate-200 bg-slate-50'}`}>
              <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 1200))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows={1} placeholder="Ask about DataOrbit…" className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-xs outline-none placeholder:text-slate-500" />
              <button type="submit" disabled={!input.trim() || sending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-35" aria-label="Send message"><Send className="h-3.5 w-3.5" /></button>
            </div>
          </form>
        </section>
      )}

      <button onClick={() => setOpen((value) => !value)} className="orbit-launcher group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#316bc4] text-white shadow-xl shadow-blue-950/35 transition hover:-translate-y-1 hover:bg-[#3b78d4]" aria-label={open ? 'Close website assistant' : 'Open website assistant'} aria-expanded={open}>
        <span className="absolute inset-[-5px] rounded-full border border-blue-400/25" />
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-blue-100" />}
      </button>
    </div>
  );
};
