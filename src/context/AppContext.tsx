/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { convertStandardToChordPro } from '../utils/transposer';
import type { GuitarTuning } from '../utils/transposer';
import { parseAgentCommand } from '../utils/agentCommands';

export type { GuitarTuning };

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;            // Original concert key (e.g. "G")
  activeKey: string;      // Currently transposed concert key (e.g. "A")
  transposeOffset: number;// Number of semitones shifted relative to original key
  tuning: GuitarTuning;   // Guitar tuning used (standard, eb, baritone)
  capo: number;           // Recommended capo fret
  tempo: number;          // BPM
  duration: number;       // Duration in seconds
  chordSheet: string;     // ChordPro format text
  notes: string[];        // Practice comments/transcriptions
  vocalMin: string;       // Lowest vocal note (e.g. "D3")
  vocalMax: string;       // Highest vocal note (e.g. "E4")
  genre: 'church' | 'bar' | 'other';
  lastPracticed?: string;
}

export interface Setlist {
  id: string;
  name: string;
  songIds: string[];
  date: string;
}

export interface VocalRange {
  min: string;
  minFreq: number;
  max: string;
  maxFreq: number;
}

export interface VocalRangeHistory {
  date: string;
  min: string;
  max: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionExecuted?: string;
}

interface AppContextType {
  songs: Song[];
  activeSongId: string | null;
  activeSong: Song | null;
  setlists: Setlist[];
  activeSetlistId: string | null;
  activeSetlist: Setlist | null;
  vocalRange: VocalRange;
  vocalRangeHistory: VocalRangeHistory[];
  chatMessages: ChatMessage[];
  searchQuery: string;
  filterTuning: string | null;
  isAgentTyping: boolean;
  
