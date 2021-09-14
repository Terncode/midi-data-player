import { CIRCLE_OF_FIFTHS, CIRCLE_OF_FOURTHS } from "./midiConstants";
import { MidiTrack } from "./midiTrack";
import { BufferUtils } from "./utils";

export type MidiEventTypes = 'Unknown' | 'Pitch Bend' |
 'Channel Key Pressure' | 'Program Change' | 'Controller Change' | 'Polyphonic Key Pressure' |
 'Note on' | 'Note off' | 'Sysex (escape)' | 'Sysex' | 'Sequencer-Specific Meta-event' | 
 'Key Signature' | 'Time Signature' | 'SMTPE Offset' | 'Set Tempo' | 'End of Track' | 'MIDI Port' | 
 'MIDI Channel Prefix' | 'Device Name' | 'Cue Point' | 'Marker' | 'Lyric' | 'Instrument Name' | 'Sequence/Track Name' | 
 'Copyright Notice' | 'Text Event' |  'Sequence Number'

export interface BaseMidiEvent {
	name: MidiEventTypes;
    track: number;
    delta: number;
	tick: number;
	byteIndex: number;
}

export interface RunningMidiEvent extends BaseMidiEvent {
    running: boolean;
    noteNumber: number;
    noteName: string;
    velocity: number;
}

export interface MidiEventSequenceNumber extends BaseMidiEvent {
    name: 'Sequence Number';
}
export interface MidiEventText extends BaseMidiEvent {
    name: 'Text Event';
    string: string;
}
export interface MidiEventCopyrightNotice extends BaseMidiEvent {
    name: 'Copyright Notice';
}
export interface MidiEventSequenceTrackName extends BaseMidiEvent {
    name: 'Sequence/Track Name'
    string: string;
}
export interface MidiEventInstrumentName extends BaseMidiEvent {
    name: 'Instrument Name'
    string: string;
}
export interface MidiEventLyric extends BaseMidiEvent {
    name: 'Lyric'
    string: string;
}
export interface MidiEventMarker extends BaseMidiEvent {
    name: 'Marker'
}
export interface MidiEventCuePoint extends BaseMidiEvent {
    name: 'Cue Point';
    string: string;
}
export interface MidiEventDeviceName extends BaseMidiEvent {
    name: 'Device Name';
    string: string;
}
export interface MidiEventMidiChannelPrefix extends BaseMidiEvent {
    name: 'MIDI Channel Prefix';
}
export interface MidiEventMidiPort extends BaseMidiEvent {
    name: 'MIDI Port';
    data: number;
}
export interface MidiEventEndOfTheTrack extends BaseMidiEvent {
    name: 'End of Track';
}
export interface MidiEventSetTempo extends BaseMidiEvent {
    name: 'Set Tempo';
    data: number;
}
export interface MidiEventSMTPEOffset extends BaseMidiEvent {
    name: 'SMTPE Offset';
}

export interface MidiEventTimeSignature extends BaseMidiEvent {
    name: 'Time Signature',
    data: Buffer;
    timeSignature: string;
}
export interface MidiEventKeySignature extends BaseMidiEvent {
    name: 'Key Signature';
    data: Buffer;
    keySignature: string;
}
export interface MidiEventSequencerSpecificMetaEvent extends BaseMidiEvent {
    name: 'Sequencer-Specific Meta-event';
}
export interface MidiEventSysex extends BaseMidiEvent {
    name: 'Sysex';
    data: Buffer;
}
export interface MidiEventSysexEscape extends BaseMidiEvent {
    name: 'Sysex (escape)';
    data: Buffer;
}
export interface MidiEventNoteOff extends BaseMidiEvent {
    name: 'Note off',
    channel: number;

    noteNumber: number;
    noteName: string;
    velocity: number;
}

export interface MidiEventNoteOn extends BaseMidiEvent {
    name: 'Note on',
    channel: number;

    noteNumber: number;
    noteName: string;
    velocity: number;
}

