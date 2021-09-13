/// <reference path="./types.d.ts" />

import { readFile } from 'fs';
import { Midi, midiToJson }  from 'midi-converter';

export async function loadMidi(path: string) {
	return new Promise<Midi>((resolve, reject) => {
		readFile(path, 'binary', (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(midiToJson(data));
			}
		});
	});
}