  // Actions
  setActiveSongId: (id: string | null) => void;
  setActiveSetlistId: (id: string | null) => void;
  addSong: (song: Omit<Song, 'id' | 'activeKey' | 'transposeOffset'>) => void;
  updateSong: (id: string, updates: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  addPracticeNote: (songId: string, note: string) => void;
  createSetlist: (name: string) => string;
  addSongToSetlist: (setlistId: string, songId: string) => void;
  removeSongFromSetlist: (setlistId: string, songId: string) => void;
  reorderSetlist: (setlistId: string, songIds: string[]) => void;
  deleteSetlist: (id: string) => void;
  updateVocalRange: (min: string, minFreq: number, max: string, maxFreq: number) => void;
  sendChatMessage: (text: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterTuning: (tuning: string | null) => void;
  transposeActiveSong: (semitones: number) => void;
  setCapoForActiveSong: (fret: number) => void;
  setTuningForActiveSong: (tuning: GuitarTuning) => void;
  syncWithUltimateGuitarMock: () => Promise<void>;
}

const DEFAULT_VOCAL_RANGE: VocalRange = {
  min: 'G2',
  minFreq: 98.0,
  max: 'E4',
  maxFreq: 329.6
};

const INITIAL_SONGS: Song[] = [
  {
    id: '1',
    title: 'Amazing Grace',
    artist: 'Traditional Christian',
    key: 'G',
    activeKey: 'G',
    transposeOffset: 0,
    tuning: 'standard',
    capo: 0,
    tempo: 76,
    duration: 210,
    genre: 'church',
    vocalMin: 'D3',
    vocalMax: 'E4',
    lastPracticed: '2026-05-20',
    notes: [
      'Singing felt strong, high notes were clear.',
      'Guitar strumming pattern: D-DU-DU (3/4 time).'
    ],
    chordSheet: `{title: Amazing Grace}
{artist: Traditional}
{key: G}

[G]Amazing [G7]grace! How [C]sweet the [G]sound
That saved a [D]wretch like [D7]me!
I [G]once was [G7]lost, but [C]now am [G]found;
Was blind, but [D7]now I [G]see.

'Twas [G]grace that [G7]taught my [C]heart to [G]fear,
And grace my [D]fears re[D7]lieved;
How [G]precious [G7]did that [C]grace ap[G]pear
The hour I [D7]first be[G]lieved.

Through [G]many [G7]dangers, [C]toils and [G]snares,
I have al[D]ready [D7]come;
'Tis [G]grace hath [G7]brought me [C]safe thus [G]far,
And grace will [D7]lead me [G]home.`
  },
  {
    id: '2',
    title: 'Pride and Joy',
    artist: 'Stevie Ray Vaughan',
    key: 'Eb',
    activeKey: 'Eb',
    transposeOffset: 0,
    tuning: 'eb',
    capo: 0,
    tempo: 124,
    duration: 220,
    genre: 'bar',
    vocalMin: 'Bb2',
    vocalMax: 'Eb4',
    lastPracticed: '2026-05-18',
    notes: [
      'Tune guitar down a half step to Eb Standard before playing!',
      'Focus on the driving Texas shuffle rhythm. Lay back on the beat.'
    ],
    chordSheet: `{title: Pride and Joy}
{artist: Stevie Ray Vaughan}
{key: Eb}

[Eb]Well, you've heard about love givin' sight to the blind
[Eb]My baby's lovin' cause the sun to shine
She's my [Ab]sweet little baby, she's my pride and [Eb]joy
She's my [Bb]sweet little baby, I'm her [Ab]little lover [Eb]boy.

[Eb]Yeah, I love my baby, heart and soul
[Eb]Love like ours won't never grow old
She's my [Ab]sweet little baby, she's my pride and [Eb]joy
She's my [Bb]sweet little baby, I'm her [Ab]little lover [Eb]boy.`
  },
  {
    id: '3',
    title: 'Ghost (Baritone Style)',
    artist: 'Baritone Ballad',
    key: 'Bm',
    activeKey: 'Bm',
    transposeOffset: 0,
    tuning: 'baritone',
    capo: 0,
    tempo: 84,
    duration: 250,
    genre: 'bar',
    vocalMin: 'F#2',
    vocalMax: 'D4',
    lastPracticed: '2026-05-19',
    notes: [
      'Using the B-B Baritone guitar setup. Thick strings sound massive.',
      'Vocal range sits low, great for late night bar sets.'
    ],
    chordSheet: `{title: Ghost (Baritone Style)}
{artist: Baritone Ballad}
{key: Bm}

[Bm]Midnight roads and [A]fading lights
We [G]chased the ghosts through [F#m]sleepless nights
But [G]here we are, right [A]at the start
With [F#m]heavy strings and a [Bm]heavy heart.

[G]Oh, my [A]ghost, where did you [D]go?
[G]Lost in the [A]baritone echo [Bm]below
[G]Under the [A]shadows of the [D]neon [A]sign
I [G]sing your name one [A]last time [Bm]deep in line.`
  },
  {
    id: '4',
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    key: 'G',
    activeKey: 'G',
    transposeOffset: 0,
    tuning: 'standard',
    capo: 0,
    tempo: 78,
    duration: 265,
    genre: 'church',
    vocalMin: 'D3',
    vocalMax: 'E4',
    lastPracticed: '2026-05-21',
    notes: [
      'G-Em-C-D progression. Keep strumming steady for congregational singing.',
      'Chorus vocals need to project. Take deep breaths.'
    ],
    chordSheet: `{title: How Great Is Our God}
{artist: Chris Tomlin}
{key: G}

The [G]splendor of a King, [Em7]clothed in majesty
Let all the earth re[C2]joice, all the earth rejoice
He [G]wraps Himself in light, and [Em7]darkness tries to hide
And trembles at His [C2]voice, trembles at His voice

Chorus:
How [G]great is our God, sing with me
How [Em7]great is our God, and all will see
How [C]great, how [D]great is our [G]God.

And [G]age to age He stands, and [Em7]time is in His hands
Beginning and the [C2]end, beginning and the end
The [G]Godhead Three in One: [Em7]Father, Spirit, Son
The Lion and the [C2]Lamb, the Lion and the Lamb`
  }
];

const INITIAL_SETLISTS: Setlist[] = [
  {
    id: 's1',
    name: 'Sunday Morning Worship',
    songIds: ['1', '4'],
    date: '2026-05-24'
  },
  {
    id: 's2',
    name: 'Bar Gig Opener',
    songIds: ['2', '3'],
    date: '2026-05-29'
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('phineas_songs');
    return saved ? JSON.parse(saved) : INITIAL_SONGS;
  });

  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    const saved = localStorage.getItem('phineas_setlists');
    return saved ? JSON.parse(saved) : INITIAL_SETLISTS;
  });

  const [activeSongId, setActiveSongId] = useState<string | null>(() => {
    return localStorage.getItem('phineas_active_song') || '1';
  });

  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(() => {
    return localStorage.getItem('phineas_active_setlist') || 's1';
  });

  const [vocalRange, setVocalRange] = useState<VocalRange>(() => {
    const saved = localStorage.getItem('phineas_vocal_range');
    return saved ? JSON.parse(saved) : DEFAULT_VOCAL_RANGE;
  });

  const [vocalRangeHistory, setVocalRangeHistory] = useState<VocalRangeHistory[]>(() => {
    const saved = localStorage.getItem('phineas_vocal_history');
    return saved ? JSON.parse(saved) : [
      { date: '2026-05-01', min: 'A2', max: 'D4' },
      { date: '2026-05-10', min: 'G#2', max: 'Eb4' },
      { date: '2026-05-21', min: 'G2', max: 'E4' }
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('phineas_chat');
    return saved ? JSON.parse(saved) : [
      {
        id: 'msg_welcome',
        sender: 'agent',
        text: "Hi, I'm Phineas, your Guitar & Vocal Coach! I can help you manage your songs, customize setlists, calculate capo positions for different tunings, and give feedback on your pitch. Try speaking or typing a command!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTuning, setFilterTuning] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('phineas_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('phineas_setlists', JSON.stringify(setlists));
  }, [setlists]);

  useEffect(() => {
    if (activeSongId) localStorage.setItem('phineas_active_song', activeSongId);
  }, [activeSongId]);

  useEffect(() => {
    if (activeSetlistId) localStorage.setItem('phineas_active_setlist', activeSetlistId);
  }, [activeSetlistId]);

  useEffect(() => {
    localStorage.setItem('phineas_vocal_range', JSON.stringify(vocalRange));
  }, [vocalRange]);

  useEffect(() => {
    localStorage.setItem('phineas_vocal_history', JSON.stringify(vocalRangeHistory));
  }, [vocalRangeHistory]);

  useEffect(() => {
    localStorage.setItem('phineas_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const activeSong = songs.find(s => s.id === activeSongId) || null;
  const activeSetlist = setlists.find(sl => sl.id === activeSetlistId) || null;

  // Actions implementation
  const addSong = (newSong: Omit<Song, 'id' | 'activeKey' | 'transposeOffset'>) => {
    const id = Date.now().toString();
    const song: Song = {
      ...newSong,
      id,
      activeKey: newSong.key,
      transposeOffset: 0,
      chordSheet: newSong.chordSheet.includes('[') ? newSong.chordSheet : convertStandardToChordPro(newSong.chordSheet)
    };
    setSongs(prev => [...prev, song]);
    setActiveSongId(id);
  };

  const updateSong = (id: string, updates: Partial<Song>) => {
    setSongs(prev => prev.map(s => {
      if (s.id === id) {
        const merged = { ...s, ...updates };
        // If chordSheet is updated to standard format, convert it
        if (updates.chordSheet && !updates.chordSheet.includes('[')) {
          merged.chordSheet = convertStandardToChordPro(updates.chordSheet);
        }
        // If transposeOffset changed, compute new activeKey
        if (updates.transposeOffset !== undefined) {
          const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const baseKeyIndex = keys.indexOf(s.key.replace('m', ''));
          if (baseKeyIndex !== -1) {
            let targetIdx = (baseKeyIndex + updates.transposeOffset) % 12;
            if (targetIdx < 0) targetIdx += 12;
            const suffix = s.key.endsWith('m') ? 'm' : '';
            merged.activeKey = keys[targetIdx] + suffix;
          }
        }
        return merged;
      }
      return s;
    }));
  };

  const deleteSong = (id: string) => {
    setSongs(prev => prev.filter(s => s.id !== id));
    if (activeSongId === id) {
      setActiveSongId(songs[0]?.id || null);
    }
    // Remove from setlists too
    setSetlists(prev => prev.map(sl => ({
      ...sl,
      songIds: sl.songIds.filter(sid => sid !== id)
    })));
  };

  const addPracticeNote = (songId: string, noteText: string) => {
    setSongs(prev => prev.map(s => {
      if (s.id === songId) {
        return {
          ...s,
          notes: [noteText, ...(s.notes || [])]
        };
      }
      return s;
    }));
  };

  const createSetlist = (name: string): string => {
    const id = 's_' + Date.now().toString();
    const newSl: Setlist = {
      id,
      name,
      songIds: [],
      date: new Date().toISOString().split('T')[0]
    };
    setSetlists(prev => [...prev, newSl]);
    setActiveSetlistId(id);
    return id;
  };

  const addSongToSetlist = (setlistId: string, songId: string) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id === setlistId) {
        // Prevent duplicate songs in setlist
        if (sl.songIds.includes(songId)) return sl;
        return {
          ...sl,
          songIds: [...sl.songIds, songId]
        };
      }
      return sl;
    }));
  };

  const removeSongFromSetlist = (setlistId: string, songId: string) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id === setlistId) {
        return {
          ...sl,
          songIds: sl.songIds.filter(id => id !== songId)
        };
      }
      return sl;
    }));
  };

  const reorderSetlist = (setlistId: string, songIds: string[]) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id === setlistId) {
        return { ...sl, songIds };
      }
      return sl;
    }));
  };

  const deleteSetlist = (id: string) => {
    setSetlists(prev => prev.filter(sl => sl.id !== id));
    if (activeSetlistId === id) {
      setActiveSetlistId(setlists[0]?.id || null);
    }
  };

  const updateVocalRange = (min: string, minFreq: number, max: string, maxFreq: number) => {
    const updated = { min, minFreq, max, maxFreq };
    setVocalRange(updated);
    
    // Add to history if unique range from last history entry
    const today = new Date().toISOString().split('T')[0];
    setVocalRangeHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && last.min === min && last.max === max) return prev;
      return [...prev, { date: today, min, max }];
    });
  };

  const transposeActiveSong = (semitones: number) => {
    if (!activeSongId) return;
    const currentOffset = activeSong?.transposeOffset || 0;
    updateSong(activeSongId, { transposeOffset: currentOffset + semitones });
  };

  const setCapoForActiveSong = (fret: number) => {
    if (!activeSongId) return;
    updateSong(activeSongId, { capo: fret });
  };

  const setTuningForActiveSong = (tuning: GuitarTuning) => {
    if (!activeSongId) return;
    updateSong(activeSongId, { tuning });
  };

  const syncWithUltimateGuitarMock = async () => {
    return new Promise<void>((resolve) => {
      // Simulate sync network call
      setTimeout(() => {
        // Prepend a mock sync song just to show it worked
        const newSyncSong: Song = {
          id: 'sync_' + Date.now().toString(),
          title: 'Comfortably Numb',
          artist: 'Pink Floyd',
          key: 'D',
          activeKey: 'D',
          transposeOffset: 0,
          tuning: 'standard',
          capo: 0,
          tempo: 127,
          duration: 382,
          genre: 'bar',
          vocalMin: 'A2',
          vocalMax: 'D4',
          notes: ['Synced from Ultimate Guitar library.'],
          chordSheet: `{title: Comfortably Numb}
{artist: Pink Floyd}
{key: D}

[D]Hello? Is there anybody [A]in there?
Just nod if you can [G]hear me
Is there [Em]anyone at [Bm]home?
[D]Come on now, I hear you're [A]feeling down
Well, I can [G]ease your pain
Get you on your [Em]feet a[Bm]gain.`
        };
        
        setSongs(prev => {
          if (prev.some(s => s.title === 'Comfortably Numb')) return prev;
          return [...prev, newSyncSong];
        });
        resolve();
      }, 2500);
    });
  };

  // In-app agent conversational logic (the chatbot interface)
  const sendChatMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setIsAgentTyping(true);

    // Process command deterministically
    setTimeout(() => {
      const action = parseAgentCommand(text);
      let feedback = action.message;
      let executedType = action.type;

      try {
        if (action.type === 'transpose') {
          if (activeSongId && activeSong) {
            transposeActiveSong(action.args.value);
            feedback += ` Transposed "${activeSong.title}" from key of ${activeSong.activeKey} by ${action.args.value} semitone(s).`;
          } else {
            feedback = "There's no song loaded right now to transpose! Head over to the Library to load a song first.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'transpose_to_key') {
          if (activeSongId && activeSong) {
            const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const targetNote = action.args.key.replace('m', '');
            const currentNote = activeSong.key.replace('m', '');
            const targetIdx = keys.indexOf(targetNote);
            const currentIdx = keys.indexOf(currentNote);
            
            if (targetIdx !== -1 && currentIdx !== -1) {
              let diff = targetIdx - currentIdx;
              if (diff < 0) diff += 12;
              updateSong(activeSongId, { transposeOffset: diff });
              feedback = `Done! Transposed "${activeSong.title}" to the key of ${action.args.key}.`;
            } else {
              feedback = `Sorry, I couldn't resolve note key ${action.args.key}.`;
              executedType = 'unknown';
            }
          } else {
            feedback = "Load a song first to transpose it.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'create_setlist') {
          createSetlist(action.args.name);
          feedback = `Created setlist "${action.args.name}" and made it active. You can now add songs from your library!`;
        }
        else if (action.type === 'add_to_setlist') {
          const foundSong = songs.find(s => s.title.toLowerCase().includes(action.args.songTitle.toLowerCase()));
          const foundSetlist = setlists.find(sl => sl.name.toLowerCase().includes(action.args.setlistName.toLowerCase()));
          
          if (foundSong && foundSetlist) {
            addSongToSetlist(foundSetlist.id, foundSong.id);
            feedback = `Added "${foundSong.title}" to setlist "${foundSetlist.name}".`;
          } else if (!foundSong) {
            feedback = `I couldn't find a song containing "${action.args.songTitle}" in your library. Try adding it first!`;
            executedType = 'unknown';
          } else {
            feedback = `I couldn't find a setlist named "${action.args.setlistName}". Try saying 'create setlist ${action.args.setlistName}' first.`;
            executedType = 'unknown';
          }
        }
        else if (action.type === 'set_capo') {
          if (activeSongId && activeSong) {
            setCapoForActiveSong(action.args.fret);
            feedback = `Set capo to fret ${action.args.fret} for "${activeSong.title}".`;
          } else {
            feedback = "No active song selected. Please load a song before setting the capo.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'set_tuning') {
          if (activeSongId && activeSong) {
            setTuningForActiveSong(action.args.tuning);
            const label = action.args.tuning === 'eb' ? 'Eb Standard' : action.args.tuning === 'baritone' ? 'B-B Baritone' : 'Standard';
            feedback = `Switched tuning to ${label} for "${activeSong.title}". The capo calculator will adjust.`;
          } else {
            feedback = "Select a song first to set its tuning.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'log_note') {
          if (activeSongId && activeSong) {
            addPracticeNote(activeSongId, action.args.noteText);
            feedback = `Added practice log to "${activeSong.title}": "${action.args.noteText}"`;
          } else {
            feedback = "Load a song first to add a practice note.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'suggest_capo') {
          if (activeSongId && activeSong) {
            // Find key that best fits vocal range
            // We recommend C, G, D, A, E shapes
            // Let's suggest capo offsets based on target keys
            const list = ['C', 'G', 'D', 'E', 'A'];
            feedback = `For "${activeSong.title}" (Original Concert Key: ${activeSong.key}), playing in ${activeSong.tuning} tuning:\n`;
            
            // Generate some suggestions
            const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const songBaseIdx = keys.indexOf(activeSong.key.replace('m', ''));
            
            if (songBaseIdx !== -1) {
              const suggestions = list.map(targetKey => {
                const targetIdx = keys.indexOf(targetKey);
                let capo = targetIdx - songBaseIdx;
                if (capo < 0) capo += 12;
                return `• Play [${targetKey}] shapes with Capo on Fret ${capo} (produces Key of ${activeSong.key})`;
              });
              feedback += suggestions.join('\n') + '\n\nThis will keep you in the original key while offering different fretboards!';
            } else {
              feedback = "I couldn't calculate suggestions for this song's key.";
            }
          } else {
            feedback = "Load a song first so I can calculate capo layouts for you.";
            executedType = 'unknown';
          }
        }
        else if (action.type === 'filter_tuning') {
          setFilterTuning(action.args.tuning);
          feedback = `Filtered your library to show songs in "${action.args.tuning}" tuning.`;
        }
        else if (action.type === 'search_library') {
          setSearchQuery(action.args.query);
          feedback = `Searching your library for "${action.args.query}"...`;
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'unknown error';
        feedback = `Error executing tool: ${errorMsg}`;
      }

      const agentMsg: ChatMessage = {
        id: 'agt_' + Date.now().toString(),
        sender: 'agent',
        text: feedback,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: executedType !== 'unknown' ? executedType : undefined
      };

      setChatMessages(prev => [...prev, agentMsg]);
      setIsAgentTyping(false);
    }, 1200);
  };

  return (
    <AppContext.Provider
      value={{
        songs,
        activeSongId,
        activeSong,
        setlists,
        activeSetlistId,
        activeSetlist,
        vocalRange,
        vocalRangeHistory,
        chatMessages,
        searchQuery,
        filterTuning,
        isAgentTyping,
        
        setActiveSongId,
        setActiveSetlistId,
        addSong,
        updateSong,
        deleteSong,
        addPracticeNote,
        createSetlist,
        addSongToSetlist,
        removeSongFromSetlist,
        reorderSetlist,
        deleteSetlist,
        updateVocalRange,
        sendChatMessage,
        setSearchQuery,
        setFilterTuning,
        transposeActiveSong,
        setCapoForActiveSong,
        setTuningForActiveSong,
        syncWithUltimateGuitarMock
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
