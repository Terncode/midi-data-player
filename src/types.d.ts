
declare module 'midi-converter' {
    export interface Midi {
        header: {
            formatType: number;
            trackCount: number;
            ticksPerBeat: number;
        };
        tracks: MidiTrack[][];
    }
    
    type MidiTrack = MidiTrackMeta | MidiTrackSignature | MidiTrackController |
                    MidiTrackPitchBend | MidiTrackProgramChange | MidiTrackNoteOn |
                    MidiTrackNoteOn | MidiTrackNoteOff;
    interface BaseTrack {
        deltaTime: number;
    }
    
    export interface MidiTrackMeta extends BaseTrack {
        type: 'meta';
        subtype: 'unknown';
        data: string;
    }
    export interface MidiTrackSignature extends BaseTrack {
        type: 'meta';
        subtype: 'timeSignature';
        numerator: number;
        denominator: number;
        metronome: number;
        thirtyseconds: number;
    }
    
    export interface MidiTrackController extends BaseTrack {
        type: 'channel';
        subtype: 'controller';
        controllerType: number;
        value: 0;
        channel: number;
    }
    export interface MidiTrackPitchBend extends BaseTrack {
        type: 'channel';
        channel: number;
        subtype: 'pitchBend';
        value: 0;
    }
    export interface MidiTrackProgramChange extends BaseTrack {
        type: 'channel';
        subtype: 'programChange';
        channel: number;
        programNumber: 0;
    }
    export interface MidiTrackNoteOn extends BaseTrack {
        type: 'channel';
        subtype: 'noteOn';
        channel: number;
        velocity: number;
        noteNumber: number;
    }
    export interface MidiTrackNoteOff extends BaseTrack {
        type: 'channel';
        subtype: 'noteOff';
        channel: number;
        velocity: number;
        noteNumber: number;
    }

	export function midiToJson(data: any): Midi;
}
