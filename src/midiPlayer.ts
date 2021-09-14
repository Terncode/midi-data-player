import { MidiEvent, MidiEventChannelKeyPressure, MidiEventControllerChange, MidiEventCopyrightNotice, MidiEventCuePoint, 
    MidiEventDeviceName, MidiEventEncoder, MidiEventEndOfTheTrack, MidiEventInstrumentName, MidiEventKeySignature, MidiEventLyric, 
    MidiEventMarker, MidiEventMidiChannelPrefix, MidiEventMidiPort, MidiEventNoteOff, MidiEventNoteOn, MidiEventPitchBend,
    MidiEventPolyphonicKeyPressure, MidiEventProgramChange, MidiEventRunnableNoteOff, MidiEventRunnableNoteOn, 
    MidiEventSequenceNumber, MidiEventSequencerSpecificMetaEvent, MidiEventSequenceTrackName, MidiEventSetTempo,
    MidiEventSMTPEOffset, MidiEventSysex, MidiEventSysexEscape, MidiEventText, MidiEventTimeSignature, MidiEventTypes,
    MidiEventUnknown } from './midiEventHandler';
import { Midi } from './midiLoader';

type EventTypes = MidiEventTypes | 'all' | 'end';
type ListenerFunction = (...any: any[]) => void;
export class MidiPlayer {
	private readonly DEFAULT_TEMPO = 120;

    private sampleRate = 5; // milliseconds
    private setIntervalId?: number;
    private startTick = 0;
	private tick = 0;
    private startTime = 0;
	private tempo = this.DEFAULT_TEMPO;
	private instruments: any = [];
    private eventListeners: Map<string, ListenerFunction[]> = new Map();
	private activeTracks = 0;

    private midi?: Midi;
    constructor(midi?: Midi) {
        if(midi) {
            this.loadMidi(midi);
        }
    }

    on(eventType: 'end',                           fn: (event: MidiEvent) => void): void;
    on(eventType: 'Unknown',                       fn: (event: MidiEventUnknown) => void): void;
    on(eventType: 'Pitch Bend',                    fn: (event: MidiEventPitchBend) => void): void;
    on(eventType: 'Channel Key Pressure',          fn: (event: MidiEventChannelKeyPressure) => void): void;
    on(eventType: 'Program Change',                fn: (event: MidiEventProgramChange) => void): void;
    on(eventType: 'Controller Change',             fn: (event: MidiEventControllerChange) => void): void;
    on(eventType: 'Polyphonic Key Pressure',       fn: (event: MidiEventPolyphonicKeyPressure) => void): void;
    on(eventType: 'Sysex (escape)',                fn: (event: MidiEventSysexEscape) => void): void;
    on(eventType: 'Sysex',                         fn: (event: MidiEventSysex) => void): void;
    on(eventType: 'Sequencer-Specific Meta-event', fn: (event: MidiEventSequencerSpecificMetaEvent) => void): void;
    on(eventType: 'Key Signature',                 fn: (event: MidiEventKeySignature) => void): void;
    on(eventType: 'Time Signature',                fn: (event: MidiEventTimeSignature) => void): void;
    on(eventType: 'SMTPE Offset',                  fn: (event: MidiEventSMTPEOffset) => void): void;
    on(eventType: 'Set Tempo',                     fn: (event: MidiEventSetTempo) => void): void;
    on(eventType: 'End of Track',                  fn: (event: MidiEventEndOfTheTrack) => void): void;
    on(eventType: 'MIDI Port',                     fn: (event: MidiEventMidiPort) => void): void;
    on(eventType: 'MIDI Channel Prefix',           fn: (event: MidiEventMidiChannelPrefix) => void): void;
    on(eventType: 'Device Name',                   fn: (event: MidiEventDeviceName) => void): void;
    on(eventType: 'Cue Point',                     fn: (event: MidiEventCuePoint) => void): void;
    on(eventType: 'Marker',                        fn: (event: MidiEventMarker) => void): void;
    on(eventType: 'Lyric',                         fn: (event: MidiEventLyric) => void): void;
    on(eventType: 'Instrument Name' ,              fn: (event: MidiEventInstrumentName) => void): void;
    on(eventType: 'Sequence/Track Name',           fn: (event: MidiEventSequenceTrackName) => void): void;
    on(eventType: 'Copyright Notice',              fn: (event: MidiEventCopyrightNotice) => void): void;
    on(eventType: 'Text Event',                    fn: (event: MidiEventText) => void): void;
    on(eventType: 'Sequence Number',               fn: (event: MidiEventSequenceNumber) => void): void;
    on(eventType: 'Note off',                      fn: (event: MidiEventNoteOff | MidiEventRunnableNoteOff) => void): void;
    on(eventType: 'Note on',                       fn: (event: MidiEventNoteOn | MidiEventRunnableNoteOn) => void): void;
    on(eventType: 'all',                           fn: (event: MidiEvent) => void): void;
    on(eventType: EventTypes, fn: ListenerFunction) {
        const array = this.eventListeners.get(eventType) || [];
        this.pushUniq(array, fn);
        this.eventListeners.set(eventType, array);
    }

