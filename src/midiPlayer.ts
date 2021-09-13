import { Midi, MidiTrackNoteOn, MidiTrackNoteOff, MidiTrackProgramChange, MidiTrackController, MidiTrackSignature, MidiTrackMeta }  from 'midi-converter';

export type MidiListener = (track: MidiTrackNoteOn | MidiTrackNoteOff, trackId: number, delta: number) => void;
export type MidiListenerTypes = 'noteOn' | 'noteOff' | 'end';
export class MidiPlayer {
	private time = 0;
	private frame?: NodeJS.Timeout;
	private now = 0;
	private multiplayer = 1;
	private listeners = new Map<string, ((...args: any[]) => void)[]>();
	private midi?: Midi;
	private trackDeltas = new Map<number, number>();
	constructor(private originalMidi: Midi) {}

    changeMidi(originalMidi: Midi) {
        this.stop();
        this.originalMidi = originalMidi;
    }

	private setUp() {
		this.midi = JSON.parse(JSON.stringify(this.originalMidi)) as Midi;
		this.trackDeltas.clear();
		for (let i = 0; i < this.midi.tracks.length; i++) {
			this.trackDeltas.set(i, 0);
		}
	}

	setSpeed(value: number) {
		this.multiplayer = value;
	}

	play() {
		this.stop();
		this.setUp();
		this.time = 0;
		this.now = Date.now();
		this.draw();
	}
	stop() {
		if (this.frame) {
			clearTimeout(this.frame);
			this.frame = undefined;
		}
	}

    on(value: 'unknown', listener: (data: MidiTrackMeta, trackId: number, time: number) => void): void;
    on(value: 'controller', listener: (data: MidiTrackController, trackId: number, time: number) => void): void;
    on(value: 'controller', listener: (data: MidiTrackController, trackId: number, time: number) => void): void;
    on(value: 'patchBend', listener: (data: MidiTrackProgramChange, trackId: number, time: number) => void): void;
    on(value: 'programChange', listener: (data: MidiTrackProgramChange, trackId: number, time: number) => void): void;
    on(value: 'noteOff', listener: (data: MidiTrackNoteOff, trackId: number, time: number) => void): void;
    on(value: 'noteOn', listener: (data: MidiTrackNoteOn, trackId: number, time: number) => void): void;
    on(value: 'end', listener: () => void): void;
	on(value: string, listener: (...args: any[]) => void) {
        const listeners = this.listeners.get(value) || [];
		this.pushUniq(listeners, listener);
		this.listeners.set(value, listeners);
	}
    
    off(value: 'unknown', listener: (data: MidiTrackMeta, trackId: number, time: number) => void): void;
    off(value: 'timeSignature', listener: (data: MidiTrackSignature, trackId: number, time: number) => void): void;
    off(value: 'controller', listener: (data: MidiTrackController, trackId: number, time: number) => void): void;
    off(value: 'patchBend', listener: (data: MidiTrackProgramChange, trackId: number, time: number) => void): void;
    off(value: 'programChange', listener: (data: MidiTrackProgramChange, trackId: number, time: number) => void): void;
    off(value: 'noteOff', listener: (data: MidiTrackNoteOff, trackId: number, time: number) => void): void;
    off(value: 'noteOn', listener: (data: MidiTrackNoteOn, trackId: number, time: number) => void): void;
    off(value: 'end', listener: () => void): void;
	off(value: string, listener: (...args: any[]) => void) {
		const listeners = this.listeners.get(value) || [];
		this.removeItem(listeners, listener);
		this.listeners.set(value, listeners);
	}
	offAll() {
		this.listeners.clear();
	}

	private draw = () => {
		const now = Date.now();
		const delta = (now - this.now) * this.multiplayer;
		this.now = now;
		const endTime = this.time + (delta * this.multiplayer);
		this.time = endTime;
		const tracks = this.midi!.tracks;

		for (let i = 0; i < tracks.length; i++) {
			const selectedTrack = tracks[i];
			if (!selectedTrack[0]) {
				this.trackDeltas.delete(i);
				continue;
			}
			const trackDelta = this.trackDeltas.get(i)!;
			const actualDelta = trackDelta + delta;
			if (selectedTrack[0].deltaTime <= actualDelta) {
				const track = selectedTrack.shift()!;
				const key = track.subtype as any;
				const listeners = this.listeners.get(key);
				if (listeners) {
					for (let j = 0; j < listeners.length; j++) {
						listeners[j](track as any, i, endTime);
					}
				}
				const calculatedDelta = actualDelta - track.deltaTime;
				this.trackDeltas.set(i, calculatedDelta);
			} else {
				this.trackDeltas.set(i, actualDelta);
			}
		}

		if (this.trackDeltas.size === 0) {
			const listeners = this.listeners.get('end');
			if (listeners) {
				for (let i = 0; i < listeners.length; i++) {
					listeners[i](undefined as any, i, endTime);
				}
			}
			this.stop();
			return;
		}
		this.frame = setTimeout(this.draw);
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
}

