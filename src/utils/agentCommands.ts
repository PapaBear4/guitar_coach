export interface AgentAction {
  type: 
    | 'transpose'
    | 'transpose_to_key'
    | 'create_setlist'
    | 'add_to_setlist'
    | 'filter_tuning'
    | 'search_library'
    | 'set_capo'
    | 'set_tuning'
    | 'log_note'
    | 'suggest_capo'
    | 'stretch_vocals'
    | 'unknown';
  args: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  message: string;
}

/**
 * Parses user text inputs into structured actions with helper messages
 */
export function parseAgentCommand(text: string): AgentAction {
  const t = text.trim();

  // 1. Transpose by semitones (e.g., "transpose up 2", "shift down 1 semitone")
  const transposeValMatch = t.match(/(?:transpose|shift)\s+(?:up\s+by|down\s+by|up|down|by)?\s*(-?\d+)\s*(?:semitones?|steps?|frets?)?/i);
  if (transposeValMatch) {
    let val = parseInt(transposeValMatch[1], 10);
    const direction = transposeValMatch[0].toLowerCase();
    
    // Adjust sign if 'down' was specified but value is positive
    if (direction.includes('down') && val > 0) {
      val = -val;
    }
    
    return {
      type: 'transpose',
      args: { value: val },
      message: `Adjusting song pitch by ${val} semitone${Math.abs(val) !== 1 ? 's' : ''}.`
    };
  }

  // 2. Transpose to specific key (e.g., "transpose to G", "transpose to key of C#")
  const transposeKeyMatch = t.match(/(?:transpose|shift)\s+(?:to\s+)?(?:key\s+of\s+)?([A-G][#b]?)/i);
  if (transposeKeyMatch) {
    const key = transposeKeyMatch[1];
    return {
      type: 'transpose_to_key',
      args: { key },
      message: `Transposing the chord sheet to the key of ${key}.`
    };
  }

  // 3. Create setlist (e.g., "create setlist Sunday Morning", "make a setlist called gig 1")
  const createSetlistMatch = t.match(/(?:create|make|new)\s+(?:a\s+)?setlist\s+(?:named|called\s+)?["']?([^"']+)["']?/i);
  if (createSetlistMatch) {
    const name = createSetlistMatch[1];
    return {
      type: 'create_setlist',
      args: { name },
      message: `Creating a new setlist named "${name}". You can now add songs to it.`
    };
  }

  // 4. Add song to setlist (e.g., "add Amazing Grace to Sunday Morning", "put Hotel California in gig 1")
  const addToSetlistMatch = t.match(/(?:add|put)\s+(?:song\s+)?["']?([^"']+)["']?\s+(?:to|into)\s+(?:setlist\s+)?["']?([^"']+)["']?/i);
  if (addToSetlistMatch) {
    return {
      type: 'add_to_setlist',
      args: { 
        songTitle: addToSetlistMatch[1].trim(), 
        setlistName: addToSetlistMatch[2].trim() 
      },
      message: `Adding "${addToSetlistMatch[1].trim()}" to the setlist "${addToSetlistMatch[2].trim()}".`
    };
  }

  // 5. Change Capo (e.g., "set capo to 3", "put capo on fret 2")
  const capoMatch = t.match(/(?:set|put|change)\s+capo\s+(?:at|on|to)?\s*(?:fret\s+)?(\d+)/i);
  if (capoMatch) {
    const fret = parseInt(capoMatch[1], 10);
    return {
      type: 'set_capo',
      args: { fret },
      message: `Setting capo to fret ${fret}.`
    };
  }

  // 6. Change Guitar Tuning (e.g., "change tuning to Eb standard", "set tuning to baritone")
  const tuningMatch = t.match(/(?:set|change|switch)\s+(?:guitar\s+)?tuning\s+(?:to\s+)?(standard|eb|baritone|eb\s+standard|b-b\s+baritone)/i);
  if (tuningMatch) {
    let tuning = tuningMatch[1].toLowerCase();
    if (tuning.includes('eb')) tuning = 'eb';
    if (tuning.includes('baritone') || tuning.includes('b-b')) tuning = 'baritone';
    if (tuning.includes('standard') && !tuning.includes('eb')) tuning = 'standard';
    
    return {
      type: 'set_tuning',
      args: { tuning },
      message: `Setting guitar tuning mode to ${tuning === 'eb' ? 'Eb Standard' : tuning === 'baritone' ? 'B-B Baritone' : 'Standard'}.`
    };
  }

  // 7. Log Note (e.g., "log note practice vocals on bridge", "add note check transition")
  const noteMatch = t.match(/(?:log|add)\s+(?:practice\s+)?note\s+(?:to\s+active\s+song\s+)?(?:that\s+)?(.*)/i);
  if (noteMatch) {
    return {
      type: 'log_note',
      args: { noteText: noteMatch[1].trim() },
      message: `Adding practice note: "${noteMatch[1].trim()}" to the active song.`
    };
  }

  // 8. Suggest Capo (e.g., "suggest capo", "calculate capo for Eb", "help me with capo")
  const suggestMatch = t.match(/(?:suggest|recommend|calculate|help)\s+(?:with\s+)?(?:the\s+)?capo/i);
  if (suggestMatch) {
    return {
      type: 'suggest_capo',
      args: {},
      message: 'Calculating optimal capo positions to match standard chord shapes with your active vocal range...'
    };
  }

  // 9. Filter songs by tuning
  const filterTuningMatch = t.match(/(?:show|filter|find)\s+(?:songs\s+in\s+)?(standard|eb|baritone)\s+tuning/i);
  if (filterTuningMatch) {
    const tuning = filterTuningMatch[1].toLowerCase();
    return {
      type: 'filter_tuning',
      args: { tuning },
      message: `Filtering song library for songs in ${tuning} tuning.`
    };
  }

  // 10. Search Library
  const searchMatch = t.match(/(?:search|find)\s+(?:for\s+)?["']?([^"']+)["']?/i);
  if (searchMatch) {
    return {
      type: 'search_library',
      args: { query: searchMatch[1].trim() },
      message: `Searching library for "${searchMatch[1].trim()}".`
    };
  }

  // 11. Stretch Vocals (e.g., "stretch my vocals", "stretch range", "push limits")
  const stretchMatch = t.match(/(?:stretch|push)\s+(?:my\s+)?(?:vocals|range|limits?|voice)/i);
  if (stretchMatch) {
    return {
      type: 'stretch_vocals',
      args: {},
      message: 'Calculating key transitions to stretch your vocal abilities...'
    };
  }

  return {
    type: 'unknown',
    args: {},
    message: "I didn't quite catch that. Try saying something like:\n• 'transpose up 2'\n• 'set capo to 3'\n• 'change tuning to baritone'\n• 'create setlist Sunday Set'\n• 'add note practice chorus vocals'\n• 'suggest capo'\n• 'stretch vocals'"
  };
}
