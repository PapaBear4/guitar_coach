const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map to get semitones from note name
const NOTE_TO_SEMITONE: Record<string, number> = {};
SHARP_NOTES.forEach((note, index) => {
  NOTE_TO_SEMITONE[note] = index;
});
FLAT_NOTES.forEach((note, index) => {
  NOTE_TO_SEMITONE[note] = index;
});

// Tuning offsets in semitones relative to Standard Tuning (EADGBE = 0)
export type GuitarTuning = 'standard' | 'eb' | 'baritone';

export const TUNING_OFFSETS: Record<GuitarTuning, number> = {
  standard: 0,
  eb: -1,
  baritone: -5, // B-B Baritone is 5 semitones lower than Standard E-E
};

export const TUNING_LABELS: Record<GuitarTuning, string> = {
  standard: 'Standard (E A D G B E)',
  eb: 'Eb Standard (Eb Ab Db Gb Bb Eb)',
  baritone: 'B Baritone (B E A D F# B)',
};

// Easy/Common chord shapes for rhythm guitarists
const EASY_SHAPE_KEYS = ['G', 'C', 'D', 'E', 'A'];

/**
 * Normalizes a note name to standard representation
 */
export function normalizeNote(note: string, useFlats = false): string {
  const semitone = NOTE_TO_SEMITONE[note];
  if (semitone === undefined) return note;
  const list = useFlats ? FLAT_NOTES : SHARP_NOTES;
  return list[semitone];
}

/**
 * Transposes a single note by a number of semitones
 */
export function transposeNote(note: string, semitones: number, useFlats = false): string {
  const currentSemitone = NOTE_TO_SEMITONE[note];
  if (currentSemitone === undefined) return note; // Return as-is if not recognized
  
  let targetSemitone = (currentSemitone + semitones) % 12;
  if (targetSemitone < 0) targetSemitone += 12;
  
  const list = useFlats || note.includes('b') ? FLAT_NOTES : SHARP_NOTES;
  return list[targetSemitone];
}

/**
 * Transposes a chord symbol (e.g. C#m7, Fmaj7/A, G/B) by semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;

  // Handle slash chords (e.g., C/E)
  if (chord.includes('/')) {
    const [base, slash] = chord.split('/');
    return `${transposeChord(base, semitones)}/${transposeChord(slash, semitones)}`;
  }

  // Parse root note and modifier
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const [, root, suffix] = match;
  const transposedRoot = transposeNote(root, semitones);
  return `${transposedRoot}${suffix}`;
}

/**
 * Checks if a line contains only chord symbols and whitespace.
 * Used for parsing standard chord-above-lyrics text.
 */
export function isChordLine(line: string): boolean {
  if (line.trim() === '') return false;
  
  // Replace common chord letters, symbols, modifiers, and slashes with spaces
  // then check if anything other than space remains.
  // Standard chords match patterns like: G, C#m, A7sus4, Fmaj7/A, D/F#
  const tokens = line.trim().split(/\s+/);
  
  const chordRegex = /^[A-G][#b]?(m|min|maj|dim|aug|sus|add|no)?\d*(maj\d|sus\d|add\d)?(\/[A-G][#b]?)?$/i;
  
  let validChords = 0;
  for (const token of tokens) {
    if (chordRegex.test(token) || ['N.C.', 'NC', '|', '-', '/'].includes(token.toUpperCase())) {
      validChords++;
    }
  }
  
  // If at least 70% of tokens in the line look like chords/music markers, treat it as a chord line
  return validChords / tokens.length >= 0.7;
}

/**
 * Converts standard chords-above-lyrics sheet into ChordPro format ([C]Lyrics)
 */
export function convertStandardToChordPro(text: string): string {
  const lines = text.split('\n');
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // Check if current line is chords, and next line is lyrics
    if (isChordLine(currentLine)) {
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      
      if (nextLine !== '' && !isChordLine(nextLine)) {
        // We have a chords line and a lyrics line. Merge them!
        let mergedLine = '';
        
        // Find chord positions
        const chordRegex = /\S+/g;
        let match;
        const chordsInLine: { chord: string; index: number }[] = [];
        
        while ((match = chordRegex.exec(currentLine)) !== null) {
          chordsInLine.push({
            chord: match[0],
            index: match.index,
          });
        }
        
        // Insert chords into lyrics based on visual spacing
        let lyricsPos = 0;
        for (const c of chordsInLine) {
          // Add lyrics up to the visual start of the chord
          const lyricsChunk = nextLine.substring(lyricsPos, c.index);
          mergedLine += lyricsChunk;
          
          // Append the bracketed chord
          mergedLine += `[${c.chord}]`;
          
          lyricsPos = c.index;
        }
        
        // Add the rest of the lyrics
        if (lyricsPos < nextLine.length) {
          mergedLine += nextLine.substring(lyricsPos);
        }
        
        resultLines.push(mergedLine);
        i++; // Skip the lyrics line we just merged
      } else {
        // It's a chord line but no lyrics line follows (e.g. instrumental, outro, or multiple chord lines)
        // Convert to inline chords with space spacing
        const bracketed = currentLine.replace(/(\S+)/g, '[$1]');
        resultLines.push(bracketed);
      }
    } else {
      // It's a regular lyrics line or metadata line
      resultLines.push(currentLine);
    }
  }

  return resultLines.join('\n');
}