    off(eventType: 'end',                           fn: (event: MidiEvent) => void): void;
    off(eventType: 'Unknown',                       fn: (event: MidiEventUnknown) => void): void;
    off(eventType: 'Pitch Bend',                    fn: (event: MidiEventPitchBend) => void): void;
    off(eventType: 'Channel Key Pressure',          fn: (event: MidiEventChannelKeyPressure) => void): void;
    off(eventType: 'Program Change',                fn: (event: MidiEventProgramChange) => void): void;
    off(eventType: 'Controller Change',             fn: (event: MidiEventControllerChange) => void): void;
    off(eventType: 'Polyphonic Key Pressure',       fn: (event: MidiEventPolyphonicKeyPressure) => void): void;
    off(eventType: 'Sysex (escape)',                fn: (event: MidiEventSysexEscape) => void): void;
    off(eventType: 'Sysex',                         fn: (event: MidiEventSysex) => void): void;
    off(eventType: 'Sequencer-Specific Meta-event', fn: (event: MidiEventSequencerSpecificMetaEvent) => void): void;
    off(eventType: 'Key Signature',                 fn: (event: MidiEventKeySignature) => void): void;
    off(eventType: 'Time Signature',                fn: (event: MidiEventTimeSignature) => void): void;
    off(eventType: 'SMTPE Offset',                  fn: (event: MidiEventSMTPEOffset) => void): void;
    off(eventType: 'Set Tempo',                     fn: (event: MidiEventSetTempo) => void): void;
    off(eventType: 'End of Track',                  fn: (event: MidiEventEndOfTheTrack) => void): void;
    off(eventType: 'MIDI Port',                     fn: (event: MidiEventMidiPort) => void): void;
    off(eventType: 'MIDI Channel Prefix',           fn: (event: MidiEventMidiChannelPrefix) => void): void;
    off(eventType: 'Device Name',                   fn: (event: MidiEventDeviceName) => void): void;
    off(eventType: 'Cue Point',                     fn: (event: MidiEventCuePoint) => void): void;
    off(eventType: 'Marker',                        fn: (event: MidiEventMarker) => void): void;
    off(eventType: 'Lyric',                         fn: (event: MidiEventLyric) => void): void;
    off(eventType: 'Instrument Name' ,              fn: (event: MidiEventInstrumentName) => void): void;
    off(eventType: 'Sequence/Track Name',           fn: (event: MidiEventSequenceTrackName) => void): void;
    off(eventType: 'Copyright Notice',              fn: (event: MidiEventCopyrightNotice) => void): void;
    off(eventType: 'Text Event',                    fn: (event: MidiEventText) => void): void;
    off(eventType: 'Sequence Number',               fn: (event: MidiEventSequenceNumber) => void): void;
    off(eventType: 'Note off',                      fn: (event: MidiEventNoteOff | MidiEventRunnableNoteOff) => void): void;
    off(eventType: 'Note on',                       fn: (event: MidiEventNoteOn | MidiEventRunnableNoteOn) => void): void;
    off(eventType: 'all',                           fn: (event: MidiEvent) => void): void;
    off(eventType: EventTypes, fn: ListenerFunction) {
        const array = this.eventListeners.get(eventType) || [];
        this.removeItem(array, fn);
        if (array.length) {
            this.eventListeners.set(eventType, array);
        } else {
            this.eventListeners.delete(eventType);
        }
    }
    private emit(eventType: EventTypes, event: MidiEvent) {
        const listener = this.eventListeners.get(eventType);
        if (listener) {
            for (let i = 0; i < listener.length; i++) {
                listener[i](event);
            }
        }
        if (eventType !== 'all') {
            this.emit('all', event);
        }
    }
    loadMidi(midi: Midi) {
        this.tempo = this.DEFAULT_TEMPO;

        if (midi.fileLoaded) {
            this.midi = midi;
        } else {
            throw new Error('Midi is not loaded!');
        }
    }
    enableTrack(trackNumber: number) {
        this.validateMidi();
		this.midi!.tracks[trackNumber - 1].enable();
    }

