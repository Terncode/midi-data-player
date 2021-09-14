export const VERSION = '1.0.0';
export const NOTES: string[] = [];
export const HEADER_CHUNK_LENGTH = 14;
export const CIRCLE_OF_FOURTHS = ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb', 'Bbb', 'Ebb', 'Abb'];
export const CIRCLE_OF_FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'E#'];

function init() {
    const allNotes = [['C'], ['C#','Db'], ['D'], ['D#','Eb'], ['E'],['F'], ['F#','Gb'], ['G'], ['G#','Ab'], ['A'], ['A#','Bb'], ['B']];
    let counter = 0;
    
    // All available octaves.
    for (let i = -1; i <= 9; i++) {
        for (let j = 0; j < allNotes.length; j++) {
            for (let k = 0; k < allNotes[j].length; k++) {
                NOTES[counter] = allNotes[j][k] + i
            }
        }
    }
}
init();

