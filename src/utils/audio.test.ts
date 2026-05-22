import { describe, it, expect } from 'vitest';
import { 
  frequencyToNoteNumber, 
  noteNumberToFrequency, 
  getNoteDetails, 
  autoCorrelate 
} from './audio';

describe('Audio & Pitch Utilities', () => {
  describe('MIDI note number conversions', () => {
    it('should convert frequency to note number correctly', () => {
      // 440 Hz is MIDI 69 (A4)
      expect(Math.round(frequencyToNoteNumber(440))).toBe(69);
      // 261.63 Hz is MIDI 60 (C4)
      expect(Math.round(frequencyToNoteNumber(261.63))).toBe(60);
      // 82.41 Hz is MIDI 40 (E2)
      expect(Math.round(frequencyToNoteNumber(82.41))).toBe(40);
    });

    it('should convert note number to frequency correctly', () => {
      expect(Math.round(noteNumberToFrequency(69))).toBe(440);
      expect(Math.round(noteNumberToFrequency(60) * 10) / 10).toBe(261.6);
      expect(Math.round(noteNumberToFrequency(40) * 10) / 10).toBe(82.4);
    });
  });

  describe('getNoteDetails', () => {
    it('should identify note names, octaves, and cents deviations correctly', () => {
      // A4 at exactly 440Hz
      const details = getNoteDetails(440);
      expect(details).not.toBeNull();
      if (details) {
        expect(details.note).toBe('A');
        expect(details.octave).toBe(4);
        expect(details.cents).toBe(0);
      }

      // Slightly sharp A4 (445Hz)
      const sharpDetails = getNoteDetails(445);
      expect(sharpDetails).not.toBeNull();
      if (sharpDetails) {
        expect(sharpDetails.note).toBe('A');
        expect(sharpDetails.cents).toBeGreaterThan(0);
      }

      // Slightly flat A4 (435Hz)
      const flatDetails = getNoteDetails(435);
      expect(flatDetails).not.toBeNull();
      if (flatDetails) {
        expect(flatDetails.note).toBe('A');
        expect(flatDetails.cents).toBeLessThan(0);
      }
    });

    it('should return null for invalid frequencies', () => {
      expect(getNoteDetails(0)).toBeNull();
      expect(getNoteDetails(-10)).toBeNull();
      expect(getNoteDetails(NaN)).toBeNull();
    });
  });

  describe('autoCorrelate', () => {
    it('should return -1 for quiet or silent buffer signals', () => {
      const buffer = new Float32Array(2048); // Silent buffer (all zeros)
      const result = autoCorrelate(buffer, 44100);
      expect(result).toBe(-1);
    });

    it('should return -1 for buffer below root-mean-square amplitude threshold', () => {
      const buffer = new Float32Array(2048);
      buffer.fill(0.001); // Too quiet
      const result = autoCorrelate(buffer, 44100);
      expect(result).toBe(-1);
    });
  });
});