export interface MidiEventPolyphonicKeyPressure extends BaseMidiEvent {
    name: 'Polyphonic Key Pressure';
    channel: number;
    note: string;
    pressure: number;
}
export interface MidiEventControllerChange extends BaseMidiEvent {
    name: 'Controller Change';
    channel: number;
    number: number;
    value: number;
}
export interface MidiEventProgramChange extends BaseMidiEvent {
    name: 'Program Change';
    channel: number;
    value: number;
}
export interface MidiEventChannelKeyPressure extends BaseMidiEvent {
    name: 'Channel Key Pressure';
    channel: number;
}
export interface MidiEventPitchBend extends BaseMidiEvent {
    name: 'Pitch Bend';
    channel: number;
    value?: number;
}

export interface MidiEventRunnableNoteOff extends BaseMidiEvent, RunningMidiEvent {}
export interface MidiEventRunnableNoteOn extends BaseMidiEvent, RunningMidiEvent {}
export interface MidiEventRunnablePolyphonicKeyPressure extends BaseMidiEvent, RunningMidiEvent {}
export interface MidiEventRunnableProgramChange extends BaseMidiEvent, RunningMidiEvent {}
export interface MidiEventRunnableChannelKeyPressure extends BaseMidiEvent, RunningMidiEvent {}
export interface MidiEventRunnablePitchBend extends BaseMidiEvent, RunningMidiEvent {}


export interface MidiEventUnknown extends BaseMidiEvent{
    name: 'Unknown';
    data: string;
}
export type MidiEvent = MidiEventSequenceNumber | 
                MidiEventText |
                MidiEventCopyrightNotice |
                MidiEventSequenceTrackName |
                MidiEventInstrumentName |
                MidiEventLyric |
                MidiEventMarker | 
                MidiEventCuePoint |
                MidiEventDeviceName |
                MidiEventMidiChannelPrefix | 
                MidiEventMidiPort | 
                MidiEventEndOfTheTrack |
                MidiEventSetTempo |
                MidiEventSMTPEOffset |
                MidiEventTimeSignature |
                MidiEventKeySignature |
                MidiEventSequencerSpecificMetaEvent |
                MidiEventSysex |
                MidiEventSysexEscape |
                MidiEventNoteOff |
                MidiEventNoteOn |
                MidiEventNoteOff |
                MidiEventNoteOn |
                MidiEventPolyphonicKeyPressure |
                MidiEventProgramChange |
                MidiEventChannelKeyPressure |
                MidiEventPitchBend |
                MidiEventRunnableNoteOff |
                MidiEventRunnableNoteOn |
                MidiEventRunnablePolyphonicKeyPressure |
                MidiEventRunnableProgramChange |
                MidiEventRunnableChannelKeyPressure |
                MidiEventRunnablePitchBend |
                MidiEventUnknown;

