/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { GuitarTuning } from '../context/AppContext';
import { convertStandardToChordPro, parseChordPro } from '../utils/transposer';
import { Save, Plus, FileEdit, Wand2 } from 'lucide-react';

interface ChordSheetEditorProps {
  onSaveCallback?: () => void;
}

export const ChordSheetEditor: React.FC<ChordSheetEditorProps> = ({ onSaveCallback }) => {
  const { activeSong, addSong, updateSong } = useApp();
  const [isNew, setIsNew] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('G');
  const [tuning, setTuning] = useState<GuitarTuning>('standard');
  const [capo, setCapo] = useState(0);
  const [tempo, setTempo] = useState(80);
  const [duration, setDuration] = useState(240);
  const [vocalMin, setVocalMin] = useState('D3');
  const [vocalMax, setVocalMax] = useState('E4');
  const [genre, setGenre] = useState<'church' | 'bar' | 'other'>('church');
  const [chordSheet, setChordSheet] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync form states with active song
  useEffect(() => {
    if (activeSong && !isNew) {
      setTitle(activeSong.title);
      setArtist(activeSong.artist);
      setKey(activeSong.key);
      setTuning(activeSong.tuning);
      setCapo(activeSong.capo);
      setTempo(activeSong.tempo);
      setDuration(activeSong.duration);
      setVocalMin(activeSong.vocalMin);
      setVocalMax(activeSong.vocalMax);
      setGenre(activeSong.genre);
      setChordSheet(activeSong.chordSheet);
    }
  }, [activeSong, isNew]);

  const handleNewSongToggle = () => {
    setIsNew(true);
    setTitle('');
    setArtist('');
    setKey('G');
    setTuning('standard');
    setCapo(0);
    setTempo(80);
    setDuration(180);
    setVocalMin('D3');
    setVocalMax('E4');
    setGenre('church');
    setChordSheet('{title: New Song}\n{artist: Artist}\n{key: G}\n\n[G]Line [C]one with [D]lyrics.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !artist.trim()) {
      alert('Please provide a Song Title and Artist.');
      return;
    }

    const cleanedChordSheet = chordSheet.includes('[') 
      ? chordSheet 
      : convertStandardToChordPro(chordSheet);

    const songData = {
      title,
      artist,
      key,
      tuning,
      capo,
      tempo,
      duration,
      genre,
      vocalMin,
      vocalMax,
      chordSheet: cleanedChordSheet,
      notes: activeSong && !isNew ? activeSong.notes : ['Song added to library.']
    };

    if (isNew) {
      addSong(songData);
      setIsNew(false);
      alert('Song successfully added to library!');
    } else if (activeSong) {
      updateSong(activeSong.id, songData);
      alert('Song updates saved!');
    }

    if (onSaveCallback) {
      onSaveCallback();
    }
  };

  // Run the parser to convert copy-pasted chord sheets
  const handleAutoFormat = () => {
    if (!chordSheet.trim()) return;
    const formatted = convertStandardToChordPro(chordSheet);
    setChordSheet(formatted);
  };

  // Inject a bracketed chord at the current cursor index
  const injectChord = (chord: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + `[${chord}]` + currentVal.substring(end);
    setChordSheet(newVal);

    // Reposition cursor after the inserted chord tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + chord.length + 2, start + chord.length + 2);
    }, 0);
  };

  const commonChords = ['G', 'C', 'D', 'Em', 'Am', 'F', 'A', 'E', 'Bm'];

  // Parse for preview
  const previewLines = parseChordPro(chordSheet);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-full">
      {/* Editor Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileEdit size={18} className="text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-200">
            {isNew ? 'New Song Sheet' : `Editing: ${title}`}
          </h2>
        </div>
        <div className="flex gap-2">
          {!isNew && (
            <button
              onClick={handleNewSongToggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-semibold transition-all"
            >
              <Plus size={14} />
              Create Blank Song
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <Save size={14} />
            Save Song
          </button>
        </div>
      </div>

      {/* Editor & Preview Workspace */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metadata Inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="col-span-2 flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Song Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Amazing Grace"
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="col-span-2 flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Artist / Band</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="e.g. Chris Tomlin"
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Original Key</label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="e.g. G"
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Guitar Tuning</label>
            <select
              value={tuning}
              onChange={(e) => setTuning(e.target.value as GuitarTuning)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Standard</option>
              <option value="eb">Eb Standard</option>
              <option value="baritone">B Baritone</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tempo (BPM)</label>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Genre / Gig</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as 'church' | 'bar' | 'other')}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="church">Church Worship</option>
              <option value="bar">Bar / Rock</option>
              <option value="other">Other / Acoustic</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Vocal Min Note</label>
            <input
              type="text"
              value={vocalMin}
              onChange={(e) => setVocalMin(e.target.value)}
              placeholder="e.g. D3"
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1">Vocal Max Note</label>
            <input
              type="text"
              value={vocalMax}
              onChange={(e) => setVocalMax(e.target.value)}
              placeholder="e.g. E4"
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Editor Workspace Splitting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
          {/* Edit Pane */}
          <div className="flex flex-col space-y-2 h-full">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Chord Sheet Code</span>
              <button
                type="button"
                onClick={handleAutoFormat}
                className="flex items-center gap-1 text-[10px] uppercase font-extrabold bg-slate-800 border border-slate-700 text-indigo-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
                title="Converts Ultimate Guitar spacing into bracketed chords"
              >
                <Wand2 size={12} />
                Format UG Paste
              </button>
            </div>
            
            {/* Quick Chord Tool */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              <span className="text-[9px] uppercase font-bold text-slate-500 mr-2">Quick Chords:</span>
              <div className="flex gap-1 overflow-x-auto">
                {commonChords.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => injectChord(c)}
                    className="h-6 px-2 text-[10px] font-bold bg-slate-900 border border-slate-800 text-indigo-400 hover:bg-slate-800 hover:text-white rounded-md transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={chordSheet}
              onChange={(e) => setChordSheet(e.target.value)}
              placeholder="Paste chord sheets here. Chords can be standard spacing (above lyrics) or ChordPro [G]format."
              className="flex-1 bg-slate-950 border border-slate-800 text-slate-300 rounded-2xl p-4 font-mono text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Live Preview Pane */}
          <div className="flex flex-col space-y-2 h-full">
            <span className="text-xs font-bold text-slate-400">Live Preview</span>
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-y-auto font-mono text-xs space-y-2">
              {previewLines.map((line, lineIdx) => {
                if (line.isSpacer) return <div key={lineIdx} className="h-4" />;
                if (line.isMetadata) {
                  return (
                    <div key={lineIdx} className="text-slate-500 italic text-[10px] pb-1 border-b border-slate-900">
                      {line.metadataType}: {line.metadataValue}
                    </div>
                  );
                }
                return (
                  <div key={lineIdx} className="flex flex-wrap leading-relaxed py-0.5">
                    {line.items?.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex flex-col mr-1 mb-1 items-start">
                        <span 
                          className="h-4 text-[10px] font-bold text-indigo-400"
                          style={{ visibility: item.chord ? 'visible' : 'hidden' }}
                        >
                          {item.chord}
                        </span>
                        <span className="text-slate-200">{item.lyric || '\u00A0'}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
