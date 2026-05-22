import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { autoCorrelate, getNoteDetails, GUITAR_STRINGS } from '../utils/audio';
import type { DetectedNote } from '../utils/audio';
import { Mic, Volume2, Award, BarChart } from 'lucide-react';

export const PitchVisualizer: React.FC = () => {
  const { vocalRange, updateVocalRange, activeSong } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<DetectedNote | null>(null);
  
  // Vocal Range Tester state
  const [testingMode, setTestingMode] = useState<'none' | 'low' | 'high'>('none');
  const [tempLow, setTempLow] = useState<DetectedNote | null>(null);
  const [tempHigh, setTempHigh] = useState<DetectedNote | null>(null);

  // References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPitchDetection();
    };
  }, []);

  const startPitchDetection = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        alert("Web Audio API is not supported in this browser.");
        return;
      }
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: false 
        } 
      });
      streamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsRecording(true);
      
      const buffer = new Float32Array(analyser.fftSize);
      
      const updatePitch = () => {
        if (!analyserRef.current || !audioCtx) return;
        
        analyserRef.current.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, audioCtx.sampleRate);
        
        if (freq !== -1) {
          const details = getNoteDetails(freq);
          if (details) {
            setDetectedPitch(details);
            
            // Capture vocal range bounds
            if (testingMode === 'low') {
              setTempLow(prev => {
                if (!prev || details.noteNumber < prev.noteNumber) {
                  return details;
                }
                return prev;
              });
            } else if (testingMode === 'high') {
              setTempHigh(prev => {
                if (!prev || details.noteNumber > prev.noteNumber) {
                  return details;
                }
                return prev;
              });
            }
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(updatePitch);
      };

      animationFrameRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required for pitch detection. Please check browser permissions.");
    }
  };

  function stopPitchDetection() {
    setIsRecording(false);
    setDetectedPitch(null);
    setTestingMode('none');

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function toggleRecording() {
    if (isRecording) {
      stopPitchDetection();
    } else {
      startPitchDetection();
    }
  }

  // Synthesize reference tones for tuning
  function playReferenceTone(freq: number) {
    try {
      const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle'; // Warm, flute-like tone (easier on ears than sine)
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (err) {
      console.error(err);
    }
  }

  const saveVocalRange = () => {
    if (tempLow && tempHigh) {
      updateVocalRange(
        `${tempLow.note}${tempLow.octave}`, 
        tempLow.frequency, 
        `${tempHigh.note}${tempHigh.octave}`, 
        tempHigh.frequency
      );
      alert(`Vocal profile updated! New Range: ${tempLow.note}${tempLow.octave} to ${tempHigh.note}${tempHigh.octave}`);
      setTempLow(null);
      setTempHigh(null);
      setTestingMode('none');
    }
  };

  // Determine current active tuner reference layout
  const currentTuningType = activeSong?.tuning || 'standard';
  const currentStrings = GUITAR_STRINGS[currentTuningType];

  return (
    <div className="space-y-6">
      {/* Visual Tuner & Pitch Gauge */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center">
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`}></span>
          {isRecording ? 'Listening' : 'Tuner Offline'}
        </div>

        <h3 className="text-slate-400 text-sm font-semibold mb-6">Real-Time Pitch Coach</h3>

        {/* Big Note Gauge */}
        <div className="relative flex flex-col items-center justify-center h-48 w-48 rounded-full border border-slate-800 bg-slate-950 shadow-inner">
          {detectedPitch ? (
            <>
              <span className="text-5xl font-extrabold text-indigo-400 font-display transition-all scale-105 duration-100">
                {detectedPitch.note}
                <span className="text-2xl text-slate-500 font-normal">{detectedPitch.octave}</span>
              </span>
              <span className="text-xs text-slate-500 mt-2 font-mono">{detectedPitch.frequency} Hz</span>
              
              {/* Pitch Deviation Text */}
              <span className={`text-xs font-semibold mt-1 px-2 py-0.5 rounded-full ${
                Math.abs(detectedPitch.cents) <= 5 
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900' 
                  : detectedPitch.cents > 5 
                    ? 'bg-amber-950/50 text-amber-400 border border-amber-900'
                    : 'bg-indigo-950/50 text-indigo-400 border border-indigo-900'
              }`}>
                {Math.abs(detectedPitch.cents) <= 5 
                  ? 'In Tune' 
                  : detectedPitch.cents > 0 
                    ? `+${detectedPitch.cents}¢ Sharp` 
                    : `${detectedPitch.cents}¢ Flat`}
              </span>
            </>
          ) : (
            <div className="text-center px-4">
              <Mic size={36} className={`mx-auto mb-2 text-slate-600 ${isRecording ? 'animate-pulse text-indigo-500' : ''}`} />
              <p className="text-xs text-slate-500 leading-relaxed">
                {isRecording ? "Sing or pluck a string..." : "Turn on the Coach mic to start practicing"}
              </p>
            </div>
          )}
        </div>

        {/* Tuning Dial Visual Indicator */}
        <div className="w-full max-w-sm mt-8 space-y-2">
          <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            {/* Center tick */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 bg-slate-600 z-10"></div>
            
            {/* Moving dial pointer */}
            {detectedPitch && (
              <div 
                className={`absolute top-0 h-full w-4 -ml-2 rounded-full blur-[1px] transition-all duration-75 ${
                  Math.abs(detectedPitch.cents) <= 5 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-indigo-400'
                }`}
                style={{ 
                  left: `${50 + (Math.max(-50, Math.min(50, detectedPitch.cents)))}%` 
                }}
              ></div>
            )}
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase font-mono px-1">
            <span>-50¢ Flat</span>
            <span className={detectedPitch && Math.abs(detectedPitch.cents) <= 5 ? 'text-emerald-400' : ''}>In Tune</span>
            <span>+50¢ Sharp</span>
          </div>
        </div>

        {/* Master Microphone Button */}
        <button
          onClick={toggleRecording}
          className={`mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 ${
            isRecording 
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-950/20'
          }`}
        >
          <Mic size={18} />
          {isRecording ? 'Mute Coach Microphone' : 'Enable Coach Microphone'}
        </button>
      </div>

      {/* Vocal Range Log Module */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-900 text-indigo-400">
            <BarChart size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-100">Live Vocal Range Log</h4>
            <p className="text-xs text-slate-500">Record notes to check & expand your range</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Low Note Test Card */}
          <button
            onClick={() => {
              if (!isRecording) startPitchDetection();
              setTestingMode(testingMode === 'low' ? 'none' : 'low');
            }}
            disabled={!isRecording && isRecording} // Can enable mic automatically
            className={`p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between h-24 ${
              testingMode === 'low'
                ? 'bg-indigo-950 border-indigo-500 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Record Lowest note</span>
            <span className="text-xl font-bold font-display mt-2 text-slate-200">
              {tempLow ? `${tempLow.note}${tempLow.octave}` : 'Click to sing'}
            </span>
            {tempLow && <span className="text-[10px] text-indigo-400 font-mono">{tempLow.frequency} Hz</span>}
          </button>

          {/* High Note Test Card */}
          <button
            onClick={() => {
              if (!isRecording) startPitchDetection();
              setTestingMode(testingMode === 'high' ? 'none' : 'high');
            }}
            className={`p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between h-24 ${
              testingMode === 'high'
                ? 'bg-indigo-950 border-indigo-500 text-indigo-100 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Record Highest note</span>
            <span className="text-xl font-bold font-display mt-2 text-slate-200">
              {tempHigh ? `${tempHigh.note}${tempHigh.octave}` : 'Click to sing'}
            </span>
            {tempHigh && <span className="text-[10px] text-indigo-400 font-mono">{tempHigh.frequency} Hz</span>}
          </button>
        </div>

        {/* Save range buttons */}
        {tempLow && tempHigh && (
          <button
            onClick={saveVocalRange}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold py-2.5 rounded-xl shadow-lg hover:from-emerald-500 hover:to-teal-500 hover:scale-[1.01] transition-all"
          >
            <Award size={16} />
            Update Coach Vocal Profile
          </button>
        )}

        <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-xs text-slate-400">
          <span>Active Profile Range:</span>
          <span className="font-bold text-indigo-400 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg">
            {vocalRange.min} - {vocalRange.max} ({Math.round(vocalRange.minFreq)}Hz - {Math.round(vocalRange.maxFreq)}Hz)
          </span>
        </div>
      </div>

      {/* Manual Guitar Reference Frequencies */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
              <Volume2 size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Reference Notes</h4>
              <p className="text-xs text-slate-500">Listen & tune manually</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-indigo-400 uppercase">
            {currentTuningType === 'eb' ? 'Eb Standard' : currentTuningType === 'baritone' ? 'B Baritone' : 'Standard'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {currentStrings.map((str, index) => (
            <button
              key={index}
              onClick={() => playReferenceTone(str.freq)}
              className="group flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-150"
            >
              <span className="text-[9px] font-bold text-slate-600 group-hover:text-slate-400 uppercase font-mono">{str.label.split(' ')[0]}</span>
              <span className="text-base font-extrabold font-display my-1">{str.note}</span>
              <span className="text-[9px] font-mono text-slate-500">{str.freq}Hz</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