/**
 * Transposes a ChordPro formatted text by semitones
 */
export function transposeChordPro(text: string, semitones: number): string {
  if (semitones === 0) return text;
  
  // Match anything inside square brackets
  return text.replace(/\[([^\]]+)\]/g, (match, chord) => {
    // Check if it's a valid chord, not metadata
    if (chord.startsWith('#') || chord.includes(':')) {
      return match; // Keep metadata tags like [title: Hello] as-is
    }
    return `[${transposeChord(chord, semitones)}]`;
  });
}

/**
 * Parses ChordPro text into structures for easy rendering
 */
export interface ChordLineItem {
  chord?: string;
  lyric: string;
}

export interface SongLine {
  isMetadata: boolean;
  isSpacer: boolean;
  metadataType?: string;
  metadataValue?: string;
  items?: ChordLineItem[];
  rawText?: string;
}

export function parseChordPro(text: string): SongLine[] {
  const lines = text.split('\n');
  const songLines: SongLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      songLines.push({ isMetadata: false, isSpacer: true });
      continue;
    }

    // Check for ChordPro directives: {title: Song Title} or [title: Song Title]
    const directiveMatch = trimmed.match(/^\{([^:]+):\s*(.*)\}$/) || trimmed.match(/^\[([^:]+):\s*(.*)\]$/);
    if (directiveMatch) {
      songLines.push({
        isMetadata: true,
        isSpacer: false,
        metadataType: directiveMatch[1].toLowerCase(),
        metadataValue: directiveMatch[2],
        rawText: line,
      });
      continue;
    }

    // Parse chords and lyrics mix
    // Regex matches either [Chord] or plain text segment
    const segmentRegex = /(\[[^\]]+\]|[^[]+)/g;
    let match;
    const items: ChordLineItem[] = [];
    let currentChord: string | undefined = undefined;

    while ((match = segmentRegex.exec(line)) !== null) {
      const segment = match[0];
      
      if (segment.startsWith('[') && segment.endsWith(']')) {
        currentChord = segment.slice(1, -1);
      } else {
        // Lyric segment
        items.push({
          chord: currentChord,
          lyric: segment,
        });
        currentChord = undefined; // Reset for next segment
      }
    }

    // If a chord was at the very end of the line with no following lyrics
    if (currentChord !== undefined) {
      items.push({
        chord: currentChord,
        lyric: '',
      });
    }

    if (items.length > 0) {
      songLines.push({
        isMetadata: false,
        isSpacer: false,
        items,
        rawText: line,
      });
    } else {
      songLines.push({
        isMetadata: false,
        isSpacer: false,
        rawText: line,
        items: [{ lyric: line }],
      });
    }
  }

  return songLines;
}

/**
 * Calculates capo position and play key given concert key and tuning.
 * Goal: Find a capo position 0-11 that results in shapes of an easy key (C, G, D, A, E).
 */
export function calculateCapo(
  concertKey: string, 
  tuning: GuitarTuning
): { capo: number; playKey: string; score: number }[] {
  const tuningOffset = TUNING_OFFSETS[tuning]; // e.g. -1 for Eb, -5 for Baritone
  const concertSemitone = NOTE_TO_SEMITONE[normalizeNote(concertKey)];
  
  if (concertSemitone === undefined) {
    return [{ capo: 0, playKey: concertKey, score: 0 }];
  }

  const results: { capo: number; playKey: string; score: number }[] = [];

  // Loop through capo frets 0 to 11
  for (let capo = 0; capo < 12; capo++) {
    // Formula: Shape pitch = Concert Pitch - Tuning Offset - Capo Fret
    let shapeSemitone = (concertSemitone - tuningOffset - capo) % 12;
    if (shapeSemitone < 0) shapeSemitone += 12;

    const playKey = SHARP_NOTES[shapeSemitone];
    
    // Score based on how easy the key is to play (lower index = higher priority)
    let score: number;
    const easyIndex = EASY_SHAPE_KEYS.indexOf(playKey);
    if (easyIndex !== -1) {
      // Keys like G and C are best (score higher), capo 0 is preferred to capo 10
      score = (10 - easyIndex) * 2 - (capo * 0.5);
    } else {
      // Non-easy key shapes get a penalty
      score = -10 - capo;
    }

    results.push({ capo, playKey, score });
  }

  // Sort by score descending (best matches first)
  return results.sort((a, b) => b.score - a.score);
}
