import React from 'react';
import { useApp } from '../context/AppContext';
import { Play, Mic, Flame, BookOpen, History, Heart, ChevronRight } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: 'dashboard' | 'library' | 'practice' | 'editor' | 'setlists') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { songs, setlists, vocalRange, vocalRangeHistory, setActiveSongId } = useApp();

  // Find recent practice notes across all songs
  const recentNotes: { songTitle: string; note: string; songId: string }[] = [];
  songs.forEach(song => {
    if (song.notes && song.notes.length > 0) {
      song.notes.slice(0, 2).forEach(note => {
        recentNotes.push({
          songTitle: song.title,
          note,
          songId: song.id
        });
      });
    }
  });

  // Sort notes so we show a few
  const displayedNotes = recentNotes.slice(0, 3);

  // Classify vocal type based on high note
  const getVocalType = (maxNote: string): string => {
    const note = maxNote.slice(0, -1);
    const octave = parseInt(maxNote.slice(-1), 10);
    
    if (octave >= 5) return 'Soprano / Mezzo-Soprano';
    if (octave === 4 && ['A', 'A#', 'B'].includes(note)) return 'Tenor';
    if (octave === 4 && ['F', 'F#', 'G', 'G#'].includes(note)) return 'Baritone-Tenor';
    if (octave === 4 && ['C', 'C#', 'D', 'D#', 'E'].includes(note)) return 'Baritone';
    return 'Bass';
  };

  const vocalClassification = getVocalType(vocalRange.max);

  const startPracticingSong = (songId: string) => {
    setActiveSongId(songId);
    setActiveTab('practice');
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 to-violet-800 border border-indigo-700/30 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm">
            <Flame size={12} className="text-amber-400" />
            5-Day Practice Streak!
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-display leading-tight">
            Ready for your next gig set?
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Listen to your pitch, adjust capo settings for Standard, Eb, or Baritone tunings, and transcribe your notes hands-free.
          </p>
          
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('practice')}
              className="flex items-center gap-2 bg-white text-indigo-950 font-bold text-xs px-5 py-2.5 rounded-2xl shadow-lg hover:scale-105 transition-all"
            >
              <Play size={14} className="fill-current" />
              Tune & Practice
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className="flex items-center gap-2 bg-indigo-700/50 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl border border-indigo-500/30 transition-all"
            >
              <BookOpen size={14} />
              Open Song Library
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-violet-500/20 to-transparent blur-3xl rounded-full"></div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Songs</span>
          <span className="text-3xl font-extrabold text-slate-100 font-display mt-2">{songs.length}</span>
          <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-0.5">
            Active in Gig Sets
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vocal Range</span>
          <span className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display mt-2">
            {vocalRange.min} - {vocalRange.max}
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {vocalClassification} classification
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Tuning</span>
          <span className="text-xl font-extrabold text-slate-100 font-display mt-2">Standard E</span>
          <span className="text-[10px] text-slate-500">Eb & Baritone configured</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between h-28">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Sets</span>
          <span className="text-3xl font-extrabold text-slate-100 font-display mt-2">{setlists.length}</span>
          <span className="text-[10px] text-slate-500">
            For Church & Bar gigs
          </span>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Vocal Range Growth & Practice Streak */}
        <div className="lg:col-span-1 space-y-6">
          {/* Vocal Growth History */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <History size={16} className="text-indigo-400" />
              Vocal Expansion Logs
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track how your practice expands your singing registers over time.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {vocalRangeHistory.map((hist, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-900 text-xs">
                  <span className="text-slate-500 font-mono">{hist.date}</span>
                  <span className="font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                    {hist.min} - {hist.max}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Vocal Test Shortcut */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-200">Interactive Range Finder</h4>
              <p className="text-[10px] text-slate-500">Sing low and high to update coaching tips</p>
            </div>
            <button
              onClick={() => setActiveTab('practice')}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-950 border border-indigo-900 text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Mic size={14} />
            </button>
          </div>
        </div>

        {/* Right Side: Recent Practice Notes & Quick song launcher */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Practice Log Entries */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Heart size={16} className="text-rose-500" />
              Recent Practice Journals
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Quick review of dictation notes logged from your latest practice sessions.
            </p>

            <div className="space-y-3">
              {displayedNotes.length > 0 ? (
                displayedNotes.map((noteItem, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => startPracticingSong(noteItem.songId)}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-850 hover:bg-slate-900/50 transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-indigo-400">{noteItem.songTitle}</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{noteItem.note}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Your practice journal is empty. Enable your microphone during song practice to dictate notes hands-free!
                </div>
              )}
            </div>
          </div>

          {/* Quick-play list */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fast Start practice</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {songs.slice(0, 2).map((song) => (
                <button
                  key={song.id}
                  onClick={() => startPracticingSong(song.id)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left hover:bg-slate-800/30 hover:border-slate-700 transition-all group"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{song.title}</h4>
                    <span className="text-[10px] text-slate-500">{song.artist}</span>
                  </div>
                  <Play size={12} className="text-slate-600 group-hover:text-white transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
