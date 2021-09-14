import { readFile } from 'fs';
import { HEADER_CHUNK_LENGTH } from './midiConstants';
import { MidiTrack } from './midiTrack';
import { BufferUtils } from './utils';

export enum MidiFormat {
	SingleTrack = 0,
	SimultaneousTracks = 1,
	IndependantlyTracks = 1,
}

export class Midi {
	private _buffer?: Buffer;
	private _tracks: MidiTrack[] = [];
	private _midiChunksByteLength = 0;
	private _division = 0;
	private _format: MidiFormat = MidiFormat.SingleTrack;

	async loadFile(path: string) {
		return new Promise<void>((resolve, reject) => {
			readFile(path, (err, data) => {
				if (err) {
					reject(err);
				} else {
					const decodedData = BufferUtils.bufferToString(data);
					if(!decodedData.startsWith('MThd')) {
						reject(new Error('Invalid midi file!'))
					}
					this._buffer = data;
					this._division = BufferUtils.bufferToNumber(this._buffer.subarray(12, HEADER_CHUNK_LENGTH));
					this._format = this.getFormat();
					this.setupTracks();
					resolve();
				}
			});
		});
	}
	// processFile(binary: string) {
	// 	if (!this.validate()) throw 'Invalid MIDI file; should start with MThd';
	// 	return this.setTempo(this.defaultTempo).getDivision().getFormat().getTracks().dryRun();

	// }
	// private validate(binary: string) {
	// 	return this.bytesToLetters(this.buffer.subarray(0, 4)) === 'MThd';
	// }
	get fileSize() {
		return (this._buffer && this._buffer.length) || 0;
	}

	get fileLoaded() {
		return !!this._buffer;
	}
	
	getFormat(): MidiFormat {
		this.validateLoaded()
	
		const format = BufferUtils.bufferToNumber(this._buffer!.subarray(8, 10));
		switch (format) {
			case 0:
				return MidiFormat.SingleTrack;
			case 1:
				return MidiFormat.SimultaneousTracks;
			case 2:
				return MidiFormat.IndependantlyTracks;
		}
		
		throw new Error('Unknown format');
	}
	setupTracks() {
		this.validateLoaded()

		this._tracks = [];
		let trackOffset = 0;
		while (trackOffset < this._buffer!.length) {
			const section = this._buffer!.subarray(trackOffset, trackOffset + 4)
			const data = BufferUtils.bufferToString(section);
			if (data === 'MTrk') {
				const chunk2 = this._buffer!.subarray(trackOffset + 4, trackOffset + 8);
				let trackLength = BufferUtils.bufferToNumber(chunk2);
				const trackData = this._buffer!.subarray(trackOffset + 8, trackOffset + 8 + trackLength)
				const trackIndex = this._tracks.length;
				const track = new MidiTrack(trackIndex, trackData);
				this._tracks.push(track);
			}

			const chunk3 = this._buffer!.subarray(trackOffset + 4, trackOffset + 8);
			trackOffset += BufferUtils.bufferToNumber(chunk3) + 8;
		}

		// Get sum of all MIDI chunks here while we're at it
		let trackChunksByteLength = 0;

		for (let i = 0; i < this._tracks.length; i++) {
			trackChunksByteLength += 8 + this._tracks[i].buffer.length;
		}
		this._midiChunksByteLength = HEADER_CHUNK_LENGTH + trackChunksByteLength;
		return this;
	}
	get tracks() {
		return this._tracks;
	}
	get buffer() {
		this.validateLoaded();
		return this._buffer;
	}
	get midiChunksByteLength() {
		return this._midiChunksByteLength;
	}
	get division() {
		return this._division;
	}
	get format(): MidiFormat {
		return this._format;
	}

	private validateLoaded() {
		if (!this._buffer) {
			throw new Error('Midi not loaded!');
		}
	}
}