export class MidiEventEncoder {
    static getBaseEvent(track: number, delta: number, tick: number, byteIndex: number): BaseMidiEvent {
        return {
            name: 'Unknown',
            track,
            delta,
            tick,
            byteIndex,
        };
    }
    static convertToRunnable(event: BaseMidiEvent, running: boolean, noteNumber: number, noteName: string, velocity: number): RunningMidiEvent {
        const runningEvent = event  as RunningMidiEvent;
        runningEvent.running = running;
        runningEvent.noteNumber = noteNumber;
        runningEvent.noteName = noteName;
        runningEvent.velocity = velocity;
        return runningEvent;
    }
    static handle(hex: number, baseEvent: BaseMidiEvent, eventStartIndex: number, midiTrack: MidiTrack): MidiEvent {
        switch(hex) {
            case 0x00:
                return this.sequenceEvent(baseEvent);
            case 0x01:
                return this.textEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x02:
                return this.copyrightNoticeEvent(baseEvent);
            case 0x03:
                return this.sequenceTrackNameEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x04:
                return this.instrumentNameEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x05: 
                return this.lyricEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x06:
                return this.markerEvent(baseEvent);
            case 0x07:
                return this.cuePointEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x09:
                return this.deviceNameEvent(baseEvent, midiTrack.getStringData(eventStartIndex));
            case 0x20:
                return this.midiChannelPrefixEvent(baseEvent);
            case 0x21:
                return this.midiPortEvent(baseEvent, BufferUtils.bufferToNumber([midiTrack.buffer[eventStartIndex + 3]]))
            case 0x2F:
                return this.endOfTheTrackEvent(baseEvent);
            case 0x51:
                return this.setTempoEvent(baseEvent, Math.round(60000000 / BufferUtils.bufferToNumber(midiTrack.buffer.subarray(eventStartIndex + 3, eventStartIndex + 6))))
            case 0x54:
                return this.smpteOffsetEvent(baseEvent);
            case 0x58:
                return this.timeSignatureEvent(baseEvent, midiTrack.buffer.subarray(eventStartIndex + 3, eventStartIndex + 7))
            case 0x59: 
               return this.keySignatureEvent(baseEvent, midiTrack.buffer.subarray(eventStartIndex + 3, eventStartIndex + 5));
            case 0x7F: // Sequencer-Specific Meta-event
                return this.sequencerSpecificMetaEvent(baseEvent);
        }
           // eventJson.name = 'Unknown: ' + this._buffer[eventStartIndex + 1].toString(16);
        return this.unknownEvent(baseEvent, midiTrack.buffer[eventStartIndex + 1].toString(16));
    }
    static unknownEvent(event: BaseMidiEvent, data: string): MidiEventUnknown {
        return {
            ...event,
            name: "Unknown",
            data
        }
    }
    static sequenceEvent(event: BaseMidiEvent): MidiEventSequenceNumber {
        return { 
            ...event,
            name: 'Sequence Number'
        }
    }
    static textEvent(event: BaseMidiEvent, text: string): MidiEventText {
        return { 
            ...event,
            name: 'Text Event',
            string: text,
        }
    }
    static copyrightNoticeEvent(event: BaseMidiEvent): MidiEventCopyrightNotice {
        return { 
            ...event,
            name: 'Copyright Notice',
        }
    }
    static sequenceTrackNameEvent(event: BaseMidiEvent, text: string): MidiEventSequenceTrackName {
        return { 
            ...event,
            name: 'Sequence/Track Name',
            string: text
        }
    }
    static instrumentNameEvent(event: BaseMidiEvent, text: string): MidiEventInstrumentName {
        return { 
            ...event,
            name: 'Instrument Name',
            string: text
        }
    }
    static lyricEvent(event: BaseMidiEvent, text: string): MidiEventLyric {
        return { 
            ...event,
            name: 'Lyric',
            string: text
        }
    }
    static markerEvent(event: BaseMidiEvent): MidiEventMarker {
        return { 
            ...event,
            name: 'Marker',
        }
    }
    static cuePointEvent(event: BaseMidiEvent, text: string): MidiEventCuePoint {
        return { 
            ...event,
            name: 'Cue Point',
            string: text,
        }
    }
    static deviceNameEvent(event: BaseMidiEvent, text: string): MidiEventDeviceName {
        return { 
            ...event,
            name: 'Device Name',
            string: text,
        }
    }
    static midiChannelPrefixEvent(event: BaseMidiEvent): MidiEventMidiChannelPrefix {
        return { 
            ...event,
            name: 'MIDI Channel Prefix',
        }
    }
    static midiPortEvent(event: BaseMidiEvent, port: number): MidiEventMidiPort {
        return { 
            ...event,
            name: 'MIDI Port',
            data: port
        }
    }
    static endOfTheTrackEvent(event: BaseMidiEvent): MidiEventEndOfTheTrack {
        return { 
            ...event,
            name: 'End of Track'
        }
    }
    static setTempoEvent(event: BaseMidiEvent, tempo: number): MidiEventSetTempo {
        return { 
            ...event,
            name: 'Set Tempo',
            data: tempo
        }
    }
    static smpteOffsetEvent(event: BaseMidiEvent): MidiEventSMTPEOffset {
        return { 
            ...event,
            name: 'SMTPE Offset',
        }
    }
    static timeSignatureEvent(event: BaseMidiEvent, data: Buffer): MidiEventTimeSignature {
        return { 
            ...event,
            name: 'Time Signature',
            data: data,
            timeSignature: `${data[0]}/${Math.pow(2, data[1])}`,
        }
    }
    static keySignatureEvent(event: BaseMidiEvent, data: Buffer): MidiEventKeySignature {
        const eventJson: MidiEventKeySignature = { 
            ...event,
            name: 'Key Signature',
            data: data,
            keySignature: '',
        };
        

        if (eventJson.data[0] >= 0) {
            eventJson.keySignature = CIRCLE_OF_FIFTHS[eventJson.data[0]];

        } else if (eventJson.data[0] < 0) {
            eventJson.keySignature = CIRCLE_OF_FOURTHS[Math.abs(eventJson.data[0])];
        }

        if (eventJson.data[1] == 0) {
            eventJson.keySignature += " Major";

        } else if (eventJson.data[1] == 1) {
            eventJson.keySignature += " Minor";
        }
        return eventJson;
    }
    static sysexEvent(event: BaseMidiEvent, data: Buffer): MidiEventSysex {
        return { 
            ...event,
            name: 'Sysex',
            data: data,
        }
    }
    static sysexEscapeEvent(event: BaseMidiEvent, data: Buffer): MidiEventSysexEscape {
        return { 
            ...event,
            name: 'Sysex (escape)',
            data: data,
        }
    }
    static sequencerSpecificMetaEvent(event: BaseMidiEvent): MidiEventSequencerSpecificMetaEvent {
        return { 
            ...event,
            name: 'Sequencer-Specific Meta-event',
        }
    }
    static noteOnEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, noteNumber?: number, velocity?: number, noteName?: string): MidiEventRunnableNoteOn | MidiEventNoteOn {
        const newEvent: Partial<MidiEventNoteOn> = {
            ...event,
            name: 'Note on',
            channel,
        }
        if (noteNumber !== undefined) {
            newEvent.noteNumber = noteNumber;
        }
        if (velocity !== undefined) {
            newEvent.velocity = velocity;
        }
        if (noteName !== undefined) {
            newEvent.noteName = noteName;
        }
        return newEvent as any;
    }
    static noteOffEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, noteNumber?: number, velocity?: number, noteName?: string): MidiEventRunnableNoteOff | MidiEventNoteOff {
        const newEvent: Partial<MidiEventNoteOff> = {
            ...event,
            name: 'Note off',
            channel,
        }
        if (noteNumber !== undefined) {
            newEvent.noteNumber = noteNumber;
        }
        if (velocity !== undefined) {
            newEvent.velocity = velocity;
        }
        if (noteName !== undefined) {
            newEvent.noteName = noteName;
        }
    
        return newEvent as any;
    }
    static polyphonicKeyPressureEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, note?: string, pressure?: number): MidiEventRunnablePolyphonicKeyPressure | MidiEventPolyphonicKeyPressure {
        const newEvent: Partial<MidiEventPolyphonicKeyPressure> = {
            ...event,
            name: 'Polyphonic Key Pressure',
            channel,
        }
        if (note !== undefined) {
            newEvent.note = note;
        }
        if (pressure !== undefined) {
            newEvent.pressure = pressure;
        }
    
        return newEvent as any;
    }
    static controllerChangeEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, number: number, value: number): MidiEventControllerChange | MidiEventControllerChange {
        const newEvent: Partial<MidiEventControllerChange> = {
            ...event,
            name: 'Controller Change',
            channel,
            number,
            value
        }
        return newEvent as any;
    }
    static programChangeEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, value: number): MidiEventRunnableProgramChange | MidiEventProgramChange {
        const newEvent: Partial<MidiEventProgramChange> = {
            ...event,
            name: 'Program Change',
            channel,
            value,
        }
        return newEvent as any;
    }
    static channelKeyPressureEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number): MidiEventRunnableChannelKeyPressure | MidiEventChannelKeyPressure {
        const newEvent: Partial<MidiEventChannelKeyPressure> = {
            ...event,
            name: 'Channel Key Pressure',
            channel,
        }
        return newEvent as any;
    }
    static pitchBendEvent(event: BaseMidiEvent | RunningMidiEvent, channel: number, value?: number): MidiEventRunnablePitchBend | MidiEventPitchBend {
        const newEvent: Partial<MidiEventPitchBend> = {
            ...event,
            name: 'Pitch Bend',
            channel,
        }
        if (value !== undefined) {
            newEvent.value = value;
        }

        return newEvent as any;
    }
}
