import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, RotateCw, Trash2, Smartphone, PlusCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface LibraryManagerProps {
  onEditSongCallback?: () => void;
}

export const LibraryManager: React.FC<LibraryManagerProps> = ({ onEditSongCallback }) => {
  const { 
    songs, 
    activeSongId, 
    setActiveSongId, 
    deleteSong, 
    syncWithUltimateGuitarMock 
  } = useApp();

  const [search, setSearch] = useState('');
  const [tuningFilter, setTuningFilter] = useState<string>('all');
  const [genreFilter, setGenreFilter] = useState<string>('all');

  // UG Sync modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [ugUsername, setUgUsername] = useState('');
  const [ugPassword, setUgPassword] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncLog, setSyncLog] = useState('');

  const triggerSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ugUsername || !ugPassword) {
      alert("Please enter credentials to sync.");
      return;
    }

    setSyncStatus('syncing');
    setSyncProgress(10);
    setSyncLog('Emulating mobile device user-agent...');

    const logs = [
      { progress: 30, log: 'Connecting to Ultimate Guitar mobile gateway...' },
      { progress: 50, log: 'Logging in with credentials...' },
      { progress: 75, log: 'Fetching song library and private playlists...' },
      { progress: 90, log: 'Downloading song metadata and personal notes...' },
      { progress: 100, log: 'Importing Comfortably Numb by Pink Floyd...' }
    ];

    for (const step of logs) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setSyncProgress(step.progress);
      setSyncLog(step.log);
    }

    await syncWithUltimateGuitarMock();
    setSyncStatus('success');
  };

  const closeSyncModal = () => {
    setShowSyncModal(false);
    setSyncStatus('idle');
    setSyncProgress(0);
    setSyncLog('');
    setUgUsername('');
    setUgPassword('');
  };

  // Filter songs
  const filteredSongs = songs.filter(song => {
    const matchesSearch = 
      song.title.toLowerCase().includes(search.toLowerCase()) || 
      song.artist.toLowerCase().includes(search.toLowerCase());
    const matchesTuning = tuningFilter === 'all' || song.tuning === tuningFilter;
    const matchesGenre = genreFilter === 'all' || song.genre === genreFilter;
    return matchesSearch && matchesTuning && matchesGenre;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search songs by title or artist..."
              className="w-full bg-slate-950 text-slate-200 text-sm placeholder-slate-500 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <button
            onClick={() => setShowSyncModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-950/20"
          >
            <Smartphone size={16} />
            Sync Ultimate Guitar
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Gig Genre:</span>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Genres</option>
              <option value="church">Church Worship</option>
              <option value="bar">Bar / Rock</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Guitar Tuning:</span>
            <select
              value={tuningFilter}
              onChange={(e) => setTuningFilter(e.target.value)}
              className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Tunings</option>
              <option value="standard">Standard E-E</option>
              <option value="eb">Eb Standard</option>
              <option value="baritone">B-B Baritone</option>
            </select>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-300">My Song Library ({filteredSongs.length})</h3>
          {onEditSongCallback && (
            <button
              onClick={onEditSongCallback}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <PlusCircle size={14} />
              Add Song
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-800">
          {filteredSongs.length > 0 ? (
            filteredSongs.map((song) => {
              const isActive = song.id === activeSongId;
              return (
                <div
                  key={song.id}
                  onClick={() => setActiveSongId(song.id)}
                  className={`p-4 flex items-center justify-between transition-colors cursor-pointer group ${
                    isActive 
                      ? 'bg-indigo-950/20 border-l-4 border-indigo-500' 
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className={`text-sm font-bold ${isActive ? 'text-indigo-400' : 'text-slate-200'}`}>
                      {song.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{song.artist}</span>
                      <span>•</span>
                      <span>Key: {song.activeKey}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px] uppercase font-bold bg-slate-950 px-2 py-0.5 rounded-full text-slate-400 border border-slate-800">
                        {song.tuning === 'eb' ? 'Eb' : song.tuning === 'baritone' ? 'Baritone' : 'Standard'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-medium text-slate-600 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                      {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${song.title}" from your library?`)) {
                          deleteSong(song.id);
                        }
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-rose-950/30 hover:text-rose-400 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Song"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs leading-relaxed">
              No songs matched your search criteria. Try adjusting filters or import a new song!
            </div>
          )}
        </div>
      </div>

      {/* Ultimate Guitar Sync Credentials Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-slate-100 font-display flex items-center gap-2">
              <Smartphone size={20} className="text-indigo-400" />
              Ultimate Guitar Mobile Sync
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Log in with your Ultimate Guitar credentials. Phineas will connect using a simulated mobile wrapper to pull down your playlists and edits.
            </p>

            {syncStatus === 'idle' && (
              <form onSubmit={triggerSync} className="space-y-4 mt-6">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">UG Username or Email</label>
                  <input
                    type="text"
                    required
                    value={ugUsername}
                    onChange={(e) => setUgUsername(e.target.value)}
                    placeholder="user@email.com"
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">UG Password</label>
                  <input
                    type="password"
                    required
                    value={ugPassword}
                    onChange={(e) => setUgPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-start gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] text-slate-500 leading-relaxed">
                  <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    Your credentials are used locally on your browser to fetch your private playlists. We do not store or upload your password to external servers.
                  </span>
                </div>

                <div className="flex gap-3 justify-end pt-3">
                  <button
                    type="button"
                    onClick={closeSyncModal}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Authenticate & Sync
                  </button>
                </div>
              </form>
            )}

            {syncStatus === 'syncing' && (
              <div className="flex flex-col items-center justify-center py-8 mt-4 space-y-4">
                <RotateCw size={36} className="text-indigo-400 animate-spin" />
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${syncProgress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-indigo-400 font-mono">{syncProgress}%</span>
                <p className="text-xs text-slate-400 font-mono italic max-w-xs text-center">{syncLog}</p>
              </div>
            )}

            {syncStatus === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 mt-4 space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-900 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                  <CheckCircle size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-100">Sync Completed Successfully!</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Your songs have been synced. Comfortably Numb has been added to your Library list.
                </p>
                <button
                  onClick={closeSyncModal}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs py-2.5 rounded-xl border border-slate-700"
                >
                  Return to Library
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
