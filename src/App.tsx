import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Dashboard } from './components/Dashboard';
import { LibraryManager } from './components/LibraryManager';
import { ChordSheetViewer } from './components/ChordSheetViewer';
import { PitchVisualizer } from './components/PitchVisualizer';
import { ChordSheetEditor } from './components/ChordSheetEditor';
import { SetlistManager } from './components/SetlistManager';
import { AICoachAgentPanel } from './components/AICoachAgentPanel';
import { Sparkles, Music, Mic, FileEdit, Calendar, Flame, Layout } from 'lucide-react';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'practice' | 'editor' | 'setlists'>('dashboard');
  useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 pb-20 sm:pb-0">
      {/* Top Header Navigation Bar (Print hidden) */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-950/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h1 className="text-base font-extrabold font-display text-slate-100 tracking-tight">Phineas</h1>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Guitar & Vocal Coach</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Layout size={14} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'library' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Music size={14} />
            Library
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'practice' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Mic size={14} />
            Practice Coach
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <FileEdit size={14} />
            Sheet Editor
          </button>
          <button
            onClick={() => setActiveTab('setlists')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'setlists' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Calendar size={14} />
            Setlists
          </button>
        </nav>

        {/* Practice Streak Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3.5 py-1.5 rounded-xl">
          <Flame size={14} className="text-amber-500 fill-current animate-pulse" />
          <span className="text-xs font-bold font-mono text-slate-300">5 Days</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        
        {activeTab === 'library' && (
          <LibraryManager onEditSongCallback={() => setActiveTab('editor')} />
        )}
        
        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
            <div className="lg:col-span-2 h-full">
              <ChordSheetViewer />
            </div>
            <div className="lg:col-span-1 overflow-y-auto max-h-full">
              <PitchVisualizer />
            </div>
          </div>
        )}
        
        {activeTab === 'editor' && (
          <ChordSheetEditor onSaveCallback={() => setActiveTab('library')} />
        )}
        
        {activeTab === 'setlists' && <SetlistManager />}
      </main>

      {/* Mobile Sticky Bottom Tab Bar (Print hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-around md:hidden print:hidden shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'dashboard' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Layout size={18} />
          Home
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'library' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Music size={18} />
          Songs
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'practice' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Mic size={18} />
          Coach
        </button>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'editor' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <FileEdit size={18} />
          Edit
        </button>
        <button
          onClick={() => setActiveTab('setlists')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold transition-all ${
            activeTab === 'setlists' ? 'text-indigo-400' : 'text-slate-500'
          }`}
        >
          <Calendar size={18} />
          Sets
        </button>
      </nav>

      {/* Floating Collapsible In-App AI Agent Panel */}
      <div className="print:hidden">
        <AICoachAgentPanel />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
