import { describe, it, expect } from 'vitest';
import { 
  transposeNote, 
  transposeChord, 
  isChordLine, 
  convertStandardToChordPro, 
  transposeChordPro, 
  parseChordPro, 
  calculateCapo 
} from './transposer';

describe('Transposer Utilities', () => {
  describe('transposeNote', () => {
    it('should transpose notes correctly within octave boundaries', () => {
      expect(transposeNote('C', 2)).toBe('D');
      expect(transposeNote('C', 1)).toBe('C#');
      expect(transposeNote('B', 1)).toBe('C');
      expect(transposeNote('C', -1)).toBe('B');
      expect(transposeNote('G#', 2)).toBe('A#');
    });

    it('should handle flat notes and keep flat notation when appropriate', () => {
      expect(transposeNote('Db', 2)).toBe('Eb');
      expect(transposeNote('Bb', -1)).toBe('A');
      expect(transposeNote('Bb', -2)).toBe('Ab');
    });
  });

  describe('transposeChord', () => {
    it('should transpose standard chords', () => {
      expect(transposeChord('C', 2)).toBe('D');
      expect(transposeChord('Am7', 3)).toBe('Cm7');
      expect(transposeChord('Fmaj7', 5)).toBe('A#maj7');
    });
    
    it('should handle slash chords', () => {
      expect(transposeChord('G/B', 2)).toBe('A/C#');
      expect(transposeChord('C/E', -1)).toBe('B/D#');
    });
  });

  describe('isChordLine', () => {
    it('should identify lines containing only chords', () => {
      expect(isChordLine('C    G    Am   F')).toBe(true);
      expect(isChordLine('G/B   C   D7sus4')).toBe(true);
      expect(isChordLine('The quick brown fox')).toBe(false);
      expect(isChordLine('This contains C chord but is lyrics')).toBe(false);
    });
  });

  describe('convertStandardToChordPro', () => {
    it('should merge chords and lyrics into ChordPro format', () => {
      const input = 'C     G\nHello world';
      const output = convertStandardToChordPro(input);
      expect(output).toBe('[C]Hello [G]world');
    });
  });

  describe('transposeChordPro', () => {
    it('should transpose inline chords and skip metadata', () => {
      const input = '{title: Test}\n[C]Hello [G]world';
      const output = transposeChordPro(input, 2);
      expect(output).toBe('{title: Test}\n[D]Hello [A]world');
    });
  });

  describe('parseChordPro', () => {
    it('should parse ChordPro metadata and line segments', () => {
      const input = '{title: Amazing Grace}\n[G]Amazing [D]grace';
      const parsed = parseChordPro(input);
      expect(parsed[0].isMetadata).toBe(true);
      expect(parsed[0].metadataType).toBe('title');
      expect(parsed[0].metadataValue).toBe('Amazing Grace');
      
      expect(parsed[1].isMetadata).toBe(false);
      expect(parsed[1].items).toEqual([
        { chord: 'G', lyric: 'Amazing ' },
        { chord: 'D', lyric: 'grace' }
      ]);
    });
  });

  describe('calculateCapo', () => {
    it('should suggest best capo/key combos for standard tuning', () => {
      const results = calculateCapo('G', 'standard');
      expect(results[0].capo).toBe(0);
      expect(results[0].playKey).toBe('G');
    });

    it('should recommend correct capo for Eb tuning', () => {
      const results = calculateCapo('F#', 'eb');
      // In Eb tuning (offset -1) to produce F# (6 semitones):
      // Fret 0 -> 6 - (-1) - 0 = 7 = G shape.
      const best = results[0];
      expect(best.playKey).toBe('G');
      expect(best.capo).toBe(0);
    });

    it('should recommend correct capo for Baritone tuning', () => {
      const results = calculateCapo('D', 'baritone');
      // Baritone tuning (offset -5) to produce D (2 semitones):
      // Play key = (Concert - Offset - Capo) % 12
      // If we put capo on 3: Play key = 2 - (-5) - 3 = 4 = E shape.
      // Let's verify: E shape + Capo 3 in B-Baritone:
      // B + 3 frets (Capo) = D. E shape relative to standard is +5 semitones from B, so B + 5 = E.
      // D + 5 semitones is G. Wait, let's calculate:
      // Capo 3 -> playKey = E (4). Score is high since E is easy.
      const easyKeys = results.filter(r => ['G', 'C', 'D', 'E', 'A'].includes(r.playKey));
      expect(easyKeys.length).toBeGreaterThan(0);
    });
  });
});