    disableTrack(trackNumber: number) {
        this.validateMidi();
		this.midi!.tracks[trackNumber - 1].disable();
    }
    isTrackEnabled(trackNumber: number) {
        return this.midi!.tracks[trackNumber - 1].enabled;
    }
    get buffer() {
        this.validateMidi();
        return this.midi!.buffer;
    }
    play() {
        if (this.playing) 
            return;
        this.activeTracks = this.midi!.tracks.length;

        // Initialize
        if (!this.startTime) {
            const time = new Date();
            this.startTime = time.getTime();
        }
        this.setIntervalId = setInterval(this.playLoop, this.sampleRate) as any;
    }
    pause() {
        if (this.setIntervalId) {
            clearInterval(this.setIntervalId);
            this.setIntervalId = undefined;
        }
        this.startTick = this.tick;
        this.startTime = 0;
    }

    stop() {
        if(this.setIntervalId) {
            clearInterval(this.setIntervalId);
            this.setIntervalId = undefined;
        }
        this.startTick = 0;
        this.startTime = 0;
        this.resetTracks();
    }
    private playLoop = () => {
        this.tick = this.currentTick;
        for (let i = 0; i < this.midi!.tracks.length; i++) {
            const event = this.midi!.tracks[i].handleEvent(this.tick);
            if (event) {
                if (event.name === 'End of Track') {
                    this.activeTracks--;
                    if (this.activeTracks <= 0) {
                        const endEvent = MidiEventEncoder.getBaseEvent(-1, event.delta, event.tick, -1);
                        endEvent.name = 'end' as any;
                        this.emit('end', endEvent as MidiEvent);
                        this.stop();
                        return;
                    }
                }
                if (this.isSetTempoEvent(event)) { 
                    this.tempo = event.data;
                }
                if (this.isProgramChangeEvent(event)) {
                    if (!this.instruments.includes(event.value)) {
                        this.instruments.push(event.value);
                    }
                }
                this.emit(event.name, event);
            }
        }
    }
    isSetTempoEvent(event: MidiEvent): event is MidiEventSetTempo {
        return event.name === 'Set Tempo';
    }
    isProgramChangeEvent(event: MidiEvent): event is MidiEventProgramChange {
        return event.name === 'Program Change';
    }
    resetTracks() {
        if (this.midi) {
            for (let i = 0; i < this.midi!.tracks.length; i++) {
                this.midi.tracks[i].reset();
            }
        }
    }
    get currentTick() {
        if (!this.startTime) return this.startTick;
        const date = new Date();
        return Math.round((date.getTime() - this.startTime) / 1000 * (this.division! * (this.tempo! / 60))) + this.startTick;
    }

    get playing() {
        return !!this.setIntervalId;
    }
    private validateMidi() {
        if (!this.midi) {
            throw new Error('MIDI not loaded');
        }
    }
    get tracks() {
        return this.midi!.tracks;
    }
    get division() {
        return this.midi!.division;
    }
    private pushUniq<T>(array: T[], item: T) {
        const index = array.indexOf(item);
    
        if (index === -1) {
            array.push(item);
            return array.length;
        } else {
            return index + 1;
        }
    }
    private removeItem<T>(items: T[], item: T): boolean {
        const index = items.indexOf(item);
        if (index !== -1) {
            items.splice(index, 1);
            return true;
        } else {
            return false;
        }
    }
    getTotalTicks() {
        return Math.max.apply(null, this.tracks.map(track => track.delta));
    }

    enableDuplicatePreventerNoteOn() {
        for (let i = 0; i < this.midi!.tracks.length; i++) {
			this.midi!.tracks[i].enableDuplicatePreventerNoteOn();
        }
    }
    disableDuplicatePreventerNoteOn() {
        for (let i = 0; i < this.midi!.tracks.length; i++) {
			this.midi!.tracks[i].disableDuplicatePreventerNoteOn();
        }
    }
}
