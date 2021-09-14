// const { loadMidi } = require('./../dist/midiLoader');
const { Midi } = require('./../dist/midiLoader');
const path = require('path');

async function start() {
    const file = new Midi();
    const pathString = path.join(__dirname, 'test.mid'); 
    file.loadFile(pathString);
}

// const { MidiPlayer } = require('./../dist/midiPlayer');
// const { MIDI_MAP } = require('./../dist/notes');
// const path = require('path');


// async function start() {
//     const pathString = path.join(__dirname, 'test.mid') 
//     const midiFile = await loadMidi(pathString);
//     const player = new MidiPlayer(midiFile);

//     player.on('noteOn', (track, trackId, time) => {
//         const note = MIDI_MAP[track.noteNumber];
// 		if (note) {
// 			console.log(`+ [${trackId}] Time: ${Math.round(time)} | ${note.noteName}`);
//         }
//     });
//     player.on('noteOff', (track, trackId, time) => {
//         const note = MIDI_MAP[track.noteNumber];
//         if (note) {
// 			console.log(`- [${trackId}] Time: ${Math.round(time)} | ${note.noteName}`);
//         }
//     });
//     player.on('end', () => {
//         console.log('Test passed!');
//         process.exit();
//     });
//     player.play();
// }

start()

// start().catch(err => {
//     console.error(err);
//     process.exit(1);
// })