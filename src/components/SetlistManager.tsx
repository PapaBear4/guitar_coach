import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Song } from '../context/AppContext';
import { Plus, Trash2, ArrowUp, ArrowDown, Printer, FileText, Calendar, Music, Clock } from 'lucide-react';

export const SetlistManager: React.FC = () => {
  const {
    songs,
    setlists,
    activeSetlistId,
    activeSetlist,
    setActiveSetlistId,
    createSetlist,
    addSongToSetlist,
    removeSongFromSetlist,
    reorderSetlist,
    deleteSetlist
  } = useApp();

  const [newListName, setNewListName] = useState('');
  const [selectedSongId, setSelectedSongId] = useState('');
  
  // Vocalist layout mode
  const [isVocalistMode, setIsVocalistMode] = useState(false);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createSetlist(newListName);
    setNewListName('');
  };

  const handleAddSong = () => {
    if (!activeSetlistId || !selectedSongId) return;
    addSongToSetlist(activeSetlistId, selectedSongId);
    setSelectedSongId('');
  };

  // Reordering helpers (mobile-friendly buttons)
  const moveSong = (index: number, direction: 'up' | 'down') => {
    if (!activeSetlist) return;
    const ids = [...activeSetlist.songIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= ids.length) return;
    
    // Swap elements
    const temp = ids[index];
    ids[index] = ids[targetIndex];
    ids[targetIndex] = temp;
    
    reorderSetlist(activeSetlist.id, ids);
  };

  // Strip chords & metadata for backing vocalist lyric sheet
  const getLyricsOnly = (chordSheet: string): string => {
    // Remove metadata directives
    let cleaned = chordSheet.replace(/\{[^}]+\}/g, '');
    cleaned = cleaned.replace(/\[[^:]+:[^\]]+\]/g, '');
    
    // Remove chords [C]
    cleaned = cleaned.replace(/\[[^\]]+\]/g, '');
    
    // Clean double spaces and empty lines
    return cleaned
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .join('\n');
  };

  const printLyrics = () => {
    window.print();
  };

  // Calculate stats
  const activeSongs = activeSetlist 
    ? activeSetlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[]
    : [];

  const totalSeconds = activeSongs.reduce((acc, song) => acc + song.duration, 0);
  const totalDurationStr = `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;

  // Filter out songs already in setlist for the "Add Song" selector
  const availableSongs = songs.filter(s => 
    activeSetlist ? !activeSetlist.songIds.includes(s.id) : true
  );

  return (
    <div className="space-y-6 print-container">
      {/* Selection & Creation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 flex flex-col space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500">Active Setlist</label>
            <select
              value={activeSetlistId || ''}
              onChange={(e) => {
                setActiveSetlistId(e.target.value || null);
                setIsVocalistMode(false); // Reset layout mode
              }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="" disabled>Select a setlist...</option>
              {setlists.map(sl => (
                <option key={sl.id} value={sl.id}>
                  {sl.name} ({sl.songIds.length} songs)
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleCreateList} className="flex gap-2 w-full sm:w-auto items-center">
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">New Setlist</label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g. Gig Opener Set"
                className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 self-end shrink-0"
              title="Create setlist"
            >
              <Plus size={18} />
            </button>
          </form>
        </div>
      </div>

      {activeSetlist ? (
        <>
          {/* Action Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-wrap gap-4 items-center justify-between print:hidden">
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display flex items-center gap-2">
                <Calendar size={18} className="text-indigo-400" />
                {activeSetlist.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1"><Music size={13} /> {activeSongs.length} songs</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock size={13} /> Est. Duration: {totalDurationStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsVocalistMode(!isVocalistMode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isVocalistMode
                    ? 'bg-indigo-950/30 text-indigo-400 border-indigo-900'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText size={14} />
                {isVocalistMode ? 'Show Chord Shapes' : 'Vocalist Lyrics-Only'}
              </button>
              
              {isVocalistMode && (
                <button
                  onClick={printLyrics}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                >
                  <Printer size={14} />
                  Print Sheets
                </button>
              )}

              <button
                onClick={() => {
                  if (confirm(`Delete setlist "${activeSetlist.name}"?`)) {
                    deleteSetlist(activeSetlist.id);
                  }
                }}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-rose-950/20 hover:text-rose-400 hover:border-rose-900 transition-all text-slate-500"
                title="Delete setlist"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Normal Setlist Editor Layout */}
          {!isVocalistMode ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
              {/* Song List Details */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-300">Setlist Sequence</h3>
                </div>

                <div className="divide-y divide-slate-800">
                  {activeSongs.length > 0 ? (
                    activeSongs.map((song, index) => (
                      <div key={song.id} className="p-4 flex items-center justify-between group hover:bg-slate-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-950 h-6 w-6 rounded-full flex items-center justify-center border border-slate-800">
                            {index + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{song.title}</h4>
                            <p className="text-xs text-slate-500">
                              {song.artist} • Original Key: {song.key} • Tuning: <span className="uppercase">{song.tuning}</span>
                            </p>
                          </div>
                        </div>

                        {/* Reordering Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveSong(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          
                          <button
                            onClick={() => moveSong(index, 'down')}
                            disabled={index === activeSongs.length - 1}
                            className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>

                          <button
                            onClick={() => removeSongFromSetlist(activeSetlist.id, song.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-950/30 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                            title="Remove from Setlist"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-500 text-xs">
                      Setlist is empty. Add songs from your library on the right panel!
                    </div>
                  )}
                </div>
              </div>

              {/* Add Songs Sidepanel */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-200">Compile Songs</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select and append songs from your guitar library to this active setlist.
                </p>

                <div className="flex flex-col space-y-2 pt-2">
                  <select
                    value={selectedSongId}
                    onChange={(e) => setSelectedSongId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a song...</option>
                    {availableSongs.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.artist})
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleAddSong}
                    disabled={!selectedSongId}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl disabled:opacity-40 transition-colors"
                  >
                    Add Song to Setlist
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Vocalist Print Layout Mode */
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-12 vocalist-print-page max-w-3xl mx-auto shadow-xl">
              <div className="text-center pb-6 border-b border-slate-800/50 print:hidden">
                <h3 className="text-base font-bold text-indigo-400">Vocalist Lyrics Preview</h3>
                <p className="text-xs text-slate-500 mt-1">Chords stripped. Optimized for backup singers. Print/Save to share.</p>
              </div>

              {activeSongs.map((song, idx) => (
                <div key={song.id} className="space-y-6 page-break-after">
                  {/* Song Title and Order */}
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Song {idx + 1} of {activeSongs.length}</span>
                    <h2 className="text-3xl font-extrabold text-slate-100 font-display mt-1">{song.title}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{song.artist}</p>
                  </div>

                  {/* Lyrics Display */}
                  <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800/40 text-slate-200 text-sm font-sans whitespace-pre-wrap leading-relaxed max-w-xl mx-auto text-center font-medium">
                    {getLyricsOnly(song.chordSheet)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-96 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400">
          <Calendar size={48} className="text-slate-600 mb-2" />
          <p>No setlist active. Select or create one above to get started!</p>
        </div>
      )}
    </div>
  );
};
