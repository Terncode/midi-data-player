const { Midi } = require('./../dist/midiLoader');
const { MidiPlayer } = require('./../dist/midiPlayer');
const path = require('path');

(async () => {
    const midi = new Midi();
    const pathString = path.join(__dirname, 'test.mid'); 
    await midi.loadFile(pathString);

    const player = new MidiPlayer(midi);
    player.on('Note on', data => {
        console.log('Note on', data.noteNumber)
    })
    player.on('Note off', data =>{
        console.log('Note off', data.noteNumber)
    })
    player.on('end', data => {
        console.log("End");
    })
    player.play();
})()


