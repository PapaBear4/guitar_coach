/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { GuitarTuning } from '../context/AppContext';
import { parseChordPro, transposeChord, calculateCapo, TUNING_OFFSETS, normalizeNote } from '../utils/transposer';
import { Play, Pause, ChevronUp, ChevronDown, RotateCcw, Mic, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export const ChordSheetViewer: React.FC = () => {
  const { 
    activeSong, 
    updateSong, 
    addPracticeNote, 
    vocalRange,
    activeSongId
  } = useApp();

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(30); // pixels per second
  const [isDictating, setIsDictating] = useState(false);
  const [dictationText, setDictationText] = useState('');
  
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (isScrolling) {
      const scrollStep = () => {
        if (viewerRef.current) {
          viewerRef.current.scrollTop += 1;
          
          // Stop if reached bottom
          const maxScroll = viewerRef.current.scrollHeight - viewerRef.current.clientHeight;
          if (viewerRef.current.scrollTop >= maxScroll - 1) {
            setIsScrolling(false);
          }
        }
      };

      // Convert speed (px/sec) to interval
      const intervalMs = 1000 / scrollSpeed;
      scrollIntervalRef.current = window.setInterval(scrollStep, intervalMs);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [isScrolling, scrollSpeed, activeSongId]);

  // Setup dictation speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsDictating(true);
        setDictationText('');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (activeSongId) {
          addPracticeNote(activeSongId, `Practice Note: ${transcript.trim()}`);
          setDictationText(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Dictation error:', e);
        setIsDictating(false);
      };

      rec.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = rec;
    }
  }, [activeSongId, addPracticeNote]);

  if (!activeSong) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400">
        <FileText size={48} className="text-slate-600 mb-2" />
        <p>No song selected. Choose a song from the library or create a new one!</p>
      </div>
    );
  }

  const toggleDictation = () => {
    if (!recognitionRef.current) {
      alert("Voice dictation is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    if (isDictating) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleTranspose = (semitones: number) => {
    updateSong(activeSong.id, { 
      transposeOffset: activeSong.transposeOffset + semitones 
    });
  };

  const resetTranspose = () => {
    updateSong(activeSong.id, { transposeOffset: 0 });
  };

  const handleCapoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSong(activeSong.id, { capo: parseInt(e.target.value, 10) });
  };

  const handleTuningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSong(activeSong.id, { tuning: e.target.value as GuitarTuning });
  };

  // CALCULATE ACTIVE CHORD SHAPES TO DISPLAY
  // Formula: Shape Shift = Transpose Offset - Tuning Offset - Capo Fret
  const tuningOffset = TUNING_OFFSETS[activeSong.tuning];
  const shapeShift = activeSong.transposeOffset - tuningOffset - activeSong.capo;

  // Parse ChordPro and transpose the display chords
  const parsedLines = parseChordPro(activeSong.chordSheet);

  // VOCAL RANGE EVALUATION
  // Find current vocal min and max notes of the song transposed
  const getNoteMidiNumber = (noteStr: string): number => {
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = noteStr.match(/^([A-G][#b]?)(\d)$/);
    if (!match) return 60; // Default middle C
    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteIdx = NOTES.indexOf(normalizeNote(note));
    return (octave + 1) * 12 + noteIdx;
  };

  const getNoteNameFromMidi = (midiNum: number): string => {
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNum / 12) - 1;
    const noteIdx = midiNum % 12;
    return `${NOTES[noteIdx]}${octave}`;
  };

  const songMinMidi = getNoteMidiNumber(activeSong.vocalMin) + activeSong.transposeOffset;
  const songMaxMidi = getNoteMidiNumber(activeSong.vocalMax) + activeSong.transposeOffset;
  const userMinMidi = getNoteMidiNumber(vocalRange.min);
  const userMaxMidi = getNoteMidiNumber(vocalRange.max);

  const songMinTransposed = getNoteNameFromMidi(songMinMidi);
  const songMaxTransposed = getNoteNameFromMidi(songMaxMidi);

  const vocalFit = {
    fits: songMinMidi >= userMinMidi && songMaxMidi <= userMaxMidi,
    tooHigh: songMaxMidi > userMaxMidi,
    tooLow: songMinMidi < userMinMidi,
    highDiff: songMaxMidi - userMaxMidi,
    lowDiff: userMinMidi - songMinMidi
  };

  // Get capo recommendations
  const capoOptions = calculateCapo(activeSong.key, activeSong.tuning);
  const bestCapoSuggestion = capoOptions[0];

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      {/* Control Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        {/* Title & Artist */}
        <div>
          <h2 className="text-base font-bold text-slate-100 font-display">{activeSong.title}</h2>
          <p className="text-xs text-slate-400">{activeSong.artist}</p>
        </div>

        {/* Transpose Controls */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 px-2">Key: {activeSong.activeKey}</span>
          <button
            onClick={() => handleTranspose(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Transpose Down"
          >
            <ChevronDown size={16} />
          </button>
          <span className="text-xs font-mono font-bold text-indigo-400 min-w-8 text-center">
            {activeSong.transposeOffset > 0 ? `+${activeSong.transposeOffset}` : activeSong.transposeOffset}
          </span>
          <button
            onClick={() => handleTranspose(1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Transpose Up"
          >
            <ChevronUp size={16} />
          </button>
          {activeSong.transposeOffset !== 0 && (
            <button
              onClick={resetTranspose}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset Key"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>

        {/* Capo & Tuning Selector */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Tuning</label>
            <select
              value={activeSong.tuning}
              onChange={handleTuningChange}
              className="bg-slate-900 text-slate-200 text-xs border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="standard">Standard</option>
              <option value="eb">Eb Standard</option>
              <option value="baritone">B-B Baritone</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] uppercase font-bold text-slate-500 mb-0.5">Capo Fret</label>
            <select
              value={activeSong.capo}
              onChange={handleCapoChange}
              className="bg-slate-900 text-slate-200 text-xs border border-slate-800 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i} value={i}>
                  Fret {i} {i === 0 ? '(No Capo)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Vocal & Capo Coaching Alerts */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-col md:flex-row gap-3 items-stretch justify-between text-xs">
        {/* Vocal Comfort Bar */}
        <div className="flex items-center gap-2">
          {vocalFit.fits ? (
            <span className="flex items-center gap-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-2.5 py-1 rounded-xl font-medium">
              <CheckCircle size={14} />
              Vocal Match: Comfortable ({songMinTransposed} - {songMaxTransposed})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-amber-950/40 text-amber-400 border border-amber-900 px-2.5 py-1 rounded-xl font-medium">
              <AlertTriangle size={14} />
              {vocalFit.tooHigh 
                ? `Too High: Exceeds your range by ${vocalFit.highDiff} semitone${vocalFit.highDiff > 1 ? 's' : ''}` 
                : `Too Low: Drops below your range by ${vocalFit.lowDiff} semitone${vocalFit.lowDiff > 1 ? 's' : ''}`}
            </span>
          )}
        </div>

        {/* Capo suggestion feedback */}
        <div className="flex items-center gap-2 text-slate-400">
          <span>Capo Coach Tip:</span>
          {bestCapoSuggestion && (
            <span className="font-bold text-indigo-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
              Play [{bestCapoSuggestion.playKey}] shapes, Capo Fret {bestCapoSuggestion.capo}
            </span>
          )}
        </div>
      </div>

      {/* Lyrics & Chords Viewer Window */}
      <div 
        ref={viewerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth bg-slate-950"
      >
        <div className="max-w-2xl mx-auto space-y-4 font-mono select-none">
          {parsedLines.map((line, lineIdx) => {
            if (line.isSpacer) {
              return <div key={lineIdx} className="h-6" />;
            }
            if (line.isMetadata) {
              // Center titles, render artist nicely
              if (line.metadataType === 'title') {
                return (
                  <h1 key={lineIdx} className="text-2xl font-extrabold text-slate-200 text-center font-display mb-1 select-text">
                    {line.metadataValue}
                  </h1>
                );
              }
              if (line.metadataType === 'artist') {
                return (
                  <p key={lineIdx} className="text-sm text-slate-500 text-center mb-6 select-text">
                    {line.metadataValue}
                  </p>
                );
              }
              return (
                <div key={lineIdx} className="text-xs text-slate-600 italic border-l-2 border-slate-800 pl-2 select-text">
                  {line.metadataType}: {line.metadataValue}
                </div>
              );
            }

            // Normal Chord Sheet Line
            return (
              <div key={lineIdx} className="flex flex-wrap leading-relaxed py-1">
                {line.items?.map((item, itemIdx) => {
                  // Shift the chords for shapes display
                  // Shift = shapeShift semitones
                  const displayChord = item.chord 
                    ? transposeChord(item.chord, shapeShift)
                    : '';

                  return (
                    <div key={itemIdx} className="flex flex-col mr-1 mb-1 items-start">
                      {/* Chord Tag */}
                      <span 
                        className="h-5 text-sm font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors select-none"
                        style={{ visibility: item.chord ? 'visible' : 'hidden' }}
                      >
                        {displayChord}
                      </span>
                      {/* Lyric segment */}
                      <span className="text-slate-200 text-sm whitespace-pre select-text">
                        {item.lyric || '\u00A0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dictation Status Overlay */}
      {isDictating && (
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Note Dictator Recording...</span>
            <span className="text-xs text-slate-400 italic">"Speak to save practice logs between songs..."</span>
          </div>
          <p className="text-xs text-slate-500 max-w-sm truncate">{dictationText}</p>
        </div>
      )}

      {/* Bottom Practice Dashboard */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        {/* Auto Scroll Controls */}
        <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
              isScrolling 
                ? 'bg-rose-600 hover:bg-rose-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            title={isScrolling ? "Pause Scroll" : "Start Auto-scroll"}
          >
            {isScrolling ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <div className="flex flex-col">
            <div className="flex justify-between items-center w-28 text-[9px] uppercase font-bold text-slate-500">
              <span>Scroll Speed</span>
              <span className="font-mono text-indigo-400">{scrollSpeed}px/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={scrollSpeed}
              onChange={(e) => setScrollSpeed(parseInt(e.target.value, 10))}
              className="w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-1"
            />
          </div>
        </div>

        {/* Practice Logs Summarizer Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDictation}
            className={`flex h-10 px-4 items-center gap-2 rounded-xl border font-semibold text-xs shadow-md transition-all hover:scale-[1.01] ${
              isDictating
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-950/20'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Hands-free note dictate"
          >
            <Mic size={16} className={isDictating ? 'animate-pulse' : ''} />
            {isDictating ? 'Stop Dictation' : 'Hands-Free Notes'}
          </button>
        </div>
      </div>
    </div>
  );
};
