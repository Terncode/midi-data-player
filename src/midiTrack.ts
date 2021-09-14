import { NOTES } from './midiConstants';
import { BaseMidiEvent, MidiEvent, MidiEventEncoder, MidiEventNoteOff, MidiEventNoteOn, RunningMidiEvent } from './midiEventHandler';
import { BufferUtils } from './utils';

export class MidiTrack {
    private _enabled = true;
    private _delta = 0;
    private _preventDuplicateNoteOn = true;

    private pointer = 0;
    private lastTick = 0;
    private lastStatus = 0;
    private runningDelta = 0;
    private events: MidiEvent[] = [];
    private duplicateNode = new Set<number>();

    constructor(private index: number, private _buffer: Buffer) {
        const lastThreeBytes = this._buffer.subarray(this._buffer.length - 3, this._buffer.length);
        if (!(lastThreeBytes[0] === 0xff && lastThreeBytes[1] === 0x2f && lastThreeBytes[2] === 0x00)) {
            throw new Error(`Invalid MIDI file; Last three bytes of track ${this.index} must be FF 2F 00 to mark end of track`);
        }
    }

    reset() {
        this._enabled = true;
        this.pointer = 0;
        this.lastTick = 0;
        this.lastStatus = 0;
        this._delta = 0;
        this.runningDelta = 0;
        this.duplicateNode.clear();
    }
    enable() {
        this._enabled = true;
        return this;
    }
    disable() {
        this._enabled = false;
        return this;
    }
    get currentByte() {
        return this._buffer[this.pointer];
    }
    getDeltaByteCount() {
        return BufferUtils.getVarIntLength(this._buffer.subarray(this.pointer));
    }
    getDelta() {
        const chunk = this._buffer.subarray(this.pointer, this.pointer + this.getDeltaByteCount());
        return BufferUtils.readVarInt(chunk);
    }
    getStringData(eventStartIndex: number) {
        const varIntLength = BufferUtils.getVarIntLength(this._buffer.subarray(eventStartIndex + 2));
        const varIntValue = BufferUtils.readVarInt(this._buffer.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));
        return BufferUtils.bufferToHex(this._buffer.subarray(eventStartIndex + 2 + varIntLength, eventStartIndex + 2 + varIntLength + varIntValue));
    }
    parseEvent(): MidiEvent {
        const eventStartIndex = this.pointer + this.getDeltaByteCount();
        const deltaByteCount = this.getDeltaByteCount();
        const track = this.index + 1;
        const delta = this.getDelta();
        this.lastTick = this.lastTick + delta;
        this.runningDelta += delta;
        const tick = this.runningDelta;
        const byteIndex = this.pointer;
        let event: BaseMidiEvent | RunningMidiEvent = MidiEventEncoder.getBaseEvent(track, delta, tick, byteIndex);
        if (this._buffer[eventStartIndex] === 0xff) {

            event = MidiEventEncoder.handle(this._buffer[eventStartIndex + 1], event, eventStartIndex, this);

            const varIntLength = BufferUtils.getVarIntLength(this._buffer.subarray(eventStartIndex + 2));
            const length = BufferUtils.readVarInt(this._buffer.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));

            this.pointer += deltaByteCount + 3 + length;
        } else if (this._buffer[eventStartIndex] === 0xf0) {
            const varQuantityByteLength = BufferUtils.getVarIntLength(this._buffer.subarray(eventStartIndex + 1));
            const varQuantityByteValue = BufferUtils.readVarInt(this._buffer.subarray(eventStartIndex + 1, eventStartIndex + 1 + varQuantityByteLength));

            const data = this._buffer.subarray(
                eventStartIndex + 1 + varQuantityByteLength,
                eventStartIndex + 1 + varQuantityByteLength + varQuantityByteValue
            );
            event = MidiEventEncoder.sysexEvent(event, data);

            this.pointer += deltaByteCount + 1 + varQuantityByteLength + varQuantityByteValue;
        } else if (this._buffer[eventStartIndex] === 0xf7) {
            const varQuantityByteLength = BufferUtils.getVarIntLength(this._buffer.subarray(eventStartIndex + 1));
            const varQuantityByteValue = BufferUtils.readVarInt(this._buffer.subarray(eventStartIndex + 1, eventStartIndex + 1 + varQuantityByteLength));

            const data = this._buffer.subarray(
                eventStartIndex + 1 + varQuantityByteLength,
                eventStartIndex + 1 + varQuantityByteLength + varQuantityByteValue
            );

            event = MidiEventEncoder.sysexEscapeEvent(event, data);

            this.pointer += deltaByteCount + 1 + varQuantityByteLength + varQuantityByteValue;
        } else {
            // Voice event
            if (this._buffer[eventStartIndex] < 0x80) {
                // Running status
                const running = true;
                const noteNumber = this._buffer[eventStartIndex];
                const noteName = NOTES[this._buffer[eventStartIndex]];
                const velocity = this._buffer[eventStartIndex + 1];
                event = MidiEventEncoder.convertToRunnable(event, running, noteNumber, noteName, velocity);

                if (this.lastStatus <= 0x8f) {
                    event = MidiEventEncoder.noteOffEvent(event, this.lastStatus - 0x80 + 1);
                    this.pointer += deltaByteCount + 2;

                } else if (this.lastStatus <= 0x9f) {
                    event = MidiEventEncoder.noteOnEvent(event, this.lastStatus - 0x90 + 1);
                    this.pointer += deltaByteCount + 2;

                } else if (this.lastStatus <= 0xaf) {
                    // Polyphonic Key Pressure
                    const channel = this.lastStatus - 0xa0 + 1;
                    const note = NOTES[this._buffer[eventStartIndex + 1]];
                    event = MidiEventEncoder.polyphonicKeyPressureEvent(event, channel, note, /*event[1]*/);
                    this.pointer += deltaByteCount + 2;

                } else if (this.lastStatus <= 0xbf) {
                    // Controller Change
                    const channel = this.lastStatus - 0xb0 + 1;
                    const number = this._buffer[eventStartIndex + 1];
                    const value = this._buffer[eventStartIndex + 2];
                    event = MidiEventEncoder.controllerChangeEvent(event, channel, number, value);
                    this.pointer += deltaByteCount + 2;

                } else if (this.lastStatus <= 0xcf) {
                    // Program Change
                    const channel = this.lastStatus - 0xc0 + 1;
                    const value = this._buffer[eventStartIndex + 1];
                    event = MidiEventEncoder.programChangeEvent(event, channel, value);
                    this.pointer += deltaByteCount + 1;

                } else if (this.lastStatus <= 0xdf) {
                    // Channel Key Pressure
                    const channel = this.lastStatus - 0xd0 + 1;
                    event = MidiEventEncoder.channelKeyPressureEvent(event, channel);
                    this.pointer += deltaByteCount + 1;

                } else if (this.lastStatus <= 0xef) {
                    // Pitch Bend
                    const channel = this.lastStatus - 0xe0 + 1;
                    const value = this._buffer[eventStartIndex + 2];
                    event = MidiEventEncoder.pitchBendEvent(event, channel, value);
                    this.pointer += deltaByteCount + 2;

                } else {
                    throw `Unknown event (running): ${this.lastStatus}`;
                }

            } else {
                this.lastStatus = this._buffer[eventStartIndex];

                if (this._buffer[eventStartIndex] <= 0x8f) {
                    const channel = this.lastStatus - 0x80 + 1;
                    const noteNumber = this._buffer[eventStartIndex + 1];
                    const noteName = NOTES[this._buffer[eventStartIndex + 1]];
                    const velocity = Math.round(this._buffer[eventStartIndex + 2] / 127 * 100);
                    event = MidiEventEncoder.noteOffEvent(event, channel, noteNumber, velocity, noteName);
                    this.pointer += deltaByteCount + 3;

                } else if (this._buffer[eventStartIndex] <= 0x9f) {
                    // Note on
                    const channel = this.lastStatus - 0x90 + 1;
                    const noteNumber = this._buffer[eventStartIndex + 1];
                    const noteName = NOTES[this._buffer[eventStartIndex + 1]];
                    const velocity = Math.round(this._buffer[eventStartIndex + 2] / 127 * 100);
                    event = MidiEventEncoder.noteOnEvent(event, channel, noteNumber, velocity, noteName);
                    this.pointer += deltaByteCount + 3;

                } else if (this._buffer[eventStartIndex] <= 0xaf) {
                    // Polyphonic Key Pressure
                    const channel = this.lastStatus - 0xa0 + 1;
                    const note = NOTES[this._buffer[eventStartIndex + 1]];
                    event = MidiEventEncoder.polyphonicKeyPressureEvent(event, channel, note, /*event[2]*/);
                    this.pointer += deltaByteCount + 3;

                } else if (this._buffer[eventStartIndex] <= 0xbf) {
                    // Controller Change
                    const channel = this.lastStatus - 0xb0 + 1;
                    const number = this._buffer[eventStartIndex + 1];
                    const value = this._buffer[eventStartIndex + 2];
                    event = MidiEventEncoder.controllerChangeEvent(event, channel, number, value);
                    this.pointer += deltaByteCount + 3;

                } else if (this._buffer[eventStartIndex] <= 0xcf) {
                    // Program Change
                    const channel = this.lastStatus - 0xc0 + 1;
                    const value = this._buffer[eventStartIndex + 1];
                    event = MidiEventEncoder.programChangeEvent(event, channel, value);
                    this.pointer += deltaByteCount + 2;

                } else if (this._buffer[eventStartIndex] <= 0xdf) {
                    // Channel Key Pressure
                    const channel = this.lastStatus - 0xd0 + 1;
                    event = MidiEventEncoder.channelKeyPressureEvent(event, channel);
                    this.pointer += deltaByteCount + 2;

                } else if (this._buffer[eventStartIndex] <= 0xef) {
                    // Pitch Bend
                    const channel = this.lastStatus - 0xe0 + 1;
                    event = MidiEventEncoder.pitchBendEvent(event, channel);
                    this.pointer += deltaByteCount + 3;

                } else {
                    throw new Error(`Unknown event: ${this._buffer[eventStartIndex]}`);
                }
            }
        }

        this._delta += event.delta;
        this.events.push(event as MidiEvent);

        if (this._preventDuplicateNoteOn) {
            if(event.name === 'Note on') {
                const noteNumber = (event as MidiEventNoteOn).noteNumber;
                const velocity = (event as MidiEventNoteOn).velocity;
                const alreadyActivated = this.duplicateNode.has(noteNumber);
                if (alreadyActivated && velocity === 0) {
                    event.name = 'Note off';
                    this.duplicateNode.delete(noteNumber);
                } else {
                    this.duplicateNode.add(noteNumber);
                }
            } else if (event.name === 'Note off') {
                const noteNumber = (event as MidiEventNoteOff).noteNumber;
                this.duplicateNode.delete(noteNumber);
            } if(event.name === 'End of Track') {
                this.duplicateNode.clear();
            }
        }

        return event as MidiEvent;
    }

    handleEvent(currentTick: number) {
        const elapsedTicks = currentTick - this.lastTick;
        const delta = this.getDelta();
        const eventReady = elapsedTicks >= delta;

        if (this.pointer < this.buffer.length && (eventReady)) {
            const event = this.parseEvent();
            if (this.enabled) return event;
            // Recursively call this function for each event ahead that has 0 delta time?
        }
        return null;
    }
    get buffer() {
        return this._buffer;
    }

    endOfTrack() {
        if (this._buffer[this.pointer + 1] === 0xff && this._buffer[this.pointer + 2] === 0x2f && this._buffer[this.pointer + 3] == 0x00) {
            return true;
        }
        return false;
    }
    get enabled() {
        return this._enabled;
    }
    get delta() {
        return this._delta;
    }
    enableDuplicatePreventerNoteOn() {
        this._preventDuplicateNoteOn = true;
    }
    disableDuplicatePreventerNoteOn() {
        this._preventDuplicateNoteOn = false;
    }
}