import { describe, it, expect } from 'vitest';
import { parseAgentCommand } from './agentCommands';

describe('Deterministic NLP Command Parser', () => {
  it('should parse transpose relative semitones commands', () => {
    expect(parseAgentCommand('transpose up 2')).toEqual({
      type: 'transpose',
      args: { value: 2 },
      message: 'Adjusting song pitch by 2 semitones.'
    });

    expect(parseAgentCommand('transpose down 1')).toEqual({
      type: 'transpose',
      args: { value: -1 },
      message: 'Adjusting song pitch by -1 semitone.'
    });

    expect(parseAgentCommand('shift up by 3 frets')).toEqual({
      type: 'transpose',
      args: { value: 3 },
      message: 'Adjusting song pitch by 3 semitones.'
    });
  });

  it('should parse transpose to key commands', () => {
    expect(parseAgentCommand('transpose to G')).toEqual({
      type: 'transpose_to_key',
      args: { key: 'G' },
      message: 'Transposing the chord sheet to the key of G.'
    });

    expect(parseAgentCommand('shift to key of C#')).toEqual({
      type: 'transpose_to_key',
      args: { key: 'C#' },
      message: 'Transposing the chord sheet to the key of C#.'
    });
  });

  it('should parse create setlist commands', () => {
    expect(parseAgentCommand('create setlist Sunday Morning')).toEqual({
      type: 'create_setlist',
      args: { name: 'Sunday Morning' },
      message: 'Creating a new setlist named "Sunday Morning". You can now add songs to it.'
    });

    expect(parseAgentCommand('make a setlist called "Bar Gig 1"')).toEqual({
      type: 'create_setlist',
      args: { name: 'Bar Gig 1' },
      message: 'Creating a new setlist named "Bar Gig 1". You can now add songs to it.'
    });
  });

  it('should parse add song to setlist commands', () => {
    expect(parseAgentCommand('add "Amazing Grace" to setlist "Sunday Morning"')).toEqual({
      type: 'add_to_setlist',
      args: { songTitle: 'Amazing Grace', setlistName: 'Sunday Morning' },
      message: 'Adding "Amazing Grace" to the setlist "Sunday Morning".'
    });

    expect(parseAgentCommand('put Ghost into Bar Gig')).toEqual({
      type: 'add_to_setlist',
      args: { songTitle: 'Ghost', setlistName: 'Bar Gig' },
      message: 'Adding "Ghost" to the setlist "Bar Gig".'
    });
  });

  it('should parse set capo commands', () => {
    expect(parseAgentCommand('set capo to 3')).toEqual({
      type: 'set_capo',
      args: { fret: 3 },
      message: 'Setting capo to fret 3.'
    });

    expect(parseAgentCommand('put capo on fret 5')).toEqual({
      type: 'set_capo',
      args: { fret: 5 },
      message: 'Setting capo to fret 5.'
    });
  });

  it('should parse change guitar tuning commands', () => {
    expect(parseAgentCommand('change tuning to Eb standard')).toEqual({
      type: 'set_tuning',
      args: { tuning: 'eb' },
      message: 'Setting guitar tuning mode to Eb Standard.'
    });

    expect(parseAgentCommand('set guitar tuning to baritone')).toEqual({
      type: 'set_tuning',
      args: { tuning: 'baritone' },
      message: 'Setting guitar tuning mode to B-B Baritone.'
    });

    expect(parseAgentCommand('switch tuning to standard')).toEqual({
      type: 'set_tuning',
      args: { tuning: 'standard' },
      message: 'Setting guitar tuning mode to Standard.'
    });
  });

  it('should parse log note commands', () => {
    expect(parseAgentCommand('log note practice the bridge vocals')).toEqual({
      type: 'log_note',
      args: { noteText: 'practice the bridge vocals' },
      message: 'Adding practice note: "practice the bridge vocals" to the active song.'
    });

    expect(parseAgentCommand('add practice note check transition speeds')).toEqual({
      type: 'log_note',
      args: { noteText: 'check transition speeds' },
      message: 'Adding practice note: "check transition speeds" to the active song.'
    });
  });

  it('should parse suggest capo commands', () => {
    expect(parseAgentCommand('suggest capo')).toEqual({
      type: 'suggest_capo',
      args: {},
      message: 'Calculating optimal capo positions to match standard chord shapes with your active vocal range...'
    });

    expect(parseAgentCommand('calculate capo position')).toEqual({
      type: 'suggest_capo',
      args: {},
      message: 'Calculating optimal capo positions to match standard chord shapes with your active vocal range...'
    });
  });

  it('should parse stretch vocals commands', () => {
    expect(parseAgentCommand('stretch my range')).toEqual({
      type: 'stretch_vocals',
      args: {},
      message: 'Calculating key transitions to stretch your vocal abilities...'
    });

    expect(parseAgentCommand('push limits')).toEqual({
      type: 'stretch_vocals',
      args: {},
      message: 'Calculating key transitions to stretch your vocal abilities...'
    });
  });

  it('should parse filter tuning commands', () => {
    expect(parseAgentCommand('show standard tuning')).toEqual({
      type: 'filter_tuning',
      args: { tuning: 'standard' },
      message: 'Filtering song library for songs in standard tuning.'
    });

    expect(parseAgentCommand('filter baritone tuning')).toEqual({
      type: 'filter_tuning',
      args: { tuning: 'baritone' },
      message: 'Filtering song library for songs in baritone tuning.'
    });
  });

  it('should parse search library commands', () => {
    expect(parseAgentCommand('search for Grace')).toEqual({
      type: 'search_library',
      args: { query: 'Grace' },
      message: 'Searching library for "Grace".'
    });

    expect(parseAgentCommand('find "Pride"')).toEqual({
      type: 'search_library',
      args: { query: 'Pride' },
      message: 'Searching library for "Pride".'
    });
  });

  it('should return unknown for unrecognized commands', () => {
    const result = parseAgentCommand('tell me a joke');
    expect(result.type).toBe('unknown');
    expect(result.message.toLowerCase()).toContain('try saying something like');
  });
});
