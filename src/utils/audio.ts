const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface DetectedNote {
  note: string;
  octave: number;
  frequency: number;
  noteNumber: number;
  cents: number;
  expectedFreq: number;
}

/**
 * Converts frequency in Hz to midi note number
 */
export function frequencyToNoteNumber(frequency: number): number {
  return 12 * Math.log2(frequency / 440) + 69;
}

/**
 * Converts midi note number to frequency in Hz
 */
export function noteNumberToFrequency(noteNumber: number): number {
  return 440 * Math.pow(2, (noteNumber - 69) / 12);
}

/**
 * Converts frequency in Hz to details about the note (name, octave, cents deviation)
 */
export function getNoteDetails(frequency: number): DetectedNote | null {
  if (frequency <= 0 || isNaN(frequency)) return null;

  const noteNum = frequencyToNoteNumber(frequency);
  const roundedNoteNum = Math.round(noteNum);
  
  const octave = Math.floor(roundedNoteNum / 12) - 1;
  const noteIndex = (roundedNoteNum % 12 + 12) % 12;
  const noteName = NOTE_NAMES[noteIndex];
  
  const expectedFreq = noteNumberToFrequency(roundedNoteNum);
  const cents = Math.round(1200 * Math.log2(frequency / expectedFreq));

  return {
    note: noteName,
    octave,
    frequency: Math.round(frequency * 10) / 10,
    noteNumber: roundedNoteNum,
    cents,
    expectedFreq: Math.round(expectedFreq * 10) / 10
  };
}

/**
 * Pitch detection using Autocorrelation
 * Adapted from standard Web Audio pitch detection scripts (e.g. Chris Wilson's PitchDetect)
 */
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const size = buffer.length;
  let totalSquare = 0;
  
  // Calculate RMS (Root Mean Square) to verify signal presence
  for (let i = 0; i < size; i++) {
    const val = buffer[i];
    totalSquare += val * val;
  }
  const rms = Math.sqrt(totalSquare / size);
  
  // If signal is too quiet, return -1 (no pitch detected)
  if (rms < 0.008) {
    return -1;
  }

  // Trim quiet space at start and end of buffer (center clipping)
  let r1 = 0;
  let r2 = size - 1;
  const thres = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = size - 1; i >= size / 2; i--) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
      break;
    }
  }

  const trimmedBuffer = buffer.subarray(r1, r2);
  const len = trimmedBuffer.length;
  
  const r = new Float32Array(len);
  for (let lag = 0; lag < len; lag++) {
    let sum = 0;
    for (let i = 0; i < len - lag; i++) {
      sum += trimmedBuffer[i] * trimmedBuffer[i + lag];
    }
    r[lag] = sum;
  }

  // Find the first zero-crossing or valley to skip initial high correlation
  let d = 0;
  while (d < len - 1 && r[d] > r[d + 1]) {
    d++;
  }
  
  // Find the highest peak after the initial valley
  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < len; i++) {
    if (r[i] > maxVal) {
      maxVal = r[i];
      maxPos = i;
    }
  }

  let T0 = maxPos;
  
  // Parabolic interpolation for fine frequency estimation
  if (T0 > 0 && T0 < len - 1) {
    const alpha = r[T0 - 1];
    const beta = r[T0];
    const gamma = r[T0 + 1];
    if (alpha - 2 * beta + gamma !== 0) {
      const p = 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
      T0 = T0 + p;
    }
  }

  if (T0 > 0) {
    const freq = sampleRate / T0;
    // Limit pitch detection to vocal and guitar ranges (50Hz - 1600Hz)
    if (freq >= 50 && freq <= 1600) {
      return freq;
    }
  }

  return -1;
}

/**
 * Standard tuning frequencies for guitar strings
 */
export const GUITAR_STRINGS = {
  standard: [
    { note: 'E', octave: 4, freq: 329.63, label: '1st (High E)' },
    { note: 'B', octave: 3, freq: 246.94, label: '2nd (B)' },
    { note: 'G', octave: 3, freq: 196.00, label: '3rd (G)' },
    { note: 'D', octave: 3, freq: 146.83, label: '4th (D)' },
    { note: 'A', octave: 2, freq: 110.00, label: '5th (A)' },
    { note: 'E', octave: 2, freq: 82.41, label: '6th (Low E)' },
  ],
  eb: [
    { note: 'Eb', octave: 4, freq: 311.13, label: '1st (High Eb)' },
    { note: 'Bb', octave: 3, freq: 233.08, label: '2nd (Bb)' },
    { note: 'Gb', octave: 3, freq: 185.00, label: '3rd (Gb)' },
    { note: 'Db', octave: 3, freq: 138.59, label: '4th (Db)' },
    { note: 'Ab', octave: 2, freq: 103.83, label: '5th (Ab)' },
    { note: 'Eb', octave: 2, freq: 77.78, label: '6th (Low Eb)' },
  ],
  baritone: [
    { note: 'B', octave: 3, freq: 246.94, label: '1st (High B)' },
    { note: 'F#', octave: 3, freq: 185.00, label: '2nd (F#)' },
    { note: 'D', octave: 3, freq: 146.83, label: '3rd (D)' },
    { note: 'A', octave: 2, freq: 110.00, label: '4th (A)' },
    { note: 'E', octave: 2, freq: 82.41, label: '5th (E)' },
    { note: 'B', octave: 1, freq: 61.74, label: '6th (Low B)' },
  ]
};
