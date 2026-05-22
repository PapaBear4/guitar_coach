/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Mic, MicOff, Send, MessageSquare, X, Sparkles } from 'lucide-react';

export const AICoachAgentPanel: React.FC = () => {
  const { chatMessages, sendChatMessage, isAgentTyping } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAgentTyping, isOpen]);

  // Setup Web Speech API for voice commands
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        // Automatically send the voice note after recognition
        if (transcript.trim()) {
          sendChatMessage(transcript);
          setInputText('');
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [sendChatMessage]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const executeShortcut = (cmd: string) => {
    sendChatMessage(cmd);
  };

  const shortcuts = [
    { label: 'Transpose Up 1', cmd: 'transpose up 1' },
    { label: 'Tuning: Eb', cmd: 'change tuning to Eb standard' },
    { label: 'Tuning: Baritone', cmd: 'change tuning to baritone' },
    { label: 'Calculate Capo', cmd: 'suggest capo' },
    { label: 'New Setlist', cmd: 'create setlist Sunday Service' },
    { label: 'Log Practice Note', cmd: 'log note practice chorus transitions' },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 hover:scale-105 transition-all duration-200"
          aria-label="Open Phineas Coach AI"
        >
          <div className="relative">
            <MessageSquare size={24} />
            <span className="absolute -top-2 -right-2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
        </button>
      )}

      {/* Main Agent Sidebar */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-display">Phineas</h2>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                In-App AI Coach Active
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-900 to-slate-950">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div
                className={`p-3 rounded-2xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                }`}
              >
                {/* Format bullet points from agent responses */}
                {msg.text.split('\n').map((line, idx) => (
                  <p key={idx} className={line.startsWith('•') ? 'ml-2 pl-1 list-item' : 'mb-1'}>
                    {line}
                  </p>
                ))}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 px-1">
                {msg.timestamp}
                {msg.actionExecuted && (
                  <span className="ml-2 font-mono text-[9px] bg-slate-800 text-indigo-400 border border-indigo-900 px-1.5 py-0.5 rounded-full uppercase font-bold">
                    Tool: {msg.actionExecuted}
                  </span>
                )}
              </span>
            </div>
          ))}

          {/* Typing Indicator */}
          {isAgentTyping && (
            <div className="flex items-center gap-1.5 bg-slate-800 text-slate-400 p-3 rounded-2xl rounded-bl-none max-w-[70px] border border-slate-700">
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Shortcuts Panel */}
        <div className="p-3 border-t border-slate-800 bg-slate-900">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Shortcut Commands</p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {shortcuts.map((shortcut, index) => (
              <button
                key={index}
                onClick={() => executeShortcut(shortcut.cmd)}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-150"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title={isListening ? "Stop listening" : "Talk to Phineas (Voice Command)"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? "Listening..." : "Tell Phineas what to do..."}
            className="flex-1 bg-slate-900 text-slate-100 text-sm placeholder-slate-500 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          <button
            type="submit"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 transition-all duration-150"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
};
